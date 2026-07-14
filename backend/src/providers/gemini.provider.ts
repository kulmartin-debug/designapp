import type { JobModule } from '@prisma/client';
import { estimateCostUsd } from '../config/providerPricing.js';
import { getApiKey } from '../services/credentials.service.js';
import { ProviderCallError } from '../types/errors.js';
import type {
  AiProviderAdapter,
  ConnectionTestResult,
  EnhanceCurrentStateInput,
  ProviderImageResult,
  SketchRenderInput,
} from './provider.interface.js';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
// Image-capable Gemini model. Verify current model name in the Gemini docs
// before going live - names change as new versions ship.
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

interface GeminiGenerateContentResponse {
  candidates?: {
    content?: {
      parts?: { inlineData?: { data: string; mimeType: string }; text?: string }[];
    };
  }[];
}

class GeminiProvider implements AiProviderAdapter {
  readonly name = 'GEMINI' as const;
  // Gemini's image API does not support ControlNet-style dual depth+canny
  // conditioning as of writing, so Module C (sketch -> render) is not
  // available on this provider for MVP - Replicate/fal handle that instead.
  readonly supportsSketchRender = false;

  async enhanceCurrentState(input: EnhanceCurrentStateInput): Promise<ProviderImageResult> {
    const apiKey = await getApiKey('GEMINI');
    const url = `${GEMINI_API_BASE}/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: input.prompt },
                { inlineData: { mimeType: input.mimeType, data: input.imageBuffer.toString('base64') } },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderCallError('ERR_TIMEOUT', 'Gemini request timed out', err);
      }
      throw new ProviderCallError('ERR_PROVIDER_ERROR', 'Gemini request failed', err);
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 429) throw new ProviderCallError('ERR_RATE_LIMITED', 'Gemini rate limit exceeded');
    if (res.status === 400) throw new ProviderCallError('ERR_INVALID_INPUT', `Gemini rejected input: ${await res.text()}`);
    if (!res.ok) throw new ProviderCallError('ERR_PROVIDER_ERROR', `Gemini API error ${res.status}: ${await res.text()}`);

    const body = (await res.json()) as GeminiGenerateContentResponse;
    const imagePart = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      throw new ProviderCallError('ERR_PROVIDER_ERROR', 'Gemini response did not contain an image');
    }

    return {
      images: [Buffer.from(imagePart.inlineData.data, 'base64')],
      providerModel: GEMINI_IMAGE_MODEL,
    };
  }

  async generateSketchRender(_input: SketchRenderInput): Promise<ProviderImageResult> {
    throw new ProviderCallError('ERR_UNSUPPORTED_PROVIDER_FOR_MODULE', 'Gemini does not support sketch-to-render (Module C)');
  }

  async preprocessDepthMap(): Promise<Buffer> {
    throw new ProviderCallError('ERR_UNSUPPORTED_PROVIDER_FOR_MODULE', 'Gemini does not support depth preprocessing');
  }

  async preprocessCannyEdges(): Promise<Buffer> {
    throw new ProviderCallError('ERR_UNSUPPORTED_PROVIDER_FOR_MODULE', 'Gemini does not support canny preprocessing');
  }

  estimateCost(module: JobModule, numVariants: number): number {
    return estimateCostUsd('GEMINI', module, numVariants);
  }

  // GET /v1beta/models is free and requires a valid key - a reliable,
  // zero-cost way to verify the key works before ever generating anything.
  async testConnection(): Promise<ConnectionTestResult> {
    const apiKey = await getApiKey('GEMINI');
    if (!apiKey) return { ok: false, message: 'Chýba API kľúč.' };
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(`${GEMINI_API_BASE}/models?key=${apiKey}`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return { ok: true, message: 'Pripojenie funguje.' };
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        return { ok: false, message: 'Neplatný API kľúč.' };
      }
      return { ok: false, message: `Gemini vrátil chybu ${res.status}.` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Pripojenie zlyhalo.' };
    }
  }
}

export const geminiProvider = new GeminiProvider();
