import { NextResponse, type NextRequest } from "next/server";
import { CrmIngestionService } from "@/server/services/crm-ingestion.service";
import { LeadSource } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Google Ads Lead Form Webhook
 * Handles lead submission from Google Search Ads & YouTube Lead Extensions
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    platform: "Google Ads Lead Form Extensions",
    message: "SoftLab Global Google Ads webhook active",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify Google Key if configured in environment
    const configuredKey = process.env.GOOGLE_ADS_WEBHOOK_KEY;
    if (configuredKey && body.google_key && body.google_key !== configuredKey) {
      return NextResponse.json({ status: "unauthorized", message: "Invalid Google Key" }, { status: 401 });
    }

    let fullName = body.fullName || body.name || "";
    let phone = body.phone || body.mobile || "";
    let email = body.email || "";
    let city = body.city || "";
    let courseName = body.course || body.courseName || "";

    // Parse Google's user_column_data format if present
    if (Array.isArray(body.user_column_data)) {
      for (const col of body.user_column_data) {
        const colId = (col.column_id || "").toUpperCase();
        const val = col.string_value || "";
        if (colId === "FULL_NAME" || colId === "FIRST_NAME") fullName = val;
        if (colId === "PHONE_NUMBER") phone = val;
        if (colId === "EMAIL") email = val;
        if (colId === "CITY") city = val;
        if (colId === "COURSE" || colId === "INTEREST") courseName = val;
      }
    }

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json(
        { status: "error", message: "No valid phone number in Google Ads payload" },
        { status: 400 }
      );
    }

    const campaignId = body.campaign_id ? `Campaign ID: ${body.campaign_id}` : "Google Search Ads";

    const result = await CrmIngestionService.ingestLead({
      fullName: fullName || "Google Ads Prospect",
      phone,
      email,
      city: city || "Prayagraj",
      source: LeadSource.GOOGLE_ADS,
      interestedCourseName: courseName,
      campaignName: campaignId,
      adsetName: body.form_id ? `Form ID: ${body.form_id}` : undefined,
      notes: `Ingested from Google Ads Lead Form. Lead ID: ${body.lead_id || "N/A"}`,
      rawPayload: body,
    });

    return NextResponse.json({
      status: "success",
      code: 200,
      leadId: result.leadId,
      isNew: result.isNew,
    });
  } catch (error: any) {
    console.error("[GoogleAdsWebhook Error]:", error);
    return NextResponse.json(
      { status: "error", code: 500, message: error.message || "Google Ads webhook error" },
      { status: 500 }
    );
  }
}
