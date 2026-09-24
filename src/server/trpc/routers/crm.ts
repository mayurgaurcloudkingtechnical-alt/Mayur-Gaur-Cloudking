import { router, publicProcedure, requireRoleProcedure } from "../init";
import { z } from "zod";
import {
  UserRoleCode,
  LeadStatus,
  LeadSource,
  FollowUpType,
  ApplicationStage,
  PaymentMethod,
  FranchiseStatus,
  FranchisePackageType,
  FeePaymentStatus,
  DeliveryMode,
} from "@prisma/client";
import { META_ADS_CONFIG, INSTAGRAM_CONFIG } from "@/server/config/meta-ads.config";
import { CrmLeadService, canReadAllLeads, META_SOURCES } from "@/server/services/crm-lead.service";
import { CrmApplicationService } from "@/server/services/crm-application.service";
import { CrmIngestionService } from "@/server/services/crm-ingestion.service";
import { db } from "@/server/db/client";
import { AuthenticatedUser, hasPermission } from "@/server/auth/rbac";
import { ReceiptService } from "@/server/services/receipt.service";
import { TRPCError } from "@trpc/server";

function asAuthUser(user: any): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email || "",
    roleCode: user.roleCode,
    permissions: user.permissions || [],
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  };
}

const crmRoles = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
  UserRoleCode.COUNSELOR,
  UserRoleCode.TELECALLER,
];

const franchiseRoles = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
];

const admissionRoles = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
  UserRoleCode.COUNSELOR,
];

export const crmRouter = router({
  /**
   * Public enquiry submission from marketing website with spam honeypot
   * and rate-limiting.
   */
  submitEnquiry: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
        email: z.string().email("Please provide a valid email address"),
        phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
        city: z.string().max(50).optional(),
        source: z.nativeEnum(LeadSource).optional(),
        campaignName: z.string().max(150).optional(),
        interestedCourseId: z.string().optional(),
        notes: z.string().max(1000).optional(),
        honeypot: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const forwardedFor = ctx.headers ? ctx.headers.get("x-forwarded-for") : null;
      const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
      const userAgent = ctx.headers ? ctx.headers.get("user-agent") || "unknown" : "unknown";

      return CrmLeadService.submitPublicEnquiry(input, ipAddress, userAgent);
    }),

  /**
   * Public franchise enquiry submission with rate limiting, spam honeypot,
   * deduplication, audit trail, and instant notifications.
   */
  submitFranchiseEnquiry: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
        email: z.string().email("Please provide a valid email address"),
        phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
        city: z.string().min(2, "City is required").max(100),
        state: z.string().min(2, "State is required").max(100),
        preferredLocation: z.string().max(150).optional(),
        applicantProfile: z.string().min(2, "Please select your profile"),
        investmentCapacity: z.string().min(2, "Please select your investment capacity"),
        existingInstitute: z.boolean().optional(),
        experience: z.string().max(500).optional(),
        launchTimeline: z.string().max(100).optional(),
        requirements: z.string().max(1000).optional(),
        notes: z.string().max(1000).optional(),
        campaignName: z.string().max(150).optional(),
        adsetName: z.string().max(150).optional(),
        adCreativeName: z.string().max(150).optional(),
        keywordSearch: z.string().max(150).optional(),
        landingPageUrl: z.string().max(300).optional(),
        honeypot: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const forwardedFor = ctx.headers ? ctx.headers.get("x-forwarded-for") : null;
      const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
      const userAgent = ctx.headers ? ctx.headers.get("user-agent") || "unknown" : "unknown";

      return CrmLeadService.submitFranchiseEnquiry(input, ipAddress, userAgent);
    }),

  /**
   * Public list of active courses for inquiry dropdown.
   */
  listPublicCourses: publicProcedure.query(async () => {
    return db.course.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        baseFee: true,
        providerType: true,
        providerName: true,
        universityName: true,
        durationYears: true,
        specialization: true,
        specializations: true,
        programCategory: true,
        admissionSession: true,
        registrationFee: true,
        examinationFee: true,
        universityFeeYear: true,
        lateralEntryFee: true,
        isLateralEligible: true,
      },
      orderBy: { title: "asc" },
    });
  }),

  /**
   * Pipeline dashboard metrics and follow-up counter.
   */
  getStats: requireRoleProcedure(crmRoles).query(async ({ ctx }) => {
    const authUser = asAuthUser(ctx.user);
    const hasReadAll = canReadAllLeads(authUser);

    let whereLead: any = {};
    if (hasReadAll) {
      whereLead = {};
    } else if (authUser.roleCode === UserRoleCode.TELECALLER) {
      whereLead = {
        OR: [
          { source: { in: META_SOURCES } },
          { assignedToId: ctx.user.id },
          { assignedCounselorId: ctx.user.id },
          { assignedTelecallerId: ctx.user.id },
          { assignedToId: null },
        ],
      };
    } else {
      whereLead = {
        OR: [
          { assignedToId: ctx.user.id },
          { assignedCounselorId: ctx.user.id },
          { assignedToId: null },
        ],
      };
    }

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [totalLeads, newLeads, dueToday, totalApps, admittedCount] = await Promise.all([
      db.lead.count({ where: whereLead }),
      db.lead.count({ where: { ...whereLead, status: LeadStatus.NEW } }),
      db.lead.count({
        where: {
          ...whereLead,
          nextFollowUp: { not: null, lte: endOfToday },
          status: { notIn: [LeadStatus.ADMITTED, LeadStatus.LOST] },
        },
      }),
      db.admissionApplication.count({
        where: hasReadAll ? {} : { counselorId: ctx.user.id },
      }),
      db.lead.count({ where: { ...whereLead, status: LeadStatus.ADMITTED } }),
    ]);

    return {
      totalLeads,
      newLeads,
      dueToday,
      totalApps,
      admittedCount,
    };
  }),

  /**
   * Role-scoped lead listing with search, filters, and pagination.
   */
  listLeads: requireRoleProcedure(crmRoles)
    .input(
      z.object({
        status: z.nativeEnum(LeadStatus).optional(),
        source: z.string().optional(),
        search: z.string().optional(),
        courseId: z.string().optional(),
        assignedToId: z.string().optional(),
        dueToday: z.boolean().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return CrmLeadService.listLeads(asAuthUser(ctx.user), input);
    }),

  /**
   * Single lead detail with duplicate inspection and interaction timeline.
   */
  getLeadDetails: requireRoleProcedure(crmRoles)
    .input(z.object({ leadId: z.string() }))
    .query(async ({ ctx, input }) => {
      return CrmLeadService.getLeadDetails(asAuthUser(ctx.user), input.leadId);
    }),

  /**
   * Logs a counseling note, outbound call, or status change.
   */
  logFollowUp: requireRoleProcedure(crmRoles)
    .input(
      z.object({
        leadId: z.string(),
        type: z.nativeEnum(FollowUpType),
        notes: z.string().min(2, "Notes must be provided"),
        newStatus: z.nativeEnum(LeadStatus).optional(),
        nextFollowUpDate: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CrmLeadService.logFollowUp(asAuthUser(ctx.user), input);
    }),

  /**
   * Reassigns lead to a designated counselor or telecaller.
   */
  assignLead: requireRoleProcedure(crmRoles)
    .input(
      z.object({
        leadId: z.string(),
        assignedToId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CrmLeadService.assignLead(asAuthUser(ctx.user), input);
    }),

  /**
   * Lists available counselors and telecallers with communication lines and lead capacity.
   */
  listCounselors: requireRoleProcedure(crmRoles).query(async () => {
    return db.user.findMany({
      where: {
        roleCode: {
          in: [
            UserRoleCode.COUNSELOR,
            UserRoleCode.TELECALLER,
            UserRoleCode.MANAGER,
            UserRoleCode.ADMIN,
          ],
        },
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roleCode: true,
        callingNumber: true,
        whatsappNumber: true,
        isLeadAccepting: true,
        dailyLeadQuota: true,
        activeLeadsCount: true,
      },
      orderBy: { firstName: "asc" },
    });
  }),

  /**
   * Updates staff communication numbers, availability toggle, and daily quota.
   */
  updateStaffCommunication: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ])
    .input(
      z.object({
        userId: z.string(),
        callingNumber: z.string().optional().nullable(),
        whatsappNumber: z.string().optional().nullable(),
        isLeadAccepting: z.boolean().optional(),
        dailyLeadQuota: z.number().int().min(1).max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.user.update({
        where: { id: input.userId },
        data: {
          callingNumber: input.callingNumber,
          whatsappNumber: input.whatsappNumber,
          ...(input.isLeadAccepting !== undefined ? { isLeadAccepting: input.isLeadAccepting } : {}),
          ...(input.dailyLeadQuota ? { dailyLeadQuota: input.dailyLeadQuota } : {}),
        },
      });
    }),

  /**
   * Logs a rapid telecaller/counselor calling disposition.
   */
  logDisposition: requireRoleProcedure(crmRoles)
    .input(
      z.object({
        leadId: z.string(),
        disposition: z.string().min(1),
        notes: z.string().optional(),
        newStatus: z.nativeEnum(LeadStatus).optional(),
        nextFollowUpDate: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CrmLeadService.logDisposition(asAuthUser(ctx.user), input);
    }),

  /**
   * Escalates a qualified lead from telecaller to counselor.
   */
  escalateToCounselor: requireRoleProcedure(crmRoles)
    .input(
      z.object({
        leadId: z.string(),
        counselorId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { LeadRouterService } = await import("@/server/services/lead-router.service");
      return LeadRouterService.escalateLeadToCounselor(
        input.leadId,
        input.counselorId,
        input.notes,
        ctx.user.id
      );
    }),

  /**
   * Marketing analytics breakdown by channel (JustDial, Google, Meta, Website).
   */
  getMarketingAnalytics: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ]).query(async () => {
    return CrmLeadService.getMarketingAnalytics();
  }),

  /**
   * Retrieves inbuilt active Meta / Facebook Boost campaigns and live performance stats.
   * Accessible by all CRM staff (Admins, Counselors, Telecallers).
   */
  getMetaAdsCampaigns: requireRoleProcedure(crmRoles).query(async () => {
    const boost = META_ADS_CONFIG.ACTIVE_BOOST;
    const [totalLeads, admittedCount] = await Promise.all([
      db.lead.count({
        where: {
          OR: [
            { adCreativeName: { contains: boost.boostId } },
            { campaignName: { contains: boost.boostId } },
            { notes: { contains: boost.boostId } },
          ],
        },
      }),
      db.lead.count({
        where: {
          status: LeadStatus.ADMITTED,
          OR: [
            { adCreativeName: { contains: boost.boostId } },
            { campaignName: { contains: boost.boostId } },
            { notes: { contains: boost.boostId } },
          ],
        },
      }),
    ]);

    return {
      pageId: META_ADS_CONFIG.PAGE_ID,
      pageName: META_ADS_CONFIG.PAGE_NAME,
      pageUrl: META_ADS_CONFIG.PAGE_URL,
      campaigns: [
        {
          ...boost,
          totalLeads,
          admittedCount,
          conversionRate: totalLeads > 0 ? ((admittedCount / totalLeads) * 100).toFixed(1) : "0.0",
        },
      ],
    };
  }),

  /**
   * Ingests or simulates a test lead from the active Facebook Boost Ad.
   */
  simulateMetaLead: requireRoleProcedure(crmRoles)
    .input(
      z.object({
        fullName: z.string().min(2).default("Meta Prospect"),
        phone: z.string().min(10).default("9876500001"),
        email: z.string().email().optional(),
        city: z.string().optional().default("Prayagraj"),
        notes: z.string().optional(),
        source: z.enum(["META_ADS_FB", "META_ADS_IG"]).optional().default("META_ADS_FB"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { LeadRouterService } = await import("@/server/services/lead-router.service");
      const { AiChatbotService } = await import("@/server/services/ai-chatbot.service");

      const isInstagram = input.source === "META_ADS_IG";
      const leadSource = isInstagram ? LeadSource.META_ADS_IG : LeadSource.META_ADS_FB;
      const defaultCampaign = isInstagram
        ? "Instagram Profile & Reels (@softlabglobal9)"
        : META_ADS_CONFIG.ACTIVE_BOOST.campaignName;
      const defaultCreative = isInstagram
        ? "Instagram DM & Lead Form (@softlabglobal9)"
        : META_ADS_CONFIG.ACTIVE_BOOST.adCreativeName;
      const defaultNotes = isInstagram
        ? `Simulated Inquiry from Instagram @softlabglobal9 (Reel/DM). Ingested by ${ctx.user.firstName || "Staff"}.`
        : `Simulated Lead from FB Boost ID: ${META_ADS_CONFIG.ACTIVE_BOOST.boostId}. Ingested by ${ctx.user.firstName || "Staff"}.`;

      const result = await LeadRouterService.ingestLead({
        fullName: input.fullName,
        phone: input.phone,
        email: input.email || `${isInstagram ? "ig" : "meta"}.${Date.now()}@example.com`,
        city: input.city || "Prayagraj",
        source: leadSource,
        campaignName: defaultCampaign,
        adCreativeName: defaultCreative,
        notes: input.notes || defaultNotes,
        qualityScore: "WARM",
      });

      if (result.leadId) {
        AiChatbotService.triggerInstantWelcome(result.leadId).catch((err) =>
          console.error("Failed to trigger instant bot for simulated lead:", err)
        );
      }

      return result;
    }),

  /**
   * Creates an admission application for an evaluated prospect.
   */
  createApplication: requireRoleProcedure(admissionRoles)
    .input(
      z.object({
        leadId: z.string(),
        courseId: z.string(),
        batchId: z.string().optional(),
        applicantName: z.string().min(2),
        applicantEmail: z.string().email(),
        applicantPhone: z.string().min(10),
        dateOfBirth: z.date().optional(),
        gender: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        highestQualification: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CrmApplicationService.createApplication(asAuthUser(ctx.user), input);
    }),

  /**
   * Lists admission applications scoped to assigned counselor or all for admin.
   */
  listApplications: requireRoleProcedure(admissionRoles)
    .input(
      z.object({
        stage: z.nativeEnum(ApplicationStage).optional(),
        courseId: z.string().optional(),
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return CrmApplicationService.listApplications(asAuthUser(ctx.user), input);
    }),

  /**
   * Fetches single application details.
   */
  getApplicationDetails: requireRoleProcedure(admissionRoles)
    .input(z.object({ applicationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return CrmApplicationService.getApplicationDetails(asAuthUser(ctx.user), input.applicationId);
    }),

  /**
   * Updates application stage (SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, RETURNED_FOR_INFORMATION).
   */
  updateApplicationStage: requireRoleProcedure(admissionRoles)
    .input(
      z.object({
        applicationId: z.string(),
        stage: z.nativeEnum(ApplicationStage),
        decisionReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CrmApplicationService.updateApplicationStage(asAuthUser(ctx.user), input);
    }),

  /**
   * Explicitly converts an approved application into an active student record.
   */
  convertApplication: requireRoleProcedure(admissionRoles)
    .input(z.object({ applicationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return CrmApplicationService.convertApplicationToStudent(asAuthUser(ctx.user), input.applicationId);
    }),

  /**
   * Updates an admission application's personal or academic details.
   */
  updateApplication: requireRoleProcedure(admissionRoles)
    .input(
      z.object({
        applicationId: z.string(),
        applicantName: z.string().min(2).optional(),
        applicantEmail: z.string().email().optional(),
        applicantPhone: z.string().min(10).optional(),
        fatherName: z.string().optional(),
        motherName: z.string().optional(),
        dateOfBirth: z.union([z.date(), z.string()]).optional(),
        gender: z.string().optional(),
        whatsappNumber: z.string().optional(),
        alternatePhone: z.string().optional(),
        schoolOrCollege: z.string().optional(),
        passingYear: z.string().optional(),
        percentageOrCgpa: z.string().optional(),
        photoUrl: z.string().optional(),
        center: z.string().optional(),
        courseId: z.string().optional(),
        batchId: z.string().nullable().optional(),
        counselorId: z.string().nullable().optional(),
        stage: z.nativeEnum(ApplicationStage).optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        highestQualification: z.string().optional(),
        address: z.string().optional(),
        decisionReason: z.string().optional(),
        totalCourseFee: z.number().min(0).optional(),
        discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
        discountValue: z.number().min(0).optional(),
        discountAmount: z.number().min(0).optional(),
        finalFee: z.number().min(0).optional(),
        paidAmount: z.number().min(0).optional(),
        paymentPlan: z.enum(["LUMPSUM", "EMI"]).optional(),
        installmentCount: z.number().min(1).max(12).optional(),
        installments: z
          .array(
            z.object({
              installmentNumber: z.number(),
              amount: z.number().min(0),
              dueDate: z.union([z.date(), z.string()]),
              notes: z.string().optional(),
            })
          )
          .optional(),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CrmApplicationService.updateApplication(asAuthUser(ctx.user), input);
    }),

  /**
   * Safely archives an admission application.
   */
  archiveApplication: requireRoleProcedure(admissionRoles)
    .input(
      z.object({
        applicationId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CrmApplicationService.archiveApplication(asAuthUser(ctx.user), input.applicationId, input.reason);
    }),

  /**
   * Restores an archived admission application.
   */
  restoreApplication: requireRoleProcedure(admissionRoles)
    .input(z.object({ applicationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return CrmApplicationService.restoreApplication(asAuthUser(ctx.user), input.applicationId);
    }),

  /**
   * Permanently deletes an unconverted admission application.
   */
  deleteApplication: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(z.object({ applicationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return CrmApplicationService.deleteApplication(asAuthUser(ctx.user), input.applicationId);
    }),

  /**
   * Exports admission applications to CSV format.
   */
  exportApplications: requireRoleProcedure(admissionRoles)
    .input(
      z
        .object({
          stage: z.nativeEnum(ApplicationStage).optional(),
          courseId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return CrmApplicationService.exportApplications(asAuthUser(ctx.user), input);
    }),

  /**
   * Fetches live Instagram profile analytics for @softlabglobal9.
   * Uses Instagram Graph API when INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID
   * are configured in .env, otherwise returns structured setup-pending state with setup guide.
   * Accessible by Super Admin, Director, Admin, Manager.
   */
  getInstagramAnalytics: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ]).query(async () => {
    const { BUSINESS_ACCOUNT_ID, ACCESS_TOKEN, GRAPH_API, HANDLE, PROFILE_URL } = INSTAGRAM_CONFIG;

    const isConfigured = !!(BUSINESS_ACCOUNT_ID && ACCESS_TOKEN);

    if (!isConfigured) {
      // Return structured empty state with setup guide — shown in admin panel
      return {
        isConfigured: false,
        handle: HANDLE,
        profileUrl: PROFILE_URL,
        setupSteps: [
          "Step 1: Open Instagram App → Settings & Privacy → Account type and tools → Switch to Professional Account → Choose Education",
          "Step 2: Link @softlabglobal9 to SoftLab Global Facebook Page (same Meta account)",
          "Step 3: Go to developers.facebook.com → My Apps → Create App → Business → Add Instagram Graph API product",
          "Step 4: In App Dashboard → Instagram → Generate Access Token for your linked Instagram Business Account",
          "Step 5: Copy INSTAGRAM_BUSINESS_ACCOUNT_ID (17-digit numeric ID from Graph API) and INSTAGRAM_ACCESS_TOKEN",
          "Step 6: Add both values to your .env file and restart the server — Live analytics will activate automatically",
        ],
        recommendedBio: INSTAGRAM_CONFIG.RECOMMENDED_BIO,
        recommendedWebsite: INSTAGRAM_CONFIG.RECOMMENDED_WEBSITE,
        category: INSTAGRAM_CONFIG.CATEGORY,
        optimalPostingTimes: INSTAGRAM_CONFIG.OPTIMAL_POSTING_TIMES,
        contentPillars: INSTAGRAM_CONFIG.CONTENT_PILLARS,
        profile: null,
        posts: [],
        summary: null,
      };
    }

    try {
      // Fetch live profile data from Instagram Graph API
      const profileRes = await fetch(
        `${GRAPH_API.BASE}/${BUSINESS_ACCOUNT_ID}?fields=${GRAPH_API.PROFILE_FIELDS}&access_token=${ACCESS_TOKEN}`
      );
      const profile = profileRes.ok ? await profileRes.json() : null;

      // Fetch recent media (last 12 posts/reels)
      const mediaRes = await fetch(
        `${GRAPH_API.BASE}/${BUSINESS_ACCOUNT_ID}/media?fields=${GRAPH_API.MEDIA_FIELDS}&limit=12&access_token=${ACCESS_TOKEN}`
      );
      const mediaData = mediaRes.ok ? await mediaRes.json() : { data: [] };
      const posts: any[] = mediaData.data || [];

      // Fetch Instagram DM conversations count
      const convoRes = await fetch(
        `${GRAPH_API.BASE}/${BUSINESS_ACCOUNT_ID}/conversations?platform=instagram&access_token=${ACCESS_TOKEN}`
      );
      const convoData = convoRes.ok ? await convoRes.json() : { data: [] };
      const dmCount = (convoData.data || []).length;

      // Aggregate summary metrics from posts
      const totalLikes = posts.reduce((sum: number, p: any) => sum + (p.like_count || 0), 0);
      const totalComments = posts.reduce((sum: number, p: any) => sum + (p.comments_count || 0), 0);
      const totalViews = posts.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0);
      const totalReach = posts.reduce((sum: number, p: any) => sum + (p.reach || 0), 0);
      const totalImpressions = posts.reduce((sum: number, p: any) => sum + (p.impressions || 0), 0);
      const reelPosts = posts.filter((p: any) => p.media_type === "VIDEO" || p.media_type === "REEL");
      const carouselPosts = posts.filter((p: any) => p.media_type === "CAROUSEL_ALBUM");
      const imagePosts = posts.filter((p: any) => p.media_type === "IMAGE");

      return {
        isConfigured: true,
        handle: HANDLE,
        profileUrl: PROFILE_URL,
        setupSteps: [],
        recommendedBio: INSTAGRAM_CONFIG.RECOMMENDED_BIO,
        recommendedWebsite: INSTAGRAM_CONFIG.RECOMMENDED_WEBSITE,
        category: INSTAGRAM_CONFIG.CATEGORY,
        optimalPostingTimes: INSTAGRAM_CONFIG.OPTIMAL_POSTING_TIMES,
        contentPillars: INSTAGRAM_CONFIG.CONTENT_PILLARS,
        profile: profile
          ? {
              username: profile.username || HANDLE,
              followers: profile.followers_count || 0,
              following: profile.follows_count || 0,
              totalPosts: profile.media_count || 0,
              bio: profile.biography || "",
              website: profile.website || INSTAGRAM_CONFIG.RECOMMENDED_WEBSITE,
            }
          : null,
        posts: posts.map((p: any) => ({
          id: p.id,
          type: p.media_type,
          caption: p.caption?.substring(0, 120) || "",
          timestamp: p.timestamp,
          likes: p.like_count || 0,
          comments: p.comments_count || 0,
          views: p.views_count || 0,
          reach: p.reach || 0,
          impressions: p.impressions || 0,
          permalink: p.permalink || "",
          thumbnail: p.thumbnail_url || null,
        })),
        summary: {
          totalLikes,
          totalComments,
          totalViews,
          totalReach,
          totalImpressions,
          dmCount,
          reelCount: reelPosts.length,
          carouselCount: carouselPosts.length,
          imageCount: imagePosts.length,
          avgLikesPerPost: posts.length > 0 ? Math.round(totalLikes / posts.length) : 0,
          avgViewsPerReel: reelPosts.length > 0 ? Math.round(totalViews / reelPosts.length) : 0,
          engagementRate:
            profile?.followers_count && profile.followers_count > 0
              ? (((totalLikes + totalComments) / (posts.length * profile.followers_count)) * 100).toFixed(2)
              : "0.00",
        },
      };
    } catch (err) {
      return {
        isConfigured: true,
        handle: HANDLE,
        profileUrl: PROFILE_URL,
        setupSteps: [],
        recommendedBio: INSTAGRAM_CONFIG.RECOMMENDED_BIO,
        recommendedWebsite: INSTAGRAM_CONFIG.RECOMMENDED_WEBSITE,
        category: INSTAGRAM_CONFIG.CATEGORY,
        optimalPostingTimes: INSTAGRAM_CONFIG.OPTIMAL_POSTING_TIMES,
        contentPillars: INSTAGRAM_CONFIG.CONTENT_PILLARS,
        profile: null,
        posts: [],
        summary: null,
        error: "Instagram Graph API fetch failed. Check access token validity (60-day expiry) and account permissions.",
      };
    }
  }),

  /**
   * Manually creates a lead by Counselor, Telecaller, or Administrator.
   */
  createLead: requireRoleProcedure(crmRoles)
    .input(
      z.object({
        fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().min(10, "Mobile number must be at least 10 digits").max(15),
        city: z.string().optional(),
        qualification: z.string().optional(),
        source: z.nativeEnum(LeadSource).optional(),
        qualityScore: z.string().optional(),
        interestedCourseId: z.string().optional(),
        notes: z.string().optional(),
        assignedToId: z.string().optional(),
        assignedCounselorId: z.string().optional(),
        assignedTelecallerId: z.string().optional(),
        nextFollowUp: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CrmLeadService.createLead(asAuthUser(ctx.user), {
        ...input,
        email: input.email || undefined,
      });
    }),

  /**
   * Directly creates an admission application, auto-linking or creating a lead if not provided.
   */
  createDirectAdmission: requireRoleProcedure(admissionRoles)
    .input(
      z.object({
        courseId: z.string(),
        batchId: z.string().optional(),
        applicantName: z.string().min(2, "Applicant name required"),
        applicantEmail: z.string().email("Valid email required"),
        applicantPhone: z.string().min(10, "10-digit mobile required"),
        dateOfBirth: z.date().optional(),
        gender: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        highestQualification: z.string().optional(),
        fatherName: z.string().optional(),
        motherName: z.string().optional(),
        whatsappNumber: z.string().optional(),
        alternatePhone: z.string().optional(),
        schoolOrCollege: z.string().optional(),
        passingYear: z.string().optional(),
        percentageOrCgpa: z.string().optional(),
        photoUrl: z.string().optional(),
        paymentMethod: z.nativeEnum(PaymentMethod).optional(),
        leadId: z.string().optional(),
        source: z.nativeEnum(LeadSource).optional(),
        totalCourseFee: z.number().min(0).optional(),
        discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
        discountValue: z.number().min(0).optional(),
        discountAmount: z.number().min(0).optional(),
        discountReason: z.string().optional(),
        finalFee: z.number().min(0).optional(),
        paidAmount: z.number().min(0).optional(),
        paymentPlan: z.enum(["LUMPSUM", "EMI"]).optional(),
        installmentCount: z.number().min(1).max(12).optional(),
        installments: z
          .array(
            z.object({
              installmentNumber: z.number(),
              amount: z.number(),
              dueDate: z.union([z.date(), z.string()]),
              notes: z.string().optional(),
            })
          )
          .optional(),
        paymentType: z.enum(["OFFLINE", "ONLINE"]).optional(),
        paymentReference: z.string().optional(),
        remarks: z.string().optional(),
        providerType: z.string().optional(),
        providerName: z.string().optional(),
        universityName: z.string().optional(),
        universityProgram: z.string().optional(),
        universitySpecialization: z.string().optional(),
        admissionSession: z.string().optional(),
        universityRegistrationFee: z.number().optional(),
        universityExaminationFee: z.number().optional(),
        universityFee: z.number().optional(),
        deliveryMode: z.nativeEnum(DeliveryMode).optional(),
        center: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CrmApplicationService.createDirectAdmission(asAuthUser(ctx.user), input as any);
    }),

  /**
   * Fetches official printable receipt data for an admission by its application ID.
   */
  getAdmissionReceipt: requireRoleProcedure(admissionRoles)
    .input(z.object({ applicationId: z.string() }))
    .query(async ({ input }) => {
      const payment = await db.paymentTransaction.findFirst({
        where: {
          OR: [
            { admissionId: input.applicationId },
            { student: { convertedApplication: { id: input.applicationId } } },
            { feeStructure: { student: { convertedApplication: { id: input.applicationId } } } },
          ],
          status: "SUCCESS",
        },
        orderBy: { createdAt: "desc" },
      });
      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No recorded payment receipt found for this admission.",
        });
      }
      return ReceiptService.getReceiptData(payment.id);
    }),

  /**
   * Retrieves pipeline Kanban view of leads grouped by stage.
   */
  getPipelineOverview: requireRoleProcedure(crmRoles)
    .input(z.object({ courseId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return CrmLeadService.getPipelineOverview(asAuthUser(ctx.user), input?.courseId);
    }),

  /**
   * One-click stage progression for Kanban cards.
   */
  updateLeadStage: requireRoleProcedure(crmRoles)
    .input(
      z.object({
        leadId: z.string(),
        stage: z.nativeEnum(LeadStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CrmLeadService.updateLeadStage(asAuthUser(ctx.user), input.leadId, input.stage);
    }),

  /**
   * Retrieves marketing integration status and recent ingested leads.
   */
  getMarketingIntegrationStatus: requireRoleProcedure(crmRoles).query(async () => {
    const [totalLeads, channelStats, recentLeads] = await Promise.all([
      db.lead.count(),
      db.lead.groupBy({
        by: ["source"],
        _count: { id: true },
      }),
      db.lead.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { id: true, title: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    const channelCounts: Record<string, number> = {};
    for (const item of channelStats) {
      channelCounts[item.source] = item._count.id;
    }

    return {
      totalLeads,
      channelCounts,
      recentLeads,
      webhookUrls: {
        justdial: "/api/webhooks/justdial",
        meta: "/api/webhooks/meta",
        googleAds: "/api/webhooks/google-ads",
        whatsapp: "/api/webhooks/whatsapp",
        universal: "/api/webhooks/leads",
      },
    };
  }),

  /**
   * Test simulator to verify webhook ingestion directly from the UI.
   */
  testIngestLead: requireRoleProcedure(crmRoles)
    .input(
      z.object({
        platform: z.enum(["JUSTDIAL", "META", "GOOGLE_ADS", "WHATSAPP", "UNIVERSAL"]),
        fullName: z.string(),
        phone: z.string(),
        email: z.string().optional(),
        city: z.string().optional(),
        courseName: z.string().optional(),
        campaignName: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const sourceMap: Record<string, LeadSource> = {
        JUSTDIAL: LeadSource.JUSTDIAL,
        META: LeadSource.META_ADS_FB,
        GOOGLE_ADS: LeadSource.GOOGLE_ADS,
        WHATSAPP: LeadSource.WHATSAPP,
        UNIVERSAL: LeadSource.WEBSITE,
      };

      const source = sourceMap[input.platform] || LeadSource.WEBSITE;

      return CrmIngestionService.ingestLead({
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        city: input.city || "Prayagraj",
        source,
        interestedCourseName: input.courseName || "Full Stack Web Development",
        campaignName: input.campaignName || `Test Campaign ${input.platform}`,
        notes: input.notes || `Simulated live lead from ${input.platform} testing panel.`,
      });
    }),

  /**
   * Lists franchise leads with filtering, pagination, and relation includes.
   */
  listFranchiseLeads: requireRoleProcedure(franchiseRoles)
    .input(
      z.object({
        status: z.nativeEnum(LeadStatus).optional(),
        state: z.string().optional(),
        investmentCapacity: z.string().optional(),
        search: z.string().optional(),
        page: z.number().int().positive().optional().default(1),
        limit: z.number().int().positive().max(100).optional().default(25),
      })
    )
    .query(async ({ input, ctx }) => {
      return CrmLeadService.listFranchiseLeads(asAuthUser(ctx.user), input);
    }),

  /**
   * Aggregates franchise pipeline statistics and geographic distribution.
   */
  getFranchiseStats: requireRoleProcedure(franchiseRoles).query(async ({ ctx }) => {
    return CrmLeadService.getFranchiseStats(asAuthUser(ctx.user));
  }),

  /**
   * Updates pipeline stage of a franchise opportunity lead.
   */
  updateFranchiseStatus: requireRoleProcedure(franchiseRoles)
    .input(
      z.object({
        leadId: z.string(),
        status: z.nativeEnum(LeadStatus),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return CrmLeadService.updateFranchiseLeadStatus(asAuthUser(ctx.user), input);
    }),

  /**
   * Logs a follow-up and optional status update for a franchise lead.
   */
  addFranchiseFollowUp: requireRoleProcedure(franchiseRoles)
    .input(
      z.object({
        leadId: z.string(),
        type: z.nativeEnum(FollowUpType).default(FollowUpType.CALL),
        notes: z.string().min(2, "Notes are required").max(2000),
        nextFollowUpDate: z.date().optional().nullable(),
        newStatus: z.nativeEnum(LeadStatus).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return CrmLeadService.addFranchiseFollowUp(asAuthUser(ctx.user), input);
    }),

  /**
   * Assigns a franchise lead to a designated manager or counselor.
   */
  assignFranchiseLead: requireRoleProcedure(franchiseRoles)
    .input(
      z.object({
        leadId: z.string(),
        assignedToId: z.string().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return CrmLeadService.assignFranchiseLead(asAuthUser(ctx.user), input);
    }),

  /**
   * Manually creates a new franchise enquiry.
   */
  createFranchiseEnquiry: requireRoleProcedure(franchiseRoles)
    .input(
      z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(10),
        city: z.string().min(2),
        franchiseState: z.string().min(2),
        franchisePreferredLocation: z.string().optional(),
        franchiseProfile: z.string().optional(),
        franchiseInvestmentCapacity: z.string().optional(),
        franchiseExistingInstitute: z.boolean().optional(),
        franchiseExperience: z.string().optional(),
        franchiseLaunchTimeline: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return CrmLeadService.createFranchiseEnquiry(asAuthUser(ctx.user), input);
    }),

  /**
   * Updates an existing franchise enquiry.
   */
  updateFranchiseEnquiry: requireRoleProcedure(franchiseRoles)
    .input(
      z.object({
        id: z.string(),
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(10),
        city: z.string().min(2),
        franchiseState: z.string().min(2),
        franchisePreferredLocation: z.string().optional(),
        franchiseProfile: z.string().optional(),
        franchiseInvestmentCapacity: z.string().optional(),
        franchiseExistingInstitute: z.boolean().optional(),
        franchiseExperience: z.string().optional(),
        franchiseLaunchTimeline: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return CrmLeadService.updateFranchiseEnquiry(asAuthUser(ctx.user), input);
    }),

  /**
   * Deletes a franchise enquiry if not converted.
   */
  deleteFranchiseEnquiry: requireRoleProcedure(franchiseRoles)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return CrmLeadService.deleteFranchiseEnquiry(asAuthUser(ctx.user), input.id);
    }),

  /**
   * Converts a franchise lead to an official Franchise Partner Center and records a FranchiseSale.
   */
  convertFranchiseToSale: requireRoleProcedure(franchiseRoles)
    .input(
      z.object({
        leadId: z.string(),
        centerName: z.string().min(2),
        legalName: z.string().optional(),
        contactPerson: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(10),
        alternatePhone: z.string().optional(),
        address: z.string().min(3),
        city: z.string().min(2),
        state: z.string().min(2),
        pincode: z.string().min(4),
        packageType: z.nativeEnum(FranchisePackageType).optional(),
        packageName: z.string().min(2),
        totalAmountPaise: z.number().int().nonnegative(),
        discountAmountPaise: z.number().int().nonnegative().optional(),
        paidAmountPaise: z.number().int().nonnegative(),
        paymentMethod: z.nativeEnum(PaymentMethod),
        referenceNumber: z.string().optional(),
        agreementDate: z.coerce.date().optional(),
        validUntil: z.coerce.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return CrmLeadService.convertFranchiseToSale(asAuthUser(ctx.user), input);
    }),

  /**
   * Lists all converted Franchise Centers / Partners.
   */
  listFranchisePartners: requireRoleProcedure(franchiseRoles)
    .input(
      z.object({
        status: z.nativeEnum(FranchiseStatus).optional(),
        search: z.string().optional(),
        page: z.number().int().positive().optional().default(1),
        limit: z.number().int().positive().max(100).optional().default(25),
      })
    )
    .query(async ({ input, ctx }) => {
      return CrmLeadService.listFranchisePartners(asAuthUser(ctx.user), input);
    }),

  /**
   * Lists all franchise sales transactions / invoices.
   */
  listFranchiseSales: requireRoleProcedure(franchiseRoles)
    .input(
      z.object({
        paymentStatus: z.nativeEnum(FeePaymentStatus).optional(),
        search: z.string().optional(),
        page: z.number().int().positive().optional().default(1),
        limit: z.number().int().positive().max(100).optional().default(25),
      })
    )
    .query(async ({ input, ctx }) => {
      return CrmLeadService.listFranchiseSales(asAuthUser(ctx.user), input);
    }),

  /**
   * Returns aggregated franchise financial overview.
   */
  getFranchiseSalesOverview: requireRoleProcedure(franchiseRoles).query(async ({ ctx }) => {
    return CrmLeadService.getFranchiseSalesOverview(asAuthUser(ctx.user));
  }),

  /**
   * Updates an existing franchise sale record (payment status, amounts, notes, reference).
   */
  updateFranchiseSale: requireRoleProcedure(franchiseRoles)
    .input(
      z.object({
        saleId: z.string(),
        packageName: z.string().min(2).optional(),
        totalAmount: z.number().int().nonnegative().optional(),
        discountAmount: z.number().int().nonnegative().optional(),
        paidAmount: z.number().int().nonnegative().optional(),
        pendingAmount: z.number().int().nonnegative().optional(),
        paymentStatus: z.nativeEnum(FeePaymentStatus).optional(),
        paymentMethod: z.nativeEnum(PaymentMethod).optional(),
        referenceNumber: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return CrmLeadService.updateFranchiseSale(asAuthUser(ctx.user), input);
    }),
});

