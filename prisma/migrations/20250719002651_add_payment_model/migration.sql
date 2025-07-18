-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCEEDED', 'FAILED', 'PENDING', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeSubscriptionId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "PaymentStatus" NOT NULL,
    "planAtPayment" "SubscriptionPlan" NOT NULL,
    "billingCycle" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "failureReason" TEXT,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_stripeInvoiceId_key" ON "payment"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "payment_userId_idx" ON "payment"("userId");

-- CreateIndex
CREATE INDEX "payment_status_idx" ON "payment"("status");

-- CreateIndex
CREATE INDEX "payment_paidAt_idx" ON "payment"("paidAt");

-- CreateIndex
CREATE INDEX "payment_planAtPayment_idx" ON "payment"("planAtPayment");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
