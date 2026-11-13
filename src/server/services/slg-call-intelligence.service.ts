import { db } from "@/server/db/client";
import { SlgCallType, SlgCallStatus, SlgCallSource } from "@prisma/client";
import { CallEventIngestionService } from "./telephony/call-event-ingestion.service";
import { CallAnalyticsService, CallAnalyticsFilter } from "./telephony/call-analytics.service";
import { LiveFleetService } from "./telephony/live-fleet.service";
import { CallDispositionService, SubmitDispositionInput } from "./telephony/call-disposition.service";
import { TelephonyProviderRegistry } from "./telephony/provider-registry";
import { SlgRecordingSecurityService } from "./slg-recording-security.service";
import { TRPCError } from "@trpc/server";

export interface IngestCdrInput {
  tenantId: string;
  providerId: string;
  source?: SlgCallSource;
  provider?: string;
  callType: SlgCallType;
  callStatus: SlgCallStatus;
  contactName: string;
  customerPhone: string;
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
  userId?: string;
}

export interface IngestDeviceSimCallsInput {
  tenantId: string;
  userId: string;
  deviceUuid: string;
  calls: {
    contactName: string;
    customerPhone: string;
    callType: SlgCallType;
    callStatus: SlgCallStatus;
    startedAt: Date;
    endedAt?: Date;
    durationSeconds: number;
    talkTimeSeconds: number;
    disposition?: string;
    notes?: string;
  }[];
}

export class SlgCallIntelligenceService {
  static formatDuration(totalSeconds: number): string {
    return CallAnalyticsService.formatDuration(totalSeconds);
  }

  static normalizePhoneNumber(phone: string): string {
    return CallEventIngestionService.normalizePhoneNumber(phone);
  }

  /**
   * Ingest a Cloud PBX or Virtual Telephony CDR event (Exotel/Twilio/Generic)
   */
  static async ingestCdrEvent(input: IngestCdrInput) {
    const { callLog } = await CallEventIngestionService.ingestNormalizedEvent({
      eventId: `ing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      provider: input.provider || "GENERIC",
      providerCallId: input.providerId,
      tenantId: input.tenantId,
      source: input.source || SlgCallSource.CLOUD_PBX,
      callType: input.callType,
      callStatus: input.callStatus,
      contactName: input.contactName,
      customerPhone: input.customerPhone,
      agentPhone: input.agentPhone,
      virtualNumber: input.virtualNumber,
      startedAt: input.startedAt,
      connectedAt: input.connectedAt,
      endedAt: input.endedAt,
      durationSeconds: input.durationSeconds,
      talkTimeSeconds: input.talkTimeSeconds,
      disposition: input.disposition,
      notes: input.notes,
      audioRecordingUrl: input.audioRecordingUrl,
      audioFileSizeBytes: input.audioFileSizeBytes,
    });
    return callLog;
  }

  /**
   * Synchronize an offline batch of call events from authorized devices
   */
  static async syncDeviceCallEvents(input: IngestDeviceSimCallsInput) {
    const device = await db.slgDeviceRegistration.findUnique({
      where: { deviceUuid: input.deviceUuid },
    });

    if (!device || device.status !== "ACTIVE" || !device.isAuthorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Device synchronization rejected: Hardware identifier is not registered or authorized.",
      });
    }

    if (device.tenantId !== input.tenantId || device.userId !== input.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Device ownership mismatch for authenticated employee.",
      });
    }

    const results = [];
    for (const call of input.calls) {
      const { callLog } = await CallEventIngestionService.ingestNormalizedEvent({
        eventId: `dev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        provider: "ANDROID_DEVICE",
        providerCallId: `dev_${device.deviceUuid}_${call.startedAt.getTime()}`,
        tenantId: input.tenantId,
        source: SlgCallSource.ANDROID_SIM,
        callType: call.callType,
        callStatus: call.callStatus,
        contactName: call.contactName,
        customerPhone: call.customerPhone,
        agentPhone: "DEVICE_SIM",
        startedAt: call.startedAt,
        endedAt: call.endedAt,
        durationSeconds: call.durationSeconds,
        talkTimeSeconds: call.talkTimeSeconds,
        disposition: call.disposition,
        notes: call.notes,
      });
      results.push(callLog);
    }

    await db.slgDeviceRegistration.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date(), lastSyncAt: new Date() },
    });

    return results;
  }

  static async getCallAnalytics(filter: CallAnalyticsFilter) {
    return CallAnalyticsService.getCallAnalytics(filter);
  }

  static async getLiveFleetPresence(tenantId: string) {
    return LiveFleetService.getLiveFleetPresence(tenantId);
  }

  static async submitDisposition(input: SubmitDispositionInput) {
    return CallDispositionService.submitDisposition(input);
  }

  static async getSecurePlaybackUrl(
    tenantId: string,
    userId: string,
    recordingId: string,
    clientIp: string,
    userAgent: string
  ) {
    return SlgRecordingSecurityService.getSecurePlaybackUrl(tenantId, userId, recordingId, clientIp, userAgent);
  }

  static getProviderFleetHealth() {
    return TelephonyProviderRegistry.getFleetHealth();
  }
}
