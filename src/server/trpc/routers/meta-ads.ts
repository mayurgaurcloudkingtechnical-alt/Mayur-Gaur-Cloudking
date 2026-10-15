import { z } from "zod";
import { router, requireRoleProcedure } from "../init";
import { UserRoleCode } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { MetaLeadAdsService } from "@/server/services/meta-lead-ads.service";
import { db } from "@/server/db/client";

const adminRoles = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
];

export const metaAdsRouter = router({
  /**
   * Retrieves connection status and settings (secrets are masked)
   */
  getConnectionStatus: requireRoleProcedure(adminRoles).query(async () => {
    const config = await MetaLeadAdsService.getConfig();

    // Aggregate webhook statistics
    const [totalReceived, totalSuccess, totalDuplicates, totalFailed] = await Promise.all([
      db.metaLeadWebhookLog.count(),
      db.metaLeadWebhookLog.count({ where: { status: "SUCCESS" } }),
      db.metaLeadWebhookLog.count({ where: { status: "DUPLICATE" } }),
      db.metaLeadWebhookLog.count({ where: { status: "FAILED" } }),
    ]);

    return {
      appId: config.appId,
      pageId: config.pageId,
      pageName: config.pageName,
      businessId: config.businessId,
      adAccountId: config.adAccountId || "",
      hasAccessToken: Boolean(config.accessToken && config.accessToken.length > 5),
      hasAppSecret: Boolean(config.appSecret && config.appSecret.length > 5),
      verifyToken: config.verifyToken,
      webhookUrl: config.webhookUrl,
      connectionStatus: config.connectionStatus,
      lastVerifiedAt: config.lastVerifiedAt,
      lastError: config.lastError,
      stats: {
        totalReceived,
        totalSuccess,
        totalDuplicates,
        totalFailed,
      },
    };
  }),

  /**
   * Saves Meta Lead Ads credentials safely
   */
  saveCredentials: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        appId: z.string().optional(),
        appSecret: z.string().optional(),
        pageId: z.string().optional(),
        pageName: z.string().optional(),
        businessId: z.string().optional(),
        adAccountId: z.string().optional(),
        accessToken: z.string().optional(),
        verifyToken: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const saved = await MetaLeadAdsService.saveConfig(input, ctx.user.id);
      return { success: true, saved };
    }),

  /**
   * Tests and verifies live Graph API v21.0 connection to Meta
   */
  verifyConnection: requireRoleProcedure(adminRoles).mutation(async () => {
    return MetaLeadAdsService.verifyLiveConnection();
  }),

  /**
   * Lists leadgen forms discovered for the connected Page
   */
  listForms: requireRoleProcedure(adminRoles).query(async () => {
    return MetaLeadAdsService.fetchPageLeadForms();
  }),

  /**
   * Retrieves configured form mappings
   */
  getFormMappings: requireRoleProcedure(adminRoles).query(async () => {
    return db.metaLeadFormMapping.findMany({
      orderBy: { updatedAt: "desc" },
    });
  }),

  /**
   * Saves or updates a form mapping
   */
  saveFormMapping: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        formId: z.string().min(1),
        formName: z.string().min(1),
        pageId: z.string().min(1),
        campaignCategory: z.enum(["COURSES", "BOSSE_DPGU", "SERVICES"]).default("COURSES"),
        targetPipeline: z.string().default("COURSE_ADMISSIONS"),
        defaultCourseId: z.string().optional(),
        defaultOwnerRole: z.string().optional(),
        defaultOwnerId: z.string().optional(),
        fieldMappings: z.record(z.string()).optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      return db.metaLeadFormMapping.upsert({
        where: { formId: input.formId },
        update: {
          formName: input.formName,
          pageId: input.pageId,
          campaignCategory: input.campaignCategory,
          targetPipeline: input.targetPipeline,
          defaultCourseId: input.defaultCourseId,
          defaultOwnerRole: input.defaultOwnerRole,
          defaultOwnerId: input.defaultOwnerId,
          fieldMappings: (input.fieldMappings || {}) as any,
          isActive: input.isActive,
        },
        create: {
          formId: input.formId,
          formName: input.formName,
          pageId: input.pageId,
          campaignCategory: input.campaignCategory,
          targetPipeline: input.targetPipeline,
          defaultCourseId: input.defaultCourseId,
          defaultOwnerRole: input.defaultOwnerRole,
          defaultOwnerId: input.defaultOwnerId,
          fieldMappings: (input.fieldMappings || {}) as any,
          isActive: input.isActive,
        },
      });
    }),

  /**
   * Retrieves the 3 campaign category routing rules (ensuring defaults exist)
   */
  getRoutingRules: requireRoleProcedure(adminRoles).query(async () => {
    await MetaLeadAdsService.ensureDefaultRoutingRules();
    return db.metaCampaignRoutingRule.findMany({
      orderBy: { priority: "asc" },
    });
  }),

  /**
   * Saves or updates a campaign routing rule
   */
  saveRoutingRule: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        id: z.string().optional(),
        priority: z.number().int().min(1),
        name: z.string().min(1),
        campaignPattern: z.string().min(1),
        formIdPattern: z.string().optional(),
        targetPipeline: z.string().default("COURSE_ADMISSIONS"),
        assignedTeam: z.string().default("Admissions Team"),
        defaultOwnerRole: z.string().default("COUNSELOR"),
        defaultOwnerId: z.string().optional(),
        autoTags: z.array(z.string()).optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      if (input.id) {
        return db.metaCampaignRoutingRule.update({
          where: { id: input.id },
          data: {
            priority: input.priority,
            name: input.name,
            campaignPattern: input.campaignPattern,
            formIdPattern: input.formIdPattern,
            targetPipeline: input.targetPipeline,
            assignedTeam: input.assignedTeam,
            defaultOwnerRole: input.defaultOwnerRole,
            defaultOwnerId: input.defaultOwnerId,
            autoTags: input.autoTags as any,
            isActive: input.isActive,
          },
        });
      }

      return db.metaCampaignRoutingRule.create({
        data: {
          priority: input.priority,
          name: input.name,
          campaignPattern: input.campaignPattern,
          formIdPattern: input.formIdPattern,
          targetPipeline: input.targetPipeline,
          assignedTeam: input.assignedTeam,
          defaultOwnerRole: input.defaultOwnerRole,
          defaultOwnerId: input.defaultOwnerId,
          autoTags: input.autoTags as any,
          isActive: input.isActive,
        },
      });
    }),

  /**
   * Deletes a custom routing rule
   */
  deleteRoutingRule: requireRoleProcedure(adminRoles)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.metaCampaignRoutingRule.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),

  /**
   * Retrieves paginated webhook audit logs with status filter
   */
  getWebhookLogs: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        status: z.enum(["ALL", "SUCCESS", "DUPLICATE", "FAILED", "PENDING"]).default("ALL"),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const where: any = {};
      if (input.status !== "ALL") {
        where.status = input.status;
      }

      const skip = (input.page - 1) * input.limit;
      const [total, logs] = await Promise.all([
        db.metaLeadWebhookLog.count({ where }),
        db.metaLeadWebhookLog.findMany({
          where,
          include: {
            lead: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                status: true,
                pipelineStage: true,
              },
            },
          },
          orderBy: { receivedAt: "desc" },
          skip,
          take: input.limit,
        }),
      ]);

      return {
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit) || 1,
        logs,
      };
    }),

  /**
   * Manually retries a failed or pending webhook log
   */
  retryFailedWebhook: requireRoleProcedure(adminRoles)
    .input(z.object({ logId: z.string() }))
    .mutation(async ({ input }) => {
      return MetaLeadAdsService.retryWebhookLog(input.logId);
    }),

  /**
   * Triggers an authorized test lead injection simulating Meta Lead Ads
   */
  triggerTestLead: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        category: z.enum(["COURSES", "BOSSE_DPGU", "SERVICES"]).default("COURSES"),
        fullName: z.string().default("Meta Test Candidate"),
        phone: z.string().default("919999999999"),
        email: z.string().default("test.meta@softlabglobal.com"),
        city: z.string().default("Prayagraj"),
        courseOrService: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let campaignName = "SLG_META_COURSES_LEADS_OCT26";
      let formId = "FORM_COURSES_OCT26";
      let interestedCourse = input.courseOrService || "Full Stack Web Development & AI";
      let selectedProgramme: string | undefined = undefined;
      let requestedService: string | undefined = undefined;

      if (input.category === "BOSSE_DPGU") {
        campaignName = "SLG_META_BOSSE_DPGU_LEADS_OCT26";
        formId = "FORM_DPGU_OCT26";
        selectedProgramme = input.courseOrService || "Dr. Preeti Global University - BCA / MBA";
      } else if (input.category === "SERVICES") {
        campaignName = "SLG_META_SERVICES_LEADS_OCT26";
        formId = "FORM_SERVICES_OCT26";
        requestedService = input.courseOrService || "Corporate Training & Campus Placement Drive";
      }

      const mockLead = {
        metaLeadId: `test_meta_${Date.now()}`,
        createdTime: new Date(),
        formId,
        adId: "AD_OCT26_TEST",
        adName: "Official Meta Test Creative",
        campaignName,
        platform: "fb" as const,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        city: input.city,
        interestedCourse,
        selectedProgramme,
        requestedService,
        rawAnswers: {
          fullName: input.fullName,
          phone: input.phone,
          city: input.city,
          campaign: campaignName,
        },
        rawFieldData: [],
      };

      return MetaLeadAdsService.ingestMetaLead(mockLead, true);
    }),

  /**
   * Safely disconnects Meta integration and revokes credentials from database
   */
  disconnect: requireRoleProcedure(adminRoles).mutation(async ({ ctx }) => {
    await MetaLeadAdsService.saveConfig(
      {
        accessToken: "",
        appSecret: "",
        connectionStatus: "NOT_CONNECTED",
        lastError: null,
      },
      ctx.user.id
    );
    return { success: true };
  }),
});
