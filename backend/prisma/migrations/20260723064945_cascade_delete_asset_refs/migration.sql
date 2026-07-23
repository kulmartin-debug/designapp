-- DropForeignKey
ALTER TABLE "ComparisonExport" DROP CONSTRAINT "ComparisonExport_afterAssetId_fkey";

-- DropForeignKey
ALTER TABLE "ComparisonExport" DROP CONSTRAINT "ComparisonExport_beforeAssetId_fkey";

-- DropForeignKey
ALTER TABLE "ComparisonExport" DROP CONSTRAINT "ComparisonExport_resultAssetId_fkey";

-- DropForeignKey
ALTER TABLE "GenerationJob" DROP CONSTRAINT "GenerationJob_inputAssetId_fkey";

-- DropForeignKey
ALTER TABLE "GenerationVariant" DROP CONSTRAINT "GenerationVariant_assetId_fkey";

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_inputAssetId_fkey" FOREIGN KEY ("inputAssetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationVariant" ADD CONSTRAINT "GenerationVariant_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonExport" ADD CONSTRAINT "ComparisonExport_beforeAssetId_fkey" FOREIGN KEY ("beforeAssetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonExport" ADD CONSTRAINT "ComparisonExport_afterAssetId_fkey" FOREIGN KEY ("afterAssetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonExport" ADD CONSTRAINT "ComparisonExport_resultAssetId_fkey" FOREIGN KEY ("resultAssetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
