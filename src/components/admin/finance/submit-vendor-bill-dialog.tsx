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
import { FileText, CheckCircle2, AlertTriangle } from "lucide-react";

interface SubmitVendorBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SubmitVendorBillDialog({
  open,
  onOpenChange,
  onSuccess,
}: SubmitVendorBillDialogProps) {
  const [vendorId, setVendorId] = useState("");
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [department, setDepartment] = useState("IT");
  const [costCenter, setCostCenter] = useState("");
  const [taxableAmountRupees, setTaxableAmountRupees] = useState<number>(0);
  const [cgstRupees, setCgstRupees] = useState<number>(0);
  const [sgstRupees, setSgstRupees] = useState<number>(0);
  const [igstRupees, setIgstRupees] = useState<number>(0);
  const [isItcEligible, setIsItcEligible] = useState<boolean>(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [notes, setNotes] = useState("");

  const { data: vendors } = api.finance.listVendors.useQuery({ isActive: true });

  const submitBillMutation = api.finance.submitVendorBill.useMutation({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const totalBillRupees =
    (taxableAmountRupees || 0) +
    (cgstRupees || 0) +
    (sgstRupees || 0) +
    (igstRupees || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || !vendorInvoiceNumber.trim() || taxableAmountRupees <= 0) return;

    submitBillMutation.mutate({
      vendorId,
      vendorInvoiceNumber: vendorInvoiceNumber.trim(),
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      department: department.trim() || undefined,
      costCenter: costCenter.trim() || undefined,
      taxableAmountPaise: Math.round(taxableAmountRupees * 100),
      cgstAmountPaise: Math.round((cgstRupees || 0) * 100),
      sgstAmountPaise: Math.round((sgstRupees || 0) * 100),
      igstAmountPaise: Math.round((igstRupees || 0) * 100),
      isItcEligible,
      attachmentUrl: attachmentUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <FileText className="h-5 w-5 text-amber-600" />
            Register Vendor Purchase Bill / Invoice
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Records legitimate purchase invoices with automatic duplicate detection (Vendor + Invoice No + Date + Value).
          </p>
        </DialogHeader>

        {submitBillMutation.error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong>Submission Error:</strong> {submitBillMutation.error.message}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Select Vendor / Supplier *</Label>
              <select
                required
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full h-8 text-xs rounded border border-slate-300 bg-white px-2 mt-1 font-medium"
              >
                <option value="">-- Choose Vendor --</option>
                {vendors?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.vendorCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Vendor Invoice / Bill No. *</Label>
              <Input
                required
                placeholder="e.g. INV-2026-98124"
                value={vendorInvoiceNumber}
                onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                className="h-8 text-xs mt-1 font-mono uppercase"
              />
            </div>

            <div>
              <Label className="text-xs">Vendor Invoice Date *</Label>
              <Input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Payment Due Date *</Label>
              <Input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Allocated Department</Label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-8 text-xs rounded border border-slate-300 bg-white px-2 mt-1"
              >
                <option value="IT">IT & Infrastructure</option>
                <option value="ACADEMICS">Academics & Training</option>
                <option value="MARKETING">Marketing & Advertising</option>
                <option value="OPERATIONS">Operations & Premises</option>
                <option value="HR">Human Resources</option>
                <option value="MANAGEMENT">Management</option>
              </select>
            </div>

            <div>
              <Label className="text-xs">Cost Centre Code</Label>
              <Input
                placeholder="e.g. CC-IT-2026"
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value.toUpperCase())}
                className="h-8 text-xs mt-1 font-mono uppercase"
              />
            </div>
          </div>

          {/* Taxable Amount & GST Breakout */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Taxable Value & Input GST Breakout
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Taxable Value (₹) *</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  placeholder="0"
                  value={taxableAmountRupees || ""}
                  onChange={(e) => setTaxableAmountRupees(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs mt-1 font-bold"
                />
              </div>

              <div>
                <Label className="text-xs">CGST (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={cgstRupees || ""}
                  onChange={(e) => setCgstRupees(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">SGST (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={sgstRupees || ""}
                  onChange={(e) => setSgstRupees(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">IGST (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={igstRupees || ""}
                  onChange={(e) => setIgstRupees(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
              <span>Total Bill Liability:</span>
              <span className="text-amber-700">₹{totalBillRupees.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* ITC & Compliance Checkbox */}
          <div className="bg-amber-50/60 border border-amber-200 rounded p-3 text-xs space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-amber-950">
              <input
                type="checkbox"
                checked={isItcEligible}
                onChange={(e) => setIsItcEligible(e.target.checked)}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              <span>Candidate for Input Tax Credit (ITC) under Section 16 of CGST Act</span>
            </label>
            <p className="text-[11px] text-amber-800">
              Note: Marking ITC eligible places this bill in the <strong>PENDING_VERIFICATION</strong> queue for GSTR-2B reconciliation by an authorized accountant.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Scanned Bill Attachment URL</Label>
              <Input
                placeholder="https://... or doc link"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Notes / Particulars</Label>
              <Input
                placeholder="Approval reference or invoice memo"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitBillMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitBillMutation.isPending ? "Submitting..." : "Submit Purchase Bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
