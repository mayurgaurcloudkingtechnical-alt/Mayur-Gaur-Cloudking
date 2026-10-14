import { NextResponse, type NextRequest } from "next/server";
import { HiringIngestionService } from "@/server/services/hiring-ingestion.service";
import { HiringAutomationConfigService } from "@/server/services/hiring-automation-config.service";

export const dynamic = "force-dynamic";

/**
 * WhatsApp Hiring Webhook Verification (GET)
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode") || searchParams.get("mode");
  const token = searchParams.get("hub.verify_token") || searchParams.get("token");
  const challenge = searchParams.get("hub.challenge") || searchParams.get("challenge");

  const config = await HiringAutomationConfigService.getConfig();
  const expectedToken = config.webhookSecret || "slg_hiring_wh_sec_2026";

  if (mode === "subscribe" && token === expectedToken) {
    return new Response(challenge || "", { status: 200 });
  }

  return NextResponse.json({
    status: "active",
    endpoint: "SoftLab Global WhatsApp Hiring Automation Webhook Sentinel",
    verified: token === expectedToken,
    instructions: "Configure this webhook URL in your authorized WhatsApp forwarder or business bot.",
  });
}

/**
 * Incoming Hiring Message Ingestion (POST)
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hiring-signature") || req.headers.get("x-hub-signature-256");

    const config = await HiringAutomationConfigService.getConfig();
    const secret = config.webhookSecret || "slg_hiring_wh_sec_2026";

    // 1. Signature Verification if signature header provided
    if (signature) {
      const isValid = HiringIngestionService.verifyWebhookSignature(rawBody, signature, secret);
      if (!isValid) {
        console.warn("[Hiring Webhook] Invalid HMAC signature rejected.");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      // If not JSON, treat rawBody as raw text message
      payload = { text: rawBody };
    }

    // Support both direct format and Meta Webhook payload format
    let rawText = "";
    let senderPhone = "";
    let senderName = "";
    let providerMessageId = "";
    let sourceId = req.nextUrl.searchParams.get("sourceId") || payload.sourceId;

    if (payload.entry && Array.isArray(payload.entry)) {
      // Meta WhatsApp Cloud API format
      const change = payload.entry[0]?.changes?.[0]?.value;
      const msg = change?.messages?.[0];
      const contact = change?.contacts?.[0];

      if (msg) {
        providerMessageId = msg.id;
        senderPhone = msg.from;
        senderName = contact?.profile?.name || "WhatsApp User";
        rawText = msg.text?.body || msg.caption || "";
      }
    } else {
      // Direct ingestion format
      rawText = payload.text || payload.message || payload.rawText || "";
      senderPhone = payload.phone || payload.senderPhone || "";
      senderName = payload.name || payload.senderName || "Recruiter / Forwarder";
      providerMessageId = payload.messageId || payload.id || `wh_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: "No message text found in payload" }, { status: 400 });
    }

    const result = await HiringIngestionService.processIncomingMessage({
      sourceId,
      rawText,
      senderPhone,
      senderName,
      providerMessageId,
      channel: "WHATSAPP_WEBHOOK",
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("[Hiring Webhook Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to process message" }, { status: 500 });
  }
}
