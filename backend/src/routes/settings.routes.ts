import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const settingsRouter = Router();

settingsRouter.get('/providers', asyncHandler(settingsController.list));
settingsRouter.put('/providers/:name', asyncHandler(settingsController.save));
settingsRouter.post('/providers/:name/test', asyncHandler(settingsController.test));
settingsRouter.delete('/providers/:name', asyncHandler(settingsController.remove));
