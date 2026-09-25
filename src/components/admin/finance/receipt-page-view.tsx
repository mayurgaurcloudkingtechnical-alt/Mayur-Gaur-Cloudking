"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc/react";
import { DualFeeReceipt, DualReceiptData } from "@/components/common/dual-fee-receipt";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Printer, Plus } from "lucide-react";
import Link from "next/link";
import { rupeesToWords } from "@/lib/utils";

export function ReceiptPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const studentId = searchParams.get("studentId");
  const receiptNo = searchParams.get("receiptNo");

  const [receiptData, setReceiptData] = useState<DualReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const utils = api.useUtils();

  useEffect(() => {
    async function loadReceipt() {
      if (paymentId || receiptNo) {
        setLoading(true);
        setError(null);
        try {
          const res = await utils.finance.getPaymentReceipt.fetch({
            identifier: paymentId || receiptNo || "",
          });
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
              paymentId: paymentId || undefined,
            });
          }
        } catch (err: any) {
          setError(err.message || "Failed to load receipt details.");
        } finally {
          setLoading(false);
        }
      } else if (studentId) {
        setLoading(true);
        setError(null);
        try {
          const feeRes = await utils.finance.listFeeStructures.fetch({
            studentId,
            limit: 1,
          });
          if (feeRes && feeRes.items.length > 0) {
            const fee = feeRes.items[0];
            const studentFullName = `${fee.student.user.firstName} ${fee.student.user.lastName}`;
            const latestPayment = fee.payments && fee.payments.length > 0 ? fee.payments[0] : null;
            const paid = latestPayment ? latestPayment.amount : fee.paidAmount;

            setReceiptData({
              receiptNumber: latestPayment?.receiptNumber || `SLG-2026-${Math.floor(100000 + Math.random() * 900000)}`,
              receiptDate: latestPayment?.paymentDate || new Date(),
              studentName: studentFullName,
              studentId: fee.student.studentId || "SG-2026-00001",
              admissionNumber: fee.enrollmentId || "N/A",
              courseTitle: fee.course.title,
              totalFee: fee.totalCourseFee,
              discountAmount: fee.discountAmount,
              netPayable: fee.netPayableAmount,
              amountPaid: paid,
              pendingAmount: Math.max(0, fee.netPayableAmount - paid),
              amountInWords: rupeesToWords(Math.floor(paid / 100)),
              paymentMode: latestPayment ? latestPayment.paymentMethod : "Cash",
              transactionReference: latestPayment?.transactionReference || "",
              feeStructureId: fee.id,
              paymentId: latestPayment?.id,
            });
          } else {
            setError(`No active fee structure found for student ID: ${studentId}`);
          }
        } catch (err: any) {
          setError(err.message || "Failed to load student fee record.");
        } finally {
          setLoading(false);
        }
      } else {
        // Default editable demo template matching SoftLab Global format
        setReceiptData({
          receiptNumber: "SLG-2026-306281",
          receiptDate: "15-06-2026",
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
      }
    }

    loadReceipt();
  }, [paymentId, studentId, receiptNo, utils]);

  return (
    <div className="min-h-screen bg-white py-4 px-2 flex flex-col items-center print:bg-white print:p-0 print:m-0">
      {/* Top back navigation */}
      <div className="w-full max-w-[210mm] flex items-center justify-between print:hidden mb-3">
        <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 font-semibold">
          <Link href="/admin/finance">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Finance Dashboard</span>
          </Link>
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm max-w-[210mm] w-full">
          <Loader2 className="w-6 h-6 animate-spin text-[#0088cc] mr-2" />
          <span className="text-xs font-semibold text-slate-700">Loading official receipt...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs max-w-[210mm] w-full">
          <strong>Error: </strong> {error}
        </div>
      )}

      {!loading && receiptData && (
        <DualFeeReceipt
          data={receiptData}
          onSaved={() => {
            utils.finance.listFeeStructures.invalidate();
            utils.finance.listPayments.invalidate();
          }}
        />
      )}
    </div>
  );
}
