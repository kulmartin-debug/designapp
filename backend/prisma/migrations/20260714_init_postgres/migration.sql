-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('FOTO_SUCASNY_STAV', 'PODORYS', 'NAVRH_SKETCHUP', 'DERIVED_DEPTH_MAP', 'DERIVED_CANNY_EDGE', 'GENERATED_OUTPUT', 'EXPORT_COMPARISON');

-- CreateEnum
CREATE TYPE "JobModule" AS ENUM ('CURRENT_STATE_ENHANCE', 'SKETCH_RENDER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProviderCheckStatus" AS ENUM ('OK', 'FAILED');

-- CreateEnum
CREATE TYPE "ProviderName" AS ENUM ('REPLICATE', 'FAL', 'GEMINI', 'MOCK');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFilename" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "module" "JobModule" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "ProviderName" NOT NULL,
    "providerModel" TEXT,
    "inputAssetId" TEXT NOT NULL,
    "styleDescription" TEXT,
    "resolvedPrompt" TEXT NOT NULL,
    "numVariantsRequested" INTEGER NOT NULL DEFAULT 1,
    "depthMapAssetId" TEXT,
    "cannyMapAssetId" TEXT,
    "estimatedCostUsd" DOUBLE PRECISION NOT NULL,
    "actualCostUsd" DOUBLE PRECISION,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationVariant" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "variantIndex" INTEGER NOT NULL,
    "assetId" TEXT NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonExport" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "beforeAssetId" TEXT NOT NULL,
    "afterAssetId" TEXT NOT NULL,
    "resultAssetId" TEXT NOT NULL,
    "beforeLabel" TEXT NOT NULL DEFAULT 'PRED',
    "afterLabel" TEXT NOT NULL DEFAULT 'PO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCredential" (
    "id" TEXT NOT NULL,
    "provider" "ProviderName" NOT NULL,
    "apiKey" TEXT,
    "lastStatus" "ProviderCheckStatus",
    "lastCheckedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_projectId_category_idx" ON "Asset"("projectId", "category");

-- CreateIndex
CREATE INDEX "GenerationJob_projectId_status_idx" ON "GenerationJob"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationVariant_jobId_variantIndex_key" ON "GenerationVariant"("jobId", "variantIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCredential_provider_key" ON "ProviderCredential"("provider");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_inputAssetId_fkey" FOREIGN KEY ("inputAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_depthMapAssetId_fkey" FOREIGN KEY ("depthMapAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_cannyMapAssetId_fkey" FOREIGN KEY ("cannyMapAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationVariant" ADD CONSTRAINT "GenerationVariant_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "GenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationVariant" ADD CONSTRAINT "GenerationVariant_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonExport" ADD CONSTRAINT "ComparisonExport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonExport" ADD CONSTRAINT "ComparisonExport_beforeAssetId_fkey" FOREIGN KEY ("beforeAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonExport" ADD CONSTRAINT "ComparisonExport_afterAssetId_fkey" FOREIGN KEY ("afterAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonExport" ADD CONSTRAINT "ComparisonExport_resultAssetId_fkey" FOREIGN KEY ("resultAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

