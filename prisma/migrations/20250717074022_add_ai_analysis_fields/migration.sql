-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('BUG', 'FEATURE', 'REVIEW');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- AlterTable
ALTER TABLE "feedback" ADD COLUMN     "aiAnalyzedAt" TIMESTAMP(3),
ADD COLUMN     "category" "FeedbackCategory",
ADD COLUMN     "categoryConfidence" DOUBLE PRECISION,
ADD COLUMN     "categoryOverridden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAiAnalyzed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "manualCategory" "FeedbackCategory",
ADD COLUMN     "manualSentiment" "Sentiment",
ADD COLUMN     "sentiment" "Sentiment",
ADD COLUMN     "sentimentConfidence" DOUBLE PRECISION,
ADD COLUMN     "sentimentOverridden" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "feedback_category_idx" ON "feedback"("category");

-- CreateIndex
CREATE INDEX "feedback_sentiment_idx" ON "feedback"("sentiment");

-- CreateIndex
CREATE INDEX "feedback_projectId_category_idx" ON "feedback"("projectId", "category");

-- CreateIndex
CREATE INDEX "feedback_projectId_sentiment_idx" ON "feedback"("projectId", "sentiment");

-- CreateIndex
CREATE INDEX "feedback_projectId_createdAt_category_idx" ON "feedback"("projectId", "createdAt", "category");
