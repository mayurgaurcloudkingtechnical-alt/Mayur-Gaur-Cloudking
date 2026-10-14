import { z } from "zod";
import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { UserRoleCode } from "@prisma/client";
import { DailyPlannerService } from "@/server/services/daily-planner.service";
import { DailyReportService } from "@/server/services/daily-report.service";
import { AuthenticatedUser } from "@/server/auth/rbac";

const directorAdminRoles = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.HR,
  UserRoleCode.MANAGER,
];

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

export const workPlannerRouter = router({
  // ==========================================
  // 1. INTELLIGENT DAILY WORK PLANNER (DIRECTOR)
  // ==========================================
  generateDailyPlan: requireRoleProcedure(directorAdminRoles)
    .input(
      z
        .object({
          runDate: z.date().optional(),
          forceRegenerate: z.boolean().optional(),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      return DailyPlannerService.generateProposedDailyPlan(asAuthUser(ctx.user), input);
    }),

  approveAndDistributePlan: requireRoleProcedure(directorAdminRoles)
    .input(
      z.object({
        runId: z.string(),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return DailyPlannerService.approveAndDistributePlan(
        asAuthUser(ctx.user),
        input.runId,
        input.reviewNotes
      );
    }),

  createCustomTask: requireRoleProcedure(directorAdminRoles)
    .input(
      z.object({
        title: z.string().min(3),
        description: z.string().min(5),
        department: z.string(),
        assignedStaffId: z.string(),
        priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
        dueDate: z.date(),
        targetQuantity: z.number().int().optional(),
        expectedOutcome: z.string().optional(),
        sourceType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return DailyPlannerService.createCustomTask(asAuthUser(ctx.user), input);
    }),

  updateTaskStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.enum([
          "ASSIGNED",
          "IN_PROGRESS",
          "SUBMITTED_FOR_REVIEW",
          "COMPLETED",
          "BLOCKED",
          "CANCELLED",
        ]),
        notes: z.string().optional(),
        completedQuantity: z.number().int().optional(),
        evidenceUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return DailyPlannerService.updateTaskStatus(
        asAuthUser(ctx.user),
        input.taskId,
        input.status,
        input.notes,
        input.completedQuantity,
        input.evidenceUrl
      );
    }),

  listTasks: protectedProcedure
    .input(
      z
        .object({
          staffId: z.string().optional(),
          department: z.string().optional(),
          date: z.date().optional(),
          status: z.string().optional(),
          runId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return DailyPlannerService.listTasks(input);
    }),

  // ==========================================
  // 2. DAILY WORK REPORTS & VERIFIED CRM ACTIVITY
  // ==========================================
  getPrefilledReportData: protectedProcedure
    .input(
      z.object({
        staffId: z.string(),
        date: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return DailyReportService.getPrefilledReportData(
        asAuthUser(ctx.user),
        input.staffId,
        input.date
      );
    }),

  submitDailyReport: protectedProcedure
    .input(
      z.object({
        staffId: z.string(),
        reportDate: z.date(),
        actualWorkSummary: z.string().min(5),
        resultsSummary: z.string().optional(),
        nextDayPriorities: z.string().optional(),
        remarks: z.string().optional(),
        items: z.array(
          z.object({
            taskId: z.string().optional(),
            taskTitle: z.string(),
            status: z.enum(["COMPLETED", "IN_PROGRESS", "BLOCKED"]),
            blockedReason: z.string().optional(),
            measurableResult: z.string().optional(),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return DailyReportService.submitDailyReport(asAuthUser(ctx.user), input);
    }),

  reviewDailyReport: requireRoleProcedure(directorAdminRoles)
    .input(
      z.object({
        reportId: z.string(),
        status: z.enum(["APPROVED", "RETURNED_FOR_CORRECTION", "REJECTED"]),
        reviewerComments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return DailyReportService.reviewDailyReport(
        asAuthUser(ctx.user),
        input.reportId,
        input.status,
        input.reviewerComments
      );
    }),

  listDailyReports: protectedProcedure
    .input(
      z
        .object({
          staffId: z.string().optional(),
          department: z.string().optional(),
          date: z.date().optional(),
          status: z.string().optional(),
          reportingManagerId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return DailyReportService.listReports(asAuthUser(ctx.user), input);
    }),

  getCompanyWideSummary: requireRoleProcedure(directorAdminRoles)
    .input(z.object({ date: z.date().optional() }).optional())
    .query(async ({ input }) => {
      return DailyReportService.getCompanyWideDailySummary(input?.date);
    }),
});
