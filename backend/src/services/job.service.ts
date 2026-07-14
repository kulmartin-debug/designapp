import type { ProviderName } from '@prisma/client';
import { prisma } from '../prisma.js';
import { storage } from '../storage/index.js';
import { ApiError, ProviderCallError } from '../types/errors.js';
import { getAssetOrThrow } from './asset.service.js';
import { getDefaultProvider, getProviderAdapter } from '../providers/providerRegistry.js';
import { withRetry } from '../providers/retry.js';
import { registerJobProcessor } from './jobRunner.service.js';
import {
  CURRENT_STATE_ENHANCE_NEGATIVE_PROMPT,
  CURRENT_STATE_ENHANCE_PROMPT,
  CURRENT_STATE_ENHANCE_STRENGTH,
} from '../config/prompts/currentStateEnhance.prompt.js';
import {
  SKETCH_RENDER_NEGATIVE_PROMPT,
  buildSketchRenderPrompt,
} from '../config/prompts/sketchRender.prompt.js';

const MAX_SKETCH_VARIANTS = 4;

export async function createCurrentStateJob(projectId: string, input: { assetId: string; provider?: ProviderName }) {
  const asset = await getAssetOrThrow(input.assetId);
  if (asset.projectId !== projectId) throw ApiError.invalidInput('Asset does not belong to this project');

  const providerName = input.provider ?? getDefaultProvider();
  const adapter = await getProviderAdapter(providerName);

  const job = await prisma.generationJob.create({
    data: {
      projectId,
      module: 'CURRENT_STATE_ENHANCE',
      provider: adapter.name,
      inputAssetId: asset.id,
      resolvedPrompt: CURRENT_STATE_ENHANCE_PROMPT,
      numVariantsRequested: 1,
      estimatedCostUsd: adapter.estimateCost('CURRENT_STATE_ENHANCE', 1),
    },
  });
  return job;
}

export async function createSketchRenderJob(
  projectId: string,
  input: { assetId: string; styleDescription: string; numVariants: number; provider?: ProviderName },
) {
  const asset = await getAssetOrThrow(input.assetId);
  if (asset.projectId !== projectId) throw ApiError.invalidInput('Asset does not belong to this project');
  if (!input.styleDescription?.trim()) throw ApiError.invalidInput('styleDescription is required');
  if (input.numVariants < 1 || input.numVariants > MAX_SKETCH_VARIANTS) {
    throw ApiError.invalidInput(`numVariants must be between 1 and ${MAX_SKETCH_VARIANTS}`);
  }

  const providerName = input.provider ?? getDefaultProvider();
  const adapter = await getProviderAdapter(providerName);
  if (!adapter.supportsSketchRender) {
    throw new ApiError(
      'ERR_UNSUPPORTED_PROVIDER_FOR_MODULE',
      `Provider ${adapter.name} does not support sketch-render`,
      422,
    );
  }

  const job = await prisma.generationJob.create({
    data: {
      projectId,
      module: 'SKETCH_RENDER',
      provider: adapter.name,
      inputAssetId: asset.id,
      styleDescription: input.styleDescription,
      resolvedPrompt: buildSketchRenderPrompt(input.styleDescription),
      numVariantsRequested: input.numVariants,
      estimatedCostUsd: adapter.estimateCost('SKETCH_RENDER', input.numVariants),
    },
  });
  return job;
}

export async function listJobs(projectId: string) {
  return prisma.generationJob.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: { variants: { include: { asset: true } } },
  });
}

export async function getJobOrThrow(id: string) {
  const job = await prisma.generationJob.findUnique({
    where: { id },
    include: { variants: { include: { asset: true } } },
  });
  if (!job) throw ApiError.notFound('Job not found');
  return job;
}

export async function retryJob(id: string) {
  const job = await getJobOrThrow(id);
  if (job.status !== 'FAILED') throw ApiError.invalidInput('Only FAILED jobs can be retried');
  return prisma.generationJob.update({
    where: { id },
    data: { status: 'PENDING', errorCode: null, errorMessage: null, retryCount: { increment: 1 } },
  });
}

export async function selectVariant(jobId: string, variantId: string) {
  const variant = await prisma.generationVariant.findUnique({ where: { id: variantId } });
  if (!variant || variant.jobId !== jobId) throw ApiError.notFound('Variant not found for this job');

  await prisma.$transaction([
    prisma.generationVariant.updateMany({ where: { jobId }, data: { isSelected: false } }),
    prisma.generationVariant.update({ where: { id: variantId }, data: { isSelected: true } }),
  ]);
  return getJobOrThrow(jobId);
}

async function saveGeneratedImage(projectId: string, buffer: Buffer) {
  const { storageKey } = await storage.save(buffer, { extension: '.png' });
  return prisma.asset.create({
    data: {
      projectId,
      category: 'GENERATED_OUTPUT',
      storageKey,
      mimeType: 'image/png',
      sizeBytes: buffer.byteLength,
    },
  });
}

async function saveDerivedImage(projectId: string, buffer: Buffer, category: 'DERIVED_DEPTH_MAP' | 'DERIVED_CANNY_EDGE') {
  const { storageKey } = await storage.save(buffer, { extension: '.png' });
  return prisma.asset.create({
    data: { projectId, category, storageKey, mimeType: 'image/png', sizeBytes: buffer.byteLength },
  });
}

// Wired into the jobRunner poll loop (see jobRunner.service.ts). Runs one
// PENDING job end-to-end: resolves the input asset, calls the provider
// (with retry for transient errors), stores outputs, and updates job status.
async function processJob(jobId: string) {
  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== 'PENDING') return;

  await prisma.generationJob.update({ where: { id: jobId }, data: { status: 'RUNNING', startedAt: new Date() } });

  const adapter = await getProviderAdapter(job.provider);

  try {
    const inputAsset = await getAssetOrThrow(job.inputAssetId);
    const inputBuffer = await storage.read(inputAsset.storageKey);

    if (job.module === 'CURRENT_STATE_ENHANCE') {
      const result = await withRetry(() =>
        adapter.enhanceCurrentState({
          imageBuffer: inputBuffer,
          mimeType: inputAsset.mimeType,
          prompt: job.resolvedPrompt,
          negativePrompt: CURRENT_STATE_ENHANCE_NEGATIVE_PROMPT,
          strength: CURRENT_STATE_ENHANCE_STRENGTH,
        }),
      );
      const [outputAsset] = await Promise.all(result.images.map((img) => saveGeneratedImage(job.projectId, img)));
      await prisma.generationVariant.create({
        data: { jobId: job.id, variantIndex: 0, assetId: outputAsset.id, isSelected: true },
      });
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'DONE',
          providerModel: result.providerModel,
          actualCostUsd: result.actualCostUsd,
          finishedAt: new Date(),
        },
      });
      return;
    }

    // SKETCH_RENDER
    const depthBuffer = await withRetry(() => adapter.preprocessDepthMap(inputBuffer));
    const cannyBuffer = await withRetry(() => adapter.preprocessCannyEdges(inputBuffer));
    const [depthAsset, cannyAsset] = await Promise.all([
      saveDerivedImage(job.projectId, depthBuffer, 'DERIVED_DEPTH_MAP'),
      saveDerivedImage(job.projectId, cannyBuffer, 'DERIVED_CANNY_EDGE'),
    ]);

    const result = await withRetry(() =>
      adapter.generateSketchRender({
        sketchImageBuffer: inputBuffer,
        mimeType: inputAsset.mimeType,
        styleDescription: job.styleDescription ?? '',
        prompt: job.resolvedPrompt,
        negativePrompt: SKETCH_RENDER_NEGATIVE_PROMPT,
        numVariants: job.numVariantsRequested,
        depthMapBuffer: depthBuffer,
        cannyEdgeBuffer: cannyBuffer,
      }),
    );

    const outputAssets = await Promise.all(result.images.map((img) => saveGeneratedImage(job.projectId, img)));
    await prisma.$transaction(
      outputAssets.map((asset, index) =>
        prisma.generationVariant.create({
          data: { jobId: job.id, variantIndex: index, assetId: asset.id, isSelected: index === 0 },
        }),
      ),
    );

    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'DONE',
        providerModel: result.providerModel,
        actualCostUsd: result.actualCostUsd,
        depthMapAssetId: depthAsset.id,
        cannyMapAssetId: cannyAsset.id,
        finishedAt: new Date(),
      },
    });
  } catch (err) {
    const code = err instanceof ProviderCallError ? err.code : 'ERR_INTERNAL';
    const message = err instanceof Error ? err.message : 'Unknown error';
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: 'FAILED', errorCode: code, errorMessage: message, finishedAt: new Date() },
    });
  }
}

registerJobProcessor(processJob);
