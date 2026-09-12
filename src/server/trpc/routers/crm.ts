import { router, publicProcedure, requireRoleProcedure } from "../init";
import { z } from "zod";
import { UserRoleCode, LeadStatus, FollowUpType, ApplicationStage } from "@prisma/client";
import { CrmLeadService } from "@/server/services/crm-lead.service";
import { CrmApplicationService } from "@/server/services/crm-application.service";
import { db } from "@/server/db/client";
import { AuthenticatedUser, hasPermission } from "@/server/auth/rbac";

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
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
  UserRoleCode.COUNSELOR,
  UserRoleCode.TELECALLER,
];

const admissionRoles = [
  UserRoleCode.SUPER_ADMIN,
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
   * Public list of active courses for inquiry dropdown.
   */
  listPublicCourses: publicProcedure.query(async () => {
    return db.course.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    });
  }),

  /**
   * Pipeline dashboard metrics and follow-up counter.
   */
  getStats: requireRoleProcedure(crmRoles).query(async ({ ctx }) => {
    const hasReadAll = hasPermission(ctx.user.permissions, "leads:read_all");
    const whereLead = hasReadAll ? {} : { assignedToId: ctx.user.id };

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
   * Lists available counselors and staff for lead assignment.
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
      },
      orderBy: { firstName: "asc" },
    });
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
});
