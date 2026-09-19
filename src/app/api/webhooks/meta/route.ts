import { NextResponse, type NextRequest } from "next/server";
import { CrmIngestionService } from "@/server/services/crm-ingestion.service";
import { LeadSource } from "@prisma/client";

export const dynamic = "force-dynamic";

const DEFAULT_VERIFY_TOKEN = "softlab_meta_leadgen_2026";

/**
 * Meta (Facebook & Instagram Lead Ads) Webhook
 * GET: Webhook verification challenge from Meta Graph API
 * POST: Incoming lead events from Meta Business Suite, Lead Ads Testing Tool, and CRM connectors
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    process.env.META_VERIFY_TOKEN ||
    DEFAULT_VERIFY_TOKEN;

  // Meta Graph Webhook Verification Handshake
  if (mode === "subscribe") {
    if (token === expectedToken) {
      console.log("[MetaWebhook] Successfully verified Meta webhook subscription handshake.");
      return new Response(challenge || "", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    } else {
      console.warn(`[MetaWebhook] Verification failed. Token mismatch: received "${token}", expected "${expectedToken}"`);
      return new Response("Forbidden: Invalid verify token", { status: 403 });
    }
  }

  // Health check & credentials overview
  return NextResponse.json({
    status: "active",
    platform: "Meta Business Leads (Facebook & Instagram Lead Gen)",
    webhookUrl: "https://www.softlabglobal.com/api/webhooks/meta",
    verifyToken: expectedToken,
    configuredToken: true,
    rolesNotified: ["COUNSELOR", "DIRECTOR", "ADMIN", "SUPER_ADMIN"],
    leadSources: ["META_ADS_FB", "META_ADS_IG", "META"],
    message: "SoftLab Global Meta Lead Ads webhook active and listening for live leads.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Optional token validation if provided in query or header
    const token =
      req.nextUrl.searchParams.get("token") ||
      req.nextUrl.searchParams.get("verify_token") ||
      req.headers.get("x-meta-token") ||
      body.verify_token;

    const expectedToken =
      process.env.META_WEBHOOK_VERIFY_TOKEN ||
      process.env.META_VERIFY_TOKEN ||
      DEFAULT_VERIFY_TOKEN;

    if (token && token !== expectedToken) {
      return NextResponse.json({ status: "unauthorized", message: "Invalid verify token" }, { status: 401 });
    }

    // --------------------------------------------------------------------------
    // CASE A: Official Meta Graph Webhook Structure ({ object: "page", entry: [...] })
    // --------------------------------------------------------------------------
    if (body.object === "page" && Array.isArray(body.entry)) {
      const results = [];

      for (const entry of body.entry) {
        if (!Array.isArray(entry.changes)) continue;

        for (const change of entry.changes) {
          if (change.field !== "leadgen") continue;

          const val = change.value || {};
          const leadgenId = val.leadgen_id ? String(val.leadgen_id) : "";
          const formId = val.form_id ? String(val.form_id) : "";
          const adId = val.ad_id ? String(val.ad_id) : "";
          const isTest = Boolean(
            val.is_test ||
            leadgenId === "444444444444444" ||
            leadgenId.startsWith("test") ||
            body.is_test
          );

          let fullName = val.full_name || val.name || "";
          let phone = val.phone_number || val.phone || val.mobile || "";
          let email = val.email || "";
          let city = val.city || "";
          let courseName = val.course || val.interested_course || "";
          const campaignName = val.campaign_name || "Meta Facebook/Instagram Lead Ad";

          // Parse field_data array if attached directly (some bridge tools and simulators)
          if (Array.isArray(val.field_data)) {
            for (const field of val.field_data) {
              const fName = (field.name || "").toLowerCase();
              const fVal = (field.values?.[0] || "").trim();
              if (fName.includes("name") || fName === "full_name") fullName = fVal;
              if (fName.includes("phone") || fName.includes("mobile")) phone = fVal;
              if (fName.includes("email")) email = fVal;
              if (fName.includes("city") || fName.includes("location")) city = fVal;
              if (fName.includes("course") || fName.includes("program") || fName.includes("interest")) courseName = fVal;
            }
          }

          // If phone is missing and leadgenId exists, attempt Meta Graph API lookup
          const metaToken =
            process.env.META_ACCESS_TOKEN ||
            process.env.FACEBOOK_ACCESS_TOKEN ||
            process.env.INSTAGRAM_ACCESS_TOKEN;

          if (leadgenId && (!phone || !fullName) && metaToken && !isTest) {
            try {
              const graphRes = await fetch(
                `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${metaToken}`
              );
              if (graphRes.ok) {
                const graphData = await graphRes.json();
                if (Array.isArray(graphData.field_data)) {
                  for (const field of graphData.field_data) {
                    const fName = (field.name || "").toLowerCase();
                    const fVal = (field.values?.[0] || "").trim();
                    if (fName.includes("name") || fName === "full_name") fullName = fVal;
                    if (fName.includes("phone") || fName.includes("mobile")) phone = fVal;
                    if (fName.includes("email")) email = fVal;
                    if (fName.includes("city") || fName.includes("location")) city = fVal;
                    if (fName.includes("course") || fName.includes("program") || fName.includes("interest")) courseName = fVal;
                  }
                }
              }
            } catch (fetchErr) {
              console.error("[MetaWebhook GraphAPI Fetch Error]:", fetchErr);
            }
          }

          // Test lead fallback (e.g. from Meta Lead Ads Testing Tool)
          if (isTest) {
            if (!fullName) fullName = "Meta Lead Ads Test Prospect";
            if (!phone) phone = "+919999999999";
            if (!email) email = "test.meta@softlabglobal.com";
            if (!courseName) courseName = "Cloud Computing & Cyber Security with AI";
            if (!city) city = "Prayagraj";
          }

          // Fallback if leadgen received without phone (e.g. pending access token setup)
          if (!phone) {
            fullName = fullName || `Meta Lead #${leadgenId ? leadgenId.slice(-6) : "Prospect"}`;
            phone = "+910000000000";
          }

          const result = await CrmIngestionService.ingestLead({
            fullName: fullName || "Meta Lead Ad Prospect",
            phone,
            email: email || undefined,
            city: city || "Prayagraj",
            source: LeadSource.META_ADS_FB,
            interestedCourseName: courseName,
            campaignName,
            adsetName: val.adset_name || (formId ? `Form ID: ${formId}` : undefined),
            adCreativeName: val.ad_name || (adId ? `Ad ID: ${adId}` : undefined),
            notes: `Captured from Meta Leadgen Webhook. Lead ID: ${leadgenId || "N/A"}. Form ID: ${formId || "N/A"}.${isTest ? " [VERIFIED TEST LEAD]" : ""}`,
            rawPayload: val,
          });

          results.push({ leadId: result.leadId, isNew: result.isNew, isTest });
        }
      }

      return NextResponse.json({
        status: "success",
        code: 200,
        received: true,
        leadsProcessed: results.length,
        results,
        message: "Meta lead events processed and broadcast to dashboards successfully.",
      });
    }

    // --------------------------------------------------------------------------
    // CASE B: Direct Lead Payload (Zapier, Make, Pabbly, Custom Webhooks, Testing)
    // --------------------------------------------------------------------------
    const isTest = Boolean(body.is_test || body.lead_id === "test");

    let fullName =
      body.fullName ||
      body.name ||
      body.full_name ||
      (body.firstName && body.lastName ? `${body.firstName} ${body.lastName}` : "") ||
      "";

    let phone = body.phone || body.phone_number || body.mobile || body.contact || "";
    let email = body.email || body.email_address || "";
    let city = body.city || "Prayagraj";
    let courseName = body.courseName || body.course || body.interestedCourseName || body.interested_course || "";
    const campaignName = body.campaignName || body.campaign_name || "Meta Ads Boost Campaign";

    if (isTest) {
      if (!fullName) fullName = "Meta Lead Ads Test Prospect";
      if (!phone) phone = "+919999999999";
      if (!email) email = "test.meta@softlabglobal.com";
      if (!courseName) courseName = "Full Stack Web Development & Cloud DevOps";
    }

    const cleanDigits = phone.replace(/\D/g, "");
    if (!isTest && (!phone || cleanDigits.length < 10)) {
      return NextResponse.json(
        { status: "error", message: "No valid phone number in Meta payload" },
        { status: 400 }
      );
    }

    const platformRaw = (body.platform || body.source || "").toLowerCase();
    const source = platformRaw.includes("ig") || platformRaw.includes("instagram")
      ? LeadSource.META_ADS_IG
      : LeadSource.META_ADS_FB;

    const result = await CrmIngestionService.ingestLead({
      fullName: fullName || "Meta Lead Ad Prospect",
      phone,
      email: email || undefined,
      city: city || "Prayagraj",
      source,
      interestedCourseName: courseName,
      campaignName,
      adsetName: body.adsetName || body.adset_name || (body.form_id ? `Form ID: ${body.form_id}` : undefined),
      adCreativeName: body.adCreativeName || body.ad_name || (body.ad_id ? `Ad ID: ${body.ad_id}` : undefined),
      notes: body.notes || `Meta Lead captured from ${source}.${isTest ? " [VERIFIED TEST LEAD]" : ""}`,
      rawPayload: body,
    });

    return NextResponse.json({
      status: "success",
      code: 200,
      leadId: result.leadId,
      isNew: result.isNew,
      isTest,
      platform: source,
      message: isTest
        ? "Meta test lead verified successfully."
        : "Meta lead ingested and broadcast to LMS CRM dashboards successfully.",
    });
  } catch (error: any) {
    console.error("[MetaWebhook Error]:", error);
    return NextResponse.json(
      { status: "error", code: 500, message: error.message || "Meta webhook error" },
      { status: 500 }
    );
  }
}
