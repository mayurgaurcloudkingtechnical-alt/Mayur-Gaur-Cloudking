import { NextResponse, type NextRequest } from "next/server";
import { CrmIngestionService } from "@/server/services/crm-ingestion.service";
import { WhatsAppBusinessService } from "@/server/services/whatsapp-business.service";
import { OmnichannelInboxService } from "@/server/services/omnichannel-inbox.service";
import { AiCounselorService } from "@/server/services/ai-counselor.service";
import { db } from "@/server/db/client";
import { LeadSource } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * WhatsApp Cloud API Webhook
 * GET: Verification challenge from Meta Developer Portal
 * POST: Incoming WhatsApp message / prospective lead / AI Counselor auto-replies
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN ||
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
    "softlab_whatsapp_2026";

  if (mode === "subscribe" && token === expectedToken) {
    return new Response(challenge || "", { status: 200 });
  }

  return NextResponse.json({
    status: "active",
    platform: "WhatsApp Cloud API & Business Messaging",
    message: "SoftLab Global WhatsApp Webhook active",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Helper to process an incoming WhatsApp message
    const processMessage = async (fromPhone: string, senderName: string, messageText: string, rawPayload: any) => {
      const trimmedText = messageText.trim();
      const lowerText = trimmedText.toLowerCase();

      // 1. Check for Opt-Out
      if (lowerText === "stop" || lowerText === "unsubscribe" || lowerText === "optout") {
        await WhatsAppBusinessService.handleOptOut(fromPhone, "User sent STOP via WhatsApp");
        await WhatsAppBusinessService.sendMessage({
          toPhone: fromPhone,
          text: "You have been unsubscribed from automated messages from SoftLab Global. You will receive no further messages. Reply START to re-subscribe.",
        });
        return;
      }

      // 2. Ingest or fetch lead
      const ingestRes = await CrmIngestionService.ingestLead({
        fullName: senderName,
        phone: fromPhone,
        source: LeadSource.WHATSAPP,
        notes: `WhatsApp: "${trimmedText}"`,
        campaignName: "WhatsApp Direct Inbound",
        rawPayload,
      });

      const leadId = ingestRes.leadId;

      // 3. Attach to OmnichannelConversation
      const conversation = await OmnichannelInboxService.getOrCreateConversation(leadId, "WHATSAPP", fromPhone);

      // 4. Save Inbound Message
      await OmnichannelInboxService.addMessage({
        conversationId: conversation.id,
        senderType: "LEAD",
        senderName,
        channel: "WHATSAPP",
        messageType: "TEXT",
        content: trimmedText,
        rawPayload,
      });

      // 5. If conversation is managed by AI, invoke AI Counselor
      if (conversation.status === "AI_HANDLING") {
        const lead = await db.lead.findUnique({
          where: { id: leadId },
          include: { course: true },
        });

        const aiResult = await AiCounselorService.counsel({
          leadId,
          leadName: senderName,
          leadPhone: fromPhone,
          courseName: lead?.course?.title,
          userMessage: trimmedText,
          channel: "WHATSAPP",
        });

        // Update lead score, temperature, intent
        await db.lead.update({
          where: { id: leadId },
          data: {
            leadScore: aiResult.leadScore,
            temperature: aiResult.temperature,
          },
        });

        // Send AI Counselor response on WhatsApp
        await WhatsAppBusinessService.sendMessage({
          toPhone: fromPhone,
          text: aiResult.replyText,
          leadId,
        });

        // Save Outbound AI Counselor Message
        await OmnichannelInboxService.addMessage({
          conversationId: conversation.id,
          senderType: "AI_AGENT",
          senderName: "SoftLab AI Counselor",
          channel: "WHATSAPP",
          messageType: "TEXT",
          content: aiResult.replyText,
          metadata: {
            intent: aiResult.intent,
            score: aiResult.leadScore,
            confidence: aiResult.confidence,
          },
        });

        // If escalation is flagged (e.g. discount query or complaint), flag conversation for human
        if (aiResult.escalationRequired) {
          await db.omnichannelConversation.update({
            where: { id: conversation.id },
            data: { status: "NEEDS_HUMAN" },
          });
        }
      }
    };

    // Standard WhatsApp Cloud API payload format
    if (body.object === "whatsapp_business_account" && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const value = change.value;
            if (value && Array.isArray(value.messages)) {
              for (const msg of value.messages) {
                const fromPhone = msg.from; // e.g. "919876543210"
                const contact = value.contacts?.find((c: any) => c.wa_id === fromPhone);
                const senderName = contact?.profile?.name || "WhatsApp Inquirer";

                let messageText = "";
                if (msg.type === "text") {
                  messageText = msg.text?.body || "";
                } else if (msg.type === "button") {
                  messageText = msg.button?.text || "";
                } else if (msg.type === "interactive") {
                  messageText =
                    msg.interactive?.button_reply?.title ||
                    msg.interactive?.list_reply?.title ||
                    "";
                }

                if (fromPhone && messageText) {
                  await processMessage(fromPhone, senderName, messageText, msg);
                }
              }
            }
          }
        }
      }

      return NextResponse.json({ status: "success", received: true });
    }

    // Direct / Zapier / Twilio WhatsApp payload format
    const phone = body.phone || body.From || body.from || body.mobile || "";
    const fullName = body.name || body.fullName || body.ProfileName || "WhatsApp User";
    const notes = body.message || body.Body || body.text || body.notes || "WhatsApp lead inquiry";

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ status: "ignored", message: "No valid phone number" }, { status: 200 });
    }

    await processMessage(phone, fullName, notes, body);

    return NextResponse.json({
      status: "success",
      code: 200,
    });
  } catch (error: any) {
    console.error("[WhatsAppWebhook Error]:", error);
    return NextResponse.json(
      { status: "error", code: 500, message: error.message || "WhatsApp webhook error" },
      { status: 500 }
    );
  }
}
