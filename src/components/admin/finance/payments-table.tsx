"use client";

import * as React from "react";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc/react";
import { PaymentMethod } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPaiseToRupees, formatDate } from "@/lib/utils";
import { EditPaymentDialog } from "./edit-payment-dialog";
import { DualFeeReceipt, DualReceiptData } from "@/components/common/dual-fee-receipt";
import { Edit, Printer, Loader2, Download, Filter, X } from "lucide-react";

interface PaymentsTableProps {
  initialStudentId?: string;
}

export function PaymentsTable({ initialStudentId }: PaymentsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentIdFromUrl = searchParams.get("studentId") || initialStudentId;

  const [filterStudentId, setFilterStudentId] = useState<string | undefined>(studentIdFromUrl || undefined);
  const [page, setPage] = useState(1);
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | undefined>(undefined);

  // Edit payment modal state
  const [editingPayment, setEditingPayment] = useState<any | null>(null);

  // Dual fee receipt modal state
  const [viewingReceipt, setViewingReceipt] = useState<DualReceiptData | null>(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data, isLoading } = api.finance.listPayments.useQuery({
    page,
    limit: 20,
    studentId: filterStudentId || undefined,
    paymentMethod: methodFilter,
  });

  const handleOpenReceipt = async (identifier: string) => {
    try {
      setLoadingReceiptId(identifier);
      const res = await utils.finance.getPaymentReceipt.fetch({ identifier });
      if (res) {
        setViewingReceipt({
          receiptNumber: res.receiptNumber,
          receiptDate: res.receiptDate,
          studentName: res.student.name,
          studentId: res.student.studentId || "SG-STUDENT",
          admissionNumber: res.admission?.applicationNumber || "N/A",
          courseTitle: res.course.title,
          totalFee: res.financials.totalCourseFeePaise,
          discountAmount: res.financials.discountPaise,
          netPayable: res.financials.netPayablePaise,
          amountPaid: res.financials.amountPaidPaise,
          pendingAmount: Math.max(0, res.financials.netPayablePaise - res.financials.amountPaidPaise),
          amountInWords: res.financials.amountInWords,
          paymentMode: res.payment.paymentMethod,
          transactionReference: res.payment.transactionReference,
          feeStructureId: res.payment.feeStructureId || undefined,
          paymentId: res.payment.id || identifier,
        });
      }
    } catch (err: any) {
      alert("Failed to load fee receipt: " + (err.message || "Unknown error"));
    } finally {
      setLoadingReceiptId(null);
    }
  };

  const clearStudentFilter = () => {
    setFilterStudentId(undefined);
    const url = new URL(window.location.href);
    url.searchParams.delete("studentId");
    router.replace(url.pathname);
  };

  const exportPaymentsCSV = () => {
    if (!data?.items || data.items.length === 0) {
      alert("No payments to export.");
      return;
    }
    const headers = [
      "Receipt Number",
      "Student Name",
      "Student ID",
      "Course",
      "Amount Paid (INR)",
      "Total Fee (INR)",
      "Pending Balance (INR)",
      "Method",
      "Provider Ref",
      "Date",
      "Remarks",
    ];
    const rows = data.items.map((p: any) => {
      const studentName = p.student?.user
        ? `${p.student.user.firstName} ${p.student.user.lastName}`
        : p.admission?.applicantName || "Admitted Learner";
      const studentCode = p.student?.studentId || p.admission?.applicationNumber || "";
      const courseTitle =
        p.feeStructure?.course?.title || p.admission?.course?.title || "Professional Course";
      const totalFeeVal = p.feeStructure?.totalCourseFee || p.feeStructure?.netPayableAmount || (p.admission?.finalFee ? p.admission.finalFee * 100 : p.amount);
      const pendingVal = p.feeStructure?.pendingAmount ?? (p.feeStructure && p.feeStructure.netPayableAmount ? Math.max(0, p.feeStructure.netPayableAmount - p.feeStructure.paidAmount) : 0);
      return [
        `"${p.receiptNumber || p.transactionReference}"`,
        `"${studentName}"`,
        `"${studentCode}"`,
        `"${courseTitle}"`,
        (p.amount / 100).toFixed(2),
        (totalFeeVal / 100).toFixed(2),
        (pendingVal / 100).toFixed(2),
        `"${p.paymentMethod}"`,
        `"${p.gatewayOrderId || p.providerReference || ""}"`,
        `"${new Date(p.paymentDate).toISOString().slice(0, 10)}"`,
        `"${p.remarks || ""}"`,
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SoftLab_Payments_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Filter Notification Banner */}
      {filterStudentId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between text-xs text-blue-900 shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <Filter className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Transactions filtered to student ID: <strong className="font-mono text-blue-800">{filterStudentId}</strong>
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clearStudentFilter}
            className="h-7 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Clear Filter
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
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

        <Button
          size="sm"
          variant="outline"
          onClick={exportPaymentsCSV}
          className="text-xs h-8 border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          title="Export payments ledger CSV"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span>Export CSV</span>
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
              <TableHead className="text-xs font-semibold text-slate-700">Amount Paid</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Total Fee</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Pending</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Received By</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Date</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="py-8 text-center text-xs text-slate-400">
                  Loading payment history...
                </TableCell>
              </TableRow>
            ) : !data || data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="py-8 text-center text-xs text-slate-400">
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
                const totalFee =
                  p.feeStructure?.totalCourseFee ||
                  p.feeStructure?.netPayableAmount ||
                  (p.admission?.finalFee ? p.admission.finalFee * 100 : null);
                const pendingAmount =
                  p.feeStructure?.pendingAmount ??
                  (p.feeStructure && p.feeStructure.netPayableAmount
                    ? Math.max(0, p.feeStructure.netPayableAmount - p.feeStructure.paidAmount)
                    : null);

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
                    <TableCell className="font-medium text-slate-700">
                      {totalFee ? formatPaiseToRupees(totalFee) : "—"}
                    </TableCell>
                    <TableCell className="font-medium text-rose-600">
                      {pendingAmount !== null ? formatPaiseToRupees(pendingAmount) : "—"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {receiverName}
                    </TableCell>
                    <TableCell className="text-slate-500">{formatDate(p.paymentDate)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Receipt Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenReceipt(p.id)}
                          disabled={loadingReceiptId === p.id}
                          className="h-7 px-2 text-xs border-slate-300 text-blue-700 hover:bg-blue-50 font-medium inline-flex items-center gap-1"
                          title="Print official fee receipt"
                        >
                          {loadingReceiptId === p.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Printer className="h-3 w-3" />
                          )}
                          <span className="hidden sm:inline">Receipt</span>
                        </Button>

                        {/* Edit Payment Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setEditingPayment({
                              id: p.id,
                              studentName,
                              amount: p.amount,
                              paymentMethod: p.paymentMethod,
                              providerReference: p.providerReference,
                              receiptNumber: p.receiptNumber,
                              paymentDate: p.paymentDate,
                              remarks: p.remarks,
                            })
                          }
                          className="h-7 px-2 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 font-medium inline-flex items-center gap-1"
                          title="Edit payment amount, mode, receipt number, or reference"
                        >
                          <Edit className="h-3 w-3 text-slate-600" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </div>
                    </TableCell>
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

      {/* Edit Payment Dialog */}
      {editingPayment && (
        <EditPaymentDialog
          open={!!editingPayment}
          onOpenChange={(open) => !open && setEditingPayment(null)}
          payment={editingPayment}
          onSuccess={() => {
            utils.finance.listPayments.invalidate();
            utils.finance.listFeeStructures.invalidate();
            utils.finance.getOverviewMetrics.invalidate();
            setEditingPayment(null);
          }}
        />
      )}

      {/* Dual Fee Receipt Viewer Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center overflow-y-auto print:bg-white print:p-0 print:m-0 print:overflow-visible">
          <DualFeeReceipt
            data={viewingReceipt}
            onClose={() => setViewingReceipt(null)}
          />
        </div>
      )}
    </div>
  );
}
