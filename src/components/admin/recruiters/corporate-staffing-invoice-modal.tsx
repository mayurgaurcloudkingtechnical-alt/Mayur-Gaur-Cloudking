"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/trpc/react";
import {
  Printer,
  Share2,
  Mail,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  UserCheck,
  Calendar,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileText,
} from "lucide-react";

interface CorporateStaffingInvoiceModalProps {
  invoice: any;
  onClose: () => void;
  onUpdated?: () => void;
}

function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return "Zero Rupees Only";

  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(num: number): string {
    if (num === 0) return "";
    let str = "";
    if (Math.floor(num / 10000000) > 0) {
      str += inWords(Math.floor(num / 10000000)) + "Crore ";
      num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
      str += inWords(Math.floor(num / 100000)) + "Lakh ";
      num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
      str += inWords(Math.floor(num / 1000)) + "Thousand ";
      num %= 1000;
    }
    if (Math.floor(num / 100) > 0) {
      str += inWords(Math.floor(num / 100)) + "Hundred ";
      num %= 100;
    }
    if (num > 0) {
      if (num < 20) {
        str += a[num];
      } else {
        str += b[Math.floor(num / 10)] + " " + a[num % 10];
      }
    }
    return str;
  }

  return "Rupees " + inWords(rounded).trim() + " Only";
}

export function CorporateStaffingInvoiceModal({
  invoice,
  onClose,
  onUpdated,
}: CorporateStaffingInvoiceModalProps) {
  const [copied, setCopied] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState("NEFT");
  const [transactionRef, setTransactionRef] = useState("");

  const updateStatusMutation = api.placement.updateStaffingInvoiceStatus.useMutation({
    onSuccess: () => {
      setShowMarkPaidModal(false);
      onUpdated?.();
      alert("Invoice marked as PAID successfully!");
    },
    onError: (err) => alert(`Failed to update status: ${err.message}`),
  });

  const dispatchEmailMutation = api.placement.dispatchStaffingInvoice.useMutation({
    onSuccess: (res) => {
      setIsSendingEmail(false);
      setEmailStatus(`Invoice successfully emailed to ${res.sentTo}`);
      setTimeout(() => setEmailStatus(null), 6000);
    },
    onError: (err) => {
      setIsSendingEmail(false);
      alert(`Email dispatch failed: ${err.message}`);
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const formattedGrandTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(invoice.grandTotal || 0);

  const formattedBaseAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(invoice.baseAmount || 0);

  const formattedTaxAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(invoice.totalTaxAmount || 0);

  const formattedCtc = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(invoice.annualCtc || 0);

  const issueDateFormatted = new Date(invoice.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const joinedDateFormatted = new Date(invoice.joinedDate || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const dueDateFormatted = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "30 Days from Joining";

  // WhatsApp Message Text
  const targetPhone = invoice.contactPhone || invoice.partner?.contactPhone || "";
  const cleanPhone = targetPhone.replace(/\D/g, "");
  const whatsappPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const whatsappMessage = `*SOFTLAB GLOBAL — CORPORATE STAFFING TAX INVOICE*
----------------------------------------
*Invoice No:* ${invoice.invoiceNumber}
*Billed To:* ${invoice.companyName}
*Candidate Placed:* ${invoice.candidateName}
*Designation:* ${invoice.position}
*Date of Joining:* ${joinedDateFormatted}
*Annual CTC:* ${formattedCtc}
*Empanelment Fee (${invoice.feePercentage}%):* ${formattedBaseAmount}
*GST (18% - SAC 998512):* ${formattedTaxAmount}
----------------------------------------
*GRAND TOTAL PAYABLE:* ${formattedGrandTotal}
*Payment Terms:* Due by ${dueDateFormatted}
----------------------------------------
*Bank Transfer Details:*
Bank: HDFC Bank
A/C Name: SoftLab Global
A/C No: 50200089123456
IFSC: HDFC0000211
UPI: softlabglobal@upi
Authorized Signatory: ${invoice.authorizedBy || "Harsh Shukla"}
SoftLab Global Placement & Corporate Relations`;

  const whatsappUrl = `https://api.whatsapp.com/send?${
    whatsappPhone ? `phone=${whatsappPhone}&` : ""
  }text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:bg-white print:rounded-none">
        {/* ===================================================================== */}
        {/* TOP TOOLBAR (Hidden in Print)                                         */}
        {/* ===================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-950 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                GST Tax Invoice &middot; Staffing Fulfillment
              </p>
              <p className="text-[11px] font-mono text-cyan-400">{invoice.invoiceNumber}</p>
            </div>
            <span
              className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                invoice.status === "PAID"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                  : "bg-amber-950 text-amber-400 border border-amber-500/40"
              }`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Print Action */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print / PDF</span>
            </button>

            {/* WhatsApp Send Action */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
              title="Send invoice breakdown directly on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp Recruiter</span>
            </a>

            {/* Email Dispatch Action */}
            <button
              type="button"
              disabled={isSendingEmail || dispatchEmailMutation.isPending}
              onClick={() => {
                setIsSendingEmail(true);
                dispatchEmailMutation.mutate({ invoiceId: invoice.id });
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow disabled:opacity-50"
              title="Dispatch official Tax Invoice via Email"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isSendingEmail ? "Sending..." : "Email Invoice"}</span>
            </button>

            {/* Mark as Paid Action */}
            {invoice.status !== "PAID" && (
              <button
                type="button"
                onClick={() => setShowMarkPaidModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 transition shadow"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Mark Paid</span>
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {emailStatus && (
          <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{emailStatus}</span>
          </div>
        )}

        {/* ===================================================================== */}
        {/* OFFICIAL TAX INVOICE CONTENT (Print-optimized)                       */}
        {/* ===================================================================== */}
        <div className="p-8 sm:p-12 text-slate-100 bg-slate-900 print:text-black print:bg-white print:p-0">
          {/* 1. HEADER SECTION */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-800 print:border-gray-300">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 bg-white rounded-xl p-1 shadow-sm flex items-center justify-center">
                  <Image
                    src="/images/logo.png"
                    alt="SoftLab Global"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white print:text-black tracking-tight">
                    SOFTLAB GLOBAL
                  </h1>
                  <p className="text-[11px] font-bold text-cyan-400 print:text-blue-800 tracking-wider uppercase">
                    Learn Today &middot; Code Tomorrow &middot; Lead The Future
                  </p>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-400 print:text-gray-600 space-y-0.5 leading-relaxed">
                <p className="font-semibold text-slate-300 print:text-gray-900">
                  SoftLab Global Technologies &amp; Skillverse Pvt. Ltd.
                </p>
                <p>4th Floor, 211/C/59, Tata Motors Building, M.G. Road, Civil Lines,</p>
                <p>Prayagraj, Uttar Pradesh - 211011, India.</p>
                <p>
                  <strong>GSTIN:</strong> 09AAECS8989M1Z5 &middot; <strong>PAN:</strong> AAECS8989M &middot;{" "}
                  <strong>SAC:</strong> 998512
                </p>
                <p>
                  <strong>Email:</strong> info@softlabglobal.com &middot; <strong>Phone:</strong> +91 9196596975
                </p>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="inline-block px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 print:bg-gray-100 print:border-gray-300 print:text-black text-xs font-black uppercase tracking-wider">
                TAX INVOICE
              </div>
              <p className="text-lg font-mono font-black text-white print:text-black pt-1">
                {invoice.invoiceNumber}
              </p>
              <p className="text-xs text-slate-400 print:text-gray-600">
                <strong>Invoice Date:</strong> {issueDateFormatted}
              </p>
              <p className="text-xs text-slate-400 print:text-gray-600">
                <strong>Due Date:</strong> {dueDateFormatted}
              </p>
              <p className="text-xs text-slate-400 print:text-gray-600">
                <strong>Service Category:</strong> Manpower Recruitment &amp; Staffing
              </p>
            </div>
          </div>

          {/* 2. BILLED TO & PLACEMENT DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-800 print:border-gray-300 text-xs">
            {/* Client Details */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 print:border-gray-300 print:bg-gray-50 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-400 print:text-blue-700">
                <Building2 className="w-3.5 h-3.5" />
                <span>Billed To (Corporate Partner):</span>
              </div>
              <p className="text-sm font-black text-white print:text-black">{invoice.companyName}</p>
              {invoice.contactPerson && (
                <p className="text-slate-300 print:text-gray-800">
                  <strong>Attn:</strong> {invoice.contactPerson}
                </p>
              )}
              {invoice.contactEmail && (
                <p className="text-slate-400 print:text-gray-600 font-mono">
                  <strong>Email:</strong> {invoice.contactEmail}
                </p>
              )}
              {invoice.contactPhone && (
                <p className="text-slate-400 print:text-gray-600">
                  <strong>Phone:</strong> {invoice.contactPhone}
                </p>
              )}
              {invoice.companyAddress && (
                <p className="text-slate-400 print:text-gray-600">{invoice.companyAddress}</p>
              )}
              <p className="text-slate-400 print:text-gray-600">
                <strong>State:</strong> {invoice.companyState || "Uttar Pradesh"} (State Code: 09)
              </p>
              {invoice.companyGst && (
                <p className="text-slate-300 print:text-gray-800 font-mono font-semibold">
                  <strong>Client GSTIN:</strong> {invoice.companyGst}
                </p>
              )}
            </div>

            {/* Candidate Placement Fulfillment Details */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 print:border-gray-300 print:bg-gray-50 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-400 print:text-green-700">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Placement Fulfillment Particulars:</span>
              </div>
              <p className="text-sm font-black text-white print:text-black">{invoice.candidateName}</p>
              <p className="text-slate-300 print:text-gray-800">
                <strong>Hired Role:</strong> {invoice.position}
              </p>
              <p className="text-slate-400 print:text-gray-600">
                <strong>Date of Joining:</strong> {joinedDateFormatted}
              </p>
              <p className="text-slate-400 print:text-gray-600">
                <strong>Confirmed Annual CTC:</strong> {formattedCtc}
              </p>
              <p className="text-slate-400 print:text-gray-600">
                <strong>Agreed Empanelment Fee Rate:</strong> {invoice.feePercentage}% of Annual CTC
              </p>
              <p className="text-slate-400 print:text-gray-600">
                <strong>Replacement Guarantee:</strong> 90 Days Free Candidate Replacement
              </p>
            </div>
          </div>

          {/* 3. ITEM TABLE */}
          <div className="py-6 border-b border-slate-800 print:border-gray-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 print:border-gray-300 text-slate-400 print:text-gray-700 uppercase font-bold text-[11px]">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Service Description</th>
                    <th className="py-2.5 px-3">SAC Code</th>
                    <th className="py-2.5 px-3 text-right">Annual CTC</th>
                    <th className="py-2.5 px-3 text-right">Fee Rate</th>
                    <th className="py-2.5 px-3 text-right">Taxable Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200 text-slate-300 print:text-gray-800">
                  <tr>
                    <td className="py-3 px-3 font-mono">1</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-white print:text-black">
                        Talent Acquisition &amp; Manpower Staffing Services
                      </p>
                      <p className="text-[11px] text-slate-400 print:text-gray-600">
                        Placement fulfillment for candidate <strong>{invoice.candidateName}</strong> designated as{" "}
                        <strong>{invoice.position}</strong> at {invoice.companyName}.
                      </p>
                    </td>
                    <td className="py-3 px-3 font-mono">{invoice.sacCode || "998512"}</td>
                    <td className="py-3 px-3 text-right font-mono">{formattedCtc}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-cyan-400 print:text-black">
                      {invoice.feePercentage}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white print:text-black">
                      {formattedBaseAmount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 text-xs">
              <div className="sm:max-w-md space-y-2">
                <p className="text-slate-400 print:text-gray-600">
                  <strong>Amount in Words:</strong>
                </p>
                <p className="font-bold text-slate-200 print:text-black italic bg-slate-950/60 print:bg-gray-100 p-2.5 rounded-xl border border-slate-800 print:border-gray-200">
                  {numberToWordsINR(invoice.grandTotal)}
                </p>

                {invoice.notes && (
                  <p className="text-[11px] text-slate-400 print:text-gray-600 pt-1">
                    <strong>Commercial Notes:</strong> {invoice.notes}
                  </p>
                )}
              </div>

              <div className="w-full sm:w-72 space-y-1.5 font-mono">
                <div className="flex justify-between py-1 text-slate-400 print:text-gray-600">
                  <span>Subtotal (Taxable Value):</span>
                  <span className="font-bold text-white print:text-black">{formattedBaseAmount}</span>
                </div>

                {invoice.cgstAmount > 0 ? (
                  <>
                    <div className="flex justify-between py-1 text-slate-400 print:text-gray-600">
                      <span>CGST @ 9%:</span>
                      <span>
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 0,
                        }).format(invoice.cgstAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-400 print:text-gray-600">
                      <span>SGST @ 9%:</span>
                      <span>
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 0,
                        }).format(invoice.sgstAmount)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1 text-slate-400 print:text-gray-600">
                    <span>IGST @ 18%:</span>
                    <span>{formattedTaxAmount}</span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-t border-slate-800 print:border-gray-300 text-sm font-black text-emerald-400 print:text-black">
                  <span>Grand Total Payable:</span>
                  <span>{formattedGrandTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. BANK REMITTANCE & TERMS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 text-xs leading-relaxed">
            {/* Bank details */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 print:border-gray-300 print:bg-gray-50 space-y-1 font-mono">
              <p className="font-bold uppercase tracking-wider text-cyan-400 print:text-blue-800 font-sans text-[11px]">
                Official Remittance Bank Account
              </p>
              <p className="text-white print:text-black">
                <strong>Beneficiary:</strong> SOFTLAB GLOBAL
              </p>
              <p className="text-slate-300 print:text-gray-800">
                <strong>Bank Name:</strong> HDFC Bank Ltd.
              </p>
              <p className="text-slate-300 print:text-gray-800">
                <strong>Account No:</strong> 50200089123456
              </p>
              <p className="text-slate-300 print:text-gray-800">
                <strong>IFSC Code:</strong> HDFC0000211
              </p>
              <p className="text-slate-400 print:text-gray-600">
                <strong>Branch:</strong> Civil Lines, Prayagraj, UP
              </p>
              <p className="text-emerald-400 print:text-green-800 font-bold">
                <strong>UPI VPA:</strong> softlabglobal@upi
              </p>
            </div>

            {/* Authorized Signatory */}
            <div className="flex flex-col justify-between text-right p-4 rounded-2xl bg-slate-950/60 border border-slate-800 print:border-gray-300 print:bg-gray-50">
              <div className="text-[11px] text-slate-400 print:text-gray-600 text-left">
                <p className="font-bold uppercase tracking-wider text-slate-300 print:text-black">
                  Empanelment Terms:
                </p>
                <p>1. Payment is due within 30 days of candidate joining date.</p>
                <p>2. 90-day candidate replacement guarantee applies per contract.</p>
                <p>3. This is a computer-generated tax invoice with verified digital signatory.</p>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-800/60 print:border-gray-300">
                <p className="text-[11px] font-serif italic text-cyan-300 print:text-blue-900">
                  {invoice.authorizedBy || "Harsh Shukla"}
                </p>
                <p className="text-xs font-black text-white print:text-black">
                  {invoice.authorizedBy || "Harsh Shukla"}
                </p>
                <p className="text-[10px] text-slate-400 print:text-gray-600 font-semibold uppercase tracking-wider">
                  Authorized Signatory &middot; SoftLab Global
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* MARK AS PAID MODAL SUB-VIEW                                          */}
        {/* ===================================================================== */}
        {showMarkPaidModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Record Corporate Payment</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMarkPaidModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2">
                <p>
                  You are marking Invoice <strong>{invoice.invoiceNumber}</strong> for{" "}
                  <strong>{invoice.companyName}</strong> as <strong>PAID</strong>.
                </p>
                <p className="font-mono text-emerald-400 font-bold text-sm">Amount: {formattedGrandTotal}</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="NEFT">NEFT Bank Transfer</option>
                    <option value="RTGS">RTGS Bank Transfer</option>
                    <option value="IMPS">IMPS Instant Transfer</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="CHEQUE">Corporate Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Bank UTR / Transaction Reference *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. HDFC000021124895"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMarkPaidModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!transactionRef.trim() || updateStatusMutation.isPending}
                  onClick={() => {
                    updateStatusMutation.mutate({
                      invoiceId: invoice.id,
                      status: "PAID",
                      paymentMode,
                      transactionRef: transactionRef.trim(),
                    });
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black disabled:opacity-50"
                >
                  {updateStatusMutation.isPending ? "Recording..." : "Confirm & Mark Paid"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
