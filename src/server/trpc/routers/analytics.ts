import { z } from "zod";
import { router, requireRoleProcedure } from "../init";
import { UserRoleCode, ReportExportType } from "@prisma/client";
import { AnalyticsService } from "@/server/services/analytics.service";
import { ReportGeneratorService } from "@/server/services/report-generator.service";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";

const executiveRoles = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
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

export const analyticsRouter = router({
  /**
   * Retrieves high-level institutional health metrics across all departments
   */
  getExecutiveOverview: requireRoleProcedure(executiveRoles).query(async () => {
    return AnalyticsService.getExecutiveOverview();
  }),

  /**
   * Retrieves month-by-month cashflow comparisons (tuition inflow vs payroll outflow)
   */
  getRevenueTrend: requireRoleProcedure(executiveRoles)
    .input(z.object({ monthsCount: z.number().int().min(1).max(24).default(6) }).optional())
    .query(async ({ input }) => {
      return AnalyticsService.getMonthlyRevenueVsPayroll(input?.monthsCount ?? 6);
    }),

  /**
   * Retrieves detailed admissions pipeline stages and lead conversion analytics
   */
  getAdmissionsFunnel: requireRoleProcedure(executiveRoles).query(async () => {
    return AnalyticsService.getAdmissionsMetrics();
  }),

  /**
   * Generates sanitized CSV report payloads and logs audit export records
   */
  exportAuditReport: requireRoleProcedure(executiveRoles)
    .input(z.object({ reportType: z.nativeEnum(ReportExportType) }))
    .mutation(async ({ ctx, input }) => {
      const actor = asAuthUser(ctx.user);

      switch (input.reportType) {
        case ReportExportType.FEE_DEFAULTERS:
          return ReportGeneratorService.generateFeeDefaultersReport(actor);
        case ReportExportType.FINANCIAL_LEDGER:
          return ReportGeneratorService.generateFinancialCashflowReport(actor);
        case ReportExportType.PLACEMENT_RECORD:
          return ReportGeneratorService.generatePlacementSummaryReport(actor);
        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Report generator for ${input.reportType} is not implemented.`,
          });
      }
    }),

  /**
   * Lists historical audit report exports
   */
  listExportHistory: requireRoleProcedure(executiveRoles)
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => {
      return ReportGeneratorService.listRecentExportReports(input?.limit ?? 20);
    }),
});
