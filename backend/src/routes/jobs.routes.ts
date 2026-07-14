import { Router } from 'express';
import * as jobsController from '../controllers/jobs.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const jobsRouter = Router();

jobsRouter.post('/projects/:id/jobs/current-state', asyncHandler(jobsController.createCurrentState));
jobsRouter.post('/projects/:id/jobs/sketch-render', asyncHandler(jobsController.createSketchRender));
jobsRouter.get('/projects/:id/jobs', asyncHandler(jobsController.list));
jobsRouter.get('/jobs/:id', asyncHandler(jobsController.getDetail));
jobsRouter.post('/jobs/:id/retry', asyncHandler(jobsController.retry));
jobsRouter.post('/jobs/:id/select-variant', asyncHandler(jobsController.selectVariant));
