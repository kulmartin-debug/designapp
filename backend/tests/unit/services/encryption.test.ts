import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from '../../../src/services/encryption.js';

describe('encryption (AES-256-GCM)', () => {
  it('round-trips a plaintext string', () => {
    const ciphertext = encrypt('sk-my-secret-api-key-123');
    expect(decrypt(ciphertext)).toBe('sk-my-secret-api-key-123');
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const a = encrypt('same-plaintext');
    const b = encrypt('same-plaintext');
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe('same-plaintext');
    expect(decrypt(b)).toBe('same-plaintext');
  });

  it('does not store the plaintext anywhere in the ciphertext payload', () => {
    const ciphertext = encrypt('super-secret-value');
    expect(ciphertext).not.toContain('super-secret-value');
  });

  it('rejects a tampered payload (auth tag mismatch)', () => {
    const ciphertext = encrypt('sk-my-secret-api-key-123');
    const [iv, authTag, data] = ciphertext.split(':');
    const tampered = `${iv}:${authTag}:${data.slice(0, -2)}00`;
    expect(() => decrypt(tampered)).toThrow();
  });

  it('rejects a malformed payload', () => {
    expect(() => decrypt('not-a-valid-payload')).toThrow('Malformed encrypted payload');
  });
});
