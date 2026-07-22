import type { ProviderCheckStatus, ProviderName } from '@prisma/client';
import { prisma } from '../prisma.js';
import { env } from '../config/env.js';
import { decrypt, encrypt } from './encryption.js';

// Bootstrap fallback so local dev keeps working via .env with zero DB setup.
// Once a key is saved through the Settings page, the DB row takes precedence.
const ENV_FALLBACK: Record<ProviderName, string> = {
  REPLICATE: env.REPLICATE_API_TOKEN,
  FAL: env.FAL_API_KEY,
  GEMINI: env.GEMINI_API_KEY,
  MOCK: '',
};

// In-memory cache so every provider call doesn't hit the DB. Invalidated on save.
let cache: Map<ProviderName, string> | null = null;

async function loadCache(): Promise<Map<ProviderName, string>> {
  if (cache) return cache;
  const rows = await prisma.providerCredential.findMany();
  cache = new Map();
  for (const row of rows) {
    if (!row.apiKey) continue;
    try {
      cache.set(row.provider, decrypt(row.apiKey));
    } catch {
      // CREDENTIALS_ENCRYPTION_KEY changed (e.g. wasn't set explicitly and a
      // fresh random one was generated this boot) - the stored value can no
      // longer be decrypted. Degrade to "no key" (-> MOCK fallback) instead
      // of crashing; the user re-enters it via /nastavenia.
      console.warn(`Nepodarilo sa dešifrovať uložený API kľúč pre ${row.provider} - bude potrebné zadať znova.`);
    }
  }
  return cache;
}

export async function getApiKey(provider: ProviderName): Promise<string> {
  if (provider === 'MOCK') return '';
  const map = await loadCache();
  return map.get(provider) || ENV_FALLBACK[provider];
}

export async function hasApiKey(provider: ProviderName): Promise<boolean> {
  if (provider === 'MOCK') return true;
  return (await getApiKey(provider)).length > 0;
}

export async function setApiKey(provider: ProviderName, apiKey: string): Promise<void> {
  await prisma.providerCredential.upsert({
    where: { provider },
    update: { apiKey: encrypt(apiKey), lastStatus: null, lastCheckedAt: null, lastError: null },
    create: { provider, apiKey: encrypt(apiKey) },
  });
  (await loadCache()).set(provider, apiKey);
}

export async function clearApiKey(provider: ProviderName): Promise<void> {
  await prisma.providerCredential.upsert({
    where: { provider },
    update: { apiKey: null, lastStatus: null, lastCheckedAt: null, lastError: null },
    create: { provider, apiKey: null },
  });
  (await loadCache()).delete(provider);
}

export async function recordCheckResult(provider: ProviderName, status: ProviderCheckStatus, error?: string) {
  await prisma.providerCredential.upsert({
    where: { provider },
    update: { lastStatus: status, lastCheckedAt: new Date(), lastError: error ?? null },
    create: { provider, lastStatus: status, lastCheckedAt: new Date(), lastError: error ?? null },
  });
}

export interface ProviderCredentialSummary {
  provider: ProviderName;
  hasKey: boolean;
  usingEnvFallback: boolean;
  lastStatus: ProviderCheckStatus | null;
  lastCheckedAt: Date | null;
  lastError: string | null;
}

export async function listCredentialSummaries(): Promise<ProviderCredentialSummary[]> {
  const rows = await prisma.providerCredential.findMany();
  const byProvider = new Map(rows.map((r) => [r.provider, r]));
  const providers: ProviderName[] = ['REPLICATE', 'FAL', 'GEMINI'];

  return providers.map((provider) => {
    const row = byProvider.get(provider);
    const dbKey = row?.apiKey ?? null;
    return {
      provider,
      hasKey: Boolean(dbKey) || ENV_FALLBACK[provider].length > 0,
      usingEnvFallback: !dbKey && ENV_FALLBACK[provider].length > 0,
      lastStatus: row?.lastStatus ?? null,
      lastCheckedAt: row?.lastCheckedAt ?? null,
      lastError: row?.lastError ?? null,
    };
  });
}
