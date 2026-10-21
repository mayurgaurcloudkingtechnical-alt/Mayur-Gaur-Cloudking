"use client";

import React, { useState, useRef } from "react";
import {
  SoftlabIdCardFront,
  SoftlabIdCardBack,
} from "@/components/common/softlab-id-card";
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
      "SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, Uttar Pradesh - 211011",
    officePhone: initialData.officePhone || "+91 9196596975",
    officeEmail: initialData.officeEmail || "info@softlabglobal.com",
    websiteUrl: initialData.websiteUrl || "www.softlabglobal.com",
    terms: initialData.terms || [
      "1. This ID card is non-transferable.",
      "2. It must be worn at all times within company premises and official events.",
      "3. Loss of this card must be reported immediately to HR.",
      "4. This card is the property of SoftLab Global and must be returned on exit.",
    ],
    signatoryTitle: initialData.signatoryTitle || "Authorised Signatory / Director, SoftLab Global",
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
              {/* CARD FRONT */}
              {(activeSide === "both" || activeSide === "front") && (
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 no-print">
                    FRONT SIDE
                  </span>
                  <SoftlabIdCardFront
                    cardType="STAFF"
                    fullName={formData.fullName}
                    designationOrCourse={formData.designation}
                    idNumber={formData.employeeId}
                    idLabel="Employee ID"
                    departmentOrBatch={formData.department}
                    departmentLabel="Department"
                    contactNo={formData.contactNo}
                    email={formData.email}
                    workLocation={formData.workLocation}
                    photoUrl={photoPreview || formData.photoUrl}
                  />
                </div>
              )}

              {/* CARD BACK */}
              {(activeSide === "both" || activeSide === "back") && (
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 no-print">
                    BACK SIDE
                  </span>
                  <SoftlabIdCardBack
                    aboutText={formData.aboutText}
                    officeAddressLine1="SoftLab Global"
                    officeAddressLine2="4th Floor, 211/C/59, Tata Motors Building,"
                    officeAddressLine3="Near Landmark, Prayagraj,"
                    officeAddressLine4="Uttar Pradesh - 211011, India."
                    officePhone={formData.officePhone}
                    officeEmail={formData.officeEmail}
                    websiteUrl={formData.websiteUrl}
                    terms={formData.terms}
                    signatoryTitle="Authorised Signatory"
                    signatoryOrg="SoftLab Global"
                  />
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
