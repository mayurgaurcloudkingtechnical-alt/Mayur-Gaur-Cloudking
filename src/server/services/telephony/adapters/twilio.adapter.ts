import * as crypto from "crypto";
import { db } from "@/server/db/client";
import { SlgCallType, SlgCallStatus, SlgCallSource } from "@prisma/client";
import {
  TelephonyProviderAdapter,
  NormalizedCallEvent,
  WebhookVerificationRequest,
  WebhookVerificationResult,
  ProviderHealthStatus,
} from "../types";

export class TwilioAdapter implements TelephonyProviderAdapter {
  readonly providerName = "TWILIO" as const;

  isConfigured(): boolean {
    return !!process.env.TWILIO_AUTH_TOKEN;
  }

  async verifySignature(req: WebhookVerificationRequest): Promise<WebhookVerificationResult> {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      return {
        isValid: false,
        statusCode: 503,
        error: "Twilio telephony provider integration is unconfigured in this environment.",
      };
    }

    const twilioSignature = req.headers["x-twilio-signature"];
    if (!twilioSignature) {
      return { isValid: false, statusCode: 401, error: "Missing Twilio signature header (X-Twilio-Signature)" };
    }

    // Canonicalize URL and sorted parameters per Twilio specification
    const params = req.params || {};
    let data = req.url;
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
      data += `${key}${params[key]}`;
    }

    const expectedSignature = crypto
      .createHmac("sha1", authToken)
      .update(Buffer.from(data, "utf8"))
      .digest("base64");

    const sigBuf = Buffer.from(twilioSignature, "utf8");
    const expBuf = Buffer.from(expectedSignature, "utf8");

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { isValid: false, statusCode: 401, error: "Invalid Twilio cryptographic signature" };
    }

    // Resolve tenant from query param or header
    const tenantSlug = params.tenant || req.headers["x-slg-tenant"] || "softlab";
    const tenant = await db.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, status: true },
    });

    if (!tenant || tenant.status !== "ACTIVE") {
      return { isValid: false, statusCode: 404, error: "Tenant not found or inactive" };
    }

    return { isValid: true, tenantId: tenant.id };
  }

  normalizeEvent(rawPayload: Record<string, any>, tenantId: string): NormalizedCallEvent {
    const callSid = String(rawPayload.CallSid || `twi_${Date.now()}`);
    const status = String(rawPayload.CallStatus || "completed").toLowerCase();
    const duration = parseInt(String(rawPayload.CallDuration || "0"), 10);
    const from = String(rawPayload.From || "UNKNOWN");
    const to = String(rawPayload.To || "UNKNOWN");
    const direction = String(rawPayload.Direction || "outbound-api").toLowerCase();
    const isInbound = direction.includes("inbound");

    let callStatus: SlgCallStatus = SlgCallStatus.CONNECTED;
    if (status === "no-answer" || status === "canceled") callStatus = SlgCallStatus.MISSED;
    else if (status === "busy") callStatus = SlgCallStatus.BUSY;
    else if (status === "failed") callStatus = SlgCallStatus.FAILED;

    return {
      eventId: `twi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      provider: "TWILIO",
      providerAccountId: String(rawPayload.AccountSid || process.env.TWILIO_ACCOUNT_SID || ""),
      providerCallId: callSid,
      tenantId,
      source: SlgCallSource.CLOUD_PBX,
      callType: isInbound ? SlgCallType.INCOMING : SlgCallType.OUTGOING,
      callStatus,
      contactName: isInbound ? "Twilio Inbound Caller" : "Twilio Customer Contact",
      customerPhone: isInbound ? from : to,
      agentPhone: isInbound ? to : from,
      virtualNumber: rawPayload.Called || rawPayload.To,
      startedAt: rawPayload.Timestamp ? new Date(rawPayload.Timestamp) : new Date(),
      connectedAt: callStatus === SlgCallStatus.CONNECTED ? new Date() : undefined,
      endedAt: new Date(),
      durationSeconds: duration,
      talkTimeSeconds: duration,
      disposition: callStatus === SlgCallStatus.CONNECTED ? "CONNECTED" : "UNANSWERED",
      notes: rawPayload.notes,
      audioRecordingUrl: rawPayload.RecordingUrl ? String(rawPayload.RecordingUrl) : undefined,
      rawPayloadMetadata: rawPayload,
    };
  }

  getHealthStatus(): ProviderHealthStatus {
    const configured = this.isConfigured();
    return {
      provider: "TWILIO",
      isConfigured: configured,
      status: configured ? "ONLINE" : "UNCONFIGURED",
      authType: "HMAC_SHA1",
      lastVerifiedAt: new Date(),
      details: configured
        ? "Twilio Voice adapter operational with X-Twilio-Signature HMAC-SHA1"
        : "TWILIO_AUTH_TOKEN not provided in environment configuration",
    };
  }
}
