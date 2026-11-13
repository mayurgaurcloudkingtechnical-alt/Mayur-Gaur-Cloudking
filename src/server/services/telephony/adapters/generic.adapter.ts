import * as crypto from "crypto";
import { db } from "@/server/db/client";
import { RateLimiter } from "@/server/lib/rate-limiter";
import { SlgCallType, SlgCallStatus, SlgCallSource } from "@prisma/client";
import {
  TelephonyProviderAdapter,
  NormalizedCallEvent,
  WebhookVerificationRequest,
  WebhookVerificationResult,
  ProviderHealthStatus,
} from "../types";

export class GenericCdrAdapter implements TelephonyProviderAdapter {
  readonly providerName = "GENERIC" as const;
  private static readonly MAX_DRIFT_SECONDS = 300;

  isConfigured(): boolean {
    return !!(process.env.TELEPHONY_WEBHOOK_SECRET || process.env.AUTH_SECRET);
  }

  async verifySignature(req: WebhookVerificationRequest): Promise<WebhookVerificationResult> {
    const clientIp = req.clientIp || "127.0.0.1";

    // 1. Rate Limiting (120/min per IP)
    const rateLimitKey = `webhook:cdr:${clientIp}`;
    if (!RateLimiter.check(rateLimitKey, 120, 60)) {
      return { isValid: false, statusCode: 429, error: "Rate limit exceeded" };
    }

    const signature = req.headers["x-slg-signature"];
    const timestampStr = req.headers["x-slg-timestamp"];
    const tenantSlug = req.headers["x-slg-tenant"];

    if (!signature || !timestampStr || !tenantSlug) {
      return { isValid: false, statusCode: 401, error: "Missing required security headers" };
    }

    // 2. Replay Protection: 300s Drift Guard
    const timestamp = parseInt(timestampStr, 10);
    const now = Math.floor(Date.now() / 1000);
    if (isNaN(timestamp) || Math.abs(now - timestamp) > GenericCdrAdapter.MAX_DRIFT_SECONDS) {
      return { isValid: false, statusCode: 401, error: "Webhook timestamp expired or out of acceptable window" };
    }

    // 3. Resolve Tenant
    const tenant = await db.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, status: true },
    });

    if (!tenant || tenant.status !== "ACTIVE") {
      return { isValid: false, statusCode: 404, error: "Target tenant not found or inactive" };
    }

    // 4. Cryptographic HMAC-SHA256 Timing-Safe Evaluation
    const secret = process.env.TELEPHONY_WEBHOOK_SECRET || process.env.AUTH_SECRET || "default_slg_webhook_secret_key_32";
    const expectedPayload = `${timestampStr}.${req.rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(expectedPayload)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return { isValid: false, statusCode: 401, error: "Invalid webhook signature" };
    }

    return { isValid: true, tenantId: tenant.id };
  }

  normalizeEvent(rawPayload: Record<string, any>, tenantId: string): NormalizedCallEvent {
    const startedAt = rawPayload.startedAt ? new Date(rawPayload.startedAt) : new Date();
    const durationSeconds = typeof rawPayload.durationSeconds === "number" ? rawPayload.durationSeconds : 0;
    const talkTimeSeconds = typeof rawPayload.talkTimeSeconds === "number" ? rawPayload.talkTimeSeconds : durationSeconds;

    return {
      eventId: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      provider: "GENERIC",
      providerAccountId: rawPayload.providerAccountId,
      providerCallId: String(rawPayload.providerId || `cdr_${Date.now()}`),
      tenantId,
      source: (rawPayload.source as SlgCallSource) || SlgCallSource.CLOUD_PBX,
      callType: (rawPayload.callType as SlgCallType) || SlgCallType.OUTGOING,
      callStatus: (rawPayload.callStatus as SlgCallStatus) || SlgCallStatus.CONNECTED,
      contactName: rawPayload.contactName || "Direct Contact",
      customerPhone: rawPayload.customerPhone || "UNKNOWN",
      agentPhone: rawPayload.agentPhone || "DESKTOP",
      virtualNumber: rawPayload.virtualNumber,
      startedAt,
      connectedAt: rawPayload.connectedAt ? new Date(rawPayload.connectedAt) : undefined,
      endedAt: rawPayload.endedAt ? new Date(rawPayload.endedAt) : undefined,
      durationSeconds,
      talkTimeSeconds,
      disposition: rawPayload.disposition || "INTERESTED",
      notes: rawPayload.notes,
      audioRecordingUrl: rawPayload.audioRecordingUrl || undefined,
      audioFileSizeBytes: rawPayload.audioFileSizeBytes,
      rawPayloadMetadata: rawPayload,
    };
  }

  getHealthStatus(): ProviderHealthStatus {
    const configured = this.isConfigured();
    return {
      provider: "GENERIC",
      isConfigured: configured,
      status: configured ? "ONLINE" : "UNCONFIGURED",
      authType: "HMAC_SHA256",
      lastVerifiedAt: new Date(),
      details: configured ? "Operational with HMAC-SHA256 & 300s anti-replay" : "TELEPHONY_WEBHOOK_SECRET missing",
    };
  }
}
