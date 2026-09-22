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
  // Normalize paise to rupees if >= 100000 or based on netPayable vs totalFee
  // If totalFee > 500000, it's definitely in Paise
  const toRupees = (val: number) => (val > 100000 ? Math.floor(val / 100) : Math.floor(val));

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable form fields
  const [receiptNumber, setReceiptNumber] = useState(data.receiptNumber || "CK-ND-2203");
  const [receiptDate, setReceiptDate] = useState(() => {
    try {
      const d = new Date(data.receiptDate);
      return isNaN(d.getTime()) ? "15-06-2026" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
    } catch {
      return "15-06-2026";
    }
  });

  const [studentName, setStudentName] = useState(data.studentName || "Student");
  const [studentId, setStudentId] = useState(data.studentId || data.admissionNumber || "CK-ENR-PJ-00001");
  const [courseTitle, setCourseTitle] = useState(data.courseTitle || "Professional Training Program");
  const [centerName, setCenterName] = useState(data.centerName || "CloudKing Technical Prayagraj Centre");
  const [centerAddress, setCenterAddress] = useState(
    data.centerAddress ||
      "Address: 3/11/8G, Tashkent Marg, Patrika Chauraha Opposite Rai and Company,Civil Lines, Prayagraj, Uttar Pradesh 211001"
  );
  const [gstNo, setGstNo] = useState(data.gstNo || "09JWDPS2938K1ZQ");

  const [particulars, setParticulars] = useState(data.particulars || "Registration/Enrollment Payment");
  const [registrationPayment, setRegistrationPayment] = useState<number>(data.registrationPayment ? toRupees(data.registrationPayment) : 0);

  const [totalFees, setTotalFees] = useState<number>(toRupees(data.totalFee || 20000));
  const [totalDiscount, setTotalDiscount] = useState<number>(toRupees(data.discountAmount || 0));
  const [totalPaid, setTotalPaid] = useState<number>(toRupees(data.amountPaid || 15000));
  const [totalOutstanding, setTotalOutstanding] = useState<number>(
    toRupees(data.pendingAmount || Math.max(0, toRupees(data.totalFee || 20000) - toRupees(data.discountAmount || 0) - toRupees(data.amountPaid || 15000)))
  );

  const [paymentMode, setPaymentMode] = useState(data.paymentMode ? `${data.paymentMode} ${data.transactionReference || ""}`.trim() : "qr 13 Jun 2026");
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

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const renderSingleReceipt = (copyTitle: "Student Copy" | "Center Copy") => (
    <div className="receipt-box border border-black bg-white text-black p-3.5 flex flex-col justify-between box-border text-[11px] leading-tight select-text">
      {/* Header section matching uploaded PDF reference */}
      <div className="grid grid-cols-12 border border-black mb-2">
        {/* Logo column */}
        <div className="col-span-3 border-r border-black p-2 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-extrabold text-sm tracking-tighter">
              CK
            </div>
            <div className="text-left">
              <span className="block font-black text-red-600 leading-none text-[13px] tracking-tight">CLOUDKING</span>
              <span className="block font-bold text-black text-[9px] tracking-widest uppercase">TECHNICAL</span>
            </div>
          </div>
          <span className="text-[7.5px] font-semibold text-slate-500 uppercase mt-1 tracking-tight">SoftLab Global Partner</span>
        </div>

        {/* Center column: Centre name, address, GST */}
        <div className="col-span-6 border-r border-black p-2 text-center flex flex-col justify-center">
          {isEditing ? (
            <div className="space-y-1">
              <Input
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                className="h-6 text-[11px] font-bold text-center p-1"
              />
              <textarea
                value={centerAddress}
                onChange={(e) => setCenterAddress(e.target.value)}
                className="w-full text-[9px] border p-1 rounded resize-none"
                rows={2}
              />
              <div className="flex items-center justify-center gap-1">
                <span className="text-[10px] font-bold">Gst No:</span>
                <Input
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  className="h-5 text-[10px] w-36 font-mono p-1"
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
                  className="h-5 text-[10.5px] font-mono font-bold w-28 p-0.5 text-right inline-block"
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
                  className="h-5 text-[10.5px] font-mono font-bold w-24 p-0.5 text-right inline-block"
                />
              ) : (
                <span className="font-bold">{receiptDate}</span>
              )}
            </div>
          </div>
          <div className="mt-2 text-right">
            <span className="font-bold text-[11px] underline tracking-wide uppercase">{copyTitle}</span>
          </div>
        </div>
      </div>

      {/* Student Details Bar */}
      <div className="border border-black p-1.5 mb-2 bg-white">
        <div className="flex flex-wrap justify-between items-center text-[11px] mb-1">
          <div className="flex items-center gap-1">
            <span className="font-bold">Student Name -</span>
            {isEditing ? (
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="h-5 text-[11px] font-bold w-48 p-0.5"
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
                className="h-5 text-[11px] font-mono font-bold w-36 p-0.5"
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
              className="h-5 text-[11px] font-bold flex-1 p-0.5"
            />
          ) : (
            <span className="font-semibold">{courseTitle}</span>
          )}
        </div>
      </div>

      {/* Main Breakdown Table matching the exact layout of the PDF */}
      <table className="w-full border-collapse border border-black text-[10px] text-center mb-2">
        <thead>
          <tr className="border-b border-black font-bold">
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
          <tr className="border-b border-black">
            <td className="border-r border-black p-0.5">1</td>
            <td className="border-r border-black p-0.5 text-left font-medium">
              {isEditing ? (
                <Input
                  value={particulars}
                  onChange={(e) => setParticulars(e.target.value)}
                  className="h-4 text-[9.5px] p-0.5 border-none"
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
                  className="h-4 text-[9.5px] font-mono text-right p-0.5 w-20 ml-auto"
                />
              ) : registrationPayment > 0 ? (
                registrationPayment.toLocaleString("en-IN") + ".00/-"
              ) : (
                "0"
              )}
            </td>
          </tr>

          {/* Row 2: Empty Spacer */}
          <tr className="border-b border-black h-4">
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
          <tr className="border-b border-black">
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
          <tr className="border-b border-black h-4">
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
          <tr className="border-b border-black">
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
                  className="h-4 text-[9.5px] font-mono text-center p-0.5 w-24 mx-auto font-bold"
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
          <tr className="border-b border-black">
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
                  className="h-4 text-[9.5px] font-mono text-center p-0.5 w-24 mx-auto font-bold"
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
          <tr className="border-b border-black">
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
                  className="h-4 text-[9.5px] font-mono text-center p-0.5 w-24 mx-auto font-bold text-emerald-800"
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
          <tr className="border-b border-black font-bold">
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
                  className="h-4 text-[9.5px] font-mono text-center p-0.5 w-24 mx-auto font-bold text-rose-700"
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
      <div className="border border-black text-[10px]">
        {/* Amount in words & Status row */}
        <div className="flex border-b border-black">
          <div className="flex-1 p-1 border-r border-black flex items-center gap-1">
            <span className="font-bold">Amount in Words:</span>
            {isEditing ? (
              <Input
                value={customWords || computedWords}
                onChange={(e) => setCustomWords(e.target.value)}
                className="h-4 text-[9.5px] font-semibold italic flex-1 p-0.5"
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
                className="h-4 text-[9.5px] font-bold border border-black rounded px-1"
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
                className="h-4 text-[9.5px] font-mono flex-1 p-0.5"
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
        <div className="p-1 text-center text-[8.5px] leading-tight text-black space-y-0.5 bg-slate-50">
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
    <div className="space-y-4">
      {/* Top Controls Bar (hidden during print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-3 rounded-lg print:hidden shadow-lg">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm tracking-tight text-emerald-400">
            Official A4 Payment Receipt
          </span>
          <span className="text-xs text-slate-300 font-mono">({receiptNumber})</span>
          {saveSuccess && (
            <span className="text-xs bg-emerald-700 text-white px-2 py-0.5 rounded font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved & Synced!
            </span>
          )}
          {saveError && (
            <span className="text-xs bg-rose-700 text-white px-2 py-0.5 rounded font-semibold flex items-center gap-1">
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
              isEditing ? "bg-amber-500 text-slate-900 hover:bg-amber-400 border-amber-600" : "bg-slate-800 text-white hover:bg-slate-700 border-slate-700"
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
            <span>Print A4 Receipt (Both Copies)</span>
          </Button>

          {onClose && (
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="text-white border-slate-700 hover:bg-slate-800 text-xs h-8"
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {/* A4 Container: Student Copy (Top) + Scissor Perforation + Center Copy (Bottom) */}
      <div
        className="a4-receipt-page bg-white p-4 mx-auto space-y-2 border border-slate-300 shadow-xl print:p-0 print:border-none print:shadow-none print:m-0"
        style={{
          width: "210mm",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Top Half: STUDENT COPY */}
        {renderSingleReceipt("Student Copy")}

        {/* Scissor Perforation Line matching the uploaded PDF reference */}
        <div className="relative py-1 flex items-center justify-center select-none">
          <div className="w-full border-t border-dashed border-black"></div>
          <span className="absolute bg-white px-4 text-sm text-black flex items-center gap-1 font-bold">
            ✂
          </span>
        </div>

        {/* Bottom Half: CENTER COPY */}
        {renderSingleReceipt("Center Copy")}
      </div>
    </div>
  );
}
