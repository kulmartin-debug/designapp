import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type { ProviderCredentialSummary, ProviderName } from '../types/api';

export function listProviderCredentials() {
  return apiGet<ProviderCredentialSummary[]>('/api/settings/providers');
}

export function saveProviderKey(provider: ProviderName, apiKey: string) {
  return apiPut<ProviderCredentialSummary>(`/api/settings/providers/${provider}`, { apiKey });
}

export function testProviderConnection(provider: ProviderName) {
  return apiPost<ProviderCredentialSummary>(`/api/settings/providers/${provider}/test`);
}

export function removeProviderKey(provider: ProviderName) {
  return apiDelete<ProviderCredentialSummary>(`/api/settings/providers/${provider}`);
}
