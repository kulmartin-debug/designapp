import { Router } from 'express';
import * as comparisonsController from '../controllers/comparisons.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const comparisonsRouter = Router();

comparisonsRouter.post('/projects/:id/comparisons', asyncHandler(comparisonsController.create));
comparisonsRouter.get('/projects/:id/comparisons', asyncHandler(comparisonsController.list));
comparisonsRouter.get('/comparisons/:id/download', asyncHandler(comparisonsController.download));
