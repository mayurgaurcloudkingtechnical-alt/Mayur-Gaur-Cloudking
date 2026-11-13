-- AlterTable
ALTER TABLE "slg_device_registrations" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedByUserId" TEXT,
ADD COLUMN     "deviceFingerprint" TEXT,
ADD COLUMN     "deviceName" TEXT,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "revocationReason" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedByUserId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
ADD COLUMN     "suspiciousActivityAlerts" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "canAccessDesktop" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "canAccessMobile" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "slgOnboardedAt" TIMESTAMP(3),
ADD COLUMN     "slgOnboardedById" TEXT;

-- CreateIndex
CREATE INDEX "slg_device_registrations_tenantId_status_idx" ON "slg_device_registrations"("tenantId", "status");
