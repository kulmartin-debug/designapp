import sharp from 'sharp';
import { prisma } from '../prisma.js';
import { storage } from '../storage/index.js';
import { ApiError } from '../types/errors.js';
import { getAssetOrThrow } from './asset.service.js';
import { getProjectDetail } from './project.service.js';

const PANEL_WIDTH = 700;
const PANEL_HEIGHT = 700;
const TITLE_HEIGHT = 56;
const LABEL_HEIGHT = 48;
const GAP = 6;

function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
}

async function textBar(width: number, height: number, text: string, opts: { fontSize: number; bg: string; fg: string }) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${opts.bg}" />
      <text x="50%" y="50%" font-size="${opts.fontSize}" font-family="sans-serif" font-weight="bold"
            fill="${opts.fg}" text-anchor="middle" dominant-baseline="middle">${escapeXml(text)}</text>
    </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// Synchronous compositing (no async job needed - sharp finishes in well under
// a second for images this size). Produces one PNG: title bar with the
// project name, the two images side by side (resized/cropped to equal
// panels), and a PRED/PO label bar under each.
export async function createComparisonExport(
  projectId: string,
  input: { beforeAssetId: string; afterAssetId: string; beforeLabel?: string; afterLabel?: string },
) {
  const project = await getProjectDetail(projectId);
  const beforeAsset = await getAssetOrThrow(input.beforeAssetId);
  const afterAsset = await getAssetOrThrow(input.afterAssetId);
  if (beforeAsset.projectId !== projectId || afterAsset.projectId !== projectId) {
    throw ApiError.invalidInput('Both assets must belong to this project');
  }

  const beforeLabel = input.beforeLabel?.trim() || 'PRED';
  const afterLabel = input.afterLabel?.trim() || 'PO';

  const [beforeBuf, afterBuf] = await Promise.all([
    storage.read(beforeAsset.storageKey),
    storage.read(afterAsset.storageKey),
  ]);

  const [beforeResized, afterResized] = await Promise.all([
    sharp(beforeBuf).resize(PANEL_WIDTH, PANEL_HEIGHT, { fit: 'cover' }).png().toBuffer(),
    sharp(afterBuf).resize(PANEL_WIDTH, PANEL_HEIGHT, { fit: 'cover' }).png().toBuffer(),
  ]);

  const canvasWidth = PANEL_WIDTH * 2 + GAP;
  const canvasHeight = TITLE_HEIGHT + PANEL_HEIGHT + LABEL_HEIGHT;

  const [titleBar, beforeLabelBar, afterLabelBar] = await Promise.all([
    textBar(canvasWidth, TITLE_HEIGHT, project.name, { fontSize: 26, bg: '#171717', fg: '#ffffff' }),
    textBar(PANEL_WIDTH, LABEL_HEIGHT, beforeLabel, { fontSize: 22, bg: '#e5e5e5', fg: '#171717' }),
    textBar(PANEL_WIDTH, LABEL_HEIGHT, afterLabel, { fontSize: 22, bg: '#e5e5e5', fg: '#171717' }),
  ]);

  const composed = await sharp({
    create: { width: canvasWidth, height: canvasHeight, channels: 4, background: '#ffffff' },
  })
    .composite([
      { input: titleBar, left: 0, top: 0 },
      { input: beforeResized, left: 0, top: TITLE_HEIGHT },
      { input: afterResized, left: PANEL_WIDTH + GAP, top: TITLE_HEIGHT },
      { input: beforeLabelBar, left: 0, top: TITLE_HEIGHT + PANEL_HEIGHT },
      { input: afterLabelBar, left: PANEL_WIDTH + GAP, top: TITLE_HEIGHT + PANEL_HEIGHT },
    ])
    .png()
    .toBuffer();

  const { storageKey } = await storage.save(composed, { extension: '.png' });
  const resultAsset = await prisma.asset.create({
    data: {
      projectId,
      category: 'EXPORT_COMPARISON',
      storageKey,
      mimeType: 'image/png',
      sizeBytes: composed.byteLength,
      width: canvasWidth,
      height: canvasHeight,
    },
  });

  return prisma.comparisonExport.create({
    data: {
      projectId,
      beforeAssetId: beforeAsset.id,
      afterAssetId: afterAsset.id,
      resultAssetId: resultAsset.id,
      beforeLabel,
      afterLabel,
    },
    include: { resultAsset: true, beforeAsset: true, afterAsset: true },
  });
}

export async function listComparisons(projectId: string) {
  return prisma.comparisonExport.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: { resultAsset: true, beforeAsset: true, afterAsset: true },
  });
}

export async function getComparisonOrThrow(id: string) {
  const comparison = await prisma.comparisonExport.findUnique({ where: { id }, include: { resultAsset: true } });
  if (!comparison) throw ApiError.notFound('Comparison not found');
  return comparison;
}
