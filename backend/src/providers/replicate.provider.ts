import type { JobModule } from '@prisma/client';
import { estimateCostUsd } from '../config/providerPricing.js';
import { SKETCH_RENDER_CONTROLNET_CONDITIONING_SCALE } from '../config/prompts/sketchRender.prompt.js';
import { getApiKey } from '../services/credentials.service.js';
import { ProviderCallError } from '../types/errors.js';
import type {
  AiProviderAdapter,
  ConnectionTestResult,
  EnhanceCurrentStateInput,
  ProviderImageResult,
  SketchRenderInput,
} from './provider.interface.js';

const REPLICATE_API_BASE = 'https://api.replicate.com/v1';

/**
 * Model versions are NOT pinned yet - these are placeholders. Before going
 * live, replace with real `owner/model:version` hashes from
 * https://replicate.com/explore (see README "Pridanie/aktualizácia providera").
 */
const MODEL_VERSIONS = {
  imageToImage: 'stability-ai/sdxl:placeholder-version-id',
  controlnetDepthCanny: 'lucataco/sdxl-controlnet:placeholder-version-id',
  depthPreprocessor: 'cjwbw/midas:placeholder-version-id',
  cannyPreprocessor: 'rossjillian/controlnet:placeholder-version-id',
} as const;

function bufferToDataUri(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 60_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ProviderCallError('ERR_TIMEOUT', 'Replicate request timed out', err);
    }
    throw new ProviderCallError('ERR_PROVIDER_ERROR', 'Replicate request failed', err);
  } finally {
    clearTimeout(timer);
  }
}

async function createPrediction(apiKey: string, version: string, input: Record<string, unknown>) {
  const res = await fetchWithTimeout(`${REPLICATE_API_BASE}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({ version, input }),
  });

  if (res.status === 429) {
    throw new ProviderCallError('ERR_RATE_LIMITED', 'Replicate rate limit exceeded');
  }
  if (res.status === 422 || res.status === 400) {
    throw new ProviderCallError('ERR_INVALID_INPUT', `Replicate rejected input: ${await res.text()}`);
  }
  if (!res.ok) {
    throw new ProviderCallError('ERR_PROVIDER_ERROR', `Replicate API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<{ status: string; output?: string[] | string; error?: string; urls: { get: string } }>;
}

async function pollPrediction(apiKey: string, getUrl: string): Promise<{ output?: string[] | string; error?: string }> {
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i += 1) {
    const res = await fetchWithTimeout(getUrl, {
      headers: { Authorization: `Token ${apiKey}` },
    });
    const body = (await res.json()) as { status: string; output?: string[] | string; error?: string };
    if (body.status === 'succeeded') return body;
    if (body.status === 'failed' || body.status === 'canceled') {
      throw new ProviderCallError('ERR_PROVIDER_ERROR', body.error ?? 'Replicate prediction failed');
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new ProviderCallError('ERR_TIMEOUT', 'Replicate prediction did not finish in time');
}

async function downloadOutputImages(output: string[] | string | undefined): Promise<Buffer[]> {
  const urls = Array.isArray(output) ? output : output ? [output] : [];
  if (urls.length === 0) throw new ProviderCallError('ERR_PROVIDER_ERROR', 'Replicate returned no output images');
  return Promise.all(
    urls.map(async (url) => {
      const res = await fetchWithTimeout(url, {});
      return Buffer.from(await res.arrayBuffer());
    }),
  );
}

class ReplicateProvider implements AiProviderAdapter {
  readonly name = 'REPLICATE' as const;
  readonly supportsSketchRender = true;

  async enhanceCurrentState(input: EnhanceCurrentStateInput): Promise<ProviderImageResult> {
    const apiKey = await getApiKey('REPLICATE');
    const prediction = await createPrediction(apiKey, MODEL_VERSIONS.imageToImage, {
      image: bufferToDataUri(input.imageBuffer, input.mimeType),
      prompt: input.prompt,
      negative_prompt: input.negativePrompt,
      prompt_strength: input.strength ?? 0.25,
    });
    const result = prediction.status === 'succeeded' ? prediction : await pollPrediction(apiKey, prediction.urls.get);
    const images = await downloadOutputImages(result.output);
    return { images, providerModel: MODEL_VERSIONS.imageToImage };
  }

  async generateSketchRender(input: SketchRenderInput): Promise<ProviderImageResult> {
    const apiKey = await getApiKey('REPLICATE');
    const prediction = await createPrediction(apiKey, MODEL_VERSIONS.controlnetDepthCanny, {
      prompt: input.prompt,
      negative_prompt: input.negativePrompt,
      depth_image: bufferToDataUri(input.depthMapBuffer, 'image/png'),
      canny_image: bufferToDataUri(input.cannyEdgeBuffer, 'image/png'),
      controlnet_conditioning_scale: SKETCH_RENDER_CONTROLNET_CONDITIONING_SCALE,
      num_outputs: input.numVariants,
    });
    const result = prediction.status === 'succeeded' ? prediction : await pollPrediction(apiKey, prediction.urls.get);
    const images = await downloadOutputImages(result.output);
    return { images, providerModel: MODEL_VERSIONS.controlnetDepthCanny };
  }

  async preprocessDepthMap(imageBuffer: Buffer): Promise<Buffer> {
    const apiKey = await getApiKey('REPLICATE');
    const prediction = await createPrediction(apiKey, MODEL_VERSIONS.depthPreprocessor, {
      image: bufferToDataUri(imageBuffer, 'image/png'),
    });
    const result = prediction.status === 'succeeded' ? prediction : await pollPrediction(apiKey, prediction.urls.get);
    const [image] = await downloadOutputImages(result.output);
    return image;
  }

  async preprocessCannyEdges(imageBuffer: Buffer): Promise<Buffer> {
    const apiKey = await getApiKey('REPLICATE');
    const prediction = await createPrediction(apiKey, MODEL_VERSIONS.cannyPreprocessor, {
      image: bufferToDataUri(imageBuffer, 'image/png'),
    });
    const result = prediction.status === 'succeeded' ? prediction : await pollPrediction(apiKey, prediction.urls.get);
    const [image] = await downloadOutputImages(result.output);
    return image;
  }

  estimateCost(module: JobModule, numVariants: number): number {
    return estimateCostUsd('REPLICATE', module, numVariants);
  }

  // GET /v1/account is free and just echoes back the account tied to the
  // token - a reliable, zero-cost way to verify the key actually works.
  async testConnection(): Promise<ConnectionTestResult> {
    const apiKey = await getApiKey('REPLICATE');
    if (!apiKey) return { ok: false, message: 'Chýba API kľúč.' };
    try {
      const res = await fetchWithTimeout(`${REPLICATE_API_BASE}/account`, {
        headers: { Authorization: `Token ${apiKey}` },
      });
      if (res.ok) return { ok: true, message: 'Pripojenie funguje.' };
      if (res.status === 401) return { ok: false, message: 'Neplatný API kľúč.' };
      return { ok: false, message: `Replicate vrátil chybu ${res.status}.` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Pripojenie zlyhalo.' };
    }
  }
}

export const replicateProvider = new ReplicateProvider();
