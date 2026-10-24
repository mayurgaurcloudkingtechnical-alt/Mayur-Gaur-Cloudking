"use client";

import React from "react";
import type { ImsEnquiryRecord } from "@/server/services/ims.service";
import { Printer, X, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ImsQuotationPdfModalProps {
  record: ImsEnquiryRecord;
  onClose: () => void;
}

export function ImsQuotationPdfModal({ record, onClose }: ImsQuotationPdfModalProps) {
  const { quotation, customer, requirements, referenceNumber } = record;
  const isApproved = quotation.status === "APPROVED_FINAL";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Top Action Bar (Hidden in Print) */}
        <div className="sticky top-0 z-20 bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-amber-400">
              {quotation.quotationNumber} (v{quotation.version})
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isApproved
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
              }`}
            >
              {isApproved ? "APPROVED COMMERCIAL QUOTATION" : "PROVISIONAL ESTIMATE"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4" /> Print / Save Official PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-8 sm:p-10 space-y-6 text-slate-900 text-sm">
          {/* Header Branding */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#071630] text-white font-black flex items-center justify-center text-base">
                  SLG
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-[#071630]">
                    SOFTLAB GLOBAL
                  </h1>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    IT Infrastructure & Managed Services Division (IMS)
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-0.5 leading-relaxed">
                <p>
                  <strong>Corporate Office:</strong> 4th Floor, 211/C/59, Tata Motors Building, M.G
                  Road, Civil Lines, Prayagraj, Uttar Pradesh - 211011
                </p>
                <p>
                  <strong>Web:</strong> www.softlabglobal.com | <strong>Email:</strong>{" "}
                  info@softlabglobal.com | <strong>Phone:</strong> +91 73808 63063
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}
              >
                {isApproved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Commercial Quotation
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" /> Provisional BOQ Estimate
                  </>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-2">
                <strong>Quotation No:</strong>{" "}
                <span className="font-mono font-bold text-slate-900">
                  {quotation.quotationNumber}
                </span>
              </p>
              <p className="text-xs text-slate-600">
                <strong>Enquiry Ref:</strong>{" "}
                <span className="font-mono font-bold text-slate-900">{referenceNumber}</span>
              </p>
              <p className="text-xs text-slate-600">
                <strong>Date of Issue:</strong>{" "}
                {new Date(quotation.updatedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-slate-600">
                <strong>Validity:</strong> {quotation.validityDays} Days
              </p>
            </div>
          </div>

          {/* Client & Site Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Prepared For (Client Details)
              </h3>
              <p className="font-bold text-slate-900 text-base">
                {customer?.company || customer?.name || "Client"}
              </p>
              {customer?.company && (
                <p className="text-xs text-slate-700">Attn: {customer?.name}</p>
              )}
              <p className="text-xs text-slate-600 mt-1">Email: {customer?.email}</p>
              <p className="text-xs text-slate-600">Phone: {customer?.phone}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Project Location & Site Parameters
              </h3>
              <p className="font-semibold text-slate-900 text-xs">
                Location: {customer?.city || "Site"}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Premises Type: {requirements.siteType} ({requirements.buildingFloors} Floor
                {requirements.buildingFloors > 1 ? "s" : ""})
              </p>
              <p className="text-xs text-slate-600">
                Engagement Mode: {requirements.engagementType.replace(/_/g, " ")}
              </p>
              {requirements.preferredEquipment && (
                <p className="text-xs text-slate-600">
                  Preferred OEM: {requirements.preferredEquipment}
                </p>
              )}
            </div>
          </div>

          {/* Provisional Notice if not yet approved */}
          {(!isApproved || quotation.hasPendingPrices || quotation.hasUnverifiedQuantities) && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <strong>Provisional Estimate Disclaimer:</strong> This document includes estimated
              cabling/material quantities or items pending final OEM/Management pricing. A final
              binding commercial quotation is issued upon physical site verification and management
              approval.
            </div>
          )}

          {/* Itemized Bill of Quantities Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Itemized Bill of Quantities (BOQ) — Equipment, Cabling, Accessories & Labour
            </h3>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-2.5 px-3 font-bold">#</th>
                    <th className="py-2.5 px-3 font-bold">Item & Technical Description</th>
                    <th className="py-2.5 px-3 font-bold text-center">Qty</th>
                    <th className="py-2.5 px-3 font-bold text-center">Unit</th>
                    <th className="py-2.5 px-3 font-bold text-right">Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 font-bold text-center">GST %</th>
                    <th className="py-2.5 px-3 font-bold text-right">Total Excl. GST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {quotation.lineItems.map((item: any, index: number) => (
                    <tr key={item.id} className="align-top">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{index + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-slate-600 text-[11px]">{item.specification}</div>
                        {item.requiresSiteVerification && (
                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-amber-700">
                            * Quantity subject to physical site measurement
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{item.unit}</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {item.pricePending || item.unitPrice === null
                          ? "Pending Input"
                          : item.unitPrice.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-center">{item.gstPercent}%</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {item.pricePending || item.lineSubtotal === null
                          ? "Pending"
                          : item.lineSubtotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commercial Summary Box */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
            <div className="flex-1 space-y-3 text-xs text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Scope of Work
                </h4>
                <p className="leading-relaxed">{quotation.scopeOfWork}</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Assumptions & Exclusions
                </h4>
                <p className="leading-relaxed">{quotation.assumptionsAndExclusions}</p>
              </div>
            </div>

            <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-2xl border border-slate-300 space-y-2 text-xs shrink-0">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal (Verified Items):</span>
                <span className="font-mono font-bold">
                  ₹{quotation.subtotalExclTax.toLocaleString("en-IN")}
                </span>
              </div>
              {quotation.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Approved Discount:</span>
                  <span className="font-mono font-bold">
                    - ₹{quotation.discountAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Taxable Value:</span>
                <span className="font-mono font-bold">
                  ₹{quotation.taxableAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Applicable GST (18%):</span>
                <span className="font-mono font-bold">
                  ₹{quotation.gstTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-300 flex justify-between text-sm font-black text-slate-900">
                <span>Grand Total (Incl. GST):</span>
                <span className="font-mono text-blue-700">
                  ₹{quotation.grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
              {quotation.hasPendingPrices && (
                <p className="text-[10px] text-amber-700 font-semibold pt-1">
                  * Excludes line items marked "Pending Input".
                </p>
              )}
            </div>
          </div>

          {/* Terms & Signatory */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-200 text-xs">
            <div className="sm:col-span-2 space-y-2 text-slate-600">
              <p>
                <strong className="text-slate-900">Warranty & AMC Terms:</strong>{" "}
                {quotation.warrantyAndAmcTerms}
              </p>
              <p>
                <strong className="text-slate-900">Payment Terms:</strong> {quotation.paymentTerms}
              </p>
            </div>
            <div className="text-left sm:text-right flex flex-col justify-end pt-6 sm:pt-0">
              <div className="inline-block border-t-2 border-slate-900 pt-2">
                <p className="font-bold text-slate-900">Authorized Signatory</p>
                <p className="text-[11px] text-slate-600">
                  IT Infrastructure & Managed Services Division
                </p>
                <p className="text-[11px] font-bold text-blue-700">SoftLab Global</p>
                {quotation.approvedByName && (
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    Digitally Approved by: {quotation.approvedByName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
