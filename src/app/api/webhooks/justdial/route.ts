import { NextResponse, type NextRequest } from "next/server";
import { CrmIngestionService } from "@/server/services/crm-ingestion.service";
import { LeadSource } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Justdial Lead Webhook
 * Handles both GET (Justdial connectivity/health ping) and POST (incoming prospect lead push)
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "success",
    code: 200,
    message: "SOFTLAB GLOBAL Justdial webhook ingestion endpoint active and listening",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        body[key] = value.toString();
      });
    } else {
      const rawText = await req.text();
      try {
        body = JSON.parse(rawText);
      } catch {
        // Parse query params if sent in URL
        req.nextUrl.searchParams.forEach((val, k) => {
          body[k] = val;
        });
      }
    }

    // Extract Justdial lead fields (support case-variations)
    const fullName =
      body.name ||
      body.fullName ||
      body.lead_name ||
      body.customer_name ||
      body.Name ||
      "Justdial Inquirer";

    const phone =
      body.mobile ||
      body.phone ||
      body.Mobile ||
      body.contact_number ||
      body.contactNo ||
      "";

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json(
        { status: "error", message: "Missing or invalid phone number in Justdial payload" },
        { status: 400 }
      );
    }

    const email = body.email || body.Email || "";
    const city = body.city || body.City || body.area || "Prayagraj";
    const category = body.category || body.Category || body.search_key || body.course || "";
    const leadId = body.leadid || body.lead_id || body.leadId || "";

    const result = await CrmIngestionService.ingestLead({
      fullName,
      phone,
      email,
      city,
      source: LeadSource.JUSTDIAL,
      interestedCourseName: category,
      notes: `Justdial Lead ID: ${leadId}. Category: ${category}. Area: ${body.area || city}`,
      campaignName: "Justdial Local Search",
      rawPayload: body,
    });

    return NextResponse.json({
      status: "success",
      code: 200,
      message: "Lead successfully ingested into SoftLab Global CRM",
      leadId: result.leadId,
      isNew: result.isNew,
    });
  } catch (error: any) {
    console.error("[JustdialWebhook Error]:", error);
    return NextResponse.json(
      { status: "error", code: 500, message: error.message || "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
