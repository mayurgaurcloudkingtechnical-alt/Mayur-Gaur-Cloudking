import { db } from "@/server/db/client";
import { UserRoleCode } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";

export interface SubmitReportInput {
  staffId: string;
  reportDate: Date;
  actualWorkSummary: string;
  resultsSummary?: string;
  nextDayPriorities?: string;
  remarks?: string;
  items: {
    taskId?: string;
    taskTitle: string;
    status: "COMPLETED" | "IN_PROGRESS" | "BLOCKED";
    blockedReason?: string;
    measurableResult?: string;
    notes?: string;
  }[];
}

export class DailyReportService {
  /**
   * Prefills verified metrics directly from actual CRM database activity.
   * Employees do not have to fabricate or manually re-enter numbers already logged in CRM.
   */
  static async getPrefilledReportData(actor: AuthenticatedUser, staffId: string, date: Date = new Date()) {
    const staff = await db.staffProfile.findUnique({
      where: { id: staffId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        reportingManager: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    });

    if (!staff) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Staff profile not found." });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [followUpsCount, leadsActivityCount, admissionsCount, assignedTasks, existingReport] =
      await Promise.all([
        db.followUpHistory.count({
          where: {
            performedById: staff.userId,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        db.leadActivity.count({
          where: {
            userId: staff.userId,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        db.admissionApplication.count({
          where: {
            counselorId: staff.userId,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        db.dailyWorkTask.findMany({
          where: {
            assignedStaffId: staff.id,
            reportingDate: { gte: startOfDay, lte: endOfDay },
          },
        }),
        db.dailyWorkReport.findUnique({
          where: {
            staffId_reportDate: {
              staffId: staff.id,
              reportDate: startOfDay,
            },
          },
          include: { items: true },
        }),
      ]);

    return {
      staff,
      reportDate: startOfDay,
      crmMetrics: {
        followUpsDone: followUpsCount,
        leadsContacted: leadsActivityCount,
        admissionsDone: admissionsCount,
      },
      assignedTasks,
      existingReport,
    };
  }

  /**
   * Submit or update employee daily work report
   */
  static async submitDailyReport(actor: AuthenticatedUser, input: SubmitReportInput) {
    const staff = await db.staffProfile.findUnique({
      where: { id: input.staffId },
      include: { user: true },
    });

    if (!staff) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Staff profile not found." });
    }

    const isSelf = staff.userId === actor.id;
    const isHrOrAdmin = (
      [
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ADMIN,
        UserRoleCode.HR,
      ] as UserRoleCode[]
    ).includes(actor.roleCode);

    if (!isSelf && !isHrOrAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Cannot submit report for another employee." });
    }

    const startOfDay = new Date(input.reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(input.reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Verify CRM metrics directly from database
    const [followUpsCount, leadsCount, admissionsCount] = await Promise.all([
      db.followUpHistory.count({
        where: { performedById: staff.userId, createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      db.leadActivity.count({
        where: { userId: staff.userId, createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      db.admissionApplication.count({
        where: { counselorId: staff.userId, createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
    ]);

    // Upsert the main DailyWorkReport
    const report = await db.dailyWorkReport.upsert({
      where: {
        staffId_reportDate: {
          staffId: staff.id,
          reportDate: startOfDay,
        },
      },
      create: {
        staffId: staff.id,
        reportDate: startOfDay,
        department: staff.department,
        reportingManagerId: staff.reportingManagerId,
        status: "SUBMITTED",
        actualWorkSummary: input.actualWorkSummary.trim(),
        resultsSummary: input.resultsSummary?.trim(),
        crmFollowUpsDone: followUpsCount,
        crmLeadsContacted: leadsCount,
        crmAdmissionsDone: admissionsCount,
        nextDayPriorities: input.nextDayPriorities?.trim(),
        remarks: input.remarks?.trim(),
      },
      update: {
        status: "SUBMITTED",
        actualWorkSummary: input.actualWorkSummary.trim(),
        resultsSummary: input.resultsSummary?.trim(),
        crmFollowUpsDone: followUpsCount,
        crmLeadsContacted: leadsCount,
        crmAdmissionsDone: admissionsCount,
        nextDayPriorities: input.nextDayPriorities?.trim(),
        remarks: input.remarks?.trim(),
        reviewerComments: null, // Reset previous return comments
      },
    });

    // Clear and insert report items
    await db.dailyWorkReportItem.deleteMany({ where: { reportId: report.id } });

    if (input.items && input.items.length > 0) {
      await Promise.all(
        input.items.map((item) =>
          db.dailyWorkReportItem.create({
            data: {
              reportId: report.id,
              taskId: item.taskId,
              taskTitle: item.taskTitle.trim(),
              status: item.status,
              blockedReason: item.status === "BLOCKED" ? item.blockedReason?.trim() : null,
              measurableResult: item.measurableResult?.trim(),
              notes: item.notes?.trim(),
            },
          })
        )
      );
    }

    return db.dailyWorkReport.findUnique({
      where: { id: report.id },
      include: {
        items: true,
        staff: { include: { user: true } },
      },
    });
  }

  /**
   * Review workflow: Manager or Department Head reviews report
   */
  static async reviewDailyReport(
    actor: AuthenticatedUser,
    reportId: string,
    status: "APPROVED" | "RETURNED_FOR_CORRECTION" | "REJECTED",
    reviewerComments?: string
  ) {
    const isAuthorized = (
      [
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ADMIN,
        UserRoleCode.HR,
        UserRoleCode.MANAGER,
      ] as UserRoleCode[]
    ).includes(actor.roleCode);

    if (!isAuthorized) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
    }

    const report = await db.dailyWorkReport.findUnique({
      where: { id: reportId },
      include: { staff: true },
    });

    if (!report) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Report not found." });
    }

    const updated = await db.dailyWorkReport.update({
      where: { id: reportId },
      data: {
        status,
        reviewerComments: reviewerComments?.trim(),
        reviewedById: actor.id,
        reviewedAt: new Date(),
      },
      include: {
        staff: { include: { user: true } },
        items: true,
      },
    });

    // Notify employee if returned for correction
    if (status === "RETURNED_FOR_CORRECTION") {
      await db.notification.create({
        data: {
          userId: report.staff.userId,
          title: "Daily Report Returned for Correction",
          message: `Your reporting manager returned today's report: "${reviewerComments}"`,
          type: "SYSTEM",
          priority: "HIGH",
          link: "/admin/daily-reports",
        },
      });
    }

    await AuditService.log({
      actorId: actor.id,
      action: `DAILY_REPORT_${status}`,
      resourceType: "DailyWorkReport",
      resourceId: reportId,
      newData: { status, comments: reviewerComments },
    });

    return updated;
  }

  /**
   * List reports for given department, staff, or date
   */
  static async listReports(params?: {
    staffId?: string;
    department?: string;
    date?: Date;
    status?: string;
  }) {
    return db.dailyWorkReport.findMany({
      where: {
        ...(params?.staffId ? { staffId: params.staffId } : {}),
        ...(params?.department ? { department: params.department } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.date
          ? {
              reportDate: {
                gte: new Date(new Date(params.date).setHours(0, 0, 0, 0)),
                lte: new Date(new Date(params.date).setHours(23, 59, 59, 999)),
              },
            }
          : {}),
      },
      include: {
        staff: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        items: true,
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { reportDate: "desc" },
    });
  }

  /**
   * Consolidated Director-level Company-wide Daily Overview
   */
  static async getCompanyWideDailySummary(date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      totalStaffCount,
      attendances,
      reports,
      dailyTasks,
      crmFollowUpsTotal,
      crmActivitiesTotal,
      crmAdmissionsTotal,
    ] = await Promise.all([
      db.staffProfile.count({ where: { isActive: true } }),
      db.staffAttendance.findMany({
        where: { date: { gte: startOfDay, lte: endOfDay } },
        select: { status: true },
      }),
      db.dailyWorkReport.findMany({
        where: { reportDate: { gte: startOfDay, lte: endOfDay } },
        include: {
          staff: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          items: true,
        },
      }),
      db.dailyWorkTask.findMany({
        where: { reportingDate: { gte: startOfDay, lte: endOfDay } },
        select: { status: true, department: true },
      }),
      db.followUpHistory.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      db.leadActivity.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      db.admissionApplication.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
    ]);

    // Attendance tally
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    attendances.forEach((a) => {
      if (a.status === "PRESENT") presentCount++;
      else if (a.status === "LATE") lateCount++;
      else if (a.status === "ABSENT") absentCount++;
    });

    // Task breakdown
    let tasksCompleted = 0;
    let tasksInProgress = 0;
    let tasksBlocked = 0;
    dailyTasks.forEach((t) => {
      if (t.status === "COMPLETED") tasksCompleted++;
      else if (t.status === "IN_PROGRESS" || t.status === "ASSIGNED") tasksInProgress++;
      else if (t.status === "BLOCKED") tasksBlocked++;
    });

    return {
      date: startOfDay,
      staffOverview: {
        totalStaff: totalStaffCount,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
      },
      reportsOverview: {
        totalReportsSubmitted: reports.length,
        approved: reports.filter((r) => r.status === "APPROVED").length,
        pendingReview: reports.filter((r) => r.status === "SUBMITTED").length,
        returnedForCorrection: reports.filter((r) => r.status === "RETURNED_FOR_CORRECTION").length,
      },
      tasksOverview: {
        totalTasks: dailyTasks.length,
        completed: tasksCompleted,
        inProgress: tasksInProgress,
        blocked: tasksBlocked,
      },
      verifiedCrmActivity: {
        followUpsDone: crmFollowUpsTotal,
        leadsContacted: crmActivitiesTotal,
        admissionsDone: crmAdmissionsTotal,
      },
      reportsList: reports,
    };
  }
}
