import { Router } from 'express';
import * as projectsController from '../controllers/projects.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const projectsRouter = Router();

projectsRouter.post('/', asyncHandler(projectsController.create));
projectsRouter.get('/', asyncHandler(projectsController.list));
projectsRouter.get('/:id', asyncHandler(projectsController.getDetail));
projectsRouter.patch('/:id', asyncHandler(projectsController.update));
projectsRouter.delete('/:id', asyncHandler(projectsController.remove));
