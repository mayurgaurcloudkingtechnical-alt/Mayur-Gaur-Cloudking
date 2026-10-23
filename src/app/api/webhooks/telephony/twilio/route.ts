import { NextRequest, NextResponse } from "next/server";
import { TelephonyService } from "@/server/services/telephony/telephony.service";

/**
 * Inbound webhook for Twilio Call Status Updates
 * Processed events: initiated, ringing, answered, completed
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = formData.get("CallDuration") as string;
    const recordingUrl = formData.get("RecordingUrl") as string;

    if (!callSid) {
      return NextResponse.json({ error: "Missing CallSid" }, { status: 400 });
    }

    const durationSeconds = callDuration ? parseInt(callDuration, 10) : 0;

    await TelephonyService.handleCarrierWebhookUpdate({
      provider: "TWILIO",
      providerCallId: callSid,
      carrierStatus: callStatus,
      durationSeconds,
      recordingUrl: recordingUrl || undefined,
    });

    // Return 200 OK with minimal TwiML acknowledge
    return new NextResponse("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("[Twilio Webhook Error]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
