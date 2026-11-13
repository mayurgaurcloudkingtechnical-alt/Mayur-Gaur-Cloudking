import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { WebhookVerifierService } from "@/server/services/telephony/webhook-verifier.service";
import { SlgCallIntelligenceService } from "@/server/services/slg-call-intelligence.service";
import { SlgCallSource, SlgCallType, SlgCallStatus } from "@prisma/client";

const cdrPayloadSchema = z.object({
  providerId: z.string().min(1, "Provider ID required"),
  source: z.enum(["CLOUD_PBX", "ANDROID_SIM", "DESKTOP_SIP"]).default("CLOUD_PBX"),
  callType: z.enum(["INCOMING", "OUTGOING"]),
  callStatus: z.enum(["CONNECTED", "MISSED", "REJECTED", "UNANSWERED", "BUSY", "FAILED"]),
  contactName: z.string().default("Unknown Caller"),
  customerPhone: z.string().min(5),
  agentPhone: z.string().min(5),
  virtualNumber: z.string().optional(),
  startedAt: z.string().datetime().or(z.string().transform((v) => new Date(v).toISOString())),
  connectedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  durationSeconds: z.number().int().min(0).default(0),
  talkTimeSeconds: z.number().int().min(0).default(0),
  disposition: z.string().optional(),
  notes: z.string().optional(),
  audioRecordingUrl: z.string().url().optional().or(z.literal("")),
  audioFileSizeBytes: z.number().int().min(0).optional(),
});

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const signature = req.headers.get("x-slg-signature");
  const timestampStr = req.headers.get("x-slg-timestamp");
  const tenantSlug = req.headers.get("x-slg-tenant");

  try {
    const rawBody = await req.text();

    // 1. Cryptographic HMAC Signature & Replay Protection Check
    const authResult = await WebhookVerifierService.verifyGenericSignature(
      rawBody,
      signature,
      timestampStr,
      tenantSlug,
      clientIp
    );

    if (!authResult.isValid || !authResult.tenantId) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized webhook call" },
        { status: 401 }
      );
    }

    // 2. Strict JSON Parsing & Schema Validation
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const parseResult = cdrPayloadSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Payload schema validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 3. Ingest CDR with Tenant Boundary Guaranteed Server-Side
    const callLog = await SlgCallIntelligenceService.ingestCdrEvent({
      tenantId: authResult.tenantId,
      providerId: data.providerId,
      source: data.source as SlgCallSource,
      callType: data.callType as SlgCallType,
      callStatus: data.callStatus as SlgCallStatus,
      contactName: data.contactName,
      customerPhone: data.customerPhone,
      agentPhone: data.agentPhone,
      virtualNumber: data.virtualNumber,
      startedAt: new Date(data.startedAt),
      connectedAt: data.connectedAt ? new Date(data.connectedAt) : undefined,
      endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
      durationSeconds: data.durationSeconds,
      talkTimeSeconds: data.talkTimeSeconds,
      disposition: data.disposition,
      notes: data.notes,
      audioRecordingUrl: data.audioRecordingUrl || undefined,
      audioFileSizeBytes: data.audioFileSizeBytes,
    });

    return NextResponse.json(
      {
        success: true,
        message: "CDR ingested successfully",
        callLogId: callLog.id,
        isDuplicateUpdated: false,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Internal processing error occurred" },
      { status: 500 }
    );
  }
}
