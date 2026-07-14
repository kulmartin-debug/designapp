import { describe, expect, it, vi } from 'vitest';
import { withRetry } from '../../../src/providers/retry.js';
import { ProviderCallError } from '../../../src/types/errors.js';

describe('withRetry', () => {
  it('returns the result immediately when fn succeeds on the first try', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on ERR_TIMEOUT up to maxRetries and then succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new ProviderCallError('ERR_TIMEOUT', 'timed out'))
      .mockResolvedValueOnce('ok after retry');
    const result = await withRetry(fn, { maxRetries: 2 });
    expect(result).toBe('ok after retry');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('gives up after maxRetries and throws the last error', async () => {
    const fn = vi.fn().mockRejectedValue(new ProviderCallError('ERR_RATE_LIMITED', 'rate limited'));
    await expect(withRetry(fn, { maxRetries: 2 })).rejects.toThrow('rate limited');
    expect(fn).toHaveBeenCalledTimes(3); // initial attempt + 2 retries
  });

  it('does not retry non-transient errors like ERR_INVALID_INPUT', async () => {
    const fn = vi.fn().mockRejectedValue(new ProviderCallError('ERR_INVALID_INPUT', 'bad input'));
    await expect(withRetry(fn, { maxRetries: 2 })).rejects.toThrow('bad input');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry plain (non-ProviderCallError) errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('unexpected'));
    await expect(withRetry(fn, { maxRetries: 2 })).rejects.toThrow('unexpected');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
