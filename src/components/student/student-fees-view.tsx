"use client";

import * as React from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPaiseToRupees, formatDate } from "@/lib/utils";
import { IndianRupee, Clock, CheckCircle2, AlertCircle, FileText, Calendar } from "lucide-react";
import { FeePaymentStatus, InstallmentStatus } from "@prisma/client";

export function StudentFeesView() {
  const { data, isLoading, error } = api.finance.getMyFeeOverview.useQuery();

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading tuition fee ledger & receipts...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-xs text-red-700 border border-red-200">
        {error?.message || "Failed to load fee information."}
      </div>
    );
  }

  const { feeStructures } = data;

  if (feeStructures.length === 0) {
    return (
      <Card className="border-slate-200 bg-white">
        <CardContent className="py-12 text-center text-xs text-slate-500">
          No fee plan has been configured for your active enrollments yet. Please contact the accounts desk.
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: FeePaymentStatus) => {
    switch (status) {
      case FeePaymentStatus.PAID:
        return <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold">SETTLED (PAID)</Badge>;
      case FeePaymentStatus.PARTIAL:
        return <Badge className="bg-amber-100 text-amber-800 text-xs font-bold">PARTIALLY PAID</Badge>;
      case FeePaymentStatus.OVERDUE:
        return <Badge className="bg-red-100 text-red-800 text-xs font-bold">OVERDUE</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 text-xs font-bold">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {feeStructures.map((fee) => (
        <div key={fee.id} className="space-y-4">
          {/* Main Fee Card */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">{fee.course.title}</CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Batch: <strong>{fee.batch?.code || "Direct Enrollment"}</strong> • Student ID:{" "}
                    <strong>{data.studentId}</strong>
                  </CardDescription>
                </div>
                <div>{getStatusBadge(fee.paymentStatus)}</div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Financial summary metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Total Course Fee</span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatPaiseToRupees(fee.totalCourseFee)}
                  </span>
                  {fee.registrationFee > 0 && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      + {formatPaiseToRupees(fee.registrationFee)} reg
                    </span>
                  )}
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Concession / Scholarship</span>
                  <span className="text-sm font-bold text-emerald-700">
                    {fee.discountAmount + fee.scholarshipAmount > 0
                      ? `- ${formatPaiseToRupees(fee.discountAmount + fee.scholarshipAmount)}`
                      : "₹0"}
                  </span>
                  {fee.scholarshipAmount > 0 && (
                    <span className="text-[10px] text-emerald-600 block mt-0.5">Merit grant applied</span>
                  )}
                </div>

                <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-100">
                  <span className="text-slate-600 block text-[11px]">Total Paid Amount</span>
                  <span className="text-sm font-bold text-emerald-800">
                    {formatPaiseToRupees(fee.paidAmount)}
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    {fee.payments.length} verified receipts
                  </span>
                </div>

                <div className="rounded-lg bg-amber-50/70 p-3 border border-amber-100">
                  <span className="text-slate-600 block text-[11px]">Remaining Outstanding</span>
                  <span className="text-sm font-bold text-amber-800">
                    {formatPaiseToRupees(fee.pendingAmount)}
                  </span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">
                    Net: {formatPaiseToRupees(fee.netPayableAmount)}
                  </span>
                </div>
              </div>

              {/* Installment Milestone Schedule */}
              {fee.installments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>Installment Milestone Schedule</span>
                  </h4>
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="text-[11px] font-semibold text-slate-700">#</TableHead>
                          <TableHead className="text-[11px] font-semibold text-slate-700">Due Date</TableHead>
                          <TableHead className="text-[11px] font-semibold text-slate-700">Installment Amount</TableHead>
                          <TableHead className="text-[11px] font-semibold text-slate-700">Paid Amount</TableHead>
                          <TableHead className="text-[11px] font-semibold text-slate-700">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fee.installments.map((inst) => (
                          <TableRow key={inst.id} className="text-xs">
                            <TableCell className="font-bold text-slate-700">#{inst.installmentNumber}</TableCell>
                            <TableCell className="text-slate-600">{formatDate(inst.dueDate)}</TableCell>
                            <TableCell className="font-semibold text-slate-900">
                              {formatPaiseToRupees(inst.amount)}
                            </TableCell>
                            <TableCell className="text-emerald-700 font-medium">
                              {formatPaiseToRupees(inst.paidAmount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  inst.status === InstallmentStatus.PAID
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                                    : inst.status === InstallmentStatus.PARTIAL
                                    ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                                    : new Date(inst.dueDate) < new Date()
                                    ? "bg-red-50 text-red-700 border-red-200 text-[10px]"
                                    : "text-[10px]"
                                }
                              >
                                {inst.status === InstallmentStatus.PENDING && new Date(inst.dueDate) < new Date()
                                  ? "OVERDUE"
                                  : inst.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Verified Receipts Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Verified Payment Receipts ({fee.payments.length})</span>
                </h4>
                {fee.payments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No payment receipts logged yet. Offline payments can be submitted at the campus office.
                  </p>
                ) : (
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="text-[11px] font-semibold text-slate-700">Receipt Ref</TableHead>
                          <TableHead className="text-[11px] font-semibold text-slate-700">Date</TableHead>
                          <TableHead className="text-[11px] font-semibold text-slate-700">Payment Mode</TableHead>
                          <TableHead className="text-[11px] font-semibold text-slate-700">Transaction ID</TableHead>
                          <TableHead className="text-[11px] font-semibold text-slate-700 text-right">Amount Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fee.payments.map((p) => (
                          <TableRow key={p.id} className="text-xs">
                            <TableCell className="font-mono font-bold text-slate-900">
                              {p.transactionReference}
                            </TableCell>
                            <TableCell className="text-slate-600">{formatDate(p.paymentDate)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                                {p.paymentMethod}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-slate-500 text-[11px]">
                              {p.providerReference || "Cash Desk Receipt"}
                            </TableCell>
                            <TableCell className="font-bold text-emerald-700 text-right">
                              {formatPaiseToRupees(p.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
