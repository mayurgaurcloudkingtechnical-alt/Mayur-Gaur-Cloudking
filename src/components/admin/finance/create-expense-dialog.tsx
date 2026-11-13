"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExpenseCategory, PaymentMethod } from "@prisma/client";
import { IndianRupee, CheckCircle2 } from "lucide-react";

interface CreateExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EXPENSE_CATEGORIES: Array<{ code: ExpenseCategory; label: string }> = [
  { code: ExpenseCategory.RENT_OFFICE, label: "Office Premises Rent" },
  { code: ExpenseCategory.SALARIES_PAYROLL, label: "Staff Salaries & Payroll" },
  { code: ExpenseCategory.MARKETING_ADVERTISING, label: "Marketing, Meta & Google Ads" },
  { code: ExpenseCategory.SOFTWARE_CLOUD_SAAS, label: "Software, Cloud & SaaS Subscriptions" },
  { code: ExpenseCategory.INTERNET_TELEPHONE, label: "Internet & Telephony Services" },
  { code: ExpenseCategory.TRAVEL_CONVEYANCE, label: "Travel & Business Conveyance" },
  { code: ExpenseCategory.OFFICE_SUPPLIES_PRINTING, label: "Office Stationery & Printing" },
  { code: ExpenseCategory.EQUIPMENT_IT_HARDWARE, label: "IT Hardware & Equipment" },
  { code: ExpenseCategory.VENDOR_SERVICES_AMC, label: "Vendor Services & Maintenance AMC" },
  { code: ExpenseCategory.EVENT_WORKSHOP_SEMINAR, label: "Events, Workshops & Campus Seminars" },
  { code: ExpenseCategory.FRANCHISE_BRANCH_EXPENSE, label: "Franchise & Branch Operations" },
  { code: ExpenseCategory.ELECTRICITY_UTILITIES, label: "Electricity & Utility Bills" },
  { code: ExpenseCategory.LEGAL_PROFESSIONAL_FEES, label: "Legal, Tax & Professional Fees" },
  { code: ExpenseCategory.REPAIRS_MAINTENANCE, label: "Facility Repairs & Maintenance" },
  { code: ExpenseCategory.OTHER_OPERATING, label: "Other Operating Expenses" },
];

export function CreateExpenseDialog({ open, onOpenChange, onSuccess }: CreateExpenseDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.SOFTWARE_CLOUD_SAAS);
  const [amountRupees, setAmountRupees] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [department, setDepartment] = useState("IT");
  const [costCenter, setCostCenter] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [paidTo, setPaidTo] = useState("");
  const [isClaim, setIsClaim] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = api.finance.createExpense.useMutation({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amountRupees <= 0 || !paidTo.trim()) return;

    createMutation.mutate({
      title: title.trim(),
      category,
      amountPaise: Math.round(amountRupees * 100),
      expenseDate: new Date(expenseDate),
      department: department.trim() || undefined,
      costCenter: costCenter.trim() || undefined,
      paymentMethod,
      paidTo: paidTo.trim(),
      isClaim,
      receiptUrl: receiptUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <IndianRupee className="h-5 w-5 text-emerald-600" />
            Record Business Expense or Reimbursement Claim
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Captures authorized institutional operating expenditures, departmental cost allocations, and staff claims.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <Label className="text-xs">Expense Description / Title *</Label>
            <Input
              required
              placeholder="e.g. AWS Cloud Hosting Server Charges — October 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Expense Category *</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full h-8 text-xs rounded border border-slate-300 bg-white px-2 mt-1"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Amount (₹) *</Label>
              <Input
                type="number"
                min="1"
                required
                placeholder="0"
                value={amountRupees || ""}
                onChange={(e) => setAmountRupees(parseFloat(e.target.value) || 0)}
                className="h-8 text-xs mt-1 font-bold text-slate-900"
              />
            </div>

            <div>
              <Label className="text-xs">Expense Date *</Label>
              <Input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Payment Method *</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full h-8 text-xs rounded border border-slate-300 bg-white px-2 mt-1"
              >
                <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer (NEFT/RTGS)</option>
                <option value={PaymentMethod.UPI}>UPI / QR</option>
                <option value={PaymentMethod.CARD}>Credit / Debit Card</option>
                <option value={PaymentMethod.CHEQUE}>Cheque</option>
                <option value={PaymentMethod.CASH}>Petty Cash</option>
              </select>
            </div>

            <div>
              <Label className="text-xs">Payee / Beneficiary Name *</Label>
              <Input
                required
                placeholder="e.g. Amazon Web Services or Staff Name"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Department</Label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-8 text-xs rounded border border-slate-300 bg-white px-2 mt-1"
              >
                <option value="IT">IT & Engineering</option>
                <option value="ACADEMICS">Academics & Training</option>
                <option value="MARKETING">Marketing & Social</option>
                <option value="OPERATIONS">Operations & Premises</option>
                <option value="HR">Human Resources</option>
                <option value="MANAGEMENT">Executive Management</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Cost Centre Code</Label>
              <Input
                placeholder="e.g. CC-IT-2026"
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value.toUpperCase())}
                className="h-8 text-xs mt-1 font-mono uppercase"
              />
            </div>

            <div>
              <Label className="text-xs">Receipt / Voucher Link</Label>
              <Input
                placeholder="https://... receipt image or PDF"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes / Particulars</Label>
            <Input
              placeholder="Business justification or invoice reference"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-8 text-xs mt-1"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
              <input
                type="checkbox"
                checked={isClaim}
                onChange={(e) => setIsClaim(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>This is an employee reimbursement claim (paid out of personal funds)</span>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {createMutation.isPending ? "Recording..." : "Record Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
