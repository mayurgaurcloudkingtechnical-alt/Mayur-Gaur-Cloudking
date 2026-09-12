import { db } from "@/server/db/client";
import {
  PaymentTransactionStatus,
  PayrollStatus,
  FeeStructureStatus,
  EnrollmentStatus,
  BatchStatus,
  AttendanceStatus,
  CertificateStatus,
  LeadStatus,
} from "@prisma/client";

export class AnalyticsService {
  /**
   * Computes institutional financial metrics in deterministic integer Paise
   */
  static async getExecutiveFinancials() {
    const [revenueResult, payrollResult, outstandingResult] = await Promise.all([
      db.paymentTransaction.aggregate({
        where: { status: PaymentTransactionStatus.SUCCESS },
        _sum: { amount: true },
      }),
      db.payrollRecord.aggregate({
        where: { status: PayrollStatus.PAID },
        _sum: { netSalary: true },
      }),
      db.feeStructure.aggregate({
        where: { status: FeeStructureStatus.ACTIVE },
        _sum: { pendingAmount: true },
      }),
    ]);

    const totalRevenuePaise = revenueResult._sum.amount || 0;
    const totalPayrollDisbursedPaise = payrollResult._sum.netSalary || 0;
    const netOperationalBalancePaise = totalRevenuePaise - totalPayrollDisbursedPaise;
    const totalOutstandingDuesPaise = outstandingResult._sum.pendingAmount || 0;

    return {
      totalRevenuePaise,
      totalPayrollDisbursedPaise,
      netOperationalBalancePaise,
      totalOutstandingDuesPaise,
    };
  }

  /**
   * Computes CRM leads and admissions pipeline conversion metrics
   */
  static async getAdmissionsMetrics() {
    const [totalLeads, leadsByStatus, totalApplications, applicationsByStage] = await Promise.all([
      db.lead.count(),
      db.lead.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.admissionApplication.count(),
      db.admissionApplication.groupBy({
        by: ["stage"],
        _count: { _all: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    leadsByStatus.forEach((g) => {
      statusCounts[g.status] = g._count._all;
    });

    const admittedCount = statusCounts[LeadStatus.ADMITTED] || 0;
    const conversionRate = totalLeads > 0 ? Number(((admittedCount / totalLeads) * 100).toFixed(1)) : 0;

    const stageCounts: Record<string, number> = {};
    applicationsByStage.forEach((g) => {
      stageCounts[g.stage] = g._count._all;
    });

    return {
      totalLeads,
      statusCounts,
      admittedCount,
      conversionRate,
      totalApplications,
      stageCounts,
    };
  }

  /**
   * Computes academic performance, attendance rate, and certification counts
   */
  static async getAcademicsMetrics() {
    const [
      totalActiveEnrollments,
      totalBatchesInSession,
      totalAttendanceCount,
      presentAttendanceCount,
      totalCertificatesIssued,
      totalExamsPassed,
    ] = await Promise.all([
      db.enrollment.count({ where: { status: EnrollmentStatus.ACTIVE } }),
      db.batch.count({ where: { status: BatchStatus.ONGOING } }),
      db.attendanceEntry.count(),
      db.attendanceEntry.count({ where: { status: AttendanceStatus.PRESENT } }),
      db.certificate.count({ where: { status: CertificateStatus.VALID } }),
      db.examAttempt.count({ where: { isPassed: true } }),
    ]);

    const averageAttendanceRate =
      totalAttendanceCount > 0
        ? Number(((presentAttendanceCount / totalAttendanceCount) * 100).toFixed(1))
        : 100;

    return {
      totalActiveEnrollments,
      totalBatchesInSession,
      averageAttendanceRate,
      totalCertificatesIssued,
      totalExamsPassed,
    };
  }

  /**
   * Computes placement success metrics, placement rate %, and packages
   */
  static async getPlacementMetrics() {
    const [totalEligibleStudents, placedProfiles, placedApps] = await Promise.all([
      db.studentProfile.count(),
      db.studentPlacementProfile.findMany({
        where: { isPlaced: true },
        select: { placedPackage: true, placedCompany: true },
      }),
      db.placementApplication.findMany({
        where: { status: "PLACED" },
        select: { offeredPackage: true, jobDrive: { select: { title: true, company: { select: { name: true } } } } },
      }),
    ]);

    const totalStudentsPlaced = placedProfiles.length;
    const placementRate =
      totalEligibleStudents > 0
        ? Number(((totalStudentsPlaced / totalEligibleStudents) * 100).toFixed(1))
        : 0;

    // Package parsing
    let highestLPA = 0;
    let totalLPA = 0;
    let lpaCount = 0;

    const allPackages = [
      ...placedProfiles.map((p) => p.placedPackage),
      ...placedApps.map((a) => a.offeredPackage),
    ].filter(Boolean) as string[];

    for (const pkg of allPackages) {
      const match = pkg.match(/([\d.]+)/);
      if (match) {
        const val = parseFloat(match[1]);
        if (!isNaN(val)) {
          if (val > highestLPA) highestLPA = val;
          totalLPA += val;
          lpaCount += 1;
        }
      }
    }

    const averageLPA = lpaCount > 0 ? Number((totalLPA / lpaCount).toFixed(1)) : 0;

    return {
      totalEligibleStudents,
      totalStudentsPlaced,
      placementRate,
      highestPackage: highestLPA > 0 ? `${highestLPA} LPA` : "N/A",
      averagePackage: averageLPA > 0 ? `${averageLPA} LPA` : "N/A",
    };
  }

  /**
   * Aggregates full executive BI overview across all institutional facets
   */
  static async getExecutiveOverview() {
    const [financials, admissions, academics, placements] = await Promise.all([
      this.getExecutiveFinancials(),
      this.getAdmissionsMetrics(),
      this.getAcademicsMetrics(),
      this.getPlacementMetrics(),
    ]);

    return {
      financials,
      admissions,
      academics,
      placements,
      generatedAt: new Date(),
    };
  }

  /**
   * Generates a month-by-month cashflow trend for the past N months
   */
  static async getMonthlyRevenueVsPayroll(monthsCount = 6) {
    const trend = [];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
      const year = d.getFullYear();
      const month = d.getMonth() + 1;

      const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      const [monthRevenue, monthPayroll] = await Promise.all([
        db.paymentTransaction.aggregate({
          where: {
            status: PaymentTransactionStatus.SUCCESS,
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        }),
        db.payrollRecord.aggregate({
          where: {
            year,
            month,
            status: PayrollStatus.PAID,
          },
          _sum: { netSalary: true },
        }),
      ]);

      const revenuePaise = monthRevenue._sum.amount || 0;
      const payrollPaise = monthPayroll._sum.netSalary || 0;
      const netSurplusPaise = revenuePaise - payrollPaise;

      const label = d.toLocaleString("default", { month: "short", year: "numeric", timeZone: "UTC" });

      trend.push({
        label,
        year,
        month,
        revenuePaise,
        payrollPaise,
        netSurplusPaise,
      });
    }

    return trend;
  }
}
