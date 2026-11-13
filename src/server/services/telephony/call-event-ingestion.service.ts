import { db } from "@/server/db/client";
import { SlgCallStatus, SlgStorageProvider } from "@prisma/client";
import { NormalizedCallEvent } from "./types";
import { TRPCError } from "@trpc/server";

async function withDbRetry<T>(op: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await op();
  } catch (err: any) {
    if (retries > 0 && (err.code === "P1017" || err.message?.includes("closed the connection") || err.message?.includes("ConnectionReset"))) {
      await new Promise((r) => setTimeout(r, 200));
      return withDbRetry(op, retries - 1);
    }
    throw err;
  }
}

export class CallEventIngestionService {
  /**
   * Normalizes Indian and International phone numbers to clean E.164
   */
  static normalizePhoneNumber(phone: string): string {
    const cleaned = (phone || "").replace(/[^0-9+]/g, "");
    if (!cleaned) return "UNKNOWN";
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith("91")) return `+${cleaned}`;
    return cleaned;
  }

  /**
   * Ingests a normalized telephony call event with strict idempotency and CRM linkage
   */
  static async ingestNormalizedEvent(event: NormalizedCallEvent) {
    return withDbRetry(async () => {
      const normalizedCustomerPhone = this.normalizePhoneNumber(event.customerPhone);
    const normalizedAgentPhone = this.normalizePhoneNumber(event.agentPhone);

    // 1. Idempotency Check: Existing record by (tenantId, providerId)
    const existing = await db.slgCallLog.findFirst({
      where: {
        tenantId: event.tenantId,
        providerId: event.providerCallId,
      },
      include: { recording: true },
    });

    if (existing) {
      // Reconcile terminal event details (Out-of-order & retry safe)
      const duration = Math.max(existing.durationSeconds, event.durationSeconds);
      const talkTime = Math.max(existing.talkTimeSeconds, event.talkTimeSeconds);
      const isExistingTerminal = existing.callStatus === SlgCallStatus.CONNECTED;
      const resolvedStatus = isExistingTerminal ? existing.callStatus : (event.callStatus || existing.callStatus);

      const updated = await db.slgCallLog.update({
        where: { id: existing.id },
        data: {
          callStatus: resolvedStatus,
          connectedAt: event.connectedAt || existing.connectedAt,
          endedAt: event.endedAt || existing.endedAt,
          durationSeconds: duration,
          talkTimeSeconds: talkTime,
          disposition: existing.disposition === "INTERESTED" && event.disposition ? event.disposition : existing.disposition,
          notes: event.notes ? `${existing.notes || ""}\n${event.notes}`.trim() : existing.notes,
          isRecorded: existing.isRecorded || !!event.audioRecordingUrl,
          rawMetadata: event.rawPayloadMetadata ? (event.rawPayloadMetadata as any) : (existing.rawMetadata as any),
        },
      });

      // Attach recording if not already linked
      if (event.audioRecordingUrl && !existing.recording) {
        await db.slgCallRecording.create({
          data: {
            tenantId: event.tenantId,
            callLogId: existing.id,
            storageProvider: SlgStorageProvider.CLOUDFLARE_R2,
            storageKey: event.audioRecordingUrl,
            providerRecordingId: event.providerCallId,
            durationSeconds: talkTime,
            mimeType: "audio/mp4",
          },
        });
      }

      return { callLog: updated, isDuplicate: true };
    }

    // 2. Employee Mapping
    let matchedUserId: string | null = null;
    let isEmployeeMatched = false;

    if (normalizedAgentPhone && normalizedAgentPhone !== "UNKNOWN") {
      const agentUser = await db.user.findFirst({
        where: {
          tenantId: event.tenantId,
          OR: [
            { phone: normalizedAgentPhone },
            { phone: event.agentPhone },
            { callingNumber: normalizedAgentPhone },
            { callingNumber: event.agentPhone },
          ],
        },
        select: { id: true, tenantBranchId: true, tenantDepartmentId: true },
      });

      if (agentUser) {
        matchedUserId = agentUser.id;
        isEmployeeMatched = true;
      }
    }

    // Fallback: If agent phone is unmatched, assign to tenant admin without dropping call
    if (!matchedUserId) {
      const fallbackAdmin = await db.user.findFirst({
        where: { tenantId: event.tenantId },
        select: { id: true },
      });

      if (!fallbackAdmin) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active user in tenant to associate with telephony call log.",
        });
      }

      matchedUserId = fallbackAdmin.id;
      isEmployeeMatched = false;
    }

    // 3. Customer CRM Lead Mapping
    let matchedLeadId: string | null = null;
    let isCustomerMatched = false;

    if (normalizedCustomerPhone && normalizedCustomerPhone !== "UNKNOWN") {
      const lead = await db.lead.findFirst({
        where: {
          OR: [
            { phone: normalizedCustomerPhone },
            { phone: event.customerPhone },
          ],
        },
        select: { id: true },
        orderBy: { updatedAt: "desc" },
      });

      if (lead) {
        matchedLeadId = lead.id;
        isCustomerMatched = true;
      }
    }

    // 4. Create Call Log Record
    const callLog = await db.slgCallLog.create({
      data: {
        tenantId: event.tenantId,
        userId: matchedUserId,
        leadId: matchedLeadId,
        source: event.source,
        provider: event.provider,
        providerId: event.providerCallId,
        providerAccountId: event.providerAccountId,
        isEmployeeMatched,
        isCustomerMatched,
        callType: event.callType,
        callStatus: event.callStatus,
        contactName: event.contactName,
        customerPhone: normalizedCustomerPhone,
        agentPhone: normalizedAgentPhone,
        virtualNumber: event.virtualNumber,
        startedAt: event.startedAt,
        connectedAt: event.connectedAt,
        endedAt: event.endedAt,
        durationSeconds: event.durationSeconds,
        talkTimeSeconds: event.talkTimeSeconds,
        disposition: event.disposition || (event.callStatus === SlgCallStatus.CONNECTED ? "CONNECTED" : "UNANSWERED"),
        notes: event.notes,
        isRecorded: !!event.audioRecordingUrl,
        rawMetadata: event.rawPayloadMetadata ? (event.rawPayloadMetadata as any) : undefined,
      },
    });

    // 5. Associated Recording Reference
    if (event.audioRecordingUrl) {
      await db.slgCallRecording.create({
        data: {
          tenantId: event.tenantId,
          callLogId: callLog.id,
          storageProvider: SlgStorageProvider.CLOUDFLARE_R2,
          storageKey: event.audioRecordingUrl,
          providerRecordingId: event.providerCallId,
          durationSeconds: event.talkTimeSeconds,
          fileSizeBytes: event.audioFileSizeBytes ? BigInt(event.audioFileSizeBytes) : undefined,
          mimeType: "audio/mp4",
        },
      });
    }

    // 6. Non-Destructive CRM Lead Activity Logging
    if (matchedLeadId) {
      await db.leadActivity.create({
        data: {
          leadId: matchedLeadId,
          userId: matchedUserId,
          activityType: event.callStatus === SlgCallStatus.CONNECTED ? "CALL_CONNECTED" : "CALL_MISSED",
          disposition: event.disposition || event.callStatus,
          notes: event.notes || `Telephony call via ${event.provider} (Duration: ${event.durationSeconds}s)`,
        },
      });
    }

    // 7. Security & Telemetry Audit Log
    await db.slgAuditLog.create({
      data: {
        tenantId: event.tenantId,
        actorUserId: matchedUserId,
        action: "CALL_EVENT_INGESTED",
        entityType: "SlgCallLog",
        entityId: callLog.id,
        details: {
          provider: event.provider,
          providerCallId: event.providerCallId,
          status: event.callStatus,
          isEmployeeMatched,
          isCustomerMatched,
        },
      },
    });

    return { callLog, isDuplicate: false };
    });
  }
}
