import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

export const SESSION_COOKIE_NAME = 'pp_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function sign(payload: string): string {
  return createHmac('sha256', env.SESSION_SECRET).update(payload).digest('hex');
}

export function createSessionCookieValue(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

export function isSessionCookieValid(value: string | undefined): boolean {
  if (!value) return false;
  const [expiresAtStr, signature] = value.split('.');
  if (!expiresAtStr || !signature) return false;

  const expected = sign(expiresAtStr);
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) return false;

  return Number(expiresAtStr) > Date.now();
}

export function isAuthRequired(): boolean {
  return env.ACCESS_PASSWORD.length > 0;
}

export function checkPassword(candidate: string): boolean {
  if (!isAuthRequired()) return false;
  const expected = Buffer.from(env.ACCESS_PASSWORD);
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  maxAge: SESSION_TTL_MS,
};
