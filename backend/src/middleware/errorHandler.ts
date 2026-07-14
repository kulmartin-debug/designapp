import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../types/errors.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ errorCode: err.code, message: err.message });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ errorCode: 'ERR_INTERNAL', message: 'Internal server error' });
}
