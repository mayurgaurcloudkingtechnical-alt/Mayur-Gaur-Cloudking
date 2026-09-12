import { db } from "@/server/db/client";
import {
  ReportExportType,
  PaymentTransactionStatus,
  PayrollStatus,
  FeeStructureStatus,
} from "@prisma/client";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "@/server/services/audit.service";

export class ReportGeneratorService {
  /**
   * Helper to escape CSV cell fields according to RFC 4180
   */
  private static escapeCsv(value: unknown): string {
    if (value === null || value === undefined) return "";
    const str = String(value).trim();
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Generates a sanitized CSV report of fee defaulters with overdue installments
   */
  static async generateFeeDefaultersReport(actor: AuthenticatedUser) {
    const now = new Date();

    const overdueInstallments = await db.feeInstallment.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: "PAID" },
        feeStructure: { status: FeeStructureStatus.ACTIVE },
      },
      include: {
        feeStructure: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true, phone: true } },
              },
            },
            course: { select: { title: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const headers = [
      "Student Name",
      "Email",
      "Phone",
      "Course",
      "Installment #",
      "Due Date",
      "Installment Amount (INR)",
      "Paid Amount (INR)",
      "Overdue Balance (INR)",
    ];

    const rows = overdueInstallments.map((inst) => {
      const student = inst.feeStructure.student;
      const user = student.user;
      const overdueBalancePaise = Math.max(0, inst.amount - inst.paidAmount);

      return [
        this.escapeCsv(`${user.firstName} ${user.lastName}`),
        this.escapeCsv(user.email),
        this.escapeCsv(user.phone || "N/A"),
        this.escapeCsv(inst.feeStructure.course.title),
        this.escapeCsv(inst.installmentNumber),
        this.escapeCsv(new Date(inst.dueDate).toISOString().slice(0, 10)),
        this.escapeCsv((inst.amount / 100).toFixed(2)),
        this.escapeCsv((inst.paidAmount / 100).toFixed(2)),
        this.escapeCsv((overdueBalancePaise / 100).toFixed(2)),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const fileName = `fee_defaulters_${Date.now()}.csv`;

    const exportRecord = await db.auditReportExport.create({
      data: {
        reportType: ReportExportType.FEE_DEFAULTERS,
        fileName,
        recordCount: overdueInstallments.length,
        generatedById: actor.id,
      },
    });

    await AuditService.log({
      actorId: actor.id,
      action: "AUDIT_REPORT_EXPORTED",
      resourceType: "AuditReportExport",
      resourceId: exportRecord.id,
      newData: { reportType: ReportExportType.FEE_DEFAULTERS, recordCount: overdueInstallments.length },
    });

    return { exportId: exportRecord.id, fileName, csvContent, recordCount: overdueInstallments.length };
  }

  /**
   * Generates a sanitized cashflow report comparing tuition receipts vs payroll disbursements
   */
  static async generateFinancialCashflowReport(actor: AuthenticatedUser) {
    const [payments, payrolls] = await Promise.all([
      db.paymentTransaction.findMany({
        where: { status: PaymentTransactionStatus.SUCCESS },
        include: {
          feeStructure: {
            include: {
              student: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.payrollRecord.findMany({
        where: { status: PayrollStatus.PAID },
        include: {
          staff: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const headers = [
      "Type",
      "Reference",
      "Date",
      "Counterparty",
      "Payment Method",
      "Gross Inflow (INR)",
      "Gross Outflow (INR)",
      "Status",
    ];

    const paymentRows = payments.map((p) => {
      const studentName = p.feeStructure
        ? `${p.feeStructure.student.user.firstName} ${p.feeStructure.student.user.lastName}`
        : "Student";
      return [
        "TUITION_RECEIPT",
        this.escapeCsv(p.transactionReference),
        this.escapeCsv(new Date(p.createdAt).toISOString().slice(0, 10)),
        this.escapeCsv(studentName),
        this.escapeCsv(p.paymentMethod),
        this.escapeCsv((p.amount / 100).toFixed(2)),
        "0.00",
        this.escapeCsv(p.status),
      ].join(",");
    });

    const payrollRows = payrolls.map((pr) => {
      const staffName = `${pr.staff.user.firstName} ${pr.staff.user.lastName}`;
      return [
        "STAFF_PAYROLL",
        this.escapeCsv(pr.salarySlipNumber),
        this.escapeCsv(pr.paymentDate ? new Date(pr.paymentDate).toISOString().slice(0, 10) : new Date(pr.updatedAt).toISOString().slice(0, 10)),
        this.escapeCsv(staffName),
        this.escapeCsv(pr.paymentMethod || "BANK_TRANSFER"),
        "0.00",
        this.escapeCsv((pr.netSalary / 100).toFixed(2)),
        this.escapeCsv(pr.status),
      ].join(",");
    });

    const allRows = [...paymentRows, ...payrollRows];
    const csvContent = [headers.join(","), ...allRows].join("\n");
    const fileName = `financial_cashflow_${Date.now()}.csv`;

    const exportRecord = await db.auditReportExport.create({
      data: {
        reportType: ReportExportType.FINANCIAL_LEDGER,
        fileName,
        recordCount: allRows.length,
        generatedById: actor.id,
      },
    });

    await AuditService.log({
      actorId: actor.id,
      action: "AUDIT_REPORT_EXPORTED",
      resourceType: "AuditReportExport",
      resourceId: exportRecord.id,
      newData: { reportType: ReportExportType.FINANCIAL_LEDGER, recordCount: allRows.length },
    });

    return { exportId: exportRecord.id, fileName, csvContent, recordCount: allRows.length };
  }

  /**
   * Generates a sanitized corporate recruitment and placement summary CSV
   */
  static async generatePlacementSummaryReport(actor: AuthenticatedUser) {
    const placedApps = await db.placementApplication.findMany({
      where: { status: "PLACED" },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            enrollments: { include: { course: { select: { title: true } } } },
          },
        },
        jobDrive: {
          include: {
            company: { select: { name: true, industry: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const headers = [
      "Student Name",
      "Email",
      "Course",
      "Company",
      "Industry",
      "Job Title",
      "Offered Package",
      "Placed Date",
    ];

    const rows = placedApps.map((app) => {
      const studentName = `${app.student.user.firstName} ${app.student.user.lastName}`;
      const courseTitle = app.student.enrollments[0]?.course?.title || "N/A";
      return [
        this.escapeCsv(studentName),
        this.escapeCsv(app.student.user.email),
        this.escapeCsv(courseTitle),
        this.escapeCsv(app.jobDrive.company.name),
        this.escapeCsv(app.jobDrive.company.industry || "Technology"),
        this.escapeCsv(app.jobDrive.title),
        this.escapeCsv(app.offeredPackage || "N/A"),
        this.escapeCsv(new Date(app.updatedAt).toISOString().slice(0, 10)),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const fileName = `placement_records_${Date.now()}.csv`;

    const exportRecord = await db.auditReportExport.create({
      data: {
        reportType: ReportExportType.PLACEMENT_RECORD,
        fileName,
        recordCount: placedApps.length,
        generatedById: actor.id,
      },
    });

    await AuditService.log({
      actorId: actor.id,
      action: "AUDIT_REPORT_EXPORTED",
      resourceType: "AuditReportExport",
      resourceId: exportRecord.id,
      newData: { reportType: ReportExportType.PLACEMENT_RECORD, recordCount: placedApps.length },
    });

    return { exportId: exportRecord.id, fileName, csvContent, recordCount: placedApps.length };
  }

  /**
   * Retrieves recent audit report exports
   */
  static async listRecentExportReports(limit = 20) {
    return db.auditReportExport.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        generatedBy: {
          select: { firstName: true, lastName: true, email: true, roleCode: true },
        },
      },
    });
  }
}
