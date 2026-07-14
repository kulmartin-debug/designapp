import { ProviderCallError } from '../types/errors.js';

const RETRYABLE_CODES = new Set(['ERR_TIMEOUT', 'ERR_RATE_LIMITED']);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Max 2 retries (3 attempts total), exponential backoff + jitter, only for
// transient errors (timeout/rate-limit) - invalid input or hard provider
// errors are not retried since retrying them would just fail again.
export async function withRetry<T>(fn: () => Promise<T>, opts?: { maxRetries?: number }): Promise<T> {
  const maxRetries = opts?.maxRetries ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRetryable = err instanceof ProviderCallError && RETRYABLE_CODES.has(err.code);
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      const backoffMs = 500 * 2 ** attempt + Math.random() * 250;
      await sleep(backoffMs);
    }
  }

  throw lastError;
}
