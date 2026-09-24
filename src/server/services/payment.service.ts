import { db } from "@/server/db/client";
import { AuthenticatedUser, hasPermission } from "@/server/auth/rbac";
import { AuditService } from "@/server/services/audit.service";
import { ReceiptService } from "@/server/services/receipt.service";
import { TRPCError } from "@trpc/server";
import {
  PaymentMethod,
  PaymentTransactionStatus,
  FeePaymentStatus,
  InstallmentStatus,
  Prisma,
} from "@prisma/client";

export interface RecordOfflinePaymentInput {
  feeStructureId: string;
  installmentId?: string;
  amount: number; // In Paise
  paymentMethod: PaymentMethod;
  providerReference?: string; // Bank Ref / UTR / Cheque Number
  remarks?: string;
  paymentDate?: Date;
  receiptNumber?: string;
  isHistorical?: boolean;
}

export interface ListPaymentsInput {
  feeStructureId?: string;
  studentId?: string;
  paymentMethod?: PaymentMethod;
  page?: number;
  limit?: number;
}

export class PaymentService {
  /**
   * Generates a unique transaction reference: PAY-YYYY-XXXX.
   */
  private static async generateTransactionReference(): Promise<string> {
    const year = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      const ref = `PAY-${year}-${rand}`;
      const existing = await db.paymentTransaction.findUnique({
        where: { transactionReference: ref },
      });
      if (!existing) return ref;
    }
    return `PAY-${year}-${Date.now().toString().slice(-4)}`;
  }

  /**
   * Records an offline payment transaction atomically:
   * 1. Validates amount > 0 and amount <= fee pending amount.
   * 2. Creates payment transaction.
   * 3. Allocates paid amount across installments (specific installment or oldest pending first).
   * 4. Updates fee structure paid/pending balances and transitions payment status safely.
   * 5. Emits audit log entry.
   */
  static async recordOfflinePayment(user: AuthenticatedUser, input: RecordOfflinePaymentInput) {
    const canRecord =
      hasPermission(user.permissions, "payments:record_offline") ||
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "DIRECTOR" ||
      user.roleCode === "ADMIN" ||
      user.roleCode === "ACCOUNTANT" ||
      user.roleCode === "COUNSELOR" ||
      user.roleCode === "MANAGER";

    if (!canRecord) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to record financial payments.",
      });
    }

    const payAmount = Math.floor(input.amount);
    if (payAmount <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment amount must be greater than zero.",
      });
    }

    const fee = await db.feeStructure.findUnique({
      where: { id: input.feeStructureId },
      include: {
        installments: { orderBy: { installmentNumber: "asc" } },
      },
    });

    if (!fee) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Fee structure with ID '${input.feeStructureId}' not found.`,
      });
    }

    if (payAmount > fee.pendingAmount) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Payment amount (${payAmount} Paise) cannot exceed outstanding balance (${fee.pendingAmount} Paise).`,
      });
    }

    const ref = await this.generateTransactionReference();
    const receiptNo = input.receiptNumber?.trim() || (await ReceiptService.generateReceiptNumber());
    const payDate = input.paymentDate ? new Date(input.paymentDate) : new Date();
    const isHist =
      Boolean(input.isHistorical) ||
      (input.paymentDate ? new Date(input.paymentDate).getFullYear() < new Date().getFullYear() : false);

    return await db.$transaction(async (tx) => {
      // 1. Resolve linked Admission Application ID if student was converted from admission
      let admissionId: string | null = null;
      if (fee.studentId) {
        const app = await tx.admissionApplication.findFirst({
          where: { convertedStudentProfileId: fee.studentId },
          select: { id: true },
        });
        if (app) admissionId = app.id;
      }

      // 2. Create transaction record
      const payment = await tx.paymentTransaction.create({
        data: {
          transactionReference: ref,
          feeStructureId: fee.id,
          installmentId: input.installmentId || null,
          studentId: fee.studentId,
          enrollmentId: fee.enrollmentId,
          admissionId,
          amount: payAmount,
          paymentDate: payDate,
          paidAt: payDate,
          paymentMethod: input.paymentMethod,
          status: PaymentTransactionStatus.SUCCESS,
          receiptNumber: receiptNo,
          isHistorical: isHist,
          providerReference: input.providerReference?.trim() || null,
          remarks: input.remarks?.trim() || null,
          receivedById: user.id,
        },
      });

      // 2. Allocate payment to installments
      let remainingToAllocate = payAmount;

      if (input.installmentId) {
        const targetInst = fee.installments.find((inst) => inst.id === input.installmentId);
        if (targetInst) {
          const instUnpaid = targetInst.amount - targetInst.paidAmount;
          const instPayment = Math.min(remainingToAllocate, instUnpaid);
          const newPaid = targetInst.paidAmount + instPayment;
          const newStatus = newPaid >= targetInst.amount ? InstallmentStatus.PAID : InstallmentStatus.PARTIAL;

          await tx.feeInstallment.update({
            where: { id: targetInst.id },
            data: {
              paidAmount: newPaid,
              status: newStatus,
              paidAt: newStatus === InstallmentStatus.PAID ? new Date() : null,
            },
          });
          remainingToAllocate -= instPayment;
        }
      }

      // If leftover or no installment chosen, distribute chronologically
      if (remainingToAllocate > 0) {
        for (const inst of fee.installments) {
          if (remainingToAllocate <= 0) break;
          if (inst.id === input.installmentId) continue; // Already processed

          const unpaid = inst.amount - inst.paidAmount;
          if (unpaid > 0) {
            const alloc = Math.min(remainingToAllocate, unpaid);
            const newPaid = inst.paidAmount + alloc;
            const newStatus = newPaid >= inst.amount ? InstallmentStatus.PAID : InstallmentStatus.PARTIAL;

            await tx.feeInstallment.update({
              where: { id: inst.id },
              data: {
                paidAmount: newPaid,
                status: newStatus,
                paidAt: newStatus === InstallmentStatus.PAID ? new Date() : null,
              },
            });
            remainingToAllocate -= alloc;
          }
        }
      }

      // 3. Update FeeStructure balance and status
      const newTotalPaid = fee.paidAmount + payAmount;
      const newPending = fee.netPayableAmount - newTotalPaid;
      const newStatus =
        newPending === 0
          ? FeePaymentStatus.PAID
          : newTotalPaid > 0
          ? FeePaymentStatus.PARTIAL
          : FeePaymentStatus.PENDING;

      const updatedFee = await tx.feeStructure.update({
        where: { id: fee.id },
        data: {
          paidAmount: newTotalPaid,
          pendingAmount: newPending,
          paymentStatus: newStatus,
        },
      });

      // 4. Audit trail
      await AuditService.log({
        actorId: user.id,
        action: "PAYMENT_RECORDED",
        resourceType: "PaymentTransaction",
        resourceId: payment.id,
        newData: {
          transactionReference: ref,
          amount: payAmount,
          method: input.paymentMethod,
          feeStructureId: fee.id,
          newPendingBalance: newPending,
          newStatus,
        },
      });

      return {
        payment,
        feeStructure: updatedFee,
      };
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * Lists payments with RBAC filtering.
   */
  static async listPayments(user: AuthenticatedUser, input: ListPaymentsInput) {
    const page = Math.max(1, input.page || 1);
    const limit = Math.min(50, Math.max(1, input.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentTransactionWhereInput = {};

    if (user.roleCode === "STUDENT") {
      const studentProfile = await db.studentProfile.findUnique({ where: { userId: user.id } });
      if (!studentProfile) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Student profile not found." });
      }
      where.studentId = studentProfile.id;
    } else {
      const canView =
        hasPermission(user.permissions, "payments:view_ledger") ||
        user.roleCode === "SUPER_ADMIN" ||
        user.roleCode === "ACCOUNTANT";
      if (!canView) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied to payment history." });
      }

      if (input.feeStructureId) where.feeStructureId = input.feeStructureId;
      if (input.studentId) where.studentId = input.studentId;
      if (input.paymentMethod) where.paymentMethod = input.paymentMethod;
    }

    const [total, items] = await Promise.all([
      db.paymentTransaction.count({ where }),
      db.paymentTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: "desc" },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          feeStructure: { include: { course: { select: { id: true, title: true } } } },
          admission: { include: { course: { select: { id: true, title: true } } } },
          receivedBy: { select: { id: true, firstName: true, lastName: true, roleCode: true } },
        },
      }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Retrieves single payment details / receipt data.
   */
  static async getPaymentDetails(user: AuthenticatedUser, paymentId: string) {
    const payment = await db.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
        feeStructure: {
          include: {
            course: { select: { id: true, title: true } },
            batch: { select: { id: true, code: true, name: true } },
          },
        },
        installment: true,
        receivedBy: { select: { id: true, firstName: true, lastName: true, roleCode: true } },
      },
    });

    if (!payment) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Payment transaction not found." });
    }

    if (user.roleCode === "STUDENT") {
      const studentProfile = await db.studentProfile.findUnique({ where: { userId: user.id } });
      if (!studentProfile || studentProfile.id !== payment.studentId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied to payment receipt." });
      }
    }

    return payment;
  }

  /**
   * Updates an existing payment transaction record (amount, payment method, reference, remarks, receipt number, payment date).
   * Automatically recalculates fee structure paid/pending balances and installment schedules if amount changes.
   */
  static async updatePayment(
    user: AuthenticatedUser,
    input: {
      paymentId: string;
      amount?: number; // In Paise
      paymentMethod?: PaymentMethod;
      providerReference?: string;
      remarks?: string;
      receiptNumber?: string;
      paymentDate?: Date;
    }
  ) {
    const payment = await db.paymentTransaction.findUnique({
      where: { id: input.paymentId },
      include: {
        student: true,
        feeStructure: {
          include: {
            installments: { orderBy: { installmentNumber: "asc" } },
          },
        },
      },
    });

    if (!payment) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Payment transaction not found." });
    }

    const payDate = input.paymentDate ? new Date(input.paymentDate) : payment.paymentDate;
    const newAmount = input.amount !== undefined ? Math.floor(input.amount) : payment.amount;

    return await db.$transaction(async (tx) => {
      const updated = await tx.paymentTransaction.update({
        where: { id: input.paymentId },
        data: {
          amount: newAmount,
          paymentMethod: input.paymentMethod ?? payment.paymentMethod,
          providerReference: input.providerReference !== undefined ? input.providerReference : payment.providerReference,
          remarks: input.remarks !== undefined ? input.remarks : payment.remarks,
          receiptNumber: input.receiptNumber !== undefined ? input.receiptNumber : payment.receiptNumber,
          paymentDate: payDate,
          paidAt: payDate,
        },
      });

      // Recalculate fee structure if associated
      if (payment.feeStructureId) {
        const allPayments = await tx.paymentTransaction.findMany({
          where: { feeStructureId: payment.feeStructureId, status: PaymentTransactionStatus.SUCCESS },
        });

        const totalPaid = allPayments.reduce((acc, p) => acc + p.amount, 0);

        const fee = await tx.feeStructure.findUnique({
          where: { id: payment.feeStructureId },
          include: { installments: { orderBy: { installmentNumber: "asc" } } },
        });

        if (fee) {
          const newPending = Math.max(0, fee.netPayableAmount - totalPaid);
          const newStatus =
            newPending === 0
              ? FeePaymentStatus.PAID
              : totalPaid > 0
              ? FeePaymentStatus.PARTIAL
              : FeePaymentStatus.PENDING;

          await tx.feeStructure.update({
            where: { id: fee.id },
            data: {
              paidAmount: totalPaid,
              pendingAmount: newPending,
              paymentStatus: newStatus,
            },
          });

          // Re-allocate installments if present
          if (fee.installments.length > 0) {
            let remaining = totalPaid;
            for (const inst of fee.installments) {
              let instPaid = 0;
              let instStatus: InstallmentStatus = InstallmentStatus.PENDING;
              if (remaining > 0) {
                if (remaining >= inst.amount) {
                  instPaid = inst.amount;
                  instStatus = InstallmentStatus.PAID;
                  remaining -= inst.amount;
                } else {
                  instPaid = remaining;
                  instStatus = InstallmentStatus.PARTIAL;
                  remaining = 0;
                }
              }
              await tx.feeInstallment.update({
                where: { id: inst.id },
                data: {
                  paidAmount: instPaid,
                  status: instStatus,
                  paidAt: instStatus === InstallmentStatus.PAID ? new Date() : null,
                },
              });
            }
          }
        }
      }

      await AuditService.log({
        actorId: user.id,
        action: "PAYMENT_RECORD_UPDATED",
        resourceType: "PaymentTransaction",
        resourceId: payment.id,
        newData: {
          amount: newAmount,
          paymentMethod: updated.paymentMethod,
          receiptNumber: updated.receiptNumber,
          paymentDate: payDate,
        },
      });

      return updated;
    });
  }
}

