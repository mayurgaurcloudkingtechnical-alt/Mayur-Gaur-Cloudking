import { NextResponse, type NextRequest } from "next/server";
import { CrmIngestionService } from "@/server/services/crm-ingestion.service";
import { WhatsAppBusinessService } from "@/server/services/whatsapp-business.service";
import { WhatsAppMediaService } from "@/server/services/whatsapp-media.service";
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
    if (appSecret) {
      if (!signature) {
        console.warn("[WhatsApp Webhook Warning]: Missing x-hub-signature-256 header.");
        return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
      }
      const hmac = crypto.createHmac("sha256", appSecret);
      const digest = `sha256=${hmac.update(rawBody).digest("hex")}`;
      const sigBuf = Buffer.from(signature);
      const digBuf = Buffer.from(digest);
      if (sigBuf.length !== digBuf.length || !crypto.timingSafeEqual(sigBuf, digBuf)) {
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

      // Check for Opt-Out (STOP / UNSUBSCRIBE) or Opt-In (START / SUBSCRIBE)
      if (lowerText === "stop" || lowerText === "unsubscribe" || lowerText === "optout") {
        await WhatsAppBusinessService.handleOptOut(fromPhone, "User sent STOP via WhatsApp");
        await WhatsAppBusinessService.sendMessage({
          toPhone: fromPhone,
          text: "You have been unsubscribed from automated messages from SoftLab Global. You will receive no further messages. Reply START to re-subscribe.",
        });
        return;
      }

      if (lowerText === "start" || lowerText === "subscribe") {
        const cleanDigits = fromPhone.replace(/\D/g, "").slice(-10);
        if (cleanDigits.length === 10) {
          await db.lead.updateMany({
            where: { phone: cleanDigits },
            data: { isOptedOut: false, optOutDate: null },
          });
        }
      }

      // Download and securely store Meta media attachments if present
      const mediaNode =
        rawPayload?.image ||
        rawPayload?.document ||
        rawPayload?.video ||
        rawPayload?.audio ||
        rawPayload?.voice ||
        rawPayload?.sticker;
      const storedMedia = mediaNode?.id
        ? await WhatsAppMediaService.downloadAndStoreMedia(
            mediaNode.id,
            mediaNode.mime_type,
            mediaNode.filename
          )
        : null;

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
        messageType: storedMedia ? (rawPayload?.type?.toUpperCase() || "MEDIA") : "TEXT",
        content: trimmedText,
        metadata: {
          wamid: msgId,
          ...(storedMedia ? { media: storedMedia } : {}),
        },
        rawPayload,
      });

      // Track campaign reply attribution if recipient previously received an Offer campaign
      const clean10 = fromPhone.replace(/\D/g, "").slice(-10);
      if (clean10.length === 10) {
        const recentRecipient = await db.offerCampaignRecipient.findFirst({
          where: { phone: { endsWith: clean10 }, repliedAt: null },
          orderBy: { createdAt: "desc" },
        });
        if (recentRecipient) {
          await db.offerCampaignRecipient.update({
            where: { id: recentRecipient.id },
            data: { repliedAt: new Date() },
          });
          await db.offerCampaignDispatch.update({
            where: { id: recentRecipient.dispatchId },
            data: { replyCount: { increment: 1 } },
          });
        }
      }

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
                const wamid = statusObj.id;
                const statusStr = (statusObj.status || "").toUpperCase(); // "SENT", "DELIVERED", "READ", "FAILED"
                console.log(`[WhatsApp Status] Message ${wamid} status: ${statusStr}`);

                try {
                  const existingMsg = await db.omnichannelMessage.findFirst({
                    where: { externalMsgId: wamid },
                    include: { conversation: true },
                  });

                  if (existingMsg) {
                    await db.omnichannelMessage.update({
                      where: { id: existingMsg.id },
                      data: {
                        status: statusStr,
                        metadata: {
                          ...(typeof existingMsg.metadata === "object" && existingMsg.metadata !== null
                            ? (existingMsg.metadata as any)
                            : {}),
                          lastCarrierStatus: statusStr,
                          statusUpdatedAt: new Date().toISOString(),
                          errors: statusObj.errors,
                        },
                      },
                    });

                    if (statusStr === "FAILED") {
                      const errDetail =
                        statusObj.errors?.[0]?.title ||
                        statusObj.errors?.[0]?.message ||
                        "Carrier rejected message";
                      await db.customerTimelineEvent.create({
                        data: {
                          leadId: existingMsg.conversation.leadId,
                          eventType: "WHATSAPP_FAILED",
                          source: "WHATSAPP",
                          title: "WhatsApp Delivery Failed",
                          summary: `Message ${wamid} failed to deliver: ${errDetail}`,
                          metadata: { wamid, errors: statusObj.errors },
                        },
                      });
                    } else if (statusStr === "READ") {
                      await db.customerTimelineEvent.create({
                        data: {
                          leadId: existingMsg.conversation.leadId,
                          eventType: "WHATSAPP_READ",
                          source: "WHATSAPP",
                          title: "WhatsApp Message Read",
                          summary: `Lead opened and read WhatsApp message (${wamid}).`,
                          metadata: { wamid },
                        },
                      });
                    }
                  }
                  // Sync status to NotificationDeliveryLog for Recipient-Wise Analytics
                  if (wamid) {
                    const errDetail =
                      statusStr === "FAILED"
                        ? statusObj.errors?.[0]?.title || statusObj.errors?.[0]?.message || "Carrier rejected message"
                        : undefined;
                    await db.notificationDeliveryLog.updateMany({
                      where: {
                        channel: "WHATSAPP",
                        providerResponse: { contains: wamid },
                      },
                      data: {
                        status: statusStr,
                        ...(statusStr === "DELIVERED" || statusStr === "READ" ? { deliveredAt: new Date() } : {}),
                        ...(errDetail ? { errorMessage: errDetail } : {}),
                      },
                    });

                    // Update OfferCampaignRecipient & Dispatch metrics
                    const campaignRecipients = await db.offerCampaignRecipient.findMany({
                      where: { whatsappMessageId: wamid },
                      select: { id: true, dispatchId: true, whatsappStatus: true },
                    });
                    for (const cr of campaignRecipients) {
                      if (cr.whatsappStatus !== statusStr) {
                        await db.offerCampaignRecipient.update({
                          where: { id: cr.id },
                          data: { whatsappStatus: statusStr, ...(errDetail ? { errorMessage: errDetail } : {}) },
                        });
                        if (statusStr === "DELIVERED") {
                          await db.offerCampaignDispatch.update({ where: { id: cr.dispatchId }, data: { deliveredCount: { increment: 1 } } });
                        } else if (statusStr === "READ") {
                          await db.offerCampaignDispatch.update({ where: { id: cr.dispatchId }, data: { readCount: { increment: 1 } } });
                        } else if (statusStr === "FAILED") {
                          await db.offerCampaignDispatch.update({ where: { id: cr.dispatchId }, data: { failedCount: { increment: 1 } } });
                        }
                      }
                    }
                  }
                } catch (statusDbErr: any) {
                  console.error(`[WhatsApp Status DB Error] ${statusDbErr.message}`);
                }
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
                } else if (msg.type === "image") {
                  messageText = `[IMAGE: ${msg.image?.id || "media"}] ${msg.image?.caption || ""}`.trim();
                } else if (msg.type === "document") {
                  messageText = `[DOCUMENT: ${msg.document?.filename || msg.document?.id || "file"}] ${msg.document?.caption || ""}`.trim();
                } else if (msg.type === "video") {
                  messageText = `[VIDEO: ${msg.video?.id || "media"}] ${msg.video?.caption || ""}`.trim();
                } else if (msg.type === "audio" || msg.type === "voice") {
                  messageText = `[AUDIO/VOICE: ${msg.audio?.id || msg.voice?.id || "media"}]`;
                } else if (msg.type === "location") {
                  messageText = `[LOCATION: ${msg.location?.name || "Pin"} (${msg.location?.latitude}, ${msg.location?.longitude})]`;
                } else if (msg.type === "contacts") {
                  const summary = (msg.contacts || [])
                    .map((c: any) => `${c.name?.formatted_name || "Contact"} (${c.phones?.[0]?.phone || "N/A"})`)
                    .join("; ");
                  messageText = `[CONTACT: ${summary || "vCard"}]`;
                } else if (msg.type === "reaction") {
                  messageText = `[REACTION: ${msg.reaction?.emoji || "👍"} on ${msg.reaction?.message_id || "message"}]`;
                } else if (msg.type === "sticker") {
                  messageText = `[STICKER: ${msg.sticker?.id || "media"}]`;
                }

                if (fromPhone && messageText) {
                  await processMessage(fromPhone, senderName, messageText, msgId, msg);
                }
              }
            }

            // Phase 2: Handle Meta WhatsApp Calling API webhook events (when enabled on WABA/phone)
            if (value && Array.isArray(value.calls)) {
              for (const callEvt of value.calls) {
                const callerPhone = String(callEvt.from || callEvt.to || "").replace(/\D/g, "").slice(-10);
                if (callerPhone.length === 10) {
                  const matchedLead = await db.lead.findFirst({ where: { phone: callerPhone }, select: { id: true } });
                  if (matchedLead) {
                    await db.customerTimelineEvent.create({
                      data: {
                        leadId: matchedLead.id,
                        eventType: "WHATSAPP_CALL",
                        source: "WHATSAPP",
                        title: `WhatsApp Call (${callEvt.event || callEvt.status || "EVENT"})`,
                        summary: `Call ID: ${callEvt.id || "N/A"} | Duration: ${callEvt.duration ?? 0}s | Status: ${callEvt.status || callEvt.event || "LOGGED"}`,
                        metadata: callEvt,
                      },
                    });
                  }
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
