-- CreateTable
CREATE TABLE "webhook_event" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_event_stripeEventId_key" ON "webhook_event"("stripeEventId");

-- CreateIndex
CREATE INDEX "webhook_event_stripeEventId_idx" ON "webhook_event"("stripeEventId");

-- CreateIndex
CREATE INDEX "webhook_event_eventType_idx" ON "webhook_event"("eventType");

-- CreateIndex
CREATE INDEX "webhook_event_processed_idx" ON "webhook_event"("processed");

-- CreateIndex
CREATE INDEX "webhook_event_createdAt_idx" ON "webhook_event"("createdAt");
