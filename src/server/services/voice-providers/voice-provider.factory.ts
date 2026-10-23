import {
  VoiceProviderAdapter,
  OutboundCallRequest,
  OutboundCallResponse,
} from "./voice-provider.interface";
import { TelephonyService } from "../telephony/telephony.service";

/**
 * Real Telephony Voice Provider Adapter for Twilio & Exotel
 * Executes genuine HTTP calls to telephony APIs and captures carrier Call SIDs
 */
export class RealTelephonyVoiceProvider implements VoiceProviderAdapter {
  public providerName: string;

  constructor(providerName = "TWILIO") {
    this.providerName = providerName.toUpperCase();
  }

  public async makeCall(request: OutboundCallRequest): Promise<OutboundCallResponse> {
    const callRes = await TelephonyService.initiateCall({
      leadPhone: request.phone,
      leadName: request.leadName,
      courseTitle: request.courseTitle,
      userId: request.callerId || "system",
      forceCallingHours: false,
    });

    return {
      success: callRes.success,
      providerCallId: callRes.providerCallId,
      status: callRes.status,
      error: callRes.error,
    };
  }

  public async terminateCall(providerCallId: string): Promise<boolean> {
    const { TwilioVoiceProvider } = await import("../telephony/twilio-voice.provider");
    return TwilioVoiceProvider.terminateCall(providerCallId);
  }

  public async getCallStatus(providerCallId: string): Promise<string> {
    return "INITIATED";
  }
}

/**
 * Voice Provider Factory
 * Returns real carrier adapter by default; never silently marks calls completed without carrier confirmation.
 */
export class VoiceProviderFactory {
  public static getProvider(providerName = "TWILIO"): VoiceProviderAdapter {
    const p = (providerName || "TWILIO").toUpperCase();
    return new RealTelephonyVoiceProvider(p);
  }
}
