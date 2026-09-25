"use client";

import React, { useState, useRef, useEffect } from "react";
import { Printer, Edit3, Check, RotateCcw, X, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rupeesToWords } from "@/lib/utils";
import { api } from "@/lib/trpc/react";

export interface DualReceiptData {
  receiptNumber: string;
  receiptDate: string | Date;
  studentName: string;
  studentId: string;
  admissionNumber?: string;
  courseTitle: string;
  batchCode?: string;
  totalFee: number; // in Paise or Rupees
  discountAmount: number; // in Paise or Rupees
  netPayable: number; // in Paise or Rupees
  amountPaid: number; // in Paise or Rupees
  pendingAmount: number; // in Paise or Rupees
  amountInWords?: string;
  paymentMode?: string;
  transactionReference?: string;
  status?: string;
  centerName?: string;
  centerAddress?: string;
  gstNo?: string;
  particulars?: string;
  registrationPayment?: number;
  registrationFee?: number;
  examinationFee?: number;
  universityFee?: number;
  providerType?: string;
  providerName?: string;
  universityName?: string;
  universityProgram?: string;
  universitySpecialization?: string;
  feeStructureId?: string;
  paymentId?: string;
}

interface DualFeeReceiptProps {
  data: DualReceiptData;
  onClose?: () => void;
  onSaved?: () => void;
}

export function DualFeeReceipt({ data, onClose, onSaved }: DualFeeReceiptProps) {
  // Robust detection of Paise vs Rupees:
  // In the SoftLab LMS database, all payment & fee amounts are stored in Paise (integers: e.g. 1500000 = ₹15,000, 4500000 = ₹45,000).
  // All course fees are <= ₹2,10,000 (21000000 paise).
  // If totalFee >= 500000 or amountPaid >= 500000 or netPayable >= 500000, the data is in Paise.
  const isPaise = Boolean(
    (data.totalFee && data.totalFee >= 500000) ||
    (data.amountPaid && data.amountPaid >= 500000) ||
    (data.netPayable && data.netPayable >= 500000)
  );

  const toRupees = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return 0;
    return isPaise ? Math.floor(val / 100) : Math.floor(val);
  };

  const defaultAddress =
    "Address: Patrika Chauraha, 13/11/8G, Tashkent Marg, Opposite Rai and Company, Civil Lines, Prayagraj, Uttar Pradesh 211001";
  const defaultGst = "09AFYFS5388G1ZX";

  const sanitizedAddress =
    data.centerAddress && !data.centerAddress.toLowerCase().includes("noida")
      ? data.centerAddress
      : defaultAddress;

  const sanitizedGst =
    data.gstNo && !data.gstNo.includes("1429B1Z")
      ? data.gstNo
      : defaultGst;

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable form fields
  const [receiptNumber, setReceiptNumber] = useState(data.receiptNumber || "SLG-2026-306281");
  const [receiptDate, setReceiptDate] = useState(() => {
    try {
      if (!data.receiptDate) return "15-06-2026";
      const d = new Date(data.receiptDate);
      return isNaN(d.getTime())
        ? "15-06-2026"
        : d
            .toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            .replace(/\//g, "-");
    } catch {
      return "15-06-2026";
    }
  });

  const [studentName, setStudentName] = useState(data.studentName || "Student");
  const [studentId, setStudentId] = useState(data.studentId || data.admissionNumber || "SG-2026-00005");
  const [courseTitle, setCourseTitle] = useState(data.courseTitle || "Technical Support Engineer");
  const [centerName, setCenterName] = useState(data.centerName || "SOFTLAB GLOBAL PRAYAGRAJ CENTRE");
  const [centerAddress, setCenterAddress] = useState(sanitizedAddress);
  const [gstNo, setGstNo] = useState(sanitizedGst);

  const [particulars, setParticulars] = useState(data.particulars || "Registration/Enrollment Payment");
  const [registrationPayment, setRegistrationPayment] = useState<number>(
    data.registrationPayment ? toRupees(data.registrationPayment) : 0
  );

  const [totalFees, setTotalFees] = useState<number>(toRupees(data.totalFee || 45000));
  const [totalDiscount, setTotalDiscount] = useState<number>(toRupees(data.discountAmount || 0));
  const [totalPaid, setTotalPaid] = useState<number>(toRupees(data.amountPaid || 10000));
  const [totalOutstanding, setTotalOutstanding] = useState<number>(
    toRupees(
      data.pendingAmount ||
        Math.max(
          0,
          toRupees(data.totalFee || 45000) -
            toRupees(data.discountAmount || 0) -
            toRupees(data.amountPaid || 10000)
        )
    )
  );

  const [paymentMode, setPaymentMode] = useState(
    data.paymentMode ? `${data.paymentMode} ${data.transactionReference || ""}`.trim() : "Cash"
  );
  const [status, setStatus] = useState(data.status || "Completed");
  const [customWords, setCustomWords] = useState<string>("");

  // Recalculate pending & words when fees change
  const netPayableRupees = Math.max(0, totalFees - totalDiscount);
  const computedWords = customWords.trim() || rupeesToWords(totalPaid);

  const handleTotalFeesChange = (val: number) => {
    setTotalFees(val);
    const newPending = Math.max(0, val - totalDiscount - totalPaid);
    setTotalOutstanding(newPending);
  };

  const handleDiscountChange = (val: number) => {
    setTotalDiscount(val);
    const newPending = Math.max(0, totalFees - val - totalPaid);
    setTotalOutstanding(newPending);
  };

  const handlePaidChange = (val: number) => {
    setTotalPaid(val);
    const newPending = Math.max(0, totalFees - totalDiscount - val);
    setTotalOutstanding(newPending);
    setCustomWords(""); // re-trigger auto word generation
  };

  const utils = api.useUtils();

  const updateFeeMutation = api.finance.updateFeeStructure.useMutation();
  const updatePaymentMutation = api.finance.updatePayment.useMutation();

  const handleSaveToDatabase = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      if (data.feeStructureId) {
        await updateFeeMutation.mutateAsync({
          feeStructureId: data.feeStructureId,
          totalCourseFee: totalFees * 100,
          discountAmount: totalDiscount * 100,
          remarks: `Receipt No: ${receiptNumber} | Mode: ${paymentMode}`,
        });
      }
      if (data.paymentId) {
        await updatePaymentMutation.mutateAsync({
          paymentId: data.paymentId,
          amount: totalPaid * 100,
          receiptNumber: receiptNumber.trim() || undefined,
          providerReference: paymentMode.trim() || undefined,
          remarks: `Fee Receipt: ${receiptNumber}`,
        });
      }
      utils.finance.listFeeStructures.invalidate();
      utils.finance.listPayments.invalidate();
      utils.finance.getOverviewMetrics.invalidate();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onSaved) onSaved();
    } catch (err: any) {
      setSaveError(err.message || "Failed to sync changes to database.");
    }
  };

  const printRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    const el = printRef.current;
    if (!el) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      alert("Please allow popups for this site to print receipts.");
      return;
    }

    const innerHtml = el.innerHTML;
    printWindow.document.open();
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Fee Receipt – ${receiptNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 5mm 6mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; background: #fff;
      font-family: Arial, sans-serif;
      font-size: 13px;
      width: 100%;
    }

    /* ── WRAPPER: fills full page width ── */
    .a4-receipt-wrapper {
      width: 100% !important;
      max-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      box-shadow: none !important;
      background: #fff !important;
      display: block !important;
    }

    /* ── EACH COPY: half the A4 height ── */
    .single-receipt-copy {
      border: 2px solid #000 !important;
      background: #fff !important;
      color: #000 !important;
      padding: 8px 10px !important;
      font-size: 13px !important;
      line-height: 1.35 !important;
      display: block !important;
      width: 100% !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* ── CUT LINE ── */
    .cut-section-divider {
      position: relative !important;
      margin: 6px 0 !important;
      text-align: center !important;
      page-break-before: avoid !important;
      break-before: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      display: block !important;
    }
    .cut-section-divider span {
      position: absolute !important;
      top: -9px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      background: #fff !important;
      padding: 0 8px !important;
      font-size: 12px !important;
      font-weight: bold !important;
      white-space: nowrap !important;
    }

    /* ── TABLE ── */
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 3px 5px; font-size: 12px; }
    thead tr { border-bottom: 2px solid #000; }

    /* ── IMAGES ── */
    img { max-height: 48px; object-fit: contain; }

    /* ── LAYOUT UTILITIES ── */
    .grid { display: grid !important; }
    .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
    .col-span-3 { grid-column: span 3 / span 3 !important; }
    .col-span-6 { grid-column: span 6 / span 6 !important; }
    .flex { display: flex !important; }
    .flex-col { flex-direction: column !important; }
    .flex-1 { flex: 1 1 0% !important; }
    .flex-wrap { flex-wrap: wrap !important; }
    .items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .justify-center { justify-content: center !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-end { justify-content: flex-end !important; }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .text-left { text-align: left !important; }
    .font-bold { font-weight: bold !important; }
    .font-extrabold { font-weight: 800 !important; }
    .font-semibold { font-weight: 600 !important; }
    .font-medium { font-weight: 500 !important; }
    .font-mono { font-family: monospace !important; }
    .font-black { font-weight: 900 !important; }
    .italic { font-style: italic !important; }
    .uppercase { text-transform: uppercase !important; }
    .tracking-tight { letter-spacing: -0.025em !important; }
    .tracking-widest { letter-spacing: 0.1em !important; }
    .tracking-wide { letter-spacing: 0.025em !important; }

    /* ── BORDERS ── */
    .border-2 { border: 2px solid #000 !important; }
    .border { border: 1px solid #000 !important; }
    .border-black { border-color: #000 !important; }
    .border-collapse { border-collapse: collapse !important; }
    .border-r { border-right: 1px solid #000 !important; }
    .border-r-2 { border-right: 2px solid #000 !important; }
    .border-b { border-bottom: 1px solid #000 !important; }
    .border-b-2 { border-bottom: 2px solid #000 !important; }
    .border-t-2 { border-top: 2px solid #000 !important; }
    .border-dashed { border-style: dashed !important; }

    /* ── SPACING ── */
    .p-1 { padding: 4px !important; }
    .p-2 { padding: 8px !important; }
    .p-3 { padding: 12px !important; }
    .p-0\\.5 { padding: 2px !important; }
    .p-0\\.5 { padding: 2px !important; }
    .p-1\\.5 { padding: 6px !important; }
    .px-2 { padding-left: 8px !important; padding-right: 8px !important; }
    .px-3 { padding-left: 12px !important; padding-right: 12px !important; }
    .pr-2 { padding-right: 8px !important; }
    .pl-0 { padding-left: 0 !important; }
    .mb-1 { margin-bottom: 4px !important; }
    .mb-1\\.5 { margin-bottom: 6px !important; }
    .mb-1 { margin-bottom: 4px !important; }
    .mt-0\\.5 { margin-top: 2px !important; }
    .mt-1 { margin-top: 4px !important; }
    .gap-1 { gap: 4px !important; }
    .gap-2 { gap: 8px !important; }

    /* ── LINE HEIGHT ── */
    .leading-none { line-height: 1 !important; }
    .leading-snug { line-height: 1.375 !important; }
    .leading-tight { line-height: 1.25 !important; }
    .shrink-0 { flex-shrink: 0 !important; }
    .space-y-0\\.5 > * + * { margin-top: 2px !important; }

    /* ── SIZING ── */
    .w-full { width: 100% !important; }
    .w-48 { width: 192px !important; }
    .h-10 { height: 40px !important; }
    .h-5 { height: 20px !important; }
    .h-6 { height: 24px !important; }

    /* ── FONT SIZE OVERRIDES: bump ALL sizes up by ~25% ── */
    .text-\\[7\\.5px\\], [class*="text-[7"] { font-size: 9px !important; }
    .text-\\[8\\.5px\\], [class*="text-[8"] { font-size: 10px !important; }
    .text-\\[9px\\]   { font-size: 11px !important; }
    .text-\\[9\\.5px\\]{ font-size: 11.5px !important; }
    .text-\\[10px\\]  { font-size: 12px !important; }
    .text-\\[10\\.5px\\]{ font-size: 13px !important; }
    .text-\\[11px\\]  { font-size: 13.5px !important; }
    .text-\\[12\\.5px\\]{ font-size: 15px !important; }
    .text-\\[13px\\]  { font-size: 16px !important; }
    .text-xs  { font-size: 11px !important; }
    .text-sm  { font-size: 13px !important; }

    /* ── COLORS ── */
    .text-rose-700 { color: #b91c1c !important; }
    .text-emerald-800 { color: #065f46 !important; }
    .text-slate-500 { color: #64748b !important; }
    .text-slate-700 { color: #334155 !important; }
    .text-slate-800 { color: #1e293b !important; }
    .text-slate-900 { color: #0f172a !important; }
    .text-black { color: #000 !important; }
    .text-\\[\\#0088cc\\] { color: #0088cc !important; }
    .bg-white { background-color: #ffffff !important; }
    .select-text { user-select: text !important; }
    .box-border { box-sizing: border-box !important; }
    .relative { position: relative !important; }
    .absolute { position: absolute !important; }
    .underline { text-decoration: underline !important; }
    .colSpan-3 { colspan: 3; }
  </style>
</head>
<body>
${innerHtml}
</body>
</html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 700);
  };


  const renderSingleReceipt = (copyTitle: "Student Copy" | "Center Copy") => (
    <div
      className="single-receipt-copy border-2 border-black bg-white text-black p-2.5 sm:p-3 flex flex-col justify-between box-border text-[10.5px] leading-tight select-text shrink-0 print:p-2.5"
      style={{
        boxSizing: "border-box",
      }}
    >
      {/* Header section matching uploaded PDF reference */}
      <div className="grid grid-cols-12 border-2 border-black mb-1.5 shrink-0">
        {/* Logo column */}
        <div className="col-span-3 border-r-2 border-black p-2 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2">
            {/* SoftLab Global Official Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/softlab-logo.png"
              alt="SOFTLAB GLOBAL"
              className="h-10 w-10 object-contain shrink-0"
            />
            <div className="text-left">
              <span className="block font-black text-[#0088cc] leading-none text-[13px] tracking-tight">SOFTLAB</span>
              <span className="block font-bold text-slate-900 text-[9.5px] tracking-widest uppercase">GLOBAL</span>
            </div>
          </div>
          <span className="text-[7.5px] font-semibold text-slate-500 uppercase mt-1 tracking-tight">Center for Excellence</span>
        </div>

        {/* Center column: Centre name, address, GST */}
        <div className="col-span-6 border-r-2 border-black p-2 text-center flex flex-col justify-center">
          {isEditing ? (
            <div className="space-y-1">
              <Input
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                className="h-6 text-[11px] font-bold text-center p-1 bg-white border-black"
              />
              <textarea
                value={centerAddress}
                onChange={(e) => setCenterAddress(e.target.value)}
                className="w-full text-[9px] border border-black p-1 rounded resize-none bg-white"
                rows={2}
              />
              <div className="flex items-center justify-center gap-1">
                <span className="text-[10px] font-bold">Gst No:</span>
                <Input
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  className="h-5 text-[10px] w-36 font-mono p-1 bg-white border-black"
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-extrabold text-[12.5px] text-black tracking-tight">{centerName}</h2>
              <p className="text-[9px] text-black mt-0.5 leading-snug px-2">{centerAddress}</p>
              <p className="text-[9.5px] font-bold text-black mt-0.5 font-mono">Gst No: {gstNo}</p>
            </>
          )}
        </div>

        {/* Right column: Invoice/Receipt No, Date, Copy Name */}
        <div className="col-span-3 p-2 flex flex-col justify-between text-right text-[10.5px]">
          <div>
            <div className="flex justify-end gap-1">
              <span className="font-semibold text-slate-700">Invoice/Receipt No:</span>
              {isEditing ? (
                <Input
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="h-5 text-[10.5px] font-mono font-bold w-28 p-0.5 text-right inline-block bg-white border-black"
                />
              ) : (
                <span className="font-bold font-mono">{receiptNumber}</span>
              )}
            </div>
            <div className="flex justify-end gap-1 mt-0.5">
              <span className="font-semibold text-slate-700">Receipt Date:</span>
              {isEditing ? (
                <Input
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="h-5 text-[10.5px] font-mono font-bold w-24 p-0.5 text-right inline-block bg-white border-black"
                />
              ) : (
                <span className="font-bold">{receiptDate}</span>
              )}
            </div>
          </div>
          <div className="mt-1 text-right">
            <span className="font-bold text-[11px] underline tracking-wide uppercase">{copyTitle}</span>
          </div>
        </div>
      </div>

      {/* Student Details Bar */}
      <div className="border-2 border-black p-1.5 mb-1.5 bg-white shrink-0">
        <div className="flex flex-wrap justify-between items-center text-[11px] mb-1">
          <div className="flex items-center gap-1">
            <span className="font-bold">Student Name -</span>
            {isEditing ? (
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="h-5 text-[11px] font-bold w-48 p-0.5 bg-white border-black"
              />
            ) : (
              <span className="font-extrabold">{studentName}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">REG/ENRNo:</span>
            {isEditing ? (
              <Input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="h-5 text-[11px] font-mono font-bold w-36 p-0.5 bg-white border-black"
              />
            ) : (
              <span className="font-mono font-bold">{studentId}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="font-bold">Course:</span>
          {isEditing ? (
            <Input
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="h-5 text-[11px] font-bold flex-1 p-0.5 bg-white border-black"
            />
          ) : (
            <span className="font-semibold">{courseTitle}</span>
          )}
        </div>
      </div>

      {/* Main Breakdown Table matching the exact layout of the PDF */}
      <table className="w-full border-collapse border-2 border-black text-[10px] text-center mb-1.5 shrink-0">
        <thead>
          <tr className="border-b-2 border-black font-bold h-6">
            <th className="border-r border-black p-1 w-6">#</th>
            <th className="border-r border-black p-1 text-left">Particulars</th>
            <th className="border-r border-black p-1 w-10">SAC</th>
            <th className="border-r border-black p-1 w-10">CGST</th>
            <th className="border-r border-black p-1 w-10">CGST</th>
            <th className="border-r border-black p-1 w-12">scst/</th>
            <th className="border-r border-black p-1 w-10">IGST</th>
            <th className="border-r border-black p-1 w-10">IGST</th>
            <th className="p-1 w-28 text-right pr-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {/* Row 1: Registration/Enrollment Payment */}
          <tr className="border-b border-black h-5">
            <td className="border-r border-black p-0.5">1</td>
            <td className="border-r border-black p-0.5 text-left font-medium">
              {isEditing ? (
                <Input
                  value={particulars}
                  onChange={(e) => setParticulars(e.target.value)}
                  className="h-4 text-[9.5px] p-0.5 border-none bg-white"
                />
              ) : (
                particulars
              )}
            </td>
            <td className="border-r border-black p-0.5">-</td>
            <td className="border-r border-black p-0.5">0</td>
            <td className="border-r border-black p-0.5">0</td>
            <td className="border-r border-black p-0.5">0</td>
            <td className="border-r border-black p-0.5">0</td>
            <td className="border-r border-black p-0.5">0</td>
            <td className="p-0.5 text-right pr-2 font-mono">
              {isEditing ? (
                <Input
                  type="number"
                  value={registrationPayment}
                  onChange={(e) => setRegistrationPayment(parseFloat(e.target.value) || 0)}
                  className="h-4 text-[9.5px] font-mono text-right p-0.5 w-20 ml-auto bg-white border-black"
                />
              ) : registrationPayment > 0 ? (
                registrationPayment.toLocaleString("en-IN") + ".00/-"
              ) : (
                "0"
              )}
            </td>
          </tr>

          {/* Row 2: Empty Spacer */}
          <tr className="border-b border-black h-5">
            <td className="border-r border-black p-0.5">2</td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="p-0.5"></td>
          </tr>

          {/* Row 3: Total Amount Before */}
          <tr className="border-b border-black h-5">
            <td className="border-r border-black p-0.5">3</td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td colSpan={3} className="border-r border-black p-0.5 text-right font-semibold pr-2">
              Total Amount Before
            </td>
            <td className="p-0.5 text-right pr-2 font-mono font-bold">
              {totalPaid.toLocaleString("en-IN")}.00/-
            </td>
          </tr>

          {/* Row 4: Empty */}
          <tr className="border-b border-black h-5">
            <td className="border-r border-black p-0.5">4</td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="border-r border-black p-0.5"></td>
            <td className="p-0.5 text-right pr-2 font-mono">0</td>
          </tr>

          {/* Row 5: Total Fees & SGST */}
          <tr className="border-b border-black h-5">
            <td className="border-r border-black p-0.5">5</td>
            <td className="border-r border-black p-0.5 text-left font-bold px-2">
              Total Fees
            </td>
            <td className="border-r border-black p-0.5 font-bold font-mono" colSpan={3}>
              {isEditing ? (
                <Input
                  type="number"
                  value={totalFees}
                  onChange={(e) => handleTotalFeesChange(parseFloat(e.target.value) || 0)}
                  className="h-4 text-[9.5px] font-mono text-center p-0.5 w-24 mx-auto font-bold bg-white border-black"
                />
              ) : (
                totalFees.toLocaleString("en-IN")
              )}
            </td>
            <td colSpan={3} className="border-r border-black p-0.5 text-right font-semibold pr-2">
              Add SGST/UTGST
            </td>
            <td className="p-0.5 text-right pr-2 font-mono">0</td>
          </tr>

          {/* Row 7: Total Discount & GST */}
          <tr className="border-b border-black h-5">
            <td className="border-r border-black p-0.5">7</td>
            <td className="border-r border-black p-0.5 text-left font-bold px-2">
              Total Discount
            </td>
            <td className="border-r border-black p-0.5 font-bold font-mono" colSpan={3}>
              {isEditing ? (
                <Input
                  type="number"
                  value={totalDiscount}
                  onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                  className="h-4 text-[9.5px] font-mono text-center p-0.5 w-24 mx-auto font-bold bg-white border-black"
                />
              ) : (
                totalDiscount.toLocaleString("en-IN")
              )}
            </td>
            <td colSpan={3} className="border-r border-black p-0.5 text-right font-semibold pr-2">
              Total Amount GST
            </td>
            <td className="p-0.5 text-right pr-2 font-mono">0</td>
          </tr>

          {/* Row 6: Total Paid & IGST */}
          <tr className="border-b border-black h-5">
            <td className="border-r border-black p-0.5">6</td>
            <td className="border-r border-black p-0.5 text-left font-bold px-2">
              Total Paid
            </td>
            <td className="border-r border-black p-0.5 font-bold font-mono text-emerald-800" colSpan={3}>
              {isEditing ? (
                <Input
                  type="number"
                  value={totalPaid}
                  onChange={(e) => handlePaidChange(parseFloat(e.target.value) || 0)}
                  className="h-4 text-[9.5px] font-mono text-center p-0.5 w-24 mx-auto font-bold text-emerald-800 bg-white border-black"
                />
              ) : (
                totalPaid.toLocaleString("en-IN")
              )}
            </td>
            <td colSpan={3} className="border-r border-black p-0.5 text-right font-semibold pr-2">
              Add IGST
            </td>
            <td className="p-0.5 text-right pr-2 font-mono">0</td>
          </tr>

          {/* Row 8: Total Outstanding & Total Amount After Tax */}
          <tr className="border-b border-black font-bold h-5">
            <td className="border-r border-black p-0.5">8</td>
            <td className="border-r border-black p-0.5 text-left font-bold px-2 text-rose-700">
              Total Outstanding
            </td>
            <td className="border-r border-black p-0.5 font-bold font-mono text-rose-700" colSpan={3}>
              {isEditing ? (
                <Input
                  type="number"
                  value={totalOutstanding}
                  onChange={(e) => setTotalOutstanding(parseFloat(e.target.value) || 0)}
                  className="h-4 text-[9.5px] font-mono text-center p-0.5 w-24 mx-auto font-bold text-rose-700 bg-white border-black"
                />
              ) : (
                totalOutstanding.toLocaleString("en-IN")
              )}
            </td>
            <td colSpan={3} className="border-r border-black p-0.5 text-right font-bold pr-2">
              Total Amount After Tax
            </td>
            <td className="p-0.5 text-right pr-2 font-mono font-black text-black">
              {totalPaid.toLocaleString("en-IN")}.00/-
            </td>
          </tr>
        </tbody>
      </table>

      {/* Words, Status, Paid By, & Disclaimers */}
      <div className="border-2 border-black text-[10px] bg-white shrink-0">
        {/* Amount in words & Status row */}
        <div className="flex border-b border-black">
          <div className="flex-1 p-1 border-r border-black flex items-center gap-1">
            <span className="font-bold">Amount in Words:</span>
            {isEditing ? (
              <Input
                value={customWords || computedWords}
                onChange={(e) => setCustomWords(e.target.value)}
                className="h-4 text-[9.5px] font-semibold italic flex-1 p-0.5 bg-white border-black"
              />
            ) : (
              <span className="font-bold italic">{computedWords}</span>
            )}
          </div>
          <div className="w-48 p-1 flex items-center justify-between">
            <span className="font-bold">Status:</span>
            {isEditing ? (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-4 text-[9.5px] font-bold border border-black rounded px-1 bg-white"
              >
                <option value="Completed">Completed</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
              </select>
            ) : (
              <span className="font-bold text-emerald-800">{status}</span>
            )}
          </div>
        </div>

        {/* Paid By & Cancellation notice */}
        <div className="flex border-b border-black">
          <div className="flex-1 p-1 border-r border-black flex items-center gap-1">
            <span className="font-bold">Paid By:</span>
            {isEditing ? (
              <Input
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="h-4 text-[9.5px] font-mono flex-1 p-0.5 bg-white border-black"
              />
            ) : (
              <span className="font-mono">{paymentMode}</span>
            )}
          </div>
          <div className="w-48 p-1 text-center font-bold text-[9.5px] text-slate-800 flex items-center justify-center">
            Receipt is not cancelable
          </div>
        </div>

        {/* Mandatory Refund Policy Statements */}
        <div className="p-1 text-center text-[8.5px] leading-tight text-black space-y-0.5 bg-white">
          <p className="font-medium">
            Please note that there will not be any refund on or Vocational Course Effective immediately
          </p>
          <p className="font-extrabold tracking-tight uppercase">
            NO REFUNDS (In any from-partial/full/conditional) of IT- course fees/registration/booking/ for all COURSES/Admission
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div id="dual-receipt-root" className="w-full bg-white flex flex-col items-center justify-start">
      {/* Global Print & Page Styling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 6mm 7mm;
            }
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
              }
              /* Hide everything on the page first */
              body > * {
                display: none !important;
              }
              /* Un-hide: walk up the ancestor chain to show the receipt */
              body > * #dual-receipt-root,
              #dual-receipt-root {
                display: block !important;
              }
              /* Make all ancestors of dual-receipt-root visible */
              #dual-receipt-root,
              #dual-receipt-root > * {
                display: block !important;
              }
              .print-hidden-toolbar {
                display: none !important;
              }
              .a4-receipt-wrapper {
                display: block !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                background: #ffffff !important;
              }
              .single-receipt-copy {
                display: block !important;
                width: 100% !important;
                background: #ffffff !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                box-sizing: border-box !important;
              }
              .cut-section-divider {
                display: block !important;
                margin: 3px 0 !important;
                page-break-before: avoid !important;
                break-before: avoid !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              table { width: 100% !important; }
            }
          `,
        }}
      />

      {/* Top Controls Bar (hidden during print) */}
      <div className="print-hidden-toolbar w-full max-w-[210mm] flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-300 text-slate-800 p-3 rounded-xl shadow-md mb-4 mt-4">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm tracking-tight text-emerald-700">
            Official A4 Payment Receipt
          </span>
          <span className="text-xs text-slate-600 font-mono font-semibold">({receiptNumber})</span>
          {saveSuccess && (
            <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved & Synced!
            </span>
          )}
          {saveError && (
            <span className="text-xs bg-rose-600 text-white px-2 py-0.5 rounded font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {saveError}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Edit / Preview Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className={`text-xs h-8 gap-1.5 font-bold ${
              isEditing ? "bg-amber-500 text-slate-900 hover:bg-amber-400 border-amber-600" : "bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? "Exit Edit Mode" : "Edit Receipt"}</span>
          </Button>

          {/* Save to DB button if editing */}
          {(data.feeStructureId || data.paymentId) && (
            <Button
              size="sm"
              onClick={handleSaveToDatabase}
              disabled={updateFeeMutation.isPending || updatePaymentMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 font-bold shadow-sm"
              title="Save any edited amounts/dates directly to student profile in database"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {updateFeeMutation.isPending || updatePaymentMutation.isPending
                  ? "Saving..."
                  : "Save to Database"}
              </span>
            </Button>
          )}

          {/* Print Button */}
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 font-bold shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print A4 Receipt (Full Sheet)</span>
          </Button>

          {onClose && (
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="text-slate-700 border-slate-300 hover:bg-slate-100 text-xs h-8 font-semibold"
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {/* A4 Container: Student Copy + CUT + Center Copy */}
      <div
        ref={printRef}
        className="a4-receipt-wrapper bg-white mx-auto w-full max-w-[210mm] p-3 sm:p-5 border border-slate-200 shadow-sm"
        style={{ boxSizing: "border-box" }}
      >
        {/* STUDENT COPY */}
        {renderSingleReceipt("Student Copy")}

        {/* CUT HERE Perforation */}
        <div className="cut-section-divider relative my-3 flex items-center justify-center select-none">
          <div className="w-full border-t-2 border-dashed border-black"></div>
          <span className="absolute bg-white px-3 text-xs text-black flex items-center gap-1 font-bold whitespace-nowrap">
            ✂ ─────────── CUT HERE ─────────── ✂
          </span>
        </div>

        {/* CENTER COPY */}
        {renderSingleReceipt("Center Copy")}
      </div>
    </div>
  );
}
