/**
 * Seed script: creates one demo project with placeholder images so the UI is
 * fully browsable with zero API keys configured. All generation goes through
 * mockProvider directly (bypassing the HTTP job-runner loop) purely so the
 * seed finishes synchronously and deterministically.
 */
import sharp from 'sharp';
import { prisma } from '../src/prisma.js';
import { storage } from '../src/storage/index.js';
import { mockProvider } from '../src/providers/mock.provider.js';
import { CURRENT_STATE_ENHANCE_PROMPT } from '../src/config/prompts/currentStateEnhance.prompt.js';
import { buildSketchRenderPrompt } from '../src/config/prompts/sketchRender.prompt.js';
import { createComparisonExport } from '../src/services/comparison.service.js';

async function labeledImage(label: string, bg: string): Promise<Buffer> {
  const svg = `
    <svg width="900" height="650" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bg}" />
      <text x="50%" y="50%" font-size="34" font-family="sans-serif" fill="#171717"
            text-anchor="middle" dominant-baseline="middle">${label}</text>
    </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function saveAsset(projectId: string, category: 'FOTO_SUCASNY_STAV' | 'PODORYS' | 'NAVRH_SKETCHUP' | 'GENERATED_OUTPUT' | 'DERIVED_DEPTH_MAP' | 'DERIVED_CANNY_EDGE', buffer: Buffer, originalFilename?: string) {
  const { storageKey } = await storage.save(buffer, { extension: '.png' });
  return prisma.asset.create({
    data: { projectId, category, storageKey, originalFilename, mimeType: 'image/png', sizeBytes: buffer.byteLength },
  });
}

async function main() {
  const existing = await prisma.project.findFirst({ where: { name: 'Ukážkový byt' } });
  if (existing) {
    console.log('Seed projekt "Ukážkový byt" už existuje, preskakujem.');
    return;
  }

  const project = await prisma.project.create({
    data: { name: 'Ukážkový byt', note: 'Demo projekt so vzorovými (placeholder) obrázkami - beží bez API kľúčov.' },
  });

  const photo = await saveAsset(project.id, 'FOTO_SUCASNY_STAV', await labeledImage('Foto: obývačka (súčasný stav)', '#d6d3d1'), 'obyvacka.png');
  await saveAsset(project.id, 'PODORYS', await labeledImage('Pôdorys bytu', '#e7e5e4'), 'podorys.png');
  const sketch = await saveAsset(project.id, 'NAVRH_SKETCHUP', await labeledImage('SketchUp náčrt: nový návrh', '#e0e7ff'), 'navrh.png');

  // Module B: pre-finished current-state enhancement job.
  const enhanceResult = await mockProvider.enhanceCurrentState({
    imageBuffer: await storage.read(photo.storageKey),
    mimeType: 'image/png',
    prompt: CURRENT_STATE_ENHANCE_PROMPT,
  });
  const enhancedAsset = await saveAsset(project.id, 'GENERATED_OUTPUT', enhanceResult.images[0]);
  const jobB = await prisma.generationJob.create({
    data: {
      projectId: project.id,
      module: 'CURRENT_STATE_ENHANCE',
      status: 'DONE',
      provider: 'MOCK',
      providerModel: enhanceResult.providerModel,
      inputAssetId: photo.id,
      resolvedPrompt: CURRENT_STATE_ENHANCE_PROMPT,
      numVariantsRequested: 1,
      estimatedCostUsd: 0,
      actualCostUsd: 0,
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });
  await prisma.generationVariant.create({
    data: { jobId: jobB.id, variantIndex: 0, assetId: enhancedAsset.id, isSelected: true },
  });

  // Module C: pre-finished sketch-render job with 2 variants + depth/canny maps.
  const styleDescription = 'škandinávsky štýl, svetlý dub, biele steny, teplé svetlo';
  const sketchBuffer = await storage.read(sketch.storageKey);
  const depthBuffer = await mockProvider.preprocessDepthMap(sketchBuffer);
  const cannyBuffer = await mockProvider.preprocessCannyEdges(sketchBuffer);
  const depthAsset = await saveAsset(project.id, 'DERIVED_DEPTH_MAP', depthBuffer);
  const cannyAsset = await saveAsset(project.id, 'DERIVED_CANNY_EDGE', cannyBuffer);
  const renderResult = await mockProvider.generateSketchRender({
    sketchImageBuffer: sketchBuffer,
    mimeType: 'image/png',
    styleDescription,
    prompt: buildSketchRenderPrompt(styleDescription),
    numVariants: 2,
    depthMapBuffer: depthBuffer,
    cannyEdgeBuffer: cannyBuffer,
  });
  const renderAssets = await Promise.all(renderResult.images.map((img) => saveAsset(project.id, 'GENERATED_OUTPUT', img)));
  const jobC = await prisma.generationJob.create({
    data: {
      projectId: project.id,
      module: 'SKETCH_RENDER',
      status: 'DONE',
      provider: 'MOCK',
      providerModel: renderResult.providerModel,
      inputAssetId: sketch.id,
      styleDescription,
      resolvedPrompt: buildSketchRenderPrompt(styleDescription),
      numVariantsRequested: 2,
      depthMapAssetId: depthAsset.id,
      cannyMapAssetId: cannyAsset.id,
      estimatedCostUsd: 0,
      actualCostUsd: 0,
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });
  await prisma.$transaction(
    renderAssets.map((asset, index) =>
      prisma.generationVariant.create({
        data: { jobId: jobC.id, variantIndex: index, assetId: asset.id, isSelected: index === 0 },
      }),
    ),
  );

  // Module D: one pre-exported before/after comparison.
  await createComparisonExport(project.id, { beforeAssetId: photo.id, afterAssetId: enhancedAsset.id });

  console.log(`Seed hotový: projekt "${project.name}" (${project.id}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
