"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  GraduationCap,
  Code,
  TrendingUp,
  Building2,
  Users,
} from "lucide-react";

export interface SoftlabVisitingCardProps {
  fullName: string;
  designation: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  officeAddressLine1?: string;
  officeAddressLine2?: string;
  officeAddressLine3?: string;
  qrDestinationUrl?: string;
  isDirectorLevel?: boolean;
}

/**
 * Standard Landscape Corporate Visiting Card (CR-80 Landscape Ratio: ~85mm x 54mm)
 * Dimensions: 480px width x 280px height
 */
export function SoftlabVisitingCardFront({
  fullName,
  designation,
  phone = "+91 9196596975",
  email = "info@softlabglobal.com",
  websiteUrl = "www.softlabglobal.com",
  officeAddressLine1 = "4th Floor, 211/C/59, Tata Motors Building,",
  officeAddressLine2 = "M.G. Marg, Civil Lines, Prayagraj,",
  officeAddressLine3 = "Uttar Pradesh - 211011",
  qrDestinationUrl = "https://www.softlabglobal.com",
  isDirectorLevel = false,
}: SoftlabVisitingCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(qrDestinationUrl, {
      width: 140,
      margin: 1,
      color: { dark: "#071630", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [qrDestinationUrl]);

  return (
    <div
      className="w-[480px] h-[280px] bg-white rounded-[18px] shadow-2xl border border-slate-300 overflow-hidden relative flex flex-col justify-between font-sans select-none box-border text-slate-900"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      {/* Top Banner Curve Wave with Blue & Green Accents */}
      <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none overflow-hidden z-0">
        <svg viewBox="0 0 480 80" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,0 L200,0 C170,30 90,45 0,55 Z" fill="#0052CC" opacity="0.9" />
          <path d="M0,35 C60,40 130,25 170,0 L185,0 C145,30 75,55 0,65 Z" fill="#43B02A" />
          <path d="M480,0 L320,0 C340,30 400,45 480,55 Z" fill="#0052CC" opacity="0.9" />
          <path d="M480,35 C430,40 370,25 340,0 L325,0 C355,30 415,55 480,65 Z" fill="#43B02A" />
        </svg>
      </div>

      {/* Top Header: Logo on Left & Building Image on Right */}
      <div className="relative z-10 pt-4 px-6 flex items-start justify-between">
        {/* SoftLab Global Official Brand Logo */}
        <div className="flex flex-col items-start">
          <img
            src="/images/logo.png"
            alt="SoftLab Global"
            className="h-9 w-auto max-w-[160px] object-contain drop-shadow-sm"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/softlab-logo.png";
            }}
          />
          <span className="text-[6.5px] font-black text-[#071630] tracking-wider uppercase mt-0.5">
            LEARN TODAY • CODE TOMORROW • LEAD THE FUTURE
          </span>
        </div>

        {/* Right Corner: Glass Building Badge with SoftLab Logo */}
        <div className="relative w-28 h-14 overflow-hidden rounded-bl-2xl border-l-2 border-b-2 border-emerald-500 shadow-sm bg-gradient-to-br from-slate-200 via-sky-100 to-slate-300 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-85"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(7,22,48,0.4), rgba(0,82,204,0.2)), repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.4) 4px, rgba(255,255,255,0.4) 8px), repeating-linear-gradient(90deg, #64748b, #64748b 6px, #334155 6px, #334155 12px)",
            }}
          />
          <div className="relative z-10 flex items-center gap-1 bg-white/90 px-1.5 py-0.5 rounded shadow-sm border border-slate-200">
            <Building2 className="w-3 h-3 text-[#0052CC]" />
            <span className="text-[7px] font-black text-[#071630]">SOFTLAB GLOBAL</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Personal Info (Left) + QR & Script Tagline (Right) */}
      <div className="relative z-10 px-6 grid grid-cols-12 gap-2 items-center flex-1 -mt-1">
        {/* Left Column (8 cols): Name, Role, Phone, Email, Office Address */}
        <div className="col-span-8 space-y-1">
          <div>
            <h2 className="text-[17px] font-black text-[#071630] uppercase tracking-wide leading-tight truncate">
              {fullName}
            </h2>
            <p className="text-[11px] font-bold text-[#0052CC] leading-tight">
              {designation}
            </p>
          </div>

          <div className="space-y-0.5 pt-0.5 text-[8px] text-slate-800 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0">
                <Phone className="w-2 h-2" />
              </span>
              <span className="font-mono font-bold text-slate-900">{phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0">
                <Mail className="w-2 h-2" />
              </span>
              <span className="truncate">{email}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#0052CC] text-white flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-2 h-2" />
              </span>
              <div className="leading-tight text-slate-700">
                <p>{officeAddressLine1}</p>
                <p>{officeAddressLine2} {officeAddressLine3}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): QR Code + Scan Caption + Script Highlight */}
        <div className="col-span-4 flex flex-col items-center justify-center text-center">
          <div className="w-[72px] h-[72px] p-1 bg-white border-2 border-[#43B02A] rounded-xl shadow-md flex items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Scan QR" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-900 rounded" />
            )}
          </div>
          <span className="text-[6.5px] font-black text-[#071630] uppercase tracking-wider mt-0.5">
            SCAN TO VISIT
          </span>
          <span className="text-[6px] font-bold text-[#0052CC] tracking-tight">
            {websiteUrl}
          </span>
          {isDirectorLevel && (
            <p className="font-serif italic text-[10px] text-slate-600 font-bold mt-0.5">
              Building Future-Ready Professionals
            </p>
          )}
        </div>
      </div>

      {/* Bottom Feature Pill Band (Dark Navy) */}
      <div className="relative">
        <svg viewBox="0 0 480 18" className="w-full h-auto block -mb-0.5" preserveAspectRatio="none">
          <path d="M0,8 C120,0 360,18 480,6 L480,18 L0,18 Z" fill="#071630" />
          <path d="M0,6 C140,0 340,16 480,4 L480,7 C340,18 140,2 0,9 Z" fill="#43B02A" />
        </svg>
        <div className="bg-[#071630] text-white px-4 py-1.5">
          <div className="grid grid-cols-4 divide-x divide-slate-700 text-center">
            <div className="flex flex-col items-center justify-center px-1">
              <GraduationCap className="w-3 h-3 text-emerald-400 mb-0.5" />
              <p className="text-[6.5px] font-black text-white uppercase leading-none">IT TRAINING</p>
              <p className="text-[5.5px] text-slate-300 leading-none">&amp; COURSES</p>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <Code className="w-3 h-3 text-sky-400 mb-0.5" />
              <p className="text-[6.5px] font-black text-white uppercase leading-none">LIVE PROJECTS</p>
              <p className="text-[5.5px] text-slate-300 leading-none">&amp; INTERNSHIP</p>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <TrendingUp className="w-3 h-3 text-amber-400 mb-0.5" />
              <p className="text-[6.5px] font-black text-white uppercase leading-none">PLACEMENT</p>
              <p className="text-[5.5px] text-slate-300 leading-none">SUPPORT</p>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <Building2 className="w-3 h-3 text-purple-300 mb-0.5" />
              <p className="text-[6.5px] font-black text-white uppercase leading-none">CORPORATE</p>
              <p className="text-[5.5px] text-slate-300 leading-none">IT SERVICES</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Landscape Visiting Card - Back Side
 */
export function SoftlabVisitingCardBack({
  websiteUrl = "www.softlabglobal.com",
  qrDestinationUrl = "https://www.softlabglobal.com",
  isDirectorLevel = false,
}: {
  websiteUrl?: string;
  qrDestinationUrl?: string;
  isDirectorLevel?: boolean;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(qrDestinationUrl, {
      width: 140,
      margin: 1,
      color: { dark: "#071630", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [qrDestinationUrl]);

  return (
    <div
      className="w-[480px] h-[280px] bg-white rounded-[18px] shadow-2xl border border-slate-300 overflow-hidden relative flex flex-col justify-between font-sans select-none box-border text-slate-900"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      {/* Top Banner Curve Wave with Blue & Green Accents */}
      <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none overflow-hidden z-0">
        <svg viewBox="0 0 480 80" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,0 L200,0 C170,30 90,45 0,55 Z" fill="#0052CC" opacity="0.9" />
          <path d="M0,35 C60,40 130,25 170,0 L185,0 C145,30 75,55 0,65 Z" fill="#43B02A" />
          <path d="M480,0 L320,0 C340,30 400,45 480,55 Z" fill="#0052CC" opacity="0.9" />
          <path d="M480,35 C430,40 370,25 340,0 L325,0 C355,30 415,55 480,65 Z" fill="#43B02A" />
        </svg>
      </div>

      {/* Top Header: Logo Centered / Left with script tagline on right */}
      <div className="relative z-10 pt-4 px-6 flex items-start justify-between">
        <div className="flex flex-col items-start">
          <img
            src="/images/logo.png"
            alt="SoftLab Global"
            className="h-9 w-auto max-w-[160px] object-contain drop-shadow-sm"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/softlab-logo.png";
            }}
          />
          <span className="text-[6.5px] font-black text-[#071630] tracking-wider uppercase mt-0.5">
            LEARN TODAY • CODE TOMORROW • LEAD THE FUTURE
          </span>
          <p className="text-[7px] font-bold text-blue-900 mt-0.5">
            A Leading IT Training &amp; Corporate Services Company
          </p>
        </div>

        {/* Right side Script Tagline */}
        <div className="text-right">
          <p className="font-serif italic text-sm text-[#071630] font-bold leading-tight">
            {isDirectorLevel ? "Innovation • Skills • Opportunity • Global Careers" : "Empowering Young Minds"}
          </p>
        </div>
      </div>

      {/* Middle Section: 4 Pillars with Round Blue Icons */}
      <div className="relative z-10 px-6 py-1">
        <div className="grid grid-cols-4 gap-2">
          {/* Pillar 1 */}
          <div className="flex flex-col items-center text-center p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <span className="w-7 h-7 rounded-full bg-[#0052CC] text-white flex items-center justify-center mb-1 shadow-sm">
              <GraduationCap className="w-4 h-4" />
            </span>
            <span className="text-[6.8px] font-black text-[#071630] uppercase leading-tight">
              IT TRAINING &amp; COURSES
            </span>
          </div>

          {/* Pillar 2 */}
          <div className="flex flex-col items-center text-center p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <span className="w-7 h-7 rounded-full bg-[#0052CC] text-white flex items-center justify-center mb-1 shadow-sm">
              <Code className="w-4 h-4" />
            </span>
            <span className="text-[6.8px] font-black text-[#071630] uppercase leading-tight">
              LIVE PROJECTS &amp; INTERNSHIP
            </span>
          </div>

          {/* Pillar 3 */}
          <div className="flex flex-col items-center text-center p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <span className="w-7 h-7 rounded-full bg-[#0052CC] text-white flex items-center justify-center mb-1 shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-[6.8px] font-black text-[#071630] uppercase leading-tight">
              PLACEMENT SUPPORT
            </span>
          </div>

          {/* Pillar 4 */}
          <div className="flex flex-col items-center text-center p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <span className="w-7 h-7 rounded-full bg-[#0052CC] text-white flex items-center justify-center mb-1 shadow-sm">
              <Building2 className="w-4 h-4" />
            </span>
            <span className="text-[6.8px] font-black text-[#071630] uppercase leading-tight">
              CORPORATE IT SERVICES
            </span>
          </div>
        </div>
      </div>

      {/* Website + Social Links + QR Section */}
      <div className="relative z-10 px-6 pb-2 flex items-center justify-between">
        {/* Left: Website QR and URL */}
        <div className="flex items-center gap-3">
          <div className="w-[50px] h-[50px] p-0.5 bg-white border border-slate-300 rounded-lg shadow-sm flex items-center justify-center shrink-0">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Website QR" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-900 rounded" />
            )}
          </div>
          <div>
            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider block">
              VISIT OUR WEBSITE
            </span>
            <div className="flex items-center gap-1 text-[10px] font-black text-[#0052CC]">
              <Globe className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>{websiteUrl}</span>
            </div>
          </div>
        </div>

        {/* Right: Social Media Icons (LinkedIn, Insta, Facebook, YouTube, X) */}
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-[#0077b5] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
            in
          </span>
          <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
            <Instagram className="w-3 h-3" />
          </span>
          <span className="w-5 h-5 rounded-md bg-[#1877f2] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
            f
          </span>
          <span className="w-5 h-5 rounded-md bg-[#ff0000] text-white flex items-center justify-center shadow-xs">
            <Youtube className="w-3 h-3" />
          </span>
          <span className="w-5 h-5 rounded-md bg-black text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
            𝕏
          </span>
        </div>
      </div>

      {/* Bottom Footer Band */}
      <div className="bg-[#071630] py-1.5 text-center text-white text-[7.5px] font-black tracking-widest uppercase">
        <span className="inline-flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-emerald-400" />
          <span>Learn Today | Code Tomorrow | Lead The Future</span>
        </span>
      </div>
    </div>
  );
}
