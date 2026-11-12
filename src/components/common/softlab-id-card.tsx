"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  User,
  Briefcase,
  GraduationCap,
  Code,
  TrendingUp,
  Users,
  Building2,
  BookOpen,
} from "lucide-react";

export interface SoftlabIdCardProps {
  cardType?: "STAFF" | "STUDENT";
  fullName: string;
  designationOrCourse: string;
  idNumber: string;
  idLabel?: string; // "Employee ID" or "Student ID"
  departmentOrBatch: string;
  departmentLabel?: string; // "Department" or "Course / Batch"
  contactNo: string;
  email: string;
  workLocation?: string;
  photoUrl?: string | null;
  verifyUrl?: string;
  locationUrl?: string;
  isUniversityPartner?: boolean;
}

/**
 * Brand Header with Transparent SoftLab Global Logo Lockup
 * Follows exact design specification:
 * - Transparent logo emblem (Green 'S' + Blue figure + Book base)
 * - Brand typography: SOFT (Green #43B02A) LAB (Royal Blue #0052CC)
 * - Subline: — GLOBAL —
 * - Tagline: LEARN TODAY • CODE TOMORROW • LEAD THE FUTURE
 */
export function SoftlabBrandHeader({
  isUniversityPartner = false,
}: {
  isUniversityPartner?: boolean;
}) {
  return (
    <div className="relative pt-6 px-3 z-20 flex flex-col items-center text-center">
      <div className="flex items-center justify-center">
        <img
          src="/images/softlab-id-logo-transparent.png"
          alt="SoftLab Global"
          className="h-[46px] w-auto max-w-[245px] object-contain select-none drop-shadow-xs"
          style={{
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
          onError={(e) => {
            // High-fidelity fallback if PNG fails to load
            (e.currentTarget as HTMLElement).style.display = "none";
            const fb = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement | null;
            if (fb) fb.style.display = "flex";
          }}
        />
        {/* Crisp vector fallback */}
        <div className="hidden items-center justify-center gap-2">
          <img
            src="/images/softlab-emblem-transparent.png"
            alt="SoftLab"
            className="h-10 w-auto object-contain"
          />
          <div className="flex flex-col items-start leading-none text-left">
            <div className="text-[19px] font-black tracking-tight leading-none">
              <span className="text-[#43B02A]">SOFT</span>
              <span className="text-[#0052CC]">LAB</span>
            </div>
            <div className="text-[9px] font-black text-[#0052CC] tracking-[0.25em] flex items-center gap-1 w-full mt-0.5">
              <span className="h-[1.5px] bg-[#0052CC] flex-1" />
              <span>GLOBAL</span>
              <span className="h-[1.5px] bg-[#0052CC] flex-1" />
            </div>
            <div className="text-[5.5px] font-black text-[#071630] tracking-wider uppercase mt-0.5">
              LEARN TODAY • CODE TOMORROW • LEAD THE FUTURE
            </div>
          </div>
        </div>
      </div>

      {isUniversityPartner && (
        <p className="text-[6.5px] font-bold text-blue-700 uppercase tracking-wider mt-0.5">
          Dr. Preeti Global University Partner
        </p>
      )}
    </div>
  );
}

/**
 * FRONT SIDE OF SOFTLAB GLOBAL ID CARD
 * Strict 100% reproduction of reference media_1793254880800_0e316456.jpg
 */
export function SoftlabIdCardFront({
  cardType = "STAFF",
  fullName,
  designationOrCourse,
  idNumber,
  idLabel = cardType === "STAFF" ? "Employee ID" : "Student ID",
  departmentOrBatch,
  departmentLabel = cardType === "STAFF" ? "Department" : "Course",
  contactNo,
  email,
  workLocation = "Head Office, Prayagraj",
  photoUrl,
  verifyUrl,
  isUniversityPartner = false,
}: SoftlabIdCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const text =
      verifyUrl ||
      `https://softlabglobal.com/verify?id=${encodeURIComponent(idNumber)}&type=${cardType.toLowerCase()}`;
    QRCode.toDataURL(text, {
      width: 140,
      margin: 1,
      color: { dark: "#071630", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [verifyUrl, idNumber, cardType]);

  return (
    <div
      className="w-[340px] h-[540px] bg-white rounded-[26px] shadow-2xl border border-slate-300 overflow-hidden relative flex flex-col justify-between font-sans select-none box-border"
      style={{
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Top Lanyard Ribbon + Metallic Clip Slot */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 pointer-events-none">
        {/* Lanyard Fabric Peeking from top */}
        <div className="w-12 h-3 bg-gradient-to-r from-[#0052CC] via-[#43B02A] to-[#0052CC] rounded-b-sm shadow-xs flex items-center justify-center -mt-1">
          <div className="w-4 h-2 bg-white/90 rounded-full flex items-center justify-center">
            <span className="text-[4px] font-black text-[#0052CC] tracking-tighter">SLG</span>
          </div>
        </div>
        {/* Metallic Clip Slot */}
        <div className="w-18 h-4 bg-gradient-to-b from-slate-400 via-slate-100 to-slate-400 rounded-b-xl border border-slate-400 shadow-md flex items-center justify-center -mt-0.5">
          <div className="w-9 h-1.5 bg-slate-800 rounded-full shadow-inner" />
        </div>
      </div>

      {/* Top Header Corner Waves: Royal Blue & Vibrant Lime Green */}
      <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none overflow-hidden z-0">
        <svg viewBox="0 0 340 110" className="w-full h-full" preserveAspectRatio="none">
          {/* Top-Left Swooshes */}
          <path d="M0,0 L135,0 C115,48 55,68 0,82 Z" fill="#0052CC" />
          <path d="M0,56 C48,62 90,44 114,0 L128,0 C104,48 52,78 0,92 Z" fill="#43B02A" />
          {/* Top-Right Swooshes */}
          <path d="M340,0 L205,0 C225,48 285,68 340,82 Z" fill="#0052CC" />
          <path d="M340,56 C292,62 250,44 226,0 L212,0 C236,48 288,78 340,92 Z" fill="#43B02A" />
        </svg>
      </div>

      {/* Official SoftLab Global Brand Lockup (Transparent PNG + Typography) */}
      <SoftlabBrandHeader isUniversityPartner={isUniversityPartner} />

      {/* Middle Hero Section: Building (left) + Photo (center) + 5 Services (right) */}
      <div className="relative z-10 px-3 flex items-center justify-between -mt-1">
        {/* Left: Modern Glass Architectural Campus Strip with Green Curve */}
        <div className="relative w-16 h-26 overflow-hidden rounded-r-2xl border-r-2 border-[#43B02A] shadow-inner bg-slate-100 flex items-center justify-center shrink-0">
          <img
            src="/images/id-card-front-building.png"
            alt="Campus"
            className="w-full h-full object-cover object-left opacity-90"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />
          <Building2 className="w-7 h-7 text-sky-900/40 absolute z-0" />
        </div>

        {/* Center: Passport Photo with Dual Ring (Inner White, Outer Green/Blue) */}
        <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#43B02A] via-[#00B4D8] to-[#0052CC] shadow-xl shrink-0 mx-auto">
          <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-2 border-white flex items-center justify-center">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const fallback = target.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 ${
                photoUrl ? "hidden" : "flex"
              }`}
            >
              <span className="text-xl font-black uppercase text-slate-700 tracking-wider">
                {fullName
                  ? fullName
                      .trim()
                      .split(" ")
                      .map((n) => n[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                  : "SLG"}
              </span>
              <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                MEMBER
              </span>
            </div>
          </div>
        </div>

        {/* Right: Vertical 5 Services List with Accent Borders */}
        <div className="w-24 text-right pr-1 space-y-1 text-[7px] font-black text-[#071630] uppercase tracking-tight leading-none shrink-0">
          <p className="border-r-2 border-[#0052CC] pr-1">IT TRAINING</p>
          <p className="border-r-2 border-[#43B02A] pr-1">SKILL DEVELOPMENT</p>
          <p className="border-r-2 border-[#0052CC] pr-1">LIVE PROJECTS</p>
          <p className="border-r-2 border-[#43B02A] pr-1">PLACEMENT SUPPORT</p>
          <p className="border-r-2 border-[#0052CC] pr-1">CORPORATE SERVICES</p>
        </div>
      </div>

      {/* Name and Designation / Course Title */}
      <div className="relative z-10 text-center px-4 -mt-1">
        <h2 className="text-[17px] font-black text-[#071630] uppercase tracking-wide leading-tight truncate">
          {fullName}
        </h2>
        <p className="text-[12px] font-bold text-[#0052CC] leading-tight truncate mt-0.5">
          {designationOrCourse}
        </p>
      </div>

      {/* Credentials Table + Verification QR Code */}
      <div className="relative z-10 px-4 flex items-center justify-between gap-2 -mt-0.5">
        {/* Left: 5 credential rows with solid royal blue circular icon badges */}
        <div className="space-y-1 text-[9.5px] text-slate-800 flex-1 min-w-0 font-medium">
          {/* Row 1: Employee ID / Student ID */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-xs">
              <User className="w-2.5 h-2.5" />
            </span>
            <span className="font-bold text-slate-900 w-[78px] shrink-0">{idLabel} :</span>
            <span className="font-mono font-black text-[#071630] truncate">{idNumber}</span>
          </div>

          {/* Row 2: Department / Course */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-xs">
              {cardType === "STAFF" ? (
                <Briefcase className="w-2.5 h-2.5" />
              ) : (
                <BookOpen className="w-2.5 h-2.5" />
              )}
            </span>
            <span className="font-bold text-slate-900 w-[78px] shrink-0">{departmentLabel} :</span>
            <span className="font-bold text-slate-800 truncate">{departmentOrBatch}</span>
          </div>

          {/* Row 3: Contact */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Phone className="w-2.5 h-2.5" />
            </span>
            <span className="font-bold text-slate-900 w-[78px] shrink-0">Contact No. :</span>
            <span className="font-bold text-slate-800 font-mono truncate">{contactNo}</span>
          </div>

          {/* Row 4: Email */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Mail className="w-2.5 h-2.5" />
            </span>
            <span className="font-bold text-slate-900 w-[78px] shrink-0">Email :</span>
            <span className="font-bold text-slate-800 truncate text-[8.5px]">{email}</span>
          </div>

          {/* Row 5: Work Location */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="w-2.5 h-2.5" />
            </span>
            <span className="font-bold text-slate-900 w-[78px] shrink-0">Work Location :</span>
            <span className="font-bold text-slate-800 truncate">{workLocation}</span>
          </div>
        </div>

        {/* Right: Square QR Code with green border + caption */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="w-[66px] h-[66px] p-1 bg-white border-2 border-[#43B02A] rounded-xl shadow-sm flex items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Scan QR" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-900 rounded" />
            )}
          </div>
          <span className="text-[6.5px] font-black text-[#071630] uppercase tracking-wider mt-0.5">
            SCAN TO VERIFY
          </span>
        </div>
      </div>

      {/* Bottom Wave + 4 Feature Pillars + URL Pill */}
      <div className="relative mt-1">
        {/* Green accent wave swoosh leading into dark navy footer */}
        <svg viewBox="0 0 340 32" className="w-full h-auto block -mb-0.5" preserveAspectRatio="none">
          <path d="M0,18 C90,4 240,30 340,10 L340,32 L0,32 Z" fill="#071630" />
          <path
            d="M0,14 C110,0 230,24 340,6 L340,13 C230,28 110,4 0,20 Z"
            fill="#43B02A"
          />
        </svg>

        {/* Dark Navy Band */}
        <div className="bg-[#071630] text-white px-3 pb-2 pt-1">
          {/* 4 Feature Columns */}
          <div className="grid grid-cols-4 divide-x divide-slate-700/80 text-center py-0.5">
            <div className="flex flex-col items-center justify-center px-1">
              <GraduationCap className="w-3.5 h-3.5 text-white mb-0.5" />
              <p className="text-[6.2px] font-black tracking-tight text-white uppercase leading-none">
                LEARN TODAY
              </p>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <Code className="w-3.5 h-3.5 text-white mb-0.5" />
              <p className="text-[6.2px] font-black tracking-tight text-white uppercase leading-none">
                CODE TOMORROW
              </p>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <TrendingUp className="w-3.5 h-3.5 text-white mb-0.5" />
              <p className="text-[6.2px] font-black tracking-tight text-white uppercase leading-none">
                LEAD THE FUTURE
              </p>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <Users className="w-3.5 h-3.5 text-white mb-0.5" />
              <p className="text-[6.2px] font-black tracking-tight text-white uppercase leading-none">
                EMPOWERING YOUNG MINDS
              </p>
            </div>
          </div>

          {/* White Bottom Pill with Globe + Website URL */}
          <div className="flex items-center justify-center gap-1.5 mt-1 mx-auto bg-white text-[#071630] py-0.5 px-3 rounded-full w-fit shadow">
            <Globe className="w-3 h-3 text-[#0052CC]" />
            <span className="text-[8.5px] font-black tracking-wider">www.softlabglobal.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * BACK SIDE OF SOFTLAB GLOBAL ID CARD
 * Strict 100% reproduction of reference media_1793254880800_0e316456.jpg
 */
export function SoftlabIdCardBack({
  aboutText = "SoftLab Global is a leading IT training and corporate services company, committed to skill development, live projects, placements and building future-ready professionals.",
  officeAddressLine1 = "SoftLab Global",
  officeAddressLine2 = "4th Floor, 211/C/59, Tata Motors Building,",
  officeAddressLine3 = "M.G Road, Near Landmark, Prayagraj,",
  officeAddressLine4 = "Uttar Pradesh - 211011, India.",
  officePhone = "+91 9196596975",
  officeEmail = "info@softlabglobal.com",
  websiteUrl = "www.softlabglobal.com",
  locationUrl,
  terms = [
    "1. This ID card is non-transferable.",
    "2. It must be worn at all times within company premises and official events.",
    "3. Loss of this card must be reported immediately to HR.",
    "4. This card is the property of SoftLab Global and must be returned on exit.",
  ],
  signatoryName = "HARSH SHUKLA",
  signatoryTitle = "Authorised Signatory",
  signatoryOrg = "SoftLab Global",
}: {
  aboutText?: string;
  officeAddressLine1?: string;
  officeAddressLine2?: string;
  officeAddressLine3?: string;
  officeAddressLine4?: string;
  officePhone?: string;
  officeEmail?: string;
  websiteUrl?: string;
  locationUrl?: string;
  terms?: string[];
  signatoryName?: string;
  signatoryTitle?: string;
  signatoryOrg?: string;
}) {
  const [locationQrUrl, setLocationQrUrl] = useState<string>("");

  useEffect(() => {
    const loc =
      locationUrl ||
      "https://maps.google.com/?q=SoftLab+Global+Civil+Lines+Prayagraj+Uttar+Pradesh";
    QRCode.toDataURL(loc, {
      width: 140,
      margin: 1,
      color: { dark: "#071630", light: "#ffffff" },
    })
      .then(setLocationQrUrl)
      .catch(() => setLocationQrUrl(""));
  }, [locationUrl]);

  return (
    <div
      className="w-[340px] h-[540px] bg-white rounded-[26px] shadow-2xl border border-slate-300 overflow-hidden relative flex flex-col justify-between font-sans select-none box-border"
      style={{
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Top Lanyard Ribbon + Metallic Clip Slot */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 pointer-events-none">
        <div className="w-12 h-3 bg-gradient-to-r from-[#0052CC] via-[#43B02A] to-[#0052CC] rounded-b-sm shadow-xs flex items-center justify-center -mt-1">
          <div className="w-4 h-2 bg-white/90 rounded-full flex items-center justify-center">
            <span className="text-[4px] font-black text-[#0052CC] tracking-tighter">SLG</span>
          </div>
        </div>
        <div className="w-18 h-4 bg-gradient-to-b from-slate-400 via-slate-100 to-slate-400 rounded-b-xl border border-slate-400 shadow-md flex items-center justify-center -mt-0.5">
          <div className="w-9 h-1.5 bg-slate-800 rounded-full shadow-inner" />
        </div>
      </div>

      {/* Top Header Corner Waves: Royal Blue & Vibrant Lime Green */}
      <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none overflow-hidden z-0">
        <svg viewBox="0 0 340 110" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,0 L135,0 C115,48 55,68 0,82 Z" fill="#0052CC" />
          <path d="M0,56 C48,62 90,44 114,0 L128,0 C104,48 52,78 0,92 Z" fill="#43B02A" />
          <path d="M340,0 L205,0 C225,48 285,68 340,82 Z" fill="#0052CC" />
          <path d="M340,56 C292,62 250,44 226,0 L212,0 C236,48 288,78 340,92 Z" fill="#43B02A" />
        </svg>
      </div>

      {/* Official SoftLab Global Brand Lockup (Transparent PNG + Typography) */}
      <SoftlabBrandHeader />

      {/* Body Content */}
      <div className="relative z-10 px-4 space-y-2 flex-1 mt-1">
        {/* Section 1: ABOUT SOFTLAB GLOBAL */}
        <div>
          <div className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#0052CC] text-white text-[8px] font-black uppercase tracking-wider mb-1 shadow-xs">
            ABOUT SOFTLAB GLOBAL
          </div>
          <p className="text-[7.5px] text-slate-700 leading-tight font-medium text-justify">
            {aboutText}
          </p>
        </div>

        {/* 4 Feature Badges with circular icons (Card grid matching reference) */}
        <div className="grid grid-cols-4 divide-x divide-slate-200 text-center py-1.5 bg-slate-50 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-col items-center justify-center px-1">
            <span className="w-5 h-5 rounded-full bg-[#43B02A] text-white flex items-center justify-center mb-0.5 shadow-xs">
              <GraduationCap className="w-3 h-3" />
            </span>
            <p className="text-[6.2px] font-black text-slate-800 leading-tight uppercase">
              IT TRAINING &amp; COURSES
            </p>
          </div>
          <div className="flex flex-col items-center justify-center px-1">
            <span className="w-5 h-5 rounded-full bg-[#0052CC] text-white flex items-center justify-center mb-0.5 shadow-xs">
              <Code className="w-3 h-3" />
            </span>
            <p className="text-[6.2px] font-black text-slate-800 leading-tight uppercase">
              LIVE PROJECTS &amp; INTERNSHIP
            </p>
          </div>
          <div className="flex flex-col items-center justify-center px-1">
            <span className="w-5 h-5 rounded-full bg-[#43B02A] text-white flex items-center justify-center mb-0.5 shadow-xs">
              <Briefcase className="w-3 h-3" />
            </span>
            <p className="text-[6.2px] font-black text-slate-800 leading-tight uppercase">
              PLACEMENT SUPPORT
            </p>
          </div>
          <div className="flex flex-col items-center justify-center px-1">
            <span className="w-5 h-5 rounded-full bg-[#0052CC] text-white flex items-center justify-center mb-0.5 shadow-xs">
              <Building2 className="w-3 h-3" />
            </span>
            <p className="text-[6.2px] font-black text-slate-800 leading-tight uppercase">
              CORPORATE IT SERVICES
            </p>
          </div>
        </div>

        {/* Section 2: OFFICE ADDRESS + SCAN FOR LOCATION */}
        <div>
          <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#0052CC] text-white text-[8px] font-black uppercase tracking-wider mb-1 shadow-xs">
            <MapPin className="w-2.5 h-2.5" />
            <span>OFFICE ADDRESS</span>
          </div>

          <div className="flex items-start justify-between gap-2 relative">
            <div className="text-[7.6px] text-slate-800 space-y-0.5 leading-snug flex-1 relative z-10">
              <p className="font-black text-[#071630]">{officeAddressLine1}</p>
              <p className="text-slate-600">{officeAddressLine2}</p>
              <p className="text-slate-600">{officeAddressLine3}</p>
              <p className="text-slate-600">{officeAddressLine4}</p>

              <div className="pt-1 space-y-0.5 text-[7.5px] font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Phone className="w-2 h-2" />
                  </span>
                  <span className="font-mono">{officePhone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Mail className="w-2 h-2" />
                  </span>
                  <span>{officeEmail}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Globe className="w-2 h-2" />
                  </span>
                  <span>{websiteUrl}</span>
                </div>
              </div>
            </div>

            {/* Location QR + Watermark */}
            <div className="flex flex-col items-center justify-center shrink-0 relative z-10">
              <div className="w-[58px] h-[58px] p-1 bg-white border-2 border-[#43B02A] rounded-xl shadow-sm flex items-center justify-center">
                {locationQrUrl ? (
                  <img
                    src={locationQrUrl}
                    alt="Location QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 rounded" />
                )}
              </div>
              <span className="text-[5.8px] font-black text-[#071630] uppercase tracking-wider mt-0.5">
                SCAN FOR LOCATION
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: TERMS & CONDITIONS + SIGNATORY */}
        <div>
          <div className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#0052CC] text-white text-[8px] font-black uppercase tracking-wider mb-1 shadow-xs">
            TERMS &amp; CONDITIONS
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="space-y-0.5 text-[6.5px] text-slate-600 leading-tight flex-1">
              {terms.map((t, idx) => (
                <p key={idx}>{t}</p>
              ))}
            </div>

            {/* Authorised Signatory with official script */}
            <div className="text-right shrink-0">
              <div className="font-serif italic text-[13px] text-slate-900 font-bold border-b border-slate-700 pb-0.5 px-2">
                ✍️ {signatoryName}
              </div>
              <p className="text-[7.2px] font-black text-[#071630] uppercase tracking-wide mt-0.5">
                {signatoryTitle}
              </p>
              <p className="text-[6.5px] font-bold text-slate-600">{signatoryOrg}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Dark Navy Bar across the bottom */}
      <div className="bg-[#071630] py-2 text-center text-white text-[8px] font-black tracking-widest uppercase">
        LEARN TODAY | CODE TOMORROW | LEAD THE FUTURE
      </div>
    </div>
  );
}
