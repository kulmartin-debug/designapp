import { describe, expect, it } from 'vitest';
import { geminiProvider } from '../../../src/providers/gemini.provider.js';
import { ProviderCallError } from '../../../src/types/errors.js';

describe('geminiProvider', () => {
  it('does not support sketch-render (Module C) - no ControlNet-style conditioning', () => {
    expect(geminiProvider.supportsSketchRender).toBe(false);
  });

  it('generateSketchRender rejects with ERR_UNSUPPORTED_PROVIDER_FOR_MODULE without making a network call', async () => {
    await expect(
      geminiProvider.generateSketchRender({
        sketchImageBuffer: Buffer.from(''),
        mimeType: 'image/png',
        styleDescription: 'modern',
        prompt: 'render',
        numVariants: 1,
        depthMapBuffer: Buffer.from(''),
        cannyEdgeBuffer: Buffer.from(''),
      }),
    ).rejects.toSatisfy((err: unknown) => err instanceof ProviderCallError && err.code === 'ERR_UNSUPPORTED_PROVIDER_FOR_MODULE');
  });

  it('preprocessDepthMap and preprocessCannyEdges are also unsupported', async () => {
    await expect(geminiProvider.preprocessDepthMap()).rejects.toThrow();
    await expect(geminiProvider.preprocessCannyEdges()).rejects.toThrow();
  });
});
