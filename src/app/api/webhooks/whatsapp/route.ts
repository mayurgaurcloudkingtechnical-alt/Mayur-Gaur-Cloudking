import { NextResponse, type NextRequest } from "next/server";
import { CrmIngestionService } from "@/server/services/crm-ingestion.service";
import { LeadSource } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * WhatsApp Cloud API Webhook
 * GET: Verification challenge from Meta Developer Portal
 * POST: Incoming WhatsApp message / prospective lead
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

                if (fromPhone) {
                  await CrmIngestionService.ingestLead({
                    fullName: senderName,
                    phone: fromPhone,
                    source: LeadSource.WHATSAPP,
                    notes: `WhatsApp Message: "${messageText}"`,
                    campaignName: "WhatsApp Direct Inbound",
                    rawPayload: msg,
                  });
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

    const result = await CrmIngestionService.ingestLead({
      fullName,
      phone,
      source: LeadSource.WHATSAPP,
      notes,
      campaignName: "WhatsApp Business Outreach",
      rawPayload: body,
    });

    return NextResponse.json({
      status: "success",
      code: 200,
      leadId: result.leadId,
      isNew: result.isNew,
    });
  } catch (error: any) {
    console.error("[WhatsAppWebhook Error]:", error);
    return NextResponse.json(
      { status: "error", code: 500, message: error.message || "WhatsApp webhook error" },
      { status: 500 }
    );
  }
}
