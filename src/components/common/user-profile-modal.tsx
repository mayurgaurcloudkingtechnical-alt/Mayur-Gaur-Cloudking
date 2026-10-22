"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Printer,
  Camera,
  Upload,
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/trpc/react";
import {
  SoftlabVisitingCardFront,
  SoftlabVisitingCardBack,
} from "@/components/common/softlab-visiting-card";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const utils = api.useUtils();
  const { data: user, isLoading } = api.auth.me.useQuery(undefined, {
    enabled: isOpen,
  });

  const [activeTab, setActiveTab] = useState<"profile" | "visiting_card">("profile");
  const [activeCardSide, setActiveCardSide] = useState<"both" | "front" | "back">("both");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePhotoMutation = api.auth.updateProfilePhoto.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      setUploadSuccess("Profile photo updated successfully!");
      setTimeout(() => setUploadSuccess(null), 4000);
    },
    onError: (err) => {
      setUploadError(err.message || "Failed to update profile photo.");
      setTimeout(() => setUploadError(null), 4000);
    },
  });

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/photo", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Upload failed");
      }

      await updatePhotoMutation.mutateAsync({ avatarUrl: json.url });
    } catch (err: any) {
      setUploadError(err.message || "Could not upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePrintVisitingCard = () => {
    const printArea = document.getElementById("visiting-card-print-stage");
    if (!printArea) return;

    const popup = window.open(
      "",
      "_blank",
      "width=1000,height=750,menubar=no,toolbar=no,scrollbars=yes"
    );
    if (!popup) return;

    popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>SoftLab Global — Professional Visiting Card</title>
  <meta charset="utf-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: landscape; margin: 0; }
    body {
      font-family: ui-sans-serif, system-ui, sans-serif;
      margin: 0;
      padding: 10mm;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .print-btn {
      background: #0052cc;
      color: white;
      font-weight: bold;
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      margin-bottom: 20px;
    }
    .cards-container {
      display: flex;
      flex-direction: row;
      gap: 15mm;
      justify-content: center;
      align-items: center;
    }
    @media print {
      body { background: white; padding: 5mm; }
      .no-print { display: none !important; }
      .cards-container { gap: 10mm; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">🖨️ Print Visiting Card (300+ DPI Landscape)</button>
  </div>
  <div class="cards-container">
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

  const isStaffLevel = user?.roleCode !== "STUDENT";
  const isDirectorLevel = ["SUPER_ADMIN", "DIRECTOR"].includes(user?.roleCode || "");

  const designation =
    user?.staffProfile?.designation ||
    (user?.roleCode === "SUPER_ADMIN"
      ? "Manager / Super Admin"
      : user?.roleCode === "DIRECTOR"
      ? "Director"
      : user?.roleCode?.replace(/_/g, " ") || "Staff Member");

  const phone =
    user?.phone ||
    user?.staffProfile?.personalPhone ||
    "+91 9196596975";

  const email = user?.email || "info@softlabglobal.com";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 text-slate-900">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-400 bg-slate-800 flex items-center justify-center shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-5 h-5 text-emerald-300" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>{user?.firstName} {user?.lastName}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {user?.roleCode?.replace(/_/g, " ")}
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Official SoftLab Global User Account • Security Guarded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isStaffLevel && (
              <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs mr-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`px-3 py-1 rounded font-semibold transition ${
                    activeTab === "profile"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("visiting_card")}
                  className={`px-3 py-1 rounded font-semibold transition flex items-center gap-1.5 ${
                    activeTab === "visiting_card"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Visiting Card</span>
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm font-medium">Loading official profile...</span>
            </div>
          ) : activeTab === "profile" ? (
            <div className="space-y-6">
              {/* Profile Photo Upload Banner */}
              <div className="bg-gradient-to-r from-blue-50 via-emerald-50 to-sky-50 border border-blue-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-200 shrink-0 group">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <UserIcon className="w-12 h-12" />
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>Profile Picture</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Editable
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md">
                      Upload your high-definition passport photo. This photo will be automatically synced with your portal avatar, ID card, and visiting card.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Supports JPG, PNG, WEBP (Max 5MB).
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{user?.avatarUrl ? "Change Profile Picture" : "Upload Profile Picture"}</span>
                  </button>
                  {uploadSuccess && (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{uploadSuccess}</span>
                    </span>
                  )}
                  {uploadError && (
                    <span className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{uploadError}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Read-Only Information Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Official personal records, designations, and contacts are strictly read-only for compliance and institutional security. To update records, please contact HR Operations.
                </span>
              </div>

              {/* Read-Only Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Full Name
                  </label>
                  <p className="text-sm font-extrabold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>

                {/* System Role */}
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Designation &amp; System Role
                  </label>
                  <p className="text-sm font-extrabold text-blue-700">
                    {designation}
                  </p>
                </div>

                {/* Email Address */}
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Official Login Email
                  </label>
                  <p className="text-xs font-mono font-bold text-slate-800 truncate">
                    {user?.email}
                  </p>
                </div>

                {/* Contact Phone */}
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Registered Mobile Number
                  </label>
                  <p className="text-xs font-mono font-bold text-slate-800">
                    {phone}
                  </p>
                </div>

                {/* Staff-specific fields */}
                {user?.staffProfile && (
                  <>
                    <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Employee ID
                      </label>
                      <p className="text-xs font-mono font-bold text-indigo-700">
                        {user.staffProfile.employeeId}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Department &amp; Location
                      </label>
                      <p className="text-xs font-semibold text-slate-800">
                        {user.staffProfile.department} • {user.staffProfile.workLocation}
                      </p>
                    </div>
                  </>
                )}

                {/* Student-specific fields */}
                {user?.studentProfile && (
                  <>
                    <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Student ID
                      </label>
                      <p className="text-xs font-mono font-bold text-emerald-700">
                        {user.studentProfile.studentId}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Center / Campus
                      </label>
                      <p className="text-xs font-semibold text-slate-800">
                        {user.studentProfile.center || "Civil Lines, Prayagraj, UP"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* VISITING CARD TAB */
            <div className="space-y-6">
              {/* Top Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCardSide("both")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeCardSide === "both"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Both Sides
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCardSide("front")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeCardSide === "front"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCardSide("back")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeCardSide === "back"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Back
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handlePrintVisitingCard}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Visiting Card (PDF)</span>
                </button>
              </div>

              {/* Print / Preview Stage */}
              <div
                id="visiting-card-print-stage"
                className="flex flex-wrap items-center justify-center gap-6 py-4 bg-slate-100 rounded-2xl border border-slate-200"
              >
                {(activeCardSide === "both" || activeCardSide === "front") && (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      FRONT SIDE
                    </span>
                    <SoftlabVisitingCardFront
                      fullName={`${user?.firstName} ${user?.lastName}`}
                      designation={designation}
                      phone={phone}
                      email={email}
                      websiteUrl="www.softlabglobal.com"
                      isDirectorLevel={isDirectorLevel}
                    />
                  </div>
                )}

                {(activeCardSide === "both" || activeCardSide === "back") && (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      BACK SIDE
                    </span>
                    <SoftlabVisitingCardBack
                      websiteUrl="www.softlabglobal.com"
                      isDirectorLevel={isDirectorLevel}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
