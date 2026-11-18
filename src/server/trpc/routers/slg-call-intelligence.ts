import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { z } from "zod";
import { UserRoleCode, SlgCallType, SlgCallStatus, SlgCallSource, TenantPlanTier, FollowUpType } from "@prisma/client";
import { SlgCallIntelligenceService } from "@/server/services/slg-call-intelligence.service";
import { SlgDailyReportingService } from "@/server/services/slg-daily-reporting.service";
import { SlgMultiTenantService } from "@/server/services/slg-multi-tenant.service";
import { SlgDeviceManagementService } from "@/server/services/slg-device-management.service";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db/client";

/**
 * Strict Supervisory Roles permitted to view global analytics, review reports, and manage devices.
 */
const supervisoryRoles: UserRoleCode[] = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
  UserRoleCode.HR,
];

/**
 * Authorized Sales & Calling Roles permitted to use SLG Call Intelligence (scoped to own records when non-supervisory).
 */
const salesCallRoles: UserRoleCode[] = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
  UserRoleCode.HR,
  UserRoleCode.COUNSELOR,
  UserRoleCode.TELECALLER,
  UserRoleCode.MARKETING,
  UserRoleCode.PLACEMENT_OFFICER,
];

/**
 * Resolves a verified, database-backed tenantId for the authenticated user.
 */
async function resolveTenantContextAsync(ctx: { user: any }) {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required to access SLG Call Intelligence." });
  }
  const tenantId = await SlgMultiTenantService.resolveValidTenantId(ctx.user.tenantId);
  return {
    tenantId,
    userId: ctx.user.id as string,
    roleCode: ctx.user.roleCode as UserRoleCode,
    branchId: ctx.user.tenantBranchId as string | null | undefined,
    departmentId: ctx.user.tenantDepartmentId as string | null | undefined,
  };
}

export const slgCallIntelligenceRouter = router({
  /**
   * Resolve authenticated tenant overview
   */
  resolveTenantContext: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = await resolveTenantContextAsync(ctx);
    return SlgMultiTenantService.getTenantOverview(tenantId);
  }),

  /**
   * Call Intelligence Analytics Dashboard (Scoped by RBAC Hierarchy)
   */
  getCallAnalytics: requireRoleProcedure(salesCallRoles)
    .input(
      z.object({
        branchId: z.string().optional(),
        departmentId: z.string().optional(),
        userId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        search: z.string().optional(),
        provider: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, userId, roleCode, branchId, departmentId } = await resolveTenantContextAsync(ctx);
      const isExecutive = roleCode === UserRoleCode.SUPER_ADMIN || roleCode === UserRoleCode.DIRECTOR || roleCode === UserRoleCode.ADMIN;
      const isSupervisory = supervisoryRoles.includes(roleCode);
      const effectiveBranchId = !isExecutive && branchId ? branchId : input?.branchId;
      const effectiveDepartmentId = !isExecutive && departmentId ? departmentId : input?.departmentId;
      const effectiveUserId = !isSupervisory ? userId : input?.userId;

      return SlgCallIntelligenceService.getCallAnalytics({
        tenantId,
        branchId: effectiveBranchId,
        departmentId: effectiveDepartmentId,
        userId: effectiveUserId,
        startDate: input?.startDate,
        endDate: input?.endDate,
        search: input?.search,
        provider: input?.provider,
      });
    }),

  /**
   * Live fleet presence monitor
   */
  getLiveFleetPresence: requireRoleProcedure(salesCallRoles).query(async ({ ctx }) => {
    const { tenantId } = await resolveTenantContextAsync(ctx);
    return SlgCallIntelligenceService.getLiveFleetPresence(tenantId);
  }),

  /**
   * Telephony Provider Adapter & Fleet Health Status
   */
  getProviderFleetHealth: requireRoleProcedure(salesCallRoles).query(() => {
    return SlgCallIntelligenceService.getProviderFleetHealth();
  }),

  /**
   * Submit call disposition, outcome, and automated CRM follow-up
   */
  submitCallDisposition: protectedProcedure
    .input(
      z.object({
        callLogId: z.string(),
        disposition: z.string(),
        notes: z.string().optional(),
        followUpAt: z.date().optional(),
        followUpNotes: z.string().optional(),
        followUpAssignedToId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = await resolveTenantContextAsync(ctx);
      return SlgCallIntelligenceService.submitDisposition({
        tenantId,
        actorUserId: userId,
        callLogId: input.callLogId,
        disposition: input.disposition,
        notes: input.notes,
        nextFollowUpAt: input.followUpAt,
        followUpNotes: input.followUpNotes,
        followUpAssignedToId: input.followUpAssignedToId,
      });
    }),

  /**
   * Secure signed recording playback URL with audit logging
   */
  getRecordingPlaybackUrl: requireRoleProcedure(salesCallRoles)
    .input(z.object({ recordingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = await resolveTenantContextAsync(ctx);
      const clientIp = (ctx as any).req?.headers?.["x-forwarded-for"] || "127.0.0.1";
      const userAgent = (ctx as any).req?.headers?.["user-agent"] || "Browser";

      return SlgCallIntelligenceService.getSecurePlaybackUrl(
        tenantId,
        userId,
        input.recordingId,
        clientIp,
        userAgent
      );
    }),

  /**
   * Log an outbound or inbound call directly from web console or dialer
   */
  logManualCall: protectedProcedure
    .input(z.object({
      contactName: z.string(),
      customerPhone: z.string(),
      callType: z.enum(["INCOMING", "OUTGOING"]).default("OUTGOING"),
      callStatus: z.enum(["CONNECTED", "MISSED", "REJECTED", "UNANSWERED", "BUSY", "FAILED"]).default("CONNECTED"),
      durationSeconds: z.number().default(0),
      talkTimeSeconds: z.number().default(0),
      disposition: z.string().default("INTERESTED"),
      notes: z.string().optional(),
      nextFollowUpAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { DispositionEngineService } = await import("@/server/services/disposition-engine.service");
      const effectiveDuration = Math.max(0, input.durationSeconds || input.talkTimeSeconds || 0);
      const mappedStatus: "CONNECTED" | "NO_ANSWER" | "BUSY" | "FAILED" =
        input.callStatus === "BUSY"
          ? "BUSY"
          : input.callStatus === "MISSED" || input.callStatus === "UNANSWERED" || input.callStatus === "REJECTED"
          ? "NO_ANSWER"
          : input.callStatus === "FAILED"
          ? "FAILED"
          : "CONNECTED";

      const result = await DispositionEngineService.recordInteraction(
        {
          id: ctx.user.id,
          email: ctx.user.email || "",
          roleCode: ctx.user.roleCode,
          permissions: ctx.user.permissions || [],
          firstName: ctx.user.firstName || "",
          lastName: ctx.user.lastName || "",
        },
        {
          contactName: input.contactName,
          contactPhone: input.customerPhone,
          interactionType: FollowUpType.CALL,
          disposition: input.disposition,
          notes: input.notes || "Manual business call entry",
          nextFollowUpDate: input.nextFollowUpAt || null,
          durationSeconds: effectiveDuration,
          callDirection: input.callType,
          callStatus: mappedStatus,
          source: "SLG_CALL_INTELLIGENCE",
        }
      );

      return result.slgCallLog;
    }),

  /**
   * Batch synchronization endpoint for Android Mobile App
   */
  syncDeviceCalls: protectedProcedure
    .input(z.object({
      deviceUuid: z.string(),
      calls: z.array(z.object({
        contactName: z.string(),
        customerPhone: z.string(),
        callType: z.enum(["INCOMING", "OUTGOING"]),
        callStatus: z.enum(["CONNECTED", "MISSED", "REJECTED", "UNANSWERED", "BUSY", "FAILED"]),
        startedAt: z.date(),
        endedAt: z.date().optional(),
        durationSeconds: z.number(),
        talkTimeSeconds: z.number(),
        disposition: z.string().optional(),
        notes: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = await resolveTenantContextAsync(ctx);
      return SlgCallIntelligenceService.syncDeviceCallEvents({
        tenantId,
        userId,
        deviceUuid: input.deviceUuid,
        calls: input.calls as any,
      });
    }),

  listTenantDevices: requireRoleProcedure(salesCallRoles).query(async ({ ctx }) =>
    SlgDeviceManagementService.listTenantDevices((await resolveTenantContextAsync(ctx)).tenantId)
  ),
  approveDevice: requireRoleProcedure(supervisoryRoles)
    .input(z.object({ deviceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = await resolveTenantContextAsync(ctx);
      return SlgDeviceManagementService.approveDevice(tenantId, userId, input.deviceId);
    }),
  revokeDevice: requireRoleProcedure(supervisoryRoles)
    .input(z.object({ deviceId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = await resolveTenantContextAsync(ctx);
      return SlgDeviceManagementService.revokeDevice(tenantId, userId, input.deviceId, input.reason);
    }),

  getPrefilledDailyReport: protectedProcedure
    .input(z.object({ date: z.date().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { tenantId, userId } = await resolveTenantContextAsync(ctx);
      return SlgDailyReportingService.getVerifiedMetrics(tenantId, userId, input?.date || new Date());
    }),

  /**
   * Submit Daily Work Report
   */
  submitDailyReport: protectedProcedure
    .input(z.object({
      reportDate: z.date().default(() => new Date()),
      workSummary: z.string().min(10, "Work summary must be at least 10 characters"),
      achievements: z.string().optional(),
      impediments: z.string().optional(),
      tomorrowActionPlan: z.string().optional(),
      items: z.array(z.object({
        taskTitle: z.string().min(1),
        status: z.enum(["COMPLETED", "IN_PROGRESS", "BLOCKED"]),
        measurableResult: z.string().optional(),
        timeSpentMinutes: z.number().default(0),
        notes: z.string().optional(),
      })).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = await resolveTenantContextAsync(ctx);
      return SlgDailyReportingService.submitDailyReport({
        tenantId,
        userId,
        reportDate: input.reportDate,
        workSummary: input.workSummary,
        achievements: input.achievements,
        impediments: input.impediments,
        tomorrowActionPlan: input.tomorrowActionPlan,
        items: input.items,
      });
    }),

  reviewDailyReport: requireRoleProcedure(supervisoryRoles)
    .input(z.object({
      reportId: z.string(),
      decision: z.enum(["APPROVED", "REVISION_REQUESTED", "REJECTED"]),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = await resolveTenantContextAsync(ctx);
      return SlgDailyReportingService.reviewDailyReport({
        tenantId,
        reviewerId: userId,
        reportId: input.reportId,
        decision: input.decision,
        feedback: input.feedback,
      });
    }),

  listDailyReports: requireRoleProcedure(salesCallRoles)
    .input(z.object({
      date: z.date().optional(),
      status: z.string().optional(),
      departmentId: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { tenantId, roleCode, departmentId } = await resolveTenantContextAsync(ctx);
      const isExecutive = roleCode === UserRoleCode.SUPER_ADMIN || roleCode === UserRoleCode.DIRECTOR || roleCode === UserRoleCode.ADMIN;
      const effectiveDepartmentId = !isExecutive && departmentId ? departmentId : input?.departmentId;

      return SlgDailyReportingService.listDailyReports(tenantId, {
        date: input?.date,
        status: input?.status,
        departmentId: effectiveDepartmentId,
      });
    }),

  exportDailyReportsCsv: requireRoleProcedure(supervisoryRoles)
    .input(z.object({ date: z.date() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = await resolveTenantContextAsync(ctx);
      const csv = await SlgDailyReportingService.generateCsvExport(tenantId, input.date);
      return { csv, filename: `Daily_Reports_${input.date.toISOString().slice(0, 10)}.csv` };
    }),

  provisionNewTenant: requireRoleProcedure([UserRoleCode.SUPER_ADMIN])
    .input(z.object({
      slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
      name: z.string().min(2),
      legalName: z.string().optional(),
      gstin: z.string().optional(),
      planTier: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]).default("PROFESSIONAL"),
      adminEmail: z.string().email(),
      adminFirstName: z.string().min(1),
      adminLastName: z.string().min(1),
      adminPhone: z.string().optional(),
      adminPassword: z.string().min(8),
      customDomain: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(input.adminPassword, 10);
      return SlgMultiTenantService.provisionCommercialTenant({
        ...input,
        planTier: input.planTier as TenantPlanTier,
        adminPasswordHash: passwordHash,
      });
    }),
});
