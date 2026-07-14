import { Router } from 'express';
import * as assetsController from '../controllers/assets.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { multerErrorHandler, upload, validateUploadCategory } from '../middleware/uploadValidation.js';

export const assetsRouter = Router();

assetsRouter.post(
  '/projects/:id/assets',
  upload.single('file'),
  multerErrorHandler,
  validateUploadCategory,
  asyncHandler(assetsController.upload),
);
assetsRouter.get('/projects/:id/assets', asyncHandler(assetsController.list));
assetsRouter.get('/assets/:id/file', asyncHandler(assetsController.getFile));
assetsRouter.delete('/assets/:id', asyncHandler(assetsController.remove));
