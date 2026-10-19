"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
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
}

interface StudentIdCardViewProps {
  data: StudentIdCardData;
  onClose?: () => void;
}

export function StudentIdCardView({ data, onClose }: StudentIdCardViewProps) {
  const [studentQrUrl, setStudentQrUrl] = useState<string>("");
  const [locationQrUrl, setLocationQrUrl] = useState<string>("");
  const [activeSide, setActiveSide] = useState<"both" | "front" | "back">("both");

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
        {/* ========================================================================= */}
        {/* CARD FRONT (Exact replica of user's uploaded sample template)           */}
        {/* ========================================================================= */}
        {(activeSide === "both" || activeSide === "front") && (
          <div id="card-front-wrapper" className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 print:hidden">
              FRONT SIDE
            </span>

            {/* CR80 Standard Vertical Badge (330px x 530px) */}
            <div className="w-[330px] h-[530px] bg-white rounded-[24px] shadow-2xl border border-slate-300 overflow-hidden relative flex flex-col justify-between font-sans select-none box-border">
              {/* Metallic Lanyard Clip Hole */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-20 h-5 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 rounded-b-xl border border-slate-400 shadow-sm flex items-center justify-center z-30">
                <div className="w-10 h-1.5 bg-slate-700/60 rounded-full" />
              </div>

              {/* Top Wave & Header Section */}
              <div className="relative pt-6 px-4 bg-gradient-to-b from-white via-white to-transparent z-10">
                {/* Logo & Tagline */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  {/* Official 3D SoftLab Global Logo */}
                  <img
                    src="/images/softlab-global-logo-3d.jpg"
                    alt="SoftLab Global"
                    className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200 shrink-0"
                  />
                  <div className="leading-tight text-center">
                    <h1 className="text-lg font-black tracking-tight text-[#0A2540]">
                      <span className="text-[#059669]">SOFTLAB </span>GLOBAL
                    </h1>
                    <p className="text-[7.5px] font-bold text-[#0A2540] tracking-wider uppercase">
                      LEARN TODAY • CODE TOMORROW • LEAD THE FUTURE
                    </p>
                    {isUniversity && (
                      <p className="text-[6.5px] font-bold text-blue-700 uppercase tracking-wider">
                        Dr. Preeti Global University Partner
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Upper Dynamic Waves (Emerald/Cyan/Blue) & Service Bullet Points */}
              <div className="relative -mt-2">
                <svg viewBox="0 0 330 110" className="w-full h-auto drop-shadow-sm block">
                  <defs>
                    <linearGradient id="studentWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="50%" stopColor="#0EA5E9" />
                      <stop offset="100%" stopColor="#1E40AF" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,40 C80,95 240,0 330,55 L330,0 L0,0 Z"
                    fill="url(#studentWaveGrad)"
                    opacity="0.9"
                  />
                  <path
                    d="M0,25 C100,85 220,10 330,35 L330,0 L0,0 Z"
                    fill="#059669"
                    opacity="0.4"
                  />
                </svg>

                {/* Right-aligned 5 service bullets */}
                <div className="absolute top-2 right-3 text-right text-[7.5px] font-bold text-slate-800 space-y-0.5 z-10 leading-none tracking-tight">
                  <p>IT TRAINING</p>
                  <p>SKILL DEVELOPMENT</p>
                  <p>LIVE PROJECTS</p>
                  <p>PLACEMENT SUPPORT</p>
                  <p>CORPORATE SERVICES</p>
                </div>
              </div>

              {/* Centered Circular Portrait Photo with dual vibrant ring */}
              <div className="relative -mt-10 flex flex-col items-center z-20">
                <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-emerald-500 via-sky-400 to-blue-700 shadow-lg">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-2 border-white">
                    {data.photoUrl ? (
                      <img
                        src={data.photoUrl}
                        alt={data.studentName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <User className="w-14 h-14" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Full Name & Program */}
                <div className="mt-2 text-center px-4 max-w-[310px]">
                  <h2 className="text-base font-black text-[#0A2540] uppercase tracking-wide leading-tight truncate">
                    {data.studentName}
                  </h2>
                  <p className="text-xs font-bold text-blue-900 mt-0.5 truncate">{courseDisplay}</p>
                </div>
              </div>

              {/* Student Credentials Table + QR Code Verification */}
              <div className="px-5 py-1 z-20 flex items-center justify-between gap-2 mt-1">
                {/* Left side 5 details */}
                <div className="space-y-1 text-[9.5px] text-slate-700 flex-1 leading-tight font-medium min-w-0">
                  {/* ID */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[9px] font-bold">
                      ID
                    </span>
                    <span className="font-semibold text-slate-900 w-16 shrink-0">Student ID :</span>
                    <span className="font-mono font-bold text-blue-900 truncate">
                      {data.studentId}
                    </span>
                  </div>

                  {/* Course / Dept */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[9px]">
                      <Building className="w-2.5 h-2.5" />
                    </span>
                    <span className="font-semibold text-slate-900 w-16 shrink-0">Course :</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[130px]">
                      {courseDisplay}
                    </span>
                  </div>

                  {/* Contact */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[9px]">
                      <Phone className="w-2.5 h-2.5" />
                    </span>
                    <span className="font-semibold text-slate-900 w-16 shrink-0">Contact :</span>
                    <span className="font-semibold text-slate-800 truncate">
                      {candidatePhone}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[9px]">
                      <Mail className="w-2.5 h-2.5" />
                    </span>
                    <span className="font-semibold text-slate-900 w-16 shrink-0">Email :</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[130px]">
                      {candidateEmail}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[9px]">
                      <MapPin className="w-2.5 h-2.5" />
                    </span>
                    <span className="font-semibold text-slate-900 w-16 shrink-0">Location :</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[130px]">
                      {campusLocation}
                    </span>
                  </div>
                </div>

                {/* Right side QR Code */}
                <div className="flex flex-col items-center justify-center p-1.5 bg-white border border-slate-300 rounded-lg shadow-sm flex-shrink-0">
                  <div className="w-14 h-14 bg-slate-900 p-1 rounded flex items-center justify-center text-white">
                    {studentQrUrl ? (
                      <img src={studentQrUrl} alt="Verify QR" className="w-12 h-12 rounded" />
                    ) : (
                      <QrIcon className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <span className="text-[6.5px] font-black text-slate-800 uppercase tracking-tighter mt-1">
                    SCAN TO VERIFY
                  </span>
                </div>
              </div>

              {/* Bottom Dynamic Wave + 4 Feature Pillars + Website */}
              <div className="relative mt-2">
                <svg viewBox="0 0 330 40" className="w-full h-auto block">
                  <path d="M0,15 C90,0 210,35 330,10 L330,40 L0,40 Z" fill="#0A2540" />
                  <path
                    d="M0,25 C120,5 240,30 330,20 L330,40 L0,40 Z"
                    fill="#059669"
                    opacity="0.3"
                  />
                </svg>

                {/* 4 Feature Icons strip */}
                <div className="bg-[#0A2540] text-white px-3 pb-2 pt-0.5">
                  <div className="grid grid-cols-4 gap-1 text-center border-b border-slate-700/60 pb-1.5">
                    <div>
                      <p className="text-[6.5px] font-bold tracking-tight text-emerald-400">
                        LEARN TODAY
                      </p>
                    </div>
                    <div>
                      <p className="text-[6.5px] font-bold tracking-tight text-sky-400">
                        &lt;/&gt; CODE TOMORROW
                      </p>
                    </div>
                    <div>
                      <p className="text-[6.5px] font-bold tracking-tight text-amber-400">
                        LEAD THE FUTURE
                      </p>
                    </div>
                    <div>
                      <p className="text-[6.5px] font-bold tracking-tight text-purple-300">
                        EMPOWERING MINDS
                      </p>
                    </div>
                  </div>

                  {/* Bottom URL */}
                  <div className="flex items-center justify-center gap-1 mt-1 text-[9px] font-bold text-slate-200 tracking-wider">
                    <Globe className="w-3 h-3 text-emerald-400" />
                    <span>www.softlabglobal.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CARD BACK (Exact replica of user's uploaded sample template)            */}
        {/* ========================================================================= */}
        {(activeSide === "both" || activeSide === "back") && (
          <div id="card-back-wrapper" className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 print:hidden">
              BACK SIDE
            </span>

            {/* CR80 Standard Vertical Badge (330px x 530px) */}
            <div className="w-[330px] h-[530px] bg-white rounded-[24px] shadow-2xl border border-slate-300 overflow-hidden relative flex flex-col justify-between font-sans select-none box-border">
              {/* Metallic Lanyard Clip Hole */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-20 h-5 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 rounded-b-xl border border-slate-400 shadow-sm flex items-center justify-center z-30">
                <div className="w-10 h-1.5 bg-slate-700/60 rounded-full" />
              </div>

              {/* Top Logo & Header */}
              <div className="pt-6 px-4 bg-gradient-to-b from-white via-white to-transparent">
                <div className="flex items-center justify-center gap-2 pt-2">
                  <img
                    src="/images/softlab-global-logo-3d.jpg"
                    alt="SoftLab Global"
                    className="w-9 h-9 rounded-full object-cover shadow-sm border border-slate-200 shrink-0"
                  />
                  <div className="leading-tight text-center">
                    <h1 className="text-base font-black tracking-tight text-[#0A2540]">
                      <span className="text-[#059669]">SOFTLAB </span>GLOBAL
                    </h1>
                    <p className="text-[6.5px] font-bold text-[#0A2540] tracking-wider uppercase">
                      LEARN TODAY • CODE TOMORROW • LEAD THE FUTURE
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Sections */}
              <div className="px-4 space-y-2 flex-1 mt-1">
                {/* Section 1: ABOUT SOFTLAB GLOBAL */}
                <div>
                  <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[8px] font-bold uppercase tracking-wider mb-1">
                    ABOUT SOFTLAB GLOBAL
                  </div>
                  <p className="text-[7.5px] text-slate-600 leading-tight font-medium">
                    SoftLab Global is a premier IT institute & software consultancy dedicated to
                    practical industry training, live real-world projects, certified skill development,
                    and guaranteed corporate career placement.
                  </p>
                </div>

                {/* 4 Feature Badges */}
                <div className="grid grid-cols-4 gap-1">
                  <div className="bg-blue-50 border border-blue-200 rounded p-1 text-center">
                    <p className="text-[6.5px] font-bold text-blue-900 leading-tight">
                      IT TRAINING & COURSES
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded p-1 text-center">
                    <p className="text-[6.5px] font-bold text-emerald-900 leading-tight">
                      LIVE PROJECTS & INTERN
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded p-1 text-center">
                    <p className="text-[6.5px] font-bold text-amber-900 leading-tight">
                      PLACEMENT SUPPORT
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded p-1 text-center">
                    <p className="text-[6.5px] font-bold text-purple-900 leading-tight">
                      CORPORATE IT SERVICES
                    </p>
                  </div>
                </div>

                {/* Section 2: OFFICE ADDRESS */}
                <div>
                  <div className="inline-block px-3 py-0.5 rounded-full bg-blue-700 text-white text-[8px] font-bold uppercase tracking-wider mb-1">
                    OFFICE ADDRESS
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[7.5px] text-slate-700 space-y-0.5 leading-tight flex-1">
                      <p className="font-bold text-slate-900">
                        SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, Uttar Pradesh - 211011
                      </p>
                      <p className="text-slate-600 font-mono">📞 +91 9196596975 / +91 9196596979</p>
                      <p className="text-slate-600 font-mono">✉️ info@softlabglobal.com</p>
                      <p className="text-slate-600 font-semibold">🌐 www.softlabglobal.com</p>
                    </div>
                    {/* Location Geo QR */}
                    <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded shadow-sm flex-shrink-0">
                      <div className="w-10 h-10 bg-slate-900 p-0.5 rounded flex items-center justify-center text-white">
                        {locationQrUrl ? (
                          <img src={locationQrUrl} alt="Location QR" className="w-9 h-9 rounded" />
                        ) : (
                          <QrIcon className="w-9 h-9 text-white" />
                        )}
                      </div>
                      <span className="text-[5.5px] font-black text-slate-800 uppercase tracking-tighter mt-0.5">
                        SCAN LOCATION
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: TERMS & CONDITIONS */}
                <div>
                  <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-700 text-white text-[8px] font-bold uppercase tracking-wider mb-1">
                    TERMS & CONDITIONS
                  </div>
                  <div className="space-y-0.5 text-[6.5px] text-slate-600 leading-tight">
                    <p>1. This ID card is strictly non-transferable and remains institutional property.</p>
                    <p>2. Must be carried and produced upon demand by campus faculty and admin.</p>
                    <p>3. Loss of this card must be immediately reported to campus reception desk.</p>
                    <p>4. Valid for campus Wi-Fi, computer labs, LMS access, and placement drives.</p>
                  </div>
                </div>

                {/* Authorised Signatory Block (specifically Director) */}
                <div className="flex items-end justify-between pt-1 border-t border-slate-200">
                  <div className="text-[7px] text-slate-400">
                    <p>Valid: <strong className="text-slate-700">{validityString}</strong></p>
                    <p className="font-mono text-emerald-600 font-bold">VERIFIED STUDENT BADGE</p>
                  </div>
                  <div className="text-right">
                    <div className="font-serif italic text-sm text-slate-800 font-bold border-b border-slate-500 pb-0.5 px-3">
                      Director Signature
                    </div>
                    <p className="text-[7.5px] font-bold text-slate-900 mt-0.5 uppercase tracking-wide">
                      Authorised Signatory
                    </p>
                    <p className="text-[6.5px] font-semibold text-slate-600">Director, SoftLab Global</p>
                  </div>
                </div>
              </div>

              {/* Bottom Dark Navy Footer */}
              <div className="bg-[#0A2540] py-2 text-center text-white text-[8px] font-bold tracking-widest uppercase">
                LEARN TODAY | CODE TOMORROW | LEAD THE FUTURE
              </div>
            </div>
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
