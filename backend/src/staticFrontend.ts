import path from 'node:path';
import { existsSync } from 'node:fs';
import type { Express } from 'express';
import express from 'express';
import { env } from './config/env.js';

// In production, the frontend is built (frontend/dist) and copied here
// (backend/public) by the root build script, so this one Express process can
// serve both the API and the SPA - no separate frontend host, no cross-origin
// cookie complications for the auth session.
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

export function registerStaticFrontend(app: Express) {
  if (env.NODE_ENV !== 'production') return;
  if (!existsSync(PUBLIC_DIR)) {
    console.warn(`NODE_ENV=production but ${PUBLIC_DIR} does not exist - run the frontend build first.`);
    return;
  }

  app.use(express.static(PUBLIC_DIR));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });
}
