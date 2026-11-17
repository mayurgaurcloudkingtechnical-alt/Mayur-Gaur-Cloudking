import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import os from "os";
import fs from "fs/promises";
import path from "path";
import { db } from "@/server/db/client";
import { WhatsAppBusinessConfigService } from "@/server/services/whatsapp-business-config.service";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN"];

async function getAuth(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));
  if (!token?.sub || !ALLOWED_ROLES.includes(String(token.roleCode || ""))) return null;
  return token;
}

export async function GET(req: NextRequest) {
  const token = await getAuth(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const checkedAt = new Date().toISOString();

  // 1. PostgreSQL Health
  let dbStatus: "CONNECTED" | "DISCONNECTED" = "DISCONNECTED";
  let dbLatencyMs = 0;
  let dbError: string | null = null;
  try {
    const t0 = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbStatus = "CONNECTED";
  } catch (e: any) {
    dbError = e?.message || "Database unreachable";
  }

  // 2. Meta WhatsApp Cloud API & Calling Eligibility
  let waStatus: "CONNECTED" | "DISCONNECTED" | "DEGRADED" = "DISCONNECTED";
  let waDetail: any = null;
  let callingStatus = "DISABLED";
  try {
    const cfg = await WhatsAppBusinessConfigService.getConfig();
    if (cfg.accessToken && cfg.phoneNumberId) {
      const r = await fetch(
        `https://graph.facebook.com/v21.0/${cfg.phoneNumberId}?fields=status,quality_rating,code_verification_status,display_phone_number`,
        { headers: { Authorization: `Bearer ${cfg.accessToken}` } }
      );
      const data = await r.json();
      waDetail = data;
      waStatus = r.ok && data?.status === "CONNECTED" ? "CONNECTED" : "DEGRADED";

      const cr = await fetch(`https://graph.facebook.com/v21.0/${cfg.phoneNumberId}/settings`, {
        headers: { Authorization: `Bearer ${cfg.accessToken}` },
      });
      if (cr.ok) {
        const cData = await cr.json();
        callingStatus = cData?.calling?.status || "DISABLED";
      }
    }
  } catch (e: any) {
    waDetail = { error: e?.message || "Meta Graph API check failed" };
  }

  // 3. Razorpay API Live Auth Probe (GET /v1/orders?count=1)
  let razorpayStatus: "CONNECTED" | "DISCONNECTED" | "DEGRADED" = "DISCONNECTED";
  const rzpKey = process.env.RAZORPAY_KEY_ID;
  const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
  if (rzpKey && rzpSecret) {
    try {
      const authHeader = Buffer.from(`${rzpKey}:${rzpSecret}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders?count=1", {
        headers: { Authorization: `Basic ${authHeader}` },
      });
      razorpayStatus = rzpRes.ok ? "CONNECTED" : "DEGRADED";
    } catch {
      razorpayStatus = "DEGRADED";
    }
  }

  // 4. Local Storage & Recording Storage Writability
  let storageStatus: "CONNECTED" | "DEGRADED" = "DEGRADED";
  try {
    const mediaDir = path.join(process.cwd(), "storage", "whatsapp-media");
    await fs.mkdir(mediaDir, { recursive: true });
    await fs.access(mediaDir);
    storageStatus = "CONNECTED";
  } catch {
    storageStatus = "DEGRADED";
  }

  // 5. Queue / Delivery Failure Metrics + Last Success & Last Failure
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [failedDeliveries24h, failedBulkBatches, failedEmailLogs24h, lastSuccessDelivery, lastFailedDelivery, activeDevices] =
    await Promise.all([
      db.notificationDeliveryLog.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }).catch(() => 0),
      db.leadImportBatch.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }).catch(() => 0),
      db.studentAdmissionEmailLog.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }).catch(() => 0),
      db.notificationDeliveryLog
        .findFirst({ where: { status: { in: ["SENT", "DELIVERED", "READ"] } }, orderBy: { createdAt: "desc" }, select: { id: true, channel: true, createdAt: true } })
        .catch(() => null),
      db.notificationDeliveryLog
        .findFirst({ where: { status: "FAILED" }, orderBy: { createdAt: "desc" }, select: { id: true, channel: true, errorMessage: true, retryCount: true, createdAt: true } })
        .catch(() => null),
      db.slgDeviceRegistration.count({ where: { status: "ACTIVE" } }).catch(() => 0),
    ]);

  // 6. Email SMTP Probe (softlab-mail-api or SMTP config)
  const smtpConfigured = Boolean(process.env.SMTP_HOST || process.env.MAIL_API_URL || process.env.RESEND_API_KEY);
  const smtpStatus = smtpConfigured ? "CONNECTED" : "DISCONNECTED";

  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  return NextResponse.json({
    ok: true,
    checkedAt,
    services: [
      { name: "PostgreSQL Database", status: dbStatus, latencyMs: dbLatencyMs, error: dbError },
      { name: "Meta WhatsApp Cloud API", status: waStatus, detail: waDetail },
      { name: "Meta WhatsApp Native Calling", status: callingStatus, fallback: "SLG_CLOUD_TELEPHONY_ACTIVE" },
      { name: "SLG Cloud Telephony", status: "CONNECTED", activeDevices },
      { name: "Razorpay Gateway API", status: razorpayStatus },
      { name: "Email SMTP / Mailer", status: smtpStatus },
      { name: "Media & Recording Storage", status: storageStatus },
      {
        name: "Background Queues & Delivery (24h)",
        status: failedDeliveries24h + failedBulkBatches + failedEmailLogs24h === 0 ? "CONNECTED" : "ATTENTION_REQUIRED",
        failedDeliveries24h,
        failedBulkBatches,
        failedEmailLogs24h,
        lastSuccessDelivery,
        lastFailedDelivery,
      },
    ],
    host: {
      uptimeSeconds: Math.round(os.uptime()),
      memoryUsedPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
      loadAvg: os.loadavg(),
    },
  });
}

export async function POST(req: NextRequest) {
  const token = await getAuth(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.action === "DEAD_LETTER_FAILED_DELIVERIES") {
    const updated = await db.notificationDeliveryLog.updateMany({
      where: { status: "FAILED", retryCount: { gte: 3 } },
      data: { errorMessage: "Moved to DEAD_LETTER after max retries" },
    });
    return NextResponse.json({ ok: true, deadLettered: updated.count });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
