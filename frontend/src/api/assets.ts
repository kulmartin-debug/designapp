import { apiDelete, apiGet, apiUpload } from './client';
import type { Asset, AssetCategory } from '../types/api';

export function listAssets(projectId: string, category?: AssetCategory) {
  const qs = category ? `?category=${category}` : '';
  return apiGet<Asset[]>(`/api/projects/${projectId}/assets${qs}`);
}

export function uploadAsset(projectId: string, category: AssetCategory, file: File) {
  const formData = new FormData();
  formData.append('category', category);
  formData.append('file', file);
  return apiUpload<Asset>(`/api/projects/${projectId}/assets`, formData);
}

export function deleteAsset(assetId: string) {
  return apiDelete<void>(`/api/assets/${assetId}`);
}
