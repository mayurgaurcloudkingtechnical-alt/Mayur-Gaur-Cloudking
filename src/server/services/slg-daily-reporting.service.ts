import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { SlgDailyReportingMetricsService } from "./slg-daily-reporting-metrics.service";

export interface SubmitSlgDailyReportInput {
  tenantId: string;
  userId: string;
  reportDate: Date;
  workSummary: string;
  achievements?: string;
  impediments?: string;
  tomorrowActionPlan?: string;
  items: { taskTitle: string; status: "COMPLETED" | "IN_PROGRESS" | "BLOCKED"; measurableResult?: string; timeSpentMinutes?: number; notes?: string }[];
}

export interface ReviewSlgDailyReportInput {
  tenantId: string;
  reviewerId: string;
  reportId: string;
  decision: "APPROVED" | "REVISION_REQUESTED" | "REJECTED";
  feedback?: string;
}

export class SlgDailyReportingService {
  /**
   * Automatically calculates tamper-proof verified metrics from database records.
   * Employees cannot artificially inflate or alter these system counts.
   */
  static async getVerifiedMetrics(tenantId: string, userId: string, reportDate: Date) {
    return SlgDailyReportingMetricsService.getVerifiedMetrics(tenantId, userId, reportDate);
  }

  static formatSeconds(secs: number): string {
    return SlgDailyReportingMetricsService.formatSeconds(secs);
  }

  /**
   * Employee Submits Daily Report with Verified Metrics Automatically Bundled
   */
  static async submitDailyReport(input: SubmitSlgDailyReportInput) {
    const reportDateOnly = new Date(input.reportDate);
    reportDateOnly.setHours(0, 0, 0, 0);

    // Compute verified metrics
    const verified = await this.getVerifiedMetrics(input.tenantId, input.userId, reportDateOnly);

    // Check for existing report
    const existing = await db.slgDailyReport.findUnique({
      where: {
        tenantId_userId_reportDate: {
          tenantId: input.tenantId,
          userId: input.userId,
          reportDate: reportDateOnly,
        },
      },
    });

    let report;

    if (existing) {
      if (existing.status === "APPROVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This daily report has already been approved and signed off by management.",
        });
      }

      // Update existing report with recalculated verified counts
      report = await db.slgDailyReport.update({
        where: { id: existing.id },
        data: {
          workSummary: input.workSummary,
          achievements: input.achievements,
          impediments: input.impediments,
          tomorrowActionPlan: input.tomorrowActionPlan,
          status: "SUBMITTED",
          systemCallsTotal: verified.systemCallsTotal,
          systemCallsConnected: verified.systemCallsConnected,
          systemCallsMissed: verified.systemCallsMissed,
          systemTalkTimeSeconds: verified.systemTalkTimeSeconds,
          systemAttendanceMinutes: verified.systemAttendanceMinutes,
          systemFollowUpsCompleted: verified.systemFollowUpsCompleted,
          systemMessagesSent: verified.systemMessagesSent,
        },
      });

      // Clear old items and recreate
      await db.slgDailyReportItem.deleteMany({
        where: { reportId: report.id },
      });
    } else {
      // Create new report
      report = await db.slgDailyReport.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          reportDate: reportDateOnly,
          workSummary: input.workSummary,
          achievements: input.achievements,
          impediments: input.impediments,
          tomorrowActionPlan: input.tomorrowActionPlan,
          status: "SUBMITTED",
          systemCallsTotal: verified.systemCallsTotal,
          systemCallsConnected: verified.systemCallsConnected,
          systemCallsMissed: verified.systemCallsMissed,
          systemTalkTimeSeconds: verified.systemTalkTimeSeconds,
          systemAttendanceMinutes: verified.systemAttendanceMinutes,
          systemFollowUpsCompleted: verified.systemFollowUpsCompleted,
          systemMessagesSent: verified.systemMessagesSent,
        },
      });
    }

    // Insert breakdown line items
    if (input.items && input.items.length > 0) {
      await db.slgDailyReportItem.createMany({
        data: input.items.map((item, idx) => ({
          reportId: report.id,
          taskTitle: item.taskTitle,
          status: item.status,
          measurableResult: item.measurableResult,
          timeSpentMinutes: item.timeSpentMinutes || 0,
          notes: item.notes,
          sortOrder: idx,
        })),
      });
    }

    await Promise.all([
      db.slgDailyReportRevision.create({
        data: {
          reportId: report.id,
          actorId: input.userId,
          action: existing ? "UPDATED" : "SUBMITTED",
          comments: `Report submitted with ${verified.systemCallsTotal} total calls and ${verified.systemAttendanceMinutes} logged attendance minutes.`,
        },
      }),
      db.slgAuditLog.create({
        data: {
          tenantId: input.tenantId,
          actorUserId: input.userId,
          action: existing ? "REPORT_UPDATED" : "REPORT_SUBMITTED",
          entityType: "SlgDailyReport",
          entityId: report.id,
          details: {
            reportDate: reportDateOnly,
            systemCallsTotal: verified.systemCallsTotal,
            systemTalkTimeSeconds: verified.systemTalkTimeSeconds,
            systemAttendanceMinutes: verified.systemAttendanceMinutes,
          },
        },
      }),
    ]);

    return db.slgDailyReport.findUnique({
      where: { id: report.id },
      include: {
        items: true,
        revisions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * Management Review Workflow: Approve, Reject, or Request Revision
   */
  static async reviewDailyReport(input: ReviewSlgDailyReportInput) {
    const report = await db.slgDailyReport.findUnique({
      where: { id: input.reportId },
      include: {
        user: {
          select: {
            tenantDepartmentId: true,
            tenantBranchId: true,
            reportingManagerId: true,
          },
        },
      },
    });

    if (!report) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Daily report not found.",
      });
    }

    if (report.tenantId !== input.tenantId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot review reports outside your active tenant.",
      });
    }

    if (report.userId === input.reviewerId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Employees cannot review or approve their own daily reports.",
      });
    }

    const reviewer = await db.user.findUnique({
      where: { id: input.reviewerId },
      select: {
        id: true,
        roleCode: true,
        tenantDepartmentId: true,
        tenantBranchId: true,
      },
    });

    if (!reviewer) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Reviewer profile not found.",
      });
    }

    // SuperAdmin and Director have tenant-wide supervisory authority
    const isTenantWideExecutive =
      reviewer.roleCode === "SUPER_ADMIN" || reviewer.roleCode === "DIRECTOR";

    if (!isTenantWideExecutive) {
      // Enforce department boundary
      if (
        reviewer.tenantDepartmentId &&
        report.user.tenantDepartmentId &&
        reviewer.tenantDepartmentId !== report.user.tenantDepartmentId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Managers can only review daily reports within their assigned department.",
        });
      }

      // Enforce branch boundary
      if (
        reviewer.tenantBranchId &&
        report.user.tenantBranchId &&
        reviewer.tenantBranchId !== report.user.tenantBranchId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Managers can only review daily reports within their assigned branch.",
        });
      }
    }

    const updated = await db.slgDailyReport.update({
      where: { id: report.id },
      data: {
        status: input.decision,
        reviewerId: input.reviewerId,
        reviewerFeedback: input.feedback,
        reviewedAt: new Date(),
      },
    });

    await Promise.all([
      db.slgDailyReportRevision.create({
        data: {
          reportId: report.id,
          actorId: input.reviewerId,
          action: input.decision,
          comments: input.feedback,
        },
      }),
      db.slgAuditLog.create({
        data: {
          tenantId: input.tenantId,
          actorUserId: input.reviewerId,
          action: `REPORT_${input.decision}`,
          entityType: "SlgDailyReport",
          entityId: report.id,
          details: {
            reportUserId: report.userId,
            reportDate: report.reportDate,
            feedback: input.feedback,
          },
        },
      }),
    ]);

    return updated;
  }

  /**
   * Retrieve list of reports for management dashboard
   */
  static async listDailyReports(tenantId: string, filters?: { date?: Date; departmentId?: string; status?: string; search?: string }) {
    const where: any = { tenantId };

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters?.date) {
      const d = new Date(filters.date);
      d.setHours(0, 0, 0, 0);
      where.reportDate = d;
    }

    return db.slgDailyReport.findMany({
      where,
      orderBy: { reportDate: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            roleCode: true,
            callingNumber: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: true,
        revisions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
  }

  /**
   * Generates CSV / Tabular Export for Executive Review
   */
  static async generateCsvExport(tenantId: string, date: Date): Promise<string> {
    const reports = await this.listDailyReports(tenantId, { date });
    return SlgDailyReportingMetricsService.formatCsv(reports);
  }
}
