import { createApp } from './app.js';
import { env } from './config/env.js';
import { reconcileStaleJobsOnBoot, startJobRunner } from './services/jobRunner.service.js';

async function main() {
  await reconcileStaleJobsOnBoot();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`Backend beží na http://localhost:${env.PORT}`);
  });

  startJobRunner();
}

main().catch((err) => {
  console.error('Fatal error on startup:', err);
  process.exit(1);
});
