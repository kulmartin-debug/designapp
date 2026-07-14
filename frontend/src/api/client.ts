import type { ApiErrorBody } from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export class ApiRequestError extends Error {
  errorCode: string;
  status: number;

  constructor(errorCode: string, message: string, status: number) {
    super(message);
    this.errorCode = errorCode;
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body as ApiErrorBody;
    if (res.status === 401) {
      // Lets App.tsx react immediately (e.g. session expired mid-session) by
      // re-checking auth status and falling back to the login screen.
      window.dispatchEvent(new CustomEvent('app:unauthorized'));
    }
    throw new ApiRequestError(err.errorCode ?? 'ERR_INTERNAL', err.message ?? res.statusText, res.status);
  }
  return body as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include' });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, data?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', credentials: 'include' });
  return handleResponse<T>(res);
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', credentials: 'include', body: formData });
  return handleResponse<T>(res);
}

export function assetFileUrl(assetId: string): string {
  return `${BASE_URL}/api/assets/${assetId}/file`;
}

export function comparisonDownloadUrl(comparisonId: string): string {
  return `${BASE_URL}/api/comparisons/${comparisonId}/download`;
}
