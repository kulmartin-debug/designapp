import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.get('/status', authController.status);
authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
