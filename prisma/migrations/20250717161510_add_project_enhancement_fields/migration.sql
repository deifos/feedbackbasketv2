-- AlterTable
ALTER TABLE "project" ADD COLUMN     "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "lastAnalyzedAt" TIMESTAMP(3),
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "ogImageUrl" TEXT,
ADD COLUMN     "scrapedMetadata" JSONB;

-- CreateIndex
CREATE INDEX "project_aiGenerated_idx" ON "project"("aiGenerated");
