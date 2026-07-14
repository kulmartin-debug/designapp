import { randomBytes } from 'node:crypto';
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  UPLOADS_DIR: z.string().default('./uploads'),
  REPLICATE_API_TOKEN: z.string().optional().default(''),
  FAL_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  DEFAULT_PROVIDER: z.enum(['REPLICATE', 'FAL', 'GEMINI', 'MOCK']).default('MOCK'),
  // Shared-password gate for the whole app (see auth.middleware.ts). Empty = no gate (dev convenience only).
  ACCESS_PASSWORD: z.string().optional().default(''),
  // Signs the session cookie. If unset, a random value is generated per boot,
  // which means existing sessions become invalid on every restart/redeploy -
  // set this explicitly in production so logins persist across deploys.
  SESSION_SECRET: z.string().optional().default(''),
  // Only relevant if frontend and backend run on different origins (e.g. two
  // separate dev servers). When the backend serves the built frontend itself
  // (production, see server-side rendering setup), requests are same-origin
  // and this is unused.
  FRONTEND_ORIGIN: z.string().optional().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Neplatná konfigurácia prostredia (.env):', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

if (!parsed.data.SESSION_SECRET) {
  console.warn(
    'SESSION_SECRET nie je nastavený - generujem náhodný len pre tento beh (prihlásenia nevydržia reštart/redeploy).',
  );
}

export const env = {
  ...parsed.data,
  SESSION_SECRET: parsed.data.SESSION_SECRET || randomBytes(32).toString('hex'),
};
