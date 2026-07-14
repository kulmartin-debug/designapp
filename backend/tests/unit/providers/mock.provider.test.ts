import { describe, expect, it } from 'vitest';
import { mockProvider } from '../../../src/providers/mock.provider.js';

const DUMMY_IMAGE = Buffer.from('fake-image-bytes');

describe('mockProvider', () => {
  it('enhanceCurrentState returns exactly one image at zero cost, no network calls', async () => {
    const result = await mockProvider.enhanceCurrentState({
      imageBuffer: DUMMY_IMAGE,
      mimeType: 'image/png',
      prompt: 'unify lighting',
    });
    expect(result.images).toHaveLength(1);
    expect(result.providerModel).toBe('mock-v1');
    expect(result.actualCostUsd).toBe(0);
  });

  it('generateSketchRender returns exactly numVariants images', async () => {
    const result = await mockProvider.generateSketchRender({
      sketchImageBuffer: DUMMY_IMAGE,
      mimeType: 'image/png',
      styleDescription: 'scandinavian',
      prompt: 'render sketch',
      numVariants: 3,
      depthMapBuffer: DUMMY_IMAGE,
      cannyEdgeBuffer: DUMMY_IMAGE,
    });
    expect(result.images).toHaveLength(3);
  });

  it('preprocessDepthMap and preprocessCannyEdges return non-empty PNG buffers', async () => {
    const depth = await mockProvider.preprocessDepthMap(DUMMY_IMAGE);
    const canny = await mockProvider.preprocessCannyEdges(DUMMY_IMAGE);
    expect(depth.byteLength).toBeGreaterThan(0);
    expect(canny.byteLength).toBeGreaterThan(0);
  });

  it('estimateCost is always 0 for MOCK regardless of variant count', () => {
    expect(mockProvider.estimateCost('CURRENT_STATE_ENHANCE', 1)).toBe(0);
    expect(mockProvider.estimateCost('SKETCH_RENDER', 4)).toBe(0);
  });
});
