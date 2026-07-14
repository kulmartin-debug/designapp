import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import type { AssetCategory } from '@prisma/client';
import { ApiError } from '../types/errors.js';

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

const ALLOWED_MIME_BY_CATEGORY: Record<string, string[]> = {
  FOTO_SUCASNY_STAV: ['image/jpeg', 'image/png'],
  PODORYS: ['image/jpeg', 'image/png', 'application/pdf'],
  NAVRH_SKETCHUP: ['image/jpeg', 'image/png'],
};

// Categories that only ever hold a single asset per project (enforced by the service layer).
export const SINGLE_FILE_CATEGORIES: AssetCategory[] = ['PODORYS'] as AssetCategory[];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

// Runs after multer has fully parsed the multipart body, so req.body.category
// and req.file are both populated regardless of field order in the FormData.
export function validateUploadCategory(req: Request, _res: Response, next: NextFunction) {
  const category = req.body.category as string | undefined;
  if (!category || !(category in ALLOWED_MIME_BY_CATEGORY)) {
    next(ApiError.invalidInput('Missing or unknown "category" field (expected it before the file in multipart form data)'));
    return;
  }
  if (!req.file) {
    next(ApiError.invalidInput('Missing file'));
    return;
  }
  const allowed = ALLOWED_MIME_BY_CATEGORY[category];
  if (!allowed.includes(req.file.mimetype)) {
    next(new ApiError('ERR_INVALID_MIME_TYPE', `MIME type ${req.file.mimetype} not allowed for category ${category}`));
    return;
  }
  next();
}

export function multerErrorHandler(err: unknown, _req: Request, _res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    next(new ApiError('ERR_FILE_TOO_LARGE', `File exceeds the ${MAX_UPLOAD_BYTES / 1024 / 1024}MB limit`));
    return;
  }
  next(err);
}
