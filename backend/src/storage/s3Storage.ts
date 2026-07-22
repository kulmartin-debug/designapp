import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import type { FileStorage, StoredFileHandle } from './storage.interface.js';

// Works against any S3-compatible bucket - primarily Supabase Storage's S3
// connection (Storage -> Settings -> S3 Connection in the Supabase
// dashboard gives S3_ENDPOINT/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY). Files
// are always proxied through our own /api/assets/:id/file route (see
// asset.service.ts), so the bucket never needs to be public.
const client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: true, // required by Supabase's S3-compatible endpoint
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

async function streamToBuffer(body: unknown): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

class S3Storage implements FileStorage {
  async save(buffer: Buffer, opts: { extension: string }): Promise<StoredFileHandle> {
    const storageKey = `${randomUUID()}${opts.extension}`;
    await client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
        Body: buffer,
      }),
    );
    return { storageKey };
  }

  async read(storageKey: string): Promise<Buffer> {
    const result = await client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey }));
    return streamToBuffer(result.Body);
  }

  async delete(storageKey: string): Promise<void> {
    await client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey }));
  }
}

export const s3Storage = new S3Storage();
