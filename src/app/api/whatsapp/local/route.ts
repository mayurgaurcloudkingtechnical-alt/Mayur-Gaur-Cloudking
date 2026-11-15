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
    const [recentMessages, recentCalls, totalCourses, socialMessages, socialLeads] = await Promise.all([
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
      db.omnichannelMessage.findMany({
        where: { channel: { in: ["INSTAGRAM", "FACEBOOK_PAGE"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          channel: true,
          senderType: true,
          senderName: true,
          content: true,
          status: true,
          createdAt: true,
          conversation: { select: { id: true, externalThreadId: true, lead: { select: { id: true, fullName: true, phone: true } } } },
        },
      }),
      db.lead.findMany({
        where: { source: { in: ["SOCIAL_MEDIA", "META_LEAD_ADS", "FACEBOOK", "INSTAGRAM"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          fullName: true,
          phone: true,
          source: true,
          status: true,
          campaignName: true,
          interestedCourse: true,
          createdAt: true,
        },
      }),
    ]);
    return NextResponse.json({
      recentMessages,
      recentCalls,
      totalCourses,
      socialMessages,
      socialLeads,
      metaInfo: {
        pageId: process.env.META_PAGE_ID || "SoftLab Global",
        pageUrl: process.env.META_PAGE_URL || "https://www.facebook.com/softlabglobal",
        instagramHandle: "@softlabglobal",
        instagramUrl: "https://www.instagram.com/softlabglobal",
        webhookUrl: "https://www.softlabglobal.com/api/webhooks/meta",
        verifyTokenConfigured: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
      },
    });
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

    if (action === "send_social_reply") {
      const conversationId = String(body.conversationId || "");
      const channel = String(body.channel || "INSTAGRAM");
      const text = String(body.text || "").trim();
      if (!conversationId || !text) {
        return NextResponse.json({ success: false, error: "Conversation ID and reply text required" }, { status: 400 });
      }
      const convo = await db.omnichannelConversation.findUnique({
        where: { id: conversationId },
        select: { id: true, externalThreadId: true },
      });
      if (!convo) {
        return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
      }

      let dispatched = false;
      const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
      if (pageToken && convo.externalThreadId) {
        try {
          const graphRes = await fetch(
            `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(pageToken)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipient: { id: convo.externalThreadId },
                message: { text },
              }),
              signal: AbortSignal.timeout(6000),
            }
          );
          dispatched = graphRes.ok;
        } catch {}
      }

      const saved = await db.omnichannelMessage.create({
        data: {
          conversationId: convo.id,
          senderType: "STAFF",
          senderName: String(token.name || "SoftLab Staff"),
          channel,
          messageType: "TEXT",
          content: text,
          status: dispatched ? "SENT" : "QUEUED",
        },
        select: { id: true, status: true },
      });
      return NextResponse.json({ success: true, messageId: saved.id, status: saved.status });
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
