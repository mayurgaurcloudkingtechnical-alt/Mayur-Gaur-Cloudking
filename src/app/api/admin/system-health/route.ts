import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import os from "os";
import { db } from "@/server/db/client";
import { WhatsAppBusinessConfigService } from "@/server/services/whatsapp-business-config.service";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN"];

export async function GET(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));

  if (!token?.sub || !ALLOWED_ROLES.includes(String(token.roleCode || ""))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checkedAt = new Date().toISOString();

  // 1. Real PostgreSQL Health Check
  let dbStatus: "HEALTHY" | "DEGRADED" = "DEGRADED";
  let dbLatencyMs = 0;
  let dbError: string | null = null;
  try {
    const t0 = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbStatus = "HEALTHY";
  } catch (e: any) {
    dbError = e?.message || "Database unreachable";
  }

  // 2. Real Meta WhatsApp Cloud API Graph Check (never assumes healthy from env presence)
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

  // 3. Queue / Delivery Failure Metrics (last 24h)
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [failedDeliveries24h, failedBulkBatches, failedEmailLogs24h] = await Promise.all([
    db.notificationDeliveryLog.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }).catch(() => 0),
    db.leadImportBatch.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }).catch(() => 0),
    db.studentAdmissionEmailLog.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }).catch(() => 0),
  ]);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  return NextResponse.json({
    ok: true,
    checkedAt,
    services: [
      {
        name: "PostgreSQL Database",
        status: dbStatus,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
      {
        name: "Meta WhatsApp Cloud API",
        status: waStatus,
        detail: waDetail,
      },
      {
        name: "Meta WhatsApp Native Calling",
        status: callingStatus,
        fallback: "SLG_CLOUD_TELEPHONY_ACTIVE",
      },
      {
        name: "Background Queues & Delivery (24h)",
        status: failedDeliveries24h + failedBulkBatches + failedEmailLogs24h === 0 ? "HEALTHY" : "ATTENTION_REQUIRED",
        failedDeliveries24h,
        failedBulkBatches,
        failedEmailLogs24h,
      },
    ],
    host: {
      uptimeSeconds: Math.round(os.uptime()),
      memoryUsedPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
      loadAvg: os.loadavg(),
    },
  });
}
