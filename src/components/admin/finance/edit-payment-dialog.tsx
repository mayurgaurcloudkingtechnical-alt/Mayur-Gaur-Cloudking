"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { api } from "@/lib/trpc/react";
import { PaymentMethod } from "@prisma/client";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaiseToRupees } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface EditPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    studentName: string;
    amount: number; // in paise
    paymentMethod: PaymentMethod;
    providerReference?: string | null;
    receiptNumber?: string | null;
    paymentDate?: Date | string | null;
    remarks?: string | null;
  } | null;
  onSuccess: () => void;
}

export function EditPaymentDialog({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: EditPaymentDialogProps) {
  const [rupees, setRupees] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [providerRef, setProviderRef] = useState<string>("");
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (payment) {
      setRupees(String(Math.floor(payment.amount / 100)));
      setMethod(payment.paymentMethod || PaymentMethod.UPI);
      setProviderRef(payment.providerReference || "");
      setReceiptNumber(payment.receiptNumber || "");
      setPaymentDate(
        payment.paymentDate
          ? new Date(payment.paymentDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setRemarks(payment.remarks || "");
      setErrorMessage(null);
    }
  }, [payment]);

  const mutation = api.finance.updatePayment.useMutation({
    onSuccess: () => {
      setErrorMessage(null);
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    setErrorMessage(null);

    const enteredRupees = parseFloat(rupees);
    if (isNaN(enteredRupees) || enteredRupees <= 0) {
      setErrorMessage("Please enter a valid payment amount greater than zero.");
      return;
    }

    mutation.mutate({
      paymentId: payment.id,
      amount: Math.round(enteredRupees * 100),
      paymentMethod: method,
      providerReference: providerRef.trim() || undefined,
      receiptNumber: receiptNumber.trim() || undefined,
      paymentDate: paymentDate ? new Date(paymentDate) : undefined,
      remarks: remarks.trim() || undefined,
    });
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Edit Payment Transaction
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Modify payment collection record for <strong>{payment.studentName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block">Payment Amount (in ₹ INR) *</label>
          <Input
            type="number"
            step="1"
            min="1"
            placeholder="e.g. 10000"
            value={rupees}
            onChange={(e) => setRupees(e.target.value)}
            required
            className="h-9 text-xs font-bold"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">Payment Mode *</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs text-slate-900"
            >
              <option value={PaymentMethod.UPI}>UPI (Google Pay / PhonePe / Paytm)</option>
              <option value={PaymentMethod.CASH}>Cash (Campus Receipt)</option>
              <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer (NEFT / RTGS)</option>
              <option value={PaymentMethod.CARD}>Card (POS Swipe)</option>
              <option value={PaymentMethod.CHEQUE}>Cheque / Demand Draft</option>
              <option value={PaymentMethod.OTHER}>Other Institutional Mode</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">Payment Date *</label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">Receipt Number</label>
            <Input
              type="text"
              placeholder="e.g. SLG-2026-306281"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">Provider Ref / UTR / Txn ID</label>
            <Input
              type="text"
              placeholder="e.g. UPI-1234567890"
              value={providerRef}
              onChange={(e) => setProviderRef(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block">Remarks</label>
          <Input
            type="text"
            placeholder="e.g. Down payment / Registration fee"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-8 text-xs bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold"
          >
            {mutation.isPending ? "Updating Payment..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
