import { apiGet, apiPost } from './client';

export interface AuthStatus {
  authRequired: boolean;
  authenticated: boolean;
}

export function getAuthStatus() {
  return apiGet<AuthStatus>('/api/auth/status');
}

export function login(password: string) {
  return apiPost<{ ok: true }>('/api/auth/login', { password });
}

export function logout() {
  return apiPost<{ ok: true }>('/api/auth/logout');
}
