"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { PaymentMethod } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPaiseToRupees, formatDate } from "@/lib/utils";

export function PaymentsTable() {
  const [page, setPage] = useState(1);
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | undefined>(undefined);

  const { data, isLoading } = api.finance.listPayments.useQuery({
    page,
    limit: 20,
    paymentMethod: methodFilter,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={methodFilter === undefined ? "default" : "outline"}
          onClick={() => { setMethodFilter(undefined); setPage(1); }}
          className="text-xs h-8"
        >
          All Modes
        </Button>
        <Button
          size="sm"
          variant={methodFilter === PaymentMethod.UPI ? "default" : "outline"}
          onClick={() => { setMethodFilter(PaymentMethod.UPI); setPage(1); }}
          className="text-xs h-8"
        >
          UPI
        </Button>
        <Button
          size="sm"
          variant={methodFilter === PaymentMethod.CASH ? "default" : "outline"}
          onClick={() => { setMethodFilter(PaymentMethod.CASH); setPage(1); }}
          className="text-xs h-8"
        >
          Cash
        </Button>
        <Button
          size="sm"
          variant={methodFilter === PaymentMethod.BANK_TRANSFER ? "default" : "outline"}
          onClick={() => { setMethodFilter(PaymentMethod.BANK_TRANSFER); setPage(1); }}
          className="text-xs h-8"
        >
          Bank Transfer
        </Button>
        <Button
          size="sm"
          variant={methodFilter === PaymentMethod.CARD ? "default" : "outline"}
          onClick={() => { setMethodFilter(PaymentMethod.CARD); setPage(1); }}
          className="text-xs h-8"
        >
          Card
        </Button>
        <Button
          size="sm"
          variant={methodFilter === PaymentMethod.RAZORPAY ? "default" : "outline"}
          onClick={() => { setMethodFilter(PaymentMethod.RAZORPAY); setPage(1); }}
          className="text-xs h-8"
        >
          Razorpay
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-xs font-semibold text-slate-700">Receipt Ref</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Student</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Course</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Mode</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Provider Ref</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Amount</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Received By</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-400">
                  Loading payment history...
                </TableCell>
              </TableRow>
            ) : !data || data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-400">
                  No payment records found.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((p: any) => {
                const studentName = p.student?.user
                  ? `${p.student.user.firstName} ${p.student.user.lastName}`
                  : p.admission?.applicantName || "Admitted Learner";
                const studentCode = p.student?.studentId || p.admission?.applicationNumber || "—";
                const courseTitle =
                  p.feeStructure?.course?.title || p.admission?.course?.title || "Professional Course";
                const receiverName = p.receivedBy
                  ? `${p.receivedBy.firstName} ${p.receivedBy.lastName}`
                  : "Razorpay Gateway";

                return (
                  <TableRow key={p.id} className="text-xs hover:bg-slate-50/50">
                    <TableCell className="font-mono font-bold text-slate-900">
                      {p.receiptNumber || p.transactionReference}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-slate-800">{studentName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{studentCode}</p>
                    </TableCell>
                    <TableCell className="text-slate-700 max-w-[180px] truncate">
                      {courseTitle}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                        {p.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-slate-600 text-[11px]">
                      {p.gatewayOrderId || p.providerReference || "—"}
                    </TableCell>
                    <TableCell className="font-bold text-emerald-700">
                      {formatPaiseToRupees(p.amount)}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {receiverName}
                    </TableCell>
                    <TableCell className="text-slate-500">{formatDate(p.paymentDate)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>Page {data.page} of {data.totalPages}</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={data.page <= 1}
              className="h-7 text-xs"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={data.page >= data.totalPages}
              className="h-7 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
