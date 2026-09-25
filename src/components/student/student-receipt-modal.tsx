"use client";

import { DualFeeReceipt, DualReceiptData } from "@/components/common/dual-fee-receipt";
import { api } from "@/lib/trpc/react";
import { Loader2 } from "lucide-react";

interface StudentReceiptModalProps {
  receiptIdentifier: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentReceiptModal({
  receiptIdentifier,
  isOpen,
  onClose,
}: StudentReceiptModalProps) {
  const { data: receipt, isLoading } = api.payment.getReceipt.useQuery(
    { identifier: receiptIdentifier || "" },
    { enabled: Boolean(isOpen && receiptIdentifier) }
  );

  if (!isOpen) return null;

  const dualData: DualReceiptData | null = receipt
    ? {
        receiptNumber: receipt.receiptNumber,
        receiptDate: receipt.receiptDate,
        studentName: receipt.student.name,
        studentId: receipt.student.studentId || "SG-2026",
        admissionNumber: receipt.admission?.applicationNumber || "N/A",
        courseTitle: receipt.course.title,
        totalFee: receipt.financials.totalCourseFeePaise,
        discountAmount: receipt.financials.discountPaise,
        netPayable: receipt.financials.netPayablePaise,
        amountPaid: receipt.financials.amountPaidPaise,
        pendingAmount: Math.max(0, receipt.financials.netPayablePaise - receipt.financials.amountPaidPaise),
        amountInWords: receipt.financials.amountInWords,
        paymentMode: receipt.payment.gateway || "Online",
        transactionReference: receipt.payment.transactionReference,
        status: "Completed",
        centerName: receipt.company?.name || "SOFTLAB GLOBAL PRAYAGRAJ CENTRE",
        centerAddress:
          receipt.company?.address ||
          "Address: Patrika Chauraha, 13/11/8G, Tashkent Marg, Opposite Rai and Company, Civil Lines, Prayagraj, Uttar Pradesh 211001",
        gstNo: receipt.company?.gstin || "09AFYFS5388G1ZX",
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center overflow-y-auto print:bg-white print:p-0 print:m-0 print:overflow-visible">
      {isLoading || !dualData ? (
        <div className="flex items-center justify-center min-h-[60vh] text-sm text-slate-600 gap-2 font-semibold">
          <Loader2 className="w-5 h-5 animate-spin text-[#0088cc]" />
          <span>Loading official A4 receipt...</span>
        </div>
      ) : (
        <DualFeeReceipt
          data={dualData}
          onClose={onClose}
        />
      )}
    </div>
  );
}
