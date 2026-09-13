import { NextResponse, type NextRequest } from "next/server";
import { CrmIngestionService } from "@/server/services/crm-ingestion.service";
import { LeadSource } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Universal Leads Webhook (Zapier, Make.com, Pabbly Connect, Custom Landing Pages)
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    platform: "SoftLab Global Universal Ingestion Webhook",
    message: "Ready to receive external leads via POST request",
    formatExample: {
      fullName: "Rahul Kumar",
      phone: "9876543210",
      email: "rahul@example.com",
      city: "Prayagraj",
      course: "Full Stack Web Development",
      source: "WEBSITE", // or JUSTDIAL, GOOGLE_ADS, META_ADS_FB, WHATSAPP, etc.
      campaignName: "September Admission Drive",
      notes: "Inquired about weekend batches",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const fullName =
      body.fullName ||
      body.name ||
      body.leadName ||
      body.customer_name ||
      body.first_name ? `${body.first_name} ${body.last_name || ""}`.trim() : "Online Inquiry";

    const phone =
      body.phone ||
      body.mobile ||
      body.phoneNumber ||
      body.contact_number ||
      body.contact ||
      "";

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json(
        { status: "error", code: 400, message: "A valid mobile phone number is required (min 10 digits)" },
        { status: 400 }
      );
    }

    const email = body.email || body.emailAddress || "";
    const city = body.city || body.location || "Prayagraj";
    const qualification = body.qualification || body.degree || "";
    const courseName = body.course || body.courseName || body.program || "";
    const campaignName = body.campaignName || body.campaign || body.utm_campaign || "Universal Ingestion Webhook";
    const adsetName = body.adsetName || body.adset || body.utm_medium || "";
    const adCreativeName = body.adCreativeName || body.ad_name || body.utm_content || "";
    const notes = body.notes || body.message || body.inquiry || "Captured via external webhook";

    // Map source string to LeadSource enum
    let leadSource: LeadSource = LeadSource.WEBSITE;
    const rawSource = (body.source || body.utm_source || "").toUpperCase();
    if (rawSource.includes("JUSTDIAL")) leadSource = LeadSource.JUSTDIAL;
    else if (rawSource.includes("META") || rawSource.includes("FACEBOOK")) leadSource = LeadSource.META_ADS_FB;
    else if (rawSource.includes("INSTAGRAM")) leadSource = LeadSource.META_ADS_IG;
    else if (rawSource.includes("GOOGLE")) leadSource = LeadSource.GOOGLE_ADS;
    else if (rawSource.includes("WHATSAPP")) leadSource = LeadSource.WHATSAPP;
    else if (rawSource.includes("WALK")) leadSource = LeadSource.WALK_IN;
    else if (rawSource.includes("POPUP")) leadSource = LeadSource.WEBSITE_CAREER_POPUP;

    const result = await CrmIngestionService.ingestLead({
      fullName,
      phone,
      email,
      city,
      qualification,
      source: leadSource,
      interestedCourseName: courseName,
      campaignName,
      adsetName,
      adCreativeName,
      notes,
      rawPayload: body,
    });

    return NextResponse.json({
      status: "success",
      code: 200,
      message: "Lead received and processed successfully",
      leadId: result.leadId,
      isNew: result.isNew,
      assignedToId: result.assignedToId,
    });
  } catch (error: any) {
    console.error("[UniversalWebhook Error]:", error);
    return NextResponse.json(
      { status: "error", code: 500, message: error.message || "Internal webhook server error" },
      { status: 500 }
    );
  }
}
