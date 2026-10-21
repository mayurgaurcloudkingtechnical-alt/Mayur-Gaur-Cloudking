"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  SoftlabIdCardFront,
  SoftlabIdCardBack,
} from "@/components/common/softlab-id-card";
import {
  Printer,
  User,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Globe,
  QrCode as QrIcon,
  ShieldCheck,
  Building,
} from "lucide-react";
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
  email?: string;
  phone?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  signatoryOrg?: string;
}

interface StudentIdCardViewProps {
  data: StudentIdCardData;
  onClose?: () => void;
}

export function StudentIdCardView({ data, onClose }: StudentIdCardViewProps) {
  const [studentQrUrl, setStudentQrUrl] = useState<string>("");
  const [locationQrUrl, setLocationQrUrl] = useState<string>("");
  const [activeSide, setActiveSide] = useState<"both" | "front" | "back">("both");

  // Editable signatory state with default "HARSH SHUKLA"
  const [signatoryName, setSignatoryName] = useState<string>(
    data.signatoryName || "HARSH SHUKLA"
  );
  const [signatoryTitle, setSignatoryTitle] = useState<string>(
    data.signatoryTitle || "Authorised Signatory"
  );
  const [signatoryOrg, setSignatoryOrg] = useState<string>(
    data.signatoryOrg || "SoftLab Global"
  );
  const [showSignatoryEditor, setShowSignatoryEditor] = useState<boolean>(false);

  const isUniversity =
    data.educationProvider === "Dr. Preeti Global University" || !!data.universityName;

  const candidatePhone = data.phone || data.emergencyPhone || "+91 9196596975";
  const candidateEmail =
    data.email ||
    `${data.studentName.toLowerCase().replace(/[^a-z0-9]/g, "") || "student"}@softlabglobal.com`;
  const campusLocation = data.center || "Civil Lines, Prayagraj, UP";
  const courseDisplay = data.universityProgram || data.courseTitle;

  const validityYear = new Date(data.validUntil).getFullYear();
  const validityString = `${validityYear - 1} – ${validityYear}`;

  useEffect(() => {
    // 1. Student Verification QR
    const studentPayload = JSON.stringify({
      inst: isUniversity ? "Dr. Preeti Global University / SOFTLAB GLOBAL" : "SOFTLAB GLOBAL",
      sid: data.studentId,
      name: data.studentName,
      course: courseDisplay,
      batch: data.batchCode || "REGULAR",
      valid: validityString,
      verifyUrl: `https://softlabglobal.com/verify-student?id=${encodeURIComponent(data.studentId)}`,
    });

    QRCode.toDataURL(studentPayload, { width: 140, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => setStudentQrUrl(url))
      .catch((err) => console.error("Failed to generate student QR code", err));

    // 2. Campus Office Geo QR
    const locationPayload =
      "https://maps.google.com/?q=SoftLab+Global+Tata+Motors+Building+Civil+Lines+Prayagraj";
    QRCode.toDataURL(locationPayload, { width: 120, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => setLocationQrUrl(url))
      .catch((err) => console.error("Failed to generate location QR code", err));
  }, [data, isUniversity, courseDisplay, validityString]);

  /**
   * Opens a new clean window containing ONLY the high-resolution ID card front & back.
   */
  const handlePrintIdCard = () => {
    const popup = window.open(
      "",
      "_blank",
      "width=1000,height=750,menubar=no,toolbar=no,scrollbars=yes"
    );
    if (!popup) return;

    popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SoftLab Global – Student ID Card – ${data.studentName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 20px;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .print-controls {
      margin-bottom: 25px;
      text-align: center;
    }
    .print-btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .print-btn:hover {
      background: #1d4ed8;
    }
    .cards-wrapper {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 30px;
      align-items: center;
      justify-content: center;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
        min-height: auto;
      }
      .print-controls {
        display: none !important;
      }
      .cards-wrapper {
        gap: 15mm;
        padding: 10mm 0;
      }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="print-btn" onclick="window.print()">🖨️ Print ID Card (300+ DPI PVC)</button>
  </div>
  <div class="cards-wrapper">
    ${document.getElementById("card-front-wrapper")?.outerHTML || ""}
    ${document.getElementById("card-back-wrapper")?.outerHTML || ""}
  </div>
</body>
</html>`);

    popup.document.close();
    popup.focus();
    setTimeout(() => {
      try {
        popup.print();
      } catch (_) {}
    }, 600);
  };

  return (
    <div className="space-y-4">
      {/* Top Action & Preview Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-3.5 rounded-xl print:hidden shadow-lg border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight">Official Student Identity Card</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                CR-80 PORTRAIT
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              ID: <span className="text-white font-mono font-bold">{data.studentId}</span> • Name:{" "}
              <span className="text-white font-semibold">{data.studentName}</span>
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setActiveSide("both")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                activeSide === "both" ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              Both Sides
            </button>
            <button
              type="button"
              onClick={() => setActiveSide("front")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                activeSide === "front" ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => setActiveSide("back")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                activeSide === "back" ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              Back
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSignatoryEditor((prev) => !prev)}
            className="text-xs h-9 border-slate-700 hover:bg-slate-800 text-slate-200"
          >
            ✍️ Signatory: <strong className="ml-1 text-emerald-400">{signatoryName}</strong>
          </Button>

          <Button
            size="sm"
            onClick={handlePrintIdCard}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-bold text-xs h-9 shadow"
          >
            <Printer className="h-4 w-4" />
            <span>Print ID Card</span>
          </Button>

          {onClose && (
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="text-white border-slate-700 hover:bg-slate-800 text-xs h-9"
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Optional Live Authorised Signatory Editor Toolbar */}
      {showSignatoryEditor && (
        <div className="bg-slate-900/90 text-white p-3.5 rounded-xl border border-emerald-500/30 print:hidden space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Change Authorised Signatory for this ID Card
            </span>
            <button
              type="button"
              onClick={() => setShowSignatoryEditor(false)}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Done ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="text-[11px] text-slate-300 block mb-1">
                Signatory Name (Default: HARSH SHUKLA)
              </label>
              <input
                type="text"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                placeholder="HARSH SHUKLA"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Signatory Title</label>
              <input
                type="text"
                value={signatoryTitle}
                onChange={(e) => setSignatoryTitle(e.target.value)}
                placeholder="Authorised Signatory"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Organisation / Unit</label>
              <input
                type="text"
                value={signatoryOrg}
                onChange={(e) => setSignatoryOrg(e.target.value)}
                placeholder="SoftLab Global"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Scoped CSS to ensure print only shows the ID cards when browser prints page */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-id-card-stage, #printable-id-card-stage * { visibility: visible !important; }
          #printable-id-card-stage {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 20mm !important;
            background: white !important;
            margin: 0 !important;
            padding: 10mm !important;
            z-index: 99999 !important;
          }
        }
      `}</style>

      {/* Main Presentation Stage */}
      <div
        id="printable-id-card-stage"
        className="flex flex-wrap items-center justify-center gap-8 py-6 px-2 bg-slate-100 rounded-2xl border border-slate-200"
      >
        {/* CARD FRONT */}
        {(activeSide === "both" || activeSide === "front") && (
          <div id="card-front-wrapper" className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 print:hidden">
              FRONT SIDE
            </span>
            <SoftlabIdCardFront
              cardType="STUDENT"
              fullName={data.studentName}
              designationOrCourse={courseDisplay}
              idNumber={data.studentId}
              idLabel="Student ID"
              departmentOrBatch={data.batchCode || "Standard Batch"}
              departmentLabel="Batch / Cohort"
              contactNo={candidatePhone}
              email={candidateEmail}
              workLocation={campusLocation}
              photoUrl={data.photoUrl}
              isUniversityPartner={isUniversity}
            />
          </div>
        )}

        {/* CARD BACK */}
        {(activeSide === "both" || activeSide === "back") && (
          <div id="card-back-wrapper" className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 print:hidden">
              BACK SIDE
            </span>
            <SoftlabIdCardBack
              aboutText="SoftLab Global is a premier IT institute & software consultancy dedicated to practical industry training, live real-world projects, certified skill development, and guaranteed corporate career placement."
              officeAddressLine1="SoftLab Global"
              officeAddressLine2="4th Floor, 211/C/59, Tata Motors Building,"
              officeAddressLine3="Near Landmark, Prayagraj,"
              officeAddressLine4="Uttar Pradesh - 211011, India."
              officePhone="+91 9196596975"
              officeEmail="info@softlabglobal.com"
              websiteUrl="www.softlabglobal.com"
              terms={[
                "1. This ID card is strictly non-transferable and remains institutional property.",
                "2. Must be carried and produced upon demand by campus faculty and admin.",
                "3. Loss of this card must be immediately reported to campus reception desk.",
                "4. Valid for campus Wi-Fi, computer labs, LMS access, and placement drives.",
              ]}
              signatoryName={signatoryName || "HARSH SHUKLA"}
              signatoryTitle={signatoryTitle || "Authorised Signatory"}
              signatoryOrg={signatoryOrg || "SoftLab Global"}
            />
          </div>
        )}
      </div>

      {/* Helpful Hint */}
      <div className="text-center text-[11px] text-slate-500 print:hidden flex items-center justify-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Standard CR-80 format (300+ DPI vector render). Ready for plastic card PVC printing or high-res laminated badge.</span>
      </div>
    </div>
  );
}
