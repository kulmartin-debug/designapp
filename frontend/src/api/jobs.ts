import { apiGet, apiPost } from './client';
import type { GenerationJob, ProviderName } from '../types/api';

export function createCurrentStateJob(projectId: string, input: { assetId: string; provider?: ProviderName }) {
  return apiPost<GenerationJob>(`/api/projects/${projectId}/jobs/current-state`, input);
}

export function createSketchRenderJob(
  projectId: string,
  input: { assetId: string; styleDescription: string; numVariants: number; provider?: ProviderName },
) {
  return apiPost<GenerationJob>(`/api/projects/${projectId}/jobs/sketch-render`, input);
}

export function listJobs(projectId: string) {
  return apiGet<GenerationJob[]>(`/api/projects/${projectId}/jobs`);
}

export function getJob(jobId: string) {
  return apiGet<GenerationJob>(`/api/jobs/${jobId}`);
}

export function retryJob(jobId: string) {
  return apiPost<GenerationJob>(`/api/jobs/${jobId}/retry`);
}

export function selectVariant(jobId: string, variantId: string) {
  return apiPost<GenerationJob>(`/api/jobs/${jobId}/select-variant`, { variantId });
}
