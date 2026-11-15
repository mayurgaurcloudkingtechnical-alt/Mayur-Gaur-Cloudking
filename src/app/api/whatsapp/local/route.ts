import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";

const WA_GATEWAY_URL = process.env.LOCAL_WHATSAPP_GATEWAY_URL || "http://127.0.0.1:3099";

const STAFF_ROLES = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "ADMIN",
  "MANAGER",
  "HR",
  "COUNSELOR",
  "TELECALLER",
  "TRAINER",
  "PLACEMENT_OFFICER",
  "ACCOUNTANT",
  "MARKETING",
];

async function getStaffToken(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));
  const role = String(token?.roleCode || "");
  if (!token?.sub || !STAFF_ROLES.includes(role)) return null;
  return token;
}

function resolveSessionId(req: NextRequest, token: any, bodyScope?: string) {
  const scope = bodyScope || req.nextUrl.searchParams.get("scope") || "org";
  const role = String(token.roleCode || "");
  if (scope === "org" && ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER"].includes(role)) {
    return "default";
  }
  return `user_${token.sub}`;
}

async function buildBusinessCatalogueText() {
  const courses = await db.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "asc" },
    take: 15,
    select: { title: true, slug: true, fee: true, durationWeeks: true },
  });

  const lines = courses.map((c, idx) => {
    const feeStr = c.fee ? `Rs.${Number(c.fee).toLocaleString("en-IN")}` : "Enquire";
    const durStr = c.durationWeeks ? `${c.durationWeeks} Wks` : "Flexible";
    return `${idx + 1}. *${c.title}* (${durStr} | ${feeStr})\n   https://www.softlabglobal.com/courses/${c.slug}`;
  });

  return [
    "*SOFTLAB GLOBAL — OFFICIAL COURSE CATALOGUE*",
    "Civil Lines, Prayagraj | +91 9196596975",
    "",
    ...lines,
    "",
    "*Bonus:* 6-Month Professional English Speaking & Personality Development Course (worth Rs.14,999) included FREE with regular admissions!",
    "",
    "View All Courses: https://www.softlabglobal.com/courses",
    "Talk to AI Counselor (Free Voice Call): https://www.softlabglobal.com/ai-call",
  ].join("\n");
}

export async function GET(req: NextRequest) {
  const token = await getStaffToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = req.nextUrl.searchParams.get("action") || "status";
  const sessionId = resolveSessionId(req, token);

  if (action === "feed") {
    const [recentMessages, recentCalls, totalCourses] = await Promise.all([
      db.omnichannelMessage.findMany({
        where: { channel: "WHATSAPP" },
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          id: true,
          senderType: true,
          senderName: true,
          content: true,
          status: true,
          createdAt: true,
          conversation: { select: { externalThreadId: true, lead: { select: { fullName: true, phone: true } } } },
        },
      }),
      db.staffCallLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          contactName: true,
          contactPhone: true,
          callType: true,
          callStatus: true,
          disposition: true,
          durationSeconds: true,
          createdAt: true,
        },
      }),
      db.course.count({ where: { isPublished: true } }),
    ]);
    return NextResponse.json({ recentMessages, recentCalls, totalCourses });
  }

  try {
    const res = await fetch(`${WA_GATEWAY_URL}/status?sessionId=${encodeURIComponent(sessionId)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { connected: false, status: "OFFLINE", sessionId, error: err?.message || "Gateway offline" },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = await getStaffToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = body.action || "send";
    const sessionId = resolveSessionId(req, token, body.scope);

    if (action === "logout" || action === "reset") {
      const res = await fetch(`${WA_GATEWAY_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
        signal: AbortSignal.timeout(5000),
      });
      return NextResponse.json(await res.json());
    }

    const messageText =
      action === "send_catalogue" ? await buildBusinessCatalogueText() : String(body.text || "");

    const res = await fetch(`${WA_GATEWAY_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, to: body.to, text: messageText }),
      signal: AbortSignal.timeout(10000),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed" }, { status: 500 });
  }
}
