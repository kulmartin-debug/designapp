import { prisma } from '../prisma.js';

// Running total cost for a project: prefers actualCostUsd (when a provider
// reported real billing) and falls back to the estimate otherwise.
export async function getProjectTotalCostUsd(projectId: string): Promise<number> {
  const jobs = await prisma.generationJob.findMany({
    where: { projectId },
    select: { estimatedCostUsd: true, actualCostUsd: true },
  });
  return jobs.reduce((sum, job) => sum + (job.actualCostUsd ?? job.estimatedCostUsd), 0);
}
