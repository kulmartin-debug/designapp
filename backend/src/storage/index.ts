import { env } from '../config/env.js';
import { localDiskStorage } from './localDiskStorage.js';
import { s3Storage } from './s3Storage.js';
import type { FileStorage } from './storage.interface.js';

export const storage: FileStorage = env.STORAGE_DRIVER === 's3' ? s3Storage : localDiskStorage;
export type { FileStorage } from './storage.interface.js';
