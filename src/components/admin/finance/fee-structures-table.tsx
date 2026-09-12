"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { FeePaymentStatus } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaiseToRupees, formatDate } from "@/lib/utils";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { IndianRupee, Search, CreditCard } from "lucide-react";

export function FeeStructuresTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FeePaymentStatus | undefined>(undefined);
  const [selectedFee, setSelectedFee] = useState<{
    id: string;
    studentName: string;
    pendingAmountPaise: number;
    installments: Array<{ id: string; installmentNumber: number; amount: number; paidAmount: number }>;
  } | null>(null);

  const utils = api.useUtils();
  const { data, isLoading } = api.finance.listFeeStructures.useQuery({
    search: search.trim() || undefined,
    paymentStatus: statusFilter,
    limit: 25,
  });

  const getStatusBadge = (status: FeePaymentStatus) => {
    switch (status) {
      case FeePaymentStatus.PAID:
        return <Badge className="bg-emerald-100 text-emerald-800 text-[11px] font-bold">PAID</Badge>;
      case FeePaymentStatus.PARTIAL:
        return <Badge className="bg-amber-100 text-amber-800 text-[11px] font-bold">PARTIAL</Badge>;
      case FeePaymentStatus.OVERDUE:
        return <Badge className="bg-red-100 text-red-800 text-[11px] font-bold">OVERDUE</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 text-[11px] font-bold">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search student name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={statusFilter === undefined ? "default" : "outline"}
            onClick={() => setStatusFilter(undefined)}
            className="text-xs h-8"
          >
            All
          </Button>
          <Button
            size="sm"
            variant={statusFilter === FeePaymentStatus.PENDING ? "default" : "outline"}
            onClick={() => setStatusFilter(FeePaymentStatus.PENDING)}
            className="text-xs h-8"
          >
            Pending
          </Button>
          <Button
            size="sm"
            variant={statusFilter === FeePaymentStatus.PARTIAL ? "default" : "outline"}
            onClick={() => setStatusFilter(FeePaymentStatus.PARTIAL)}
            className="text-xs h-8"
          >
            Partial
          </Button>
          <Button
            size="sm"
            variant={statusFilter === FeePaymentStatus.PAID ? "default" : "outline"}
            onClick={() => setStatusFilter(FeePaymentStatus.PAID)}
            className="text-xs h-8"
          >
            Paid
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-xs font-semibold text-slate-700">Student</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Course & Cohort</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Total Net</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Paid</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Outstanding</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  Loading financial records...
                </TableCell>
              </TableRow>
            ) : !data || data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  No fee records found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((fee) => (
                <TableRow key={fee.id} className="text-xs hover:bg-slate-50/50">
                  <TableCell>
                    <div>
                      <p className="font-bold text-slate-900">
                        {fee.student.user.firstName} {fee.student.user.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">{fee.student.studentId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-slate-800 line-clamp-1">{fee.course.title}</p>
                    <p className="text-[11px] text-slate-400">{fee.batch?.code || "Unassigned Cohort"}</p>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {formatPaiseToRupees(fee.netPayableAmount)}
                  </TableCell>
                  <TableCell className="text-emerald-700 font-medium">
                    {formatPaiseToRupees(fee.paidAmount)}
                  </TableCell>
                  <TableCell className="font-semibold text-amber-800">
                    {formatPaiseToRupees(fee.pendingAmount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(fee.paymentStatus)}</TableCell>
                  <TableCell className="text-right">
                    {fee.pendingAmount > 0 ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          setSelectedFee({
                            id: fee.id,
                            studentName: `${fee.student.user.firstName} ${fee.student.user.lastName}`,
                            pendingAmountPaise: fee.pendingAmount,
                            installments: [],
                          })
                        }
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium inline-flex items-center gap-1"
                      >
                        <IndianRupee className="h-3.5 w-3.5" />
                        <span>Collect Fee</span>
                      </Button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-600">Settled</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedFee && (
        <RecordPaymentDialog
          open={!!selectedFee}
          onOpenChange={(open) => !open && setSelectedFee(null)}
          feeStructureId={selectedFee.id}
          studentName={selectedFee.studentName}
          pendingAmountPaise={selectedFee.pendingAmountPaise}
          installments={selectedFee.installments}
          onSuccess={() => {
            utils.finance.listFeeStructures.invalidate();
            utils.finance.getOverviewMetrics.invalidate();
          }}
        />
      )}
    </div>
  );
}
