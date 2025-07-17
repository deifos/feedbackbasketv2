-- CreateIndex
CREATE INDEX "feedback_projectId_idx" ON "feedback"("projectId");

-- CreateIndex
CREATE INDEX "feedback_status_idx" ON "feedback"("status");

-- CreateIndex
CREATE INDEX "feedback_projectId_status_idx" ON "feedback"("projectId", "status");

-- CreateIndex
CREATE INDEX "feedback_projectId_createdAt_idx" ON "feedback"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "feedback_createdAt_idx" ON "feedback"("createdAt");

-- CreateIndex
CREATE INDEX "feedback_ipAddress_createdAt_idx" ON "feedback"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "project_userId_idx" ON "project"("userId");

-- CreateIndex
CREATE INDEX "project_userId_updatedAt_idx" ON "project"("userId", "updatedAt");
