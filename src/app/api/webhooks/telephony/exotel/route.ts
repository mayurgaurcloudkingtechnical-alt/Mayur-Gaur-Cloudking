import { NextRequest, NextResponse } from "next/server";
import { TelephonyService } from "@/server/services/telephony/telephony.service";

/**
 * Inbound webhook for Exotel Call Status Updates
 * Processed parameters: CallSid, Status, RecordingUrl, DialWhomNumber, LegDetails
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = (formData.get("CallSid") || formData.get("Sid")) as string;
    const status = (formData.get("Status") || formData.get("DialCallStatus")) as string;
    const duration = (formData.get("Duration") || formData.get("DialCallDuration")) as string;
    const recordingUrl = formData.get("RecordingUrl") as string;

    if (!callSid) {
      return NextResponse.json({ error: "Missing CallSid" }, { status: 400 });
    }

    const durationSeconds = duration ? parseInt(duration, 10) : 0;

    await TelephonyService.handleCarrierWebhookUpdate({
      provider: "EXOTEL",
      providerCallId: callSid,
      carrierStatus: status,
      durationSeconds,
      recordingUrl: recordingUrl || undefined,
    });

    return NextResponse.json({ success: true, processed: true }, { status: 200 });
  } catch (err: any) {
    console.error("[Exotel Webhook Error]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Exotel also sends GET requests for terminal status callback validation
  const { searchParams } = new URL(req.url);
  const callSid = searchParams.get("CallSid") || searchParams.get("Sid");
  const status = searchParams.get("Status") || searchParams.get("DialCallStatus");
  const duration = searchParams.get("Duration") || searchParams.get("DialCallDuration");

  if (callSid && status) {
    await TelephonyService.handleCarrierWebhookUpdate({
      provider: "EXOTEL",
      providerCallId: callSid,
      carrierStatus: status,
      durationSeconds: duration ? parseInt(duration, 10) : 0,
    });
  }

  return NextResponse.json({ success: true, verified: true });
}
