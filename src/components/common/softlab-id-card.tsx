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
      width: 120,
      margin: 1,
      color: { dark: "#071630", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [verifyUrl, idNumber, cardType]);

  return (
    <div
      className="w-[340px] h-[540px] bg-white rounded-[26px] shadow-2xl border border-slate-300 overflow-hidden relative flex flex-col justify-between font-sans select-none box-border"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      {/* Top Lanyard Clip */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-20 h-5 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 rounded-b-xl border border-slate-400 shadow-sm flex items-center justify-center z-30">
        <div className="w-10 h-1.5 bg-slate-700/60 rounded-full" />
      </div>

      {/* Top Header Corner Swooshes */}
      <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none overflow-hidden z-0">
        {/* Top-Left Blue & Green Swirl */}
        <svg viewBox="0 0 340 120" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,0 L140,0 C120,45 60,65 0,75 Z" fill="#0052CC" />
          <path d="M0,50 C50,55 95,35 120,0 L135,0 C110,45 55,75 0,85 Z" fill="#43B02A" />
          {/* Top-Right Green & Blue Swirl */}
          <path d="M340,0 L200,0 C220,45 280,65 340,75 Z" fill="#0052CC" />
          <path d="M340,50 C290,55 245,35 220,0 L205,0 C230,45 285,75 340,85 Z" fill="#43B02A" />
        </svg>
      </div>

      {/* Logo & Tagline Header */}
      <div className="relative pt-6 px-4 z-10 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-2">
          <img
            src="/images/logo.png"
            alt="SoftLab Global"
            className="h-10 w-auto max-w-[170px] object-contain drop-shadow-sm"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/softlab-logo.png";
            }}
          />
        </div>
        <p className="text-[7.5px] font-black text-[#071630] tracking-wider uppercase mt-0.5">
          LEARN TODAY • CODE TOMORROW • LEAD THE FUTURE
        </p>
        {isUniversityPartner && (
          <p className="text-[6.5px] font-bold text-blue-700 uppercase tracking-wider">
            Dr. Preeti Global University Partner
          </p>
        )}
      </div>

      {/* Middle Hero Section: Building (left) + Photo (center) + Track list (right) */}
      <div className="relative z-10 px-3 flex items-center justify-between -mt-1">
        {/* Left: Building Glass Strip with Green Curve */}
        <div className="relative w-16 h-28 overflow-hidden rounded-r-2xl border-r-2 border-emerald-500 shadow-inner bg-gradient-to-br from-slate-200 via-sky-100 to-slate-300 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(7,22,48,0.35), rgba(0,82,204,0.15)), repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(255,255,255,0.4) 6px, rgba(255,255,255,0.4) 10px), repeating-linear-gradient(90deg, #64748b, #64748b 8px, #334155 8px, #334155 16px)",
            }}
          />
          <Building2 className="w-8 h-8 text-sky-900/60 relative z-10" />
        </div>

        {/* Center: Passport Photo with Green/Blue gradient ring */}
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
              <span className="text-xl font-black uppercase text-slate-600 tracking-wider">
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

        {/* Right: Vertical 5 Services list */}
        <div className="w-24 text-right pr-1 space-y-0.5 border-r-2 border-[#0052CC] text-[7.2px] font-black text-[#071630] uppercase tracking-tight leading-none">
          <p>IT TRAINING</p>
          <p>SKILL DEVELOPMENT</p>
          <p>LIVE PROJECTS</p>
          <p>PLACEMENT SUPPORT</p>
          <p>CORPORATE SERVICES</p>
        </div>
      </div>

      {/* Name and Designation */}
      <div className="relative z-10 text-center px-4 -mt-1">
        <h2 className="text-[17px] font-black text-[#071630] uppercase tracking-wide leading-tight truncate">
          {fullName}
        </h2>
        <p className="text-[11.5px] font-bold text-[#0052CC] leading-tight truncate mt-0.5">
          {designationOrCourse}
        </p>
      </div>

      {/* Credentials Table + QR Code (side by side) */}
      <div className="relative z-10 px-5 flex items-center justify-between gap-2">
        {/* Left: 5 credential rows */}
        <div className="space-y-1 text-[9.5px] text-slate-800 flex-1 min-w-0 font-medium">
          {/* Row 1: ID */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0">
              <User className="w-2.5 h-2.5" />
            </span>
            <span className="font-semibold text-slate-900 w-20 shrink-0">{idLabel} :</span>
            <span className="font-mono font-black text-[#071630] truncate">{idNumber}</span>
          </div>

          {/* Row 2: Department / Course */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0">
              {cardType === "STAFF" ? (
                <Briefcase className="w-2.5 h-2.5" />
              ) : (
                <BookOpen className="w-2.5 h-2.5" />
              )}
            </span>
            <span className="font-semibold text-slate-900 w-20 shrink-0">{departmentLabel} :</span>
            <span className="font-semibold text-slate-800 truncate">{departmentOrBatch}</span>
          </div>

          {/* Row 3: Contact */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0">
              <Phone className="w-2.5 h-2.5" />
            </span>
            <span className="font-semibold text-slate-900 w-20 shrink-0">Contact No. :</span>
            <span className="font-semibold text-slate-800 font-mono truncate">{contactNo}</span>
          </div>

          {/* Row 4: Email */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0">
              <Mail className="w-2.5 h-2.5" />
            </span>
            <span className="font-semibold text-slate-900 w-20 shrink-0">Email :</span>
            <span className="font-semibold text-slate-800 truncate text-[8.5px]">{email}</span>
          </div>

          {/* Row 5: Location */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0">
              <MapPin className="w-2.5 h-2.5" />
            </span>
            <span className="font-semibold text-slate-900 w-20 shrink-0">Work Location :</span>
            <span className="font-semibold text-slate-800 truncate">{workLocation}</span>
          </div>
        </div>

        {/* Right: QR Code with green border + caption */}
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
        {/* Green accent wave above navy bar */}
        <svg viewBox="0 0 340 35" className="w-full h-auto block -mb-0.5" preserveAspectRatio="none">
          <path d="M0,20 C90,5 240,32 340,12 L340,35 L0,35 Z" fill="#071630" />
          <path
            d="M0,16 C110,0 230,26 340,8 L340,15 C230,30 110,6 0,22 Z"
            fill="#43B02A"
          />
        </svg>

        {/* Navy Bottom Band */}
        <div className="bg-[#071630] text-white px-3 pb-2 pt-1">
          {/* 4 Feature Columns */}
          <div className="grid grid-cols-4 divide-x divide-slate-700/80 text-center py-1">
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

          {/* White Bottom Pill with Globe + URL */}
          <div className="flex items-center justify-center gap-1.5 mt-1 mx-auto bg-white text-[#071630] py-0.5 px-3 rounded-full w-fit shadow">
            <Globe className="w-3 h-3 text-[#0052CC]" />
            <span className="text-[8.5px] font-black tracking-wider">www.softlabglobal.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      width: 120,
      margin: 1,
      color: { dark: "#071630", light: "#ffffff" },
    })
      .then(setLocationQrUrl)
      .catch(() => setLocationQrUrl(""));
  }, [locationUrl]);

  return (
    <div
      className="w-[340px] h-[540px] bg-white rounded-[26px] shadow-2xl border border-slate-300 overflow-hidden relative flex flex-col justify-between font-sans select-none box-border"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      {/* Top Lanyard Clip */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-20 h-5 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 rounded-b-xl border border-slate-400 shadow-sm flex items-center justify-center z-30">
        <div className="w-10 h-1.5 bg-slate-700/60 rounded-full" />
      </div>

      {/* Top Header Corner Swooshes */}
      <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none overflow-hidden z-0">
        <svg viewBox="0 0 340 120" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,0 L140,0 C120,45 60,65 0,75 Z" fill="#0052CC" />
          <path d="M0,50 C50,55 95,35 120,0 L135,0 C110,45 55,75 0,85 Z" fill="#43B02A" />
          <path d="M340,0 L200,0 C220,45 280,65 340,75 Z" fill="#0052CC" />
          <path d="M340,50 C290,55 245,35 220,0 L205,0 C230,45 285,75 340,85 Z" fill="#43B02A" />
        </svg>
      </div>

      {/* Logo & Tagline Header */}
      <div className="relative pt-6 px-4 z-10 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-2">
          <img
            src="/images/logo.png"
            alt="SoftLab Global"
            className="h-10 w-auto max-w-[170px] object-contain drop-shadow-sm"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/softlab-logo.png";
            }}
          />
        </div>
        <p className="text-[7.5px] font-black text-[#071630] tracking-wider uppercase mt-0.5">
          LEARN TODAY • CODE TOMORROW • LEAD THE FUTURE
        </p>
      </div>

      {/* Body Content */}
      <div className="relative z-10 px-4 space-y-2 flex-1 mt-1">
        {/* Section 1: ABOUT SOFTLAB GLOBAL */}
        <div>
          <div className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#0052CC] text-white text-[8px] font-black uppercase tracking-wider mb-1 shadow-sm">
            ABOUT SOFTLAB GLOBAL
          </div>
          <p className="text-[7.5px] text-slate-700 leading-tight font-medium text-justify">
            {aboutText}
          </p>
        </div>

        {/* 4 Feature Badges with circular icons */}
        <div className="grid grid-cols-4 divide-x divide-slate-200 text-center py-1 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex flex-col items-center justify-center px-1">
            <span className="w-5 h-5 rounded-full bg-[#43B02A] text-white flex items-center justify-center mb-0.5">
              <GraduationCap className="w-3 h-3" />
            </span>
            <p className="text-[6.2px] font-black text-slate-800 leading-tight">
              IT TRAINING &amp; COURSES
            </p>
          </div>
          <div className="flex flex-col items-center justify-center px-1">
            <span className="w-5 h-5 rounded-full bg-[#0052CC] text-white flex items-center justify-center mb-0.5">
              <Code className="w-3 h-3" />
            </span>
            <p className="text-[6.2px] font-black text-slate-800 leading-tight">
              LIVE PROJECTS &amp; INTERNSHIP
            </p>
          </div>
          <div className="flex flex-col items-center justify-center px-1">
            <span className="w-5 h-5 rounded-full bg-[#43B02A] text-white flex items-center justify-center mb-0.5">
              <Briefcase className="w-3 h-3" />
            </span>
            <p className="text-[6.2px] font-black text-slate-800 leading-tight">
              PLACEMENT SUPPORT
            </p>
          </div>
          <div className="flex flex-col items-center justify-center px-1">
            <span className="w-5 h-5 rounded-full bg-[#0052CC] text-white flex items-center justify-center mb-0.5">
              <Building2 className="w-3 h-3" />
            </span>
            <p className="text-[6.2px] font-black text-slate-800 leading-tight">
              CORPORATE IT SERVICES
            </p>
          </div>
        </div>

        {/* Section 2: OFFICE ADDRESS + SCAN FOR LOCATION */}
        <div>
          <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#0052CC] text-white text-[8px] font-black uppercase tracking-wider mb-1 shadow-sm">
            <MapPin className="w-2.5 h-2.5" />
            <span>OFFICE ADDRESS</span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div className="text-[7.6px] text-slate-800 space-y-0.5 leading-snug flex-1">
              <p className="font-black text-[#071630]">{officeAddressLine1}</p>
              <p className="text-slate-600">{officeAddressLine2}</p>
              <p className="text-slate-600">{officeAddressLine3}</p>
              <p className="text-slate-600">{officeAddressLine4}</p>

              <div className="pt-1 space-y-0.5 text-[7.5px] font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0">
                    <Phone className="w-2 h-2" />
                  </span>
                  <span className="font-mono">{officePhone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0">
                    <Mail className="w-2 h-2" />
                  </span>
                  <span>{officeEmail}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0">
                    <Globe className="w-2 h-2" />
                  </span>
                  <span>{websiteUrl}</span>
                </div>
              </div>
            </div>

            {/* Location QR */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="w-[58px] h-[58px] p-1 bg-white border-2 border-[#43B02A] rounded-xl shadow-sm flex items-center justify-center">
                {locationQrUrl ? (
                  <img src={locationQrUrl} alt="Location QR" className="w-full h-full object-contain" />
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

        {/* Section 3: TERMS & CONDITIONS */}
        <div>
          <div className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#0052CC] text-white text-[8px] font-black uppercase tracking-wider mb-1 shadow-sm">
            TERMS &amp; CONDITIONS
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="space-y-0.5 text-[6.5px] text-slate-600 leading-tight flex-1">
              {terms.map((t, idx) => (
                <p key={idx}>{t}</p>
              ))}
            </div>

            {/* Authorised Signatory */}
            <div className="text-right shrink-0">
              <div className="font-serif italic text-base text-slate-900 font-bold border-b border-slate-700 pb-0.5 px-2">
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

      {/* Bottom Dark Navy Footer */}
      <div className="bg-[#071630] py-2 text-center text-white text-[8px] font-black tracking-widest uppercase">
        LEARN TODAY | CODE TOMORROW | LEAD THE FUTURE
      </div>
    </div>
  );
}
