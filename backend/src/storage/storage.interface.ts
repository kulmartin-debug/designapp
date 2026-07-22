export interface StoredFileHandle {
  storageKey: string;
}

// Abstraction over "where uploaded/generated files live". `localDiskStorage`
// implements this for dev; `s3Storage` (Supabase Storage / any S3-compatible
// bucket) implements it for production - callers (asset.service.ts,
// comparison.service.ts, ...) never know or care which one is active.
export interface FileStorage {
  save(buffer: Buffer, opts: { extension: string }): Promise<StoredFileHandle>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}
