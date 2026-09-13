import { NextResponse, type NextRequest } from "next/server";
import { CrmIngestionService } from "@/server/services/crm-ingestion.service";
import { LeadSource } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Meta (Facebook & Instagram Lead Ads) Webhook
 * GET: Webhook verification challenge from Meta Graph API
 * POST: Incoming lead event
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    process.env.META_VERIFY_TOKEN ||
    "softlab_meta_leadgen_2026";

  if (mode === "subscribe" && token === expectedToken) {
    return new Response(challenge || "", { status: 200 });
  }

  // Fallback health check
  return NextResponse.json({
    status: "active",
    platform: "Meta (Facebook & Instagram Lead Ads)",
    message: "SoftLab Global Meta Webhook active",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if standard Meta webhook structure
    if (body.object === "page" && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field === "leadgen") {
              const val = change.value || {};
              const leadgenId = val.leadgen_id;
              const formId = val.form_id;
              const adId = val.ad_id;

              // If lead details are attached directly (test tools or simulated payload)
              let fullName = val.full_name || val.name || "";
              let phone = val.phone_number || val.phone || "";
              let email = val.email || "";
              let courseName = val.course || val.interested_course || "";
              const campaignName = val.campaign_name || "Meta Facebook/Instagram Lead Ad";

              // If Meta Graph API token is set and contact details are not in payload, fetch from Graph API
              const metaToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
              if (leadgenId && (!phone || !fullName) && metaToken) {
                try {
                  const graphRes = await fetch(
                    `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${metaToken}`
                  );
                  if (graphRes.ok) {
                    const graphData = await graphRes.json();
                    if (Array.isArray(graphData.field_data)) {
                      for (const field of graphData.field_data) {
                        const fName = field.name?.toLowerCase() || "";
                        const fVal = field.values?.[0] || "";
                        if (fName.includes("name")) fullName = fVal;
                        if (fName.includes("phone") || fName.includes("mobile")) phone = fVal;
                        if (fName.includes("email")) email = fVal;
                        if (fName.includes("course") || fName.includes("program")) courseName = fVal;
                      }
                    }
                  }
                } catch (fetchErr) {
                  console.error("[MetaWebhook GraphAPI Fetch Error]:", fetchErr);
                }
              }

              if (phone) {
                await CrmIngestionService.ingestLead({
                  fullName: fullName || "Meta Lead Ad Prospect",
                  phone,
                  email,
                  source: LeadSource.META_ADS_FB,
                  interestedCourseName: courseName,
                  campaignName,
                  adsetName: val.adset_name || `Form ID: ${formId}`,
                  adCreativeName: val.ad_name || `Ad ID: ${adId}`,
                  notes: `Ingested from Meta Leadgen (Lead ID: ${leadgenId}). Form: ${formId}.`,
                  rawPayload: val,
                });
              }
            }
          }
        }
      }

      return NextResponse.json({ status: "success", received: true });
    }

    // Direct Lead Payload (e.g. from Zapier, Make, or custom Meta Lead Ads exporter)
    const fullName = body.fullName || body.name || body.full_name || "Meta Lead Ad Prospect";
    const phone = body.phone || body.phone_number || body.mobile || "";

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ status: "ignored", message: "No valid phone number in Meta payload" }, { status: 200 });
    }

    const email = body.email || "";
    const courseName = body.courseName || body.course || body.interested_course || "";
    const campaignName = body.campaignName || body.campaign_name || "Meta Ads Campaign";
    const platform = (body.platform || body.source || "").toLowerCase().includes("ig")
      ? LeadSource.META_ADS_IG
      : LeadSource.META_ADS_FB;

    const result = await CrmIngestionService.ingestLead({
      fullName,
      phone,
      email,
      city: body.city || "Prayagraj",
      source: platform,
      interestedCourseName: courseName,
      campaignName,
      adsetName: body.adsetName || body.adset_name,
      adCreativeName: body.adCreativeName || body.ad_name,
      notes: body.notes || `Meta Lead captured from ${platform}`,
      rawPayload: body,
    });

    return NextResponse.json({
      status: "success",
      code: 200,
      leadId: result.leadId,
      isNew: result.isNew,
    });
  } catch (error: any) {
    console.error("[MetaWebhook Error]:", error);
    return NextResponse.json(
      { status: "error", code: 500, message: error.message || "Meta webhook error" },
      { status: 500 }
    );
  }
}
