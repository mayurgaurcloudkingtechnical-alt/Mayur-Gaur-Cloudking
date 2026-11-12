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
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { IndianRupee, Search, CreditCard, Download, Edit, Printer, Loader2, X, Filter, Trash2, Eye, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface FeeStructuresTableProps {
  initialStudentId?: string;
  externalStatusFilter?: FeePaymentStatus;
  onOpenOverdueDesk?: () => void;
}

export function FeeStructuresTable({ initialStudentId, externalStatusFilter, onOpenOverdueDesk }: FeeStructuresTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentIdFromUrl = searchParams.get("studentId") || initialStudentId;

  const [filterStudentId, setFilterStudentId] = useState<string | undefined>(studentIdFromUrl || undefined);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FeePaymentStatus | undefined>(externalStatusFilter || undefined);

  React.useEffect(() => {
    if (externalStatusFilter !== undefined) {
      setStatusFilter(externalStatusFilter);
    }
  }, [externalStatusFilter]);

  // State for collecting payment
  const [selectedFee, setSelectedFee] = useState<{
    id: string;
    studentName: string;
    pendingAmountPaise: number;
    installments: Array<{ id: string; installmentNumber: number; amount: number; paidAmount: number }>;
  } | null>(null);

  // State for editing fee structure
  const [editingFee, setEditingFee] = useState<any | null>(null);

  // State for viewing detailed fee breakdown modal
  const [breakdownFee, setBreakdownFee] = useState<any | null>(null);

  // State for viewing receipt
  const [viewingReceipt, setViewingReceipt] = useState<DualReceiptData | null>(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);

  // State for multi-receipt selection dialog (down payment + every EMI installment)
  const [receiptSelectionStudent, setReceiptSelectionStudent] = useState<{
    studentName: string;
    studentId: string;
    courseTitle: string;
    totalFee: number;
    paidAmount: number;
    pendingAmount: number;
    payments: Array<any>;
  } | null>(null);

  const utils = api.useUtils();
  const { data, isLoading } = api.finance.listFeeStructures.useQuery({
    search: search.trim() || undefined,
    paymentStatus: statusFilter,
    studentId: filterStudentId || undefined,
    limit: 25,
  });

  const deleteFeeMutation = api.finance.deleteFeeStructure.useMutation({
    onSuccess: () => {
      utils.finance.listFeeStructures.invalidate();
      utils.finance.getOverviewMetrics.invalidate();
      alert("Fee structure record deleted successfully.");
    },
    onError: (err) => {
      alert(err.message || "Failed to delete fee structure.");
    },
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
          pendingAmount:
            res.financials.pendingAmountPaise !== undefined
              ? res.financials.pendingAmountPaise
              : Math.max(0, res.financials.netPayablePaise - (res.financials.totalPaidSoFarPaise ?? res.financials.amountPaidPaise)),
          previousCollections: res.financials.previousCollectionsPaise,
          totalPaidSoFar: res.financials.totalPaidSoFarPaise,
          amountInWords: res.financials.amountInWords,
          paymentMode: res.payment.paymentMethod,
          transactionReference: res.payment.transactionReference,
          feeStructureId: res.payment.feeStructureId || undefined,
          paymentId: res.payment.id || identifier,
          globalCertificationFee: res.financials.globalCertFeePaise || 0,
          slgKitFee: res.financials.slgKitFeePaise || 0,
          taxableAmount: res.financials.taxableBasePaise || 0,
          cgstAmount: res.financials.cgstPaise || 0,
          sgstAmount: res.financials.sgstPaise || 0,
          totalGstAmount: res.financials.totalGstPaise || 0,
          sacCode: res.financials.sacCode || "999293",
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
      "Course Fee (INR)",
      "Discount (INR)",
      "Net Course Fee (INR)",
      "Additional Charges (INR)",
      "GST (INR)",
      "Final Payable (INR)",
      "Paid Amount (INR)",
      "Pending Balance (INR)",
      "Payment Status",
      "Policy Version",
      "Remarks",
    ];
    const rows = data.items.map((item: any) => [
      `"${item.student.user.firstName} ${item.student.user.lastName}"`,
      `"${item.student.studentId || ""}"`,
      `"${item.student.user.email}"`,
      `"${item.course.title}"`,
      ((item.baseCourseFee ?? item.totalCourseFee) / 100).toFixed(2),
      ((item.discountAmount || 0) / 100).toFixed(2),
      ((item.discountedCourseFee ?? Math.max(0, (item.totalCourseFee || 0) - (item.discountAmount || 0))) / 100).toFixed(2),
      ((item.totalAdditionalCharges || 0) / 100).toFixed(2),
      ((item.gstAmount || 0) / 100).toFixed(2),
      ((item.finalPayable ?? item.netPayableAmount) / 100).toFixed(2),
      ((item.paidAmount || 0) / 100).toFixed(2),
      ((item.pendingAmount || 0) / 100).toFixed(2),
      `"${item.paymentStatus}"`,
      `"${item.policyVersion || (item.isHistoricalAdjusted ? "V2_HISTORICAL_ADJUSTED" : "STANDARD")}"`,
      `"${(item.remarks || "").replace(/"/g, '""')}"`,
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
            variant={statusFilter === FeePaymentStatus.OVERDUE ? "default" : "outline"}
            onClick={() => {
              setStatusFilter(FeePaymentStatus.OVERDUE);
              if (onOpenOverdueDesk) onOpenOverdueDesk();
            }}
            className={`text-xs h-8 ${
              statusFilter === FeePaymentStatus.OVERDUE
                ? "bg-rose-600 hover:bg-rose-700 text-white font-bold"
                : "border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold"
            }`}
          >
            Overdue
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
              <TableHead className="text-xs font-semibold text-slate-700">Course Fee</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Discount</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Net Course Fee</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Additional Charges</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">GST</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Final Payable</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Paid</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Pending</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} className="py-8 text-center text-xs text-slate-400">
                  Loading financial records...
                </TableCell>
              </TableRow>
            ) : !data || data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="py-8 text-center text-xs text-slate-400">
                  No fee records found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((fee: any) => {
                const latestPayment = fee.payments && fee.payments.length > 0 ? fee.payments[0] : null;
                const studentFullName = `${fee.student.user.firstName} ${fee.student.user.lastName}`;
                const baseFee = fee.baseCourseFee ?? fee.totalCourseFee;
                const discount = fee.discountAmount || 0;
                const netCourseFee = fee.discountedCourseFee ?? Math.max(0, baseFee - discount);
                const addCharges = fee.totalAdditionalCharges || 0;
                const gst = fee.gstAmount || 0;
                const finalPayable = fee.finalPayable ?? fee.netPayableAmount;
                const paid = fee.paidAmount || 0;
                const pending = fee.pendingAmount || 0;

                return (
                  <TableRow key={fee.id} className="text-xs hover:bg-slate-50/50">
                    <TableCell>
                      <div>
                        <p className="font-bold text-slate-900">{studentFullName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{fee.student.studentId}</p>
                        {fee.isHistoricalAdjusted && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 mt-0.5 bg-sky-50 text-sky-700 border-sky-200">
                            Reconciled (V2)
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-800 line-clamp-1">{fee.course.title}</p>
                      <p className="text-[11px] text-slate-400">{fee.batch?.code || "Unassigned Cohort"}</p>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700 font-mono">
                      {formatPaiseToRupees(baseFee)}
                    </TableCell>
                    <TableCell className="font-medium text-amber-600 font-mono">
                      {discount > 0 ? `-${formatPaiseToRupees(discount)}` : "₹0"}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 font-mono">
                      {formatPaiseToRupees(netCourseFee)}
                    </TableCell>
                    <TableCell className="font-medium text-slate-600 font-mono">
                      {addCharges > 0 ? (
                        <span className="text-indigo-700 font-semibold" title={`Kit: ${formatPaiseToRupees(fee.kitFee || 0)}, Cert: ${formatPaiseToRupees(fee.globalCertificationFee || 0)}, Other: ${formatPaiseToRupees(fee.otherCharges || 0)}`}>
                          +{formatPaiseToRupees(addCharges)}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-slate-600 font-mono">
                      {gst > 0 ? (
                        <span className="text-slate-700 font-semibold">
                          +{formatPaiseToRupees(gst)}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 font-mono">
                      {formatPaiseToRupees(finalPayable)}
                    </TableCell>
                    <TableCell className="text-emerald-700 font-semibold font-mono">
                      {formatPaiseToRupees(paid)}
                    </TableCell>
                    <TableCell className="font-bold text-rose-600 font-mono">
                      {formatPaiseToRupees(pending)}
                    </TableCell>
                    <TableCell>{getStatusBadge(fee.paymentStatus)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Breakdown inspection button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setBreakdownFee(fee)}
                          className="h-7 px-2 text-xs text-indigo-700 hover:bg-indigo-50 font-medium inline-flex items-center gap-1"
                          title="Inspect canonical fee breakdown & audit log"
                        >
                          <Eye className="h-3.5 w-3.5 text-indigo-600" />
                          <span className="hidden sm:inline">Breakdown</span>
                        </Button>

                        {/* Print Receipt button (if student has paid payments) */}
                        {fee.payments && fee.payments.length === 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReceipt(fee.payments[0].id)}
                            disabled={loadingReceiptId === fee.payments[0].id}
                            className="h-7 px-2 text-xs border-slate-300 text-blue-700 hover:bg-blue-50 font-medium inline-flex items-center gap-1"
                            title={`View & Print Official Receipt (${fee.payments[0].receiptNumber || "SLG-REC"})`}
                          >
                            {loadingReceiptId === fee.payments[0].id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Printer className="h-3 w-3" />
                            )}
                            <span className="hidden sm:inline">Receipt</span>
                          </Button>
                        )}
                        {fee.payments && fee.payments.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setReceiptSelectionStudent({
                                studentName: studentFullName,
                                studentId: fee.student.studentId,
                                courseTitle: fee.course.title,
                                totalFee: baseFee,
                                paidAmount: paid,
                                pendingAmount: pending,
                                payments: fee.payments,
                              })
                            }
                            className="h-7 px-2 text-xs border-blue-400 bg-blue-50/70 text-blue-800 hover:bg-blue-100 font-semibold inline-flex items-center gap-1.5 shadow-2xs"
                            title={`View & print all ${fee.payments.length} transactions (Down Payment & EMI installments)`}
                          >
                            <Printer className="h-3.5 w-3.5 text-blue-700" />
                            <span>Receipts ({fee.payments.length})</span>
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
                              totalCourseFee: baseFee,
                              discountAmount: discount,
                              scholarshipAmount: fee.scholarshipAmount,
                              paidAmount: paid,
                              pendingAmount: pending,
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
                        {pending > 0 && (
                          <Button
                            size="sm"
                            onClick={() =>
                              setSelectedFee({
                                id: fee.id,
                                studentName: studentFullName,
                                pendingAmountPaise: pending,
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

                        {/* Delete Fee Structure button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(`Permanently delete fee structure for ${studentFullName} (${fee.course.title})? All installments and transaction receipts will be removed.`)) {
                              deleteFeeMutation.mutate({ feeStructureId: fee.id });
                            }
                          }}
                          disabled={deleteFeeMutation.isPending}
                          className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50 font-medium inline-flex items-center gap-1"
                          title="Delete Fee Structure"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="hidden sm:inline">Delete</span>
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
            utils.finance.listPayments.invalidate();
            utils.crm.listApplications.invalidate();
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
            utils.finance.listPayments.invalidate();
            utils.crm.listApplications.invalidate();
            setEditingFee(null);
          }}
        />
      )}

      {/* Multi-Receipt Selection Dialog for Every Transaction */}
      {receiptSelectionStudent && (
        <Dialog
          open={!!receiptSelectionStudent}
          onOpenChange={(open) => !open && setReceiptSelectionStudent(null)}
        >
          <div className="space-y-4 max-h-[85vh] overflow-y-auto p-1 text-xs">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Printer className="h-5 w-5 text-blue-600" />
                  <span>All Transaction Receipts ({receiptSelectionStudent.payments.length})</span>
                </DialogTitle>
                <Badge className="bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  Total Paid: {formatPaiseToRupees(receiptSelectionStudent.paidAmount)}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Candidate: <strong className="text-slate-800">{receiptSelectionStudent.studentName}</strong> ({receiptSelectionStudent.studentId}) • {receiptSelectionStudent.courseTitle}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white shadow-xs">
              {receiptSelectionStudent.payments.map((p, idx) => {
                const isDownPayment = idx === receiptSelectionStudent.payments.length - 1;
                return (
                  <div key={p.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {formatPaiseToRupees(p.amount)}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase bg-slate-50">
                          {p.paymentMethod}
                        </Badge>
                        {isDownPayment ? (
                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px] font-semibold">
                            Down Payment
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-semibold">
                            Installment / EMI #{receiptSelectionStudent.payments.length - idx}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                        <span>Receipt: <strong>{p.receiptNumber || p.transactionReference || "SLG-REC"}</strong></span>
                        {p.paymentDate && (
                          <span>• {new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        )}
                      </div>
                      {p.remarks && (
                        <p className="text-[10px] text-slate-400 italic">Notes: {p.remarks}</p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setReceiptSelectionStudent(null);
                        handleOpenReceipt(p.id);
                      }}
                      disabled={loadingReceiptId === p.id}
                      className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-1.5 shadow-xs shrink-0"
                    >
                      {loadingReceiptId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Printer className="h-3.5 w-3.5" />
                      )}
                      <span>Print Receipt</span>
                    </Button>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="pt-2 flex justify-between sm:justify-between items-center border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Official SoftLab Global Dual-Copy Print Format
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReceiptSelectionStudent(null)}
                className="text-xs"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}

      {/* Detailed Itemized Fee Breakdown & Audit Dialog */}
      {breakdownFee && (
        <Dialog
          open={!!breakdownFee}
          onOpenChange={(open) => !open && setBreakdownFee(null)}
        >
          <div className="space-y-4 max-h-[85vh] overflow-y-auto p-1 text-xs">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <span>Itemized Fee Calculation & Audit Breakdown</span>
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={
                    breakdownFee.isHistoricalAdjusted
                      ? "bg-sky-50 text-sky-800 border-sky-300 font-mono text-[10px]"
                      : "bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-[10px]"
                  }
                >
                  {breakdownFee.policyVersion || (breakdownFee.isHistoricalAdjusted ? "V2_HISTORICAL_ADJUSTED" : "V2_STANDARD_APPROVED")}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Candidate: <strong className="text-slate-800">{breakdownFee.student?.user?.firstName} {breakdownFee.student?.user?.lastName}</strong> ({breakdownFee.student?.studentId}) • {breakdownFee.course?.title}
              </DialogDescription>
            </DialogHeader>

            {/* Canonical Calculation Flow Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Canonical Commercial Formula</span>
              </h4>

              <div className="space-y-2 text-xs">
                {/* Step 1: Base Fee */}
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">1. Base Course Fee (Sales Entered)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatPaiseToRupees(breakdownFee.baseCourseFee ?? breakdownFee.totalCourseFee)}
                  </span>
                </div>

                {/* Step 2: Approved Discount */}
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">2. Approved Sales Discount</span>
                  <span className="font-mono font-bold text-amber-600">
                    -{(breakdownFee.discountAmount || 0) > 0 ? formatPaiseToRupees(breakdownFee.discountAmount) : "₹0"}
                  </span>
                </div>

                {/* Step 3: Net Course Fee */}
                <div className="flex justify-between items-center py-1.5 bg-emerald-50/70 px-2 rounded font-semibold border border-emerald-200">
                  <span className="text-emerald-900">3. Net Course Fee (Discounted Course Revenue)</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">
                    {formatPaiseToRupees(breakdownFee.discountedCourseFee ?? Math.max(0, (breakdownFee.totalCourseFee || 0) - (breakdownFee.discountAmount || 0)))}
                  </span>
                </div>

                {/* Step 4: Additional Pass-Through Charges */}
                <div className="py-2 space-y-1">
                  <div className="text-slate-700 font-semibold text-[11px] uppercase tracking-wide">
                    4. Additional Charges (Separately Identified)
                  </div>
                  <div className="pl-3 space-y-1 border-l-2 border-indigo-200 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>• SoftLab Kit Charges:</span>
                      <span className="font-mono font-medium">
                        {(breakdownFee.kitFee || 0) > 0 ? formatPaiseToRupees(breakdownFee.kitFee) : "₹0 (Waived/Adjusted)"}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>• Global Certification Charges:</span>
                      <span className="font-mono font-medium">
                        {(breakdownFee.globalCertificationFee || 0) > 0 ? formatPaiseToRupees(breakdownFee.globalCertificationFee) : "₹0 (Waived/Adjusted)"}
                      </span>
                    </div>
                    {(breakdownFee.otherCharges || 0) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>• Other Approved Charges:</span>
                        <span className="font-mono font-medium">{formatPaiseToRupees(breakdownFee.otherCharges)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-indigo-800 font-bold pt-1">
                      <span>Total Additional Charges:</span>
                      <span className="font-mono">
                        +{(breakdownFee.totalAdditionalCharges || 0) > 0 ? formatPaiseToRupees(breakdownFee.totalAdditionalCharges) : "₹0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 5: GST / Tax Liability */}
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <div>
                    <span className="text-slate-600 font-medium">5. Applicable Tax (GST)</span>
                    <span className="text-[10px] text-slate-400 block">Separately accounted tax component</span>
                  </div>
                  <span className="font-mono font-bold text-slate-700">
                    +{(breakdownFee.gstAmount || 0) > 0 ? formatPaiseToRupees(breakdownFee.gstAmount) : "₹0 (Unbilled/Exempt)"}
                  </span>
                </div>

                {/* Step 6: Final Student Payable */}
                <div className="flex justify-between items-center py-2 bg-slate-900 text-white px-3 rounded-lg font-bold">
                  <span>6. Final Student Payable Amount</span>
                  <span className="font-mono text-base text-emerald-400">
                    {formatPaiseToRupees(breakdownFee.finalPayable ?? breakdownFee.netPayableAmount)}
                  </span>
                </div>

                {/* Step 7 & 8: Paid & Pending */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-center">
                    <span className="text-[10px] text-emerald-700 uppercase font-semibold block">7. Verified Payments (Paid)</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">
                      {formatPaiseToRupees(breakdownFee.paidAmount || 0)}
                    </span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg text-center">
                    <span className="text-[10px] text-rose-700 uppercase font-semibold block">8. Outstanding Balance (Pending)</span>
                    <span className="font-mono font-bold text-rose-700 text-sm">
                      {formatPaiseToRupees(breakdownFee.pendingAmount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Installments Breakdown */}
            {breakdownFee.installments && breakdownFee.installments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs">Payment & Installment Schedule</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                  {breakdownFee.installments.map((inst: any) => (
                    <div key={inst.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-800">
                          {inst.installmentNumber === 1 && breakdownFee.installments.length === 1
                            ? "Full Lumpsum Payment"
                            : `Installment #${inst.installmentNumber}`}
                        </span>
                        {inst.dueDate && (
                          <span className="text-[11px] text-slate-500 font-mono ml-2">
                            Due: {formatDate(inst.dueDate)}
                          </span>
                        )}
                        {inst.notes && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">{inst.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {formatPaiseToRupees(inst.amount)}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            inst.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]"
                              : inst.status === "OVERDUE"
                              ? "bg-rose-50 text-rose-700 border-rose-300 text-[10px]"
                              : "bg-slate-50 text-slate-700 border-slate-200 text-[10px]"
                          }
                        >
                          {inst.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="pt-2 flex justify-between items-center border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">
                ID: {breakdownFee.id}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBreakdownFee(null)}
                className="text-xs"
              >
                Close Breakdown
              </Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}

      {/* Printable Dual Fee Receipt Viewer Modal */}
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
