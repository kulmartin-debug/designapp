import path from 'node:path';
import sharp from 'sharp';
import type { AssetCategory } from '@prisma/client';
import { prisma } from '../prisma.js';
import { storage } from '../storage/index.js';
import { ApiError } from '../types/errors.js';
import { getProjectDetail } from './project.service.js';

async function getImageDimensions(buffer: Buffer, mimeType: string) {
  if (mimeType === 'application/pdf') return { width: null, height: null };
  try {
    const meta = await sharp(buffer).metadata();
    return { width: meta.width ?? null, height: meta.height ?? null };
  } catch {
    return { width: null, height: null };
  }
}

export async function uploadAsset(
  projectId: string,
  category: AssetCategory,
  file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
) {
  await getProjectDetail(projectId); // 404s if project doesn't exist

  // PODORYS (floor plan) is a single-file category: uploading a new one replaces the old.
  if (category === 'PODORYS') {
    const existing = await prisma.asset.findMany({ where: { projectId, category: 'PODORYS' } });
    for (const asset of existing) {
      await storage.delete(asset.storageKey).catch(() => undefined);
      await prisma.asset.delete({ where: { id: asset.id } });
    }
  }

  const extension = path.extname(file.originalname) || guessExtension(file.mimetype);
  const { storageKey } = await storage.save(file.buffer, { extension });
  const { width, height } = await getImageDimensions(file.buffer, file.mimetype);

  return prisma.asset.create({
    data: {
      projectId,
      category,
      storageKey,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      width,
      height,
    },
  });
}

function guessExtension(mimeType: string) {
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'application/pdf') return '.pdf';
  return '';
}

export async function listAssets(projectId: string, category?: AssetCategory) {
  return prisma.asset.findMany({
    where: { projectId, ...(category ? { category } : {}) },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAssetOrThrow(id: string) {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) throw ApiError.notFound('Asset not found');
  return asset;
}

export async function deleteAsset(id: string) {
  const asset = await getAssetOrThrow(id);

  const [asInput, asVariant, asComparison] = await Promise.all([
    prisma.generationJob.count({
      where: { OR: [{ inputAssetId: id }, { depthMapAssetId: id }, { cannyMapAssetId: id }] },
    }),
    prisma.generationVariant.count({ where: { assetId: id } }),
    prisma.comparisonExport.count({
      where: { OR: [{ beforeAssetId: id }, { afterAssetId: id }, { resultAssetId: id }] },
    }),
  ]);

  if (asInput + asVariant + asComparison > 0) {
    throw ApiError.conflict('Asset is referenced by a job, variant or comparison export and cannot be deleted');
  }

  await storage.delete(asset.storageKey).catch(() => undefined);
  await prisma.asset.delete({ where: { id } });
}
