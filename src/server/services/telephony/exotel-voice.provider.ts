/**
 * Real Exotel Voice API Provider Adapter
 * Connects outbound calls using Exotel Cloud Telephony REST API
 */

export interface ExotelConfig {
  accountSid: string;
  apiKey: string;
  apiToken: string;
  subDomain: string;
  callerId: string;
}

export interface ExotelCallResult {
  success: boolean;
  providerCallId: string;
  status: "QUEUED" | "INITIATED" | "RINGING" | "IN_PROGRESS" | "COMPLETED" | "BUSY" | "NO_ANSWER" | "FAILED";
  durationSeconds?: number;
  error?: string;
}

export class ExotelVoiceProvider {
  /**
   * Connects counselor or AI agent to student destination via Exotel Outbound API
   */
  public static async makeCall(params: {
    to: string;
    from?: string; // Virtual number / Agent number
    callerId?: string;
    statusCallbackUrl?: string;
    config?: ExotelConfig;
  }): Promise<ExotelCallResult> {
    const accountSid = params.config?.accountSid || process.env.EXOTEL_SID;
    const apiKey = params.config?.apiKey || process.env.EXOTEL_API_KEY;
    const apiToken = params.config?.apiToken || process.env.EXOTEL_TOKEN;
    const subDomain = params.config?.subDomain || process.env.EXOTEL_SUB_DOMAIN || "api.exotel.com";
    const callerId = params.callerId || params.config?.callerId || process.env.EXOTEL_CALLER_ID;

    if (!accountSid || !apiKey || !apiToken || !callerId) {
      return {
        success: false,
        providerCallId: "NOT_CONFIGURED",
        status: "FAILED",
        error: "Exotel credentials missing (EXOTEL_SID / EXOTEL_API_KEY / EXOTEL_TOKEN / EXOTEL_CALLER_ID). Call not placed.",
      };
    }

    // Standardize destination phone (10 digits or with 0)
    const rawTo = params.to.replace(/\D/g, "");
    const formattedTo = rawTo.length === 10 ? `0${rawTo}` : rawTo;
    const fromAgent = params.from ? params.from.replace(/\D/g, "") : callerId.replace(/\D/g, "");

    const apiUrl = `https://${apiKey}:${apiToken}@${subDomain}/v1/Accounts/${accountSid}/Calls/connect.json`;

    const formData = new URLSearchParams();
    formData.append("From", fromAgent);
    formData.append("To", formattedTo);
    formData.append("CallerId", callerId);
    if (params.statusCallbackUrl) {
      formData.append("StatusCallback", params.statusCallbackUrl);
      formData.append("StatusCallbackEvents[0]", "terminal");
    }

    try {
      const basicAuth = Buffer.from(`${apiKey}:${apiToken}`).toString("base64");
      const response = await fetch(`https://${subDomain}/v1/Accounts/${accountSid}/Calls/connect.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.Call?.Sid) {
        const errorMsg = data.RestException?.Message || `Exotel API HTTP Error ${response.status}: ${response.statusText}`;
        console.error(`[ExotelVoiceProvider] Call failed to ${formattedTo}:`, errorMsg);
        return {
          success: false,
          providerCallId: data.Call?.Sid || "FAILED",
          status: "FAILED",
          error: errorMsg,
        };
      }

      return {
        success: true,
        providerCallId: data.Call.Sid,
        status: "INITIATED",
      };
    } catch (err: any) {
      console.error("[ExotelVoiceProvider] Network dispatch error:", err.message);
      return {
        success: false,
        providerCallId: "FAILED",
        status: "FAILED",
        error: err.message,
      };
    }
  }
}
