import type { JobModule, ProviderName } from '@prisma/client';

export interface EnhanceCurrentStateInput {
  imageBuffer: Buffer;
  mimeType: string;
  prompt: string;
  negativePrompt?: string;
  strength?: number;
}

export interface SketchRenderInput {
  sketchImageBuffer: Buffer;
  mimeType: string;
  styleDescription: string;
  prompt: string;
  negativePrompt?: string;
  numVariants: number;
  depthMapBuffer: Buffer;
  cannyEdgeBuffer: Buffer;
}

export interface ProviderImageResult {
  images: Buffer[];
  providerModel: string;
  actualCostUsd?: number;
  rawMeta?: Record<string, unknown>;
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

// Common interface every AI provider adapter implements (replicate, fal, gemini, mock).
// Keeping this the sole integration surface is what lets a provider be swapped
// or added without touching job.service.ts or the routes/controllers.
export interface AiProviderAdapter {
  readonly name: ProviderName;
  readonly supportsSketchRender: boolean;

  enhanceCurrentState(input: EnhanceCurrentStateInput): Promise<ProviderImageResult>;
  generateSketchRender(input: SketchRenderInput): Promise<ProviderImageResult>;

  preprocessDepthMap(imageBuffer: Buffer): Promise<Buffer>;
  preprocessCannyEdges(imageBuffer: Buffer): Promise<Buffer>;

  estimateCost(module: JobModule, numVariants: number): number;

  // Cheap/free validity check for the currently configured API key, used by
  // the Settings page's "Otestovať pripojenie" button and by the auto-check
  // that runs right after saving a new key.
  testConnection(): Promise<ConnectionTestResult>;
}
