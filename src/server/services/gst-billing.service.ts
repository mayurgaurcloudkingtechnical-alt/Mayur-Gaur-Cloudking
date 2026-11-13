import { db } from "@/server/db/client";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";
import {
  GstInvoiceStatus,
  GstCustomerType,
  InvoiceItemType,
  UserRoleCode,
  PaymentMethod,
  GstTaxCategory,
  Prisma,
} from "@prisma/client";
import { AuditService } from "./audit.service";
import { CentralGstTaxEngine, TaxLineInput, GstCalculationResult } from "./central-gst-tax-engine.service";

export interface CalculateGstItemInput {
  itemType: InvoiceItemType;
  description: string;
  hsnSacCode: string;
  quantity: number;
  unit?: string;
  ratePaise: number;
  discountPaise?: number;
  gstRate: number; // e.g. 18.0
  taxCategory?: GstTaxCategory;
  isTaxInclusive?: boolean;
  exemptionReason?: string;
}

export interface CalculateGstBreakupInput {
  placeOfSupplyStateCode: string;
  companyStateCode?: string;
  items: CalculateGstItemInput[];
}

export interface CalculatedGstBreakup {
  isInterState: boolean;
  subtotalPaise: number;
  discountPaise: number;
  taxableAmountPaise: number;
  cgstAmountPaise: number;
  sgstAmountPaise: number;
  igstAmountPaise: number;
  totalTaxPaise: number;
  roundOffPaise: number;
  grandTotalPaise: number;
  items: Array<{
    itemType: InvoiceItemType;
    description: string;
    hsnSacCode: string;
    quantity: number;
    unit: string;
    ratePaise: number;
    discountPaise: number;
    taxableAmountPaise: number;
    gstRate: number;
    cgstRate: number;
    cgstAmountPaise: number;
    sgstRate: number;
    sgstAmountPaise: number;
    igstRate: number;
    igstAmountPaise: number;
    totalAmountPaise: number;
    taxCategory?: GstTaxCategory;
    isTaxInclusive?: boolean;
    exemptionReason?: string;
  }>;
}

export interface CreateGstInvoiceInput {
  customerType: GstCustomerType;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerGstin?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerStateCode?: string;
  placeOfSupply?: string;
  invoiceDate?: Date;
  dueDate: Date;
  studentId?: string;
  admissionId?: string;
  feeStructureId?: string;
  paymentTerms?: string;
  notes?: string;
  termsAndConditions?: string;
  items: CalculateGstItemInput[];
  issueImmediately?: boolean;
}

export class GstBillingService {
  public static readonly DEFAULT_COMPANY_STATE_CODE = "09"; // Uttar Pradesh
  public static readonly DEFAULT_COMPANY_STATE = "Uttar Pradesh";
  public static readonly DEFAULT_COMPANY_GSTIN = "09AAECS8901L1Z9";
  public static readonly DEFAULT_COMPANY_NAME = "SOFTLAB GLOBAL";
  public static readonly DEFAULT_COMPANY_ADDRESS =
    "4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, UP - 211011";

  /**
   * Retrieves active finance settings or default configuration
   */
  public static async getCompanySettings() {
    const settings = await db.financeSettings.findUnique({
      where: { id: "default" },
    });
    if (settings) return settings;

    return {
      id: "default",
      companyLegalName: this.DEFAULT_COMPANY_NAME,
      tradeName: this.DEFAULT_COMPANY_NAME,
      companyGstin: this.DEFAULT_COMPANY_GSTIN,
      companyPan: "AAECS8901L",
      companyAddress: this.DEFAULT_COMPANY_ADDRESS,
      companyCity: "Prayagraj",
      companyState: this.DEFAULT_COMPANY_STATE,
      companyStateCode: this.DEFAULT_COMPANY_STATE_CODE,
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
    };
  }

  /**
   * Pure mathematical and statutory calculation of GST based on Place of Supply.
   * Delegates to CentralGstTaxEngine for unified dual-pricing and tax categorization.
   */
  public static calculateGstBreakup(input: CalculateGstBreakupInput): CalculatedGstBreakup {
    const result = CentralGstTaxEngine.calculateTax({
      placeOfSupplyStateCode: input.placeOfSupplyStateCode,
      companyStateCode: input.companyStateCode,
      items: input.items.map((i) => ({
        itemType: i.itemType,
        description: i.description,
        hsnSacCode: i.hsnSacCode,
        quantity: i.quantity,
        unit: i.unit,
        ratePaise: i.ratePaise,
        discountPaise: i.discountPaise,
        gstRate: i.gstRate,
        taxCategory: i.taxCategory || GstTaxCategory.STANDARD_TAXABLE,
        isTaxInclusive: i.isTaxInclusive,
        exemptionReason: i.exemptionReason,
      })),
    });

    return {
      isInterState: result.isInterState,
      subtotalPaise: result.subtotalPaise,
      discountPaise: result.discountPaise,
      taxableAmountPaise: result.taxableAmountPaise,
      cgstAmountPaise: result.cgstAmountPaise,
      sgstAmountPaise: result.sgstAmountPaise,
      igstAmountPaise: result.igstAmountPaise,
      totalTaxPaise: result.totalTaxPaise,
      roundOffPaise: result.roundOffPaise,
      grandTotalPaise: result.grandTotalPaise,
      items: result.items.map((ci) => ({
        itemType: ci.itemType,
        description: ci.description,
        hsnSacCode: ci.hsnSacCode,
        quantity: ci.quantity,
        unit: ci.unit,
        ratePaise: ci.ratePaise,
        discountPaise: ci.discountPaise,
        taxableAmountPaise: ci.taxableAmountPaise,
        gstRate: ci.gstRate,
        cgstRate: ci.cgstRate,
        cgstAmountPaise: ci.cgstAmountPaise,
        sgstRate: ci.sgstRate,
        sgstAmountPaise: ci.sgstAmountPaise,
        igstRate: ci.igstRate,
        igstAmountPaise: ci.igstAmountPaise,
        totalAmountPaise: ci.totalAmountPaise,
        taxCategory: ci.taxCategory,
        isTaxInclusive: ci.isTaxInclusive,
        exemptionReason: ci.exemptionReason,
      })),
    };
  }

  /**
   * Generates next sequential invoice number within transaction safety
   */
  public static async generateNextInvoiceNumber(): Promise<{
    invoiceNumber: string;
    invoiceSeries: string;
    sequenceNumber: number;
  }> {
    const settings = await this.getCompanySettings();
    const year = settings.financialYear.replace("-", "");
    const prefix = settings.invoicePrefix || "SLG-INV-";

    const lastInvoice = await db.gstInvoice.findFirst({
      orderBy: { sequenceNumber: "desc" },
      select: { sequenceNumber: true },
    });

    const nextSeq = Math.max(
      lastInvoice?.sequenceNumber ? lastInvoice.sequenceNumber + 1 : 1,
      settings.invoiceNextSequence || 1
    );

    const padded = String(nextSeq).padStart(4, "0");
    const invoiceNumber = `${prefix}${year}-${padded}`;
    const invoiceSeries = `${prefix}${year}`;

    // Update next sequence in settings
    await db.financeSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        invoiceNextSequence: nextSeq + 1,
      },
      update: {
        invoiceNextSequence: nextSeq + 1,
      },
    });

    return { invoiceNumber, invoiceSeries, sequenceNumber: nextSeq };
  }

  /**
   * Creates a formal GST sales invoice
   */
  public static async createInvoice(
    actor: AuthenticatedUser,
    input: CreateGstInvoiceInput,
    ipAddress?: string
  ) {
    const allowedRoles: UserRoleCode[] = [
      UserRoleCode.SUPER_ADMIN,
      UserRoleCode.DIRECTOR,
      UserRoleCode.ADMIN,
      UserRoleCode.ACCOUNTANT,
      UserRoleCode.MANAGER,
    ];

    if (!allowedRoles.includes(actor.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack authority to create GST sales invoices.",
      });
    }

    if (!input.items || input.items.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "At least one item or service is required to generate an invoice.",
      });
    }

    const settings = await this.getCompanySettings();
    const custStateCode = (input.customerStateCode || this.DEFAULT_COMPANY_STATE_CODE).trim();
    const pos = input.placeOfSupply?.trim() || `${custStateCode}-${input.customerState || this.DEFAULT_COMPANY_STATE}`;

    const calculation = this.calculateGstBreakup({
      placeOfSupplyStateCode: custStateCode,
      companyStateCode: settings.companyStateCode,
      items: input.items,
    });

    const { invoiceNumber, invoiceSeries, sequenceNumber } = await this.generateNextInvoiceNumber();

    const invoiceStatus = input.issueImmediately ? GstInvoiceStatus.ISSUED : GstInvoiceStatus.DRAFT;
    const issuedAt = input.issueImmediately ? new Date() : null;

    const invoice = await db.gstInvoice.create({
      data: {
        invoiceNumber,
        invoiceSeries,
        sequenceNumber,
        invoiceDate: input.invoiceDate || new Date(),
        dueDate: input.dueDate,
        status: invoiceStatus,
        customerType: input.customerType,
        customerName: input.customerName.trim(),
        customerEmail: input.customerEmail?.trim() || null,
        customerPhone: input.customerPhone?.trim() || null,
        customerGstin: input.customerGstin?.trim().toUpperCase() || null,
        customerAddress: input.customerAddress?.trim() || null,
        customerCity: input.customerCity?.trim() || null,
        customerState: input.customerState?.trim() || this.DEFAULT_COMPANY_STATE,
        customerStateCode: custStateCode,
        placeOfSupply: pos,
        isInterState: calculation.isInterState,
        companyLegalName: settings.companyLegalName,
        companyGstin: settings.companyGstin,
        companyAddress: settings.companyAddress,
        companyState: settings.companyState,
        companyStateCode: settings.companyStateCode,
        currency: "INR",

        subtotalPaise: calculation.subtotalPaise,
        discountPaise: calculation.discountPaise,
        taxableAmountPaise: calculation.taxableAmountPaise,
        cgstAmountPaise: calculation.cgstAmountPaise,
        sgstAmountPaise: calculation.sgstAmountPaise,
        igstAmountPaise: calculation.igstAmountPaise,
        totalTaxPaise: calculation.totalTaxPaise,
        roundOffPaise: calculation.roundOffPaise,
        grandTotalPaise: calculation.grandTotalPaise,
        paidAmountPaise: 0,
        balanceAmountPaise: calculation.grandTotalPaise,

        studentId: input.studentId || null,
        admissionId: input.admissionId || null,
        feeStructureId: input.feeStructureId || null,
        paymentTerms: input.paymentTerms || "Net 15 Days",
        notes: input.notes || null,
        termsAndConditions:
          input.termsAndConditions ||
          "1. Fees once received are subject to institutional terms. 2. Interest @18% p.a. applicable on overdue invoices.",
        createdById: actor.id,
        issuedAt,

        items: {
          create: calculation.items.map((i) => ({
            itemType: i.itemType,
            description: i.description,
            hsnSacCode: i.hsnSacCode,
            quantity: i.quantity,
            unit: i.unit,
            ratePaise: i.ratePaise,
            discountPaise: i.discountPaise,
            taxableAmountPaise: i.taxableAmountPaise,
            gstRate: i.gstRate,
            cgstRate: i.cgstRate,
            cgstAmountPaise: i.cgstAmountPaise,
            sgstRate: i.sgstRate,
            sgstAmountPaise: i.sgstAmountPaise,
            igstRate: i.igstRate,
            igstAmountPaise: i.igstAmountPaise,
            totalAmountPaise: i.totalAmountPaise,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Immutable Audit Log
    await db.financialAuditLog.create({
      data: {
        action: input.issueImmediately ? "INVOICE_ISSUED" : "INVOICE_CREATED",
        entityType: "GstInvoice",
        entityId: invoice.id,
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        actorRole: actor.roleCode,
        newState: {
          invoiceNumber: invoice.invoiceNumber,
          grandTotalPaise: invoice.grandTotalPaise,
          customerName: invoice.customerName,
          status: invoice.status,
        },
        ipAddress: ipAddress || null,
      },
    });

    // If issued immediately, post General Ledger entries
    if (input.issueImmediately) {
      await this.postInvoiceToGeneralLedger(invoice, actor.id);
    }

    return invoice;
  }

  /**
   * Issues a previously created draft invoice and posts to the double-entry ledger
   */
  public static async issueDraftInvoice(
    actor: AuthenticatedUser,
    invoiceId: string,
    ipAddress?: string
  ) {
    const allowedRoles: UserRoleCode[] = [
      UserRoleCode.SUPER_ADMIN,
      UserRoleCode.DIRECTOR,
      UserRoleCode.ADMIN,
      UserRoleCode.ACCOUNTANT,
    ];

    if (!allowedRoles.includes(actor.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to issue formal GST invoices.",
      });
    }

    const invoice = await db.gstInvoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) {
      throw new TRPCError({ code: "NOT_FOUND", message: "GST invoice not found." });
    }

    if (invoice.status !== GstInvoiceStatus.DRAFT) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invoice is already in status: ${invoice.status}`,
      });
    }

    const updated = await db.gstInvoice.update({
      where: { id: invoiceId },
      data: {
        status: GstInvoiceStatus.ISSUED,
        issuedAt: new Date(),
        approvedById: actor.id,
      },
      include: { items: true },
    });

    await db.financialAuditLog.create({
      data: {
        action: "INVOICE_ISSUED",
        entityType: "GstInvoice",
        entityId: invoice.id,
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        actorRole: actor.roleCode,
        previousState: { status: GstInvoiceStatus.DRAFT },
        newState: { status: GstInvoiceStatus.ISSUED, issuedAt: updated.issuedAt },
        ipAddress: ipAddress || null,
      },
    });

    await this.postInvoiceToGeneralLedger(updated, actor.id);

    return updated;
  }

  /**
   * Posts balanced double-entry accounting records to GeneralLedgerEntry
   */
  public static async postInvoiceToGeneralLedger(invoice: any, actorId: string) {
    const entries: any[] = [];
    const date = invoice.issuedAt || invoice.invoiceDate || new Date();
    const fYear = invoice.invoiceSeries?.includes("2026") ? "2025-26" : "2025-26";

    // 1. Debit Accounts Receivable (Total Invoiced Value)
    entries.push({
      entryNumber: `GLE-${invoice.invoiceNumber}-AR`,
      entryDate: date,
      accountCode: "AR-CUSTOMERS",
      accountName: "Accounts Receivable — Customers & Students",
      debitPaise: invoice.grandTotalPaise,
      creditPaise: 0,
      sourceDocumentType: "GST_INVOICE",
      sourceDocumentId: invoice.id,
      description: `Invoiced to ${invoice.customerName} (${invoice.invoiceNumber})`,
      financialYear: fYear,
      createdById: actorId,
    });

    // 2. Credit Revenue (Taxable Amount)
    entries.push({
      entryNumber: `GLE-${invoice.invoiceNumber}-REV`,
      entryDate: date,
      accountCode: "REV-SERVICES",
      accountName: "Institutional Revenue — Tuition, Training & IT Services",
      debitPaise: 0,
      creditPaise: invoice.taxableAmountPaise,
      sourceDocumentType: "GST_INVOICE",
      sourceDocumentId: invoice.id,
      description: `Sales revenue for ${invoice.invoiceNumber}`,
      financialYear: fYear,
      createdById: actorId,
    });

    // 3. Credit Output Tax Liabilities
    if (invoice.cgstAmountPaise > 0) {
      entries.push({
        entryNumber: `GLE-${invoice.invoiceNumber}-CGST`,
        entryDate: date,
        accountCode: "GST-OUT-CGST",
        accountName: "Output CGST Payable",
        debitPaise: 0,
        creditPaise: invoice.cgstAmountPaise,
        sourceDocumentType: "GST_INVOICE",
        sourceDocumentId: invoice.id,
        description: `Output CGST for ${invoice.invoiceNumber}`,
        financialYear: fYear,
        createdById: actorId,
      });
    }

    if (invoice.sgstAmountPaise > 0) {
      entries.push({
        entryNumber: `GLE-${invoice.invoiceNumber}-SGST`,
        entryDate: date,
        accountCode: "GST-OUT-SGST",
        accountName: "Output SGST Payable",
        debitPaise: 0,
        creditPaise: invoice.sgstAmountPaise,
        sourceDocumentType: "GST_INVOICE",
        sourceDocumentId: invoice.id,
        description: `Output SGST for ${invoice.invoiceNumber}`,
        financialYear: fYear,
        createdById: actorId,
      });
    }

    if (invoice.igstAmountPaise > 0) {
      entries.push({
        entryNumber: `GLE-${invoice.invoiceNumber}-IGST`,
        entryDate: date,
        accountCode: "GST-OUT-IGST",
        accountName: "Output IGST Payable",
        debitPaise: 0,
        creditPaise: invoice.igstAmountPaise,
        sourceDocumentType: "GST_INVOICE",
        sourceDocumentId: invoice.id,
        description: `Output IGST for ${invoice.invoiceNumber}`,
        financialYear: fYear,
        createdById: actorId,
      });
    }

    // 4. Round off if present
    if (invoice.roundOffPaise !== 0) {
      entries.push({
        entryNumber: `GLE-${invoice.invoiceNumber}-RND`,
        entryDate: date,
        accountCode: "ROUND-OFF",
        accountName: "Rounding Off Adjustment",
        debitPaise: invoice.roundOffPaise < 0 ? Math.abs(invoice.roundOffPaise) : 0,
        creditPaise: invoice.roundOffPaise > 0 ? invoice.roundOffPaise : 0,
        sourceDocumentType: "GST_INVOICE",
        sourceDocumentId: invoice.id,
        description: `Rounding off for ${invoice.invoiceNumber}`,
        financialYear: fYear,
        createdById: actorId,
      });
    }

    for (const entry of entries) {
      await db.generalLedgerEntry.upsert({
        where: { entryNumber: entry.entryNumber },
        create: entry,
        update: entry,
      });
    }
  }

  /**
   * Records a payment against an issued GST invoice
   */
  public static async recordInvoicePayment(
    actor: AuthenticatedUser,
    params: {
      invoiceId: string;
      amountPaise: number;
      paymentMethod: PaymentMethod;
      paymentReference?: string;
      paymentDate?: Date;
      notes?: string;
    },
    ipAddress?: string
  ) {
    const invoice = await db.gstInvoice.findUnique({
      where: { id: params.invoiceId },
    });

    if (!invoice) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
    }

    if (invoice.status === GstInvoiceStatus.CANCELLED) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot record payment on a cancelled invoice.",
      });
    }

    if (params.amountPaise <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment amount must be greater than zero.",
      });
    }

    const newPaidPaise = invoice.paidAmountPaise + params.amountPaise;
    const newBalancePaise = Math.max(0, invoice.grandTotalPaise - newPaidPaise);
    const newStatus =
      newBalancePaise === 0 ? GstInvoiceStatus.PAID : GstInvoiceStatus.PARTIALLY_PAID;

    const updated = await db.gstInvoice.update({
      where: { id: params.invoiceId },
      data: {
        paidAmountPaise: newPaidPaise,
        balanceAmountPaise: newBalancePaise,
        status: newStatus,
        paymentReference: params.paymentReference || invoice.paymentReference,
      },
    });

    // General ledger cash inflow entry
    const pDate = params.paymentDate || new Date();
    await db.generalLedgerEntry.create({
      data: {
        entryNumber: `GLE-PAY-${invoice.invoiceNumber}-${Date.now().toString().slice(-4)}`,
        entryDate: pDate,
        accountCode: "CASH-BANK",
        accountName: "Cash & Bank Balances",
        debitPaise: params.amountPaise,
        creditPaise: 0,
        sourceDocumentType: "GST_INVOICE_PAYMENT",
        sourceDocumentId: invoice.id,
        description: `Payment received for ${invoice.invoiceNumber} via ${params.paymentMethod}`,
        financialYear: "2025-26",
        createdById: actor.id,
      },
    });

    await db.generalLedgerEntry.create({
      data: {
        entryNumber: `GLE-REC-${invoice.invoiceNumber}-${Date.now().toString().slice(-4)}`,
        entryDate: pDate,
        accountCode: "AR-CUSTOMERS",
        accountName: "Accounts Receivable — Customers & Students",
        debitPaise: 0,
        creditPaise: params.amountPaise,
        sourceDocumentType: "GST_INVOICE_PAYMENT",
        sourceDocumentId: invoice.id,
        description: `Receivable reduction for ${invoice.invoiceNumber}`,
        financialYear: "2025-26",
        createdById: actor.id,
      },
    });

    await db.financialAuditLog.create({
      data: {
        action: "PAYMENT_RECORDED",
        entityType: "GstInvoice",
        entityId: invoice.id,
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        actorRole: actor.roleCode,
        previousState: {
          paidAmountPaise: invoice.paidAmountPaise,
          balanceAmountPaise: invoice.balanceAmountPaise,
        },
        newState: {
          paidAmountPaise: newPaidPaise,
          balanceAmountPaise: newBalancePaise,
          status: newStatus,
        },
        notes: params.notes || null,
        ipAddress: ipAddress || null,
      },
    });

    return updated;
  }

  /**
   * Controlled cancellation with mandatory reason and ledger reversal
   */
  public static async cancelInvoice(
    actor: AuthenticatedUser,
    invoiceId: string,
    cancelReason: string,
    ipAddress?: string
  ) {
    if (!["SUPER_ADMIN", "DIRECTOR", "ADMIN"].includes(actor.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only directors and super administrators can cancel issued GST invoices.",
      });
    }

    const invoice = await db.gstInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
    }

    if (invoice.status === GstInvoiceStatus.CANCELLED) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invoice is already cancelled." });
    }

    if (invoice.paidAmountPaise > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Invoice has payments recorded. Issue a Credit Note or refund payment before cancelling.",
      });
    }

    const updated = await db.gstInvoice.update({
      where: { id: invoiceId },
      data: {
        status: GstInvoiceStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: cancelReason.trim(),
      },
    });

    // Reversal entries in general ledger
    const now = new Date();
    await db.generalLedgerEntry.create({
      data: {
        entryNumber: `GLE-REV-${invoice.invoiceNumber}-CAN`,
        entryDate: now,
        accountCode: "AR-CUSTOMERS",
        accountName: "Accounts Receivable — Reversal",
        debitPaise: 0,
        creditPaise: invoice.grandTotalPaise,
        sourceDocumentType: "GST_INVOICE_CANCEL",
        sourceDocumentId: invoice.id,
        description: `Cancellation of ${invoice.invoiceNumber}: ${cancelReason}`,
        financialYear: "2025-26",
        createdById: actor.id,
      },
    });

    await db.financialAuditLog.create({
      data: {
        action: "INVOICE_CANCELLED",
        entityType: "GstInvoice",
        entityId: invoice.id,
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        actorRole: actor.roleCode,
        previousState: { status: invoice.status },
        newState: { status: GstInvoiceStatus.CANCELLED, cancelReason },
        notes: cancelReason,
        ipAddress: ipAddress || null,
      },
    });

    return updated;
  }

  /**
   * Search and filter GST sales invoices
   */
  public static async listInvoices(
    actor: AuthenticatedUser,
    params: {
      status?: GstInvoiceStatus;
      customerType?: GstCustomerType;
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

    if (params.status) where.status = params.status;
    if (params.customerType) where.customerType = params.customerType;

    if (params.startDate || params.endDate) {
      where.invoiceDate = {};
      if (params.startDate) where.invoiceDate.gte = params.startDate;
      if (params.endDate) where.invoiceDate.lte = params.endDate;
    }

    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { invoiceNumber: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerGstin: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q, mode: "insensitive" } },
        { customerEmail: { contains: q, mode: "insensitive" } },
      ];
    }

    const [invoices, totalCount] = await Promise.all([
      db.gstInvoice.findMany({
        where,
        include: {
          items: true,
          creditDebitNotes: true,
        },
        orderBy: { invoiceDate: "desc" },
        skip,
        take: limit,
      }),
      db.gstInvoice.count({ where }),
    ]);

    return {
      invoices,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  /**
   * Get single invoice with complete item details and calculations
   */
  public static async getInvoice(actor: AuthenticatedUser, invoiceId: string) {
    const invoice = await db.gstInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        creditDebitNotes: true,
      },
    });

    if (!invoice) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
    }

    return invoice;
  }

  /**
   * Automatically ensures a statutory GST Invoice exists for any verified payment (online or offline),
   * settles balances, records balanced General Ledger postings, and links the payment transaction.
   */
  public static async ensureAndSettleInvoiceForPayment(
    tx: Prisma.TransactionClient,
    params: {
      paymentTransactionId: string;
      amountPaise: number;
      paymentMethod: PaymentMethod;
      paymentReference: string;
      paidAt?: Date;
      admissionId?: string | null;
      feeStructureId?: string | null;
      installmentId?: string | null;
      studentId?: string | null;
      invoiceId?: string | null;
      customerName: string;
      customerEmail?: string | null;
      customerPhone?: string | null;
      customerState?: string | null;
      customerStateCode?: string | null;
      courseTitle?: string | null;
      hsnSacCode?: string;
      isTaxInclusive?: boolean;
      gatewayFeePaise?: number;
      gatewayTaxPaise?: number;
      createdById?: string | null;
    }
  ) {
    const paidDate = params.paidAt || new Date();
    let invoice = null;

    // 1. Try to find an existing invoice
    if (params.invoiceId) {
      invoice = await tx.gstInvoice.findUnique({
        where: { id: params.invoiceId },
      });
    }

    if (!invoice && params.admissionId) {
      invoice = await tx.gstInvoice.findFirst({
        where: { admissionId: params.admissionId, status: { not: GstInvoiceStatus.CANCELLED } },
      });
    }

    if (!invoice && params.feeStructureId) {
      invoice = await tx.gstInvoice.findFirst({
        where: { feeStructureId: params.feeStructureId, status: { not: GstInvoiceStatus.CANCELLED } },
      });
    }

    // 2. If invoice exists, update paidAmount & balance
    if (invoice) {
      const newPaid = invoice.paidAmountPaise + params.amountPaise;
      const newBalance = Math.max(0, invoice.grandTotalPaise - newPaid);
      const newStatus = newBalance === 0 ? GstInvoiceStatus.PAID : GstInvoiceStatus.PARTIALLY_PAID;

      invoice = await tx.gstInvoice.update({
        where: { id: invoice.id },
        data: {
          paidAmountPaise: newPaid,
          balanceAmountPaise: newBalance,
          status: newStatus,
          paymentReference: params.paymentReference,
        },
      });
    } else {
      // 3. Generate authoritative new invoice
      const seqSetting = await tx.financeSettings.upsert({
        where: { id: "default" },
        update: { invoiceNextSequence: { increment: 1 } },
        create: {
          id: "default",
          invoicePrefix: "SLG-INV-",
          invoiceNextSequence: 2,
        },
      });

      const seq = seqSetting.invoiceNextSequence - 1;
      const year = new Date().getFullYear();
      const series = `${seqSetting.invoicePrefix || "SLG-INV-"}${year}`;
      const invoiceNumber = `${series}-${String(seq).padStart(4, "0")}`;

      const stateCode = (params.customerStateCode || this.DEFAULT_COMPANY_STATE_CODE).trim().padStart(2, "0");
      const hsn = params.hsnSacCode || "999293";
      const isTaxInclusive = params.isTaxInclusive ?? true;

      const taxResult = CentralGstTaxEngine.calculateTax({
        placeOfSupplyStateCode: stateCode,
        items: [
          {
            itemType: InvoiceItemType.COURSE_TUITION,
            description: params.courseTitle || "Professional Training & Educational Services",
            hsnSacCode: hsn,
            quantity: 1,
            ratePaise: params.amountPaise,
            isTaxInclusive,
            taxCategory: GstTaxCategory.STANDARD_TAXABLE,
          },
        ],
      });

      invoice = await tx.gstInvoice.create({
        data: {
          invoiceNumber,
          invoiceSeries: series,
          sequenceNumber: seq,
          invoiceDate: paidDate,
          dueDate: paidDate,
          status: GstInvoiceStatus.PAID,
          customerType: GstCustomerType.B2C_UNREGISTERED,
          customerName: params.customerName.trim(),
          customerEmail: params.customerEmail?.trim() || null,
          customerPhone: params.customerPhone?.trim() || null,
          customerState: params.customerState?.trim() || this.DEFAULT_COMPANY_STATE,
          customerStateCode: stateCode,
          placeOfSupply: `${stateCode}-${params.customerState || this.DEFAULT_COMPANY_STATE}`,
          isInterState: taxResult.isInterState,
          companyLegalName: this.DEFAULT_COMPANY_NAME,
          companyGstin: this.DEFAULT_COMPANY_GSTIN,
          companyAddress: this.DEFAULT_COMPANY_ADDRESS,
          companyState: this.DEFAULT_COMPANY_STATE,
          companyStateCode: this.DEFAULT_COMPANY_STATE_CODE,
          currency: "INR",

          subtotalPaise: taxResult.subtotalPaise,
          discountPaise: taxResult.discountPaise,
          taxableAmountPaise: taxResult.taxableAmountPaise,
          cgstAmountPaise: taxResult.cgstAmountPaise,
          sgstAmountPaise: taxResult.sgstAmountPaise,
          igstAmountPaise: taxResult.igstAmountPaise,
          totalTaxPaise: taxResult.totalTaxPaise,
          roundOffPaise: taxResult.roundOffPaise,
          grandTotalPaise: taxResult.grandTotalPaise,
          paidAmountPaise: params.amountPaise,
          balanceAmountPaise: Math.max(0, taxResult.grandTotalPaise - params.amountPaise),

          studentId: params.studentId || null,
          admissionId: params.admissionId || null,
          feeStructureId: params.feeStructureId || null,
          paymentReference: params.paymentReference,
          paymentTerms: "Paid via Razorpay Checkout",
          issuedAt: paidDate,
          createdById: params.createdById || null,

          items: {
            create: taxResult.items.map((i) => ({
              itemType: i.itemType,
              description: i.description,
              hsnSacCode: i.hsnSacCode,
              quantity: i.quantity,
              unit: i.unit,
              ratePaise: i.ratePaise,
              discountPaise: i.discountPaise,
              taxableAmountPaise: i.taxableAmountPaise,
              gstRate: i.gstRate,
              cgstRate: i.cgstRate,
              cgstAmountPaise: i.cgstAmountPaise,
              sgstRate: i.sgstRate,
              sgstAmountPaise: i.sgstAmountPaise,
              igstRate: i.igstRate,
              igstAmountPaise: i.igstAmountPaise,
              totalAmountPaise: i.totalAmountPaise,
              isTaxInclusive: i.isTaxInclusive,
              taxCategory: i.taxCategory,
            })),
          },
        },
      });

      // Post Revenue Recognition in General Ledger
      await tx.generalLedgerEntry.create({
        data: {
          entryNumber: `GLE-AR-${invoice.invoiceNumber}`,
          entryDate: paidDate,
          accountCode: "AR-CUSTOMERS",
          accountName: "Accounts Receivable — Customers & Students",
          debitPaise: taxResult.grandTotalPaise,
          creditPaise: 0,
          sourceDocumentType: "GST_INVOICE",
          sourceDocumentId: invoice.id,
          description: `Receivable for ${invoice.invoiceNumber} - ${params.customerName}`,
          financialYear: "2025-26",
          createdById: params.createdById || null,
        },
      });

      await tx.generalLedgerEntry.create({
        data: {
          entryNumber: `GLE-REV-${invoice.invoiceNumber}`,
          entryDate: paidDate,
          accountCode: "REV-TUITION",
          accountName: "Course Tuition & Educational Revenue",
          debitPaise: 0,
          creditPaise: taxResult.taxableAmountPaise,
          sourceDocumentType: "GST_INVOICE",
          sourceDocumentId: invoice.id,
          description: `Revenue recognized for ${invoice.invoiceNumber}`,
          financialYear: "2025-26",
          createdById: params.createdById || null,
        },
      });

      if (taxResult.isInterState && taxResult.igstAmountPaise > 0) {
        await tx.generalLedgerEntry.create({
          data: {
            entryNumber: `GLE-IGST-${invoice.invoiceNumber}`,
            entryDate: paidDate,
            accountCode: "TAX-IGST-PAYABLE",
            accountName: "Output IGST Liability",
            debitPaise: 0,
            creditPaise: taxResult.igstAmountPaise,
            sourceDocumentType: "GST_INVOICE",
            sourceDocumentId: invoice.id,
            description: `Output IGST for ${invoice.invoiceNumber}`,
            financialYear: "2025-26",
            createdById: params.createdById || null,
          },
        });
      } else if (!taxResult.isInterState && taxResult.totalTaxPaise > 0) {
        await tx.generalLedgerEntry.create({
          data: {
            entryNumber: `GLE-CGST-${invoice.invoiceNumber}`,
            entryDate: paidDate,
            accountCode: "TAX-CGST-PAYABLE",
            accountName: "Output CGST Liability",
            debitPaise: 0,
            creditPaise: taxResult.cgstAmountPaise,
            sourceDocumentType: "GST_INVOICE",
            sourceDocumentId: invoice.id,
            description: `Output CGST for ${invoice.invoiceNumber}`,
            financialYear: "2025-26",
            createdById: params.createdById || null,
          },
        });

        await tx.generalLedgerEntry.create({
          data: {
            entryNumber: `GLE-SGST-${invoice.invoiceNumber}`,
            entryDate: paidDate,
            accountCode: "TAX-SGST-PAYABLE",
            accountName: "Output SGST Liability",
            debitPaise: 0,
            creditPaise: taxResult.sgstAmountPaise,
            sourceDocumentType: "GST_INVOICE",
            sourceDocumentId: invoice.id,
            description: `Output SGST for ${invoice.invoiceNumber}`,
            financialYear: "2025-26",
            createdById: params.createdById || null,
          },
        });
      }
    }

    // 4. Post Cash Receipt in General Ledger
    await tx.generalLedgerEntry.create({
      data: {
        entryNumber: `GLE-PAY-${invoice.invoiceNumber}-${Date.now().toString().slice(-4)}`,
        entryDate: paidDate,
        accountCode: "CASH-BANK",
        accountName: "Cash & Bank Balances (Razorpay Gateway)",
        debitPaise: params.amountPaise,
        creditPaise: 0,
        sourceDocumentType: "GST_INVOICE_PAYMENT",
        sourceDocumentId: invoice.id,
        description: `Payment confirmed for ${invoice.invoiceNumber} via ${params.paymentMethod}`,
        financialYear: "2025-26",
        createdById: params.createdById || null,
      },
    });

    await tx.generalLedgerEntry.create({
      data: {
        entryNumber: `GLE-REC-${invoice.invoiceNumber}-${Date.now().toString().slice(-4)}`,
        entryDate: paidDate,
        accountCode: "AR-CUSTOMERS",
        accountName: "Accounts Receivable — Customers & Students",
        debitPaise: 0,
        creditPaise: params.amountPaise,
        sourceDocumentType: "GST_INVOICE_PAYMENT",
        sourceDocumentId: invoice.id,
        description: `Receivable reduction for ${invoice.invoiceNumber}`,
        financialYear: "2025-26",
        createdById: params.createdById || null,
      },
    });

    // 5. If Payment Gateway Fee is recorded, post provider charge & GST on fee
    const gatewayFee = params.gatewayFeePaise || 0;
    const gatewayTax = params.gatewayTaxPaise || 0;
    if (gatewayFee > 0) {
      await tx.generalLedgerEntry.create({
        data: {
          entryNumber: `GLE-GW-EXP-${invoice.invoiceNumber}-${Date.now().toString().slice(-4)}`,
          entryDate: paidDate,
          accountCode: "EXP-GATEWAY-FEES",
          accountName: "Payment Gateway Commission & Processing Charges",
          debitPaise: gatewayFee,
          creditPaise: 0,
          sourceDocumentType: "GATEWAY_FEE",
          sourceDocumentId: invoice.id,
          description: `Gateway fee for payment on ${invoice.invoiceNumber}`,
          financialYear: "2025-26",
          createdById: params.createdById || null,
        },
      });

      if (gatewayTax > 0) {
        await tx.generalLedgerEntry.create({
          data: {
            entryNumber: `GLE-GW-ITC-${invoice.invoiceNumber}-${Date.now().toString().slice(-4)}`,
            entryDate: paidDate,
            accountCode: "ITC-CGST",
            accountName: "Input Tax Credit — CGST on Gateway Fees",
            debitPaise: Math.round(gatewayTax / 2),
            creditPaise: 0,
            sourceDocumentType: "GATEWAY_FEE",
            sourceDocumentId: invoice.id,
            description: `ITC CGST on payment gateway fee for ${invoice.invoiceNumber}`,
            financialYear: "2025-26",
            createdById: params.createdById || null,
          },
        });

        await tx.generalLedgerEntry.create({
          data: {
            entryNumber: `GLE-GW-ITS-${invoice.invoiceNumber}-${Date.now().toString().slice(-4)}`,
            entryDate: paidDate,
            accountCode: "ITC-SGST",
            accountName: "Input Tax Credit — SGST on Gateway Fees",
            debitPaise: gatewayTax - Math.round(gatewayTax / 2),
            creditPaise: 0,
            sourceDocumentType: "GATEWAY_FEE",
            sourceDocumentId: invoice.id,
            description: `ITC SGST on payment gateway fee for ${invoice.invoiceNumber}`,
            financialYear: "2025-26",
            createdById: params.createdById || null,
          },
        });
      }

      await tx.generalLedgerEntry.create({
        data: {
          entryNumber: `GLE-GW-DED-${invoice.invoiceNumber}-${Date.now().toString().slice(-4)}`,
          entryDate: paidDate,
          accountCode: "CASH-BANK",
          accountName: "Cash & Bank Balances (Gateway Commission Deduction)",
          debitPaise: 0,
          creditPaise: gatewayFee + gatewayTax,
          sourceDocumentType: "GATEWAY_FEE",
          sourceDocumentId: invoice.id,
          description: `Direct deduction for gateway charges on ${invoice.invoiceNumber}`,
          financialYear: "2025-26",
          createdById: params.createdById || null,
        },
      });
    }

    // 6. Link Payment Transaction with the Invoice
    await tx.paymentTransaction.update({
      where: { id: params.paymentTransactionId },
      data: {
        invoiceId: invoice.id,
        gatewayFeePaise: gatewayFee,
        gatewayTaxPaise: gatewayTax,
      },
    });

    return invoice;
  }
}
