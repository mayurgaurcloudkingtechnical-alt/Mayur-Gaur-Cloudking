import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";

function mapWaStatus(code: number): string {
  if (code >= 4) return "READ";
  if (code >= 3) return "DELIVERED";
  if (code >= 2) return "SENT";
  return "ACCEPTED_BY_PROVIDER";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, sessionId } = body;

    if (event === "inbound_message") {
      const rawPhone = String(body.from || "").replace(/\D/g, "");
      const tenDigit = rawPhone.slice(-10);
      if (tenDigit.length < 10) return NextResponse.json({ ok: true });

      let lead = await db.lead.findFirst({
        where: { OR: [{ phone: tenDigit }, { phone: rawPhone }] },
        select: { id: true, fullName: true },
      });

      if (!lead) {
        lead = await db.lead.create({
          data: {
            fullName: body.pushName || `WhatsApp ${tenDigit}`,
            phone: tenDigit,
            source: "WHATSAPP_INBOUND",
            status: "NEW",
            notes: `Auto-created from inbound WhatsApp (${sessionId})`,
          },
          select: { id: true, fullName: true },
        });
      }

      let conv = await db.omnichannelConversation.findFirst({
        where: { leadId: lead.id, channel: "WHATSAPP" },
      });
      if (!conv) {
        conv = await db.omnichannelConversation.create({
          data: {
            leadId: lead.id,
            channel: "WHATSAPP",
            externalThreadId: rawPhone,
            status: "OPEN",
            unreadCount: 1,
          },
        });
      } else {
        await db.omnichannelConversation.update({
          where: { id: conv.id },
          data: { unreadCount: { increment: 1 }, lastMessageAt: new Date() },
        });
      }

      if (body.messageId) {
        const existing = await db.omnichannelMessage.findFirst({
          where: { externalMsgId: String(body.messageId) },
          select: { id: true },
        });
        if (existing) return NextResponse.json({ ok: true, deduplicated: true });
      }

      await db.omnichannelMessage.create({
        data: {
          conversationId: conv.id,
          senderType: body.fromMe ? "STAFF" : "STUDENT",
          senderName: body.fromMe ? "WhatsApp Staff" : body.pushName || lead.fullName,
          channel: "WHATSAPP",
          messageType: "TEXT",
          content: String(body.text || ""),
          status: body.fromMe ? "SENT" : "DELIVERED",
          externalMsgId: body.messageId || undefined,
        },
      });

      await db.customerTimelineEvent
        .create({
          data: {
            leadId: lead.id,
            eventType: "WHATSAPP_INBOUND",
            source: "WHATSAPP",
            title: "Inbound WhatsApp Message Received",
            summary: String(body.text || "").slice(0, 300),
            metadata: { sessionId, messageId: body.messageId },
          },
        })
        .catch(() => {});

      return NextResponse.json({ ok: true });
    }

    if (event === "message_status" && body.messageId) {
      const mapped = mapWaStatus(Number(body.statusCode || 2));
      await db.omnichannelMessage
        .updateMany({
          where: { externalMsgId: String(body.messageId) },
          data: { status: mapped },
        })
        .catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (event === "incoming_call") {
      const rawPhone = String(body.from || "").replace(/\D/g, "");
      const tenDigit = rawPhone.slice(-10);
      const userIdFromSession = String(sessionId || "").startsWith("user_")
        ? String(sessionId).replace("user_", "")
        : null;

      let targetUserId = userIdFromSession;
      if (!targetUserId) {
        const admin = await db.user.findFirst({
          where: { roleCode: { in: ["SUPER_ADMIN", "ADMIN"] }, isActive: true },
          select: { id: true },
        });
        targetUserId = admin?.id || null;
      }

      const lead = tenDigit.length === 10
        ? await db.lead.findFirst({
            where: { OR: [{ phone: tenDigit }, { phone: rawPhone }] },
            select: { id: true, fullName: true },
          })
        : null;

      if (targetUserId && tenDigit) {
        await db.staffCallLog
          .create({
            data: {
              userId: targetUserId,
              leadId: lead?.id || null,
              contactName: lead?.fullName || `Incoming Caller (${tenDigit})`,
              contactPhone: tenDigit,
              callType: "INCOMING",
              callStatus: body.status === "offer" ? "RINGING" : body.status === "reject" || body.status === "timeout" ? "MISSED" : "CONNECTED",
              disposition: "INCOMING_CALL",
              durationSeconds: 0,
              notes: `Incoming WhatsApp ${body.isVideo ? "Video" : "Voice"} Call (${body.status})`,
              roleCode: "STAFF",
            },
          })
          .catch(() => {});
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Webhook error" }, { status: 500 });
  }
}
