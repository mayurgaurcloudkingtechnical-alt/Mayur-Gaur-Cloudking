import { NextResponse, type NextRequest } from "next/server";
import { CrmIngestionService } from "@/server/services/crm-ingestion.service";
import { LeadSource } from "@prisma/client";

export const dynamic = "force-dynamic";

const DEFAULT_WEBHOOK_KEY = "slg_gads_sec_8923f7c1b4d09e";

/**
 * Google Ads Lead Form Webhook
 * Handles real-time lead submissions and verification pings from Google Search Ads & YouTube Lead Form extensions.
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    platform: "Google Ads Lead Form Extensions",
    webhookUrl: "https://www.softlabglobal.com/api/webhooks/google-ads",
    configuredKey: Boolean(process.env.GOOGLE_ADS_WEBHOOK_KEY || DEFAULT_WEBHOOK_KEY),
    rolesNotified: ["COUNSELOR", "DIRECTOR", "ADMIN", "SUPER_ADMIN"],
    message: "SoftLab Global Google Ads webhook active and listening for live leads.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const expectedKey = process.env.GOOGLE_ADS_WEBHOOK_KEY || DEFAULT_WEBHOOK_KEY;

    // Check key from body.google_key, query params, or headers
    const providedKey =
      body.google_key ||
      req.nextUrl.searchParams.get("key") ||
      req.nextUrl.searchParams.get("google_key") ||
      req.headers.get("x-google-key") ||
      req.headers.get("authorization")?.replace(/Bearer\s+/i, "");

    const isGenuineGoogleAdsPayload = Boolean(
      body.user_column_data ||
      body.lead_id ||
      body.form_id ||
      body.campaign_id ||
      body.google_key
    );

    // If key provided does not match, but it is a genuine Google Ads payload, log warning and allow
    if (providedKey && providedKey !== expectedKey) {
      if (!isGenuineGoogleAdsPayload) {
        console.warn(`[GoogleAdsWebhook] Unauthorized attempt with invalid key: ${providedKey.slice(0, 4)}***`);
        return NextResponse.json(
          {
            status: "unauthorized",
            message: "Invalid Google Key. Configure the matching key in Google Ads Lead Form webhook options.",
          },
          { status: 401 }
        );
      } else {
        console.warn(`[GoogleAdsWebhook] Warning: Google key mismatch ('${providedKey}'), but valid Google Ads payload detected. Ingesting lead.`);
      }
    }

    const isTest = Boolean(
      body.is_test ||
      body.lead_id === "test" ||
      (typeof body.lead_id === "string" && body.lead_id.toLowerCase().includes("tester"))
    );

    // Handle Google Ads test / handshake verification ping (when saving webhook in Google Ads UI)
    if (!body.user_column_data && !body.fullName && !body.name && !body.phone) {
      return NextResponse.json({
        status: "success",
        code: 200,
        isTest: true,
        message: "Google Ads Lead Form Webhook handshake verified successfully.",
      });
    }

    let fullName = body.fullName || body.name || "";
    let firstName = "";
    let lastName = "";
    let phone = body.phone || body.mobile || "";
    let email = body.email || "";
    let city = body.city || "";
    let courseName = body.course || body.courseName || "";

    // Parse Google's user_column_data format
    if (Array.isArray(body.user_column_data)) {
      for (const col of body.user_column_data) {
        const colId = (col.column_id || "").toUpperCase();
        const val = (col.string_value || "").trim();

        if (colId === "FULL_NAME") fullName = val;
        else if (colId === "FIRST_NAME") firstName = val;
        else if (colId === "LAST_NAME") lastName = val;
        else if (colId === "PHONE_NUMBER" || colId.includes("PHONE") || colId.includes("MOBILE")) phone = val;
        else if (colId === "EMAIL" || colId.includes("EMAIL")) email = val;
        else if (colId === "CITY" || colId === "POSTAL_CODE" || colId === "REGION") {
          if (!city) city = val;
        } else if (colId === "COURSE" || colId === "INTEREST" || colId.includes("COURSE") || colId.includes("PROGRAM")) {
          if (!courseName) courseName = val;
        }
      }
    }

    if (!fullName && (firstName || lastName)) {
      fullName = `${firstName} ${lastName}`.trim();
    }

    // If Google Ads is sending a test lead ("Send test data" button in Google Ads UI)
    if (isTest || !phone) {
      if (!fullName) fullName = "Google Ads Prospect";
      if (!phone || phone.replace(/\D/g, "").length < 7) phone = "+919196596975";
      if (!email) email = "admissions@softlabglobal.com";
      if (!courseName) courseName = "Cloud Computing & Cyber Security with AI";
      if (!city) city = "Prayagraj";
    }

    const cleanDigits = phone.replace(/\D/g, "");
    if (!isTest && (!phone || cleanDigits.length < 10)) {
      return NextResponse.json(
        { status: "error", message: "No valid 10-digit phone number in Google Ads payload" },
        { status: 400 }
      );
    }

    const campaignId = body.campaign_id ? `Campaign ID: ${body.campaign_id}` : "Google Ads Search Campaign";

    const result = await CrmIngestionService.ingestLead({
      fullName: fullName || "Google Ads Prospect",
      phone,
      email: email || undefined,
      city: city || "Prayagraj",
      source: LeadSource.GOOGLE_ADS,
      interestedCourseName: courseName,
      campaignName: campaignId,
      adsetName: body.form_id ? `Form ID: ${body.form_id}` : undefined,
      notes: `Ingested from Google Ads Lead Form. Lead ID: ${body.lead_id || "N/A"}. Form ID: ${body.form_id || "N/A"}. GCLID: ${body.gcl_id || "N/A"}${isTest ? " [VERIFIED TEST LEAD]" : ""}`,
      rawPayload: body,
    });

    return NextResponse.json({
      status: "success",
      code: 200,
      leadId: result.leadId,
      isNew: result.isNew,
      isTest,
      message: isTest
        ? "Google Ads test lead verified successfully."
        : "Lead ingested and broadcast to LMS CRM dashboards successfully.",
    });
  } catch (error: any) {
    console.error("[GoogleAdsWebhook Error]:", error);
    return NextResponse.json(
      { status: "error", code: 500, message: error.message || "Google Ads webhook error" },
      { status: 500 }
    );
  }
}
