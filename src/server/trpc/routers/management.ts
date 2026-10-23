import { z } from "zod";
import { router, requireRoleProcedure, protectedProcedure } from "@/server/trpc/init";
import { ManagementOperationsService } from "@/server/services/management/management-operations.service";
import { UserRoleCode, ClassSessionStatus, AlertSeverity, AlertStatus } from "@prisma/client";

const SENIOR_MANAGEMENT_ROLES = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
  UserRoleCode.PLACEMENT_OFFICER,
  UserRoleCode.HR,
];

const EXECUTIVE_CONTROL_ROLES = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
];

export const managementRouter = router({
  /**
   * 1. High-level real-time operations overview
   */
  getLiveOperationsOverview: requireRoleProcedure(SENIOR_MANAGEMENT_ROLES).query(async () => {
    return ManagementOperationsService.getLiveOperationsOverview();
  }),

  /**
   * 2. Live classroom oversight with batch filters
   */
  getLiveClassroomOversight: requireRoleProcedure(SENIOR_MANAGEMENT_ROLES)
    .input(
      z.object({
        status: z.nativeEnum(ClassSessionStatus).optional(),
        batchId: z.string().optional(),
        trainerId: z.string().optional(),
        search: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      return ManagementOperationsService.getLiveClassroomOversight(input);
    }),

  /**
   * 3. Drill-down live class participant roster
   */
  getClassParticipantsRoster: requireRoleProcedure(SENIOR_MANAGEMENT_ROLES)
    .input(z.object({ classId: z.string() }))
    .query(async ({ input }) => {
      return ManagementOperationsService.getClassParticipantsRoster(input.classId);
    }),

  /**
   * 4. Interviews & Placement Oversight
   */
  getInterviewsOversight: requireRoleProcedure(SENIOR_MANAGEMENT_ROLES)
    .input(
      z.object({
        category: z.enum(["MOCK", "RECRUITER"]).optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      return ManagementOperationsService.getInterviewsOversight(input);
    }),

  /**
   * 5. Communications Oversight (WhatsApp, Notifications, Calls)
   */
  getCommunicationsOversight: requireRoleProcedure(SENIOR_MANAGEMENT_ROLES)
    .input(
      z.object({
        channel: z.enum(["WHATSAPP", "NOTIFICATION", "CALL"]).optional(),
        search: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      return ManagementOperationsService.getCommunicationsOversight(input);
    }),

  /**
   * 6. YouTube Publishing Oversight
   */
  getYouTubePublishingOversight: requireRoleProcedure(SENIOR_MANAGEMENT_ROLES)
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      return ManagementOperationsService.getYouTubePublishingOversight(input);
    }),

  /**
   * 7. Activity Timeline & Audit Feed
   */
  getActivityTimeline: requireRoleProcedure(SENIOR_MANAGEMENT_ROLES)
    .input(
      z.object({
        resourceType: z.string().optional(),
        actorId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      return ManagementOperationsService.getActivityTimeline(input);
    }),

  /**
   * 8. Operational Alerts & Incidents
   */
  getAlerts: requireRoleProcedure(SENIOR_MANAGEMENT_ROLES)
    .input(
      z.object({
        status: z.nativeEnum(AlertStatus).optional(),
        severity: z.nativeEnum(AlertSeverity).optional(),
        sourceModule: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      return ManagementOperationsService.getAlerts(input);
    }),

  /**
   * 9. Trigger automated scan for operational discrepancies
   */
  triggerAlertsScan: requireRoleProcedure(EXECUTIVE_CONTROL_ROLES).mutation(async () => {
    return ManagementOperationsService.scanAndGenerateAlerts();
  }),

  /**
   * 10. Acknowledge alert
   */
  acknowledgeAlert: requireRoleProcedure(EXECUTIVE_CONTROL_ROLES)
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ManagementOperationsService.acknowledgeAlert(input.alertId, ctx.user.id);
    }),

  /**
   * 11. Resolve alert with notes
   */
  resolveAlert: requireRoleProcedure(EXECUTIVE_CONTROL_ROLES)
    .input(
      z.object({
        alertId: z.string(),
        resolutionNotes: z.string().min(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ManagementOperationsService.resolveAlert({
        alertId: input.alertId,
        userId: ctx.user.id,
        resolutionNotes: input.resolutionNotes,
      });
    }),

  /**
   * 12. Edit operational record with full pre/post audit trail
   */
  editOperationalRecord: requireRoleProcedure(EXECUTIVE_CONTROL_ROLES)
    .input(
      z.object({
        recordType: z.enum([
          "SCHEDULED_CLASS",
          "LIVE_ATTENDANCE",
          "MOCK_INTERVIEW",
          "RECRUITER_INTERVIEW",
          "YOUTUBE_QUEUE",
        ]),
        recordId: z.string(),
        changeReason: z.string().min(5),
        updates: z.record(z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ManagementOperationsService.editOperationalRecord({
        recordType: input.recordType,
        recordId: input.recordId,
        changeReason: input.changeReason,
        actorId: ctx.user.id,
        actorRole: ctx.user.roleCode,
        updates: input.updates,
      });
    }),

  /**
   * 13. Generate downloadable operational export report
   */
  generateOperationalReport: requireRoleProcedure(SENIOR_MANAGEMENT_ROLES)
    .input(
      z.object({
        reportType: z.enum([
          "DAILY_OPERATIONS",
          "ATTENDANCE_SUMMARY",
          "INTERVIEW_OUTCOMES",
          "AUDIT_TRAIL",
        ]),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return ManagementOperationsService.generateOperationalReport(input);
    }),
});
