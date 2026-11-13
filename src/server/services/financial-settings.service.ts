import { db } from "@/server/db/client";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";
import { UserRoleCode, FinancialApprovalStatus, FinancialApprovalType } from "@prisma/client";

export class FinancialSettingsService {
  /**
   * Get or initialize Finance Settings
   */
  public static async getSettings(actor: AuthenticatedUser) {
    let settings = await db.financeSettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await db.financeSettings.create({
        data: {
          id: "default",
          companyLegalName: "SOFTLAB GLOBAL",
          tradeName: "SOFTLAB GLOBAL",
          companyGstin: "09AAECS8901L1Z9",
          companyPan: "AAECS8901L",
          companyAddress: "4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, UP - 211011",
          companyCity: "Prayagraj",
          companyState: "Uttar Pradesh",
          companyStateCode: "09",
          companyPhone: "+91 9196596979",
          companyEmail: "accounts@softlabglobal.com",
          invoicePrefix: "SLG-INV-",
          invoiceNextSequence: 1,
          billPrefix: "BILL-",
          billNextSequence: 1,
          receiptPrefix: "RCP-",
          receiptNextSequence: 1,
          financialYear: "2025-26",
          accountingBasis: "ACCRUAL",
          periodStatus: "OPEN",
          executiveApprovalLimit: 1000000,
          managerApprovalLimit: 5000000,
        },
      });
    }
    return settings;
  }

  /**
   * Update Finance Settings
   */
  public static async updateSettings(actor: AuthenticatedUser, data: any, ipAddress?: string) {
    if (!["SUPER_ADMIN", "DIRECTOR"].includes(actor.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only Super Admin and Director can modify company statutory and finance settings.",
      });
    }

    const previous = await this.getSettings(actor);
    const updated = await db.financeSettings.update({
      where: { id: "default" },
      data,
    });

    await db.financialAuditLog.create({
      data: {
        action: "FINANCE_SETTINGS_UPDATED",
        entityType: "FinanceSettings",
        entityId: "default",
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        actorRole: actor.roleCode,
        previousState: previous as any,
        newState: updated as any,
        ipAddress: ipAddress || null,
      },
    });

    return updated;
  }

  /**
   * List cost centre budgets
   */
  public static async listBudgets(actor: AuthenticatedUser, financialYear?: string) {
    return db.costCentreBudget.findMany({
      where: financialYear ? { financialYear } : undefined,
      orderBy: { costCentreCode: "asc" },
    });
  }

  /**
   * Create or update cost centre budget
   */
  public static async upsertBudget(actor: AuthenticatedUser, data: any) {
    if (!["SUPER_ADMIN", "DIRECTOR", "ADMIN", "ACCOUNTANT"].includes(actor.roleCode)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You lack permission to manage cost centre budgets." });
    }

    return db.costCentreBudget.upsert({
      where: { costCentreCode: data.costCentreCode },
      create: {
        costCentreCode: data.costCentreCode,
        costCentreName: data.costCentreName,
        department: data.department,
        financialYear: data.financialYear || "2025-26",
        quarter: data.quarter || "FULL_YEAR",
        allocatedAmountPaise: data.allocatedAmountPaise,
        notes: data.notes || null,
      },
      update: {
        costCentreName: data.costCentreName,
        department: data.department,
        allocatedAmountPaise: data.allocatedAmountPaise,
        quarter: data.quarter || "FULL_YEAR",
        notes: data.notes || null,
      },
    });
  }

  /**
   * List pending financial approvals for current user
   */
  public static async listPendingApprovals(actor: AuthenticatedUser) {
    return db.financialApproval.findMany({
      where: { status: FinancialApprovalStatus.PENDING },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * List Notification Matrix Rules
   */
  public static async listNotificationRules() {
    // Seed standard rules if empty
    const count = await db.notificationMatrixRule.count();
    if (count === 0) {
      await db.notificationMatrixRule.createMany({
        data: [
          {
            eventType: "NEW_STUDENT_ADMISSION",
            description: "New student admission confirmation & credentials dispatch",
            senderEmail: "admission@softlabglobal.com",
            senderName: "SOFTLAB GLOBAL Admissions & Student Affairs",
            primaryRecipientRole: "STUDENT",
            notifyConvertingCounselor: true,
            notifyDepartmentManager: true,
            notifyFinance: false,
            notifyHigherManagement: false,
            escalationThresholdPaise: null,
          },
          {
            eventType: "NEW_STAFF_ONBOARDING",
            description: "New employee onboarding credentials and ERP access",
            senderEmail: "hr@softlabglobal.com",
            senderName: "SOFTLAB GLOBAL Human Resources & Operations",
            primaryRecipientRole: "STAFF",
            notifyConvertingCounselor: false,
            notifyDepartmentManager: true,
            notifyFinance: false,
            notifyHigherManagement: true,
            escalationThresholdPaise: null,
          },
          {
            eventType: "VENDOR_BILL_REGISTERED",
            description: "Vendor purchase invoice registered for authorization",
            senderEmail: "accounts@softlabglobal.com",
            senderName: "SOFTLAB GLOBAL Accounts & Finance",
            primaryRecipientRole: "FINANCE",
            notifyConvertingCounselor: false,
            notifyDepartmentManager: true,
            notifyFinance: true,
            notifyHigherManagement: false,
            escalationThresholdPaise: 5000000, // ₹50,000 threshold
          },
          {
            eventType: "EXPENSE_CLAIM_SUBMITTED",
            description: "Staff expense reimbursement claim submitted",
            senderEmail: "accounts@softlabglobal.com",
            senderName: "SOFTLAB GLOBAL Accounts & Finance",
            primaryRecipientRole: "STAFF",
            notifyConvertingCounselor: false,
            notifyDepartmentManager: true,
            notifyFinance: true,
            notifyHigherManagement: false,
            escalationThresholdPaise: 2500000,
          },
          {
            eventType: "PUBLIC_COURSE_INQUIRY",
            description: "New candidate inquiry from public website / social campaign",
            senderEmail: "sales@softlabglobal.com",
            senderName: "SOFTLAB GLOBAL Career Admissions & Guidance",
            primaryRecipientRole: "LEAD",
            notifyConvertingCounselor: true,
            notifyDepartmentManager: true,
            notifyFinance: false,
            notifyHigherManagement: false,
            escalationThresholdPaise: null,
          },
          {
            eventType: "FRANCHISE_INQUIRY",
            description: "Institutional franchise opportunity application",
            senderEmail: "franchise@softlabglobal.com",
            senderName: "SOFTLAB GLOBAL Franchise Operations",
            primaryRecipientRole: "PARTNER",
            notifyConvertingCounselor: false,
            notifyDepartmentManager: true,
            notifyFinance: false,
            notifyHigherManagement: true,
            escalationThresholdPaise: null,
          },
        ],
      });
    }

    return db.notificationMatrixRule.findMany({
      orderBy: { eventType: "asc" },
    });
  }

  /**
   * Update Notification Matrix Rule
   */
  public static async updateNotificationRule(actor: AuthenticatedUser, id: string, data: any) {
    if (!["SUPER_ADMIN", "DIRECTOR", "ADMIN"].includes(actor.roleCode)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can edit notification rules." });
    }

    return db.notificationMatrixRule.update({
      where: { id },
      data,
    });
  }

  /**
   * List Financial Audit Logs
   */
  public static async listAuditLogs(
    actor: AuthenticatedUser,
    params: { action?: string; entityType?: string; page?: number; limit?: number }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.action) where.action = params.action;
    if (params.entityType) where.entityType = params.entityType;

    const [logs, totalCount] = await Promise.all([
      db.financialAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.financialAuditLog.count({ where }),
    ]);

    return { logs, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) };
  }
}
