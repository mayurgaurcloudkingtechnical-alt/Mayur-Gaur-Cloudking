import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { SKILLVERSE_BRAND } from "@/lib/constants/skillverse-data";

export async function GET() {
  const startTime = Date.now();
  let dbReady = false;

  try {
    await db.$queryRaw`SELECT 1`;
    dbReady = true;
  } catch {
    dbReady = false;
  }

  const hasRazorpayKeys = Boolean(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      !process.env.RAZORPAY_KEY_SECRET.includes("YourRazorpay")
  );

  const hasEmailProvider = Boolean(
    (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("YourResend")) ||
      process.env.SMTP_USER
  );

  return NextResponse.json(
    {
      application: SKILLVERSE_BRAND.name,
      parentBrand: SKILLVERSE_BRAND.parentBrand,
      targetSubdomain: SKILLVERSE_BRAND.subdomainUrl,
      status: dbReady ? "HEALTHY" : "DEGRADED",
      readiness: {
        databaseConnected: dbReady,
        isolatedNamespace: "SKILLVERSE_* (PostgreSQL system_settings)",
        paymentGatewayMode: hasRazorpayKeys ? "RAZORPAY_CONFIGURED" : "SANDBOX_PENDING_LIVE_KEYS",
        notificationProviderMode: hasEmailProvider
          ? "PROVIDER_CONFIGURED"
          : "AUDIT_QUEUE_PENDING_CREDENTIALS",
      },
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    },
    { status: dbReady ? 200 : 503 }
  );
}
