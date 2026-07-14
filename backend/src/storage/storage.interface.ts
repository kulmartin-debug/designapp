export interface StoredFileHandle {
  storageKey: string;
}

// Abstraction over "where uploaded/generated files live". `localDiskStorage`
// implements this for dev; an S3-compatible implementation can be dropped in
// for production without touching callers (asset.service.ts, comparison.service.ts, ...).
export interface FileStorage {
  save(buffer: Buffer, opts: { extension: string }): Promise<StoredFileHandle>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
  getAbsolutePath(storageKey: string): string;
}
