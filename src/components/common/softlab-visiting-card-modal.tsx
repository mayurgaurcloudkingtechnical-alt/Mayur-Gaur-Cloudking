"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Printer,
  Sparkles,
  Edit3,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Building2,
  CheckCircle2,
} from "lucide-react";
import {
  SoftlabVisitingCardFront,
  SoftlabVisitingCardBack,
  SoftlabVisitingCardProps,
} from "./softlab-visiting-card";

export interface VisitingCardData extends SoftlabVisitingCardProps {
  roleCode?: string;
}

interface SoftlabVisitingCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<VisitingCardData>;
}

export function SoftlabVisitingCardModal({
  isOpen,
  onClose,
  initialData,
}: SoftlabVisitingCardModalProps) {
  const [formData, setFormData] = useState<VisitingCardData>({
    fullName: initialData.fullName || "HARSH SHUKLA",
    designation:
      initialData.designation ||
      (initialData.roleCode === "DIRECTOR"
        ? "Director"
        : initialData.roleCode === "SUPER_ADMIN"
        ? "Director / Managing Partner"
        : initialData.roleCode === "RECRUITER"
        ? "Corporate Talent Partner"
        : initialData.roleCode === "FRANCHISE_PARTNER"
        ? "Authorized Franchise Partner"
        : initialData.roleCode === "INSTITUTION_ADMIN" ||
          initialData.roleCode === "INSTITUTION_OFFICER"
        ? "Institutional Relations Officer"
        : "Senior Consultant"),
    phone: initialData.phone || "+91 9196596975",
    email: initialData.email || "info@softlabglobal.com",
    websiteUrl: initialData.websiteUrl || "www.softlabglobal.com",
    officeAddressLine1:
      initialData.officeAddressLine1 || "4th Floor, 211/C/59, Tata Motors Building,",
    officeAddressLine2:
      initialData.officeAddressLine2 || "M.G. Marg, Civil Lines, Prayagraj,",
    officeAddressLine3:
      initialData.officeAddressLine3 || "Uttar Pradesh - 211011",
    qrDestinationUrl:
      initialData.qrDestinationUrl || "https://www.softlabglobal.com",
    isDirectorLevel:
      initialData.isDirectorLevel ??
      ["SUPER_ADMIN", "DIRECTOR"].includes(initialData.roleCode || ""),
  });

  const [activeTab, setActiveTab] = useState<"preview" | "customize">("preview");
  const [activeSide, setActiveSide] = useState<"both" | "front" | "back">("both");

  if (!isOpen) return null;

  const handlePrint = () => {
    const printArea = document.getElementById("slg-visiting-card-print-target");
    if (!printArea) return;

    const popup = window.open(
      "",
      "_blank",
      "width=1100,height=800,menubar=no,toolbar=no,scrollbars=yes"
    );
    if (!popup) return;

    popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>SoftLab Global — Professional Visiting Card (${formData.fullName})</title>
  <meta charset="utf-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: landscape; margin: 0; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 12mm;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-bar {
      margin-bottom: 24px;
      display: flex;
      gap: 12px;
    }
    .print-btn {
      background: #0052cc;
      color: white;
      font-weight: 700;
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .cards-row {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 16mm;
      justify-content: center;
      align-items: center;
    }
    @media print {
      body { background: white; padding: 6mm; }
      .no-print { display: none !important; }
      .cards-row { gap: 10mm; }
    }
  </style>
</head>
<body>
  <div class="no-print print-bar">
    <button class="print-btn" onclick="window.print()">🖨️ Print Visiting Card (300 DPI Landscape)</button>
  </div>
  <div class="cards-row">
    ${printArea.innerHTML}
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
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Corporate Visiting Card Studio</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CR-80 Landscape
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Official SoftLab Global Visiting Card for {formData.fullName} ({formData.designation})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs mr-2">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 rounded font-semibold transition ${
                  activeTab === "preview"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Card Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("customize")}
                className={`px-3 py-1 rounded font-semibold transition flex items-center gap-1.5 ${
                  activeTab === "customize"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Card Details</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "preview" ? (
            <div className="space-y-6">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Display:</span>
                  <button
                    type="button"
                    onClick={() => setActiveSide("both")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeSide === "both"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Both Sides
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSide("front")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeSide === "front"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Front Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSide("back")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeSide === "back"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Back Side
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("customize")}
                    className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Visiting Card (PDF)</span>
                  </button>
                </div>
              </div>

              {/* Preview Target Canvas */}
              <div
                id="slg-visiting-card-print-target"
                className="flex flex-wrap items-center justify-center gap-8 py-8 bg-slate-100 rounded-2xl border border-slate-200"
              >
                {(activeSide === "both" || activeSide === "front") && (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span>FRONT SIDE (CR-80 LANDSCAPE)</span>
                    </span>
                    <SoftlabVisitingCardFront
                      fullName={formData.fullName}
                      designation={formData.designation}
                      phone={formData.phone}
                      email={formData.email}
                      websiteUrl={formData.websiteUrl}
                      officeAddressLine1={formData.officeAddressLine1}
                      officeAddressLine2={formData.officeAddressLine2}
                      officeAddressLine3={formData.officeAddressLine3}
                      qrDestinationUrl={formData.qrDestinationUrl}
                      isDirectorLevel={formData.isDirectorLevel}
                    />
                  </div>
                )}

                {(activeSide === "both" || activeSide === "back") && (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span>BACK SIDE (BRAND IDENTITY &amp; SOCIALS)</span>
                    </span>
                    <SoftlabVisitingCardBack
                      websiteUrl={formData.websiteUrl}
                      qrDestinationUrl={formData.qrDestinationUrl}
                      isDirectorLevel={formData.isDirectorLevel}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CUSTOMIZATION / DETAILS FORM */
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900">
                <strong>Corporate Visiting Card Generator:</strong> Edit or fine-tune card fields before printing or generating PDF. These settings apply to the card render.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, fullName: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Designation / Title</span>
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, designation: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Contact Number</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Official Email</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>Website Address</span>
                  </label>
                  <input
                    type="text"
                    value={formData.websiteUrl}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, websiteUrl: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>QR Destination URL</span>
                  </label>
                  <input
                    type="text"
                    value={formData.qrDestinationUrl}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, qrDestinationUrl: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Office Address Lines</span>
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={formData.officeAddressLine1}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, officeAddressLine1: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Line 1"
                    />
                    <input
                      type="text"
                      value={formData.officeAddressLine2}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, officeAddressLine2: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Line 2"
                    />
                    <input
                      type="text"
                      value={formData.officeAddressLine3}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, officeAddressLine3: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Line 3"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="directorLevelCheck"
                    checked={formData.isDirectorLevel}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, isDirectorLevel: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="directorLevelCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Director / Executive Script Tagline Style ("Building Future-Ready Professionals")
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Done &amp; View Preview</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
