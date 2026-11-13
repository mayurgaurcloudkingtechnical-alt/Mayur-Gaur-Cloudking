-- Phase 4: Unified Communications Foundation Migration
-- Creates conversation threads, message events, WhatsApp configs & templates, SMS configs, and thread notes

-- CreateTable: slg_conversation_threads
CREATE TABLE IF NOT EXISTS "slg_conversation_threads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT,
    "studentId" TEXT,
    "assignedUserId" TEXT,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "lastChannel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageSnippet" VARCHAR(500),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "isAiHandled" BOOLEAN NOT NULL DEFAULT false,
    "lastAiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slg_conversation_threads_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "slg_conversation_threads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "slg_conversation_threads_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "slg_conversation_threads_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "slg_conversation_threads_tenant_phone_idx" ON "slg_conversation_threads"("tenantId", "customerPhone");
CREATE INDEX IF NOT EXISTS "slg_conversation_threads_tenant_assigned_idx" ON "slg_conversation_threads"("tenantId", "assignedUserId");
CREATE INDEX IF NOT EXISTS "slg_conversation_threads_tenant_status_idx" ON "slg_conversation_threads"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "slg_conversation_threads_tenant_lastMsg_idx" ON "slg_conversation_threads"("tenantId", "lastMessageAt");

-- CreateTable: slg_message_events
CREATE TABLE IF NOT EXISTS "slg_message_events" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "senderPhone" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "messageBody" TEXT NOT NULL,
    "templateName" TEXT,
    "templateParams" JSONB,
    "externalMessageId" TEXT,
    "mediaUrl" TEXT,
    "mediaMimeType" TEXT,
    "mediaSizeBytes" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "rawMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slg_message_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "slg_message_events_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "slg_conversation_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "slg_message_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "slg_message_events_thread_created_idx" ON "slg_message_events"("threadId", "createdAt");
CREATE INDEX IF NOT EXISTS "slg_message_events_tenant_external_idx" ON "slg_message_events"("tenantId", "externalMessageId");
CREATE INDEX IF NOT EXISTS "slg_message_events_tenant_recipient_idx" ON "slg_message_events"("tenantId", "recipientPhone");

-- CreateTable: slg_whatsapp_configs
CREATE TABLE IF NOT EXISTS "slg_whatsapp_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "wabaId" TEXT NOT NULL,
    "displayPhoneNumber" TEXT NOT NULL,
    "encryptedAccessToken" TEXT NOT NULL,
    "webhookVerifyToken" TEXT NOT NULL,
    "appSecretHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slg_whatsapp_configs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "slg_whatsapp_configs_tenantId_key" UNIQUE ("tenantId"),
    CONSTRAINT "slg_whatsapp_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: slg_whatsapp_templates
CREATE TABLE IF NOT EXISTS "slg_whatsapp_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "category" TEXT NOT NULL DEFAULT 'UTILITY',
    "metaTemplateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "headerType" TEXT,
    "bodyText" TEXT NOT NULL,
    "footerText" TEXT,
    "buttonsJson" JSONB,
    "variableMappings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slg_whatsapp_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "slg_whatsapp_templates_tenant_template_key" UNIQUE ("tenantId", "templateName", "language"),
    CONSTRAINT "slg_whatsapp_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: slg_sms_gateway_configs
CREATE TABLE IF NOT EXISTS "slg_sms_gateway_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "primaryProvider" TEXT NOT NULL DEFAULT 'EXOTEL_SMS',
    "backupProvider" TEXT,
    "dltEntityId" TEXT,
    "defaultSenderId" TEXT NOT NULL DEFAULT 'SFTLAB',
    "encryptedApiKey" TEXT,
    "encryptedApiSecret" TEXT,
    "webhookSecret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slg_sms_gateway_configs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "slg_sms_gateway_configs_tenantId_key" UNIQUE ("tenantId"),
    CONSTRAINT "slg_sms_gateway_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: slg_thread_notes
CREATE TABLE IF NOT EXISTS "slg_thread_notes" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "noteText" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slg_thread_notes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "slg_thread_notes_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "slg_conversation_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "slg_thread_notes_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "slg_thread_notes_thread_created_idx" ON "slg_thread_notes"("threadId", "createdAt");
