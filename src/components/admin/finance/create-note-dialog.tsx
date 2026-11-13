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
import { NoteType, NotePartyType } from "@prisma/client";
import { FileDiff, CheckCircle2 } from "lucide-react";

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultInvoiceId?: string;
}

export function CreateNoteDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultInvoiceId,
}: CreateNoteDialogProps) {
  const [noteType, setNoteType] = useState<NoteType>(NoteType.CREDIT_NOTE);
  const [partyType, setPartyType] = useState<NotePartyType>(NotePartyType.CUSTOMER);
  const [gstInvoiceId, setGstInvoiceId] = useState(defaultInvoiceId || "");
  const [taxableAmountRupees, setTaxableAmountRupees] = useState<number>(0);
  const [cgstRupees, setCgstRupees] = useState<number>(0);
  const [sgstRupees, setSgstRupees] = useState<number>(0);
  const [igstRupees, setIgstRupees] = useState<number>(0);
  const [reason, setReason] = useState("");

  const { data: invoicesData } = api.finance.listGstInvoices.useQuery({ limit: 50 });

  const createNoteMutation = api.finance.createCreditDebitNote.useMutation({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || taxableAmountRupees <= 0) return;

    createNoteMutation.mutate({
      noteType,
      partyType,
      gstInvoiceId: gstInvoiceId || undefined,
      reason: reason.trim(),
      taxableAmountPaise: Math.round(taxableAmountRupees * 100),
      cgstAmountPaise: Math.round((cgstRupees || 0) * 100),
      sgstAmountPaise: Math.round((sgstRupees || 0) * 100),
      igstAmountPaise: Math.round((igstRupees || 0) * 100),
    });
  };

  const totalAdjustment =
    (taxableAmountRupees || 0) + (cgstRupees || 0) + (sgstRupees || 0) + (igstRupees || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <FileDiff className="h-5 w-5 text-purple-600" />
            Issue Statutory Credit Note or Debit Note
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Issues a formal GST adjustment document under Section 34 of the CGST Act for fee concessions, cancellations, or supplemental charges.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Document Type *</Label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as NoteType)}
                className="w-full h-8 text-xs rounded border border-slate-300 bg-white px-2 mt-1 font-bold text-purple-900"
              >
                <option value={NoteType.CREDIT_NOTE}>CREDIT NOTE (Reduction in Dues / Refund)</option>
                <option value={NoteType.DEBIT_NOTE}>DEBIT NOTE (Supplemental Charge)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs">Party Type *</Label>
              <select
                value={partyType}
                onChange={(e) => setPartyType(e.target.value as NotePartyType)}
                className="w-full h-8 text-xs rounded border border-slate-300 bg-white px-2 mt-1"
              >
                <option value={NotePartyType.CUSTOMER}>Customer / Student</option>
                <option value={NotePartyType.VENDOR}>Vendor / Supplier</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Linked GST Sales Invoice (Optional)</Label>
            <select
              value={gstInvoiceId}
              onChange={(e) => setGstInvoiceId(e.target.value)}
              className="w-full h-8 text-xs rounded border border-slate-300 bg-white px-2 mt-1 font-mono"
            >
              <option value="">-- No direct invoice link (Standalone adjustment) --</option>
              {invoicesData?.invoices?.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customerName} (₹{(inv.grandTotalPaise / 100).toLocaleString("en-IN")})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs">Statutory Reason for Issuance *</Label>
            <Input
              required
              placeholder="e.g. Post-admission scholarship adjustment or Course batch rescheduling"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-8 text-xs mt-1"
            />
          </div>

          {/* Taxable and GST breakdown */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Taxable Adjustment Breakdown
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <Label className="text-[11px]">Taxable Amount (₹) *</Label>
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
                <Label className="text-[11px]">CGST (₹)</Label>
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
                <Label className="text-[11px]">SGST (₹)</Label>
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
                <Label className="text-[11px]">IGST (₹)</Label>
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
              <span>Total Note Value:</span>
              <span className="text-purple-700">₹{totalAdjustment.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createNoteMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {createNoteMutation.isPending ? "Issuing..." : `Issue ${noteType.replace(/_/g, " ")}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
