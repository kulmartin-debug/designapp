import { apiGet, apiPost } from './client';
import type { ComparisonExport } from '../types/api';

export function createComparison(
  projectId: string,
  input: { beforeAssetId: string; afterAssetId: string; beforeLabel?: string; afterLabel?: string },
) {
  return apiPost<ComparisonExport>(`/api/projects/${projectId}/comparisons`, input);
}

export function listComparisons(projectId: string) {
  return apiGet<ComparisonExport[]>(`/api/projects/${projectId}/comparisons`);
}
