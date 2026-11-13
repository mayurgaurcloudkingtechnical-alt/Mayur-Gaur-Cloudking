import { db } from "@/server/db/client";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";
import {
  ExpenseCategory,
  ExpenseApprovalStatus,
  PaymentMethod,
  UserRoleCode,
  FinancialApprovalType,
  FinancialApprovalStatus,
} from "@prisma/client";

export interface CreateExpenseInput {
  title: string;
  category: ExpenseCategory;
  amountPaise: number;
  expenseDate?: Date;
  department?: string;
  costCenter?: string;
  paymentMethod: PaymentMethod;
  paidTo: string;
  isClaim?: boolean;
  vendorBillId?: string;
  receiptUrl?: string;
  notes?: string;
}

export class ExpenseManagementService {
  /**
   * Generates sequential expense reference: EXP-YYYY-XXXX
   */
  public static async generateNextExpenseNumber(): Promise<string> {
    const count = await db.expense.count();
    const seq = String(count + 1).padStart(4, "0");
    return `EXP-2026-${seq}`;
  }

  /**
   * Creates an organizational business expense or staff reimbursement claim
   */
  public static async createExpense(
    actor: AuthenticatedUser,
    input: CreateExpenseInput,
    ipAddress?: string
  ) {
    if (input.amountPaise <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Expense amount must be greater than zero.",
      });
    }

    // Double-counting prevention: If linked to a VendorBill, verify it's not already linked
    if (input.vendorBillId) {
      const existingExpenseForBill = await db.expense.findFirst({
        where: { vendorBillId: input.vendorBillId },
      });
      if (existingExpenseForBill) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Vendor bill is already linked to Expense #${existingExpenseForBill.expenseNumber}. Double-counting prevented.`,
        });
      }
    }

    const expenseNumber = await this.generateNextExpenseNumber();

    // Check budget limit for cost centre if specified
    if (input.costCenter) {
      const budget = await db.costCentreBudget.findUnique({
        where: { costCentreCode: input.costCenter },
      });
      if (budget && budget.isActive) {
        const projectedSpend = budget.utilizedAmountPaise + input.amountPaise;
        if (projectedSpend > budget.allocatedAmountPaise) {
          console.warn(
            `[Budget Alert] Cost Centre ${budget.costCentreCode} budget exceeded. Allocated: ₹${budget.allocatedAmountPaise / 100}, Projected: ₹${projectedSpend / 100}`
          );
        }
      }
    }

    const settings = await db.financeSettings.findUnique({ where: { id: "default" } });
    const executiveLimit = settings?.executiveApprovalLimit || 1000000;

    let initialStatus = ExpenseApprovalStatus.SUBMITTED;
    if (["SUPER_ADMIN", "DIRECTOR"].includes(actor.roleCode)) {
      initialStatus = ExpenseApprovalStatus.APPROVED;
    } else if (actor.roleCode === "ACCOUNTANT" && input.amountPaise <= executiveLimit && !input.isClaim) {
      initialStatus = ExpenseApprovalStatus.APPROVED;
    }

    const expense = await db.expense.create({
      data: {
        expenseNumber,
        title: input.title.trim(),
        category: input.category,
        amountPaise: input.amountPaise,
        expenseDate: input.expenseDate || new Date(),
        department: input.department?.trim() || null,
        costCenter: input.costCenter?.trim() || null,
        paymentMethod: input.paymentMethod,
        paidTo: input.paidTo.trim(),
        status: initialStatus,
        isClaim: input.isClaim || false,
        vendorBillId: input.vendorBillId || null,
        receiptUrl: input.receiptUrl || null,
        notes: input.notes?.trim() || null,
        submittedById: actor.id,
        approvedById: initialStatus === ExpenseApprovalStatus.APPROVED ? actor.id : null,
        approvedAt: initialStatus === ExpenseApprovalStatus.APPROVED ? new Date() : null,
      },
    });

    // Create approval queue item if pending
    if (initialStatus === ExpenseApprovalStatus.SUBMITTED) {
      await db.financialApproval.create({
        data: {
          approvalType: FinancialApprovalType.EXPENSE_CLAIM,
          entityId: expense.id,
          amountPaise: input.amountPaise,
          stage: input.amountPaise > 5000000 ? "DIRECTOR_SUPER_ADMIN" : "ACCOUNTS_MANAGER",
          status: FinancialApprovalStatus.PENDING,
          requestedById: actor.id,
          assignedRole: input.amountPaise > 5000000 ? UserRoleCode.DIRECTOR : UserRoleCode.ACCOUNTANT,
          comments: `${input.isClaim ? "Reimbursement claim" : "Expense"} #${expense.expenseNumber} for ₹${(input.amountPaise / 100).toLocaleString("en-IN")} submitted by ${actor.firstName} ${actor.lastName}.`,
        },
      });
    }

    // If auto-approved, post to ledger and update budget
    if (initialStatus === ExpenseApprovalStatus.APPROVED) {
      await this.postExpenseToGeneralLedger(expense, actor.id);
      if (input.costCenter) {
        await db.costCentreBudget.updateMany({
          where: { costCentreCode: input.costCenter },
          data: { utilizedAmountPaise: { increment: input.amountPaise } },
        });
      }
    }

    await db.financialAuditLog.create({
      data: {
        action: "EXPENSE_CREATED",
        entityType: "Expense",
        entityId: expense.id,
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        actorRole: actor.roleCode,
        newState: {
          expenseNumber: expense.expenseNumber,
          category: expense.category,
          amountPaise: expense.amountPaise,
          status: expense.status,
        },
        ipAddress: ipAddress || null,
      },
    });

    return expense;
  }

  /**
   * Approves or rejects an expense
   */
  public static async approveExpense(
    actor: AuthenticatedUser,
    params: {
      expenseId: string;
      decision: "APPROVE" | "REJECT";
      comments?: string;
    },
    ipAddress?: string
  ) {
    const expense = await db.expense.findUnique({
      where: { id: params.expenseId },
    });

    if (!expense) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found." });
    }

    const settings = await db.financeSettings.findUnique({ where: { id: "default" } });
    const managerLimit = settings?.managerApprovalLimit || 5000000;

    if (
      expense.amountPaise > managerLimit &&
      !["SUPER_ADMIN", "DIRECTOR"].includes(actor.roleCode)
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Expenses exceeding ₹${(managerLimit / 100).toLocaleString("en-IN")} require Director or Super Admin approval.`,
      });
    }

    if (params.decision === "REJECT") {
      const updated = await db.expense.update({
        where: { id: params.expenseId },
        data: {
          status: ExpenseApprovalStatus.REJECTED,
          approvalNotes: params.comments || "Rejected by authorized reviewer",
        },
      });

      await db.financialApproval.updateMany({
        where: {
          approvalType: FinancialApprovalType.EXPENSE_CLAIM,
          entityId: expense.id,
          status: FinancialApprovalStatus.PENDING,
        },
        data: {
          status: FinancialApprovalStatus.REJECTED,
          reviewedById: actor.id,
          reviewedAt: new Date(),
          comments: params.comments || "Expense rejected.",
        },
      });

      return updated;
    }

    const updated = await db.expense.update({
      where: { id: params.expenseId },
      data: {
        status: ExpenseApprovalStatus.APPROVED,
        approvedById: actor.id,
        approvedAt: new Date(),
        approvalNotes: params.comments || null,
      },
    });

    await db.financialApproval.updateMany({
      where: {
        approvalType: FinancialApprovalType.EXPENSE_CLAIM,
        entityId: expense.id,
        status: FinancialApprovalStatus.PENDING,
      },
      data: {
        status: FinancialApprovalStatus.APPROVED,
        reviewedById: actor.id,
        reviewedAt: new Date(),
        comments: params.comments || "Approved.",
      },
    });

    await this.postExpenseToGeneralLedger(updated, actor.id);

    if (updated.costCenter) {
      await db.costCentreBudget.updateMany({
        where: { costCentreCode: updated.costCenter },
        data: { utilizedAmountPaise: { increment: updated.amountPaise } },
      });
    }

    await db.financialAuditLog.create({
      data: {
        action: "EXPENSE_APPROVED",
        entityType: "Expense",
        entityId: expense.id,
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        actorRole: actor.roleCode,
        previousState: { status: expense.status },
        newState: { status: ExpenseApprovalStatus.APPROVED },
        notes: params.comments || null,
        ipAddress: ipAddress || null,
      },
    });

    return updated;
  }

  /**
   * Posts approved expense to General Ledger
   */
  public static async postExpenseToGeneralLedger(expense: any, actorId: string) {
    const fYear = "2025-26";
    const date = expense.expenseDate || new Date();
    const accountCode = `EXP-${expense.category}`;

    // 1. Debit Expense account
    await db.generalLedgerEntry.upsert({
      where: { entryNumber: `GLE-${expense.expenseNumber}-DR` },
      create: {
        entryNumber: `GLE-${expense.expenseNumber}-DR`,
        entryDate: date,
        accountCode,
        accountName: `Operating Expense — ${expense.category.replace(/_/g, " ")}`,
        debitPaise: expense.amountPaise,
        creditPaise: 0,
        sourceDocumentType: "EXPENSE",
        sourceDocumentId: expense.id,
        description: `${expense.title} (Payee: ${expense.paidTo})`,
        costCenter: expense.costCenter,
        financialYear: fYear,
        createdById: actorId,
      },
      update: {
        debitPaise: expense.amountPaise,
      },
    });

    // 2. Credit Bank / Cash or Payable
    const creditAccount = expense.isClaim ? "AP-STAFF-REIMBURSEMENT" : "CASH-BANK";
    const creditAccountName = expense.isClaim
      ? "Accounts Payable — Staff Reimbursement Claims"
      : "Cash & Bank Balances";

    await db.generalLedgerEntry.upsert({
      where: { entryNumber: `GLE-${expense.expenseNumber}-CR` },
      create: {
        entryNumber: `GLE-${expense.expenseNumber}-CR`,
        entryDate: date,
        accountCode: creditAccount,
        accountName: creditAccountName,
        debitPaise: 0,
        creditPaise: expense.amountPaise,
        sourceDocumentType: "EXPENSE",
        sourceDocumentId: expense.id,
        description: `Disbursement for ${expense.expenseNumber} via ${expense.paymentMethod}`,
        costCenter: expense.costCenter,
        financialYear: fYear,
        createdById: actorId,
      },
      update: {
        creditPaise: expense.amountPaise,
      },
    });
  }

  /**
   * Search and filter expenses
   */
  public static async listExpenses(
    actor: AuthenticatedUser,
    params: {
      category?: ExpenseCategory;
      status?: ExpenseApprovalStatus;
      department?: string;
      costCenter?: string;
      search?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.category) where.category = params.category;
    if (params.status) where.status = params.status;
    if (params.department) where.department = params.department;
    if (params.costCenter) where.costCenter = params.costCenter;

    if (params.startDate || params.endDate) {
      where.expenseDate = {};
      if (params.startDate) where.expenseDate.gte = params.startDate;
      if (params.endDate) where.expenseDate.lte = params.endDate;
    }

    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { expenseNumber: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { paidTo: { contains: q, mode: "insensitive" } },
      ];
    }

    const [expenses, totalCount] = await Promise.all([
      db.expense.findMany({
        where,
        include: {
          vendorBill: { select: { id: true, billNumber: true } },
        },
        orderBy: { expenseDate: "desc" },
        skip,
        take: limit,
      }),
      db.expense.count({ where }),
    ]);

    return {
      expenses,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }
}
