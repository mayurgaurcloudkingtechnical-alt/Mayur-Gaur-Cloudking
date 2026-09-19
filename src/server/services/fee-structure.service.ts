import { db } from "@/server/db/client";
import { AuthenticatedUser, hasPermission } from "@/server/auth/rbac";
import { AuditService } from "@/server/services/audit.service";
import { TRPCError } from "@trpc/server";
import { FeePaymentStatus, FeeStructureStatus, Prisma } from "@prisma/client";

export interface CreateFeeStructureInput {
  enrollmentId: string;
  registrationFee?: number; // In Paise
  discountAmount?: number; // In Paise
  scholarshipAmount?: number; // In Paise
  remarks?: string;
  installments?: Array<{
    amount: number; // In Paise
    dueDate: Date;
    notes?: string;
  }>;
}

export interface ListFeeStructuresInput {
  paymentStatus?: FeePaymentStatus;
  courseId?: string;
  batchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class FeeStructureService {
  /**
   * Calculates financial totals in integer Paise with non-negative validation.
   */
  static calculateNetPayable(params: {
    totalCourseFee: number;
    registrationFee: number;
    discountAmount: number;
    scholarshipAmount: number;
  }): { netPayable: number; isValid: boolean } {
    const gross = params.totalCourseFee + params.registrationFee;
    const deductions = params.discountAmount + params.scholarshipAmount;
    const net = gross - deductions;
    return {
      netPayable: net,
      isValid: net >= 0 && params.discountAmount >= 0 && params.scholarshipAmount >= 0 && params.registrationFee >= 0,
    };
  }

  /**
   * Creates a fee structure for an enrollment, validating gross fees, deductions, and installment sums.
   */
  static async createFeeStructure(user: AuthenticatedUser, input: CreateFeeStructureInput) {
    const canCreate =
      hasPermission(user.permissions, "payments:record_offline") ||
      hasPermission(user.permissions, "admissions:create") ||
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "ACCOUNTANT";

    if (!canCreate) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack authority to create student fee structures.",
      });
    }

    const enrollment = await db.enrollment.findUnique({
      where: { id: input.enrollmentId },
      include: {
        course: true,
        student: true,
        feeStructure: true,
      },
    });

    if (!enrollment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Enrollment with ID '${input.enrollmentId}' not found.`,
      });
    }

    if (enrollment.feeStructure) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A fee structure already exists for this enrollment.",
      });
    }

    const totalCourseFee = enrollment.course.baseFee;
    const registrationFee = Math.max(0, Math.floor(input.registrationFee || 0));
    const discountAmount = Math.max(0, Math.floor(input.discountAmount || 0));
    const scholarshipAmount = Math.max(0, Math.floor(input.scholarshipAmount || 0));

    const { netPayable, isValid } = this.calculateNetPayable({
      totalCourseFee,
      registrationFee,
      discountAmount,
      scholarshipAmount,
    });

    if (!isValid || netPayable < 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Total discounts and scholarships cannot exceed total course fee plus registration fee.",
      });
    }

    // Validate installment plan if supplied
    if (input.installments && input.installments.length > 0) {
      const sumInstallments = input.installments.reduce((acc, inst) => acc + Math.floor(inst.amount), 0);
      if (sumInstallments !== netPayable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Installments total (${sumInstallments} Paise) must exactly equal net payable amount (${netPayable} Paise).`,
        });
      }
    }

    return await db.$transaction(async (tx) => {
      const feeStructure = await tx.feeStructure.create({
        data: {
          studentId: enrollment.studentId,
          enrollmentId: enrollment.id,
          courseId: enrollment.courseId,
          batchId: enrollment.batchId,
          totalCourseFee,
          registrationFee,
          discountAmount,
          scholarshipAmount,
          netPayableAmount: netPayable,
          paidAmount: 0,
          pendingAmount: netPayable,
          paymentStatus: netPayable === 0 ? FeePaymentStatus.PAID : FeePaymentStatus.PENDING,
          status: FeeStructureStatus.ACTIVE,
          remarks: input.remarks?.trim() || null,
          createdById: user.id,
        },
      });

      if (input.installments && input.installments.length > 0) {
        for (let i = 0; i < input.installments.length; i++) {
          const inst = input.installments[i];
          await tx.feeInstallment.create({
            data: {
              feeStructureId: feeStructure.id,
              installmentNumber: i + 1,
              amount: Math.floor(inst.amount),
              paidAmount: 0,
              dueDate: new Date(inst.dueDate),
              notes: inst.notes?.trim() || null,
            },
          });
        }
      }

      await AuditService.log({
        actorId: user.id,
        action: "FEE_STRUCTURE_CREATED",
        resourceType: "FeeStructure",
        resourceId: feeStructure.id,
        newData: {
          enrollmentId: enrollment.id,
          netPayableAmount: netPayable,
          installmentsCount: input.installments?.length || 0,
        },
      });

      return await tx.feeStructure.findUnique({
        where: { id: feeStructure.id },
        include: {
          installments: { orderBy: { installmentNumber: "asc" } },
          student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          course: { select: { id: true, title: true } },
        },
      });
    });
  }

  /**
   * Retrieves fee structure by enrollment ID.
   */
  static async getByEnrollment(user: AuthenticatedUser, enrollmentId: string) {
    const fee = await db.feeStructure.findUnique({
      where: { enrollmentId },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        course: { select: { id: true, title: true, baseFee: true } },
        batch: { select: { id: true, code: true, name: true } },
        installments: { orderBy: { installmentNumber: "asc" } },
        payments: { orderBy: { paymentDate: "desc" } },
      },
    });

    if (!fee) return null;

    if (user.roleCode === "STUDENT") {
      const studentProfile = await db.studentProfile.findUnique({ where: { userId: user.id } });
      if (!studentProfile || studentProfile.id !== fee.studentId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only access your own fee details." });
      }
    }

    return fee;
  }

  /**
   * Lists fee structures with filtering and pagination.
   */
  static async listFeeStructures(user: AuthenticatedUser, input: ListFeeStructuresInput) {
    const canView =
      hasPermission(user.permissions, "payments:view_ledger") ||
      hasPermission(user.permissions, "admissions:read") ||
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "DIRECTOR" ||
      user.roleCode === "ADMIN" ||
      user.roleCode === "ACCOUNTANT";

    if (!canView) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied to view institutional fee records." });
    }

    const page = Math.max(1, input.page || 1);
    const limit = Math.min(50, Math.max(1, input.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.FeeStructureWhereInput = {
      status: FeeStructureStatus.ACTIVE,
    };

    if (input.paymentStatus) where.paymentStatus = input.paymentStatus;
    if (input.courseId) where.courseId = input.courseId;
    if (input.batchId) where.batchId = input.batchId;

    if (input.search) {
      const q = input.search.trim();
      where.OR = [
        { student: { studentId: { contains: q, mode: "insensitive" } } },
        { student: { user: { firstName: { contains: q, mode: "insensitive" } } } },
        { student: { user: { lastName: { contains: q, mode: "insensitive" } } } },
        { student: { user: { email: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [total, items] = await Promise.all([
      db.feeStructure.count({ where }),
      db.feeStructure.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          course: { select: { id: true, title: true } },
          batch: { select: { id: true, code: true, name: true } },
          _count: { select: { installments: true, payments: true } },
        },
      }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Aggregates live institutional finance metrics in Paise.
   */
  static async getOverviewMetrics(user: AuthenticatedUser) {
    const canView =
      hasPermission(user.permissions, "payments:view_ledger") ||
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "DIRECTOR" ||
      user.roleCode === "ACCOUNTANT";

    if (!canView) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied to financial ledger metrics." });
    }

    const now = new Date();

    const [aggregates, overdueInstallments, partialCount, recentPayments, pendingStudents] = await Promise.all([
      db.feeStructure.aggregate({
        where: { status: FeeStructureStatus.ACTIVE },
        _sum: {
          netPayableAmount: true,
          paidAmount: true,
          pendingAmount: true,
        },
        _count: { id: true },
      }),
      db.feeInstallment.findMany({
        where: {
          status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
          dueDate: { lt: now },
        },
        select: { amount: true, paidAmount: true },
      }),
      db.feeStructure.count({
        where: { paymentStatus: FeePaymentStatus.PARTIAL, status: FeeStructureStatus.ACTIVE },
      }),
      db.paymentTransaction.findMany({
        take: 6,
        orderBy: { paymentDate: "desc" },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          feeStructure: { include: { course: { select: { title: true } } } },
        },
      }),
      db.feeStructure.findMany({
        where: { pendingAmount: { gt: 0 }, status: FeeStructureStatus.ACTIVE },
        take: 6,
        orderBy: { pendingAmount: "desc" },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          course: { select: { title: true } },
          batch: { select: { name: true, code: true } },
        },
      }),
    ]);

    const totalReceivable = aggregates._sum.netPayableAmount || 0;
    const totalCollected = aggregates._sum.paidAmount || 0;
    const totalOutstanding = aggregates._sum.pendingAmount || 0;

    const overdueAmount = overdueInstallments.reduce((acc, inst) => {
      const remaining = inst.amount - inst.paidAmount;
      return acc + (remaining > 0 ? remaining : 0);
    }, 0);

    const collectionRate = totalReceivable > 0 ? Math.round((totalCollected / totalReceivable) * 100) : 100;

    return {
      totalReceivable,
      totalCollected,
      totalOutstanding,
      overdueAmount,
      collectionRate,
      totalEnrolledFees: aggregates._count.id,
      partialCount,
      recentPayments,
      pendingStudents,
    };
  }
}
