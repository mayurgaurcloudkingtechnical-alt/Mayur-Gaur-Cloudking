"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { api } from "@/lib/trpc/react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaiseToRupees } from "@/lib/utils";
import { AlertCircle, CheckCircle2, IndianRupee, Plus, Trash2 } from "lucide-react";

interface EditFeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeStructure: {
    id: string;
    studentName: string;
    studentId?: string;
    courseTitle: string;
    totalCourseFee: number; // in paise
    discountAmount: number; // in paise
    scholarshipAmount?: number; // in paise
    paidAmount: number; // in paise
    pendingAmount: number; // in paise
    remarks?: string | null;
    installments?: Array<{
      id: string;
      installmentNumber: number;
      amount: number;
      dueDate: Date | string;
      notes?: string | null;
    }>;
  } | null;
  onSuccess: () => void;
}

export function EditFeeStructureDialog({
  open,
  onOpenChange,
  feeStructure,
  onSuccess,
}: EditFeeStructureDialogProps) {
  const [totalFeeRupees, setTotalFeeRupees] = useState<string>("");
  const [discountRupees, setDiscountRupees] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [adjustInstallments, setAdjustInstallments] = useState(false);
  const [installmentList, setInstallmentList] = useState<
    Array<{ amountRupees: string; dueDate: string; notes: string }>
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (feeStructure) {
      setTotalFeeRupees(String(Math.floor(feeStructure.totalCourseFee / 100)));
      setDiscountRupees(String(Math.floor(feeStructure.discountAmount / 100)));
      setRemarks(feeStructure.remarks || "");
      setErrorMessage(null);

      if (feeStructure.installments && feeStructure.installments.length > 0) {
        setInstallmentList(
          feeStructure.installments.map((i) => ({
            amountRupees: String(Math.floor(i.amount / 100)),
            dueDate: new Date(i.dueDate).toISOString().slice(0, 10),
            notes: i.notes || "",
          }))
        );
      } else {
        setInstallmentList([]);
      }
    }
  }, [feeStructure]);

  const numTotal = parseFloat(totalFeeRupees) || 0;
  const numDiscount = parseFloat(discountRupees) || 0;
  const numNetPayable = Math.max(0, numTotal - numDiscount);
  const paidRupees = feeStructure ? Math.floor(feeStructure.paidAmount / 100) : 0;
  const newPendingRupees = Math.max(0, numNetPayable - paidRupees);

  const mutation = api.finance.updateFeeStructure.useMutation({
    onSuccess: () => {
      setErrorMessage(null);
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });

  const handleAddInstallment = () => {
    const today = new Date();
    today.setMonth(today.getMonth() + (installmentList.length + 1));
    setInstallmentList([
      ...installmentList,
      {
        amountRupees: "0",
        dueDate: today.toISOString().slice(0, 10),
        notes: `Installment ${installmentList.length + 1}`,
      },
    ]);
  };

  const handleRemoveInstallment = (idx: number) => {
    setInstallmentList(installmentList.filter((_, i) => i !== idx));
  };

  const handleInstallmentChange = (
    idx: number,
    field: "amountRupees" | "dueDate" | "notes",
    val: string
  ) => {
    const updated = [...installmentList];
    updated[idx] = { ...updated[idx], [field]: val };
    setInstallmentList(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeStructure) return;
    setErrorMessage(null);

    if (numTotal <= 0) {
      setErrorMessage("Total course fee must be greater than zero.");
      return;
    }

    if (numDiscount < 0) {
      setErrorMessage("Discount cannot be negative.");
      return;
    }

    if (numNetPayable < paidRupees) {
      setErrorMessage(
        `Net payable (₹${numNetPayable.toLocaleString()}) cannot be less than already collected payments (₹${paidRupees.toLocaleString()}).`
      );
      return;
    }

    let payloadInstallments:
      | Array<{ amount: number; dueDate: Date; notes?: string }>
      | undefined = undefined;

    if (adjustInstallments && installmentList.length > 0) {
      let instSum = 0;
      payloadInstallments = [];
      for (let i = 0; i < installmentList.length; i++) {
        const item = installmentList[i];
        const amt = parseFloat(item.amountRupees) || 0;
        if (amt <= 0) {
          setErrorMessage(`Installment #${i + 1} must have an amount greater than zero.`);
          return;
        }
        if (!item.dueDate) {
          setErrorMessage(`Installment #${i + 1} must have a valid due date.`);
          return;
        }
        instSum += amt;
        payloadInstallments.push({
          amount: Math.round(amt * 100),
          dueDate: new Date(item.dueDate),
          notes: item.notes.trim() || undefined,
        });
      }

      if (Math.abs(instSum - numNetPayable) > 1) {
        setErrorMessage(
          `Sum of installments (₹${instSum.toLocaleString()}) must match net payable fee (₹${numNetPayable.toLocaleString()}). Difference: ₹${Math.abs(
            instSum - numNetPayable
          ).toLocaleString()}.`
        );
        return;
      }
    }

    mutation.mutate({
      feeStructureId: feeStructure.id,
      totalCourseFee: Math.round(numTotal * 100),
      discountAmount: Math.round(numDiscount * 100),
      remarks: remarks.trim() || undefined,
      installments: payloadInstallments,
    });
  };

  if (!feeStructure) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs max-h-[85vh] overflow-y-auto pr-1">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Edit Fee Structure
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Modify course fees, discount allowances, and EMI schedules for{" "}
            <strong>{feeStructure.studentName}</strong> ({feeStructure.courseTitle}).
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Calculation Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div>
            <span className="text-[10px] uppercase text-slate-500 font-semibold block">Total Fee</span>
            <span className="font-bold text-slate-900 text-sm">₹{numTotal.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 font-semibold block">Discount</span>
            <span className="font-bold text-amber-600 text-sm">-₹{numDiscount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 font-semibold block">Net Payable</span>
            <span className="font-bold text-blue-700 text-sm">₹{numNetPayable.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 font-semibold block">New Pending</span>
            <span className="font-bold text-rose-600 text-sm">₹{newPendingRupees.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">Total Course Fee (in ₹ INR) *</label>
            <Input
              type="number"
              step="1"
              min="1"
              placeholder="e.g. 45000"
              value={totalFeeRupees}
              onChange={(e) => setTotalFeeRupees(e.target.value)}
              required
              className="h-9 text-xs font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">Discount Allowance (in ₹ INR)</label>
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="e.g. 5000"
              value={discountRupees}
              onChange={(e) => setDiscountRupees(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block">Remarks / Counselor Notes</label>
          <Input
            type="text"
            placeholder="e.g. Down payment 10,000 paid; rest 35,000 in monthly EMI"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        {/* Adjust Installments Accordion */}
        <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={adjustInstallments}
                onChange={(e) => setAdjustInstallments(e.target.checked)}
                className="rounded border-slate-300 text-[#0088cc] focus:ring-[#0088cc]"
              />
              <span className="font-bold text-slate-800 text-xs">
                Custom Installments & EMI Schedule ({installmentList.length} slots)
              </span>
            </label>
            {adjustInstallments && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddInstallment}
                className="h-7 text-xs border-slate-300 text-slate-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Slot
              </Button>
            )}
          </div>

          {adjustInstallments && (
            <div className="space-y-2 pt-1">
              {installmentList.length === 0 ? (
                <p className="text-slate-400 italic text-[11px] py-1">
                  No installment slots. Click &quot;Add Slot&quot; to configure EMI due dates and amounts.
                </p>
              ) : (
                installmentList.map((inst, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200"
                  >
                    <span className="text-[11px] font-bold text-slate-500 w-16">
                      Slot #{idx + 1}
                    </span>
                    <div className="flex-1 min-w-[100px]">
                      <Input
                        type="number"
                        placeholder="Amount (₹)"
                        value={inst.amountRupees}
                        onChange={(e) =>
                          handleInstallmentChange(idx, "amountRupees", e.target.value)
                        }
                        className="h-8 text-xs font-medium"
                      />
                    </div>
                    <div className="w-36">
                      <Input
                        type="date"
                        value={inst.dueDate}
                        onChange={(e) =>
                          handleInstallmentChange(idx, "dueDate", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="Note / Milestone"
                        value={inst.notes}
                        onChange={(e) =>
                          handleInstallmentChange(idx, "notes", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveInstallment(idx)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 shrink-0"
                      title="Remove Slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
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
            {mutation.isPending ? "Updating Fee..." : "Save Fee Structure"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
