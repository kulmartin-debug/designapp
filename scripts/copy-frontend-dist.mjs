// Copies the built frontend (frontend/dist) into backend/public, so the
// backend's Express process can serve it directly in production (see
// backend/src/staticFrontend.ts) - no separate frontend host needed.
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const src = path.join(rootDir, 'frontend', 'dist');
const dest = path.join(rootDir, 'backend', 'public');

if (!existsSync(src)) {
  console.error(`Frontend build not found at ${src}. Run "npm run build" in frontend/ first.`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied ${src} -> ${dest}`);
