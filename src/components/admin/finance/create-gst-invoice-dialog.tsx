"use client";

import * as React from "react";
import { useState, useMemo } from "react";
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
import { GstCustomerType, InvoiceItemType } from "@prisma/client";
import { Plus, Trash2, Calculator, CheckCircle2 } from "lucide-react";
import { formatPaiseToRupees } from "@/lib/utils";

interface CreateGstInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const INDIAN_STATES = [
  { code: "09", name: "Uttar Pradesh" },
  { code: "07", name: "Delhi" },
  { code: "10", name: "Bihar" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "33", name: "Tamil Nadu" },
  { code: "06", name: "Haryana" },
  { code: "08", name: "Rajasthan" },
  { code: "19", name: "West Bengal" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "05", name: "Uttarakhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "20", name: "Jharkhand" },
  { code: "03", name: "Punjab" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "32", name: "Kerala" },
];

const STANDARD_HSN_SAC: Record<string, { code: string; label: string; defaultGst: number }> = {
  COURSE_TUITION: { code: "999293", label: "Commercial Training & Coaching Services", defaultGst: 18.0 },
  IT_SERVICES: { code: "998313", label: "IT Infrastructure & Network Management", defaultGst: 18.0 },
  SOFTWARE_DEVELOPMENT: { code: "998314", label: "Software Development & IT Consulting", defaultGst: 18.0 },
  NETWORK_AMC: { code: "998713", label: "Maintenance & Repair of IT Equipment / AMC", defaultGst: 18.0 },
  CONSULTING: { code: "998311", label: "Management & Technical Consulting", defaultGst: 18.0 },
  FRANCHISE_FEE: { code: "998399", label: "Franchise Licensing & Brand Authorization", defaultGst: 18.0 },
  CORPORATE_TRAINING: { code: "999294", label: "Higher Education & Executive Corporate Training", defaultGst: 18.0 },
  EXAM_CERTIFICATION: { code: "999299", label: "Assessment & Certification Examination Fees", defaultGst: 18.0 },
  OTHER: { code: "998399", label: "Other Technical Support Services", defaultGst: 18.0 },
};

export function CreateGstInvoiceDialog({ open, onOpenChange, onSuccess }: CreateGstInvoiceDialogProps) {
  const [customerType, setCustomerType] = useState<GstCustomerType>(GstCustomerType.B2C_UNREGISTERED);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("Prayagraj");
  const [customerStateCode, setCustomerStateCode] = useState("09"); // Default UP
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [issueImmediately, setIssueImmediately] = useState(true);

  // Line Items
  const [items, setItems] = useState<Array<{
    itemType: InvoiceItemType;
    description: string;
    hsnSacCode: string;
    quantity: number;
    unit: string;
    rateRupees: number;
    discountRupees: number;
    gstRate: number;
    isTaxInclusive: boolean;
  }>>([
    {
      itemType: InvoiceItemType.COURSE_TUITION,
      description: "Institutional IT & Cloud Engineering Certification Program",
      hsnSacCode: "999293",
      quantity: 1,
      unit: "NOS",
      rateRupees: 25000,
      discountRupees: 0,
      gstRate: 18,
      isTaxInclusive: false,
    },
  ]);

  const selectedState = INDIAN_STATES.find((s) => s.code === customerStateCode) || INDIAN_STATES[0];
  const isInterState = customerStateCode !== "09"; // SoftLab Global is in UP (09)

  // Live GST Breakup Calculation supporting dual-pricing (inclusive vs exclusive)
  const calculation = useMemo(() => {
    let subtotalRupees = 0;
    let totalDiscountRupees = 0;
    let taxableRupees = 0;
    let cgstRupees = 0;
    let sgstRupees = 0;
    let igstRupees = 0;

    const computedItems = items.map((item) => {
      const lineSubtotal = item.quantity * item.rateRupees;
      const lineDiscount = Math.min(lineSubtotal, item.discountRupees || 0);
      const netEntered = Math.max(0, lineSubtotal - lineDiscount);

      subtotalRupees += lineSubtotal;
      totalDiscountRupees += lineDiscount;

      let lineTaxable = 0;
      let lineTotalTax = 0;
      let lineTotal = 0;

      if (item.gstRate === 0) {
        lineTaxable = netEntered;
        lineTotalTax = 0;
        lineTotal = netEntered;
      } else if (item.isTaxInclusive) {
        lineTaxable = (netEntered * 100) / (100 + item.gstRate);
        lineTotalTax = netEntered - lineTaxable;
        lineTotal = netEntered;
      } else {
        lineTaxable = netEntered;
        lineTotalTax = (lineTaxable * item.gstRate) / 100;
        lineTotal = lineTaxable + lineTotalTax;
      }

      taxableRupees += lineTaxable;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterState) {
        igst = lineTotalTax;
        igstRupees += igst;
      } else {
        cgst = lineTotalTax / 2;
        sgst = lineTotalTax / 2;
        cgstRupees += cgst;
        sgstRupees += sgst;
      }

      return {
        ...item,
        lineTaxable,
        cgst,
        sgst,
        igst,
        lineTotal,
      };
    });

    const totalTaxRupees = cgstRupees + sgstRupees + igstRupees;
    const grandTotalExact = taxableRupees + totalTaxRupees;
    const roundedGrandTotal = Math.round(grandTotalExact);
    const roundOffRupees = roundedGrandTotal - grandTotalExact;

    return {
      subtotalRupees,
      totalDiscountRupees,
      taxableRupees,
      cgstRupees,
      sgstRupees,
      igstRupees,
      totalTaxRupees,
      roundOffRupees,
      grandTotalRupees: roundedGrandTotal,
      computedItems,
    };
  }, [items, isInterState]);

  const createInvoiceMutation = api.finance.createGstInvoice.useMutation({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemType: InvoiceItemType.IT_SERVICES,
        description: "Professional IT & Cloud Infrastructure Services",
        hsnSacCode: "998313",
        quantity: 1,
        unit: "NOS",
        rateRupees: 10000,
        discountRupees: 0,
        gstRate: 18,
        isTaxInclusive: false,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === "itemType") {
        const std = STANDARD_HSN_SAC[value];
        if (std) {
          copy[index].hsnSacCode = std.code;
          copy[index].gstRate = std.defaultGst;
        }
      }
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    createInvoiceMutation.mutate({
      customerType,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerGstin: customerGstin.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      customerCity: customerCity.trim() || "Prayagraj",
      customerState: selectedState.name,
      customerStateCode: selectedState.code,
      placeOfSupply: `${selectedState.code}-${selectedState.name}`,
      dueDate: new Date(dueDate),
      notes: notes.trim() || undefined,
      issueImmediately,
      items: items.map((i) => ({
        itemType: i.itemType,
        description: i.description.trim(),
        hsnSacCode: i.hsnSacCode.trim(),
        quantity: Number(i.quantity) || 1,
        unit: i.unit || "NOS",
        ratePaise: Math.round(i.rateRupees * 100),
        discountPaise: Math.round((i.discountRupees || 0) * 100),
        gstRate: Number(i.gstRate) || 18,
        isTaxInclusive: Boolean(i.isTaxInclusive),
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Calculator className="h-5 w-5 text-emerald-600" />
            Create Official GST Sales Tax Invoice
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Generates a statutory tax invoice adhering to GST Place-of-Supply rules (Company: SOFTLAB GLOBAL, UP Code: 09).
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Customer / Client Details */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
              1. Customer & Place of Supply Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Customer Category *</Label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value as GstCustomerType)}
                  className="w-full h-8 text-xs rounded border border-slate-300 bg-white px-2 mt-1 font-medium"
                >
                  <option value={GstCustomerType.B2C_UNREGISTERED}>B2C — Student / Unregistered</option>
                  <option value={GstCustomerType.B2B_REGISTERED}>B2B — Registered Corporate / Firm</option>
                  <option value={GstCustomerType.GOVERNMENT_SEZ}>Government / SEZ Unit</option>
                  <option value={GstCustomerType.OVERSEAS}>Overseas / Export Customer</option>
                </select>
              </div>

              <div>
                <Label className="text-xs">Customer Legal Name *</Label>
                <Input
                  required
                  placeholder="e.g. Rahul Sharma or Tech Corp India"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Customer GSTIN {customerType === GstCustomerType.B2B_REGISTERED ? "*" : "(Optional)"}</Label>
                <Input
                  placeholder="e.g. 09AAECS8901L1Z9"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                  className="h-8 text-xs mt-1 font-mono uppercase"
                />
              </div>

              <div>
                <Label className="text-xs">Email Address</Label>
                <Input
                  type="email"
                  placeholder="customer@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Contact Phone</Label>
                <Input
                  placeholder="+91 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-emerald-800">Place of Supply (State) *</Label>
                <select
                  value={customerStateCode}
                  onChange={(e) => setCustomerStateCode(e.target.value)}
                  className="w-full h-8 text-xs rounded border border-emerald-400 bg-emerald-50/50 px-2 mt-1 font-bold text-emerald-900"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name} {s.code === "09" ? "(Intra-state: CGST+SGST)" : "(Inter-state: IGST)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <Label className="text-xs">Billing Address</Label>
                <Input
                  placeholder="Street, Building, Landmark"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">City</Label>
                  <Input
                    placeholder="Prayagraj"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div className="w-36">
                  <Label className="text-xs">Invoice Due Date *</Label>
                  <Input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Invoice Line Items & Services
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs gap-1 border-dashed font-bold text-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" /> Add Service Row
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2 w-36">Category</th>
                    <th className="p-2">Description</th>
                    <th className="p-2 w-20">SAC/HSN</th>
                    <th className="p-2 w-16">Qty</th>
                    <th className="p-2 w-24">Rate (₹)</th>
                    <th className="p-2 w-20">Disc (₹)</th>
                    <th className="p-2 w-16">GST %</th>
                    <th className="p-2 w-24 text-right">Taxable</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-1.5">
                        <select
                          value={item.itemType}
                          onChange={(e) => handleItemChange(idx, "itemType", e.target.value)}
                          className="w-full h-7 text-[11px] rounded border border-slate-200 bg-white px-1"
                        >
                          {Object.keys(STANDARD_HSN_SAC).map((k) => (
                            <option key={k} value={k}>
                              {k.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1.5">
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <Input
                          value={item.hsnSacCode}
                          onChange={(e) => handleItemChange(idx, "hsnSacCode", e.target.value)}
                          className="h-7 text-xs font-mono"
                        />
                      </td>
                      <td className="p-1.5">
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 1)}
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <Input
                          type="number"
                          min="0"
                          value={item.rateRupees}
                          onChange={(e) => handleItemChange(idx, "rateRupees", parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <Input
                          type="number"
                          min="0"
                          value={item.discountRupees}
                          onChange={(e) => handleItemChange(idx, "discountRupees", parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleItemChange(idx, "gstRate", parseFloat(e.target.value))}
                          className="w-full h-7 text-xs rounded border border-slate-200 bg-white px-1 font-bold text-slate-800"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>
                      <td className="p-1.5 text-right font-medium text-slate-900">
                        ₹{(calculation.computedItems[idx]?.lineTaxable || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-1.5 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Statutory Tax Breakup Summary Box */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Statutory GST Summary:
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {isInterState ? "Inter-State Supply (IGST)" : "Intra-State Supply (CGST + SGST)"}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Company State: <strong>09-UP</strong> | Place of Supply:{" "}
                  <strong>{selectedState.code}-{selectedState.name}</strong>
                </p>
              </div>

              <div className="text-right space-y-1 text-xs text-slate-700 min-w-[240px]">
                <div className="flex justify-between">
                  <span>Taxable Subtotal:</span>
                  <span className="font-semibold">₹{calculation.taxableRupees.toLocaleString("en-IN")}</span>
                </div>
                {!isInterState ? (
                  <>
                    <div className="flex justify-between text-emerald-800">
                      <span>CGST:</span>
                      <span className="font-bold">₹{Math.round(calculation.cgstRupees).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800">
                      <span>SGST:</span>
                      <span className="font-bold">₹{Math.round(calculation.sgstRupees).toLocaleString("en-IN")}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-purple-800 font-bold">
                    <span>IGST:</span>
                    <span>₹{Math.round(calculation.igstRupees).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {calculation.roundOffRupees !== 0 && (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Round off:</span>
                    <span>₹{calculation.roundOffRupees.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-emerald-300 pt-1 text-base font-extrabold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">₹{calculation.grandTotalRupees.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Flags */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={issueImmediately}
                onChange={(e) => setIssueImmediately(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Issue Immediately & Post to General Ledger (Otherwise save as Draft)</span>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createInvoiceMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {createInvoiceMutation.isPending ? "Generating..." : issueImmediately ? "Generate & Issue Tax Invoice" : "Save Invoice Draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
