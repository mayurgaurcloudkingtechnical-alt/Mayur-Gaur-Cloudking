import { db } from "@/server/db/client";
import { AuthenticatedUser, hasPermission } from "@/server/auth/rbac";
import { AuditService } from "@/server/services/audit.service";
import { TRPCError } from "@trpc/server";
import { InstallmentStatus, FeePaymentStatus, Prisma } from "@prisma/client";

export interface CreateInstallmentScheduleInput {
  feeStructureId: string;
  installments: Array<{
    amount: number; // In Paise
    dueDate: Date;
    notes?: string;
  }>;
}

export interface UpdateInstallmentInput {
  installmentId: string;
  dueDate?: Date;
  notes?: string;
}

export class FeeInstallmentService {
  /**
   * Replaces or creates an installment schedule for an existing fee structure.
   */
  static async createSchedule(user: AuthenticatedUser, input: CreateInstallmentScheduleInput) {
    const canManage =
      hasPermission(user.permissions, "payments:record_offline") ||
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "ACCOUNTANT";

    if (!canManage) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You lack authority to modify installment schedules." });
    }

    const fee = await db.feeStructure.findUnique({
      where: { id: input.feeStructureId },
      include: { installments: true, payments: true },
    });

    if (!fee) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Fee structure not found." });
    }

    if (fee.payments.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot recreate installment schedule after payments have been recorded.",
      });
    }

    if (!input.installments || input.installments.length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "At least one installment is required." });
    }

    const totalScheduled = input.installments.reduce((sum, item) => sum + Math.floor(item.amount), 0);
    if (totalScheduled !== fee.netPayableAmount) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Sum of installments (${totalScheduled} Paise) must equal net payable amount (${fee.netPayableAmount} Paise).`,
      });
    }

    return await db.$transaction(async (tx) => {
      await tx.feeInstallment.deleteMany({
        where: { feeStructureId: fee.id },
      });

      const created = [];
      for (let i = 0; i < input.installments.length; i++) {
        const item = input.installments[i];
        const inst = await tx.feeInstallment.create({
          data: {
            feeStructureId: fee.id,
            installmentNumber: i + 1,
            amount: Math.floor(item.amount),
            paidAmount: 0,
            dueDate: new Date(item.dueDate),
            notes: item.notes?.trim() || null,
            status: InstallmentStatus.PENDING,
          },
        });
        created.push(inst);
      }

      await AuditService.log({
        actorId: user.id,
        action: "FEE_SCHEDULE_UPDATED",
        resourceType: "FeeStructure",
        resourceId: fee.id,
        newData: { installmentsCount: created.length, totalAmount: totalScheduled },
      });

      return created;
    });
  }

  /**
   * Lists installments for a fee structure, calculating dynamic overdue status.
   */
  static async listInstallments(user: AuthenticatedUser, feeStructureId: string) {
    const fee = await db.feeStructure.findUnique({
      where: { id: feeStructureId },
      select: { studentId: true },
    });

    if (!fee) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Fee structure not found." });
    }

    if (user.roleCode === "STUDENT") {
      const studentProfile = await db.studentProfile.findUnique({ where: { userId: user.id } });
      if (!studentProfile || studentProfile.id !== fee.studentId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized access to installment schedule." });
      }
    }

    const installments = await db.feeInstallment.findMany({
      where: { feeStructureId },
      orderBy: { installmentNumber: "asc" },
      include: {
        payments: {
          select: { id: true, transactionReference: true, amount: true, paymentDate: true, paymentMethod: true },
        },
      },
    });

    const now = new Date();
    return installments.map((inst) => {
      let dynamicStatus = inst.status;
      if (inst.status === InstallmentStatus.PENDING || inst.status === InstallmentStatus.PARTIAL) {
        if (new Date(inst.dueDate) < now) {
          dynamicStatus = InstallmentStatus.OVERDUE;
        }
      }
      return {
        ...inst,
        isOverdue: dynamicStatus === InstallmentStatus.OVERDUE,
        pendingAmount: Math.max(0, inst.amount - inst.paidAmount),
      };
    });
  }

  /**
   * Updates an installment's due date or notes before it is fully paid.
   */
  static async updateInstallment(user: AuthenticatedUser, input: UpdateInstallmentInput) {
    const canManage =
      hasPermission(user.permissions, "payments:record_offline") ||
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "ACCOUNTANT";

    if (!canManage) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied to update installments." });
    }

    const inst = await db.feeInstallment.findUnique({
      where: { id: input.installmentId },
    });

    if (!inst) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Installment not found." });
    }

    if (inst.status === InstallmentStatus.PAID) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot edit an installment that is already fully paid." });
    }

    const updated = await db.feeInstallment.update({
      where: { id: input.installmentId },
      data: {
        ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
        ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "FEE_INSTALLMENT_UPDATED",
      resourceType: "FeeInstallment",
      resourceId: inst.id,
      newData: { dueDate: updated.dueDate, notes: updated.notes },
    });

    return updated;
  }
}
