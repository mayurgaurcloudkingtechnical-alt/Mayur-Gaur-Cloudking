"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { PaymentMethod } from "@prisma/client";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaiseToRupees } from "@/lib/utils";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeStructureId: string;
  studentName: string;
  pendingAmountPaise: number;
  installments?: Array<{ id: string; installmentNumber: number; amount: number; paidAmount: number }>;
  onSuccess: () => void;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  feeStructureId,
  studentName,
  pendingAmountPaise,
  installments = [],
  onSuccess,
}: RecordPaymentDialogProps) {
  const [rupees, setRupees] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [installmentId, setInstallmentId] = useState<string>("");
  const [providerRef, setProviderRef] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unpaidInstallments = installments.filter((i) => i.paidAmount < i.amount);

  const mutation = api.finance.recordOfflinePayment.useMutation({
    onSuccess: () => {
      setRupees("");
      setProviderRef("");
      setRemarks("");
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
    setErrorMessage(null);

    const enteredRupees = parseFloat(rupees);
    if (isNaN(enteredRupees) || enteredRupees <= 0) {
      setErrorMessage("Please enter a valid payment amount greater than zero.");
      return;
    }

    const amountPaise = Math.round(enteredRupees * 100);
    if (amountPaise > pendingAmountPaise) {
      setErrorMessage(`Amount exceeds outstanding balance of ${formatPaiseToRupees(pendingAmountPaise)}.`);
      return;
    }

    mutation.mutate({
      feeStructureId,
      installmentId: installmentId ? installmentId : undefined,
      amount: amountPaise,
      paymentMethod: method,
      providerReference: providerRef.trim() || undefined,
      remarks: remarks.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">Record Fee Payment</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Enter payment transaction details for <strong>{studentName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
            {errorMessage}
          </div>
        )}

        <div className="rounded-md bg-emerald-50/70 p-3 border border-emerald-100 flex justify-between items-center">
          <span className="text-slate-600 font-medium">Outstanding Balance:</span>
          <span className="font-bold text-emerald-800 text-sm">{formatPaiseToRupees(pendingAmountPaise)}</span>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block">Payment Amount (in ₹ INR) *</label>
          <Input
            type="number"
            step="1"
            min="1"
            max={Math.floor(pendingAmountPaise / 100)}
            placeholder="e.g. 15000"
            value={rupees}
            onChange={(e) => setRupees(e.target.value)}
            required
            className="h-9 text-xs"
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
              <option value={PaymentMethod.CASH}>Cash (In-person Campus Receipt)</option>
              <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value={PaymentMethod.CARD}>Debit / Credit Card (POS swipe)</option>
              <option value={PaymentMethod.CHEQUE}>Cheque / Demand Draft</option>
              <option value={PaymentMethod.OTHER}>Other Institutional Mode</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">Link to Installment</label>
            <select
              value={installmentId}
              onChange={(e) => setInstallmentId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs text-slate-900"
            >
              <option value="">Auto-allocate (Chronological)</option>
              {unpaidInstallments.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  Installment #{inst.installmentNumber} (Due: {formatPaiseToRupees(inst.amount - inst.paidAmount)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block">
            Transaction / UTR / Cheque Reference (Optional)
          </label>
          <Input
            placeholder="e.g. UPI Ref 429384729182 or Cheque #004128"
            value={providerRef}
            onChange={(e) => setProviderRef(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block">Notes / Remarks</label>
          <Input
            placeholder="e.g. Received at Accounts Desk Prayagraj"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={mutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
          >
            {mutation.isPending ? "Recording Payment..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
