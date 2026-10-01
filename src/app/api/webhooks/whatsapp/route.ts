import { NextResponse, type NextRequest } from "next/server";
import { CrmIngestionService } from "@/server/services/crm-ingestion.service";
import { WhatsAppBusinessService } from "@/server/services/whatsapp-business.service";
import { OmnichannelInboxService } from "@/server/services/omnichannel-inbox.service";
import { AiCounselorService } from "@/server/services/ai-counselor.service";
import { AiCallingAgentService } from "@/server/services/ai-calling-agent.service";
import { db } from "@/server/db/client";
import { LeadSource } from "@prisma/client";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * WhatsApp Cloud API Webhook Verification (GET)
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
    console.log("[WhatsApp Webhook] Verification successful for Meta challenge.");
    return new Response(challenge || "", { status: 200 });
  }

  return NextResponse.json({
    status: "active",
    platform: "Official Meta WhatsApp Business Cloud API & Webhook Sentinel",
    mode: mode || "health_check",
    verified: false,
    message: "SoftLab Global WhatsApp Webhook active. Awaiting subscribe challenge.",
  });
}

/**
 * Incoming WhatsApp Message & Status Webhook (POST)
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    // 1. Signature validation (Phase 18: Security & Reliability)
    if (appSecret && signature) {
      const hmac = crypto.createHmac("sha256", appSecret);
      const digest = `sha256=${hmac.update(rawBody).digest("hex")}`;
      if (signature !== digest) {
        console.warn("[WhatsApp Webhook Warning]: Invalid webhook signature rejected.");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Process a single incoming message
    const processMessage = async (
      fromPhone: string,
      senderName: string,
      messageText: string,
      msgId: string,
      rawPayload: any
    ) => {
      const trimmedText = messageText.trim();
      const lowerText = trimmedText.toLowerCase();

      // Idempotency: skip already processed message ID
      if (msgId) {
        const existingMsg = await db.omnichannelMessage.findFirst({
          where: {
            metadata: {
              path: ["wamid"],
              equals: msgId,
            },
          },
        });
        if (existingMsg) {
          console.log(`[WhatsApp Webhook] Duplicate message skipped: ${msgId}`);
          return;
        }
      }

      // Check for Opt-Out (STOP / UNSUBSCRIBE)
      if (lowerText === "stop" || lowerText === "unsubscribe" || lowerText === "optout") {
        await WhatsAppBusinessService.handleOptOut(fromPhone, "User sent STOP via WhatsApp");
        await WhatsAppBusinessService.sendMessage({
          toPhone: fromPhone,
          text: "You have been unsubscribed from automated messages from SoftLab Global. You will receive no further messages. Reply START to re-subscribe.",
        });
        return;
      }

      // Ingest / Deduplicate Lead in CRM
      const ingestRes = await CrmIngestionService.ingestLead({
        fullName: senderName,
        phone: fromPhone,
        source: LeadSource.WHATSAPP,
        notes: `WhatsApp: "${trimmedText}"`,
        campaignName: "WhatsApp Direct Inbound",
        rawPayload,
      });

      const leadId = ingestRes.leadId;

      // Attach or create Omnichannel Conversation
      const conversation = await OmnichannelInboxService.getOrCreateConversation(
        leadId,
        "WHATSAPP",
        fromPhone
      );

      // Record incoming message in DB
      await OmnichannelInboxService.addMessage({
        conversationId: conversation.id,
        senderType: "LEAD",
        senderName,
        channel: "WHATSAPP",
        messageType: "TEXT",
        content: trimmedText,
        metadata: {
          wamid: msgId,
        },
        rawPayload,
      });

      // If conversation is handled by AI, invoke AI Counselor
      if (conversation.status === "AI_HANDLING") {
        const lead = await db.lead.findUnique({
          where: { id: leadId },
          include: { course: true },
        });

        // Determine ongoing language from previous AI message if available
        const lastAiMsg = await db.omnichannelMessage.findFirst({
          where: { conversationId: conversation.id, senderType: "AI_AGENT" },
          orderBy: { createdAt: "desc" },
        });
        const existingLang = (lastAiMsg?.metadata as any)?.language;

        const aiResult = await AiCounselorService.counsel({
          leadId,
          leadName: senderName,
          leadPhone: fromPhone,
          courseName: lead?.course?.title,
          userMessage: trimmedText,
          channel: "WHATSAPP",
          conversationLanguage: existingLang,
        });

        // Update lead score, temperature, and qualifications
        const qualificationData: any = {};
        if (aiResult.qualificationExtracted?.education) {
          qualificationData.qualification = aiResult.qualificationExtracted.education;
        }

        await db.lead.update({
          where: { id: leadId },
          data: {
            leadScore: aiResult.leadScore,
            temperature: aiResult.temperature,
            lastInteraction: new Date(),
            ...qualificationData,
          },
        });

        // Dispatch AI Counselor response via WhatsApp
        if (aiResult.suggestedAction === "SEND_BROCHURE" && aiResult.matchedCourse) {
          await WhatsAppBusinessService.sendCourseBrochure(
            fromPhone,
            senderName,
            aiResult.matchedCourse.courseName,
            aiResult.matchedCourse.brochureUrl,
            leadId
          );
        } else {
          await WhatsAppBusinessService.sendMessage({
            toPhone: fromPhone,
            text: aiResult.replyText,
            leadId,
          });
        }

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
            language: aiResult.detectedLanguage,
            course: aiResult.matchedCourse?.courseName,
          },
        });

        // If human escalation is required, flag conversation
        if (aiResult.escalationRequired) {
          await db.omnichannelConversation.update({
            where: { id: conversation.id },
            data: { status: "NEEDS_HUMAN" },
          });
        }

        // If user requested a callback and lead is HOT, initiate AI voice call
        if (aiResult.intent === "CALLBACK_REQUEST" || trimmedText.toLowerCase().includes("call me")) {
          try {
            await AiCallingAgentService.triggerDirectLeadCall({
              leadId,
              preferredLanguage: aiResult.detectedLanguage === "ENGLISH" ? "English" : "Hindi",
            });
          } catch (callErr: any) {
            console.error("[AI Call Trigger Error]:", callErr.message);
          }
        }
      }
    };

    // 2. Standard WhatsApp Cloud API Payload Structure
    if (body.object === "whatsapp_business_account" && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const value = change.value;

            // Handle delivery & read status updates
            if (value && Array.isArray(value.statuses)) {
              for (const statusObj of value.statuses) {
                console.log(`[WhatsApp Status] Message ${statusObj.id} status: ${statusObj.status}`);
              }
            }

            // Handle incoming messages
            if (value && Array.isArray(value.messages)) {
              for (const msg of value.messages) {
                const fromPhone = msg.from;
                const contact = value.contacts?.find((c: any) => c.wa_id === fromPhone);
                const senderName = contact?.profile?.name || "WhatsApp Inquirer";
                const msgId = msg.id || "";

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
                  await processMessage(fromPhone, senderName, messageText, msgId, msg);
                }
              }
            }
          }
        }
      }

      return NextResponse.json({ status: "success", received: true });
    }

    // 3. Direct / Sandbox fallback payload format
    const phone = body.phone || body.From || body.from || body.mobile || "";
    const fullName = body.name || body.fullName || body.ProfileName || "WhatsApp User";
    const notes = body.message || body.Body || body.text || body.notes || "WhatsApp lead inquiry";
    const msgId = body.messageId || body.id || `direct_${Date.now()}`;

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ status: "ignored", message: "No valid phone number" }, { status: 200 });
    }

    await processMessage(phone, fullName, notes, msgId, body);

    return NextResponse.json({ status: "success", code: 200 });
  } catch (error: any) {
    console.error("[WhatsAppWebhook Error]:", error);
    return NextResponse.json(
      { status: "error", code: 500, message: error.message || "WhatsApp webhook error" },
      { status: 500 }
    );
  }
}
