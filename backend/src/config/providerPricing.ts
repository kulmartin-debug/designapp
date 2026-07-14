import type { JobModule, ProviderName } from '@prisma/client';

/**
 * Static, developer-maintained price table (USD per generated variant).
 * Not fetched live from providers - actual billing may drift over time.
 * Update these when provider pricing pages change; GenerationJob.actualCostUsd
 * (when a provider reports it) is preferred over the estimate when present.
 */
export const PROVIDER_PRICING_USD_PER_VARIANT: Record<ProviderName, Record<JobModule, number>> = {
  REPLICATE: { CURRENT_STATE_ENHANCE: 0.02, SKETCH_RENDER: 0.05 },
  FAL: { CURRENT_STATE_ENHANCE: 0.015, SKETCH_RENDER: 0.04 },
  GEMINI: { CURRENT_STATE_ENHANCE: 0.01, SKETCH_RENDER: 0 }, // SKETCH_RENDER unsupported, see supportsSketchRender
  MOCK: { CURRENT_STATE_ENHANCE: 0, SKETCH_RENDER: 0 },
};

export function estimateCostUsd(provider: ProviderName, module: JobModule, numVariants: number): number {
  return PROVIDER_PRICING_USD_PER_VARIANT[provider][module] * numVariants;
}
