/**
 * Unified Communication Intelligence (Phase 4.1) — Core Types & Interfaces
 * SLG CALL INTELLIGENCE — Powered by SOFTLAB GLOBAL
 * Strict boundary: File size <= 350 lines
 */

export enum SlgChannelType {
  VOICE = "VOICE",
  WHATSAPP = "WHATSAPP",
  SMS = "SMS",
  EMAIL = "EMAIL",
}

export enum SlgMessageDirection {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
}

export enum SlgMessageStatus {
  QUEUED = "QUEUED",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
  UNDELIVERED = "UNDELIVERED",
}

export enum SlgThreadStatus {
  OPEN = "OPEN",
  ASSIGNED = "ASSIGNED",
  WAITING_CUSTOMER = "WAITING_CUSTOMER",
  RESOLVED = "RESOLVED",
  AUTO_CLOSED = "AUTO_CLOSED",
}

export interface WhatsAppConfigInput {
  phoneNumberId: string;
  wabaId: string;
  displayPhoneNumber: string;
  accessToken: string; // Plaintext on input, encrypted at rest
  webhookVerifyToken: string;
  appSecret: string;
}

export interface WhatsAppConfigRecord {
  id: string;
  tenantId: string;
  phoneNumberId: string;
  wabaId: string;
  displayPhoneNumber: string;
  webhookVerifyToken: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SmsGatewayConfigInput {
  primaryProvider: string;
  backupProvider?: string;
  dltEntityId?: string;
  defaultSenderId: string;
  apiKey?: string; // Plaintext on input, encrypted at rest
  apiSecret?: string;
  webhookSecret: string;
  isActive?: boolean;
}

export interface SmsGatewayConfigRecord {
  id: string;
  tenantId: string;
  primaryProvider: string;
  backupProvider: string | null;
  dltEntityId: string | null;
  defaultSenderId: string;
  webhookSecret: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppTemplateDefinition {
  id?: string;
  tenantId: string;
  templateName: string;
  language: string;
  category: "AUTHENTICATION" | "MARKETING" | "UTILITY";
  metaTemplateId?: string | null;
  status: "APPROVED" | "PENDING" | "REJECTED" | "PAUSED";
  headerType?: "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO" | null;
  bodyText: string;
  footerText?: string | null;
  buttonsJson?: any;
  variableMappings?: Record<string, string>;
}

export interface NormalizedMessageEvent {
  externalMessageId?: string;
  threadId?: string;
  channel: SlgChannelType;
  direction: SlgMessageDirection;
  status: SlgMessageStatus;
  senderPhone: string;
  recipientPhone: string;
  messageBody: string;
  templateName?: string;
  templateParams?: Record<string, any>;
  mediaUrl?: string;
  mediaMimeType?: string;
  mediaSizeBytes?: number;
  errorCode?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  rawMetadata?: Record<string, any>;
}

export interface SendMessageInput {
  tenantId: string;
  channel: SlgChannelType;
  recipientPhone: string;
  messageBody?: string;
  templateName?: string;
  templateParams?: Record<string, any>;
  mediaUrl?: string;
  mediaMimeType?: string;
}

export interface SendMessageResult {
  success: boolean;
  externalMessageId?: string;
  channel: SlgChannelType;
  status: SlgMessageStatus;
  errorCode?: string;
  errorMessage?: string;
}

export interface ConversationThreadFilter {
  status?: SlgThreadStatus;
  assignedUserId?: string;
  search?: string;
  channel?: SlgChannelType;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface ServiceWindowStatus {
  isWindowOpen: boolean;
  windowExpiresAt: Date | null;
  remainingMinutes: number;
  canSendFreeForm: boolean;
}

export interface IWhatsAppProvider {
  readonly providerName: string;
  verifyWebhook(signature: string, rawBody: string, appSecret: string): boolean;
  sendMessage(config: WhatsAppConfigRecord, decryptedToken: string, input: SendMessageInput): Promise<SendMessageResult>;
  parseInboundWebhook(body: any): NormalizedMessageEvent[];
}

export interface ISmsProvider {
  readonly providerName: string;
  sendSms(config: SmsGatewayConfigRecord, decryptedApiKey: string | null, input: SendMessageInput): Promise<SendMessageResult>;
  verifyWebhook(signature: string, rawBody: string, webhookSecret: string): boolean;
  parseDeliveryReceipt(body: any): { externalMessageId: string; status: SlgMessageStatus; deliveredAt?: Date; errorCode?: string };
}
