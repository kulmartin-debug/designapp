import { beforeEach, describe, expect, it, vi } from 'vitest';

const findManyMock = vi.fn();

vi.mock('../../../src/prisma.js', () => ({
  prisma: { generationJob: { findMany: findManyMock } },
}));

const { getProjectTotalCostUsd } = await import('../../../src/services/cost.service.js');

describe('getProjectTotalCostUsd', () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it('sums estimatedCostUsd when actualCostUsd is not set', async () => {
    findManyMock.mockResolvedValue([
      { estimatedCostUsd: 0.02, actualCostUsd: null },
      { estimatedCostUsd: 0.05, actualCostUsd: null },
    ]);
    expect(await getProjectTotalCostUsd('p1')).toBeCloseTo(0.07);
  });

  it('prefers actualCostUsd over estimatedCostUsd when present', async () => {
    findManyMock.mockResolvedValue([
      { estimatedCostUsd: 0.02, actualCostUsd: 0.018 },
      { estimatedCostUsd: 0.05, actualCostUsd: null },
    ]);
    expect(await getProjectTotalCostUsd('p1')).toBeCloseTo(0.068);
  });

  it('returns 0 for a project with no jobs', async () => {
    findManyMock.mockResolvedValue([]);
    expect(await getProjectTotalCostUsd('p1')).toBe(0);
  });
});
