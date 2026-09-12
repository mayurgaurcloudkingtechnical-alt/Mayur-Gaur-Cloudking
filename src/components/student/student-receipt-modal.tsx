"use client";

import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/trpc/react";

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

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const formatPaise = (paise?: number) => {
    if (paise === undefined || paise === null) return "₹0";
    return (paise / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <div className="max-h-[85vh] overflow-y-auto print:p-0">
        <DialogHeader className="print:hidden flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <span>Payment Receipt</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-normal px-2 py-0.5 rounded-full">
              Verified
            </span>
          </DialogTitle>
          <div className="flex items-center gap-2 pr-6">
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1 text-xs">
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </Button>
          </div>
        </DialogHeader>

        {isLoading || !receipt ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading receipt details...
          </div>
        ) : (
          <div className="space-y-6 pt-2 text-foreground print:pt-0">
            {/* Institution Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    SG
                  </div>
                  <div>
                    <h2 className="font-bold text-base leading-tight tracking-tight">
                      {receipt.company.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">{receipt.company.tagline}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 max-w-sm">
                  {receipt.company.address}
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  GSTIN: {receipt.company.gstin}
                </p>
              </div>
              <div className="text-right">
                <div className="bg-muted/50 p-2 rounded border inline-block text-right">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                    Receipt Number
                  </p>
                  <p className="text-sm font-mono font-bold text-foreground">
                    {receipt.receiptNumber}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(receipt.receiptDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Student & Course Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 bg-muted/20 p-3 rounded border">
                <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                  Billed To
                </p>
                <p className="font-medium text-foreground text-sm">{receipt.student.name}</p>
                {receipt.student.studentId && (
                  <p className="text-muted-foreground">Student ID: {receipt.student.studentId}</p>
                )}
                <p className="text-muted-foreground">{receipt.student.email}</p>
                {receipt.student.phone && (
                  <p className="text-muted-foreground">{receipt.student.phone}</p>
                )}
                {receipt.admission && (
                  <p className="text-muted-foreground font-mono text-[11px]">
                    App #: {receipt.admission.applicationNumber}
                  </p>
                )}
              </div>

              <div className="space-y-1 bg-muted/20 p-3 rounded border">
                <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                  Course Enrolled
                </p>
                <p className="font-medium text-foreground text-sm">{receipt.course.title}</p>
                {receipt.course.durationWeeks && (
                  <p className="text-muted-foreground">
                    Duration: {receipt.course.durationWeeks} Weeks
                  </p>
                )}
                <p className="text-muted-foreground">Mode: Hybrid / Classroom</p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Active Enrollment</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Ledger */}
            <div className="border rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b font-medium text-muted-foreground">
                  <tr>
                    <th className="py-2 px-3 text-left">Fee Component</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2 px-3">Tuition & Admission Fee</td>
                    <td className="py-2 px-3 text-right font-mono">
                      {formatPaise(receipt.financials.totalCourseFeePaise)}
                    </td>
                  </tr>
                  {receipt.financials.discountPaise > 0 && (
                    <tr className="text-emerald-700">
                      <td className="py-2 px-3">Scholarship / Approved Discount</td>
                      <td className="py-2 px-3 text-right font-mono">
                        - {formatPaise(receipt.financials.discountPaise)}
                      </td>
                    </tr>
                  )}
                  <tr className="font-bold bg-muted/20 text-foreground">
                    <td className="py-2 px-3">Amount Paid</td>
                    <td className="py-2 px-3 text-right font-mono text-sm text-primary">
                      {formatPaise(receipt.financials.amountPaidPaise)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* In Words & Payment Meta */}
            <div className="text-xs space-y-2 border-t pt-3">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">In Words: </span>
                <span className="italic">{receipt.financials.amountInWords}</span>
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground font-mono bg-muted/10 p-2 rounded border">
                <div>
                  <span className="text-foreground font-medium">Gateway: </span>
                  {receipt.payment.gateway}
                </div>
                <div>
                  <span className="text-foreground font-medium">Tx Ref: </span>
                  {receipt.payment.transactionReference}
                </div>
                {receipt.payment.gatewayPaymentId && (
                  <div className="col-span-2">
                    <span className="text-foreground font-medium">Payment ID: </span>
                    {receipt.payment.gatewayPaymentId}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="text-[10px] text-muted-foreground text-center border-t pt-3">
              <p>This is a computer-generated tax invoice & receipt. No physical signature is required.</p>
              <p>SOFTLAB GLOBAL • Support: {receipt.company.phone} • {receipt.company.email}</p>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
