import { db } from "@/server/db/client";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";
import {
  VendorBillStatus,
  ItcClaimStatus,
  UserRoleCode,
  FinancialApprovalType,
  FinancialApprovalStatus,
  VerificationType,
} from "@prisma/client";
import * as crypto from "crypto";
import { VerificationEngineService } from "@/server/services/verification/verification-engine.service";
import { StatutoryValidators } from "@/server/services/verification/validators";
import { CentralNotificationEngine } from "./central-notification-engine.service";

export interface RegisterVendorInput {
  name: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  email?: string;
  personalEmail?: string;
  phone?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  category: string;
  paymentTermsDays?: number;
  notes?: string;
}

export interface SubmitVendorBillInput {
  vendorId: string;
  vendorInvoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  costCenter?: string;
  department?: string;
  taxableAmountPaise: number;
  cgstAmountPaise?: number;
  sgstAmountPaise?: number;
  igstAmountPaise?: number;
  isItcEligible?: boolean;
  attachmentUrl?: string;
  notes?: string;
}

export class VendorBillingService {
  /**
   * Generates a unique vendor code: VND-YYYY-XXXX
   */
  public static async generateNextVendorCode(): Promise<string> {
    const count = await db.vendor.count();
    const seq = String(count + 1).padStart(4, "0");
    return `VND-2026-${seq}`;
  }

  /**
   * Generates internal sequential bill number: BILL-YYYY-XXXX
   */
  public static async generateNextBillNumber(): Promise<string> {
    const settings = await db.financeSettings.findUnique({ where: { id: "default" } });
    const count = await db.vendorBill.count();
    const nextSeq = Math.max(count + 1, settings?.billNextSequence || 1);

    await db.financeSettings.upsert({
      where: { id: "default" },
      create: { id: "default", billNextSequence: nextSeq + 1 },
      update: { billNextSequence: nextSeq + 1 },
    });

    const padded = String(nextSeq).padStart(4, "0");
    return `BILL-2026-${padded}`;
  }

  /**
   * Register or update a vendor in the master vendor directory
   */
  public static async registerVendor(
    actor: AuthenticatedUser,
    input: RegisterVendorInput,
    vendorId?: string
  ) {
    // 1. Statutory format validations
    if (input.gstin && input.gstin.trim()) {
      const gstinRes = StatutoryValidators.validateGstin(input.gstin.trim().toUpperCase(), input.pan?.trim().toUpperCase());
      if (!gstinRes.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Statutory GSTIN validation failed: ${gstinRes.error}`,
        });
      }
    }

    if (input.pan && input.pan.trim()) {
      const panRes = StatutoryValidators.validatePan(input.pan.trim().toUpperCase());
      if (!panRes.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Statutory PAN validation failed: ${panRes.error}`,
        });
      }
    }

    if (input.ifscCode && input.ifscCode.trim()) {
      const ifscRes = StatutoryValidators.validateIfsc(input.ifscCode.trim().toUpperCase());
      if (!ifscRes.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Statutory Bank IFSC validation failed: ${ifscRes.error}`,
        });
      }
    }

    if (vendorId) {
      const existingVendor = await db.vendor.findUnique({ where: { id: vendorId } });
      if (!existingVendor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vendor record not found." });
      }

      const updatedVendor = await db.vendor.update({
        where: { id: vendorId },
        data: {
          name: input.name.trim(),
          tradeName: input.tradeName?.trim() || null,
          gstin: input.gstin?.trim().toUpperCase() || null,
          pan: input.pan?.trim().toUpperCase() || null,
          email: input.email?.trim() || null,
          phone: input.phone?.trim() || null,
          address: input.address?.trim() || null,
          city: input.city?.trim() || null,
          state: input.state?.trim() || null,
          stateCode: input.stateCode?.trim() || null,
          bankName: input.bankName?.trim() || null,
          accountNumber: input.accountNumber?.trim() || null,
          ifscCode: input.ifscCode?.trim().toUpperCase() || null,
          category: input.category.trim(),
          paymentTermsDays: input.paymentTermsDays || 30,
          notes: input.notes?.trim() || null,
        },
      });

      // Invalidate verifications if statutory attributes changed
      if (
        (input.accountNumber !== undefined && input.accountNumber.trim() !== (existingVendor.accountNumber || "")) ||
        (input.ifscCode !== undefined && input.ifscCode.trim().toUpperCase() !== (existingVendor.ifscCode || ""))
      ) {
        try {
          await VerificationEngineService.reverifyOnChange("Vendor", vendorId, VerificationType.BANK_ACCOUNT, actor);
        } catch (err) {
          console.warn(`[Verification] Vendor bank reverify warning:`, err);
        }
      }

      if (input.gstin !== undefined && input.gstin.trim().toUpperCase() !== (existingVendor.gstin || "")) {
        try {
          await VerificationEngineService.reverifyOnChange("Vendor", vendorId, VerificationType.GSTIN, actor);
        } catch (err) {
          console.warn(`[Verification] Vendor GSTIN reverify warning:`, err);
        }
      }

      if (input.pan !== undefined && input.pan.trim().toUpperCase() !== (existingVendor.pan || "")) {
        try {
          await VerificationEngineService.reverifyOnChange("Vendor", vendorId, VerificationType.PAN, actor);
        } catch (err) {
          console.warn(`[Verification] Vendor PAN reverify warning:`, err);
        }
      }

      return updatedVendor;
    }

    const vendorCode = await this.generateNextVendorCode();

    const vendor = await db.vendor.create({
      data: {
        vendorCode,
        name: input.name.trim(),
        tradeName: input.tradeName?.trim() || null,
        gstin: input.gstin?.trim().toUpperCase() || null,
        pan: input.pan?.trim().toUpperCase() || null,
        email: input.email?.trim() || null,
        personalEmail: input.personalEmail?.trim() || null,
        phone: input.phone?.trim() || null,
        whatsappNumber: input.whatsappNumber?.trim() || null,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        stateCode: input.stateCode?.trim() || null,
        bankName: input.bankName?.trim() || null,
        accountNumber: input.accountNumber?.trim() || null,
        ifscCode: input.ifscCode?.trim().toUpperCase() || null,
        category: input.category.trim(),
        paymentTermsDays: input.paymentTermsDays || 30,
        notes: input.notes?.trim() || null,
      },
    });

    await db.financialAuditLog.create({
      data: {
        action: "VENDOR_REGISTERED",
        entityType: "Vendor",
        entityId: vendor.id,
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        actorRole: actor.roleCode,
        newState: { vendorCode: vendor.vendorCode, name: vendor.name },
      },
    });

    // Enterprise Vendor Onboarding Notifications (Business Email + Personal Email + WhatsApp)
    CentralNotificationEngine.notifyVendorOnboarded({
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      name: vendor.name,
      email: vendor.email || undefined,
      personalEmail: input.personalEmail?.trim() || undefined,
      phone: vendor.phone || undefined,
      whatsappNumber: input.whatsappNumber?.trim() || undefined,
      category: vendor.category,
      actorId: actor.id,
    }).catch((err) => console.error("[VendorOnboardingNotification Error]", err));

    return vendor;
  }

  /**
   * Submit a purchase invoice / vendor bill with duplicate detection
   */
  public static async submitVendorBill(
    actor: AuthenticatedUser,
    input: SubmitVendorBillInput,
    ipAddress?: string
  ) {
    const vendor = await db.vendor.findUnique({
      where: { id: input.vendorId },
    });

    if (!vendor) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Vendor record not found." });
    }

    const cgst = Math.max(0, input.cgstAmountPaise || 0);
    const sgst = Math.max(0, input.sgstAmountPaise || 0);
    const igst = Math.max(0, input.igstAmountPaise || 0);
    const totalTax = cgst + sgst + igst;
    const totalAmount = input.taxableAmountPaise + totalTax;

    // Duplicate detection hash: vendorId + vendorInvoiceNumber + invoiceDate (YYYY-MM-DD) + totalAmount
    const dateStr = new Date(input.invoiceDate).toISOString().split("T")[0];
    const rawDuplicateString = `${vendor.id}:${input.vendorInvoiceNumber.trim().toLowerCase()}:${dateStr}:${totalAmount}`;
    const duplicateHash = crypto.createHash("md5").update(rawDuplicateString).digest("hex");

    const existingBill = await db.vendorBill.findUnique({
      where: { duplicateHash },
    });

    if (existingBill) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Potential duplicate bill detected! Bill #${existingBill.billNumber} already exists for Vendor "${vendor.name}" with Invoice No. "${input.vendorInvoiceNumber}" dated ${dateStr} for ₹${(totalAmount / 100).toLocaleString("en-IN")}.`,
      });
    }

    const billNumber = await this.generateNextBillNumber();

    // Determine initial approval status based on policy
    const settings = await db.financeSettings.findUnique({ where: { id: "default" } });
    const executiveLimit = settings?.executiveApprovalLimit || 1000000; // ₹10,000

    let status = VendorBillStatus.PENDING_APPROVAL;
    if (["SUPER_ADMIN", "DIRECTOR"].includes(actor.roleCode)) {
      status = VendorBillStatus.APPROVED;
    } else if (actor.roleCode === "ACCOUNTANT" && totalAmount <= executiveLimit) {
      status = VendorBillStatus.APPROVED;
    }

    const itcStatus = input.isItcEligible
      ? ItcClaimStatus.PENDING_VERIFICATION
      : ItcClaimStatus.INELIGIBLE;

    const bill = await db.vendorBill.create({
      data: {
        billNumber,
        vendorInvoiceNumber: input.vendorInvoiceNumber.trim(),
        vendorId: input.vendorId,
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate,
        costCenter: input.costCenter || null,
        department: input.department || null,
        status,
        taxableAmountPaise: input.taxableAmountPaise,
        cgstAmountPaise: cgst,
        sgstAmountPaise: sgst,
        igstAmountPaise: igst,
        totalTaxPaise: totalTax,
        totalAmountPaise: totalAmount,
        paidAmountPaise: 0,
        balanceAmountPaise: totalAmount,
        isItcEligible: input.isItcEligible || false,
        itcClaimStatus: itcStatus,
        duplicateHash,
        attachmentUrl: input.attachmentUrl || null,
        notes: input.notes || null,
        submittedById: actor.id,
        approvedById: status === VendorBillStatus.APPROVED ? actor.id : null,
        approvedAt: status === VendorBillStatus.APPROVED ? new Date() : null,
      },
      include: {
        vendor: true,
      },
    });

    // Create approval queue item if pending
    if (status === VendorBillStatus.PENDING_APPROVAL) {
      await db.financialApproval.create({
        data: {
          approvalType: FinancialApprovalType.VENDOR_BILL,
          entityId: bill.id,
          amountPaise: totalAmount,
          stage: totalAmount > 5000000 ? "DIRECTOR_SUPER_ADMIN" : "ACCOUNTS_MANAGER",
          status: FinancialApprovalStatus.PENDING,
          requestedById: actor.id,
          assignedRole: totalAmount > 5000000 ? UserRoleCode.DIRECTOR : UserRoleCode.ACCOUNTANT,
          comments: `Purchase bill #${bill.billNumber} from ${vendor.name} submitted for authorization.`,
        },
      });
    }

    // If auto-approved, post to ledger
    if (status === VendorBillStatus.APPROVED) {
      await this.postBillToGeneralLedger(bill, actor.id);
    }

    await db.financialAuditLog.create({
      data: {
        action: "VENDOR_BILL_REGISTERED",
        entityType: "VendorBill",
        entityId: bill.id,
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        actorRole: actor.roleCode,
        newState: {
          billNumber: bill.billNumber,
          vendorInvoiceNumber: bill.vendorInvoiceNumber,
          totalAmountPaise: bill.totalAmountPaise,
          status: bill.status,
        },
        ipAddress: ipAddress || null,
      },
    });

    return bill;
  }

  /**
   * Approves a pending vendor bill and posts to General Ledger
   */
  public static async approveVendorBill(
    actor: AuthenticatedUser,
    params: {
      billId: string;
      decision: "APPROVE" | "REJECT";
      comments?: string;
    },
    ipAddress?: string
  ) {
    const bill = await db.vendorBill.findUnique({
      where: { id: params.billId },
      include: { vendor: true },
    });

    if (!bill) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Vendor bill not found." });
    }

    const settings = await db.financeSettings.findUnique({ where: { id: "default" } });
    const managerLimit = settings?.managerApprovalLimit || 5000000;

    if (
      bill.totalAmountPaise > managerLimit &&
      !["SUPER_ADMIN", "DIRECTOR"].includes(actor.roleCode)
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Bills exceeding ₹${(managerLimit / 100).toLocaleString("en-IN")} require Director or Super Admin approval.`,
      });
    }

    if (params.decision === "REJECT") {
      const updated = await db.vendorBill.update({
        where: { id: params.billId },
        data: {
          status: VendorBillStatus.REJECTED,
          approvalNotes: params.comments || "Rejected by authorizer",
        },
      });

      await db.financialApproval.updateMany({
        where: {
          approvalType: FinancialApprovalType.VENDOR_BILL,
          entityId: bill.id,
          status: FinancialApprovalStatus.PENDING,
        },
        data: {
          status: FinancialApprovalStatus.REJECTED,
          reviewedById: actor.id,
          reviewedAt: new Date(),
          comments: params.comments || "Bill rejected.",
        },
      });

      return updated;
    }

    const updated = await db.vendorBill.update({
      where: { id: params.billId },
      data: {
        status: VendorBillStatus.APPROVED,
        approvedById: actor.id,
        approvedAt: new Date(),
        approvalNotes: params.comments || null,
      },
      include: { vendor: true },
    });

    await db.financialApproval.updateMany({
      where: {
        approvalType: FinancialApprovalType.VENDOR_BILL,
        entityId: bill.id,
        status: FinancialApprovalStatus.PENDING,
      },
      data: {
        status: FinancialApprovalStatus.APPROVED,
        reviewedById: actor.id,
        reviewedAt: new Date(),
        comments: params.comments || "Approved.",
      },
    });

    await this.postBillToGeneralLedger(updated, actor.id);

    await db.financialAuditLog.create({
      data: {
        action: "VENDOR_BILL_APPROVED",
        entityType: "VendorBill",
        entityId: bill.id,
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        actorRole: actor.roleCode,
        previousState: { status: bill.status },
        newState: { status: VendorBillStatus.APPROVED },
        notes: params.comments || null,
        ipAddress: ipAddress || null,
      },
    });

    return updated;
  }

  /**
   * Posts approved vendor bill to General Ledger
   */
  public static async postBillToGeneralLedger(bill: any, actorId: string) {
    const fYear = "2025-26";
    const date = bill.invoiceDate || new Date();

    // 1. Debit Expense / Cost account
    await db.generalLedgerEntry.upsert({
      where: { entryNumber: `GLE-${bill.billNumber}-EXP` },
      create: {
        entryNumber: `GLE-${bill.billNumber}-EXP`,
        entryDate: date,
        accountCode: "EXP-OPERATING",
        accountName: `Operating Expense — Vendor: ${bill.vendor?.name || "Vendor"}`,
        debitPaise: bill.taxableAmountPaise,
        creditPaise: 0,
        sourceDocumentType: "VENDOR_BILL",
        sourceDocumentId: bill.id,
        description: `Purchase bill #${bill.billNumber} (${bill.vendorInvoiceNumber})`,
        costCenter: bill.costCenter,
        financialYear: fYear,
        createdById: actorId,
      },
      update: {
        debitPaise: bill.taxableAmountPaise,
      },
    });

    // 2. Debit Input Tax Credit (if applicable and eligible)
    if (bill.totalTaxPaise > 0 && bill.isItcEligible) {
      await db.generalLedgerEntry.upsert({
        where: { entryNumber: `GLE-${bill.billNumber}-ITC` },
        create: {
          entryNumber: `GLE-${bill.billNumber}-ITC`,
          entryDate: date,
          accountCode: "GST-IN-ITC",
          accountName: "Input Tax Credit Receivable (Pending GSTR-2B Matching)",
          debitPaise: bill.totalTaxPaise,
          creditPaise: 0,
          sourceDocumentType: "VENDOR_BILL",
          sourceDocumentId: bill.id,
          description: `Input GST for bill #${bill.billNumber}`,
          financialYear: fYear,
          createdById: actorId,
        },
        update: {
          debitPaise: bill.totalTaxPaise,
        },
      });
    }

    // 3. Credit Accounts Payable
    await db.generalLedgerEntry.upsert({
      where: { entryNumber: `GLE-${bill.billNumber}-AP` },
      create: {
        entryNumber: `GLE-${bill.billNumber}-AP`,
        entryDate: date,
        accountCode: "AP-VENDORS",
        accountName: "Accounts Payable — Trade Creditors",
        debitPaise: 0,
        creditPaise: bill.totalAmountPaise,
        sourceDocumentType: "VENDOR_BILL",
        sourceDocumentId: bill.id,
        description: `Payable liability to ${bill.vendor?.name || "Vendor"}`,
        financialYear: fYear,
        createdById: actorId,
      },
      update: {
        creditPaise: bill.totalAmountPaise,
      },
    });
  }

  /**
   * Record payment disbursed to vendor against a bill
   */
  public static async recordBillPayment(
    actor: AuthenticatedUser,
    params: {
      billId: string;
      amountPaise: number;
      paymentDate?: Date;
      paymentReference: string; // UTR, Cheque No, Transaction ID
      notes?: string;
    },
    ipAddress?: string
  ) {
    const bill = await db.vendorBill.findUnique({
      where: { id: params.billId },
      include: { vendor: true },
    });

    if (!bill) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Bill not found." });
    }

    if (bill.status !== VendorBillStatus.APPROVED && bill.status !== VendorBillStatus.PARTIALLY_PAID) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only approved bills can have payments recorded.",
      });
    }

    // Statutory compliance guard: Check if vendor's statutory payout eligibility is satisfied
    const payoutCheck = await VerificationEngineService.checkPayoutEligibility("Vendor", bill.vendorId);
    if (!payoutCheck.eligible) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Vendor disbursement blocked by statutory compliance policy: ${payoutCheck.reason}`,
      });
    }

    const newPaid = bill.paidAmountPaise + params.amountPaise;
    const newBalance = Math.max(0, bill.totalAmountPaise - newPaid);
    const newStatus = newBalance === 0 ? VendorBillStatus.PAID : VendorBillStatus.PARTIALLY_PAID;

    const updated = await db.vendorBill.update({
      where: { id: params.billId },
      data: {
        paidAmountPaise: newPaid,
        balanceAmountPaise: newBalance,
        status: newStatus,
        paidAt: newBalance === 0 ? new Date() : null,
        paymentReference: params.paymentReference,
      },
      include: { vendor: true },
    });

    // Ledger posting for cash outflow
    const pDate = params.paymentDate || new Date();
    await db.generalLedgerEntry.create({
      data: {
        entryNumber: `GLE-VPAY-${bill.billNumber}-${Date.now().toString().slice(-4)}`,
        entryDate: pDate,
        accountCode: "AP-VENDORS",
        accountName: "Accounts Payable — Trade Creditors",
        debitPaise: params.amountPaise,
        creditPaise: 0,
        sourceDocumentType: "VENDOR_BILL_PAYMENT",
        sourceDocumentId: bill.id,
        description: `Disbursement to ${bill.vendor?.name} (Ref: ${params.paymentReference})`,
        financialYear: "2025-26",
        createdById: actor.id,
      },
    });

    await db.generalLedgerEntry.create({
      data: {
        entryNumber: `GLE-BANK-OUT-${bill.billNumber}-${Date.now().toString().slice(-4)}`,
        entryDate: pDate,
        accountCode: "CASH-BANK",
        accountName: "Cash & Bank Balances",
        debitPaise: 0,
        creditPaise: params.amountPaise,
        sourceDocumentType: "VENDOR_BILL_PAYMENT",
        sourceDocumentId: bill.id,
        description: `Bank disbursement for ${bill.billNumber}`,
        financialYear: "2025-26",
        createdById: actor.id,
      },
    });

    await db.financialAuditLog.create({
      data: {
        action: "VENDOR_PAYMENT_RECORDED",
        entityType: "VendorBill",
        entityId: bill.id,
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        actorRole: actor.roleCode,
        newState: {
          paidAmountPaise: newPaid,
          balanceAmountPaise: newBalance,
          paymentReference: params.paymentReference,
        },
        notes: params.notes || null,
        ipAddress: ipAddress || null,
      },
    });

    return updated;
  }

  /**
   * Search and filter vendor bills
   */
  public static async listVendorBills(
    actor: AuthenticatedUser,
    params: {
      vendorId?: string;
      status?: VendorBillStatus;
      department?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.status) where.status = params.status;
    if (params.department) where.department = params.department;

    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { billNumber: { contains: q, mode: "insensitive" } },
        { vendorInvoiceNumber: { contains: q, mode: "insensitive" } },
        { vendor: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [bills, totalCount] = await Promise.all([
      db.vendorBill.findMany({
        where,
        include: {
          vendor: true,
          expenses: true,
        },
        orderBy: { invoiceDate: "desc" },
        skip,
        take: limit,
      }),
      db.vendorBill.count({ where }),
    ]);

    return {
      bills,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  /**
   * List all vendors with their outstanding payable balances
   */
  public static async listVendors(
    actor: AuthenticatedUser,
    params: { search?: string; isActive?: boolean }
  ) {
    const where: any = {};
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { vendorCode: { contains: q, mode: "insensitive" } },
        { gstin: { contains: q, mode: "insensitive" } },
      ];
    }

    const vendors = await db.vendor.findMany({
      where,
      include: {
        bills: {
          select: {
            totalAmountPaise: true,
            paidAmountPaise: true,
            balanceAmountPaise: true,
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return vendors.map((v) => {
      const totalBilled = v.bills.reduce((acc, b) => acc + b.totalAmountPaise, 0);
      const totalPaid = v.bills.reduce((acc, b) => acc + b.paidAmountPaise, 0);
      const totalOutstanding = v.bills.reduce((acc, b) => acc + b.balanceAmountPaise, 0);

      return {
        ...v,
        totalBilledPaise: totalBilled,
        totalPaidPaise: totalPaid,
        totalOutstandingPaise: totalOutstanding,
        billCount: v.bills.length,
      };
    });
  }
}
