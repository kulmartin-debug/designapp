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

const FAL_RUN_BASE = 'https://fal.run';

/**
 * Model endpoint IDs are placeholders - replace with real fal.ai model slugs
 * from https://fal.ai/models before going live (see README).
 */
const MODEL_ENDPOINTS = {
  imageToImage: 'fal-ai/image-to-image/placeholder',
  controlnetDepthCanny: 'fal-ai/controlnet-sdxl/placeholder',
  depthPreprocessor: 'fal-ai/imageutils/depth/placeholder',
  cannyPreprocessor: 'fal-ai/imageutils/canny/placeholder',
} as const;

function bufferToDataUri(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function callFal(apiKey: string, endpoint: string, input: Record<string, unknown>, timeoutMs = 60_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${FAL_RUN_BASE}/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ProviderCallError('ERR_TIMEOUT', 'fal.ai request timed out', err);
    }
    throw new ProviderCallError('ERR_PROVIDER_ERROR', 'fal.ai request failed', err);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 429) throw new ProviderCallError('ERR_RATE_LIMITED', 'fal.ai rate limit exceeded');
  if (res.status === 422 || res.status === 400) {
    throw new ProviderCallError('ERR_INVALID_INPUT', `fal.ai rejected input: ${await res.text()}`);
  }
  if (!res.ok) {
    throw new ProviderCallError('ERR_PROVIDER_ERROR', `fal.ai API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<{ images: { url: string }[] }>;
}

async function downloadImages(images: { url: string }[]): Promise<Buffer[]> {
  if (images.length === 0) throw new ProviderCallError('ERR_PROVIDER_ERROR', 'fal.ai returned no images');
  return Promise.all(
    images.map(async ({ url }) => {
      const res = await fetch(url);
      return Buffer.from(await res.arrayBuffer());
    }),
  );
}

class FalProvider implements AiProviderAdapter {
  readonly name = 'FAL' as const;
  readonly supportsSketchRender = true;

  async enhanceCurrentState(input: EnhanceCurrentStateInput): Promise<ProviderImageResult> {
    const apiKey = await getApiKey('FAL');
    const result = await callFal(apiKey, MODEL_ENDPOINTS.imageToImage, {
      image_url: bufferToDataUri(input.imageBuffer, input.mimeType),
      prompt: input.prompt,
      negative_prompt: input.negativePrompt,
      strength: input.strength ?? 0.25,
    });
    return { images: await downloadImages(result.images), providerModel: MODEL_ENDPOINTS.imageToImage };
  }

  async generateSketchRender(input: SketchRenderInput): Promise<ProviderImageResult> {
    const apiKey = await getApiKey('FAL');
    const result = await callFal(apiKey, MODEL_ENDPOINTS.controlnetDepthCanny, {
      prompt: input.prompt,
      negative_prompt: input.negativePrompt,
      depth_image_url: bufferToDataUri(input.depthMapBuffer, 'image/png'),
      canny_image_url: bufferToDataUri(input.cannyEdgeBuffer, 'image/png'),
      controlnet_conditioning_scale: SKETCH_RENDER_CONTROLNET_CONDITIONING_SCALE,
      num_images: input.numVariants,
    });
    return { images: await downloadImages(result.images), providerModel: MODEL_ENDPOINTS.controlnetDepthCanny };
  }

  async preprocessDepthMap(imageBuffer: Buffer): Promise<Buffer> {
    const apiKey = await getApiKey('FAL');
    const result = await callFal(apiKey, MODEL_ENDPOINTS.depthPreprocessor, {
      image_url: bufferToDataUri(imageBuffer, 'image/png'),
    });
    const [image] = await downloadImages(result.images);
    return image;
  }

  async preprocessCannyEdges(imageBuffer: Buffer): Promise<Buffer> {
    const apiKey = await getApiKey('FAL');
    const result = await callFal(apiKey, MODEL_ENDPOINTS.cannyPreprocessor, {
      image_url: bufferToDataUri(imageBuffer, 'image/png'),
    });
    const [image] = await downloadImages(result.images);
    return image;
  }

  estimateCost(module: JobModule, numVariants: number): number {
    return estimateCostUsd('FAL', module, numVariants);
  }

  // fal.ai does not expose a documented free "whoami"/account endpoint to
  // verify a key without running a (paid) model, so this only checks the
  // key's expected shape ("key_id:key_secret"). Real validity is confirmed
  // the first time a generation actually runs.
  async testConnection(): Promise<ConnectionTestResult> {
    const apiKey = await getApiKey('FAL');
    if (!apiKey) return { ok: false, message: 'Chýba API kľúč.' };
    const looksValid = /^[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/.test(apiKey);
    return looksValid
      ? { ok: true, message: 'Formát kľúča je v poriadku (fal.ai nemá voľné API na overenie platnosti - potvrdí sa pri generovaní).' }
      : { ok: false, message: 'Kľúč nemá očakávaný formát "key_id:key_secret".' };
  }
}

export const falProvider = new FalProvider();
