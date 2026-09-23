"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Printer, User, CheckCircle2 } from "lucide-react";
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

  const validityYear = new Date(data.validUntil).getFullYear();
  const validityString = `${validityYear - 1} – ${validityYear}`;

  const formattedAdmissionDate = data.admissionDate
    ? new Date(data.admissionDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  /**
   * Opens a new minimal popup window with ONLY the ID card HTML.
   * This guarantees nothing else (nav, sidebar, header) prints.
   */
  const handlePrintIdCard = () => {
    const popup = window.open("", "_blank", "width=900,height=600,menubar=no,toolbar=no,scrollbars=yes");
    if (!popup) return;

    const frontCardHtml = `
      <div style="width:85.6mm;height:54mm;background:#fff;border-radius:8px;overflow:hidden;border:2px solid #1e293b;display:flex;flex-direction:column;justify-content:space-between;position:relative;box-sizing:border-box;font-family:Arial,sans-serif;">
        <!-- Header -->
        <div style="background:linear-gradient(to right,#1e3a8a,#312e81,#0f172a);padding:6px 10px;color:#fff;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="height:22px;width:22px;border-radius:4px;background:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:9px;color:#fff;">SG</div>
            <div>
              <div style="font-size:11px;font-weight:900;letter-spacing:-0.5px;line-height:1;color:#fff;">SOFTLAB GLOBAL</div>
              <div style="font-size:7px;color:#bfdbfe;text-transform:uppercase;letter-spacing:1px;line-height:1;margin-top:1px;">${isUniversity ? "DPGU Partner Programs" : "Center of Excellence"}</div>
            </div>
          </div>
          <div style="font-size:7px;font-family:monospace;color:#93c5fd;font-weight:700;background:rgba(30,58,138,0.8);padding:2px 5px;border-radius:3px;border:1px solid #1e40af;">${isUniversity ? "UNIV STUDENT" : "STUDENT"}</div>
        </div>
        <!-- Body -->
        <div style="flex:1;padding:4px 10px;display:flex;align-items:center;gap:10px;">
          <!-- Photo -->
          <div style="width:24mm;height:28mm;border:2px solid #334155;border-radius:5px;overflow:hidden;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${data.photoUrl
              ? `<img src="${data.photoUrl}" style="width:100%;height:100%;object-fit:cover;" />`
              : `<div style="display:flex;flex-direction:column;align-items:center;color:#94a3b8;font-size:8px;">
                   <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                   <span>PHOTO</span>
                 </div>`}
          </div>
          <!-- Details -->
          <div style="flex:1;min-width:0;line-height:1.3;">
            <div style="font-weight:900;font-size:12px;text-transform:uppercase;color:#172554;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.studentName}</div>
            <div style="margin-top:3px;">
              <div style="font-size:7px;color:#64748b;text-transform:uppercase;font-weight:600;">Student ID</div>
              <div style="font-family:monospace;font-weight:700;color:#1e40af;font-size:9px;">${data.studentId}</div>
            </div>
            <div style="margin-top:2px;">
              <div style="font-size:7px;color:#64748b;text-transform:uppercase;font-weight:600;">${isUniversity ? "University Program" : "Course"}</div>
              <div style="font-weight:700;color:#1e293b;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.universityProgram || data.courseTitle}</div>
            </div>
            ${data.batchCode ? `<div style="font-size:7px;color:#64748b;font-family:monospace;margin-top:2px;">Batch: <strong style="color:#1e293b;">${data.batchCode}</strong></div>` : ""}
            ${formattedAdmissionDate ? `<div style="font-size:7px;color:#94a3b8;font-family:monospace;">Adm: ${formattedAdmissionDate}</div>` : ""}
          </div>
        </div>
        <!-- Footer -->
        <div style="background:#0f172a;color:#fff;padding:4px 10px;display:flex;align-items:center;justify-content:space-between;font-size:7.5px;font-weight:600;">
          <span style="font-family:monospace;">VALID: ${validityString}</span>
          <span style="letter-spacing:0.5px;">CIVIL LINES, PRAYAGRAJ</span>
        </div>
      </div>
    `;

    const backCardHtml = `
      <div style="width:85.6mm;height:54mm;background:#fff;border-radius:8px;overflow:hidden;border:2px solid #1e293b;display:flex;flex-direction:column;justify-content:space-between;padding:10px;box-sizing:border-box;font-family:Arial,sans-serif;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">
          <div>
            <div style="font-size:9px;font-weight:900;color:#172554;text-transform:uppercase;">SOFTLAB GLOBAL CAMPUS</div>
            <div style="font-size:7px;color:#475569;line-height:1.4;">Patrika Chauraha, Civil Lines, Prayagraj – 211001</div>
            <div style="font-size:7px;color:#475569;font-family:monospace;">Helpline: +91 9194085890 | info@softlabglobal.com</div>
          </div>
          ${qrCodeUrl ? `<img src="${qrCodeUrl}" style="width:42px;height:42px;border:1px solid #cbd5e1;border-radius:3px;padding:2px;" />` : ""}
        </div>
        <div style="font-size:6.5px;color:#475569;line-height:1.6;">
          <div>1. This card is non-transferable and must be presented on demand.</div>
          <div>2. Loss of card must be reported immediately to institutional admin.</div>
          <div>3. Allows access to labs, campus Wi-Fi, LMS, and placement sessions.</div>
          <div>4. If found, please return to SOFTLAB GLOBAL reception desk.</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-top:4px;border-top:1px solid #e2e8f0;font-size:7px;">
          <div style="font-family:monospace;color:#94a3b8;">VERIFIED ID</div>
          <div style="text-align:center;">
            <div style="font-weight:700;color:#0f172a;border-top:1px solid #0f172a;padding:1px 8px 0;">Director / Authorized Signatory</div>
          </div>
        </div>
      </div>
    `;

    popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SoftLab Global – Student ID Card</title>
  <style>
    @page { size: A4 landscape; margin: 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; padding: 0; background: #fff; }
    .card-wrapper { display: flex; flex-wrap: wrap; gap: 20mm; align-items: flex-start; justify-content: center; padding: 10mm; }
    @media screen {
      body { background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    }
    .print-btn { display: block; text-align: center; margin: 20px auto; padding: 10px 28px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: Arial, sans-serif; }
    @media print { .print-btn { display: none; } .card-wrapper { padding: 0; gap: 15mm; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print ID Card</button>
  <div class="card-wrapper">
    ${frontCardHtml}
    ${backCardHtml}
  </div>
</body>
</html>`);

    popup.document.close();
    popup.focus();
    // Auto-print after a short delay to allow images/QR to load
    setTimeout(() => {
      try { popup.print(); } catch (_) {}
    }, 800);
  };

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
            onClick={handlePrintIdCard}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-semibold text-xs h-8"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print ID Card</span>
          </Button>
          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose} className="text-white border-slate-700 hover:bg-slate-800 text-xs h-8">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Scoped CSS to ensure print only shows the ID card even if popup is blocked */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-id-card, #printable-id-card * { visibility: visible !important; }
          #printable-id-card {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 15mm !important;
            background: white !important;
            margin: 0 !important;
            padding: 10mm !important;
            z-index: 99999 !important;
          }
        }
      `}</style>

      {/* ID Card Front and Back Display */}
      <div id="printable-id-card" className="flex flex-wrap items-center justify-center gap-6 p-4">
        {/* FRONT SIDE */}
        <div
          className="w-[85.6mm] h-[54mm] bg-white rounded-xl shadow-xl overflow-hidden border-2 border-slate-800 flex flex-col justify-between relative box-border"
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

        {/* BACK SIDE */}
        <div
          className="w-[85.6mm] h-[54mm] bg-white rounded-xl shadow-xl overflow-hidden border-2 border-slate-800 flex flex-col justify-between p-3 box-border relative"
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
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="Verification QR"
                className="w-11 h-11 border border-slate-300 rounded p-0.5"
              />
            )}
          </div>

          <div className="text-[6.5px] text-slate-600 space-y-0.5 leading-tight">
            <p>1. This card is non-transferable and must be presented on demand.</p>
            <p>2. Loss of card must be reported immediately to institutional admin.</p>
            <p>3. Allows access to labs, campus Wi-Fi, LMS, and placement sessions.</p>
            <p>4. If found, please return to SOFTLAB GLOBAL reception desk.</p>
          </div>

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
