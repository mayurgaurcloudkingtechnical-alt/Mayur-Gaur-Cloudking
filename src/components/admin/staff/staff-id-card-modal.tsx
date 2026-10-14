"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Printer,
  Download,
  RotateCw,
  Edit3,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Globe,
  Upload,
  CheckCircle,
  FileText,
  Shield,
  QrCode,
  Sparkles,
} from "lucide-react";

export interface StaffIdCardData {
  fullName: string;
  designation: string;
  employeeId: string;
  department: string;
  contactNo: string;
  email: string;
  workLocation: string;
  photoUrl: string;
  aboutText?: string;
  officeAddress?: string;
  officePhone?: string;
  officeEmail?: string;
  websiteUrl?: string;
  terms?: string[];
  signatoryTitle?: string;
}

interface StaffIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<StaffIdCardData>;
}

export function StaffIdCardModal({ isOpen, onClose, initialData }: StaffIdCardModalProps) {
  const [formData, setFormData] = useState<StaffIdCardData>({
    fullName: initialData.fullName || "MAYUR GAUR",
    designation: initialData.designation || "Manager",
    employeeId: initialData.employeeId || "SBG001",
    department: initialData.department || "Administration",
    contactNo: initialData.contactNo || "+91 9196596975",
    email: initialData.email || "mayur.gaur@softlabglobal.com",
    workLocation: initialData.workLocation || "Head Office, Prayagraj",
    photoUrl: initialData.photoUrl || "",
    aboutText:
      initialData.aboutText ||
      "SoftLab Global is a leading IT training and corporate services company, committed to skill development, live projects, placements and building future-ready professionals.",
    officeAddress:
      initialData.officeAddress ||
      "SoftLab Global, 1st Floor, Corporate Tower, Near Civil Lines, Prayagraj, Uttar Pradesh - 211002, India.",
    officePhone: initialData.officePhone || "+91 9196596975",
    officeEmail: initialData.officeEmail || "info@softlabglobal.com",
    websiteUrl: initialData.websiteUrl || "www.softlabglobal.com",
    terms: initialData.terms || [
      "1. This ID card is non-transferable.",
      "2. It must be worn at all times within company premises and official events.",
      "3. Loss of this card must be reported immediately to HR.",
      "4. This card is the property of SoftLab Global and must be returned on exit.",
    ],
    signatoryTitle: initialData.signatoryTitle || "Authorised Signatory / SoftLab Global",
  });

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [activeSide, setActiveSide] = useState<"both" | "front" | "back">("both");
  const [photoPreview, setPhotoPreview] = useState<string>(initialData.photoUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        setFormData((prev) => ({ ...prev, photoUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Print-specific style block for 4K / High-Resolution PVC badge printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-id-card-area,
          #printable-id-card-area * {
            visibility: visible !important;
          }
          #printable-id-card-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: white !important;
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 20mm !important;
            margin: 0 !important;
            padding: 10mm !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Official Staff ID Card Studio & 4K Generator
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Editable
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Front & Back high-definition print template. Every field can be customized before printing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print 4K ID Card
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split-Pane Editor & Live Card Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Column: Live Editable Form (5 Cols) */}
          <div className="lg:col-span-5 p-6 space-y-5 bg-slate-50/60 overflow-y-auto max-h-[82vh]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-blue-600" /> Live Card Customizer
              </span>
              <span className="text-[11px] text-slate-500">Auto-syncs with preview</span>
            </div>

            {/* Photo Upload & Preview */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Staff Passport Photo (Circular)</label>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-100 flex-shrink-0 shadow-sm">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Staff" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Photo
                  </button>
                  <p className="text-[10px] text-slate-500">PNG, JPG or WebP (High Resolution)</p>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Or Photo URL:</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.photoUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, photoUrl: e.target.value });
                    setPhotoPreview(e.target.value);
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Front Card Details */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                Front Side Credentials
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Full Employee Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contactNo}
                    onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Official Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Work Location</label>
                  <input
                    type="text"
                    value={formData.workLocation}
                    onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Back Card Details */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                Back Side Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Office Address</label>
                  <textarea
                    rows={2}
                    value={formData.officeAddress}
                    onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Office Contact</label>
                    <input
                      type="text"
                      value={formData.officePhone}
                      onChange={(e) => setFormData({ ...formData, officePhone: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Office Email</label>
                    <input
                      type="text"
                      value={formData.officeEmail}
                      onChange={(e) => setFormData({ ...formData, officeEmail: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Signatory Title</label>
                  <input
                    type="text"
                    value={formData.signatoryTitle}
                    onChange={(e) => setFormData({ ...formData, signatoryTitle: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Visual ID Card Preview (7 Cols) */}
          <div className="lg:col-span-7 p-6 bg-slate-100 flex flex-col items-center justify-between overflow-y-auto">
            {/* View Switcher */}
            <div className="flex items-center gap-2 mb-4 bg-white p-1 rounded-xl border border-slate-200 shadow-sm no-print">
              <button
                onClick={() => setActiveSide("both")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  activeSide === "both" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Front & Back (Side-by-Side)
              </button>
              <button
                onClick={() => setActiveSide("front")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  activeSide === "front" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Front Only
              </button>
              <button
                onClick={() => setActiveSide("back")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  activeSide === "back" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Back Only
              </button>
            </div>

            {/* Printable & Preview Area */}
            <div
              id="printable-id-card-area"
              className="flex flex-wrap items-center justify-center gap-6 py-2"
            >
              {/* ========================================================================= */}
              {/* CARD FRONT (Exact replica of user's uploaded Image 2) */}
              {/* ========================================================================= */}
              {(activeSide === "both" || activeSide === "front") && (
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 no-print">
                    FRONT SIDE
                  </span>

                  {/* Physical Card Container: 330px x 530px (standard CR80 vertical badge) */}
                  <div className="w-[330px] h-[530px] bg-white rounded-[24px] shadow-2xl border border-slate-300 overflow-hidden relative flex flex-col justify-between font-sans select-none">
                    {/* Metallic Lanyard Clip Hole */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-20 h-5 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 rounded-b-xl border border-slate-400 shadow-sm flex items-center justify-center z-30">
                      <div className="w-10 h-1.5 bg-slate-700/60 rounded-full" />
                    </div>

                    {/* Top Wave & Building Graphic Overlay */}
                    <div className="relative pt-6 px-4 bg-gradient-to-b from-white via-white to-transparent z-10">
                      {/* Logo & Tagline */}
                      <div className="flex items-center justify-center gap-2 pt-2">
                        {/* Stylized SG emblem */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-white font-black text-base shadow-sm border border-white">
                          SG
                        </div>
                        <div className="leading-tight text-center">
                          <h1 className="text-lg font-black tracking-tight text-[#0A2540]">
                            <span className="text-[#059669]">SOFTLAB </span>GLOBAL
                          </h1>
                          <p className="text-[7.5px] font-bold text-[#0A2540] tracking-wider uppercase">
                            LEARN TODAY • CODE TOMORROW • LEAD THE FUTURE
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Upper Dynamic Waves (Blue/Green) & Service Bullet Points */}
                    <div className="relative -mt-2">
                      <svg viewBox="0 0 330 110" className="w-full h-auto drop-shadow-sm">
                        <defs>
                          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="50%" stopColor="#0EA5E9" />
                            <stop offset="100%" stopColor="#1E40AF" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,40 C80,95 240,0 330,55 L330,0 L0,0 Z"
                          fill="url(#waveGrad)"
                          opacity="0.9"
                        />
                        <path
                          d="M0,25 C100,85 220,10 330,35 L330,0 L0,0 Z"
                          fill="#059669"
                          opacity="0.4"
                        />
                      </svg>

                      {/* Right-aligned service bullets */}
                      <div className="absolute top-2 right-3 text-right text-[7.5px] font-bold text-slate-800 space-y-0.5 z-10 leading-none tracking-tight">
                        <p>IT TRAINING</p>
                        <p>SKILL DEVELOPMENT</p>
                        <p>LIVE PROJECTS</p>
                        <p>PLACEMENT SUPPORT</p>
                        <p>CORPORATE SERVICES</p>
                      </div>
                    </div>

                    {/* Centered Circular Photo with dual green & blue ring */}
                    <div className="relative -mt-10 flex flex-col items-center z-20">
                      <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-emerald-500 via-sky-400 to-blue-700 shadow-lg">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-2 border-white">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Staff" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                              <User className="w-14 h-14" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Employee Name & Designation */}
                      <div className="mt-2 text-center">
                        <h2 className="text-base font-black text-[#0A2540] uppercase tracking-wide leading-tight">
                          {formData.fullName}
                        </h2>
                        <p className="text-xs font-bold text-blue-900 mt-0.5">{formData.designation}</p>
                      </div>
                    </div>

                    {/* Employee Credentials with Icons & QR Verification */}
                    <div className="px-5 py-1 z-20 flex items-center justify-between gap-2 mt-1">
                      {/* Left side details */}
                      <div className="space-y-1 text-[9.5px] text-slate-700 flex-1 leading-tight font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[9px]">
                            <User className="w-2.5 h-2.5" />
                          </span>
                          <span className="font-semibold text-slate-900 w-20">Employee ID :</span>
                          <span className="font-bold text-slate-900 font-mono">{formData.employeeId}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[9px]">
                            <Building2 className="w-2.5 h-2.5" />
                          </span>
                          <span className="font-semibold text-slate-900 w-20">Department :</span>
                          <span className="font-semibold text-slate-800">{formData.department}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[9px]">
                            <Phone className="w-2.5 h-2.5" />
                          </span>
                          <span className="font-semibold text-slate-900 w-20">Contact No. :</span>
                          <span className="font-semibold text-slate-800">{formData.contactNo}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[9px]">
                            <Mail className="w-2.5 h-2.5" />
                          </span>
                          <span className="font-semibold text-slate-900 w-20">Email :</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[125px]">
                            {formData.email}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[9px]">
                            <MapPin className="w-2.5 h-2.5" />
                          </span>
                          <span className="font-semibold text-slate-900 w-20">Work Location :</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[125px]">
                            {formData.workLocation}
                          </span>
                        </div>
                      </div>

                      {/* Right side QR Code */}
                      <div className="flex flex-col items-center justify-center p-1.5 bg-white border border-slate-300 rounded-lg shadow-sm flex-shrink-0">
                        <div className="w-14 h-14 bg-slate-900 p-1 rounded flex items-center justify-center text-white">
                          <QrCode className="w-12 h-12 text-white" />
                        </div>
                        <span className="text-[6.5px] font-black text-slate-800 uppercase tracking-tighter mt-1">
                          SCAN TO VERIFY
                        </span>
                      </div>
                    </div>

                    {/* Bottom Dynamic Wave + 4 Feature Pillars + URL */}
                    <div className="relative mt-2">
                      <svg viewBox="0 0 330 40" className="w-full h-auto block">
                        <path
                          d="M0,15 C90,0 210,35 330,10 L330,40 L0,40 Z"
                          fill="#0A2540"
                        />
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
                            <p className="text-[6.5px] font-bold tracking-tight text-emerald-400">LEARN TODAY</p>
                          </div>
                          <div>
                            <p className="text-[6.5px] font-bold tracking-tight text-sky-400">&lt;/&gt; CODE TOMORROW</p>
                          </div>
                          <div>
                            <p className="text-[6.5px] font-bold tracking-tight text-amber-400">LEAD THE FUTURE</p>
                          </div>
                          <div>
                            <p className="text-[6.5px] font-bold tracking-tight text-purple-300">EMPOWERING MINDS</p>
                          </div>
                        </div>

                        {/* Bottom URL */}
                        <div className="flex items-center justify-center gap-1 mt-1 text-[9px] font-bold text-slate-200 tracking-wider">
                          <Globe className="w-3 h-3 text-emerald-400" />
                          <span>{formData.websiteUrl}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CARD BACK (Exact replica of user's uploaded Image 2) */}
              {/* ========================================================================= */}
              {(activeSide === "both" || activeSide === "back") && (
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 no-print">
                    BACK SIDE
                  </span>

                  {/* Physical Card Container: 330px x 530px */}
                  <div className="w-[330px] h-[530px] bg-white rounded-[24px] shadow-2xl border border-slate-300 overflow-hidden relative flex flex-col justify-between font-sans select-none">
                    {/* Metallic Lanyard Clip Hole */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-20 h-5 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 rounded-b-xl border border-slate-400 shadow-sm flex items-center justify-center z-30">
                      <div className="w-10 h-1.5 bg-slate-700/60 rounded-full" />
                    </div>

                    {/* Top Logo */}
                    <div className="pt-6 px-4 bg-gradient-to-b from-white via-white to-transparent">
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                          SG
                        </div>
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
                        <p className="text-[8px] text-slate-600 leading-tight font-medium">
                          {formData.aboutText}
                        </p>
                      </div>

                      {/* 4 Feature Badges */}
                      <div className="grid grid-cols-4 gap-1">
                        <div className="bg-blue-50 border border-blue-200 rounded p-1 text-center">
                          <p className="text-[6.5px] font-bold text-blue-900 leading-tight">IT TRAINING & COURSES</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded p-1 text-center">
                          <p className="text-[6.5px] font-bold text-emerald-900 leading-tight">LIVE PROJECTS & INTERN</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded p-1 text-center">
                          <p className="text-[6.5px] font-bold text-amber-900 leading-tight">PLACEMENT SUPPORT</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded p-1 text-center">
                          <p className="text-[6.5px] font-bold text-purple-900 leading-tight">CORPORATE IT SERVICES</p>
                        </div>
                      </div>

                      {/* Section 2: OFFICE ADDRESS */}
                      <div>
                        <div className="inline-block px-3 py-0.5 rounded-full bg-blue-700 text-white text-[8px] font-bold uppercase tracking-wider mb-1">
                          OFFICE ADDRESS
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[8px] text-slate-700 space-y-0.5 leading-tight flex-1">
                            <p className="font-semibold text-slate-900">{formData.officeAddress}</p>
                            <p className="text-slate-600">📞 {formData.officePhone}</p>
                            <p className="text-slate-600">✉️ {formData.officeEmail}</p>
                            <p className="text-slate-600 font-semibold">🌐 {formData.websiteUrl}</p>
                          </div>
                          {/* Location QR */}
                          <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded shadow-sm flex-shrink-0">
                            <div className="w-10 h-10 bg-slate-900 p-0.5 rounded flex items-center justify-center text-white">
                              <QrCode className="w-9 h-9 text-white" />
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
                        <div className="space-y-0.5 text-[7px] text-slate-600 leading-tight">
                          {formData.terms?.map((term, idx) => (
                            <p key={idx}>{term}</p>
                          ))}
                        </div>
                      </div>

                      {/* Authorised Signatory Block */}
                      <div className="flex items-end justify-between pt-1">
                        <div className="text-[7px] text-slate-400">
                          <p>Issued by HR Operations</p>
                          <p className="font-mono">VERIFIED BADGE</p>
                        </div>
                        <div className="text-right">
                          <div className="font-serif italic text-sm text-slate-800 font-bold border-b border-slate-400 pb-0.5 px-2">
                            Mayur Gaur
                          </div>
                          <p className="text-[7.5px] font-bold text-slate-800 mt-0.5">
                            Authorised Signatory
                          </p>
                          <p className="text-[6.5px] font-semibold text-slate-500">SoftLab Global</p>
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

            {/* Bottom Actions Helper */}
            <div className="mt-4 flex items-center justify-between w-full max-w-md pt-2 border-t border-slate-200 no-print">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                4K Ready: 300+ DPI Vector SVG
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-4 h-4" /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
