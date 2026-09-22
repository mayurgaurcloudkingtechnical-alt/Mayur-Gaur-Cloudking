"use client";

import * as React from "react";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc/react";
import { FeePaymentStatus } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaiseToRupees, formatDate } from "@/lib/utils";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { EditFeeStructureDialog } from "./edit-fee-structure-dialog";
import { DualFeeReceipt, DualReceiptData } from "@/components/common/dual-fee-receipt";
import { IndianRupee, Search, CreditCard, Download, Edit, Printer, Loader2, X, Filter } from "lucide-react";

interface FeeStructuresTableProps {
  initialStudentId?: string;
}

export function FeeStructuresTable({ initialStudentId }: FeeStructuresTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentIdFromUrl = searchParams.get("studentId") || initialStudentId;

  const [filterStudentId, setFilterStudentId] = useState<string | undefined>(studentIdFromUrl || undefined);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FeePaymentStatus | undefined>(undefined);

  // State for collecting payment
  const [selectedFee, setSelectedFee] = useState<{
    id: string;
    studentName: string;
    pendingAmountPaise: number;
    installments: Array<{ id: string; installmentNumber: number; amount: number; paidAmount: number }>;
  } | null>(null);

  // State for editing fee structure
  const [editingFee, setEditingFee] = useState<any | null>(null);

  // State for viewing receipt
  const [viewingReceipt, setViewingReceipt] = useState<DualReceiptData | null>(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data, isLoading } = api.finance.listFeeStructures.useQuery({
    search: search.trim() || undefined,
    paymentStatus: statusFilter,
    studentId: filterStudentId || undefined,
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
    // Remove studentId from query params in URL
    const url = new URL(window.location.href);
    url.searchParams.delete("studentId");
    router.replace(url.pathname);
  };

  const exportFeesCSV = () => {
    if (!data?.items || data.items.length === 0) {
      alert("No fee structures to export.");
      return;
    }
    const headers = [
      "Student Name",
      "Student ID",
      "Email",
      "Course",
      "Base Fee (INR)",
      "Discount (INR)",
      "Payable Fee (INR)",
      "Paid Amount (INR)",
      "Pending Balance (INR)",
      "Payment Status",
      "Remarks",
    ];
    const rows = data.items.map((item: any) => [
      `"${item.student.user.firstName} ${item.student.user.lastName}"`,
      `"${item.student.studentId || ""}"`,
      `"${item.student.user.email}"`,
      `"${item.course.title}"`,
      (item.totalCourseFee / 100).toFixed(2),
      (item.discountAmount / 100).toFixed(2),
      (item.netPayableAmount / 100).toFixed(2),
      (item.paidAmount / 100).toFixed(2),
      (item.pendingAmount / 100).toFixed(2),
      `"${item.paymentStatus}"`,
      `"${item.remarks || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SoftLab_Fee_Structures_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Active Student Filter Notification Banner */}
      {filterStudentId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between text-xs text-blue-900 shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <Filter className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Filtered to specific student profile ID: <strong className="font-mono text-blue-800">{filterStudentId}</strong>
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

          <Button
            size="sm"
            variant="outline"
            onClick={exportFeesCSV}
            className="text-xs h-8 border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            title="Export fee structures CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-xs font-semibold text-slate-700">Student</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Course & Cohort</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Total Fee</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Discount</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Payable</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Paid</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Pending</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-xs text-slate-400">
                  Loading financial records...
                </TableCell>
              </TableRow>
            ) : !data || data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-xs text-slate-400">
                  No fee records found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((fee: any) => {
                const latestPayment = fee.payments && fee.payments.length > 0 ? fee.payments[0] : null;
                const studentFullName = `${fee.student.user.firstName} ${fee.student.user.lastName}`;

                return (
                  <TableRow key={fee.id} className="text-xs hover:bg-slate-50/50">
                    <TableCell>
                      <div>
                        <p className="font-bold text-slate-900">{studentFullName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{fee.student.studentId}</p>
                        {fee.remarks && (
                          <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5" title={fee.remarks}>
                            {fee.remarks}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-800 line-clamp-1">{fee.course.title}</p>
                      <p className="text-[11px] text-slate-400">{fee.batch?.code || "Unassigned Cohort"}</p>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">
                      {formatPaiseToRupees(fee.totalCourseFee)}
                    </TableCell>
                    <TableCell className="font-medium text-amber-600">
                      {fee.discountAmount > 0 ? `-${formatPaiseToRupees(fee.discountAmount)}` : "₹0"}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      {formatPaiseToRupees(fee.netPayableAmount)}
                    </TableCell>
                    <TableCell className="text-emerald-700 font-semibold">
                      {formatPaiseToRupees(fee.paidAmount)}
                    </TableCell>
                    <TableCell className="font-bold text-rose-600">
                      {formatPaiseToRupees(fee.pendingAmount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(fee.paymentStatus)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Print Receipt button (if student has paid payments) */}
                        {latestPayment && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReceipt(latestPayment.id)}
                            disabled={loadingReceiptId === latestPayment.id}
                            className="h-7 px-2 text-xs border-slate-300 text-blue-700 hover:bg-blue-50 font-medium inline-flex items-center gap-1"
                            title={`View & Print Official Receipt (${latestPayment.receiptNumber || "SLG-REC"})`}
                          >
                            {loadingReceiptId === latestPayment.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Printer className="h-3 w-3" />
                            )}
                            <span className="hidden sm:inline">Receipt</span>
                          </Button>
                        )}

                        {/* Edit Fee Structure button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setEditingFee({
                              id: fee.id,
                              studentName: studentFullName,
                              studentId: fee.student.studentId,
                              courseTitle: fee.course.title,
                              totalCourseFee: fee.totalCourseFee,
                              discountAmount: fee.discountAmount,
                              scholarshipAmount: fee.scholarshipAmount,
                              paidAmount: fee.paidAmount,
                              pendingAmount: fee.pendingAmount,
                              remarks: fee.remarks,
                              installments: fee.installments || [],
                            })
                          }
                          className="h-7 px-2 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 font-medium inline-flex items-center gap-1"
                          title="Edit total fee, discount, remarks or installments"
                        >
                          <Edit className="h-3 w-3 text-slate-600" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>

                        {/* Collect Fee button if pending balance remains */}
                        {fee.pendingAmount > 0 && (
                          <Button
                            size="sm"
                            onClick={() =>
                              setSelectedFee({
                                id: fee.id,
                                studentName: studentFullName,
                                pendingAmountPaise: fee.pendingAmount,
                                installments: (fee.installments || []).map((i: any) => ({
                                  id: i.id,
                                  installmentNumber: i.installmentNumber,
                                  amount: i.amount,
                                  paidAmount: i.paidAmount,
                                })),
                              })
                            }
                            className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium inline-flex items-center gap-1"
                            title="Record offline fee payment"
                          >
                            <IndianRupee className="h-3 w-3" />
                            <span className="hidden sm:inline">Collect</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Record Payment Dialog */}
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

      {/* Edit Fee Structure Dialog */}
      {editingFee && (
        <EditFeeStructureDialog
          open={!!editingFee}
          onOpenChange={(open) => !open && setEditingFee(null)}
          feeStructure={editingFee}
          onSuccess={() => {
            utils.finance.listFeeStructures.invalidate();
            utils.finance.getOverviewMetrics.invalidate();
            setEditingFee(null);
          }}
        />
      )}

      {/* Printable Dual Fee Receipt Viewer Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <DualFeeReceipt
              data={viewingReceipt}
              onClose={() => setViewingReceipt(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
