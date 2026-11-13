import { NextRequest, NextResponse } from "next/server";
import { TelephonyProviderRegistry } from "@/server/services/telephony/provider-registry";
import { CallEventIngestionService } from "@/server/services/telephony/call-event-ingestion.service";

export async function POST(req: NextRequest) {
  const adapter = TelephonyProviderRegistry.getAdapter("EXOTEL");
  if (!adapter || !adapter.isConfigured()) {
    return NextResponse.json(
      { success: false, error: "Exotel telephony provider integration is unconfigured in this environment.", status: "unconfigured" },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const tenantSlug = req.nextUrl.searchParams.get("tenant") || req.headers.get("x-slg-tenant") || "softlab";

  const authResult = await adapter.verifySignature({
    rawBody: "",
    url: req.url,
    headers: { authorization: authHeader, "x-slg-tenant": tenantSlug },
    params: { tenant: tenantSlug },
  });

  if (!authResult.isValid || !authResult.tenantId) {
    return NextResponse.json(
      { success: false, error: authResult.error || "Invalid Exotel webhook authorization token." },
      { status: authResult.statusCode || 401 }
    );
  }

  const formData = await req.formData();
  const rawPayload: Record<string, any> = {};
  formData.forEach((val, key) => {
    rawPayload[key] = val.toString();
  });

  const normalized = adapter.normalizeEvent(rawPayload, authResult.tenantId);
  const { callLog, isDuplicate } = await CallEventIngestionService.ingestNormalizedEvent(normalized);

  return NextResponse.json({
    success: true,
    callLogId: callLog.id,
    isDuplicate,
    provider: "EXOTEL",
  });
}
