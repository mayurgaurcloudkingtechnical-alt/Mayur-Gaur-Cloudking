"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { Printer, Download, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface StudentIdCardData {
  studentName: string;
  studentId: string;
  admissionNumber?: string;
  courseTitle: string;
  batchCode?: string;
  photoUrl?: string | null;
  validUntil: string | Date;
  admissionDate?: string | Date;
  center?: string;
  emergencyPhone?: string;
  bloodGroup?: string;
  educationProvider?: string;
  universityName?: string;
  universityProgram?: string;
}

interface StudentIdCardViewProps {
  data: StudentIdCardData;
  onClose?: () => void;
}

export function StudentIdCardView({ data, onClose }: StudentIdCardViewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);

  const isUniversity = data.educationProvider === "Dr. Preeti Global University" || !!data.universityName;

  useEffect(() => {
    const payload = JSON.stringify({
      inst: isUniversity ? "Dr. Preeti Global University / SOFTLAB GLOBAL" : "SOFTLAB GLOBAL",
      sid: data.studentId,
      name: data.studentName,
      course: data.universityProgram || data.courseTitle,
      valid: new Date(data.validUntil).getFullYear(),
    });

    QRCode.toDataURL(payload, { width: 120, margin: 1 })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("Failed to generate QR code", err));
  }, [data, isUniversity]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const validityYear = new Date(data.validUntil).getFullYear();
  const validityString = `${validityYear - 1} – ${validityYear}`;

  const formattedAdmissionDate = data.admissionDate
    ? new Date(data.admissionDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-3 rounded-lg print:hidden shadow-md">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-blue-400" />
          <span className="font-bold text-sm">Official Student Identity Card</span>
          <span className="text-xs text-slate-300 font-mono">({data.studentId})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-semibold text-xs h-8"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print ID Card</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="text-white border-slate-700 hover:bg-slate-800 gap-1.5 font-semibold text-xs h-8"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </Button>
          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose} className="text-white border-slate-700 hover:bg-slate-800 text-xs h-8">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* ID Card Front and Back Display */}
      <div
        ref={cardRef}
        className="flex flex-wrap items-center justify-center gap-6 p-4 print:p-0 print:gap-4 print:m-0"
      >
        {/* =================================================================== */}
        {/* FRONT SIDE (CR-80 Standard: 85.6mm x 53.98mm) */}
        {/* =================================================================== */}
        <div
          className="w-[85.6mm] h-[54mm] bg-white rounded-xl shadow-xl overflow-hidden border-2 border-slate-800 flex flex-col justify-between relative box-border print:shadow-none print:break-inside-avoid"
          style={{ width: "85.6mm", height: "54mm" }}
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 px-3 py-1.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center font-black text-xs">
                SG
              </div>
              <div>
                <h2 className="text-[11px] font-black tracking-tight leading-none text-white">
                  SOFTLAB GLOBAL
                </h2>
                <p className="text-[7.5px] text-blue-200 uppercase tracking-wider leading-none mt-0.5">
                  {isUniversity ? "DPGU Partner Programs" : "Center of Excellence"}
                </p>
              </div>
            </div>
            <div className="text-[8px] font-mono text-blue-300 font-bold uppercase bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800">
              {isUniversity ? "UNIV STUDENT" : "STUDENT"}
            </div>
          </div>

          {/* Main Card Body */}
          <div className="flex-1 px-3 py-1 flex items-center gap-3">
            {/* Photo */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="w-[24mm] h-[28mm] border-2 border-slate-700 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                {data.photoUrl ? (
                  <img
                    src={data.photoUrl}
                    alt={data.studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <User className="h-8 w-8" />
                    <span className="text-[7px] font-semibold mt-0.5">PHOTO</span>
                  </div>
                )}
              </div>
            </div>

            {/* Student Details */}
            <div className="flex-1 min-w-0 text-slate-900 leading-tight space-y-0.5">
              <h3 className="font-extrabold text-[12px] uppercase text-blue-950 truncate">
                {data.studentName}
              </h3>
              <div className="text-[9.5px]">
                <span className="text-slate-500 font-semibold block text-[7.5px] uppercase">Student ID</span>
                <span className="font-mono font-bold text-blue-800">{data.studentId}</span>
              </div>
              <div className="text-[9.5px]">
                <span className="text-slate-500 font-semibold block text-[7.5px] uppercase">
                  {isUniversity ? "University Program" : "Course"}
                </span>
                <span className="font-bold text-slate-800 truncate block">
                  {data.universityProgram || data.courseTitle}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[8px] text-slate-600 font-mono">
                {data.batchCode && (
                  <span>Batch: <strong className="text-slate-800 font-semibold">{data.batchCode}</strong></span>
                )}
                {data.admissionNumber && (
                  <span>Adm: <strong className="text-slate-800 font-semibold">{data.admissionNumber}</strong></span>
                )}
              </div>
              {formattedAdmissionDate && (
                <div className="text-[7.5px] text-slate-500 font-mono">
                  Adm Date: {formattedAdmissionDate}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="bg-slate-900 text-white px-3 py-1 flex items-center justify-between text-[8px] font-medium">
            <span className="font-mono">VALID: {validityString}</span>
            <span className="tracking-wide">CIVIL LINES, PRAYAGRAJ</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* BACK SIDE */}
        {/* =================================================================== */}
        <div
          className="w-[85.6mm] h-[54mm] bg-white rounded-xl shadow-xl overflow-hidden border-2 border-slate-800 flex flex-col justify-between p-3 box-border relative print:shadow-none print:break-inside-avoid"
          style={{ width: "85.6mm", height: "54mm" }}
        >
          <div className="flex items-start justify-between border-b border-slate-200 pb-1.5">
            <div>
              <h4 className="text-[9.5px] font-extrabold text-blue-950 uppercase">
                SOFTLAB GLOBAL CAMPUS
              </h4>
              <p className="text-[7px] text-slate-600 leading-tight">
                Patrika Chauraha, Civil Lines, Prayagraj – 211001
              </p>
              <p className="text-[7px] text-slate-600 font-mono">
                Helpline: +91 9194085890 | info@softlabglobal.com
              </p>
            </div>
            {/* Live QR Code */}
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="Verification QR"
                className="w-11 h-11 border border-slate-300 rounded p-0.5"
              />
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="text-[6.5px] text-slate-600 space-y-0.5 leading-tight">
            <p>1. This card is non-transferable and must be presented on demand.</p>
            <p>2. Loss of card must be reported immediately to institutional admin.</p>
            <p>3. Allows access to labs, campus Wi-Fi, LMS, and placement sessions.</p>
            <p>4. If found, please return to SOFTLAB GLOBAL reception desk.</p>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-1 border-t border-slate-200 text-[7px]">
            <div className="font-mono text-slate-400">VERIFIED ID</div>
            <div className="text-center">
              <div className="font-bold text-slate-900 border-t border-slate-800 px-2 pt-0.5">
                Director / Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
