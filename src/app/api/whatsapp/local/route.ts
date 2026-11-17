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
    where: { status: "PUBLISHED" },
    orderBy: { sortOrder: "asc" },
    take: 15,
    select: { title: true, slug: true, baseFee: true, discountedFee: true, durationWeeks: true },
  });

  const lines = courses.map((c, idx) => {
    const paise = c.discountedFee && c.discountedFee > 0 ? c.discountedFee : c.baseFee;
    const feeStr = paise ? `Rs.${Math.round(paise / 100).toLocaleString("en-IN")}` : "Enquire";
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
    const [recentMessages, recentCalls, totalCourses, socialMessages, socialLeads, gatewayHistory] = await Promise.all([
      db.omnichannelMessage.findMany({
        where: { channel: "WHATSAPP" },
        orderBy: { createdAt: "desc" },
        take: 25,
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
        take: 20,
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
      db.course.count({ where: { status: "PUBLISHED" } }),
      db.omnichannelMessage.findMany({
        where: { channel: { in: ["INSTAGRAM", "FACEBOOK_PAGE"] } },
        orderBy: { createdAt: "desc" },
        take: 25,
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
        where: { source: { in: ["SOCIAL_MEDIA", "META_ADS_FB", "META_ADS_IG"] } },
        orderBy: { createdAt: "desc" },
        take: 25,
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
      fetch(`${WA_GATEWAY_URL}/history?sessionId=${encodeURIComponent(sessionId)}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    const gatewayMessages = Array.isArray(gatewayHistory?.messages) ? gatewayHistory.messages : [];
    const gatewayCalls = Array.isArray(gatewayHistory?.calls) ? gatewayHistory.calls : [];
    const gatewayContacts = Array.isArray(gatewayHistory?.contacts) ? gatewayHistory.contacts : [];

    return NextResponse.json({
      recentMessages: recentMessages.length > 0 ? recentMessages : gatewayMessages,
      recentCalls: recentCalls.length > 0 ? recentCalls : gatewayCalls,
      waContacts: gatewayContacts,
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

  if (action === "phone_status") {
    const res = await fetch(`${WA_GATEWAY_URL}/phone/status?staffId=${encodeURIComponent(String(token.sub))}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    }).catch(() => null);
    const data = res && res.ok ? await res.json() : { paired: false, pendingCommands: [] };
    return NextResponse.json({ ...data, staffId: token.sub });
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

  if (action === "phone_status") {
    const res = await fetch(`${WA_GATEWAY_URL}/phone/status?staffId=${encodeURIComponent(String(token.sub))}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    }).catch(() => null);
    const data = res && res.ok ? await res.json() : { paired: false, pendingCommands: [] };
    return NextResponse.json({ ...data, staffId: token.sub });
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
        if (action === "phone_status") {
    const res = await fetch(`${WA_GATEWAY_URL}/phone/status?staffId=${encodeURIComponent(String(token.sub))}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    }).catch(() => null);
    const data = res && res.ok ? await res.json() : { paired: false, pendingCommands: [] };
    return NextResponse.json({ ...data, staffId: token.sub });
  }

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

    if (action === "send_phone_link_wa") {
      const userId = String(token.sub);
      const stRes = await fetch(`${WA_GATEWAY_URL}/status?sessionId=${encodeURIComponent(sessionId)}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      }).catch(() => null);
      const stData = stRes && stRes.ok ? await stRes.json() : null;
      const ownPhone = String(stData?.user?.id || "").split(":")[0].replace(/\D/g, "");
      if (!ownPhone) {
        return NextResponse.json({ success: false, error: "Connect your WhatsApp first or copy the link." }, { status: 400 });
      }
      const linkUrl = `https://lms.softlabglobal.com/phone-bridge?staffId=${encodeURIComponent(userId)}`;
      const sendRes = await fetch(`${WA_GATEWAY_URL}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          to: ownPhone,
          text: `*SoftLab Global Phone Link*\nTap this link on your mobile phone to pair SIM & WhatsApp calling with your PC CRM:\n${linkUrl}`,
        }),
        signal: AbortSignal.timeout(8000),
      });
      return NextResponse.json(await sendRes.json(), { status: sendRes.status });
    }

    if (action === "phone_bridge_dial") {
      const targetPhone = String(body.to || "").replace(/\D/g, "").slice(-10);
      if (targetPhone.length < 10) {
        return NextResponse.json({ success: false, error: "Valid 10-digit phone required" }, { status: 400 });
      }
      const mode = body.mode === "WHATSAPP_CALL" ? "WHATSAPP_CALL" : "SIM_CALL";
      const contactName = String(body.contactName || "Student / Lead");

      const callLog = await db.staffCallLog.create({
        data: {
          userId: String(token.sub),
          leadId: body.leadId ? String(body.leadId) : null,
          contactName,
          contactPhone: targetPhone,
          callType: "OUTGOING",
          callStatus: "INITIATED",
          disposition: mode,
          durationSeconds: 0,
          notes: `[${mode === "WHATSAPP_CALL" ? "WhatsApp Call" : "SIM Call"}] Initiated by ${String(token.name || "Staff")}`,
          roleCode: String(token.roleCode || "COUNSELOR"),
        },
        select: { id: true },
      });

      const bridgeRes = await fetch(`${WA_GATEWAY_URL}/phone/dial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: String(token.sub),
          to: `+91${targetPhone}`,
          mode,
          contactName,
          callLogId: callLog.id,
        }),
        signal: AbortSignal.timeout(4000),
      }).catch(() => null);
      const bridgeData = bridgeRes && bridgeRes.ok ? await bridgeRes.json() : { paired: false };

      return NextResponse.json({
        success: true,
        callLogId: callLog.id,
        paired: Boolean(bridgeData?.paired),
        mode,
        to: `+91${targetPhone}`,
      });
    }

    const messageText =
      action === "send_catalogue" ? await buildBusinessCatalogueText() : String(body.text || "");

    const res = await fetch(`${WA_GATEWAY_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, to: body.to, text: messageText }),
      signal: AbortSignal.timeout(10000),
    });
    const sendData = await res.json();

    if (res.ok && sendData?.success) {
      const digits = String(body.to || "").replace(/\D/g, "").slice(-10);
      if (digits.length === 10) {
        try {
          let lead = await db.lead.findFirst({
            where: { phone: { contains: digits } },
            select: { id: true, fullName: true },
          });
          if (!lead) {
            lead = await db.lead.create({
              data: {
                fullName: String(body.contactName || `WhatsApp ${digits}`),
                phone: digits,
                source: "WHATSAPP",
                status: "CONTACTED",
              },
              select: { id: true, fullName: true },
            });
          }
          let convo = await db.omnichannelConversation.findFirst({
            where: { channel: "WHATSAPP", externalThreadId: { contains: digits } },
            select: { id: true },
          });
          if (!convo) {
            convo = await db.omnichannelConversation.create({
              data: {
                leadId: lead.id,
                channel: "WHATSAPP",
                externalThreadId: `91${digits}`,
                status: "HUMAN_RESOLVED",
              },
              select: { id: true },
            });
          } else {
            await db.omnichannelConversation.update({
              where: { id: convo.id },
              data: { lastMessageAt: new Date() },
            });
          }
          await db.omnichannelMessage.create({
            data: {
              conversationId: convo.id,
              senderType: "STAFF",
              senderName: String(token.name || "SoftLab Staff"),
              channel: "WHATSAPP",
              messageType: "TEXT",
              content: messageText,
              status: "SENT",
              externalMsgId: sendData.messageId ? String(sendData.messageId) : null,
            },
          });
        } catch {}
      }
    }

    return NextResponse.json(sendData, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed" }, { status: 500 });
  }
}
