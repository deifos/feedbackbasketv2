-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STARTER', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'UNPAID');

-- AlterTable
ALTER TABLE "feedback" ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "visibilityRank" INTEGER;

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "feedbackUsedThisPeriod" INTEGER NOT NULL DEFAULT 0,
    "projectCount" INTEGER NOT NULL DEFAULT 0,
    "feedbackLimit" INTEGER NOT NULL DEFAULT 100,
    "projectLimit" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_period" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "feedbackCount" INTEGER NOT NULL DEFAULT 0,
    "feedbackLimit" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_period_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_userId_key" ON "subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripeCustomerId_key" ON "subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripeSubscriptionId_key" ON "subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscription_userId_idx" ON "subscription"("userId");

-- CreateIndex
CREATE INDEX "subscription_stripeCustomerId_idx" ON "subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "subscription_stripeSubscriptionId_idx" ON "subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "usage_period_userId_periodStart_idx" ON "usage_period"("userId", "periodStart");

-- CreateIndex
CREATE INDEX "feedback_projectId_isVisible_createdAt_idx" ON "feedback"("projectId", "isVisible", "createdAt");

-- CreateIndex
CREATE INDEX "feedback_projectId_visibilityRank_idx" ON "feedback"("projectId", "visibilityRank");

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_period" ADD CONSTRAINT "usage_period_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
