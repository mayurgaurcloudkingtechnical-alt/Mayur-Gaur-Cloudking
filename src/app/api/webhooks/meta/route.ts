import { NextResponse, type NextRequest } from "next/server";
import { MetaLeadAdsService } from "@/server/services/meta-lead-ads.service";
import { LeadSource } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Meta (Facebook & Instagram Lead Ads) Official Webhook
 *
 * GET: Webhook verification challenge from Meta Graph API
 * POST: Incoming leadgen events from Meta Business Suite, Lead Ads Testing Tool & Graph API
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const config = await MetaLeadAdsService.getConfig();
  const expectedToken = config.verifyToken || "softlab_meta_leadgen_2026";

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

  // Health check & credentials overview for administrator diagnostics
  return NextResponse.json({
    status: "active",
    platform: "Meta Lead Ads (Facebook & Instagram Lead Gen)",
    graphApiVersion: MetaLeadAdsService.GRAPH_API_VERSION,
    webhookUrl: "https://www.softlabglobal.com/api/webhooks/meta",
    connectionStatus: config.connectionStatus,
    pageId: config.pageId,
    pageName: config.pageName,
    businessId: config.businessId,
    verifyTokenConfigured: Boolean(expectedToken),
    appSecretConfigured: Boolean(config.appSecret),
    accessTokenConfigured: Boolean(config.accessToken),
    campaignPipelines: [
      { code: "SLG_META_COURSES_LEADS_OCT26", pipeline: "Course Admissions", team: "Admissions Team" },
      { code: "SLG_META_BOSSE_DPGU_LEADS_OCT26", pipeline: "BOSSE & University Admissions", team: "Education Counselling Team" },
      { code: "SLG_META_SERVICES_LEADS_OCT26", pipeline: "Business Services & Partnerships", team: "Business Development Team" },
    ],
    message: "SoftLab Global Meta Lead Ads webhook active and listening for live leads.",
  });
}

export async function POST(req: NextRequest) {
  const config = await MetaLeadAdsService.getConfig();
  const signatureHeader = req.headers.get("x-hub-signature-256");

  // Read raw body for HMAC signature verification
  const rawBody = await req.text().catch(() => "");
  let body: any = {};
  try {
    body = JSON.parse(rawBody);
  } catch (_) {
    body = {};
  }

  // 1. Verify HMAC-SHA256 signature if App Secret is configured
  const isSignatureValid = MetaLeadAdsService.verifyWebhookSignature(
    rawBody,
    signatureHeader,
    config.appSecret
  );

  if (config.appSecret && !isSignatureValid) {
    console.error("[MetaWebhook] Invalid HMAC-SHA256 signature received from caller.");
    return NextResponse.json(
      { status: "unauthorized", message: "Invalid x-hub-signature-256" },
      { status: 401 }
    );
  }

  // Optional verify token check in query params
  const queryToken = req.nextUrl.searchParams.get("token") || req.nextUrl.searchParams.get("verify_token");
  if (queryToken && queryToken !== config.verifyToken) {
    return NextResponse.json({ status: "unauthorized", message: "Invalid verify token" }, { status: 401 });
  }

  try {
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
          if (!leadgenId) continue;

          const isTest = Boolean(
            val.is_test ||
            leadgenId === "444444444444444" ||
            leadgenId.startsWith("test") ||
            body.is_test
          );

          let extractedLead: any = null;

          // If field_data array is directly attached (some test harnesses or bridge tools)
          if (Array.isArray(val.field_data) && val.field_data.length > 0) {
            extractedLead = MetaLeadAdsService.parseLeadgenData({
              id: leadgenId,
              created_time: val.created_time || new Date().toISOString(),
              form_id: val.form_id,
              ad_id: val.ad_id,
              ad_name: val.ad_name,
              adset_id: val.adset_id,
              adset_name: val.adset_name,
              campaign_id: val.campaign_id,
              campaign_name: val.campaign_name,
              field_data: val.field_data,
            });
          } else if (!isTest && config.accessToken) {
            // Fetch complete lead details from official Meta Graph API v21.0
            extractedLead = await MetaLeadAdsService.fetchLeadDetails(leadgenId, config.accessToken);
          }

          // Handle test lead from Meta Lead Ads Testing Tool
          if (!extractedLead && isTest) {
            extractedLead = {
              metaLeadId: leadgenId,
              createdTime: new Date(),
              formId: val.form_id || "TEST_FORM_101",
              adId: val.ad_id || "TEST_AD_101",
              adName: "Test Lead Ad",
              campaignName: val.campaign_name || "SLG_META_COURSES_LEADS_OCT26",
              platform: "fb",
              fullName: "Meta Lead Ads Test Candidate",
              phone: "919999999999",
              email: "test.candidate@softlabglobal.com",
              city: "Prayagraj",
              interestedCourse: "Full Stack Web Development & AI",
              rawAnswers: { course: "Full Stack Web Development & AI" },
              rawFieldData: val.field_data || [],
            };
          }

          // Fallback if leadgen received without phone (e.g. pending access token setup)
          if (!extractedLead) {
            extractedLead = {
              metaLeadId: leadgenId,
              createdTime: new Date(),
              formId: val.form_id,
              adId: val.ad_id,
              campaignName: val.campaign_name || "Meta Facebook/Instagram Lead Ad",
              platform: "fb",
              fullName: `Meta Lead #${leadgenId.slice(-6)}`,
              phone: "910000000000",
              city: "Prayagraj",
              rawAnswers: {},
              rawFieldData: [],
            };
          }

          const ingestion = await MetaLeadAdsService.ingestMetaLead(extractedLead, isSignatureValid);
          results.push({
            leadId: ingestion.leadId,
            isNew: ingestion.isNew,
            isDuplicate: ingestion.isDuplicate,
            pipeline: ingestion.routing.pipeline,
            team: ingestion.routing.assignedTeam,
          });
        }
      }

      return NextResponse.json({
        status: "success",
        code: 200,
        received: true,
        leadsProcessed: results.length,
        results,
        message: "Meta lead events processed, routed, and persisted into CRM successfully.",
      });
    }

    // --------------------------------------------------------------------------
    // CASE B: Direct Lead Payload (Lead Ads Testing Tool, Bridge Integrations, Manual Test)
    // --------------------------------------------------------------------------
    const isTest = Boolean(body.is_test || body.lead_id === "test");

    const extractedFromDirect = MetaLeadAdsService.parseLeadgenData({
      id: body.id || body.leadgen_id || body.lead_id || `direct_${Date.now()}`,
      created_time: body.created_time || new Date().toISOString(),
      form_id: body.form_id,
      ad_id: body.ad_id,
      ad_name: body.ad_name || body.adCreativeName,
      adset_id: body.adset_id,
      adset_name: body.adset_name || body.adsetName,
      campaign_id: body.campaign_id,
      campaign_name: body.campaign_name || body.campaignName,
      platform: body.platform || "fb",
      field_data: Array.isArray(body.field_data)
        ? body.field_data
        : [
            { name: "full_name", values: [body.fullName || body.name || ""] },
            { name: "phone_number", values: [body.phone || body.phone_number || ""] },
            { name: "email", values: [body.email || ""] },
            { name: "city", values: [body.city || ""] },
            { name: "course", values: [body.courseName || body.course || ""] },
          ],
    });

    if (isTest && (!extractedFromDirect.phone || extractedFromDirect.phone.length < 10)) {
      extractedFromDirect.fullName = "Meta Lead Ads Test Candidate";
      extractedFromDirect.phone = "919999999999";
      extractedFromDirect.email = "test.candidate@softlabglobal.com";
      extractedFromDirect.interestedCourse = "AI & Machine Learning";
    }

    const cleanDigits = extractedFromDirect.phone.replace(/\D/g, "");
    if (!isTest && (!extractedFromDirect.phone || cleanDigits.length < 10)) {
      return NextResponse.json(
        { status: "error", message: "No valid 10-digit phone number found in Meta payload" },
        { status: 400 }
      );
    }

    const ingestion = await MetaLeadAdsService.ingestMetaLead(extractedFromDirect, isSignatureValid);

    return NextResponse.json({
      status: "success",
      code: 200,
      leadId: ingestion.leadId,
      isNew: ingestion.isNew,
      isDuplicate: ingestion.isDuplicate,
      pipeline: ingestion.routing.pipeline,
      assignedTeam: ingestion.routing.assignedTeam,
      message: "Meta lead ingested, routed, and synced to CRM successfully.",
    });
  } catch (error: any) {
    console.error("[MetaWebhook Error]:", error);
    return NextResponse.json(
      { status: "error", code: 500, message: error.message || "Meta webhook execution error" },
      { status: 500 }
    );
  }
}
