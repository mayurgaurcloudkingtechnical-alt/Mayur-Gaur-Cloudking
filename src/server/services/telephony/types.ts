import { SlgCallType, SlgCallStatus, SlgCallSource } from "@prisma/client";

export type SupportedTelephonyProvider = "EXOTEL" | "TWILIO" | "GENERIC";

export interface NormalizedCallEvent {
  eventId: string;
  provider: SupportedTelephonyProvider | string;
  providerAccountId?: string;
  providerCallId: string;
  tenantId: string;
  source: SlgCallSource;
  callType: SlgCallType;
  callStatus: SlgCallStatus;
  contactName: string;
  customerPhone: string; // E.164
  agentPhone: string;
  virtualNumber?: string;
  startedAt: Date;
  connectedAt?: Date;
  endedAt?: Date;
  durationSeconds: number;
  talkTimeSeconds: number;
  disposition?: string;
  notes?: string;
  audioRecordingUrl?: string;
  audioFileSizeBytes?: number;
  rawPayloadMetadata?: Record<string, any>;
}

export interface WebhookVerificationRequest {
  rawBody: string;
  url: string;
  headers: Record<string, string | null>;
  params?: Record<string, string>;
  clientIp?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  tenantId?: string;
  error?: string;
  statusCode?: number;
}

export interface ProviderHealthStatus {
  provider: SupportedTelephonyProvider | string;
  isConfigured: boolean;
  status: "ONLINE" | "UNCONFIGURED" | "DEGRADED" | "ERROR";
  authType: "HMAC_SHA256" | "HMAC_SHA1" | "TOKEN";
  lastVerifiedAt?: Date;
  details?: string;
}

export interface TelephonyProviderAdapter {
  readonly providerName: SupportedTelephonyProvider;
  isConfigured(): boolean;
  verifySignature(req: WebhookVerificationRequest): Promise<WebhookVerificationResult>;
  normalizeEvent(rawPayload: Record<string, any>, tenantId: string): NormalizedCallEvent;
  getHealthStatus(): ProviderHealthStatus;
}
