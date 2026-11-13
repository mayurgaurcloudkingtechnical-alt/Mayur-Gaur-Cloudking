import { db } from "@/server/db/client";
import { SlgCallType, SlgCallStatus, SlgCallSource } from "@prisma/client";
import {
  TelephonyProviderAdapter,
  NormalizedCallEvent,
  WebhookVerificationRequest,
  WebhookVerificationResult,
  ProviderHealthStatus,
} from "../types";

export class ExotelAdapter implements TelephonyProviderAdapter {
  readonly providerName = "EXOTEL" as const;

  isConfigured(): boolean {
    return !!process.env.EXOTEL_TOKEN;
  }

  async verifySignature(req: WebhookVerificationRequest): Promise<WebhookVerificationResult> {
    const exotelToken = process.env.EXOTEL_TOKEN;
    if (!exotelToken) {
      return {
        isValid: false,
        statusCode: 503,
        error: "Exotel telephony provider integration is unconfigured in this environment.",
      };
    }

    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return { isValid: false, statusCode: 401, error: "Missing Exotel authorization header" };
    }

    const cleanHeader = authHeader.replace(/^Bearer\s+/i, "").replace(/^Basic\s+/i, "").trim();
    if (cleanHeader !== exotelToken.trim()) {
      return { isValid: false, statusCode: 401, error: "Invalid Exotel webhook authorization token" };
    }

    // Resolve tenant from query param or header
    const tenantSlug = req.params?.tenant || req.headers["x-slg-tenant"] || "softlab";
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
    const callSid = String(rawPayload.CallSid || rawPayload.Sid || `exo_${Date.now()}`);
    const rawStatus = String(rawPayload.Status || rawPayload.DialCallStatus || "completed").toLowerCase();
    const duration = parseInt(String(rawPayload.Duration || rawPayload.DialCallDuration || "0"), 10);
    const from = String(rawPayload.From || rawPayload.CallFrom || "UNKNOWN");
    const to = String(rawPayload.To || rawPayload.CallTo || rawPayload.DialWhomNumber || "UNKNOWN");
    const recordingUrl = rawPayload.RecordingUrl ? String(rawPayload.RecordingUrl) : undefined;

    let callStatus: SlgCallStatus = SlgCallStatus.CONNECTED;
    if (rawStatus === "busy") callStatus = SlgCallStatus.BUSY;
    else if (rawStatus === "no-answer" || rawStatus === "canceled") callStatus = SlgCallStatus.MISSED;
    else if (rawStatus === "failed") callStatus = SlgCallStatus.FAILED;

    // Exotel outbound click-to-call vs inbound
    const isOutbound = rawPayload.Direction ? rawPayload.Direction === "outbound" : true;

    return {
      eventId: `exo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      provider: "EXOTEL",
      providerAccountId: process.env.EXOTEL_SUBDOMAIN || rawPayload.AccountSid,
      providerCallId: callSid,
      tenantId,
      source: SlgCallSource.CLOUD_PBX,
      callType: isOutbound ? SlgCallType.OUTGOING : SlgCallType.INCOMING,
      callStatus,
      contactName: rawPayload.contactName || (isOutbound ? "Exotel Prospect" : "Inbound Caller"),
      customerPhone: isOutbound ? to : from,
      agentPhone: isOutbound ? from : to,
      virtualNumber: rawPayload.ExoPhone || rawPayload.virtualNumber,
      startedAt: rawPayload.StartTime ? new Date(rawPayload.StartTime) : new Date(),
      connectedAt: callStatus === SlgCallStatus.CONNECTED ? new Date() : undefined,
      endedAt: rawPayload.EndTime ? new Date(rawPayload.EndTime) : new Date(),
      durationSeconds: duration,
      talkTimeSeconds: duration,
      disposition: callStatus === SlgCallStatus.CONNECTED ? "CONNECTED" : "UNANSWERED",
      notes: rawPayload.notes || rawPayload.CustomField,
      audioRecordingUrl: recordingUrl,
      rawPayloadMetadata: rawPayload,
    };
  }

  getHealthStatus(): ProviderHealthStatus {
    const configured = this.isConfigured();
    return {
      provider: "EXOTEL",
      isConfigured: configured,
      status: configured ? "ONLINE" : "UNCONFIGURED",
      authType: "TOKEN",
      lastVerifiedAt: new Date(),
      details: configured
        ? "Exotel Cloud PBX adapter ready for live webhook ingestion"
        : "EXOTEL_TOKEN not provided in environment configuration",
    };
  }
}
