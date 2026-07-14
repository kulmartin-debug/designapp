import { apiDelete, apiGet, apiPatch, apiPost } from './client';
import type { Project, ProjectDetail } from '../types/api';

export function listProjects() {
  return apiGet<Project[]>('/api/projects');
}

export function createProject(input: { name: string; note?: string }) {
  return apiPost<Project>('/api/projects', input);
}

export function getProject(id: string) {
  return apiGet<ProjectDetail>(`/api/projects/${id}`);
}

export function updateProject(id: string, input: { name?: string; note?: string }) {
  return apiPatch<Project>(`/api/projects/${id}`, input);
}

export function deleteProject(id: string) {
  return apiDelete<void>(`/api/projects/${id}`);
}
