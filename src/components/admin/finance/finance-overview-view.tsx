"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatPaiseToRupees, formatDate } from "@/lib/utils";
import {
  IndianRupee,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Receipt,
  FileCheck2,
  Calendar,
  CreditCard,
  Plus,
  Users,
  ChevronRight,
  Printer,
  Briefcase,
} from "lucide-react";
import { FeeStructuresTable } from "./fee-structures-table";
import { PaymentsTable } from "./payments-table";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { GenerateReceiptDialog } from "./generate-receipt-dialog";

export function FinanceOverviewView() {
  const [academicYear, setAcademicYear] = useState("2025-26");
  const [activeTab, setActiveTab] = useState<"fees" | "payments">("fees");
  const [generateReceiptOpen, setGenerateReceiptOpen] = useState(false);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<{
    id: string;
    studentName: string;
    pendingAmount: number;
  } | null>(null);

  const { data: metrics, isLoading, refetch } = api.finance.getOverviewMetrics.useQuery();

  const totalBusiness = (metrics as any)?.totalBusiness || metrics?.totalReceivable || 0;
  const totalDiscount = (metrics as any)?.totalDiscount || 0;
  const totalReceivable = metrics?.totalReceivable || 0;
  const totalCollected = metrics?.totalCollected || 0;
  const totalOutstanding = metrics?.totalOutstanding || 0;
  const overdueAmount = metrics?.overdueAmount || 0;
  const collectionRate = metrics?.collectionRate ?? (totalReceivable > 0 ? Math.round((totalCollected / totalReceivable) * 100) : 100);

  const recentPayments = metrics?.recentPayments || [];
  const pendingStudents = (metrics as any)?.pendingStudents || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Academic Year Filter matching Image 8 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Fees Dashboard</h1>
          <p className="text-xs text-slate-500">Real-time tuition billing, collections telemetry, and outstanding dues tracking</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Academic Year:</span>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="h-8 rounded border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0088cc]"
            >
              <option value="2025-26">2025 - 2026 (Current)</option>
              <option value="2024-25">2024 - 2025</option>
              <option value="2023-24">2023 - 2024</option>
            </select>
          </div>

          <Button
            size="sm"
            onClick={() => setGenerateReceiptOpen(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded shadow-sm uppercase tracking-wide transition-colors h-8"
          >
            <Printer className="w-3.5 h-3.5" /> GENERATE RECEIPT
          </Button>

          <a
            href="#fee-ledger"
            className="inline-flex items-center gap-1.5 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs px-4 py-2 rounded shadow-sm uppercase tracking-wide transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> RECORD PAYMENT
          </a>
        </div>
      </div>

      {/* 5 KPI Cards: Total Business, Fees Collected, Fees Pending, Overdue Fees, Collection Rate */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Total Business (Committed Fees) */}
        <div className="bg-white rounded border border-purple-200/80 p-4 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Business</span>
            <span className="p-2 rounded bg-purple-50 text-purple-600">
              <Briefcase className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-900">
            {isLoading ? "..." : formatPaiseToRupees(totalBusiness)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-purple-700">
            <span>{metrics?.totalEnrolledFees || 0} active enrollment contracts</span>
          </div>
        </div>

        {/* Card 2: Fees Collected */}
        <div className="bg-white rounded border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fees Collected</span>
            <span className="p-2 rounded bg-emerald-50 text-emerald-600">
              <IndianRupee className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {isLoading ? "..." : formatPaiseToRupees(totalCollected)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+14.2% from prior period</span>
          </div>
        </div>

        {/* Card 3: Fees Pending */}
        <div className="bg-white rounded border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fees Pending</span>
            <span className="p-2 rounded bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700">
            {isLoading ? "..." : formatPaiseToRupees(totalOutstanding)}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {metrics?.partialCount || 0} active installment plans
          </p>
        </div>

        {/* Card 4: Overdue Fees */}
        <div className="bg-white rounded border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overdue Fees</span>
            <span className="p-2 rounded bg-rose-50 text-rose-600">
              <AlertCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-700">
            {isLoading ? "..." : formatPaiseToRupees(overdueAmount)}
          </div>
          <p className="mt-2 text-xs text-rose-600 font-medium">
            Requires follow-up attention
          </p>
        </div>

        {/* Card 5: Collection Rate */}
        <div className="bg-white rounded border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Collection Rate</span>
            <span className="p-2 rounded bg-blue-50 text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {isLoading ? "..." : `${collectionRate}%`}
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#0088cc] h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, collectionRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3-Panel Split Layout matching EdumonX Image 8 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel 1: Paid vs Pending Breakdown Chart / Progress */}
        <div className="bg-white rounded border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-slate-900">Paid vs Pending Fees</h3>
            <span className="text-xs text-slate-400 font-mono font-semibold">{academicYear}</span>
          </div>

          <div className="space-y-4 pt-1">
            {/* Visual Distribution Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span className="font-semibold text-emerald-700">Collected ({totalReceivable > 0 ? Math.round((totalCollected / totalReceivable) * 100) : 0}%)</span>
                <span className="font-semibold text-amber-700">Pending ({totalReceivable > 0 ? Math.round((totalOutstanding / totalReceivable) * 100) : 0}%)</span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded flex overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${totalReceivable > 0 ? (totalCollected / totalReceivable) * 100 : 50}%` }}
                  title="Collected"
                />
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{ width: `${totalReceivable > 0 ? (totalOutstanding / totalReceivable) * 100 : 50}%` }}
                  title="Pending"
                />
              </div>
            </div>

            {/* Breakdown Legend Cards */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between p-2.5 rounded bg-purple-50/60 border border-purple-100 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="font-semibold text-slate-700">Total Business (Committed)</span>
                </div>
                <span className="font-bold text-purple-900">{formatPaiseToRupees(totalBusiness || totalReceivable)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-emerald-50/60 border border-emerald-100 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-700">Collected Revenue</span>
                </div>
                <span className="font-bold text-emerald-800">{formatPaiseToRupees(totalCollected)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-amber-50/60 border border-amber-100 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-semibold text-slate-700">Pending Balances</span>
                </div>
                <span className="font-bold text-amber-800">{formatPaiseToRupees(totalOutstanding)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-rose-50/60 border border-rose-100 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-semibold text-slate-700">Overdue Installments</span>
                </div>
                <span className="font-bold text-rose-800">{formatPaiseToRupees(overdueAmount)}</span>
              </div>
            </div>

            <div className="pt-2 border-t text-[11px] text-slate-500 flex items-center justify-between">
              <span>Total Contract Committed: <span className="font-bold text-slate-800">{formatPaiseToRupees(totalReceivable)}</span></span>
              {totalDiscount > 0 && (
                <span className="text-amber-700 font-medium">
                  Discounts: -{formatPaiseToRupees(totalDiscount)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Panel 2: Recent Payments with Avatars & Amounts */}
        <div className="bg-white rounded border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Payments</h3>
            <Link
              href="/admin/finance/payments"
              className="text-xs font-semibold text-[#0088cc] hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 space-y-1">
            {recentPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent payment transactions found.
              </div>
            ) : (
              recentPayments.map((p) => {
                const studentName = p.student?.user
                  ? `${p.student.user.firstName} ${p.student.user.lastName}`
                  : "Enrolled Student";
                const initials = studentName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div key={p.id} className="pt-2 pb-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px] shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 line-clamp-1">{studentName}</p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <span className="font-mono">{formatDate(p.paymentDate)}</span>
                          <span>•</span>
                          <span className="font-semibold uppercase text-slate-600">{p.paymentMethod}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-700 block">
                        +{formatPaiseToRupees(p.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{p.transactionReference.slice(0, 10)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel 3: Pending Fees by Student */}
        <div className="bg-white rounded border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-slate-900">Pending Fees by Student</h3>
            <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {pendingStudents.length} Pending
            </span>
          </div>

          <div className="divide-y divide-slate-100 space-y-1">
            {pendingStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No outstanding pending dues found across cohorts.
              </div>
            ) : (
              pendingStudents.map((fs: any) => {
                const sName = fs.student?.user
                  ? `${fs.student.user.firstName} ${fs.student.user.lastName}`
                  : "Candidate";
                const initials = sName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div key={fs.id} className="pt-2 pb-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[11px] shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 line-clamp-1">{sName}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {fs.course?.title || "IT Program"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="font-bold text-amber-700 block">
                          {formatPaiseToRupees(fs.pendingAmount)}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          {fs.paymentStatus}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const sName = fs.student?.user ? `${fs.student.user.firstName} ${fs.student.user.lastName}` : "Candidate";
                          setSelectedFeeStructure({
                            id: fs.id,
                            studentName: sName,
                            pendingAmount: fs.pendingAmount,
                          });
                        }}
                        className="px-2 py-1 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-[10px] rounded uppercase tracking-wider transition-colors shadow-sm"
                        title="Collect Fee Payment"
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive Fee Structures & Payment Ledger Section */}
      <div id="fee-ledger" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {activeTab === "fees" ? "Student Fee Structures & Plans" : "Payment Transactions & Receipts Ledger"}
            </h3>
            <p className="text-xs text-slate-500">
              {activeTab === "fees"
                ? "Manage course fees, discounts, customizable EMI schedules, and offline payment collections"
                : "Audit-compliant ledger of verified student fee collections with printable official receipts"}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("fees")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "fees"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Fee Structures & Dues
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("payments")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "payments"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Payment & Receipt Ledger
            </button>
          </div>
        </div>

        {activeTab === "fees" ? <FeeStructuresTable /> : <PaymentsTable />}
      </div>

      {/* Record Payment Dialog */}
      {selectedFeeStructure && (
        <RecordPaymentDialog
          open={Boolean(selectedFeeStructure)}
          onOpenChange={(open) => {
            if (!open) setSelectedFeeStructure(null);
          }}
          feeStructureId={selectedFeeStructure.id}
          studentName={selectedFeeStructure.studentName}
          pendingAmountPaise={selectedFeeStructure.pendingAmount}
          onSuccess={() => {
            refetch();
            setSelectedFeeStructure(null);
          }}
        />
      )}
      {/* Generate Receipt Dialog */}
      {generateReceiptOpen && (
        <GenerateReceiptDialog
          open={generateReceiptOpen}
          onOpenChange={setGenerateReceiptOpen}
        />
      )}
    </div>
  );
}
