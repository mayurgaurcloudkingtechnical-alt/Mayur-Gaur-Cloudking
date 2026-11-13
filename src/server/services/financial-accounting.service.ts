import { db } from "@/server/db/client";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";
import {
  GstInvoiceStatus,
  VendorBillStatus,
  ExpenseApprovalStatus,
  PaymentTransactionStatus,
  UserRoleCode,
} from "@prisma/client";

export interface PnLFilterInput {
  startDate?: Date;
  endDate?: Date;
  department?: string;
  costCenter?: string;
  reportingBasis?: "ACCRUAL" | "CASH_PROVISIONAL";
}

export class FinancialAccountingService {
  /**
   * Executive Finance Dashboard Metrics with Month & Year Filtering.
   */
  public static async getDashboardMetrics(
    actor: AuthenticatedUser,
    filter?: { month?: number; year?: number }
  ) {
    const isSuperOrDirector = ["SUPER_ADMIN", "DIRECTOR"].includes(actor.roleCode);
    const isAccountant = actor.roleCode === "ACCOUNTANT";
    const isManager = actor.roleCode === "MANAGER";

    if (!isSuperOrDirector && !isAccountant && !isManager) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to view institutional finance metrics.",
      });
    }

    const [
      gstInvoices,
      payments,
      vendorBills,
      expenses,
      feeStructures,
      pendingApprovalsCount,
      costCentreBudgets,
    ] = await Promise.all([
      db.gstInvoice.findMany({
        select: {
          grandTotalPaise: true,
          taxableAmountPaise: true,
          totalTaxPaise: true,
          cgstAmountPaise: true,
          sgstAmountPaise: true,
          igstAmountPaise: true,
          paidAmountPaise: true,
          balanceAmountPaise: true,
          status: true,
          dueDate: true,
          invoiceDate: true,
          createdAt: true,
        },
      }),
      db.paymentTransaction.findMany({
        where: { status: PaymentTransactionStatus.SUCCESS },
        select: {
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          createdAt: true,
        },
      }),
      db.vendorBill.findMany({
        select: {
          totalAmountPaise: true,
          taxableAmountPaise: true,
          totalTaxPaise: true,
          paidAmountPaise: true,
          balanceAmountPaise: true,
          isItcEligible: true,
          status: true,
          dueDate: true,
          invoiceDate: true,
          createdAt: true,
        },
      }),
      db.expense.findMany({
        select: {
          amountPaise: true,
          category: true,
          status: true,
          paymentMethod: true,
          expenseDate: true,
          createdAt: true,
        },
      }),
      db.feeStructure.findMany({
        select: {
          totalCourseFee: true,
          netPayableAmount: true,
          paidAmount: true,
          pendingAmount: true,
          paymentStatus: true,
          createdAt: true,
        },
      }),
      db.financialApproval.count({
        where: { status: "PENDING" },
      }),
      db.costCentreBudget.findMany({
        where: { isActive: true },
      }),
    ]);

    const now = new Date();

    // 1. Invoiced Sales
    const issuedOrPaidInvoices = gstInvoices.filter(
      (inv) => inv.status !== GstInvoiceStatus.DRAFT && inv.status !== GstInvoiceStatus.CANCELLED
    );
    const totalInvoicedSalesPaise = issuedOrPaidInvoices.reduce((a, b) => a + b.grandTotalPaise, 0);
    const totalTaxableSalesPaise = issuedOrPaidInvoices.reduce((a, b) => a + b.taxableAmountPaise, 0);

    // 2. Confirmed Collections (from verified PaymentTransactions)
    const totalCollectionsPaise = payments.reduce((a, b) => a + b.amount, 0);

    // 3. Outstanding & Overdue Receivables
    const invoiceReceivablesPaise = issuedOrPaidInvoices.reduce((a, b) => a + b.balanceAmountPaise, 0);
    const feeReceivablesPaise = feeStructures.reduce((a, b) => a + b.pendingAmount, 0);
    const totalReceivablesPaise = Math.max(invoiceReceivablesPaise, feeReceivablesPaise);

    const overdueReceivablesPaise = issuedOrPaidInvoices
      .filter((inv) => inv.balanceAmountPaise > 0 && new Date(inv.dueDate) < now)
      .reduce((a, b) => a + b.balanceAmountPaise, 0);

    // Total Business Contracted (Total Kitna Hua = Received + Pending)
    const feeStructuresTotalPaise = feeStructures.reduce((a, b) => a + (b.netPayableAmount || b.totalCourseFee || 0), 0);
    const totalBusinessPaise = Math.max(feeStructuresTotalPaise, totalCollectionsPaise + totalReceivablesPaise);

    // 4. Vendor Bills & Outstanding Payables
    const approvedBills = vendorBills.filter(
      (b) =>
        b.status === VendorBillStatus.APPROVED ||
        b.status === VendorBillStatus.PAID ||
        b.status === VendorBillStatus.PARTIALLY_PAID
    );
    const totalVendorBillsPaise = approvedBills.reduce((a, b) => a + b.totalAmountPaise, 0);
    const totalPayablesPaise = approvedBills.reduce((a, b) => a + b.balanceAmountPaise, 0);

    // 5. Expenses
    const approvedExpenses = expenses.filter((e) => e.status === ExpenseApprovalStatus.APPROVED);
    const totalApprovedExpensesPaise = approvedExpenses.reduce((a, b) => a + b.amountPaise, 0);

    const pendingExpenses = expenses.filter((e) => e.status === ExpenseApprovalStatus.SUBMITTED);
    const pendingExpensesAmountPaise = pendingExpenses.reduce((a, b) => a + b.amountPaise, 0);

    // 6. GST Summary
    const outputGstPaise = issuedOrPaidInvoices.reduce((a, b) => a + b.totalTaxPaise, 0);
    const inputGstCandidatePaise = approvedBills
      .filter((b) => b.isItcEligible)
      .reduce((a, b) => a + b.totalTaxPaise, 0);
    const netGstLiabilityEstimatePaise = Math.max(0, outputGstPaise - inputGstCandidatePaise);

    // 7. Operating Profit / Loss Calculation
    // Accrual Basis: Taxable Revenue - Operating Expenses - Vendor Taxable Bills
    const vendorTaxablePaise = approvedBills.reduce((a, b) => a + b.taxableAmountPaise, 0);
    const grossRevenuePaise = Math.max(totalTaxableSalesPaise, totalCollectionsPaise);
    const totalOperatingCostPaise = totalApprovedExpensesPaise + vendorTaxablePaise;
    const operatingProfitPaise = grossRevenuePaise - totalOperatingCostPaise;

    // Cash Flow Estimate
    const cashOutflowPaise =
      approvedBills.reduce((a, b) => a + b.paidAmountPaise, 0) + totalApprovedExpensesPaise;
    const netCashMovementPaise = totalCollectionsPaise - cashOutflowPaise;

    // Budget vs Actual
    const totalAllocatedBudgetPaise = costCentreBudgets.reduce((a, b) => a + b.allocatedAmountPaise, 0);
    const totalUtilizedBudgetPaise = costCentreBudgets.reduce((a, b) => a + b.utilizedAmountPaise, 0);

    // ==============================================================
    // 8. PERIOD-SPECIFIC & MONTH-WISE BREAKDOWN CALCULATIONS
    // ==============================================================
    const filterYear = filter?.year || now.getFullYear();
    const filterMonth = filter?.month; // 1-12 or undefined for whole year
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthFullNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const isMatchPeriod = (rawDate: Date | string | null | undefined): boolean => {
      if (!rawDate) return false;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;
      if (d.getFullYear() !== filterYear) return false;
      if (filterMonth !== undefined && filterMonth >= 1 && filterMonth <= 12) {
        return d.getMonth() === filterMonth - 1;
      }
      return true;
    };

    const selectedPeriodLabel =
      filterMonth !== undefined && filterMonth >= 1 && filterMonth <= 12
        ? `${monthFullNames[filterMonth - 1]} ${filterYear}`
        : `Full Year ${filterYear}`;

    // Filter period records
    const periodInvoiced = issuedOrPaidInvoices.filter((inv) =>
      isMatchPeriod(inv.invoiceDate || inv.createdAt)
    );
    const periodInvoicedSalesPaise = periodInvoiced.reduce((a, b) => a + b.grandTotalPaise, 0);
    const periodTaxableSalesPaise = periodInvoiced.reduce((a, b) => a + b.taxableAmountPaise, 0);
    const periodInvoiceCount = periodInvoiced.length;

    const periodPayments = payments.filter((p) =>
      isMatchPeriod(p.paymentDate || p.createdAt)
    );
    const periodCollectionsPaise = periodPayments.reduce((a, b) => a + b.amount, 0);
    const periodTransactionCount = periodPayments.length;

    const periodBills = approvedBills.filter((b) =>
      isMatchPeriod(b.invoiceDate || b.createdAt)
    );
    const periodVendorBillsPaise = periodBills.reduce((a, b) => a + b.totalAmountPaise, 0);
    const periodBillsPaidPaise = periodBills.reduce((a, b) => a + b.paidAmountPaise, 0);

    const periodExpenses = approvedExpenses.filter((e) =>
      isMatchPeriod(e.expenseDate || e.createdAt)
    );
    const periodExpensesPaise = periodExpenses.reduce((a, b) => a + b.amountPaise, 0);

    const periodNetSurplusPaise = periodCollectionsPaise - (periodExpensesPaise + periodBillsPaidPaise);
    const periodOperatingCostPaise = periodExpensesPaise + periodBills.reduce((a, b) => a + b.taxableAmountPaise, 0);
    const periodOperatingProfitPaise = Math.max(periodTaxableSalesPaise, periodCollectionsPaise) - periodOperatingCostPaise;

    // Monthly breakdown for all 12 months of filterYear
    const monthlyBreakdown = Array.from({ length: 12 }, (_, m) => {
      const mInvoices = issuedOrPaidInvoices.filter((inv) => {
        const d = new Date(inv.invoiceDate || inv.createdAt);
        return d.getFullYear() === filterYear && d.getMonth() === m;
      });
      const mPayments = payments.filter((p) => {
        const d = new Date(p.paymentDate || p.createdAt);
        return d.getFullYear() === filterYear && d.getMonth() === m;
      });
      const mExpenses = approvedExpenses.filter((e) => {
        const d = new Date(e.expenseDate || e.createdAt);
        return d.getFullYear() === filterYear && d.getMonth() === m;
      });
      const mBills = approvedBills.filter((b) => {
        const d = new Date(b.invoiceDate || b.createdAt);
        return d.getFullYear() === filterYear && d.getMonth() === m;
      });

      const invoicedPaise = mInvoices.reduce((a, b) => a + b.grandTotalPaise, 0);
      const taxablePaise = mInvoices.reduce((a, b) => a + b.taxableAmountPaise, 0);
      const collectionsPaise = mPayments.reduce((a, b) => a + b.amount, 0);
      const expensesPaise = mExpenses.reduce((a, b) => a + b.amountPaise, 0);
      const billsPaidPaise = mBills.reduce((a, b) => a + b.paidAmountPaise, 0);
      const netSurplusPaise = collectionsPaise - (expensesPaise + billsPaidPaise);

      return {
        month: m + 1,
        monthName: monthNames[m],
        monthFullName: monthFullNames[m],
        year: filterYear,
        invoicedSalesPaise: invoicedPaise,
        taxableSalesPaise: taxablePaise,
        collectionsPaise,
        expensesPaise,
        billsPaidPaise,
        netSurplusPaise,
        invoiceCount: mInvoices.length,
        transactionCount: mPayments.length,
      };
    });

    return {
      totalBusinessPaise,
      totalInvoicedSalesPaise,
      totalTaxableSalesPaise,
      totalCollectionsPaise,
      totalReceivablesPaise,
      overdueReceivablesPaise,
      totalVendorBillsPaise,
      totalPayablesPaise,
      totalApprovedExpensesPaise,
      pendingApprovalsCount,
      pendingExpensesAmountPaise,
      outputGstPaise,
      inputGstCandidatePaise,
      netGstLiabilityEstimatePaise,
      operatingProfitPaise,
      netCashMovementPaise,
      totalAllocatedBudgetPaise,
      totalUtilizedBudgetPaise,
      invoiceCount: issuedOrPaidInvoices.length,
      vendorBillCount: approvedBills.length,
      expenseCount: approvedExpenses.length,
      // Month & Year Filter outputs
      selectedMonth: filterMonth || null,
      selectedYear: filterYear,
      selectedPeriodLabel,
      periodInvoicedSalesPaise,
      periodTaxableSalesPaise,
      periodCollectionsPaise,
      periodExpensesPaise,
      periodVendorBillsPaise,
      periodNetSurplusPaise,
      periodOperatingProfitPaise,
      periodInvoiceCount,
      periodTransactionCount,
      monthlyBreakdown,
    };
  }

  /**
   * Profit & Loss Statement (Monthly, Quarterly, Annual)
   */
  public static async getProfitAndLoss(actor: AuthenticatedUser, filters: PnLFilterInput) {
    const basis = filters.reportingBasis || "ACCRUAL";
    const dateFilter: any = {};
    if (filters.startDate) dateFilter.gte = filters.startDate;
    if (filters.endDate) dateFilter.lte = filters.endDate;

    const [invoices, payments, expenses, vendorBills] = await Promise.all([
      db.gstInvoice.findMany({
        where: {
          status: { in: [GstInvoiceStatus.ISSUED, GstInvoiceStatus.PAID, GstInvoiceStatus.PARTIALLY_PAID] },
          ...(Object.keys(dateFilter).length > 0 ? { invoiceDate: dateFilter } : {}),
        },
        include: { items: true },
      }),
      db.paymentTransaction.findMany({
        where: {
          status: PaymentTransactionStatus.SUCCESS,
          ...(Object.keys(dateFilter).length > 0 ? { paymentDate: dateFilter } : {}),
        },
      }),
      db.expense.findMany({
        where: {
          status: ExpenseApprovalStatus.APPROVED,
          ...(filters.department ? { department: filters.department } : {}),
          ...(filters.costCenter ? { costCenter: filters.costCenter } : {}),
          ...(Object.keys(dateFilter).length > 0 ? { expenseDate: dateFilter } : {}),
        },
      }),
      db.vendorBill.findMany({
        where: {
          status: { in: [VendorBillStatus.APPROVED, VendorBillStatus.PAID, VendorBillStatus.PARTIALLY_PAID] },
          ...(filters.department ? { department: filters.department } : {}),
          ...(filters.costCenter ? { costCenter: filters.costCenter } : {}),
          ...(Object.keys(dateFilter).length > 0 ? { invoiceDate: dateFilter } : {}),
        },
      }),
    ]);

    // Revenue Breakup by Line of Business
    const revenueByStream: Record<string, number> = {
      COURSE_TUITION: 0,
      IT_SERVICES: 0,
      SOFTWARE_DEVELOPMENT: 0,
      NETWORK_AMC: 0,
      CONSULTING: 0,
      FRANCHISE_FEE: 0,
      CORPORATE_TRAINING: 0,
      OTHER: 0,
    };

    let totalTaxableRevenuePaise = 0;
    let totalOutputGstPaise = 0;

    for (const inv of invoices) {
      totalOutputGstPaise += inv.totalTaxPaise;
      for (const item of inv.items) {
        revenueByStream[item.itemType] = (revenueByStream[item.itemType] || 0) + item.taxableAmountPaise;
        totalTaxableRevenuePaise += item.taxableAmountPaise;
      }
    }

    // Cash Collections alternative for Cash Basis
    const totalCashCollectionsPaise = payments.reduce((acc, p) => acc + p.amount, 0);
    const recognizedRevenuePaise =
      basis === "ACCRUAL" ? totalTaxableRevenuePaise : totalCashCollectionsPaise;

    // Operating Expenses by Category
    const expensesByCategory: Record<string, number> = {};
    for (const exp of expenses) {
      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amountPaise;
    }

    // Vendor Bills added to Operating Overhead
    const vendorBillsTotalPaise = vendorBills.reduce((acc, b) => acc + b.taxableAmountPaise, 0);
    const totalOperatingExpensesPaise =
      expenses.reduce((acc, e) => acc + e.amountPaise, 0) + vendorBillsTotalPaise;

    const operatingProfitPaise = recognizedRevenuePaise - totalOperatingExpensesPaise;
    const operatingMarginPercentage =
      recognizedRevenuePaise > 0
        ? Math.round((operatingProfitPaise / recognizedRevenuePaise) * 10000) / 100
        : 0;

    // Input Tax Credit
    const eligibleItcPaise = vendorBills
      .filter((b) => b.isItcEligible)
      .reduce((acc, b) => acc + b.totalTaxPaise, 0);

    const netTaxLiabilityEstimatePaise = Math.max(0, totalOutputGstPaise - eligibleItcPaise);

    return {
      reportingBasis: basis,
      dateRange: {
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
      },
      revenue: {
        recognizedRevenuePaise,
        totalTaxableInvoicedPaise: totalTaxableRevenuePaise,
        totalCashCollectedPaise: totalCashCollectionsPaise,
        byStream: revenueByStream,
      },
      expenses: {
        totalOperatingExpensesPaise,
        vendorBillsTaxablePaise: vendorBillsTotalPaise,
        byCategory: expensesByCategory,
      },
      taxes: {
        outputGstPaise: totalOutputGstPaise,
        eligibleItcPaise,
        netTaxLiabilityEstimatePaise,
      },
      profitability: {
        operatingProfitPaise,
        operatingMarginPercentage,
        isProfitable: operatingProfitPaise >= 0,
      },
    };
  }

  /**
   * Cash Flow Statement (Inflows, Outflows, Net Cash)
   */
  public static async getCashFlow(
    actor: AuthenticatedUser,
    params: { startDate?: Date; endDate?: Date }
  ) {
    const dateFilter: any = {};
    if (params.startDate) dateFilter.gte = params.startDate;
    if (params.endDate) dateFilter.lte = params.endDate;

    const [payments, vendorBills, directExpenses] = await Promise.all([
      db.paymentTransaction.findMany({
        where: {
          status: PaymentTransactionStatus.SUCCESS,
          ...(Object.keys(dateFilter).length > 0 ? { paymentDate: dateFilter } : {}),
        },
      }),
      db.vendorBill.findMany({
        where: {
          paidAmountPaise: { gt: 0 },
          ...(Object.keys(dateFilter).length > 0 ? { paidAt: dateFilter } : {}),
        },
      }),
      db.expense.findMany({
        where: {
          status: ExpenseApprovalStatus.APPROVED,
          isClaim: false,
          ...(Object.keys(dateFilter).length > 0 ? { expenseDate: dateFilter } : {}),
        },
      }),
    ]);

    const cashInflowsPaise = payments.reduce((acc, p) => acc + p.amount, 0);
    const vendorDisbursementsPaise = vendorBills.reduce((acc, b) => acc + b.paidAmountPaise, 0);
    const directExpensesPaise = directExpenses.reduce((acc, e) => acc + e.amountPaise, 0);
    const totalCashOutflowsPaise = vendorDisbursementsPaise + directExpensesPaise;

    const netCashFlowPaise = cashInflowsPaise - totalCashOutflowsPaise;

    return {
      dateRange: { startDate: params.startDate || null, endDate: params.endDate || null },
      inflows: {
        totalCashInflowsPaise,
        transactionCount: payments.length,
      },
      outflows: {
        vendorDisbursementsPaise,
        directExpensesPaise,
        totalCashOutflowsPaise,
      },
      netCashFlowPaise,
    };
  }

  /**
   * Outstanding Receivables Aging Report (0-30, 31-60, 61-90, 90+ days)
   */
  public static async getOutstandingReceivables(actor: AuthenticatedUser) {
    const now = new Date();
    const invoices = await db.gstInvoice.findMany({
      where: {
        status: { in: [GstInvoiceStatus.ISSUED, GstInvoiceStatus.PARTIALLY_PAID, GstInvoiceStatus.OVERDUE] },
        balanceAmountPaise: { gt: 0 },
      },
      orderBy: { dueDate: "asc" },
    });

    const aging = {
      current: 0, // Not yet overdue
      bucket0_30: 0,
      bucket31_60: 0,
      bucket61_90: 0,
      bucket90Plus: 0,
      totalOutstandingPaise: 0,
    };

    const items = invoices.map((inv) => {
      const dueDate = new Date(inv.dueDate);
      const diffMs = now.getTime() - dueDate.getTime();
      const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      let bucket = "CURRENT";
      if (daysOverdue === 0) {
        aging.current += inv.balanceAmountPaise;
      } else if (daysOverdue <= 30) {
        bucket = "0_30_DAYS";
        aging.bucket0_30 += inv.balanceAmountPaise;
      } else if (daysOverdue <= 60) {
        bucket = "31_60_DAYS";
        aging.bucket31_60 += inv.balanceAmountPaise;
      } else if (daysOverdue <= 90) {
        bucket = "61_90_DAYS";
        aging.bucket61_90 += inv.balanceAmountPaise;
      } else {
        bucket = "90_PLUS_DAYS";
        aging.bucket90Plus += inv.balanceAmountPaise;
      }

      aging.totalOutstandingPaise += inv.balanceAmountPaise;

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        daysOverdue,
        bucket,
        grandTotalPaise: inv.grandTotalPaise,
        paidAmountPaise: inv.paidAmountPaise,
        balanceAmountPaise: inv.balanceAmountPaise,
      };
    });

    return { aging, items };
  }

  /**
   * Vendor Payables Aging Report (0-30, 31-60, 61-90, 90+ days)
   */
  public static async getVendorPayables(actor: AuthenticatedUser) {
    const now = new Date();
    const bills = await db.vendorBill.findMany({
      where: {
        status: { in: [VendorBillStatus.APPROVED, VendorBillStatus.PARTIALLY_PAID] },
        balanceAmountPaise: { gt: 0 },
      },
      include: { vendor: { select: { name: true, phone: true } } },
      orderBy: { dueDate: "asc" },
    });

    const aging = {
      current: 0,
      bucket0_30: 0,
      bucket31_60: 0,
      bucket61_90: 0,
      bucket90Plus: 0,
      totalPayablePaise: 0,
    };

    const items = bills.map((b) => {
      const dueDate = new Date(b.dueDate);
      const diffMs = now.getTime() - dueDate.getTime();
      const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      let bucket = "CURRENT";
      if (daysOverdue === 0) {
        aging.current += b.balanceAmountPaise;
      } else if (daysOverdue <= 30) {
        bucket = "0_30_DAYS";
        aging.bucket0_30 += b.balanceAmountPaise;
      } else if (daysOverdue <= 60) {
        bucket = "31_60_DAYS";
        aging.bucket31_60 += b.balanceAmountPaise;
      } else if (daysOverdue <= 90) {
        bucket = "61_90_DAYS";
        aging.bucket61_90 += b.balanceAmountPaise;
      } else {
        bucket = "90_PLUS_DAYS";
        aging.bucket90Plus += b.balanceAmountPaise;
      }

      aging.totalPayablePaise += b.balanceAmountPaise;

      return {
        id: b.id,
        billNumber: b.billNumber,
        vendorName: b.vendor.name,
        vendorInvoiceNumber: b.vendorInvoiceNumber,
        invoiceDate: b.invoiceDate,
        dueDate: b.dueDate,
        daysOverdue,
        bucket,
        totalAmountPaise: b.totalAmountPaise,
        paidAmountPaise: b.paidAmountPaise,
        balanceAmountPaise: b.balanceAmountPaise,
      };
    });

    return { aging, items };
  }

  /**
   * GST Summary & Reconciliation (GSTR-1 & GSTR-2B/3B candidate registers)
   */
  public static async getGstSummary(
    actor: AuthenticatedUser,
    params: { startDate?: Date; endDate?: Date }
  ) {
    const dateFilter: any = {};
    if (params.startDate) dateFilter.gte = params.startDate;
    if (params.endDate) dateFilter.lte = params.endDate;

    const [invoices, bills, creditNotes] = await Promise.all([
      db.gstInvoice.findMany({
        where: {
          status: { in: [GstInvoiceStatus.ISSUED, GstInvoiceStatus.PAID, GstInvoiceStatus.PARTIALLY_PAID] },
          ...(Object.keys(dateFilter).length > 0 ? { invoiceDate: dateFilter } : {}),
        },
        include: { items: true },
      }),
      db.vendorBill.findMany({
        where: {
          status: { in: [VendorBillStatus.APPROVED, VendorBillStatus.PAID, VendorBillStatus.PARTIALLY_PAID] },
          ...(Object.keys(dateFilter).length > 0 ? { invoiceDate: dateFilter } : {}),
        },
        include: { vendor: true },
      }),
      db.creditDebitNote.findMany({
        where: {
          status: "ISSUED",
          ...(Object.keys(dateFilter).length > 0 ? { noteDate: dateFilter } : {}),
        },
      }),
    ]);

    // Outward Supplies Summary (GSTR-1)
    let outwardTaxablePaise = 0;
    let outwardCgstPaise = 0;
    let outwardSgstPaise = 0;
    let outwardIgstPaise = 0;
    let b2bTaxablePaise = 0;
    let b2cTaxablePaise = 0;

    for (const inv of invoices) {
      outwardTaxablePaise += inv.taxableAmountPaise;
      outwardCgstPaise += inv.cgstAmountPaise;
      outwardSgstPaise += inv.sgstAmountPaise;
      outwardIgstPaise += inv.igstAmountPaise;

      if (inv.customerGstin) {
        b2bTaxablePaise += inv.taxableAmountPaise;
      } else {
        b2cTaxablePaise += inv.taxableAmountPaise;
      }
    }

    // Inward Supplies Summary (GSTR-2B/3B Candidates)
    let inwardTaxablePaise = 0;
    let eligibleItcCgstPaise = 0;
    let eligibleItcSgstPaise = 0;
    let eligibleItcIgstPaise = 0;
    let ineligibleTaxPaise = 0;

    for (const bill of bills) {
      inwardTaxablePaise += bill.taxableAmountPaise;
      if (bill.isItcEligible) {
        eligibleItcCgstPaise += bill.cgstAmountPaise;
        eligibleItcSgstPaise += bill.sgstAmountPaise;
        eligibleItcIgstPaise += bill.igstAmountPaise;
      } else {
        ineligibleTaxPaise += bill.totalTaxPaise;
      }
    }

    const totalOutwardTaxPaise = outwardCgstPaise + outwardSgstPaise + outwardIgstPaise;
    const totalEligibleItcPaise = eligibleItcCgstPaise + eligibleItcSgstPaise + eligibleItcIgstPaise;
    const netGstPayablePaise = Math.max(0, totalOutwardTaxPaise - totalEligibleItcPaise);

    return {
      dateRange: { startDate: params.startDate || null, endDate: params.endDate || null },
      outwardSupplies: {
        taxablePaise: outwardTaxablePaise,
        cgstPaise: outwardCgstPaise,
        sgstPaise: outwardSgstPaise,
        igstPaise: outwardIgstPaise,
        totalTaxPaise: totalOutwardTaxPaise,
        b2bTaxablePaise,
        b2cTaxablePaise,
        invoiceCount: invoices.length,
      },
      inwardSupplies: {
        taxablePaise: inwardTaxablePaise,
        eligibleCgstPaise: eligibleItcCgstPaise,
        eligibleSgstPaise: eligibleItcSgstPaise,
        eligibleIgstPaise: eligibleItcIgstPaise,
        totalEligibleItcPaise,
        ineligibleTaxPaise,
        billCount: bills.length,
      },
      netSettlement: {
        netGstPayablePaise,
        isExcessCredit: totalEligibleItcPaise > totalOutwardTaxPaise,
        excessCreditPaise: Math.max(0, totalEligibleItcPaise - totalOutwardTaxPaise),
      },
    };
  }

  /**
   * General Ledger entries search & export
   */
  public static async getGeneralLedger(
    actor: AuthenticatedUser,
    params: {
      accountCode?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.accountCode) where.accountCode = params.accountCode;
    if (params.startDate || params.endDate) {
      where.entryDate = {};
      if (params.startDate) where.entryDate.gte = params.startDate;
      if (params.endDate) where.entryDate.lte = params.endDate;
    }

    const [entries, totalCount] = await Promise.all([
      db.generalLedgerEntry.findMany({
        where,
        orderBy: { entryDate: "desc" },
        skip,
        take: limit,
      }),
      db.generalLedgerEntry.count({ where }),
    ]);

    return { entries, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) };
  }
}
