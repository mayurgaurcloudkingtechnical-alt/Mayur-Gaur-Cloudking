/**
 * Real Twilio Voice API Provider Adapter
 * Connects outbound calls using Twilio Programmable Voice REST API
 */

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface TwilioCallResult {
  success: boolean;
  providerCallId: string;
  status: "QUEUED" | "INITIATED" | "RINGING" | "IN_PROGRESS" | "COMPLETED" | "BUSY" | "NO_ANSWER" | "FAILED";
  durationSeconds?: number;
  error?: string;
}

export class TwilioVoiceProvider {
  /**
   * Dispatches a real outbound call via Twilio REST API
   */
  public static async makeCall(params: {
    to: string;
    from?: string;
    twimlUrl?: string;
    statusCallbackUrl?: string;
    config?: TwilioConfig;
  }): Promise<TwilioCallResult> {
    const accountSid = params.config?.accountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = params.config?.authToken || process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = params.from || params.config?.fromNumber || process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return {
        success: false,
        providerCallId: "NOT_CONFIGURED",
        status: "FAILED",
        error: "Twilio credentials missing (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER). Call not placed.",
      };
    }

    // Normalize phone number to E.164 format (with leading +)
    const rawTo = params.to.replace(/\D/g, "");
    const formattedTo = rawTo.startsWith("+")
      ? rawTo
      : rawTo.length === 10
      ? `+91${rawTo}`
      : `+${rawTo}`;

    const formattedFrom = fromNumber.startsWith("+") ? fromNumber : `+${fromNumber}`;

    const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const formData = new URLSearchParams();
    formData.append("To", formattedTo);
    formData.append("From", formattedFrom);

    // If custom TwiML URL provided, use it; otherwise provide SoftLab Global voice greeting
    if (params.twimlUrl) {
      formData.append("Url", params.twimlUrl);
    } else {
      // Inline TwiML fallback: SoftLab Global academic counseling greeting
      const twiml = `
        <Response>
          <Say voice="Polly.Aditi" language="hi-IN">
            Namaste. SoftLab Global, Civil Lines Prayagraj mein aapka swagat hai. Kripya line par bane rahein, hamare senior counselor aapse connect ho rahe hain.
          </Say>
          <Pause length="1"/>
        </Response>
      `.trim();
      formData.append("Twiml", twiml);
    }

    if (params.statusCallbackUrl) {
      formData.append("StatusCallback", params.statusCallbackUrl);
      formData.append("StatusCallbackEvent", "initiated");
      formData.append("StatusCallbackEvent", "ringing");
      formData.append("StatusCallbackEvent", "answered");
      formData.append("StatusCallbackEvent", "completed");
      formData.append("StatusCallbackMethod", "POST");
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data.message || `Twilio API HTTP Error ${response.status}: ${response.statusText}`;
        console.error(`[TwilioVoiceProvider] Call failed to ${formattedTo}:`, errorMsg);
        return {
          success: false,
          providerCallId: data.sid || "FAILED",
          status: "FAILED",
          error: errorMsg,
        };
      }

      // Map Twilio status to our standardized status
      const twilioStatus = (data.status || "queued").toLowerCase();
      let standardizedStatus: TwilioCallResult["status"] = "INITIATED";
      if (twilioStatus === "ringing") standardizedStatus = "RINGING";
      else if (twilioStatus === "in-progress") standardizedStatus = "IN_PROGRESS";
      else if (twilioStatus === "completed") standardizedStatus = "COMPLETED";
      else if (twilioStatus === "busy") standardizedStatus = "BUSY";
      else if (twilioStatus === "no-answer") standardizedStatus = "NO_ANSWER";
      else if (twilioStatus === "failed") standardizedStatus = "FAILED";

      return {
        success: true,
        providerCallId: data.sid,
        status: standardizedStatus,
      };
    } catch (err: any) {
      console.error("[TwilioVoiceProvider] Network dispatch error:", err.message);
      return {
        success: false,
        providerCallId: "FAILED",
        status: "FAILED",
        error: err.message,
      };
    }
  }

  /**
   * Terminates or cancels an active Twilio call
   */
  public static async terminateCall(callSid: string, config?: TwilioConfig): Promise<boolean> {
    const accountSid = config?.accountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = config?.authToken || process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken || !callSid || callSid.startsWith("NOT_")) return false;

    try {
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ Status: "completed" }).toString(),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }
}
