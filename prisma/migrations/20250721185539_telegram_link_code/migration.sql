-- AlterTable
ALTER TABLE "user" ADD COLUMN     "telegramChatId" TEXT,
ADD COLUMN     "telegramLinkCode" TEXT,
ADD COLUMN     "telegramLinkCodeExp" TIMESTAMP(3);
