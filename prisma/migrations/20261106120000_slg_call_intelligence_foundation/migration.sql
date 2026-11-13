-- CreateEnum
CREATE TYPE "TenantPlanTier" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SlgCallType" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateEnum
CREATE TYPE "SlgCallStatus" AS ENUM ('CONNECTED', 'MISSED', 'REJECTED', 'UNANSWERED', 'BUSY', 'FAILED');

-- CreateEnum
CREATE TYPE "SlgCallSource" AS ENUM ('CLOUD_PBX', 'ANDROID_SIM', 'DESKTOP_SIP', 'MANUAL');

-- CreateEnum
CREATE TYPE "SlgStorageProvider" AS ENUM ('CLOUDFLARE_R2', 'AWS_S3', 'LOCAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "roleCode" "UserRoleCode" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "callingNumber" TEXT,
    "whatsappNumber" TEXT,
    "isLeadAccepting" BOOLEAN NOT NULL DEFAULT true,
    "dailyLeadQuota" INTEGER NOT NULL DEFAULT 50,
    "activeLeadsCount" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT,
    "tenantBranchId" TEXT,
    "tenantDepartmentId" TEXT,
    "reportingManagerId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiring_automation_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "trustPolicy" "HiringTrustPolicy" NOT NULL DEFAULT 'REVIEW_FIRST',
    "autoPublishMinScore" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "enableHinglishAi" BOOLEAN NOT NULL DEFAULT true,
    "rejectSuspicious" BOOLEAN NOT NULL DEFAULT true,
    "maxDailyIngestion" INTEGER NOT NULL DEFAULT 500,
    "webhookSecret" TEXT NOT NULL DEFAULT 'slg_hiring_wh_sec_2026',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_automation_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "department" "StaffDepartment" NOT NULL,
    "designation" TEXT NOT NULL,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseSalary" INTEGER NOT NULL,
    "profilePhoto" TEXT,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "personalPhone" TEXT,
    "personalEmail" TEXT,
    "residentialAddress" TEXT,
    "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "workLocation" TEXT NOT NULL DEFAULT 'PRAYAGRAJ_CAMPUS',
    "reportingManagerId" TEXT,
    "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bankAccountNumber" TEXT,
    "bankIfsc" TEXT,
    "panNumber" TEXT,
    "aadhaarMasked" TEXT,
    "isBankVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPanVerified" BOOLEAN NOT NULL DEFAULT false,
    "isAadhaarVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "shiftId" TEXT,
    "probationMonths" INTEGER DEFAULT 3,
    "branch" TEXT DEFAULT 'PRAYAGRAJ_MAIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_work_tasks" (
    "id" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "generationRunId" TEXT,
    "reportingDate" DATE NOT NULL,
    "department" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceReferenceId" TEXT,
    "assignedStaffId" TEXT NOT NULL,
    "reportingManagerId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "targetQuantity" INTEGER,
    "completedQuantity" INTEGER DEFAULT 0,
    "expectedOutcome" TEXT,
    "evidenceNotes" TEXT,
    "evidenceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "escalationReason" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_work_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_work_reports" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "staffId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "reportingManagerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "actualWorkSummary" TEXT NOT NULL,
    "resultsSummary" TEXT,
    "crmFollowUpsDone" INTEGER NOT NULL DEFAULT 0,
    "crmLeadsContacted" INTEGER NOT NULL DEFAULT 0,
    "crmAdmissionsDone" INTEGER NOT NULL DEFAULT 0,
    "nextDayPriorities" TEXT,
    "remarks" TEXT,
    "reviewerComments" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_work_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "gstin" TEXT,
    "planTier" "TenantPlanTier" NOT NULL DEFAULT 'PROFESSIONAL',
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "maxUsers" INTEGER NOT NULL DEFAULT 50,
    "maxStorageGb" INTEGER NOT NULL DEFAULT 100,
    "monthlyAiMinutesLimit" INTEGER NOT NULL DEFAULT 2000,
    "usedAiMinutesCurrentMonth" INTEGER NOT NULL DEFAULT 0,
    "customDomain" TEXT,
    "logoUrl" TEXT,
    "themePrimaryColor" TEXT DEFAULT '#10B981',
    "timeZone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "billingCycleStart" TIMESTAMP(3),
    "billingCycleEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_branches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geofenceRadiusMeters" INTEGER NOT NULL DEFAULT 150,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_departments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slg_call_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "departmentId" TEXT,
    "leadId" TEXT,
    "source" "SlgCallSource" NOT NULL DEFAULT 'CLOUD_PBX',
    "providerId" TEXT,
    "callType" "SlgCallType" NOT NULL DEFAULT 'OUTGOING',
    "callStatus" "SlgCallStatus" NOT NULL DEFAULT 'CONNECTED',
    "contactName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "agentPhone" TEXT NOT NULL,
    "virtualNumber" TEXT,
    "disposition" TEXT NOT NULL DEFAULT 'INTERESTED',
    "notes" TEXT,
    "nextFollowUpAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "talkTimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "isRecorded" BOOLEAN NOT NULL DEFAULT false,
    "isTranscribed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slg_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slg_call_recordings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callLogId" TEXT NOT NULL,
    "storageProvider" "SlgStorageProvider" NOT NULL DEFAULT 'CLOUDFLARE_R2',
    "storageKey" TEXT NOT NULL,
    "fileSizeBytes" BIGINT,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL DEFAULT 'audio/mp4',
    "checksumSha256" TEXT,
    "encryptionKeyId" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "playbacksCount" INTEGER NOT NULL DEFAULT 0,
    "downloadsCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slg_call_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slg_call_transcripts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callLogId" TEXT NOT NULL,
    "rawTranscript" JSONB NOT NULL,
    "fullText" TEXT NOT NULL,
    "languageDetected" TEXT NOT NULL DEFAULT 'en-IN',
    "sentimentScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "sentimentLabel" TEXT NOT NULL DEFAULT 'NEUTRAL',
    "summary" TEXT,
    "actionItems" JSONB,
    "objections" JSONB,
    "aiModelUsed" TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "confidenceScore" DOUBLE PRECISION DEFAULT 0.85,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slg_call_transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slg_daily_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "departmentId" TEXT,
    "reportDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "systemCallsTotal" INTEGER NOT NULL DEFAULT 0,
    "systemCallsConnected" INTEGER NOT NULL DEFAULT 0,
    "systemCallsMissed" INTEGER NOT NULL DEFAULT 0,
    "systemTalkTimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "systemAttendanceMinutes" INTEGER NOT NULL DEFAULT 0,
    "systemFollowUpsCompleted" INTEGER NOT NULL DEFAULT 0,
    "systemMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "workSummary" TEXT NOT NULL,
    "achievements" TEXT,
    "impediments" TEXT,
    "tomorrowActionPlan" TEXT,
    "reviewerId" TEXT,
    "reviewerFeedback" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "aiPerformanceInsight" TEXT,
    "aiSummary" TEXT,
    "pdfExportUrl" TEXT,
    "excelExportUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slg_daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slg_daily_report_items" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "taskTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "measurableResult" TEXT,
    "timeSpentMinutes" INTEGER DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slg_daily_report_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slg_daily_report_revisions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slg_daily_report_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slg_device_registrations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceUuid" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL DEFAULT 'ANDROID',
    "deviceModel" TEXT,
    "osVersion" TEXT,
    "appVersion" TEXT,
    "pushToken" TEXT,
    "isAuthorized" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentRecordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slg_device_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slg_whatsapp_messages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT,
    "customerPhone" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "messageType" TEXT NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "metaMessageId" TEXT,
    "templateName" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slg_whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slg_sms_messages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT,
    "recipientPhone" TEXT NOT NULL,
    "senderHeader" TEXT NOT NULL,
    "dltTemplateId" TEXT NOT NULL,
    "dltEntityId" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "providerGatewayId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slg_sms_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slg_audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slg_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_subscriptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planTier" "TenantPlanTier" NOT NULL DEFAULT 'PROFESSIONAL',
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "gateway" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "subscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "amountPaise" INTEGER NOT NULL DEFAULT 499900,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "gstAmountPaise" INTEGER NOT NULL DEFAULT 89982,
    "invoiceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_customDomain_key" ON "tenants"("customDomain");

-- CreateIndex
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "tenant_branches_tenantId_idx" ON "tenant_branches"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_branches_tenantId_code_key" ON "tenant_branches"("tenantId", "code");

-- CreateIndex
CREATE INDEX "tenant_departments_tenantId_idx" ON "tenant_departments"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_departments_tenantId_code_key" ON "tenant_departments"("tenantId", "code");

-- CreateIndex
CREATE INDEX "slg_call_logs_tenantId_startedAt_idx" ON "slg_call_logs"("tenantId", "startedAt");

-- CreateIndex
CREATE INDEX "slg_call_logs_tenantId_userId_idx" ON "slg_call_logs"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "slg_call_logs_customerPhone_idx" ON "slg_call_logs"("customerPhone");

-- CreateIndex
CREATE INDEX "slg_call_logs_callStatus_idx" ON "slg_call_logs"("callStatus");

-- CreateIndex
CREATE INDEX "slg_call_logs_disposition_idx" ON "slg_call_logs"("disposition");

-- CreateIndex
CREATE UNIQUE INDEX "slg_call_recordings_callLogId_key" ON "slg_call_recordings"("callLogId");

-- CreateIndex
CREATE INDEX "slg_call_recordings_tenantId_idx" ON "slg_call_recordings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "slg_call_transcripts_callLogId_key" ON "slg_call_transcripts"("callLogId");

-- CreateIndex
CREATE INDEX "slg_call_transcripts_tenantId_idx" ON "slg_call_transcripts"("tenantId");

-- CreateIndex
CREATE INDEX "slg_daily_reports_tenantId_reportDate_idx" ON "slg_daily_reports"("tenantId", "reportDate");

-- CreateIndex
CREATE INDEX "slg_daily_reports_status_idx" ON "slg_daily_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "slg_daily_reports_tenantId_userId_reportDate_key" ON "slg_daily_reports"("tenantId", "userId", "reportDate");

-- CreateIndex
CREATE INDEX "slg_daily_report_items_reportId_idx" ON "slg_daily_report_items"("reportId");

-- CreateIndex
CREATE INDEX "slg_daily_report_revisions_reportId_idx" ON "slg_daily_report_revisions"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "slg_device_registrations_deviceUuid_key" ON "slg_device_registrations"("deviceUuid");

-- CreateIndex
CREATE INDEX "slg_device_registrations_tenantId_userId_idx" ON "slg_device_registrations"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "slg_whatsapp_messages_metaMessageId_key" ON "slg_whatsapp_messages"("metaMessageId");

-- CreateIndex
CREATE INDEX "slg_whatsapp_messages_tenantId_customerPhone_idx" ON "slg_whatsapp_messages"("tenantId", "customerPhone");

-- CreateIndex
CREATE INDEX "slg_sms_messages_tenantId_recipientPhone_idx" ON "slg_sms_messages"("tenantId", "recipientPhone");

-- CreateIndex
CREATE INDEX "slg_audit_logs_tenantId_action_idx" ON "slg_audit_logs"("tenantId", "action");

-- CreateIndex
CREATE INDEX "slg_audit_logs_entityType_entityId_idx" ON "slg_audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_subscriptions_subscriptionId_key" ON "tenant_subscriptions"("subscriptionId");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_tenantId_idx" ON "tenant_subscriptions"("tenantId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantBranchId_fkey" FOREIGN KEY ("tenantBranchId") REFERENCES "tenant_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantDepartmentId_fkey" FOREIGN KEY ("tenantDepartmentId") REFERENCES "tenant_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_work_tasks" ADD CONSTRAINT "daily_work_tasks_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_work_reports" ADD CONSTRAINT "daily_work_reports_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_branches" ADD CONSTRAINT "tenant_branches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_departments" ADD CONSTRAINT "tenant_departments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_call_logs" ADD CONSTRAINT "slg_call_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_call_logs" ADD CONSTRAINT "slg_call_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_call_logs" ADD CONSTRAINT "slg_call_logs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "tenant_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_call_logs" ADD CONSTRAINT "slg_call_logs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "tenant_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_call_logs" ADD CONSTRAINT "slg_call_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_call_recordings" ADD CONSTRAINT "slg_call_recordings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_call_recordings" ADD CONSTRAINT "slg_call_recordings_callLogId_fkey" FOREIGN KEY ("callLogId") REFERENCES "slg_call_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_call_transcripts" ADD CONSTRAINT "slg_call_transcripts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_call_transcripts" ADD CONSTRAINT "slg_call_transcripts_callLogId_fkey" FOREIGN KEY ("callLogId") REFERENCES "slg_call_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_daily_reports" ADD CONSTRAINT "slg_daily_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_daily_reports" ADD CONSTRAINT "slg_daily_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_daily_reports" ADD CONSTRAINT "slg_daily_reports_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_daily_report_items" ADD CONSTRAINT "slg_daily_report_items_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "slg_daily_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_daily_report_revisions" ADD CONSTRAINT "slg_daily_report_revisions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "slg_daily_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_device_registrations" ADD CONSTRAINT "slg_device_registrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_device_registrations" ADD CONSTRAINT "slg_device_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_whatsapp_messages" ADD CONSTRAINT "slg_whatsapp_messages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_sms_messages" ADD CONSTRAINT "slg_sms_messages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_audit_logs" ADD CONSTRAINT "slg_audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slg_audit_logs" ADD CONSTRAINT "slg_audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
