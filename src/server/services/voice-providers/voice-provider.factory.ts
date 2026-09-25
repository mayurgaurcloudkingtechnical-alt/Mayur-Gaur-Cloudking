import {
  VoiceProviderAdapter,
  OutboundCallRequest,
  OutboundCallResponse,
} from "./voice-provider.interface";
import { AiCallingAgentService } from "../ai-calling-agent.service";

/**
 * Built-in High-Fidelity Simulator Voice Provider
 * Runs realistic dynamic conversational dialogue with SoftLab Global AI identity
 */
export class SimulatorVoiceProvider implements VoiceProviderAdapter {
  public providerName = "SIMULATOR";

  public async makeCall(request: OutboundCallRequest): Promise<OutboundCallResponse> {
    const callId = `sim_call_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Select dynamic scenario based on phone / test hints
    let scenario: "INTERESTED_STUDENT" | "WORKING_PRO_WEEKEND" | "CALL_BACK_TOMORROW" | "HUMAN_HANDOFF" | "NOT_INTERESTED" | "PRICE_QUERY" = "INTERESTED_STUDENT";

    const lastDigit = parseInt(request.phone.slice(-1) || "1", 10);
    if (lastDigit === 0 || lastDigit === 5) {
      scenario = "WORKING_PRO_WEEKEND";
    } else if (lastDigit === 2 || lastDigit === 6) {
      scenario = "CALL_BACK_TOMORROW";
    } else if (lastDigit === 3 || lastDigit === 7) {
      scenario = "PRICE_QUERY";
    } else if (lastDigit === 4) {
      scenario = "HUMAN_HANDOFF";
    } else if (lastDigit === 9) {
      scenario = "NOT_INTERESTED";
    }

    const result = await AiCallingAgentService.simulateRealisticCall({
      leadName: request.leadName,
      phone: request.phone,
      courseTitle: request.courseTitle,
      language: request.language,
      openingScript: request.openingScript,
      systemPrompt: request.systemPrompt,
      simulatedScenario: scenario,
    });

    return {
      success: true,
      providerCallId: callId,
      status: "COMPLETED",
      result,
    };
  }

  public async terminateCall(providerCallId: string): Promise<boolean> {
    return true;
  }

  public async getCallStatus(providerCallId: string): Promise<string> {
    return "COMPLETED";
  }
}

/**
 * Live Twilio / Exotel / External Webhook Voice Provider Stub
 */
export class TelephonyVoiceProvider implements VoiceProviderAdapter {
  public providerName: string;
  private apiKey?: string;
  private apiSecret?: string;
  private fromNumber?: string;

  constructor(providerName: string, config?: { apiKey?: string; apiSecret?: string; fromNumber?: string }) {
    this.providerName = providerName;
    this.apiKey = config?.apiKey;
    this.apiSecret = config?.apiSecret;
    this.fromNumber = config?.fromNumber;
  }

  public async makeCall(request: OutboundCallRequest): Promise<OutboundCallResponse> {
    // If credentials are not configured, fallback gracefully to simulation
    if (!this.apiKey || !this.fromNumber) {
      const fallback = new SimulatorVoiceProvider();
      const res = await fallback.makeCall(request);
      return {
        ...res,
        providerCallId: `${this.providerName.toLowerCase()}_sim_${Date.now()}`,
      };
    }

    // In live mode with credentials:
    // e.g. dispatch to Twilio Voice REST API or Exotel endpoint
    const callId = `${this.providerName.toLowerCase()}_${Date.now()}`;
    return {
      success: true,
      providerCallId: callId,
      status: "INITIATED",
    };
  }

  public async terminateCall(providerCallId: string): Promise<boolean> {
    return true;
  }

  public async getCallStatus(providerCallId: string): Promise<string> {
    return "COMPLETED";
  }
}

export class VoiceProviderFactory {
  public static getProvider(providerName = "SIMULATOR", config?: { apiKey?: string; apiSecret?: string; fromNumber?: string }): VoiceProviderAdapter {
    const p = (providerName || "SIMULATOR").toUpperCase();
    if (p === "SIMULATOR") {
      return new SimulatorVoiceProvider();
    }
    return new TelephonyVoiceProvider(p, config);
  }
}
