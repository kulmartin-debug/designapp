import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';
import { startJobRunner, stopJobRunner } from '../../src/services/jobRunner.service.js';

// 1x1 red PNG, small enough to be a valid upload for every asset category test used here.
const TEST_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

async function waitForJobDone(app: ReturnType<typeof createApp>, jobId: string, timeoutMs = 15_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await request(app).get(`/api/jobs/${jobId}`);
    if (res.body.status === 'DONE' || res.body.status === 'FAILED') return res.body;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Job ${jobId} did not finish within ${timeoutMs}ms`);
}

describe('happy path: project -> upload -> Module B job -> Module C job -> comparison export', () => {
  const app = createApp();

  beforeAll(() => {
    startJobRunner();
  });

  afterAll(async () => {
    stopJobRunner();
    await prisma.$disconnect();
  });

  it('runs the full flow end to end using the MOCK provider', async () => {
    const projectRes = await request(app)
      .post('/api/projects')
      .send({ name: 'E2E test byt', note: 'happy path' })
      .expect(201);
    const projectId = projectRes.body.id;

    const photoRes = await request(app)
      .post(`/api/projects/${projectId}/assets`)
      .field('category', 'FOTO_SUCASNY_STAV')
      .attach('file', TEST_PNG, { filename: 'photo.png', contentType: 'image/png' })
      .expect(201);
    expect(photoRes.body.category).toBe('FOTO_SUCASNY_STAV');

    const sketchRes = await request(app)
      .post(`/api/projects/${projectId}/assets`)
      .field('category', 'NAVRH_SKETCHUP')
      .attach('file', TEST_PNG, { filename: 'sketch.png', contentType: 'image/png' })
      .expect(201);

    // Module B: current-state enhancement
    const jobBRes = await request(app)
      .post(`/api/projects/${projectId}/jobs/current-state`)
      .send({ assetId: photoRes.body.id })
      .expect(201);
    expect(jobBRes.body.provider).toBe('MOCK');

    const jobBDone = await waitForJobDone(app, jobBRes.body.id);
    expect(jobBDone.status).toBe('DONE');
    expect(jobBDone.variants).toHaveLength(1);
    const enhancedAssetId = jobBDone.variants[0].assetId;

    // Module C: sketch -> render, 2 variants
    const jobCRes = await request(app)
      .post(`/api/projects/${projectId}/jobs/sketch-render`)
      .send({ assetId: sketchRes.body.id, styleDescription: 'scandinavian, light oak', numVariants: 2 })
      .expect(201);

    const jobCDone = await waitForJobDone(app, jobCRes.body.id);
    expect(jobCDone.status).toBe('DONE');
    expect(jobCDone.variants).toHaveLength(2);
    expect(jobCDone.depthMapAssetId).toBeTruthy();
    expect(jobCDone.cannyMapAssetId).toBeTruthy();

    // Module D: export before/after comparison
    const comparisonRes = await request(app)
      .post(`/api/projects/${projectId}/comparisons`)
      .send({ beforeAssetId: photoRes.body.id, afterAssetId: enhancedAssetId })
      .expect(201);
    expect(comparisonRes.body.beforeLabel).toBe('PRED');
    expect(comparisonRes.body.afterLabel).toBe('PO');

    const downloadRes = await request(app).get(`/api/comparisons/${comparisonRes.body.id}/download`).expect(200);
    expect(downloadRes.headers['content-type']).toBe('image/png');
    expect(Number(downloadRes.headers['content-length'])).toBeGreaterThan(0);

    // Project detail should reflect the running cost total (0 for MOCK) and all created records.
    const detailRes = await request(app).get(`/api/projects/${projectId}`).expect(200);
    expect(detailRes.body.totalCostUsd).toBe(0);
    expect(detailRes.body.jobs).toHaveLength(2);
    expect(detailRes.body.comparisons).toHaveLength(1);
  });
});
