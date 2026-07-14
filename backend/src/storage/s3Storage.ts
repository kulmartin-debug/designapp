import type { FileStorage, StoredFileHandle } from './storage.interface.js';

// Placeholder for a production S3-compatible backend. Implement using the
// AWS SDK v3 (`@aws-sdk/client-s3`) and wire it up in storageRegistry below
// once STORAGE_DRIVER=s3 is needed. Not required for MVP/dev.
class S3Storage implements FileStorage {
  async save(): Promise<StoredFileHandle> {
    throw new Error('S3 storage not implemented yet - set STORAGE_DRIVER=local for now.');
  }
  async read(): Promise<Buffer> {
    throw new Error('S3 storage not implemented yet - set STORAGE_DRIVER=local for now.');
  }
  async delete(): Promise<void> {
    throw new Error('S3 storage not implemented yet - set STORAGE_DRIVER=local for now.');
  }
  getAbsolutePath(): string {
    throw new Error('S3 storage not implemented yet - set STORAGE_DRIVER=local for now.');
  }
}

export const s3Storage = new S3Storage();
