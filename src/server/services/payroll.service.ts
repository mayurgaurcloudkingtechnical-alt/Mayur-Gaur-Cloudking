import { db } from "@/server/db/client";
import { PayrollStatus, PaymentMethod, StaffDepartment, Prisma } from "@prisma/client";
import { LeaveManagementService } from "@/server/services/leave-management.service";
import { AuditService } from "@/server/services/audit.service";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";

export interface GeneratePayrollInput {
  staffId: string;
  month: number;
  year: number;
  workingDays?: number;
  allowances?: number; // in integer Paise
  deductions?: number; // in integer Paise
  remarks?: string;
}

export interface BatchGeneratePayrollInput {
  month: number;
  year: number;
  department?: StaffDepartment;
  workingDays?: number;
}

export interface MarkPaidInput {
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentDate?: Date;
  remarks?: string;
}

export interface ListPayrollFilter {
  month?: number;
  year?: number;
  department?: StaffDepartment;
  status?: PayrollStatus;
  staffId?: string;
  page?: number;
  limit?: number;
}

export class PayrollService {
  /**
   * Generates a collision-safe salary slip reference: SLIP-YYYYMM-XXXX
   */
  private static async generateSalarySlipNumber(year: number, month: number): Promise<string> {
    const period = `${year}${String(month).padStart(2, "0")}`;
    const count = await db.payrollRecord.count({ where: { year, month } });
    let seq = count + 1;
    let slipNumber = `SLIP-${period}-${String(seq).padStart(4, "0")}`;

    while (await db.payrollRecord.findUnique({ where: { salarySlipNumber: slipNumber } })) {
      seq += 1;
      slipNumber = `SLIP-${period}-${String(seq).padStart(4, "0")}`;
    }
    return slipNumber;
  }

  /**
   * Pure deterministic calculation of payroll components in integer Paise
   */
  static calculateSalaryComponents(params: {
    baseSalary: number;
    workingDays: number;
    unpaidLeaveDays: number;
    allowances?: number;
    deductions?: number;
  }) {
    const { baseSalary, workingDays, unpaidLeaveDays } = params;
    const allowances = params.allowances || 0;
    const deductions = params.deductions || 0;

    const perDaySalary = workingDays > 0 ? Math.floor(baseSalary / workingDays) : 0;
    const leaveDeductions = Math.floor(unpaidLeaveDays * perDaySalary);
    const netSalary = Math.max(0, baseSalary + allowances - deductions - leaveDeductions);
    const paidDays = Math.max(0, workingDays - unpaidLeaveDays);

    return { perDaySalary, leaveDeductions, netSalary, paidDays };
  }

  /**
   * Generates a single payroll record for a staff member for a specific month/year
   */
  static async generateStaffPayroll(actor: AuthenticatedUser, input: GeneratePayrollInput) {
    const { staffId, month, year, workingDays = 30, allowances = 0, deductions = 0, remarks } = input;

    if (month < 1 || month > 12) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Month must be between 1 and 12." });
    }

    const staff = await db.staffProfile.findUnique({
      where: { id: staffId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!staff) {
      throw new TRPCError({ code: "NOT_FOUND", message: `Staff profile ${staffId} not found.` });
    }

    const existing = await db.payrollRecord.findUnique({
      where: { staffId_month_year: { staffId, month, year } },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Payroll record already exists for ${staff.employeeId} for period ${month}/${year} (${existing.salarySlipNumber}).`,
      });
    }

    const unpaidLeaveDays = await LeaveManagementService.getApprovedUnpaidLeaveDays(staffId, month, year);
    const { leaveDeductions, netSalary, paidDays } = this.calculateSalaryComponents({
      baseSalary: staff.baseSalary,
      workingDays,
      unpaidLeaveDays,
      allowances,
      deductions,
    });

    const salarySlipNumber = await this.generateSalarySlipNumber(year, month);

    const record = await db.payrollRecord.create({
      data: {
        salarySlipNumber,
        staffId,
        month,
        year,
        baseSalary: staff.baseSalary,
        allowances,
        deductions,
        leaveDeductions,
        netSalary,
        workingDays,
        paidDays,
        unpaidLeaveDays,
        status: PayrollStatus.PROCESSED,
        remarks: remarks?.trim() || null,
        processedById: actor.id,
      },
      include: {
        staff: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    await AuditService.log({
      actorId: actor.id,
      action: "PAYROLL_RECORD_GENERATED",
      resourceType: "PayrollRecord",
      resourceId: record.id,
      newData: {
        salarySlipNumber: record.salarySlipNumber,
        staffId,
        netSalary: record.netSalary,
        month,
        year,
      },
    });

    return record;
  }

  /**
   * Batch generates monthly payroll for all active staff members
   */
  static async batchGenerateMonthlyPayroll(actor: AuthenticatedUser, input: BatchGeneratePayrollInput) {
    const { month, year, department, workingDays = 30 } = input;

    const staffMembers = await db.staffProfile.findMany({
      where: {
        isActive: true,
        department: department ?? undefined,
      },
    });

    const generated = [];
    const skipped = [];

    for (const staff of staffMembers) {
      const existing = await db.payrollRecord.findUnique({
        where: { staffId_month_year: { staffId: staff.id, month, year } },
      });

      if (existing) {
        skipped.push({ staffId: staff.id, employeeId: staff.employeeId, reason: "Already generated" });
        continue;
      }

      const unpaidLeaveDays = await LeaveManagementService.getApprovedUnpaidLeaveDays(staff.id, month, year);
      const { leaveDeductions, netSalary, paidDays } = this.calculateSalaryComponents({
        baseSalary: staff.baseSalary,
        workingDays,
        unpaidLeaveDays,
      });

      const salarySlipNumber = await this.generateSalarySlipNumber(year, month);

      const record = await db.payrollRecord.create({
        data: {
          salarySlipNumber,
          staffId: staff.id,
          month,
          year,
          baseSalary: staff.baseSalary,
          allowances: 0,
          deductions: 0,
          leaveDeductions,
          netSalary,
          workingDays,
          paidDays,
          unpaidLeaveDays,
          status: PayrollStatus.PROCESSED,
          processedById: actor.id,
        },
      });

      generated.push(record);
    }

    await AuditService.log({
      actorId: actor.id,
      action: "PAYROLL_BATCH_GENERATED",
      resourceType: "PayrollBatch",
      resourceId: `${year}-${month}`,
      newData: { count: generated.length, skipped: skipped.length },
    });

    return { generatedCount: generated.length, skippedCount: skipped.length, skipped };
  }

  /**
   * Disburses salary and marks a payroll record as PAID with transaction audit details
   */
  static async markPayrollPaid(actor: AuthenticatedUser, payrollId: string, input: MarkPaidInput) {
    const record = await db.payrollRecord.findUnique({ where: { id: payrollId } });

    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: `Payroll record ${payrollId} not found.` });
    }

    if (record.status === PayrollStatus.PAID) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Payroll record is already marked as PAID." });
    }

    const updated = await db.payrollRecord.update({
      where: { id: payrollId },
      data: {
        status: PayrollStatus.PAID,
        paymentDate: input.paymentDate ?? new Date(),
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference.trim(),
        remarks: input.remarks ? input.remarks.trim() : record.remarks,
      },
      include: {
        staff: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    await AuditService.log({
      actorId: actor.id,
      action: "PAYROLL_MARKED_PAID",
      resourceType: "PayrollRecord",
      resourceId: updated.id,
      previousData: { status: record.status },
      newData: {
        status: updated.status,
        paymentMethod: updated.paymentMethod,
        paymentReference: updated.paymentReference,
        paymentDate: updated.paymentDate,
      },
    });

    return updated;
  }

  /**
   * Staff self-service lookup ensuring tenant privacy
   */
  static async getSalarySlipForStaff(staffId: string, slipId: string) {
    const slip = await db.payrollRecord.findUnique({
      where: { id: slipId },
      include: {
        staff: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        processedBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!slip) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Salary slip not found." });
    }

    if (slip.staffId !== staffId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied. Cannot view another employee's salary slip." });
    }

    return slip;
  }

  /**
   * Lists personal salary slips for staff member
   */
  static async listPersonalSalarySlips(staffId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      db.payrollRecord.findMany({
        where: { staffId },
        skip,
        take: limit,
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),
      db.payrollRecord.count({ where: { staffId } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Admin ledger view of institutional payroll records
   */
  static async listPayrollRecords(filters: ListPayrollFilter = {}) {
    const { month, year, department, status, staffId, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.PayrollRecordWhereInput = {
      month: month ?? undefined,
      year: year ?? undefined,
      status: status ?? undefined,
      staffId: staffId ?? undefined,
      staff: department ? { department } : undefined,
    };

    const [items, total] = await Promise.all([
      db.payrollRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ year: "desc" }, { month: "desc" }],
        include: {
          staff: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
          processedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      db.payrollRecord.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * High-level financial KPIs for HR & Finance dashboard
   */
  static async getPayrollMetrics(month?: number, year?: number) {
    const where: Prisma.PayrollRecordWhereInput = {
      month: month ?? undefined,
      year: year ?? undefined,
    };

    const [totalProcessed, totalPaid, paidSum] = await Promise.all([
      db.payrollRecord.count({ where: { ...where, status: PayrollStatus.PROCESSED } }),
      db.payrollRecord.count({ where: { ...where, status: PayrollStatus.PAID } }),
      db.payrollRecord.aggregate({
        where: { ...where, status: PayrollStatus.PAID },
        _sum: { netSalary: true },
      }),
    ]);

    return {
      totalProcessed,
      totalPaid,
      totalDisbursedPaise: paidSum._sum.netSalary || 0,
    };
  }
}
