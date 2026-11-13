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
import { Building2, CheckCircle2 } from "lucide-react";

interface RegisterVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  vendorToEdit?: any | null;
}

const VENDOR_CATEGORIES = [
  "Cloud & Hosting Infrastructure (AWS, Vercel, Hostinger)",
  "Software Subscriptions & SaaS (Google Workspace, Zoom)",
  "Office Premises & Rent",
  "Hardware & Networking Equipment",
  "Marketing & Advertising Agencies",
  "Legal, Secretarial & Audit Services",
  "Security & Housekeeping Facilities",
  "Event & Training Logistics",
  "General Stationery & Supplies",
  "Other Vendors",
];

export function RegisterVendorDialog({
  open,
  onOpenChange,
  onSuccess,
  vendorToEdit,
}: RegisterVendorDialogProps) {
  const [name, setName] = useState(vendorToEdit?.name || "");
  const [tradeName, setTradeName] = useState(vendorToEdit?.tradeName || "");
  const [category, setCategory] = useState(vendorToEdit?.category || VENDOR_CATEGORIES[0]);
  const [gstin, setGstin] = useState(vendorToEdit?.gstin || "");
  const [pan, setPan] = useState(vendorToEdit?.pan || "");
  const [email, setEmail] = useState(vendorToEdit?.email || "");
  const [phone, setPhone] = useState(vendorToEdit?.phone || "");
  const [address, setAddress] = useState(vendorToEdit?.address || "");
  const [city, setCity] = useState(vendorToEdit?.city || "");
  const [state, setState] = useState(vendorToEdit?.state || "Uttar Pradesh");
  const [bankName, setBankName] = useState(vendorToEdit?.bankName || "");
  const [accountNumber, setAccountNumber] = useState(vendorToEdit?.accountNumber || "");
  const [ifscCode, setIfscCode] = useState(vendorToEdit?.ifscCode || "");
  const [paymentTermsDays, setPaymentTermsDays] = useState(vendorToEdit?.paymentTermsDays || 30);
  const [notes, setNotes] = useState(vendorToEdit?.notes || "");

  const registerMutation = api.finance.registerVendor.useMutation({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    registerMutation.mutate({
      vendorId: vendorToEdit?.id,
      name: name.trim(),
      tradeName: tradeName.trim() || undefined,
      category,
      gstin: gstin.trim() || undefined,
      pan: pan.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      bankName: bankName.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      ifscCode: ifscCode.trim() || undefined,
      paymentTermsDays: Number(paymentTermsDays) || 30,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Building2 className="h-5 w-5 text-indigo-600" />
            {vendorToEdit ? "Edit Vendor Profile" : "Register Institutional Supplier / Vendor"}
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Maintains legitimate supplier profiles for purchase billing, GST input reconciliation, and remittance accounts.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Vendor Legal Entity Name *</Label>
              <Input
                required
                placeholder="e.g. Hostinger International Ltd"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Trade / Brand Name</Label>
              <Input
                placeholder="e.g. Hostinger"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Category *</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-8 text-xs rounded border border-slate-300 bg-white px-2 mt-1"
              >
                {VENDOR_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Vendor GSTIN (if applicable)</Label>
              <Input
                placeholder="e.g. 09ABCDE1234F1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="h-8 text-xs mt-1 font-mono uppercase"
              />
            </div>

            <div>
              <Label className="text-xs">Official Email</Label>
              <Input
                type="email"
                placeholder="billing@vendor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Contact Phone</Label>
              <Input
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          {/* Banking / Remittance */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Bank Account Details for Disbursements
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Bank Name</Label>
                <Input
                  placeholder="e.g. HDFC Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Account Number</Label>
                <Input
                  placeholder="Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">IFSC Code</Label>
                <Input
                  placeholder="e.g. HDFC0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="h-8 text-xs mt-1 font-mono uppercase"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Payment Terms (Credit Days)</Label>
              <Input
                type="number"
                min="0"
                value={paymentTermsDays}
                onChange={(e) => setPaymentTermsDays(parseInt(e.target.value, 10) || 0)}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Notes / Contracts</Label>
              <Input
                placeholder="AMC contract reference, billing cycle, etc."
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
              disabled={registerMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {registerMutation.isPending ? "Saving..." : vendorToEdit ? "Update Vendor" : "Register Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
