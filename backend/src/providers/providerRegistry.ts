import type { ProviderName } from '@prisma/client';
import { env } from '../config/env.js';
import { hasApiKey } from '../services/credentials.service.js';
import type { AiProviderAdapter } from './provider.interface.js';
import { mockProvider } from './mock.provider.js';
import { replicateProvider } from './replicate.provider.js';
import { falProvider } from './fal.provider.js';
import { geminiProvider } from './gemini.provider.js';

const ADAPTERS: Record<ProviderName, AiProviderAdapter> = {
  REPLICATE: replicateProvider,
  FAL: falProvider,
  GEMINI: geminiProvider,
  MOCK: mockProvider,
};

// Any provider whose API key is missing (checked live against the DB-backed
// credential store, see credentials.service.ts) automatically falls back to
// MOCK, so the app - including seed/demo data - works with zero API keys.
export async function getProviderAdapter(requested: ProviderName): Promise<AiProviderAdapter> {
  if (!(await hasApiKey(requested))) return mockProvider;
  return ADAPTERS[requested];
}

export function getAdapterByName(name: ProviderName): AiProviderAdapter {
  return ADAPTERS[name];
}

export function getDefaultProvider(): ProviderName {
  return env.DEFAULT_PROVIDER;
}
