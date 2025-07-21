-- AlterTable
ALTER TABLE "project" ADD COLUMN     "telegramNotifications" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "telegramHandle" TEXT;
