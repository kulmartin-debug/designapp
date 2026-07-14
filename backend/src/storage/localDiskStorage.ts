import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import type { FileStorage, StoredFileHandle } from './storage.interface.js';

const uploadsRoot = path.resolve(process.cwd(), env.UPLOADS_DIR);

class LocalDiskStorage implements FileStorage {
  async save(buffer: Buffer, opts: { extension: string }): Promise<StoredFileHandle> {
    await mkdir(uploadsRoot, { recursive: true });
    const storageKey = `${randomUUID()}${opts.extension}`;
    await writeFile(path.join(uploadsRoot, storageKey), buffer);
    return { storageKey };
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(this.getAbsolutePath(storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    await rm(this.getAbsolutePath(storageKey), { force: true });
  }

  getAbsolutePath(storageKey: string): string {
    return path.join(uploadsRoot, storageKey);
  }
}

export const localDiskStorage = new LocalDiskStorage();
