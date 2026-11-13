-- AlterTable
ALTER TABLE "slg_call_logs" ADD COLUMN     "followUpAssignedToId" TEXT,
ADD COLUMN     "isCustomerMatched" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isEmployeeMatched" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "provider" TEXT DEFAULT 'GENERIC',
ADD COLUMN     "providerAccountId" TEXT,
ADD COLUMN     "rawMetadata" JSONB;

-- AlterTable
ALTER TABLE "slg_call_recordings" ADD COLUMN     "consentRecorded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "providerRecordingId" TEXT;

-- CreateIndex
CREATE INDEX "slg_call_logs_tenantId_providerId_idx" ON "slg_call_logs"("tenantId", "providerId");
