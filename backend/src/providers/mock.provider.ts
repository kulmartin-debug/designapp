import sharp from 'sharp';
import type { JobModule } from '@prisma/client';
import { estimateCostUsd } from '../config/providerPricing.js';
import type {
  AiProviderAdapter,
  ConnectionTestResult,
  EnhanceCurrentStateInput,
  ProviderImageResult,
  SketchRenderInput,
} from './provider.interface.js';

const WIDTH = 800;
const HEIGHT = 600;

async function placeholderImage(label: string, bg: string, fg: string): Promise<Buffer> {
  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bg}" />
      <text x="50%" y="50%" font-size="36" font-family="sans-serif" fill="${fg}"
            text-anchor="middle" dominant-baseline="middle">${label}</text>
    </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// Zero-network placeholder provider. Used automatically whenever a real
// provider's API key is missing (see providerRegistry.ts), so the whole app
// - including seed/demo data - works with no API keys configured.
class MockProvider implements AiProviderAdapter {
  readonly name = 'MOCK' as const;
  readonly supportsSketchRender = true;

  async enhanceCurrentState(_input: EnhanceCurrentStateInput): Promise<ProviderImageResult> {
    const image = await placeholderImage('MOCK: vylepšený súčasný stav', '#d4d4d4', '#171717');
    return { images: [image], providerModel: 'mock-v1', actualCostUsd: 0 };
  }

  async generateSketchRender(input: SketchRenderInput): Promise<ProviderImageResult> {
    const images = await Promise.all(
      Array.from({ length: input.numVariants }, (_, i) =>
        placeholderImage(`MOCK: návrh variant ${i + 1}`, '#e5e5e5', '#171717'),
      ),
    );
    return { images, providerModel: 'mock-v1', actualCostUsd: 0 };
  }

  async preprocessDepthMap(_imageBuffer: Buffer): Promise<Buffer> {
    return placeholderImage('MOCK depth map', '#404040', '#f5f5f5');
  }

  async preprocessCannyEdges(_imageBuffer: Buffer): Promise<Buffer> {
    return placeholderImage('MOCK canny edges', '#000000', '#ffffff');
  }

  estimateCost(module: JobModule, numVariants: number): number {
    return estimateCostUsd('MOCK', module, numVariants);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return { ok: true, message: 'Mock provider je vždy dostupný.' };
  }
}

export const mockProvider = new MockProvider();
