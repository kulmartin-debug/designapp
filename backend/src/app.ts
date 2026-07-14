import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { authGuard } from './middleware/authGuard.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { projectsRouter } from './routes/projects.routes.js';
import { assetsRouter } from './routes/assets.routes.js';
import { jobsRouter } from './routes/jobs.routes.js';
import { comparisonsRouter } from './routes/comparisons.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { registerStaticFrontend } from './staticFrontend.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // Unprotected: health check and the login flow itself.
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);

  // Everything else requires a valid session when ACCESS_PASSWORD is set.
  app.use('/api', authGuard);

  app.use('/api/projects', projectsRouter);
  app.use('/api', assetsRouter);
  app.use('/api', jobsRouter);
  app.use('/api', comparisonsRouter);
  app.use('/api/settings', settingsRouter);

  app.use(errorHandler);

  // In production, this Express process also serves the built frontend
  // (same origin as the API) - see staticFrontend.ts.
  registerStaticFrontend(app);

  return app;
}
