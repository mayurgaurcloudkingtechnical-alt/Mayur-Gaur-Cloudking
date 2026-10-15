import { db } from "@/server/db/client";
import { LeadSource, LeadStatus, UserRoleCode } from "@prisma/client";
import { WhatsAppBusinessService } from "./whatsapp-business.service";
import { OmnichannelInboxService } from "./omnichannel-inbox.service";
import { FollowUpAutomationService } from "./follow-up-automation.service";
import crypto from "crypto";

export interface MetaLeadAdsConfig {
  appId: string;
  appSecret: string;
  pageId: string;
  pageName: string;
  businessId: string;
  adAccountId?: string;
  accessToken: string; // Long-lived Page Access Token
  verifyToken: string;
  webhookUrl: string;
  connectionStatus: "NOT_CONNECTED" | "CONNECTED" | "ERROR";
  lastVerifiedAt: Date | null;
  lastError: string | null;
}

export interface ExtractedMetaLead {
  metaLeadId: string;
  createdTime: Date;
  formId?: string;
  pageId?: string;
  adId?: string;
  adName?: string;
  adsetId?: string;
  adsetName?: string;
  campaignId?: string;
  campaignName?: string;
  platform?: "fb" | "ig";
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  interestedCourse?: string;
  selectedProgramme?: string;
  requestedService?: string;
  rawAnswers: Record<string, string>;
  rawFieldData: any[];
}

export interface RoutingResult {
  pipeline: "COURSE_ADMISSIONS" | "BOSSE_DPGU" | "BUSINESS_SERVICES";
  subPipeline?: "BOSSE_ENQUIRIES" | "UNIVERSITY_ADMISSIONS" | "SOFTWARE" | "CORPORATE_TRAINING" | "CAMPUS_DRIVE" | "INSTITUTIONAL_PARTNERSHIP" | "FRANCHISE";
  assignedTeam: "Admissions Team" | "Education Counselling Team" | "Business Development Team";
  assignedRoleCode: UserRoleCode;
  assignedUserId?: string;
  tags: string[];
}

const SETTING_KEY = "meta_lead_ads_config";

export class MetaLeadAdsService {
  public static readonly GRAPH_API_VERSION = "v21.0";
  public static readonly GRAPH_API_BASE = `https://graph.facebook.com/${MetaLeadAdsService.GRAPH_API_VERSION}`;

  /**
   * Retrieves active configuration from database (system_settings), falling back to environment
   */
  public static async getConfig(): Promise<MetaLeadAdsConfig> {
    try {
      const setting = await db.systemSetting.findUnique({
        where: { key: SETTING_KEY },
      });

      const stored = (setting?.value as Partial<MetaLeadAdsConfig>) || {};

      const envConfig: MetaLeadAdsConfig = {
        appId: process.env.META_APP_ID || process.env.WHATSAPP_APP_ID || "1572356260711362",
        appSecret: process.env.META_APP_SECRET || "",
        pageId: process.env.META_PAGE_ID || "61594488322411",
        pageName: "SoftLab Global",
        businessId: process.env.META_BUSINESS_ID || "2161320211099371",
        adAccountId: process.env.META_AD_ACCOUNT_ID || "",
        accessToken:
          process.env.META_PAGE_ACCESS_TOKEN ||
          process.env.META_ACCESS_TOKEN ||
          process.env.FACEBOOK_ACCESS_TOKEN ||
          "",
        verifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN || "softlab_meta_leadgen_2026",
        webhookUrl: "https://www.softlabglobal.com/api/webhooks/meta",
        connectionStatus: "NOT_CONNECTED",
        lastVerifiedAt: null,
        lastError: null,
      };

      const resolved: MetaLeadAdsConfig = {
        appId: stored.appId || envConfig.appId,
        appSecret: stored.appSecret || envConfig.appSecret,
        pageId: stored.pageId || envConfig.pageId,
        pageName: stored.pageName || envConfig.pageName,
        businessId: stored.businessId || envConfig.businessId,
        adAccountId: stored.adAccountId || envConfig.adAccountId,
        accessToken: stored.accessToken || envConfig.accessToken,
        verifyToken: stored.verifyToken || envConfig.verifyToken,
        webhookUrl: envConfig.webhookUrl,
        connectionStatus: stored.connectionStatus || (envConfig.accessToken ? "CONNECTED" : "NOT_CONNECTED"),
        lastVerifiedAt: stored.lastVerifiedAt ? new Date(stored.lastVerifiedAt) : null,
        lastError: stored.lastError || null,
      };

      return resolved;
    } catch (err: any) {
      console.error("[MetaLeadAdsService] Failed to read config:", err.message);
      return {
        appId: process.env.META_APP_ID || "1572356260711362",
        appSecret: process.env.META_APP_SECRET || "",
        pageId: "61594488322411",
        pageName: "SoftLab Global",
        businessId: "2161320211099371",
        accessToken: "",
        verifyToken: "softlab_meta_leadgen_2026",
        webhookUrl: "https://www.softlabglobal.com/api/webhooks/meta",
        connectionStatus: "NOT_CONNECTED",
        lastVerifiedAt: null,
        lastError: err.message,
      };
    }
  }

  /**
   * Saves or updates Meta configuration
   */
  public static async saveConfig(
    input: Partial<MetaLeadAdsConfig>,
    updatedByUserId?: string
  ): Promise<MetaLeadAdsConfig> {
    const current = await this.getConfig();
    const updated: MetaLeadAdsConfig = {
      ...current,
      ...input,
      pageName: input.pageName || current.pageName || "SoftLab Global",
    };

    await db.systemSetting.upsert({
      where: { key: SETTING_KEY },
      update: {
        value: updated as any,
        category: "INTEGRATIONS",
        isSecret: true,
        updatedBy: updatedByUserId || "ADMIN",
      },
      create: {
        key: SETTING_KEY,
        value: updated as any,
        category: "INTEGRATIONS",
        isSecret: true,
        updatedBy: updatedByUserId || "ADMIN",
      },
    });

    return updated;
  }

  /**
   * Validates HMAC-SHA256 signature from Meta webhook (`x-hub-signature-256`)
   */
  public static verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string | null,
    appSecret?: string
  ): boolean {
    if (!appSecret) {
      // If secret not configured in env or settings, skip signature enforcement in staging/fallback
      return true;
    }

    if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
      return false;
    }

    try {
      const incomingHash = signatureHeader.replace("sha256=", "").trim();
      const calculatedHash = crypto
        .createHmac("sha256", appSecret)
        .update(rawBody, "utf8")
        .digest("hex");

      const incomingBuf = Buffer.from(incomingHash, "hex");
      const calculatedBuf = Buffer.from(calculatedHash, "hex");

      if (incomingBuf.length !== calculatedBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(incomingBuf, calculatedBuf);
    } catch (e: any) {
      console.error("[MetaLeadAdsService] Signature verification exception:", e.message);
      return false;
    }
  }

  /**
   * Verifies live Graph API connection using current credentials
   */
  public static async verifyLiveConnection(): Promise<{
    success: boolean;
    pageName?: string;
    pageId?: string;
    permissions?: string[];
    error?: string;
  }> {
    const config = await this.getConfig();
    if (!config.accessToken) {
      return {
        success: false,
        error: "No Meta Page Access Token configured. Please connect with an authorized system user token.",
      };
    }

    try {
      const pageRes = await fetch(
        `${this.GRAPH_API_BASE}/${config.pageId}?fields=id,name,link,is_published&access_token=${config.accessToken}`
      );
      const pageData = await pageRes.json();

      if (!pageRes.ok || pageData.error) {
        const errorMsg = pageData.error?.message || "Failed to query Meta Graph API for page identity.";
        await this.saveConfig({ connectionStatus: "ERROR", lastError: errorMsg });
        return { success: false, error: errorMsg };
      }

      // Check access token debug info
      let permissions: string[] = ["leads_retrieval", "pages_manage_ads", "pages_read_engagement"];
      try {
        const debugRes = await fetch(
          `${this.GRAPH_API_BASE}/debug_token?input_token=${config.accessToken}&access_token=${config.accessToken}`
        );
        const debugData = await debugRes.json();
        if (debugData.data?.scopes) {
          permissions = debugData.data.scopes;
        }
      } catch (_) {}

      await this.saveConfig({
        connectionStatus: "CONNECTED",
        lastVerifiedAt: new Date(),
        lastError: null,
        pageName: pageData.name || config.pageName,
      });

      return {
        success: true,
        pageName: pageData.name,
        pageId: pageData.id,
        permissions,
      };
    } catch (err: any) {
      await this.saveConfig({ connectionStatus: "ERROR", lastError: err.message });
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetches active Lead Forms for the connected Page
   */
  public static async fetchPageLeadForms(): Promise<any[]> {
    const config = await this.getConfig();
    if (!config.accessToken || !config.pageId) return [];

    try {
      const res = await fetch(
        `${this.GRAPH_API_BASE}/${config.pageId}/leadgen_forms?fields=id,name,status,leads_count,created_time,questions&access_token=${config.accessToken}`
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        console.warn("[MetaLeadAdsService] Could not fetch leadgen_forms:", data.error?.message);
        return [];
      }
      return data.data || [];
    } catch (e: any) {
      console.error("[MetaLeadAdsService] Exception fetching leadgen_forms:", e.message);
      return [];
    }
  }

  /**
   * Pulls complete lead data from Meta Graph API using leadgen_id
   */
  public static async fetchLeadDetails(
    leadgenId: string,
    overrideToken?: string
  ): Promise<ExtractedMetaLead | null> {
    const config = await this.getConfig();
    const token = overrideToken || config.accessToken;

    if (!token) {
      console.warn(`[MetaLeadAdsService] Cannot fetch leadgen ${leadgenId}: No access token available.`);
      return null;
    }

    try {
      const fields = [
        "id",
        "created_time",
        "ad_id",
        "ad_name",
        "adset_id",
        "adset_name",
        "campaign_id",
        "campaign_name",
        "form_id",
        "is_organic",
        "platform",
        "field_data",
      ].join(",");

      const res = await fetch(`${this.GRAPH_API_BASE}/${leadgenId}?fields=${fields}&access_token=${token}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        console.error(`[MetaLeadAdsService] Graph API error fetching leadgen ${leadgenId}:`, data.error);
        return null;
      }

      return this.parseLeadgenData(data);
    } catch (err: any) {
      console.error(`[MetaLeadAdsService] Network exception fetching leadgen ${leadgenId}:`, err.message);
      return null;
    }
  }

  /**
   * Parses Meta Graph API leadgen payload into strongly-typed ExtractedMetaLead
   */
  public static parseLeadgenData(data: any): ExtractedMetaLead {
    const rawAnswers: Record<string, string> = {};
    const fieldData = Array.isArray(data.field_data) ? data.field_data : [];

    let fullName = "";
    let firstName = "";
    let lastName = "";
    let phone = "";
    let email = "";
    let city = "";
    let interestedCourse = "";
    let selectedProgramme = "";
    let requestedService = "";

    for (const field of fieldData) {
      const name = (field.name || "").toLowerCase().trim();
      const val = (field.values?.[0] || "").trim();
      if (!val) continue;

      rawAnswers[name] = val;

      if (name === "full_name" || name === "name") {
        fullName = val;
      } else if (name === "first_name") {
        firstName = val;
      } else if (name === "last_name") {
        lastName = val;
      } else if (name === "phone_number" || name === "phone" || name === "mobile") {
        phone = val;
      } else if (name === "email" || name === "email_address") {
        email = val;
      } else if (name === "city" || name === "location" || name === "current_city") {
        city = val;
      } else if (
        name.includes("course") ||
        name.includes("training") ||
        name.includes("qualification") ||
        name.includes("interested_in")
      ) {
        interestedCourse = val;
      } else if (name.includes("programme") || name.includes("bosse") || name.includes("university") || name.includes("dpgu")) {
        selectedProgramme = val;
      } else if (
        name.includes("service") ||
        name.includes("corporate") ||
        name.includes("campus") ||
        name.includes("franchise") ||
        name.includes("partnership")
      ) {
        requestedService = val;
      }
    }

    if (!fullName && (firstName || lastName)) {
      fullName = `${firstName} ${lastName}`.trim();
    }

    return {
      metaLeadId: String(data.id || ""),
      createdTime: data.created_time ? new Date(data.created_time) : new Date(),
      formId: data.form_id ? String(data.form_id) : undefined,
      adId: data.ad_id ? String(data.ad_id) : undefined,
      adName: data.ad_name,
      adsetId: data.adset_id ? String(data.adset_id) : undefined,
      adsetName: data.adset_name,
      campaignId: data.campaign_id ? String(data.campaign_id) : undefined,
      campaignName: data.campaign_name,
      platform: data.platform === "ig" ? "ig" : "fb",
      fullName: fullName || "Meta Prospect",
      phone: WhatsAppBusinessService.normalizePhone(phone),
      email: email || undefined,
      city: city || "Prayagraj",
      interestedCourse: interestedCourse || undefined,
      selectedProgramme: selectedProgramme || undefined,
      requestedService: requestedService || undefined,
      rawAnswers,
      rawFieldData: fieldData,
    };
  }

  /**
   * Evaluates the 3 campaign category routing rules
   * 1. SLG_META_COURSES_LEADS_OCT26 -> Course Admissions (Admissions Team)
   * 2. SLG_META_BOSSE_DPGU_LEADS_OCT26 -> BOSSE Enquiries & University Admissions (Education Counselling Team)
   * 3. SLG_META_SERVICES_LEADS_OCT26 -> Business Services & Partnerships (Business Development Team)
   */
  public static async evaluateRoutingRules(lead: ExtractedMetaLead): Promise<RoutingResult> {
    // 1. Check custom active rules in database first
    const customRules = await db.metaCampaignRoutingRule.findMany({
      where: { isActive: true },
      orderBy: { priority: "asc" },
    });

    for (const rule of customRules) {
      let isMatch = false;

      // Match by Form ID pattern if specified
      if (rule.formIdPattern && lead.formId) {
        if (rule.formIdPattern === lead.formId || lead.formId.includes(rule.formIdPattern)) {
          isMatch = true;
        }
      }

      // Match by Campaign Name pattern
      if (!isMatch && rule.campaignPattern && lead.campaignName) {
        if (
          lead.campaignName.toLowerCase().includes(rule.campaignPattern.toLowerCase()) ||
          new RegExp(rule.campaignPattern, "i").test(lead.campaignName)
        ) {
          isMatch = true;
        }
      }

      if (isMatch) {
        const pipeline = rule.targetPipeline as any;
        return {
          pipeline,
          assignedTeam: rule.assignedTeam as any,
          assignedRoleCode: rule.defaultOwnerRole as any,
          assignedUserId: rule.defaultOwnerId || undefined,
          tags: Array.isArray(rule.autoTags) ? (rule.autoTags as string[]) : ["META_OCT26"],
        };
      }
    }

    // 2. Default Rules Engine based on Campaign Name and Submitted Answers
    const campaign = (lead.campaignName || "").toUpperCase();
    const service = (lead.requestedService || "").toLowerCase();
    const programme = (lead.selectedProgramme || "").toLowerCase();

    // Category 2: BOSSE & DPGU University Leads
    if (
      campaign.includes("BOSSE") ||
      campaign.includes("DPGU") ||
      programme.includes("bosse") ||
      programme.includes("preeti") ||
      programme.includes("university")
    ) {
      const isBosse = programme.includes("bosse") || campaign.includes("BOSSE");
      return {
        pipeline: "BOSSE_DPGU",
        subPipeline: isBosse ? "BOSSE_ENQUIRIES" : "UNIVERSITY_ADMISSIONS",
        assignedTeam: "Education Counselling Team",
        assignedRoleCode: UserRoleCode.COUNSELOR,
        tags: ["SLG_META_BOSSE_DPGU_LEADS_OCT26", isBosse ? "BOSSE_SCHOOLING" : "DPGU_UNIVERSITY"],
      };
    }

    // Category 3: Business Services & Partnerships
    if (
      campaign.includes("SERVICES") ||
      campaign.includes("PARTNERSHIP") ||
      campaign.includes("CORPORATE") ||
      campaign.includes("FRANCHISE") ||
      service.length > 0
    ) {
      let subPipeline: any = "SOFTWARE";
      if (service.includes("corporate") || campaign.includes("CORPORATE")) subPipeline = "CORPORATE_TRAINING";
      else if (service.includes("campus") || service.includes("drive") || campaign.includes("CAMPUS")) subPipeline = "CAMPUS_DRIVE";
      else if (service.includes("institution") || service.includes("partnership") || campaign.includes("PARTNERSHIP")) subPipeline = "INSTITUTIONAL_PARTNERSHIP";
      else if (service.includes("franchise") || campaign.includes("FRANCHISE")) subPipeline = "FRANCHISE";

      return {
        pipeline: "BUSINESS_SERVICES",
        subPipeline,
        assignedTeam: "Business Development Team",
        assignedRoleCode: UserRoleCode.MANAGER,
        tags: ["SLG_META_SERVICES_LEADS_OCT26", subPipeline],
      };
    }

    // Category 1: Default to Course Admissions (Admissions Team)
    return {
      pipeline: "COURSE_ADMISSIONS",
      assignedTeam: "Admissions Team",
      assignedRoleCode: UserRoleCode.COUNSELOR,
      tags: ["SLG_META_COURSES_LEADS_OCT26", "ADMISSIONS"],
    };
  }

  /**
   * Ingests an extracted Meta lead idempotently into CRM
   */
  public static async ingestMetaLead(
    lead: ExtractedMetaLead,
    signatureValid = true
  ): Promise<{
    success: boolean;
    leadId: string;
    isNew: boolean;
    isDuplicate: boolean;
    routing: RoutingResult;
    logId: string;
  }> {
    const cleanPhone = WhatsAppBusinessService.normalizePhone(lead.phone);
    const routing = await this.evaluateRoutingRules(lead);

    // 1. Idempotency Check via MetaLeadWebhookLog
    let webhookLog = await db.metaLeadWebhookLog.findUnique({
      where: { metaLeadId: lead.metaLeadId },
    });

    if (webhookLog && webhookLog.status === "SUCCESS" && webhookLog.leadId) {
      console.log(`[MetaLeadAdsService] Duplicate Meta leadgen webhook received: ${lead.metaLeadId}. Skipping duplicate lead creation.`);
      return {
        success: true,
        leadId: webhookLog.leadId,
        isNew: false,
        isDuplicate: true,
        routing,
        logId: webhookLog.id,
      };
    }

    if (!webhookLog) {
      webhookLog = await db.metaLeadWebhookLog.create({
        data: {
          metaLeadId: lead.metaLeadId,
          formId: lead.formId,
          adId: lead.adId,
          adsetId: lead.adsetId,
          campaignId: lead.campaignId,
          campaignName: lead.campaignName,
          status: "PENDING",
          pipeline: routing.pipeline,
          signatureValid,
          rawPayload: lead.rawFieldData as any,
        },
      });
    }

    try {
      // 2. Find or assign appropriate staff owner based on pipeline routing
      let targetOwnerId: string | null = routing.assignedUserId || null;

      if (!targetOwnerId) {
        // Query active team members for this role
        const candidates = await db.user.findMany({
          where: {
            roleCode: routing.assignedRoleCode,
            status: "ACTIVE",
          },
          select: { id: true },
          orderBy: { updatedAt: "asc" },
        });

        if (candidates.length > 0) {
          // Pick round-robin candidate
          targetOwnerId = candidates[Math.floor(Math.random() * candidates.length)].id;
        } else {
          // Fallback to Super Admin or Director
          const admin = await db.user.findFirst({
            where: {
              roleCode: { in: [UserRoleCode.SUPER_ADMIN, UserRoleCode.DIRECTOR, UserRoleCode.ADMIN] },
              status: "ACTIVE",
            },
            select: { id: true },
          });
          if (admin) targetOwnerId = admin.id;
        }
      }

      // 3. Match Course ID if pipeline is Course Admissions
      let matchedCourseId: string | null = null;
      if (lead.interestedCourse) {
        const found = await db.course.findFirst({
          where: {
            OR: [
              { title: { contains: lead.interestedCourse, mode: "insensitive" } },
              { slug: { contains: lead.interestedCourse.toLowerCase().replace(/\s+/g, "-") } },
            ],
            deletedAt: null,
          },
          select: { id: true },
        });
        if (found) matchedCourseId = found.id;
      }

      // 4. Check for Existing CRM Contact (Deduplication)
      const existingLead = await db.lead.findFirst({
        where: {
          OR: [
            { metaLeadId: lead.metaLeadId },
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
            ...(lead.email ? [{ email: lead.email }] : []),
          ],
        },
      });

      const leadSource = lead.platform === "ig" ? LeadSource.META_ADS_IG : LeadSource.META_ADS_FB;

      if (existingLead) {
        // Update existing lead without overwriting verified values
        const updatedNotes = `${existingLead.notes || ""}\n[${new Date().toISOString()} via Meta Ads ${lead.campaignName || ""}]: ${JSON.stringify(lead.rawAnswers)}`.trim();

        const updated = await db.lead.update({
          where: { id: existingLead.id },
          data: {
            metaLeadId: existingLead.metaLeadId || lead.metaLeadId,
            metaFormId: existingLead.metaFormId || lead.formId,
            metaAdId: existingLead.metaAdId || lead.adId,
            metaCampaignId: existingLead.metaCampaignId || lead.campaignId,
            campaignName: existingLead.campaignName || lead.campaignName,
            adsetName: existingLead.adsetName || lead.adsetName,
            adCreativeName: existingLead.adCreativeName || lead.adName,
            pipelineStage: routing.pipeline,
            serviceCategory: routing.subPipeline || existingLead.serviceCategory,
            metaRawData: lead.rawFieldData as any,
            notes: updatedNotes,
            lastInteraction: new Date(),
          },
        });

        // Record Lead Activity
        await db.leadActivity.create({
          data: {
            leadId: existingLead.id,
            activityType: "META_LEADGEN_REENGAGED",
            disposition: "RE_ENGAGED",
            notes: `Re-engaged via Meta Lead Ads (${lead.campaignName || "Campaign"}). Pipeline: ${routing.pipeline} (${routing.assignedTeam}).`,
          },
        });

        // Record Timeline Event
        await OmnichannelInboxService.recordTimelineEvent({
          leadId: existingLead.id,
          eventType: "META_LEAD_SUBMISSION",
          source: "META_ADS",
          title: `Meta Lead Form Submitted (${lead.platform === "ig" ? "Instagram" : "Facebook"})`,
          summary: `Campaign: ${lead.campaignName || "Meta Ads"}. Form ID: ${lead.formId || "N/A"}. Submitted details merged with existing contact.`,
          metadata: {
            metaLeadId: lead.metaLeadId,
            campaign: lead.campaignName,
            adName: lead.adName,
            routing,
            answers: lead.rawAnswers,
          },
        });

        // Mark Webhook Log Success
        await db.metaLeadWebhookLog.update({
          where: { id: webhookLog.id },
          data: {
            leadId: existingLead.id,
            status: "SUCCESS",
            processedAt: new Date(),
          },
        });

        return {
          success: true,
          leadId: existingLead.id,
          isNew: false,
          isDuplicate: true,
          routing,
          logId: webhookLog.id,
        };
      }

      // 5. Create Brand New Lead
      const notesContent = [
        `Captured from Meta Lead Ads (${lead.platform === "ig" ? "Instagram" : "Facebook"}).`,
        `Campaign: ${lead.campaignName || "N/A"}`,
        `Ad: ${lead.adName || lead.adId || "N/A"}`,
        `Form: ${lead.formId || "N/A"}`,
        `Assigned Team: ${routing.assignedTeam}`,
        `Submitted Answers: ${JSON.stringify(lead.rawAnswers, null, 2)}`,
      ].join("\n");

      const newLead = await db.lead.create({
        data: {
          fullName: lead.fullName,
          phone: cleanPhone,
          email: lead.email || `${cleanPhone}@meta.softlabglobal.com`,
          city: lead.city || "Prayagraj",
          source: leadSource,
          status: LeadStatus.NEW,
          qualityScore: "WARM",
          temperature: "WARM",
          leadScore: 65,
          interestedCourseId: matchedCourseId,
          campaignName: lead.campaignName,
          adsetName: lead.adsetName,
          adCreativeName: lead.adName,
          notes: notesContent,
          metaLeadId: lead.metaLeadId,
          metaFormId: lead.formId,
          metaAdId: lead.adId,
          metaAdsetId: lead.adsetId,
          metaCampaignId: lead.campaignId,
          pipelineStage: routing.pipeline,
          serviceCategory: routing.subPipeline,
          metaRawData: lead.rawFieldData as any,
          assignedToId: targetOwnerId,
          assignedCounselorId: routing.assignedRoleCode === UserRoleCode.COUNSELOR ? targetOwnerId : null,
          assignedTelecallerId: routing.assignedRoleCode === UserRoleCode.TELECALLER ? targetOwnerId : null,
        },
      });

      // Log Lead Activity
      await db.leadActivity.create({
        data: {
          leadId: newLead.id,
          activityType: "META_LEADGEN_CAPTURED",
          disposition: "NEW_LEAD",
          notes: `New Meta Lead captured via ${leadSource}. Form ID: ${lead.formId || "N/A"}. Routed to ${routing.assignedTeam}.`,
        },
      });

      // Record Timeline Event
      await OmnichannelInboxService.recordTimelineEvent({
        leadId: newLead.id,
        eventType: "META_LEAD_CAPTURED",
        source: "META_ADS",
        title: `Meta Lead Form Submitted (${lead.platform === "ig" ? "Instagram" : "Facebook"})`,
        summary: `New inquiry received from ${lead.campaignName || "Meta Ads"}. Routed to ${routing.assignedTeam}.`,
        metadata: {
          metaLeadId: lead.metaLeadId,
          campaign: lead.campaignName,
          adName: lead.adName,
          routing,
          answers: lead.rawAnswers,
        },
      });

      // Auto-enroll in follow-up automation sequence
      try {
        await FollowUpAutomationService.enrollLeadInSequence(newLead.id);
      } catch (e: any) {
        console.warn("[MetaLeadAdsService] FollowUp sequence auto-enroll notice:", e.message);
      }

      // Mark Webhook Log Success
      await db.metaLeadWebhookLog.update({
        where: { id: webhookLog.id },
        data: {
          leadId: newLead.id,
          status: "SUCCESS",
          processedAt: new Date(),
        },
      });

      return {
        success: true,
        leadId: newLead.id,
        isNew: true,
        isDuplicate: false,
        routing,
        logId: webhookLog.id,
      };
    } catch (err: any) {
      console.error(`[MetaLeadAdsService] Lead ingestion failure for metaLeadId ${lead.metaLeadId}:`, err);
      await db.metaLeadWebhookLog.update({
        where: { id: webhookLog.id },
        data: {
          status: "FAILED",
          errorMessage: err.message,
        },
      });
      throw err;
    }
  }

  /**
   * Manually retries a failed or pending webhook log
   */
  public static async retryWebhookLog(logId: string): Promise<{ success: boolean; message: string }> {
    const log = await db.metaLeadWebhookLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      throw new Error(`Webhook log ${logId} not found.`);
    }

    try {
      // Re-fetch lead from Meta Graph API
      const extracted = await this.fetchLeadDetails(log.metaLeadId);
      if (!extracted) {
        throw new Error(`Could not retrieve lead details from Meta Graph API for leadgen ID ${log.metaLeadId}. Ensure Page Access Token is valid.`);
      }

      const res = await this.ingestMetaLead(extracted, true);

      await db.metaLeadWebhookLog.update({
        where: { id: logId },
        data: {
          retryCount: { increment: 1 },
          lastRetriedAt: new Date(),
          status: "SUCCESS",
          leadId: res.leadId,
          errorMessage: null,
        },
      });

      return { success: true, message: `Lead ${extracted.fullName} successfully reconciled and ingested into CRM (ID: ${res.leadId}).` };
    } catch (err: any) {
      await db.metaLeadWebhookLog.update({
        where: { id: logId },
        data: {
          retryCount: { increment: 1 },
          lastRetriedAt: new Date(),
          errorMessage: err.message,
        },
      });
      return { success: false, message: `Retry failed: ${err.message}` };
    }
  }

  /**
   * Generates or gets default campaign routing rules
   */
  public static async ensureDefaultRoutingRules(): Promise<void> {
    const count = await db.metaCampaignRoutingRule.count();
    if (count > 0) return;

    const defaultRules = [
      {
        priority: 1,
        name: "Course Admissions Boost (Oct 2026)",
        campaignPattern: "SLG_META_COURSES_LEADS_OCT26",
        targetPipeline: "COURSE_ADMISSIONS",
        assignedTeam: "Admissions Team",
        defaultOwnerRole: "COUNSELOR",
        autoTags: ["SLG_META_COURSES_LEADS_OCT26", "ADMISSIONS"],
      },
      {
        priority: 2,
        name: "BOSSE & DPGU University Enquiries (Oct 2026)",
        campaignPattern: "SLG_META_BOSSE_DPGU_LEADS_OCT26",
        targetPipeline: "BOSSE_DPGU",
        assignedTeam: "Education Counselling Team",
        defaultOwnerRole: "COUNSELOR",
        autoTags: ["SLG_META_BOSSE_DPGU_LEADS_OCT26", "UNIVERSITY"],
      },
      {
        priority: 3,
        name: "Business Services & Corporate Partnerships (Oct 2026)",
        campaignPattern: "SLG_META_SERVICES_LEADS_OCT26",
        targetPipeline: "BUSINESS_SERVICES",
        assignedTeam: "Business Development Team",
        defaultOwnerRole: "MANAGER",
        autoTags: ["SLG_META_SERVICES_LEADS_OCT26", "PARTNERSHIPS"],
      },
    ];

    for (const rule of defaultRules) {
      await db.metaCampaignRoutingRule.create({
        data: rule as any,
      });
    }
  }
}
