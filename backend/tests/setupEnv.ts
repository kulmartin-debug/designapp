// Unit tests import modules that read config/env.ts at import time (even if
// the test itself never touches the DB, e.g. gemini.provider.ts). Provide the
// minimal required env vars so that import doesn't throw outside a real .env.
process.env.DATABASE_URL ??= 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
process.env.NODE_ENV ??= 'test';
process.env.DEFAULT_PROVIDER ??= 'MOCK';
