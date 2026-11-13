"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaiseToRupees, formatDate } from "@/lib/utils";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Receipt,
  FileText,
  DollarSign,
  GraduationCap,
  Clock,
  Building2,
  TrendingUp,
  Activity,
  Percent,
  FileDiff,
  CheckCircle2,
  PieChart,
  BarChart3,
  Settings,
  ShieldCheck,
  Plus,
  Printer,
  Search,
  Filter,
  Download,
  AlertCircle,
  Eye,
  Check,
  X,
  CreditCard,
  UserCheck,
  Calendar,
  Briefcase,
} from "lucide-react";
import { GstInvoiceStatus, VendorBillStatus, ExpenseApprovalStatus } from "@prisma/client";

// Dialogs
import { CreateGstInvoiceDialog } from "./create-gst-invoice-dialog";
import { GstInvoiceModalView } from "./gst-invoice-modal-view";
import { RegisterVendorDialog } from "./register-vendor-dialog";
import { SubmitVendorBillDialog } from "./submit-vendor-bill-dialog";
import { CreateExpenseDialog } from "./create-expense-dialog";
import { CreateNoteDialog } from "./create-note-dialog";
import { FeeStructuresTable } from "./fee-structures-table";
import { PaymentsTable } from "./payments-table";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { GenerateReceiptDialog } from "./generate-receipt-dialog";
import { FinanceOverviewView } from "./finance-overview-view";

export function AccountsFinanceHub({ roleCode }: { roleCode: string }) {
  const [activeSection, setActiveSection] = useState<string>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilterStart, setDateFilterStart] = useState("");
  const [dateFilterEnd, setDateFilterEnd] = useState("");
  const [pnlBasis, setPnlBasis] = useState<"ACCRUAL" | "CASH_PROVISIONAL">("ACCRUAL");

  // Modals
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<any | null>(null);
  const [registerVendorOpen, setRegisterVendorOpen] = useState(false);
  const [submitBillOpen, setSubmitBillOpen] = useState(false);
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false);
  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [generateReceiptOpen, setGenerateReceiptOpen] = useState(false);

  // Month & Year Filter for Month-Wise Financial Intelligence
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showMonthlySchedule, setShowMonthlySchedule] = useState(false);

  // Queries
  const { data: dashboardMetrics, isLoading: dashboardLoading, refetch: refetchMetrics } =
    api.finance.getExecutiveDashboardMetrics.useQuery(
      { month: selectedMonth, year: selectedYear },
      { enabled: activeSection === "dashboard" || activeSection === "reports" }
    );

  const { data: invoicesData, refetch: refetchInvoices } = api.finance.listGstInvoices.useQuery(
    {
      search: searchQuery || undefined,
      startDate: dateFilterStart ? new Date(dateFilterStart) : undefined,
      endDate: dateFilterEnd ? new Date(dateFilterEnd) : undefined,
      limit: 50,
    },
    { enabled: activeSection === "invoices" }
  );

  const { data: vendorBillsData, refetch: refetchBills } = api.finance.listVendorBills.useQuery(
    {
      search: searchQuery || undefined,
      limit: 50,
    },
    { enabled: activeSection === "vendor-bills" }
  );

  const { data: vendorsList, refetch: refetchVendors } = api.finance.listVendors.useQuery(
    { search: searchQuery || undefined },
    { enabled: activeSection === "vendor-bills" || activeSection === "payables" }
  );

  const { data: expensesData, refetch: refetchExpenses } = api.finance.listExpenses.useQuery(
    {
      search: searchQuery || undefined,
      limit: 50,
    },
    { enabled: activeSection === "expenses" }
  );

  const { data: receivablesData } = api.finance.getOutstandingReceivables.useQuery(undefined, {
    enabled: activeSection === "receivables",
  });

  const { data: payablesData } = api.finance.getVendorPayables.useQuery(undefined, {
    enabled: activeSection === "payables",
  });

  const { data: pnlData } = api.finance.getProfitAndLoss.useQuery(
    {
      reportingBasis: pnlBasis,
      startDate: dateFilterStart ? new Date(dateFilterStart) : undefined,
      endDate: dateFilterEnd ? new Date(dateFilterEnd) : undefined,
    },
    { enabled: activeSection === "pnl" }
  );

  const { data: cashFlowData } = api.finance.getCashFlow.useQuery(
    {
      startDate: dateFilterStart ? new Date(dateFilterStart) : undefined,
      endDate: dateFilterEnd ? new Date(dateFilterEnd) : undefined,
    },
    { enabled: activeSection === "cashflow" }
  );

  const { data: gstSummaryData } = api.finance.getGstSummary.useQuery(
    {
      startDate: dateFilterStart ? new Date(dateFilterStart) : undefined,
      endDate: dateFilterEnd ? new Date(dateFilterEnd) : undefined,
    },
    { enabled: activeSection === "gst-summary" }
  );

  const { data: notesData, refetch: refetchNotes } = api.finance.listCreditDebitNotes.useQuery(
    { search: searchQuery || undefined },
    { enabled: activeSection === "credit-debit-notes" }
  );

  const { data: approvalsData, refetch: refetchApprovals } = api.finance.listPendingApprovals.useQuery(
    undefined,
    { enabled: activeSection === "approvals" }
  );

  const { data: budgetsData, refetch: refetchBudgets } = api.finance.listCostCentreBudgets.useQuery(
    {},
    { enabled: activeSection === "budgets" }
  );

  const { data: settingsData, refetch: refetchSettings } = api.finance.getFinanceSettings.useQuery(
    undefined,
    { enabled: activeSection === "settings" }
  );

  const { data: notificationRules, refetch: refetchRules } = api.finance.listNotificationRules.useQuery(
    undefined,
    { enabled: activeSection === "settings" }
  );

  const { data: auditLogsData } = api.finance.listFinancialAuditLogs.useQuery(
    { limit: 50 },
    { enabled: activeSection === "audit-trail" }
  );

  // Mutations for quick actions
  const approveBillMutation = api.finance.approveVendorBill.useMutation({
    onSuccess: () => refetchBills(),
  });
  const approveExpenseMutation = api.finance.approveExpense.useMutation({
    onSuccess: () => refetchExpenses(),
  });

  // Section list definitions for 17 items
  const sections = [
    { id: "dashboard", label: "1. Finance Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "invoices", label: "2. GST Sales Invoices", icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: "vendor-bills", label: "3. Purchase Bills & Vendor Invoices", icon: <FileText className="w-4 h-4" /> },
    { id: "expenses", label: "4. Expenses & Expense Claims", icon: <Receipt className="w-4 h-4" /> },
    { id: "income-receipts", label: "5. Income & Receipts", icon: <DollarSign className="w-4 h-4" /> },
    { id: "admissions-revenue", label: "6. Admissions Revenue & Collections", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "receivables", label: "7. Outstanding Receivables", icon: <Clock className="w-4 h-4" /> },
    { id: "payables", label: "8. Vendor Payables", icon: <Building2 className="w-4 h-4" /> },
    { id: "pnl", label: "9. Profit & Loss", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "cashflow", label: "10. Cash Flow", icon: <Activity className="w-4 h-4" /> },
    { id: "gst-summary", label: "11. GST Summary & Reconciliation", icon: <Percent className="w-4 h-4" /> },
    { id: "credit-debit-notes", label: "12. Credit Notes & Debit Notes", icon: <FileDiff className="w-4 h-4" /> },
    { id: "approvals", label: "13. Financial Approvals", icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: "budgets", label: "14. Budgets & Cost Centres", icon: <PieChart className="w-4 h-4" /> },
    { id: "reports", label: "15. Financial Reports & Exports", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "settings", label: "16. Finance Settings", icon: <Settings className="w-4 h-4" /> },
    { id: "audit-trail", label: "17. Financial Audit Trail", icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation Bar */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Accounts & Finance Institutional Hub
              </h1>
              <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold">
                GST Registered • 09AAECS8901L1Z9
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Institutional accounting, GST tax invoicing, purchase bills, P&L, double-entry ledger, and automated recipient routing.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => setCreateInvoiceOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> New GST Invoice
            </Button>
            <Button
              size="sm"
              onClick={() => setSubmitBillOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Register Bill
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateExpenseOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Record Expense
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateNoteOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
            >
              <FileDiff className="w-3.5 h-3.5" /> Credit/Debit Note
            </Button>
          </div>
        </div>

        {/* 17 Scrollable / Responsive Section Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2.5 scrollbar-thin">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeSection === sec.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {sec.icon}
              <span>{sec.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. FINANCE DASHBOARD */}
      {/* ============================================================== */}
      {activeSection === "dashboard" && (
        <div className="space-y-6">
          {/* Month & Year Filter & Intelligence Control Bar */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Institutional Revenue & Monthly Performance Intelligence
                </h3>
                <Badge className="bg-emerald-700 text-white text-[10px] uppercase font-bold tracking-wider">
                  {dashboardMetrics?.selectedPeriodLabel || "Selected Month"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Filter collections, invoiced revenue, operating expenses, and net profit by month and year.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Month Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Month:</span>
                <select
                  value={selectedMonth !== undefined ? String(selectedMonth) : ""}
                  onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : undefined)}
                  className="h-8 rounded border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">All Months (Full Year)</option>
                  <option value="1">01 - January</option>
                  <option value="2">02 - February</option>
                  <option value="3">03 - March</option>
                  <option value="4">04 - April</option>
                  <option value="5">05 - May</option>
                  <option value="6">06 - June</option>
                  <option value="7">07 - July</option>
                  <option value="8">08 - August</option>
                  <option value="9">09 - September</option>
                  <option value="10">10 - October</option>
                  <option value="11">11 - November</option>
                  <option value="12">12 - December</option>
                </select>
              </div>

              {/* Year Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="h-8 rounded border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="2027">2027</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              {/* Presets */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedMonth(currentMonth);
                  setSelectedYear(currentYear);
                }}
                className={`h-8 text-xs font-bold ${
                  selectedMonth === currentMonth && selectedYear === currentYear
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-extrabold"
                    : "text-slate-700"
                }`}
              >
                Current Month
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedMonth(undefined);
                  setSelectedYear(currentYear);
                }}
                className={`h-8 text-xs font-bold ${
                  selectedMonth === undefined
                    ? "bg-blue-50 border-blue-500 text-blue-800 font-extrabold"
                    : "text-slate-700"
                }`}
              >
                Full Year
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMonthlySchedule(!showMonthlySchedule)}
                className={`h-8 text-xs font-bold gap-1 ${
                  showMonthlySchedule ? "bg-slate-900 text-white border-slate-900" : "text-slate-700"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                {showMonthlySchedule ? "Hide Schedule" : "12-Month Schedule"}
              </Button>
            </div>
          </div>

          {/* Month-Wise Financial Report Cards for Selected Period */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Month-Wise Financial Performance Report — {dashboardMetrics?.selectedPeriodLabel || "Selected Month"}
              </span>
              <span className="text-[11px] text-slate-400">
                Auto-updated for {dashboardMetrics?.selectedPeriodLabel || "Selected Month"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-emerald-300 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/50 shadow-xs">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <span>Period Invoiced Revenue</span>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-emerald-950">
                    {dashboardLoading ? "..." : formatPaiseToRupees(dashboardMetrics?.periodInvoicedSalesPaise || 0)}
                  </div>
                  <div className="mt-1 text-xs text-emerald-700 font-medium flex items-center justify-between">
                    <span>Taxable: {formatPaiseToRupees(dashboardMetrics?.periodTaxableSalesPaise || 0)}</span>
                    <Badge variant="outline" className="text-[10px] font-bold border-emerald-300">
                      {dashboardMetrics?.periodInvoiceCount || 0} Invoices
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-300 bg-gradient-to-br from-white via-blue-50/20 to-blue-50/50 shadow-xs">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <span>Period Collections</span>
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-blue-950">
                    {dashboardLoading ? "..." : formatPaiseToRupees(dashboardMetrics?.periodCollectionsPaise || 0)}
                  </div>
                  <div className="mt-1 text-xs text-blue-700 font-medium flex items-center justify-between">
                    <span>Verified Realized Payments</span>
                    <Badge variant="outline" className="text-[10px] font-bold border-blue-300">
                      {dashboardMetrics?.periodTransactionCount || 0} Tx
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-300 bg-gradient-to-br from-white via-amber-50/20 to-amber-50/50 shadow-xs">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <span>Period Operating Expenses</span>
                    <Receipt className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-amber-950">
                    {dashboardLoading ? "..." : formatPaiseToRupees(dashboardMetrics?.periodExpensesPaise || 0)}
                  </div>
                  <div className="mt-1 text-xs text-amber-700 font-medium">
                    Bills: {formatPaiseToRupees(dashboardMetrics?.periodVendorBillsPaise || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-300 bg-gradient-to-br from-white via-purple-50/20 to-purple-50/50 shadow-xs">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <span>Period Net Operating Surplus</span>
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-purple-950">
                    {dashboardLoading ? "..." : formatPaiseToRupees(dashboardMetrics?.periodNetSurplusPaise || 0)}
                  </div>
                  <div className="mt-1 text-xs text-purple-700 font-medium">
                    Operating Margin: {formatPaiseToRupees(dashboardMetrics?.periodOperatingProfitPaise || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Expandable 12-Month Performance Schedule Table */}
          {showMonthlySchedule && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Month-Wise Performance Report Schedule — FY {selectedYear}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive month-by-month comparative analysis of invoiced revenue, realized collections, and net operating margins.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="h-8 text-xs font-bold gap-1 text-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Month-Wise Report
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Month</th>
                      <th className="p-3 text-right">Invoiced Sales (₹)</th>
                      <th className="p-3 text-right">Taxable Sales (₹)</th>
                      <th className="p-3 text-right">Collections (₹)</th>
                      <th className="p-3 text-right">Expenses (₹)</th>
                      <th className="p-3 text-right">Net Cash Margin (₹)</th>
                      <th className="p-3 text-center">Invoices / Tx</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {dashboardMetrics?.monthlyBreakdown?.map((m: any) => {
                      const isCurrentRowMonth = selectedMonth === m.month;
                      const isProfitable = m.netSurplusPaise >= 0;
                      return (
                        <tr
                          key={m.month}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isCurrentRowMonth ? "bg-emerald-50/50 font-bold" : ""
                          }`}
                        >
                          <td className="p-3 flex items-center gap-2">
                            <span className="w-5 text-slate-400 font-mono text-[11px]">{String(m.month).padStart(2, "0")}</span>
                            <span className="text-slate-900 font-semibold">{m.monthFullName}</span>
                            {isCurrentRowMonth && (
                              <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 font-bold">Selected</Badge>
                            )}
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-800">
                            {formatPaiseToRupees(m.invoicedSalesPaise)}
                          </td>
                          <td className="p-3 text-right text-slate-600">
                            {formatPaiseToRupees(m.taxableSalesPaise)}
                          </td>
                          <td className="p-3 text-right font-bold text-blue-700">
                            {formatPaiseToRupees(m.collectionsPaise)}
                          </td>
                          <td className="p-3 text-right text-amber-700">
                            {formatPaiseToRupees(m.expensesPaise)}
                          </td>
                          <td className={`p-3 text-right font-extrabold ${isProfitable ? "text-emerald-700" : "text-rose-700"}`}>
                            {formatPaiseToRupees(m.netSurplusPaise)}
                          </td>
                          <td className="p-3 text-center text-slate-500 font-mono text-[11px]">
                            {m.invoiceCount} inv / {m.transactionCount} tx
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedMonth(m.month)}
                              className="h-6 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2"
                            >
                              Inspect Month
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top All-Time Cumulative KPI Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                All-Time Cumulative Financial Ledgers
              </span>
              <span className="text-[11px] text-slate-400">Institutional lifetime aggregates</span>
            </div>

            {/* 3-Pillar Business Telemetry: Total Kitna Hua | Recieve Kitna Hua | Pending Kitna Hai */}
            <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveSection("admissions-revenue")}
                className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                title="Click to view Admissions Revenue & Contract Details"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200">
                    Total Business (Total Kitna Hua)
                  </span>
                  <p className="text-2xl font-black text-white mt-0.5">
                    {dashboardLoading
                      ? "..."
                      : formatPaiseToRupees(
                          (dashboardMetrics as any)?.totalBusinessPaise ||
                            (dashboardMetrics?.totalCollectionsPaise || 0) +
                              (dashboardMetrics?.totalReceivablesPaise || 0)
                        )}
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-700 hidden sm:block" />

              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveSection("income-receipts")}
                className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                title="Click to inspect Realized Collections & Receipts"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                    Total Received (Recieve Kitna Hua)
                  </span>
                  <p className="text-2xl font-black text-blue-400 mt-0.5">
                    {dashboardLoading ? "..." : formatPaiseToRupees(dashboardMetrics?.totalCollectionsPaise || 0)}
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-700 hidden sm:block" />

              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveSection("receivables")}
                className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                title="Click to inspect Outstanding Receivables"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200">
                    Total Pending (Pending Kitna Hai)
                  </span>
                  <p className="text-2xl font-black text-amber-400 mt-0.5">
                    {dashboardLoading ? "..." : formatPaiseToRupees(dashboardMetrics?.totalReceivablesPaise || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card
                role="button"
                tabIndex={0}
                onClick={() => setActiveSection("admissions-revenue")}
                className="border-purple-200 bg-white cursor-pointer hover:shadow-md hover:border-purple-400 transition-all"
                title="Click to view Admissions Revenue"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Total Business</span>
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-purple-950">
                    {dashboardLoading
                      ? "..."
                      : formatPaiseToRupees(
                          (dashboardMetrics as any)?.totalBusinessPaise ||
                            (dashboardMetrics?.totalCollectionsPaise || 0) +
                              (dashboardMetrics?.totalReceivablesPaise || 0)
                        )}
                  </div>
                  <div className="mt-1 text-xs text-purple-700 font-medium">
                    Total Contracted Value Booked →
                  </div>
                </CardContent>
              </Card>

              <Card
                role="button"
                tabIndex={0}
                onClick={() => setActiveSection("invoices")}
                className="border-slate-200 bg-white cursor-pointer hover:shadow-md hover:border-emerald-400 transition-all"
                title="Click to view GST Invoices"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Total Invoiced Sales (All-Time)</span>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    {dashboardLoading ? "..." : formatPaiseToRupees(dashboardMetrics?.totalInvoicedSalesPaise || 0)}
                  </div>
                  <div className="mt-1 text-xs text-emerald-700 font-medium">
                    Taxable: {formatPaiseToRupees(dashboardMetrics?.totalTaxableSalesPaise || 0)} →
                  </div>
                </CardContent>
              </Card>

              <Card
                role="button"
                tabIndex={0}
                onClick={() => setActiveSection("income-receipts")}
                className="border-slate-200 bg-white cursor-pointer hover:shadow-md hover:border-blue-400 transition-all"
                title="Click to view Income & Receipts"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Total Collections (All-Time)</span>
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-blue-900">
                    {dashboardLoading ? "..." : formatPaiseToRupees(dashboardMetrics?.totalCollectionsPaise || 0)}
                  </div>
                  <div className="mt-1 text-xs text-blue-700 font-medium">Verified Gateway & Cash Ledgers →</div>
                </CardContent>
              </Card>

              <Card
                role="button"
                tabIndex={0}
                onClick={() => setActiveSection("receivables")}
                className="border-slate-200 bg-white cursor-pointer hover:shadow-md hover:border-amber-400 transition-all"
                title="Click to view Outstanding Receivables"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Outstanding Receivables</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-amber-900">
                    {dashboardLoading ? "..." : formatPaiseToRupees(dashboardMetrics?.totalReceivablesPaise || 0)}
                  </div>
                  <div className="mt-1 text-xs text-red-600 font-semibold">
                    Overdue: {formatPaiseToRupees(dashboardMetrics?.overdueReceivablesPaise || 0)} →
                  </div>
                </CardContent>
              </Card>

              <Card
                role="button"
                tabIndex={0}
                onClick={() => setActiveSection("pnl")}
                className="border-slate-200 bg-white cursor-pointer hover:shadow-md hover:border-purple-400 transition-all"
                title="Click to view Profit & Loss Statement"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Operating Profit (Accrual)</span>
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-purple-900">
                    {dashboardLoading ? "..." : formatPaiseToRupees(dashboardMetrics?.operatingProfitPaise || 0)}
                  </div>
                  <div className="mt-1 text-xs text-purple-700 font-medium">Revenue Less Operating Overheads →</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Secondary Operational KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Vendor Payables</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatPaiseToRupees(dashboardMetrics?.totalPayablesPaise || 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Approved liabilities to suppliers</div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Operating Expenses</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatPaiseToRupees(dashboardMetrics?.totalApprovedExpensesPaise || 0)}
              </div>
              <div className="text-[11px] text-amber-600 mt-0.5">
                {dashboardMetrics?.pendingApprovalsCount || 0} approvals pending
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Output GST Collected</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {formatPaiseToRupees(dashboardMetrics?.outputGstPaise || 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Statutory tax collected on sales</div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">Net GST Liability (Est.)</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatPaiseToRupees(dashboardMetrics?.netGstLiabilityEstimatePaise || 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">After verified ITC offset</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. GST SALES INVOICES */}
      {/* ============================================================== */}
      {activeSection === "invoices" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search invoice number, customer name, GSTIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <Button
              size="sm"
              onClick={() => setCreateInvoiceOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create New GST Invoice
            </Button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Place of Supply</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Taxable</th>
                  <th className="p-3">Total (₹)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoicesData?.invoices?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No GST sales invoices found. Click "Create New GST Invoice" to generate one.
                    </td>
                  </tr>
                ) : (
                  invoicesData?.invoices?.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{inv.customerName}</div>
                        {inv.customerGstin && (
                          <div className="text-[10px] font-mono text-emerald-700">{inv.customerGstin}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {inv.placeOfSupply}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                      <td className="p-3 text-slate-700">{formatPaiseToRupees(inv.taxableAmountPaise)}</td>
                      <td className="p-3 font-bold text-slate-900">{formatPaiseToRupees(inv.grandTotalPaise)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : inv.status === "ISSUED"
                              ? "bg-blue-100 text-blue-800"
                              : inv.status === "DRAFT"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedInvoiceForView(inv)}
                          className="h-7 text-xs gap-1 border-slate-300 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" /> View / Print
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. PURCHASE BILLS & VENDOR INVOICES */}
      {/* ============================================================== */}
      {activeSection === "vendor-bills" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search bill number, vendor name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRegisterVendorOpen(true)}
                className="h-8 text-xs gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Register Vendor
              </Button>
              <Button
                size="sm"
                onClick={() => setSubmitBillOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Register Bill
              </Button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Bill No</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Vendor Invoice #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Taxable</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">ITC Status</th>
                  <th className="p-3">Approval</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorBillsData?.bills?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No purchase bills recorded. Click "Register Bill" to log legitimate vendor invoices.
                    </td>
                  </tr>
                ) : (
                  vendorBillsData?.bills?.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-slate-900">{bill.billNumber}</td>
                      <td className="p-3 font-medium text-slate-900">{bill.vendor.name}</td>
                      <td className="p-3 font-mono text-slate-600">{bill.vendorInvoiceNumber}</td>
                      <td className="p-3 text-slate-600">{formatDate(bill.invoiceDate)}</td>
                      <td className="p-3">{formatPaiseToRupees(bill.taxableAmountPaise)}</td>
                      <td className="p-3 font-bold text-slate-900">{formatPaiseToRupees(bill.totalAmountPaise)}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={
                            bill.isItcEligible
                              ? "border-emerald-300 text-emerald-800 bg-emerald-50"
                              : "border-slate-200 text-slate-500"
                          }
                        >
                          {bill.itcClaimStatus}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            bill.status === "APPROVED" || bill.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : bill.status === "PENDING_APPROVAL"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {bill.status === "PENDING_APPROVAL" && (
                          <Button
                            size="sm"
                            onClick={() => approveBillMutation.mutate({ billId: bill.id, decision: "APPROVE" })}
                            className="h-6 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. EXPENSES & CLAIMS */}
      {/* ============================================================== */}
      {activeSection === "expenses" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search expense description, payee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <Button
              size="sm"
              onClick={() => setCreateExpenseOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Record Expense
            </Button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Expense Ref</th>
                  <th className="p-3">Title / Particulars</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Payee</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount (₹)</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expensesData?.expenses?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No operating expenses or claims recorded.
                    </td>
                  </tr>
                ) : (
                  expensesData?.expenses?.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-slate-900">{exp.expenseNumber}</td>
                      <td className="p-3 font-semibold text-slate-900">{exp.title}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {exp.category.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-700">{exp.paidTo}</td>
                      <td className="p-3 text-slate-600">{formatDate(exp.expenseDate)}</td>
                      <td className="p-3 font-bold text-slate-900">{formatPaiseToRupees(exp.amountPaise)}</td>
                      <td className="p-3">
                        {exp.isClaim ? (
                          <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                            Staff Claim
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium">Direct</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            exp.status === "APPROVED" || exp.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : exp.status === "SUBMITTED"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {exp.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {exp.status === "SUBMITTED" && (
                          <Button
                            size="sm"
                            onClick={() => approveExpenseMutation.mutate({ expenseId: exp.id, decision: "APPROVE" })}
                            className="h-6 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. INCOME & RECEIPTS */}
      {/* ============================================================== */}
      {activeSection === "income-receipts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Verified Income & Payment Transactions</h2>
              <p className="text-xs text-slate-500">Official cash inflows, gateway settlements, and dual fee receipts.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setGenerateReceiptOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Generate Fee Receipt
              </Button>
            </div>
          </div>
          <PaymentsTable />
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. ADMISSIONS REVENUE & COLLECTIONS (FEES DASHBOARD) */}
      {/* ============================================================== */}
      {activeSection === "admissions-revenue" && (
        <FinanceOverviewView />
      )}

      {/* ============================================================== */}
      {/* 7. OUTSTANDING RECEIVABLES (AGING) */}
      {/* ============================================================== */}
      {activeSection === "receivables" && (
        <div className="space-y-4">
          {/* Aging Buckets */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Current (Not Due)</div>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {formatPaiseToRupees(receivablesData?.aging?.current || 0)}
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-amber-200 bg-amber-50/20 shadow-sm">
              <div className="text-[11px] font-bold text-amber-700 uppercase">1 - 30 Days</div>
              <div className="text-lg font-bold text-amber-900 mt-1">
                {formatPaiseToRupees(receivablesData?.aging?.bucket0_30 || 0)}
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-orange-200 bg-orange-50/20 shadow-sm">
              <div className="text-[11px] font-bold text-orange-700 uppercase">31 - 60 Days</div>
              <div className="text-lg font-bold text-orange-900 mt-1">
                {formatPaiseToRupees(receivablesData?.aging?.bucket31_60 || 0)}
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-red-200 bg-red-50/20 shadow-sm">
              <div className="text-[11px] font-bold text-red-700 uppercase">61 - 90 Days</div>
              <div className="text-lg font-bold text-red-900 mt-1">
                {formatPaiseToRupees(receivablesData?.aging?.bucket61_90 || 0)}
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-red-300 bg-red-100/30 shadow-sm">
              <div className="text-[11px] font-bold text-red-800 uppercase">90+ Days (Critical)</div>
              <div className="text-lg font-black text-red-950 mt-1">
                {formatPaiseToRupees(receivablesData?.aging?.bucket90Plus || 0)}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Invoice Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Days Overdue</th>
                  <th className="p-3">Aging Bracket</th>
                  <th className="p-3 text-right">Balance Due (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receivablesData?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      All issued customer invoices are fully settled.
                    </td>
                  </tr>
                ) : (
                  receivablesData?.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-slate-900">{item.invoiceNumber}</td>
                      <td className="p-3 font-semibold text-slate-900">{item.customerName}</td>
                      <td className="p-3 text-slate-600">{formatDate(item.invoiceDate)}</td>
                      <td className="p-3 text-slate-600">{formatDate(item.dueDate)}</td>
                      <td className="p-3 font-mono font-bold text-red-600">{item.daysOverdue} days</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {item.bucket.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-extrabold text-red-700">
                        {formatPaiseToRupees(item.balanceAmountPaise)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. VENDOR PAYABLES (AGING) */}
      {/* ============================================================== */}
      {activeSection === "payables" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Current (Not Due)</div>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {formatPaiseToRupees(payablesData?.aging?.current || 0)}
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-amber-200 bg-amber-50/20 shadow-sm">
              <div className="text-[11px] font-bold text-amber-700 uppercase">1 - 30 Days</div>
              <div className="text-lg font-bold text-amber-900 mt-1">
                {formatPaiseToRupees(payablesData?.aging?.bucket0_30 || 0)}
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-orange-200 bg-orange-50/20 shadow-sm">
              <div className="text-[11px] font-bold text-orange-700 uppercase">31 - 60 Days</div>
              <div className="text-lg font-bold text-orange-900 mt-1">
                {formatPaiseToRupees(payablesData?.aging?.bucket31_60 || 0)}
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-red-200 bg-red-50/20 shadow-sm">
              <div className="text-[11px] font-bold text-red-700 uppercase">61 - 90 Days</div>
              <div className="text-lg font-bold text-red-900 mt-1">
                {formatPaiseToRupees(payablesData?.aging?.bucket61_90 || 0)}
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-red-300 bg-red-100/30 shadow-sm">
              <div className="text-[11px] font-bold text-red-800 uppercase">90+ Days</div>
              <div className="text-lg font-black text-red-950 mt-1">
                {formatPaiseToRupees(payablesData?.aging?.bucket90Plus || 0)}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Bill No</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Vendor Ref</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Overdue Days</th>
                  <th className="p-3 text-right">Outstanding (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payablesData?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No outstanding vendor payables found.
                    </td>
                  </tr>
                ) : (
                  payablesData?.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-slate-900">{item.billNumber}</td>
                      <td className="p-3 font-semibold text-slate-900">{item.vendorName}</td>
                      <td className="p-3 font-mono text-slate-600">{item.vendorInvoiceNumber}</td>
                      <td className="p-3 text-slate-600">{formatDate(item.dueDate)}</td>
                      <td className="p-3 font-mono font-bold text-amber-700">{item.daysOverdue} days</td>
                      <td className="p-3 text-right font-extrabold text-slate-900">
                        {formatPaiseToRupees(item.balanceAmountPaise)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. PROFIT & LOSS */}
      {/* ============================================================== */}
      {activeSection === "pnl" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Profit & Loss Statement</h2>
              <p className="text-xs text-slate-500">
                Auditable operating statement separating sales revenue, direct costs, overheads, and GST liability.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Accounting Basis:</span>
              <select
                value={pnlBasis}
                onChange={(e) => setPnlBasis(e.target.value as any)}
                className="h-8 text-xs rounded border border-slate-300 bg-white px-2 font-bold text-slate-800"
              >
                <option value="ACCRUAL">Accrual Basis (Invoiced Sales - Expenses)</option>
                <option value="CASH_PROVISIONAL">Cash Basis (Receipts - Disbursements)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Breakout */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-sm text-slate-900">A. Institutional Revenue</span>
                <span className="font-extrabold text-sm text-emerald-700">
                  {formatPaiseToRupees(pnlData?.revenue?.recognizedRevenuePaise || 0)}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {Object.entries(pnlData?.revenue?.byStream || {}).map(([stream, paise]) => (
                  <div key={stream} className="flex justify-between text-slate-600">
                    <span>{stream.replace(/_/g, " ")}:</span>
                    <span className="font-medium text-slate-900">{formatPaiseToRupees(paise as number)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operating Overheads Breakout */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-sm text-slate-900">B. Operating Expenditures</span>
                <span className="font-extrabold text-sm text-red-700">
                  {formatPaiseToRupees(pnlData?.expenses?.totalOperatingExpensesPaise || 0)}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {Object.entries(pnlData?.expenses?.byCategory || {}).map(([cat, paise]) => (
                  <div key={cat} className="flex justify-between text-slate-600">
                    <span>{cat.replace(/_/g, " ")}:</span>
                    <span className="font-medium text-slate-900">{formatPaiseToRupees(paise as number)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Net Margin Summary */}
          <div className="bg-slate-900 text-white p-5 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-slate-400">Operating Net Profit / (Loss)</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {formatPaiseToRupees(pnlData?.profitability?.operatingProfitPaise || 0)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Operating Margin: <strong>{pnlData?.profitability?.operatingMarginPercentage || 0}%</strong>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400 space-y-1">
              <div>Output GST on Sales: <strong className="text-white">{formatPaiseToRupees(pnlData?.taxes?.outputGstPaise || 0)}</strong></div>
              <div>Eligible ITC Offset: <strong className="text-white">{formatPaiseToRupees(pnlData?.taxes?.eligibleItcPaise || 0)}</strong></div>
              <div>Net Tax Liability: <strong className="text-emerald-300">{formatPaiseToRupees(pnlData?.taxes?.netTaxLiabilityEstimatePaise || 0)}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 10. CASH FLOW */}
      {/* ============================================================== */}
      {activeSection === "cashflow" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded border border-emerald-200 bg-emerald-50/20 shadow-sm">
              <div className="text-xs font-bold uppercase text-emerald-800">Cash Inflows</div>
              <div className="text-2xl font-black text-emerald-900 mt-2">
                {formatPaiseToRupees(cashFlowData?.inflows?.totalCashInflowsPaise || 0)}
              </div>
              <div className="text-xs text-emerald-700 mt-1">Verified receipts & gateway settlements</div>
            </div>

            <div className="bg-white p-4 rounded border border-red-200 bg-red-50/20 shadow-sm">
              <div className="text-xs font-bold uppercase text-red-800">Cash Outflows</div>
              <div className="text-2xl font-black text-red-900 mt-2">
                {formatPaiseToRupees(cashFlowData?.outflows?.totalCashOutflowsPaise || 0)}
              </div>
              <div className="text-xs text-red-700 mt-1">Vendor payments & operational disbursements</div>
            </div>

            <div className="bg-white p-4 rounded border border-slate-300 shadow-sm">
              <div className="text-xs font-bold uppercase text-slate-600">Net Cash Movement</div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatPaiseToRupees(cashFlowData?.netCashFlowPaise || 0)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Closing cash variance</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 11. GST SUMMARY & RECONCILIATION */}
      {/* ============================================================== */}
      {activeSection === "gst-summary" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">GST Statutory Summary (GSTR-1 & GSTR-3B Basis)</h2>
                <p className="text-xs text-slate-500">Company GSTIN: 09AAECS8901L1Z9 | State: 09-Uttar Pradesh</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Outward */}
              <div className="space-y-3 bg-slate-50 p-4 rounded border border-slate-200 text-xs">
                <div className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                  Outward Taxable Supplies (Sales / Invoices)
                </div>
                <div className="flex justify-between">
                  <span>Taxable Value:</span>
                  <strong className="text-slate-900">{formatPaiseToRupees(gstSummaryData?.outwardSupplies?.taxablePaise || 0)}</strong>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>CGST Output:</span>
                  <strong>{formatPaiseToRupees(gstSummaryData?.outwardSupplies?.cgstPaise || 0)}</strong>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>SGST Output:</span>
                  <strong>{formatPaiseToRupees(gstSummaryData?.outwardSupplies?.sgstPaise || 0)}</strong>
                </div>
                <div className="flex justify-between text-purple-800">
                  <span>IGST Output:</span>
                  <strong>{formatPaiseToRupees(gstSummaryData?.outwardSupplies?.igstPaise || 0)}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                  <span>Total Output Tax:</span>
                  <span className="text-emerald-700">{formatPaiseToRupees(gstSummaryData?.outwardSupplies?.totalTaxPaise || 0)}</span>
                </div>
              </div>

              {/* Inward */}
              <div className="space-y-3 bg-slate-50 p-4 rounded border border-slate-200 text-xs">
                <div className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                  Inward Supplies & Input Tax Credit (ITC Candidates)
                </div>
                <div className="flex justify-between">
                  <span>Inward Taxable Value:</span>
                  <strong className="text-slate-900">{formatPaiseToRupees(gstSummaryData?.inwardSupplies?.taxablePaise || 0)}</strong>
                </div>
                <div className="flex justify-between text-blue-800">
                  <span>Eligible CGST ITC:</span>
                  <strong>{formatPaiseToRupees(gstSummaryData?.inwardSupplies?.eligibleCgstPaise || 0)}</strong>
                </div>
                <div className="flex justify-between text-blue-800">
                  <span>Eligible SGST ITC:</span>
                  <strong>{formatPaiseToRupees(gstSummaryData?.inwardSupplies?.eligibleSgstPaise || 0)}</strong>
                </div>
                <div className="flex justify-between text-blue-800">
                  <span>Eligible IGST ITC:</span>
                  <strong>{formatPaiseToRupees(gstSummaryData?.inwardSupplies?.eligibleIgstPaise || 0)}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                  <span>Total Eligible ITC:</span>
                  <span className="text-blue-700">{formatPaiseToRupees(gstSummaryData?.inwardSupplies?.totalEligibleItcPaise || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 12. CREDIT NOTES & DEBIT NOTES */}
      {/* ============================================================== */}
      {activeSection === "credit-debit-notes" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Statutory Credit Notes & Debit Notes</h2>
              <p className="text-xs text-slate-500">Section 34 adjustments on course fees and vendor rate revisions.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setCreateNoteOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-8 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Issue Credit/Debit Note
            </Button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Note No</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Party</th>
                  <th className="p-3">Linked Invoice/Bill</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notesData?.notes?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No Credit Notes or Debit Notes issued.
                    </td>
                  </tr>
                ) : (
                  notesData?.notes?.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-slate-900">{n.noteNumber}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] font-bold text-purple-800">
                          {n.noteType}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-700">{n.partyType}</td>
                      <td className="p-3 font-mono text-slate-600">{n.gstInvoice?.invoiceNumber || n.vendorBill?.billNumber || "-"}</td>
                      <td className="p-3 text-slate-600">{formatDate(n.noteDate)}</td>
                      <td className="p-3 text-slate-800">{n.reason}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatPaiseToRupees(n.totalAmountPaise)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 13. FINANCIAL APPROVALS */}
      {/* ============================================================== */}
      {activeSection === "approvals" && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Multi-Tier Financial Approval Queue</h2>
            <p className="text-xs text-slate-500">
              Pending authorization for vendor purchase bills, expense claims, and fee adjustments.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Approval Type</th>
                  <th className="p-3">Entity ID</th>
                  <th className="p-3">Amount (₹)</th>
                  <th className="p-3">Required Authority</th>
                  <th className="p-3">Submission Memo</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvalsData?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No pending financial approvals in the queue.
                    </td>
                  </tr>
                ) : (
                  approvalsData?.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900">{app.approvalType}</td>
                      <td className="p-3 font-mono text-slate-600">{app.entityId}</td>
                      <td className="p-3 font-extrabold text-slate-900">{formatPaiseToRupees(app.amountPaise)}</td>
                      <td className="p-3">
                        <Badge className="text-[10px]">{app.assignedRole}</Badge>
                      </td>
                      <td className="p-3 text-slate-700">{app.comments}</td>
                      <td className="p-3 text-right">
                        <Badge className="bg-amber-100 text-amber-800 text-[10px]">PENDING</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 14. BUDGETS & COST CENTRES */}
      {/* ============================================================== */}
      {activeSection === "budgets" && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Cost Centre Budget Allocations</h2>
            <p className="text-xs text-slate-500">
              Departmental caps, utilized operating expenditures, and variance telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {budgetsData?.length === 0 ? (
              <div className="col-span-3 p-8 text-center text-slate-400 bg-white rounded border border-slate-200">
                No cost centre budgets allocated for FY 2025-26.
              </div>
            ) : (
              budgetsData?.map((b) => (
                <div key={b.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-slate-900">{b.costCentreCode}</span>
                    <Badge variant="outline" className="text-[10px]">{b.department}</Badge>
                  </div>
                  <div className="font-semibold text-xs text-slate-800">{b.costCentreName}</div>
                  <div className="flex justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Allocated:</span>
                    <strong className="text-slate-900">{formatPaiseToRupees(b.allocatedAmountPaise)}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Utilized:</span>
                    <strong className="text-amber-700">{formatPaiseToRupees(b.utilizedAmountPaise)}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 15. FINANCIAL REPORTS & EXPORTS */}
      {/* ============================================================== */}
      {activeSection === "reports" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Exportable Institutional Financial Reports</h2>
            <p className="text-xs text-slate-500">
              Download audit-ready general ledger schedules, GST registers, and financial statements.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="h-12 flex flex-col items-center justify-center text-xs font-bold text-slate-800 gap-1 border-slate-300"
              >
                <Printer className="w-4 h-4 text-emerald-600" /> Print Financial Statement
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="h-12 flex flex-col items-center justify-center text-xs font-bold text-slate-800 gap-1 border-slate-300"
              >
                <Download className="w-4 h-4 text-blue-600" /> Export GSTR-1 Sales Register
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="h-12 flex flex-col items-center justify-center text-xs font-bold text-slate-800 gap-1 border-slate-300"
              >
                <Download className="w-4 h-4 text-amber-600" /> Export GSTR-2B ITC Register
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="h-12 flex flex-col items-center justify-center text-xs font-bold text-slate-800 gap-1 border-slate-300"
              >
                <BarChart3 className="w-4 h-4 text-purple-600" /> Print Monthly Report
              </Button>
            </div>
          </div>

          {/* Month-Wise Performance Report Table in Reports tab */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Month-Wise Financial Performance Report Schedule — FY {selectedYear}
                </h3>
                <p className="text-xs text-slate-500">
                  Full 12-month auditable schedule of revenue, collections, expenses, and operating cash margins.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="h-8 rounded border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800"
                >
                  <option value="2027">FY 2027</option>
                  <option value="2026">FY 2026</option>
                  <option value="2025">FY 2025</option>
                  <option value="2024">FY 2024</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="h-8 text-xs font-bold gap-1 text-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Month</th>
                    <th className="p-3 text-right">Invoiced Sales (₹)</th>
                    <th className="p-3 text-right">Taxable Sales (₹)</th>
                    <th className="p-3 text-right">Collections (₹)</th>
                    <th className="p-3 text-right">Expenses (₹)</th>
                    <th className="p-3 text-right">Net Margin (₹)</th>
                    <th className="p-3 text-center">Invoices / Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dashboardMetrics?.monthlyBreakdown?.map((m: any) => {
                    const isProfitable = m.netSurplusPaise >= 0;
                    return (
                      <tr key={m.month} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 flex items-center gap-2">
                          <span className="w-5 text-slate-400 font-mono text-[11px]">{String(m.month).padStart(2, "0")}</span>
                          <span className="text-slate-900 font-semibold">{m.monthFullName}</span>
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-800">
                          {formatPaiseToRupees(m.invoicedSalesPaise)}
                        </td>
                        <td className="p-3 text-right text-slate-600">
                          {formatPaiseToRupees(m.taxableSalesPaise)}
                        </td>
                        <td className="p-3 text-right font-bold text-blue-700">
                          {formatPaiseToRupees(m.collectionsPaise)}
                        </td>
                        <td className="p-3 text-right text-amber-700">
                          {formatPaiseToRupees(m.expensesPaise)}
                        </td>
                        <td className={`p-3 text-right font-extrabold ${isProfitable ? "text-emerald-700" : "text-rose-700"}`}>
                          {formatPaiseToRupees(m.netSurplusPaise)}
                        </td>
                        <td className="p-3 text-center text-slate-500 font-mono text-[11px]">
                          {m.invoiceCount} inv / {m.transactionCount} tx
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 16. FINANCE SETTINGS & NOTIFICATION MATRIX */}
      {/* ============================================================== */}
      {activeSection === "settings" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Company Statutory & GST Billing Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Company Legal Name:</span>
                <strong className="text-slate-900">{settingsData?.companyLegalName || "SOFTLAB GLOBAL"}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">GSTIN:</span>
                <strong className="text-emerald-700 font-mono">{settingsData?.companyGstin || "09AAECS8901L1Z9"}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Place of Supply State Code:</span>
                <strong className="text-slate-900">09 - Uttar Pradesh</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Executive Approval Cap:</span>
                <strong className="text-slate-900">
                  {formatPaiseToRupees(settingsData?.executiveApprovalLimit || 1000000)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Manager Approval Cap:</span>
                <strong className="text-slate-900">
                  {formatPaiseToRupees(settingsData?.managerApprovalLimit || 5000000)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Current Financial Year:</span>
                <strong className="text-slate-900">{settingsData?.financialYear || "2025-26"}</strong>
              </div>
            </div>
          </div>

          {/* Editable Notification Matrix Rules */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Event-Driven Intelligent Email Notification Matrix</h2>
              <p className="text-xs text-slate-500">
                Departmental email sender identities, recipient rules, and executive escalation limits.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">Sender Identity</th>
                    <th className="p-3">Primary Recipient</th>
                    <th className="p-3 text-center">Counselor</th>
                    <th className="p-3 text-center">Dept Head</th>
                    <th className="p-3 text-center">Finance</th>
                    <th className="p-3 text-center">Higher Mgmt</th>
                    <th className="p-3">Escalation Cap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {notificationRules?.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-slate-900">{rule.eventType}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{rule.senderName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{rule.senderEmail}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{rule.primaryRecipientRole}</td>
                      <td className="p-3 text-center">
                        {rule.notifyConvertingCounselor ? (
                          <Check className="w-4 h-4 text-emerald-600 inline" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 inline" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {rule.notifyDepartmentManager ? (
                          <Check className="w-4 h-4 text-emerald-600 inline" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 inline" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {rule.notifyFinance ? (
                          <Check className="w-4 h-4 text-emerald-600 inline" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 inline" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {rule.notifyHigherManagement ? (
                          <Check className="w-4 h-4 text-emerald-600 inline" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 inline" />
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {rule.escalationThresholdPaise
                          ? formatPaiseToRupees(rule.escalationThresholdPaise)
                          : "Immediate"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 17. FINANCIAL AUDIT TRAIL */}
      {/* ============================================================== */}
      {activeSection === "audit-trail" && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Immutable Financial Audit Trail</h2>
            <p className="text-xs text-slate-500">
              Audit log of all invoice creations, cancellations, bill approvals, disbursements, and statutory changes.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity Type</th>
                  <th className="p-3">Entity ID</th>
                  <th className="p-3">Authorized Actor</th>
                  <th className="p-3">Actor Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogsData?.logs?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No financial audit records logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogsData?.logs?.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="p-3 text-slate-500">{formatDate(log.createdAt)}</td>
                      <td className="p-3 font-bold text-slate-900">{log.action}</td>
                      <td className="p-3 text-slate-700">{log.entityType}</td>
                      <td className="p-3 font-mono text-slate-600">{log.entityId}</td>
                      <td className="p-3 font-semibold text-slate-900">{log.actorName}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {log.actorRole}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog Modals */}
      <CreateGstInvoiceDialog
        open={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
        onSuccess={() => {
          refetchInvoices();
          refetchMetrics();
        }}
      />

      <GstInvoiceModalView
        open={Boolean(selectedInvoiceForView)}
        onOpenChange={(op) => !op && setSelectedInvoiceForView(null)}
        invoice={selectedInvoiceForView}
      />

      <RegisterVendorDialog
        open={registerVendorOpen}
        onOpenChange={setRegisterVendorOpen}
        onSuccess={() => refetchVendors()}
      />

      <SubmitVendorBillDialog
        open={submitBillOpen}
        onOpenChange={setSubmitBillOpen}
        onSuccess={() => {
          refetchBills();
          refetchMetrics();
        }}
      />

      <CreateExpenseDialog
        open={createExpenseOpen}
        onOpenChange={setCreateExpenseOpen}
        onSuccess={() => {
          refetchExpenses();
          refetchMetrics();
        }}
      />

      <CreateNoteDialog
        open={createNoteOpen}
        onOpenChange={setCreateNoteOpen}
        onSuccess={() => {
          refetchNotes();
          refetchInvoices();
        }}
      />

      <GenerateReceiptDialog
        open={generateReceiptOpen}
        onOpenChange={setGenerateReceiptOpen}
      />
    </div>
  );
}
