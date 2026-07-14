import { prisma } from '../prisma.js';

const POLL_INTERVAL_MS = 1000;
const MAX_CONCURRENT_JOBS = 2;

let runningCount = 0;
let pollTimer: NodeJS.Timeout | null = null;

// Called once at server boot: any job left RUNNING from a previous process
// (e.g. after a crash/restart) can never finish on its own, so it's marked
// FAILED with a retryable error code instead of hanging forever.
export async function reconcileStaleJobsOnBoot() {
  const { count } = await prisma.generationJob.updateMany({
    where: { status: 'RUNNING' },
    data: {
      status: 'FAILED',
      errorCode: 'ERR_INTERNAL',
      errorMessage: 'Server restarted while job was running',
      finishedAt: new Date(),
    },
  });
  if (count > 0) {
    console.log(`Reconciled ${count} stale RUNNING job(s) to FAILED on boot.`);
  }
}

export function startJobRunner() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    void pollOnce();
  }, POLL_INTERVAL_MS);
}

export function stopJobRunner() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function pollOnce() {
  const freeSlots = MAX_CONCURRENT_JOBS - runningCount;
  if (freeSlots <= 0) return;

  const pending = await prisma.generationJob.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: freeSlots,
  });

  for (const job of pending) {
    runningCount += 1;
    void processJob(job.id).finally(() => {
      runningCount -= 1;
    });
  }
}

// The actual provider-calling logic is wired up in Module B
// (services/job.service.ts's processJob, using the provider adapter layer).
let jobProcessor: ((jobId: string) => Promise<void>) | null = null;

export function registerJobProcessor(fn: (jobId: string) => Promise<void>) {
  jobProcessor = fn;
}

async function processJob(jobId: string) {
  if (!jobProcessor) {
    console.warn(`No job processor registered yet; skipping job ${jobId}`);
    return;
  }
  await jobProcessor(jobId);
}
