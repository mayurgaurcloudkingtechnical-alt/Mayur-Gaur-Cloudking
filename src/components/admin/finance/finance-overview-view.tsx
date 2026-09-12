"use client";

import * as React from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
} from "lucide-react";
import { FeeStructuresTable } from "./fee-structures-table";

export function FinanceOverviewView() {
  const { data: metrics, isLoading } = api.finance.getOverviewMetrics.useQuery();

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Total Receivable</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? "..." : formatPaiseToRupees(metrics?.totalReceivable || 0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Across {metrics?.totalEnrolledFees || 0} enrolled fee structures
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-emerald-700">Total Collected</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {isLoading ? "..." : formatPaiseToRupees(metrics?.totalCollected || 0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Realized revenue in bank & cash</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-amber-700">Outstanding Dues</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {isLoading ? "..." : formatPaiseToRupees(metrics?.totalOutstanding || 0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{metrics?.partialCount || 0} partial payment plans</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-red-700">Overdue Installments</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {isLoading ? "..." : formatPaiseToRupees(metrics?.overdueAmount || 0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Past scheduled payment milestone</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Recent Payment Transactions</CardTitle>
              <p className="text-xs text-slate-500">Live feed of verified fee receipts</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-emerald-700">
              <Link href="/admin/finance/payments" className="flex items-center gap-1">
                <span>View All Payments</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-slate-700">Reference</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Student</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Method</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Amount</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-xs text-slate-400">
                      Loading recent transactions...
                    </TableCell>
                  </TableRow>
                ) : !metrics?.recentPayments || metrics.recentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-xs text-slate-400">
                      No payment transactions recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  metrics.recentPayments.map((p) => (
                    <TableRow key={p.id} className="text-xs hover:bg-slate-50/50">
                      <TableCell className="font-mono font-semibold text-slate-900">
                        {p.transactionReference}
                      </TableCell>
                      <TableCell>
                        {p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : "Admitted Student"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {p.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-emerald-700">
                        {formatPaiseToRupees(p.amount)}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(p.paymentDate)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Operations Guide */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">Finance Operations</CardTitle>
            <p className="text-xs text-slate-500">Institutional policies & rules</p>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <div className="rounded-md bg-slate-50 p-3 border border-slate-100 space-y-1">
              <p className="font-bold text-slate-800">Deterministic Integer Paise</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                All amounts are saved and verified in integer Paise (₹1 = 100 Paise) to guarantee precision without floating-point drift.
              </p>
            </div>

            <div className="rounded-md bg-slate-50 p-3 border border-slate-100 space-y-1">
              <p className="font-bold text-slate-800">Non-Negative Payable Rule</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Discounts and scholarships are bounded server-side and can never exceed the gross tuition and registration fee.
              </p>
            </div>

            <div className="rounded-md bg-slate-50 p-3 border border-slate-100 space-y-1">
              <p className="font-bold text-slate-800">Strict Overpayment Prevention</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Offline payments exceeding the current outstanding pending balance are blocked at the transactional boundary.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Structures Ledger Section */}
      <div className="space-y-3 pt-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Active Student Fee Structures</h3>
          <p className="text-xs text-slate-500">Manage enrollment fee structures, installments, and collections</p>
        </div>
        <FeeStructuresTable />
      </div>
    </div>
  );
}
