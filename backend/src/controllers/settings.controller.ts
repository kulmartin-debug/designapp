import type { Request, Response } from 'express';
import type { ProviderName } from '@prisma/client';
import {
  clearApiKey,
  listCredentialSummaries,
  recordCheckResult,
  setApiKey,
} from '../services/credentials.service.js';
import { getAdapterByName } from '../providers/providerRegistry.js';
import { ApiError } from '../types/errors.js';

const EDITABLE_PROVIDERS: ProviderName[] = ['REPLICATE', 'FAL', 'GEMINI'];

function assertEditable(name: string): ProviderName {
  if (!EDITABLE_PROVIDERS.includes(name as ProviderName)) {
    throw ApiError.invalidInput(`Unknown or non-editable provider: ${name}`);
  }
  return name as ProviderName;
}

async function runAndRecordTest(provider: ProviderName) {
  const adapter = getAdapterByName(provider);
  const result = await adapter.testConnection();
  await recordCheckResult(provider, result.ok ? 'OK' : 'FAILED', result.ok ? undefined : result.message);
  return result;
}

export async function list(_req: Request, res: Response) {
  res.json(await listCredentialSummaries());
}

export async function save(req: Request, res: Response) {
  const provider = assertEditable(req.params.name);
  const apiKey = typeof req.body.apiKey === 'string' ? req.body.apiKey.trim() : '';
  if (!apiKey) throw ApiError.invalidInput('apiKey is required');

  await setApiKey(provider, apiKey);
  await runAndRecordTest(provider);

  const summaries = await listCredentialSummaries();
  res.json(summaries.find((s) => s.provider === provider));
}

export async function test(req: Request, res: Response) {
  const provider = assertEditable(req.params.name);
  await runAndRecordTest(provider);

  const summaries = await listCredentialSummaries();
  res.json(summaries.find((s) => s.provider === provider));
}

export async function remove(req: Request, res: Response) {
  const provider = assertEditable(req.params.name);
  await clearApiKey(provider);

  const summaries = await listCredentialSummaries();
  res.json(summaries.find((s) => s.provider === provider));
}
