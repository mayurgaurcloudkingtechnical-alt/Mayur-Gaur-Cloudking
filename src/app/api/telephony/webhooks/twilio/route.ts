import { NextRequest, NextResponse } from "next/server";
import { TelephonyProviderRegistry } from "@/server/services/telephony/provider-registry";
import { CallEventIngestionService } from "@/server/services/telephony/call-event-ingestion.service";

export async function POST(req: NextRequest) {
  const adapter = TelephonyProviderRegistry.getAdapter("TWILIO");
  if (!adapter || !adapter.isConfigured()) {
    return NextResponse.json(
      { success: false, error: "Twilio telephony provider integration is unconfigured in this environment.", status: "unconfigured" },
      { status: 503 }
    );
  }

  const twilioSignature = req.headers.get("x-twilio-signature");
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((val, key) => {
    params[key] = val.toString();
  });

  const tenantSlug = req.nextUrl.searchParams.get("tenant") || "softlab";
  params.tenant = tenantSlug;

  const authResult = await adapter.verifySignature({
    rawBody: "",
    url: req.url,
    headers: { "x-twilio-signature": twilioSignature },
    params,
  });

  if (!authResult.isValid || !authResult.tenantId) {
    return NextResponse.json(
      { success: false, error: authResult.error || "Invalid Twilio cryptographic signature (X-Twilio-Signature)" },
      { status: authResult.statusCode || 401 }
    );
  }

  const normalized = adapter.normalizeEvent(params, authResult.tenantId);
  const { callLog, isDuplicate } = await CallEventIngestionService.ingestNormalizedEvent(normalized);

  return NextResponse.json({
    success: true,
    callLogId: callLog.id,
    isDuplicate,
    provider: "TWILIO",
  });
}
