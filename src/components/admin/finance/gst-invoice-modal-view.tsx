"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, X, Building2, CheckCircle2, Link2, Check } from "lucide-react";
import { formatPaiseToRupees, formatDate } from "@/lib/utils";

interface GstInvoiceModalViewProps {
  invoice: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GstInvoiceModalView({ invoice, open, onOpenChange }: GstInvoiceModalViewProps) {
  const [copiedLink, setCopiedLink] = React.useState(false);
  const printRef = React.useRef<HTMLDivElement>(null);
  if (!invoice) return null;

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    const el = printRef.current;
    if (!el) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=750");
    if (!printWindow) {
      window.print();
      return;
    }

    const innerHtml = el.innerHTML;
    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Tax Invoice - ${invoice.invoiceNumber}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; background: #fff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  </style>
</head>
<body class="p-4">
  <div class="max-w-[800px] mx-auto">
    ${innerHtml}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
        window.close();
      }, 400);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/pay?invoice=${encodeURIComponent(invoice.invoiceNumber)}&amount=${(invoice.balanceAmountPaise || invoice.grandTotalPaise) / 100}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isInterState = invoice.isInterState;
  const grandTotal = invoice.grandTotalPaise / 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-0 bg-slate-100">
        <div className="sticky top-0 z-20 flex items-center justify-between bg-slate-900 text-white px-6 py-3 shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide">GST Tax Invoice Viewer</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {invoice.balanceAmountPaise > 0 && (
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                <span>{copiedLink ? "Payment Link Copied!" : "Copy Payment Link"}</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" /> Print / Save PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Branded A4 Tax Invoice Paper */}
        <div className="p-4 sm:p-8 flex justify-center">
          <div ref={printRef} className="w-full max-w-[800px] bg-white border border-slate-300 p-8 shadow-sm rounded print:border-0 print:p-0 print:shadow-none text-slate-800 font-sans text-xs">
            {/* Header / Company Info */}
            <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-5">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-2xl tracking-tight text-[#16a34a]">SOFT</span>
                  <span className="font-black text-2xl tracking-tight text-[#0284c7]">LAB</span>
                  <span className="font-black text-sm tracking-widest text-[#0284c7] ml-0.5">GLOBAL</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-600 mt-1">
                  Center of Excellence for Cloud, AI & Software Engineering
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {invoice.companyAddress || "4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, UP - 211011"}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-600">
                  <span>GSTIN: <strong className="font-mono text-slate-900">{invoice.companyGstin || "09AAECS8901L1Z9"}</strong></span>
                  <span>State: <strong>Uttar Pradesh (Code: 09)</strong></span>
                  <span>Email: <strong>accounts@softlabglobal.com</strong></span>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block bg-emerald-50 border border-emerald-200 px-3 py-1 rounded text-emerald-800 font-bold uppercase tracking-wider text-[11px]">
                  TAX INVOICE
                </div>
                <div className="mt-2 font-mono text-sm font-extrabold text-slate-900">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Date: <strong className="text-slate-800">{formatDate(invoice.invoiceDate)}</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  Due: <strong className="text-slate-800">{formatDate(invoice.dueDate)}</strong>
                </div>
              </div>
            </div>

            {/* Bill To & Supply Details */}
            <div className="grid grid-cols-2 gap-6 my-5 bg-slate-50/60 p-4 rounded border border-slate-200">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Billed To / Customer
                </div>
                <div className="font-bold text-sm text-slate-900 mt-1">{invoice.customerName}</div>
                {invoice.customerAddress && <div className="text-[11px] text-slate-600 mt-0.5">{invoice.customerAddress}</div>}
                <div className="text-[11px] text-slate-600">
                  {invoice.customerCity ? `${invoice.customerCity}, ` : ""}{invoice.customerState}
                </div>
                {invoice.customerGstin && (
                  <div className="text-[11px] font-mono font-semibold text-emerald-800 mt-1">
                    GSTIN: {invoice.customerGstin}
                  </div>
                )}
                {invoice.customerPhone && (
                  <div className="text-[11px] text-slate-500 mt-0.5">Phone: {invoice.customerPhone}</div>
                )}
              </div>

              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Statutory Supply Details
                </div>
                <table className="w-full text-[11px] mt-1 space-y-1">
                  <tbody>
                    <tr>
                      <td className="text-slate-500 py-0.5">Place of Supply:</td>
                      <td className="font-bold text-slate-900 py-0.5">{invoice.placeOfSupply}</td>
                    </tr>
                    <tr>
                      <td className="text-slate-500 py-0.5">Supply Type:</td>
                      <td className="font-bold text-slate-900 py-0.5">
                        {isInterState ? "Inter-State (IGST Applicable)" : "Intra-State (CGST + SGST Applicable)"}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-slate-500 py-0.5">Payment Terms:</td>
                      <td className="font-semibold text-slate-800 py-0.5">{invoice.paymentTerms || "Net 15 Days"}</td>
                    </tr>
                    <tr>
                      <td className="text-slate-500 py-0.5">Invoice Status:</td>
                      <td className="font-bold py-0.5">
                        <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-mono text-[10px]">
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-300 rounded overflow-hidden my-5">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-200 w-8 text-center">#</th>
                    <th className="p-2 border-r border-slate-200">Description of Service / Goods</th>
                    <th className="p-2 border-r border-slate-200 text-center w-16">HSN/SAC</th>
                    <th className="p-2 border-r border-slate-200 text-center w-12">Qty</th>
                    <th className="p-2 border-r border-slate-200 text-right w-20">Rate (₹)</th>
                    <th className="p-2 border-r border-slate-200 text-right w-20">Taxable (₹)</th>
                    {!isInterState ? (
                      <>
                        <th className="p-2 border-r border-slate-200 text-right w-16">CGST</th>
                        <th className="p-2 border-r border-slate-200 text-right w-16">SGST</th>
                      </>
                    ) : (
                      <th className="p-2 border-r border-slate-200 text-right w-20">IGST</th>
                    )}
                    <th className="p-2 text-right w-24">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2 border-r border-slate-200 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <div className="font-semibold text-slate-900">{item.description}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                          {item.itemType?.replace(/_/g, " ")}
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600">
                        {item.hsnSacCode}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-700">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right text-slate-700">
                        {(item.ratePaise / 100).toLocaleString("en-IN")}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-medium text-slate-900">
                        {(item.taxableAmountPaise / 100).toLocaleString("en-IN")}
                      </td>
                      {!isInterState ? (
                        <>
                          <td className="p-2 border-r border-slate-200 text-right text-slate-600">
                            <div>{(item.cgstAmountPaise / 100).toLocaleString("en-IN")}</div>
                            <div className="text-[9px] text-slate-400">({item.cgstRate}%)</div>
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right text-slate-600">
                            <div>{(item.sgstAmountPaise / 100).toLocaleString("en-IN")}</div>
                            <div className="text-[9px] text-slate-400">({item.sgstRate}%)</div>
                          </td>
                        </>
                      ) : (
                        <td className="p-2 border-r border-slate-200 text-right text-slate-600">
                          <div>{(item.igstAmountPaise / 100).toLocaleString("en-IN")}</div>
                          <div className="text-[9px] text-slate-400">({item.igstRate}%)</div>
                        </td>
                      )}
                      <td className="p-2 text-right font-bold text-slate-900">
                        {(item.totalAmountPaise / 100).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Bank Summary */}
            <div className="grid grid-cols-2 gap-6 my-6 items-start">
              {/* Left Column: Bank Account & Payment Instructions */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 text-[11px] space-y-1.5">
                <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider border-b border-slate-200 pb-1">
                  Bank Settlement Particulars (NEFT / RTGS / IMPS)
                </div>
                <div className="flex justify-between"><span className="text-slate-500">Beneficiary:</span> <strong>SOFTLAB GLOBAL</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Bank Name:</span> <strong>HDFC Bank</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Account No:</span> <strong className="font-mono">50200088991122</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">IFSC Code:</span> <strong className="font-mono">HDFC0001234</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Branch:</span> <strong>Civil Lines, Prayagraj</strong></div>
              </div>

              {/* Right Column: Tax Breakdown Total */}
              <div className="border border-slate-200 rounded p-3 bg-white text-[11px] space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-semibold text-slate-900">
                    {formatPaiseToRupees(invoice.taxableAmountPaise)}
                  </span>
                </div>
                {!isInterState ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Central GST (CGST):</span>
                      <span className="font-medium text-slate-800">{formatPaiseToRupees(invoice.cgstAmountPaise)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>State GST (SGST):</span>
                      <span className="font-medium text-slate-800">{formatPaiseToRupees(invoice.sgstAmountPaise)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>Integrated GST (IGST):</span>
                    <span className="text-purple-800">{formatPaiseToRupees(invoice.igstAmountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Total Tax Amount:</span>
                  <span className="font-bold text-emerald-800">{formatPaiseToRupees(invoice.totalTaxPaise)}</span>
                </div>
                {invoice.roundOffPaise !== 0 && (
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Round Off:</span>
                    <span>{(invoice.roundOffPaise / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-slate-800 pt-1.5 text-sm font-extrabold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">{formatPaiseToRupees(invoice.grandTotalPaise)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
                  <span>Paid Amount:</span>
                  <span className="font-semibold text-slate-800">{formatPaiseToRupees(invoice.paidAmountPaise)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-red-600">
                  <span>Balance Due:</span>
                  <span>{formatPaiseToRupees(invoice.balanceAmountPaise)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Signatory Footer */}
            <div className="grid grid-cols-2 gap-6 mt-8 pt-4 border-t border-slate-200">
              <div className="text-[10px] text-slate-500 space-y-1">
                <div className="font-bold uppercase text-slate-700">Terms & Conditions:</div>
                <p>1. Invoices are legally issued under GST Rule 46 of CGST Act, 2017.</p>
                <p>2. Subject to Prayagraj, Uttar Pradesh jurisdiction.</p>
                <p>3. This is a computer-generated tax invoice verified by the accounts desk.</p>
              </div>

              <div className="text-right flex flex-col justify-end items-end">
                <div className="font-bold text-slate-900 text-[11px]">For SOFTLAB GLOBAL</div>
                <div className="h-12 w-32 border-b border-dashed border-slate-300 mt-2 flex items-center justify-center text-[10px] text-slate-300 italic">
                  [Authorized Signature]
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Authorized Signatory / Finance Desk</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
