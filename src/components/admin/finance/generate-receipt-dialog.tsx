"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/trpc/react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DualFeeReceipt, DualReceiptData } from "@/components/common/dual-fee-receipt";
import { formatPaiseToRupees, rupeesToWords } from "@/lib/utils";
import { Printer, Search, UserCheck, Plus } from "lucide-react";

interface GenerateReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStudentId?: string;
  initialPaymentId?: string;
}

export function GenerateReceiptDialog({
  open,
  onOpenChange,
  initialStudentId,
  initialPaymentId,
}: GenerateReceiptDialogProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(initialStudentId);
  const [receiptData, setReceiptData] = useState<DualReceiptData | null>(null);
  const [manualMode, setManualMode] = useState(false);

  const utils = api.useUtils();
  const { data: feeData, isLoading } = api.finance.listFeeStructures.useQuery({
    limit: 50,
  });

  // When initialPaymentId is provided, fetch via TRPC
  useEffect(() => {
    if (initialPaymentId) {
      utils.finance.getPaymentReceipt
        .fetch({ identifier: initialPaymentId })
        .then((res) => {
          if (res) {
            setReceiptData({
              receiptNumber: res.receiptNumber,
              receiptDate: res.receiptDate,
              studentName: res.student.name,
              studentId: res.student.studentId || "SG-2026-00001",
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
              paymentId: initialPaymentId,
            });
          }
        })
        .catch(console.error);
    }
  }, [initialPaymentId, utils]);

  // When a student is selected from list
  const handleSelectFeeStructure = (fee: any) => {
    const studentName = `${fee.student.user.firstName} ${fee.student.user.lastName}`;
    const latestPayment = fee.payments && fee.payments.length > 0 ? fee.payments[0] : null;

    const totalFee = fee.totalCourseFee;
    const discount = fee.discountAmount;
    const netPayable = fee.netPayableAmount;
    const paid = latestPayment ? latestPayment.amount : fee.paidAmount;
    const pending = Math.max(0, netPayable - paid);

    setReceiptData({
      receiptNumber: latestPayment?.receiptNumber || `SLG-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      receiptDate: latestPayment?.paymentDate || new Date(),
      studentName,
      studentId: fee.student.studentId || "SG-2026-00001",
      admissionNumber: fee.enrollmentId || "N/A",
      courseTitle: fee.course.title,
      totalFee,
      discountAmount: discount,
      netPayable,
      amountPaid: paid,
      pendingAmount: pending,
      amountInWords: rupeesToWords(Math.floor(paid / 100)),
      paymentMode: latestPayment ? latestPayment.paymentMethod : "Cash",
      transactionReference: latestPayment?.transactionReference || "",
      feeStructureId: fee.id,
      paymentId: latestPayment?.id,
    });
  };

  // Start with a blank custom receipt
  const handleCreateBlankReceipt = () => {
    setReceiptData({
      receiptNumber: `SLG-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      receiptDate: new Date(),
      studentName: "Admitted Learner",
      studentId: "SG-2026-00001",
      courseTitle: "Technical Support Engineer",
      totalFee: 45000,
      discountAmount: 0,
      netPayable: 45000,
      amountPaid: 10000,
      pendingAmount: 35000,
      amountInWords: "Ten Thousand Rupees Only",
      paymentMode: "Cash",
      status: "Completed",
    });
    setManualMode(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="max-h-[90vh] overflow-y-auto">
        {!receiptData ? (
          <div className="space-y-4 p-2 text-xs">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#0088cc]" />
                Generate Official Fee Receipt
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Select an enrolled student to generate and edit their official Dual Copy A4 receipt, or create a blank one.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between gap-2 border-b pb-3">
              <span className="font-semibold text-slate-700">Enrolled Students Ledger:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateBlankReceipt}
                className="h-8 text-xs border-slate-300 text-slate-800 font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Custom Blank Receipt</span>
              </Button>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-slate-400">Loading student fee records...</div>
            ) : !feeData?.items || feeData.items.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                No fee records found. Click &quot;Create Custom Blank Receipt&quot; to generate.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto border rounded-lg bg-slate-50">
                {feeData.items.map((fee: any) => {
                  const sName = `${fee.student.user.firstName} ${fee.student.user.lastName}`;
                  return (
                    <div
                      key={fee.id}
                      className="p-3 hover:bg-white flex items-center justify-between cursor-pointer transition-colors"
                      onClick={() => handleSelectFeeStructure(fee)}
                    >
                      <div>
                        <p className="font-bold text-slate-900">{sName}</p>
                        <p className="text-[11px] text-slate-500">
                          {fee.course.title} • <span className="font-mono">{fee.student.studentId}</span>
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="text-[11px] font-bold text-emerald-700 block">
                            Paid: {formatPaiseToRupees(fee.paidAmount)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Pending: {formatPaiseToRupees(fee.pendingAmount)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold"
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="fixed inset-0 z-50 bg-white flex flex-col items-center overflow-y-auto print:bg-white print:p-0 print:m-0 print:overflow-visible">
            <div className="w-full max-w-[210mm] py-2 px-2 flex justify-start print:hidden">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReceiptData(null)}
                className="text-xs h-7 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 font-semibold"
              >
                ← Back to Student List
              </Button>
            </div>
            <DualFeeReceipt
              data={receiptData}
              onClose={() => onOpenChange(false)}
              onSaved={() => {
                utils.finance.listFeeStructures.invalidate();
                utils.finance.listPayments.invalidate();
                utils.finance.getOverviewMetrics.invalidate();
              }}
            />
          </div>
        )}
      </div>
    </Dialog>
  );
}
