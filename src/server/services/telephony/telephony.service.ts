import { db } from "@/server/db/client";
import { TwilioVoiceProvider, TwilioCallResult } from "./twilio-voice.provider";
import { ExotelVoiceProvider, ExotelCallResult } from "./exotel-voice.provider";
import { CallingOutcome, LeadStatus } from "@prisma/client";

export interface InitiateOutboundCallParams {
  leadId?: string;
  leadPhone: string;
  leadName?: string;
  courseTitle?: string;
  userId: string;
  userRole?: string;
  forceCallingHours?: boolean;
  statusCallbackUrl?: string;
}

export interface TelephonyCallResponse {
  success: boolean;
  status: "INITIATED" | "RINGING" | "IN_PROGRESS" | "COMPLETED" | "BUSY" | "NO_ANSWER" | "FAILED" | "QUEUED";
  providerCallId: string;
  provider: "TWILIO" | "EXOTEL" | "NONE";
  error?: string;
  callLogId?: string;
}

export class TelephonyService {
  /**
   * Check if current time is within lawful calling hours in India (10:00 AM - 7:00 PM IST)
   */
  public static isWithinCallingHours(forceOverride = false): boolean {
    if (forceOverride) return true;
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const hours = istDate.getUTCHours();
    return hours >= 10 && hours < 19;
  }

  /**
   * Normalizes Indian and international phone numbers
   */
  public static normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `91${digits}`;
    if (digits.startsWith("0") && digits.length === 11) return `91${digits.slice(1)}`;
    return digits;
  }

  /**
   * Retrieves active telephony provider configuration from DB or env
   */
  public static async getActiveProviderConfig(): Promise<{
    provider: "TWILIO" | "EXOTEL" | "NONE";
    isConfigured: boolean;
    missingVars: string[];
  }> {
    // Check DB stored telephony settings first
    let dbSetting: any = null;
    try {
      const stored = await db.systemSetting.findUnique({
        where: { key: "telephony_config" },
      });
      if (stored && typeof stored.value === "object") {
        dbSetting = stored.value;
      }
    } catch {
      // Fallback to env
    }

    const twilioSid = dbSetting?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = dbSetting?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = dbSetting?.twilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioToken && twilioPhone) {
      return { provider: "TWILIO", isConfigured: true, missingVars: [] };
    }

    const exotelSid = dbSetting?.exotelSid || process.env.EXOTEL_SID;
    const exotelKey = dbSetting?.exotelApiKey || process.env.EXOTEL_API_KEY;
    const exotelToken = dbSetting?.exotelToken || process.env.EXOTEL_TOKEN;
    const exotelCallerId = dbSetting?.exotelCallerId || process.env.EXOTEL_CALLER_ID;

    if (exotelSid && exotelKey && exotelToken && exotelCallerId) {
      return { provider: "EXOTEL", isConfigured: true, missingVars: [] };
    }

    const missingVars: string[] = [];
    if (!twilioSid) missingVars.push("TWILIO_ACCOUNT_SID");
    if (!twilioToken) missingVars.push("TWILIO_AUTH_TOKEN");
    if (!twilioPhone) missingVars.push("TWILIO_PHONE_NUMBER");

    return { provider: "NONE", isConfigured: false, missingVars };
  }

  /**
   * Initiates a real outbound call to a lead or customer
   */
  public static async initiateCall(params: InitiateOutboundCallParams): Promise<TelephonyCallResponse> {
    const cleanPhone = this.normalizePhone(params.leadPhone);
    const tenDigit = cleanPhone.slice(-10);

    // 1. Validate destination number format
    if (tenDigit.length < 10) {
      return {
        success: false,
        status: "FAILED",
        providerCallId: "INVALID_NUMBER",
        provider: "NONE",
        error: `Invalid phone number: ${params.leadPhone}. Must contain at least 10 valid digits.`,
      };
    }

    // 2. Check DND compliance
    const isDnc = await db.doNotCallNumber.findUnique({
      where: { phone: tenDigit },
    });
    if (isDnc) {
      return {
        success: false,
        status: "FAILED",
        providerCallId: "DND_BLOCKED",
        provider: "NONE",
        error: "Number is registered on the National Do-Not-Call (DND) Registry. Automated calling prohibited.",
      };
    }

    // 3. Verify calling hours (10:00 - 19:00 IST)
    if (!this.isWithinCallingHours(params.forceCallingHours)) {
      return {
        success: false,
        status: "FAILED",
        providerCallId: "HOURS_RESTRICTED",
        provider: "NONE",
        error: "Outbound calls are only permitted between 10:00 AM and 7:00 PM IST in accordance with telecom regulations.",
      };
    }

    // 4. Check active provider
    const activeConfig = await this.getActiveProviderConfig();
    if (!activeConfig.isConfigured || activeConfig.provider === "NONE") {
      const error = `Telephony carrier not configured (missing ${activeConfig.missingVars.join(", ")}). Please configure Twilio or Exotel in Admin Settings.`;
      console.warn(`[TelephonyService] ${error}`);

      // Log attempt in audit logs
      try {
        await db.auditLog.create({
          data: {
            action: "CALL_ATTEMPT_UNCONFIGURED",
            resourceType: "CALL",
            resourceId: params.leadId || cleanPhone,
            newData: { error, phone: cleanPhone, userId: params.userId },
          },
        });
      } catch {}

      return {
        success: false,
        status: "FAILED",
        providerCallId: "CARRIER_NOT_CONFIGURED",
        provider: "NONE",
        error,
      };
    }

    // 5. Create initial StaffCallLog record in CRM with INITIATED state
    const baseUrl = process.env.NEXTAUTH_URL || "https://lms.softlabglobal.com";
    const statusCallbackUrl =
      params.statusCallbackUrl || `${baseUrl}/api/webhooks/telephony/${activeConfig.provider.toLowerCase()}`;

    const staffCallLog = await db.staffCallLog.create({
      data: {
        userId: params.userId,
        leadId: params.leadId || null,
        contactName: params.leadName || "Prospective Student",
        contactPhone: cleanPhone,
        callType: "OUTGOING",
        callStatus: "INITIATED",
        disposition: "CALL_INITIATED",
        durationSeconds: 0,
        notes: `Outbound call dispatched via ${activeConfig.provider}. Waiting for carrier ring/connect callback.`,
        roleCode: params.userRole || "COUNSELOR",
      },
    });

    // 6. Dispatch to real telephony provider
    let callResult: TwilioCallResult | ExotelCallResult;
    if (activeConfig.provider === "TWILIO") {
      callResult = await TwilioVoiceProvider.makeCall({
        to: cleanPhone,
        statusCallbackUrl,
      });
    } else {
      callResult = await ExotelVoiceProvider.makeCall({
        to: cleanPhone,
        statusCallbackUrl,
      });
    }

    // 7. Update StaffCallLog with real provider call SID
    if (callResult.success) {
      await db.staffCallLog.update({
        where: { id: staffCallLog.id },
        data: {
          notes: `Call connected to carrier ${activeConfig.provider} (Call SID: ${callResult.providerCallId}). Status: ${callResult.status}`,
          callStatus: callResult.status,
        },
      });

      // Record timeline event
      if (params.leadId) {
        await db.customerTimelineEvent.create({
          data: {
            leadId: params.leadId,
            eventType: "CALL_INITIATED",
            source: "TELEPHONY",
            title: `Outbound Call Initiated (${activeConfig.provider})`,
            summary: `Carrier call SID: ${callResult.providerCallId}. Status: ${callResult.status}`,
            metadata: {
              provider: activeConfig.provider,
              providerCallId: callResult.providerCallId,
              callLogId: staffCallLog.id,
            },
          },
        });
      }

      return {
        success: true,
        status: callResult.status,
        providerCallId: callResult.providerCallId,
        provider: activeConfig.provider,
        callLogId: staffCallLog.id,
      };
    } else {
      await db.staffCallLog.update({
        where: { id: staffCallLog.id },
        data: {
          callStatus: "FAILED",
          disposition: "FAILED",
          notes: `Carrier rejection: ${callResult.error || "Unknown provider error"}`,
        },
      });

      return {
        success: false,
        status: "FAILED",
        providerCallId: callResult.providerCallId,
        provider: activeConfig.provider,
        callLogId: staffCallLog.id,
        error: callResult.error || "Provider rejected outbound call request.",
      };
    }
  }

  /**
   * Processes carrier webhooks (Twilio / Exotel) to update actual call outcome,
   * duration, and recording URL based on verified network events.
   */
  public static async handleCarrierWebhookUpdate(payload: {
    provider: "TWILIO" | "EXOTEL";
    providerCallId: string;
    carrierStatus: string;
    durationSeconds?: number;
    recordingUrl?: string;
    disposition?: string;
  }): Promise<{ success: boolean; updatedCount: number }> {
    const rawStatus = (payload.carrierStatus || "").toLowerCase();

    let standardizedStatus = "INITIATED";
    let disposition = payload.disposition || "FOLLOW_UP";

    if (rawStatus.includes("ring")) {
      standardizedStatus = "RINGING";
    } else if (rawStatus.includes("answer") || rawStatus.includes("in-progress")) {
      standardizedStatus = "IN_PROGRESS";
      disposition = "CONNECTED";
    } else if (rawStatus.includes("complete")) {
      standardizedStatus = "COMPLETED";
      disposition = "CONNECTED";
    } else if (rawStatus.includes("busy")) {
      standardizedStatus = "BUSY";
      disposition = "BUSY";
    } else if (rawStatus.includes("no-answer")) {
      standardizedStatus = "NO_ANSWER";
      disposition = "NO_ANSWER";
    } else if (rawStatus.includes("fail") || rawStatus.includes("cancel")) {
      standardizedStatus = "FAILED";
      disposition = "FAILED";
    }

    const duration = payload.durationSeconds ? Math.max(0, payload.durationSeconds) : 0;

    // 1. Update StaffCallLog matching this providerCallId
    const updateResult = await db.staffCallLog.updateMany({
      where: {
        notes: {
          contains: payload.providerCallId,
        },
      },
      data: {
        callStatus: standardizedStatus,
        disposition,
        durationSeconds: duration,
        recordingUrl: payload.recordingUrl || undefined,
        endedAt: standardizedStatus === "COMPLETED" ? new Date() : undefined,
      },
    });

    // 2. Also update CallingQueueItem if part of a queue batch
    await db.callingQueueItem.updateMany({
      where: { providerCallId: payload.providerCallId },
      data: {
        callDurationSeconds: duration,
        recordingUrl: payload.recordingUrl || undefined,
        callOutcome: disposition as any,
      },
    });

    console.log(
      `[TelephonyService Webhook] Provider ${payload.provider} (SID: ${payload.providerCallId}) -> Status: ${standardizedStatus}, Duration: ${duration}s`
    );

    return {
      success: true,
      updatedCount: updateResult.count,
    };
  }
}
