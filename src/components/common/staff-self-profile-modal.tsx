"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  User,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Eye,
  Download,
  X,
  CreditCard,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DocumentPreviewModal } from "./document-preview-modal";
import { formatDate } from "@/lib/utils";

interface StaffSelfProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StaffSelfProfileModal({ isOpen, onClose }: StaffSelfProfileModalProps) {
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const { data: profile, isLoading } = api.staffErp.getMyProfile.useQuery(undefined, {
    enabled: isOpen,
    staleTime: 60000,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {isLoading ? (
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-slate-700" />
              <div className="space-y-2">
                <div className="h-5 bg-slate-700 rounded w-48" />
                <div className="h-3 bg-slate-800 rounded w-32" />
              </div>
            </div>
          ) : profile ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-emerald-400 to-sky-400 shadow-md shrink-0">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-white border border-white">
                    {profile.profilePhoto ? (
                      <img
                        src={profile.profilePhoto}
                        alt={profile.user?.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xl bg-slate-100">
                        {profile.user?.firstName?.[0] || "U"}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-white">
                      {profile.user?.firstName} {profile.user?.lastName}
                    </h2>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                      {profile.employeeId}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-slate-800 text-blue-300 border-slate-700">
                      {profile.user?.roleCode}
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-200 font-medium mt-0.5">{profile.designation}</p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dept: <strong className="text-slate-300">{profile.department}</strong></span>
                    <span>•</span>
                    <span>Location: <strong className="text-slate-300">{profile.workLocation || "Prayagraj Campus"}</strong></span>
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-slate-950">
                  {profile.employmentStatus || (profile.isActive ? "ACTIVE" : "INACTIVE")}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Joined: {profile.joiningDate ? formatDate(profile.joiningDate) : "Institutional Staff"}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Body */}
        {profile && (
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            {/* Live Reporting Manager Banner */}
            <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                    Live Immediate Reporting Manager
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {profile.reportingManager
                      ? `${profile.reportingManager.user.firstName} ${profile.reportingManager.user.lastName}`
                      : "Head Office Direct / Director Desk"}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {profile.reportingManager?.designation || "Director, SoftLab Global"}
                  </p>
                </div>
              </div>

              {profile.reportingManager?.user && (
                <div className="text-left sm:text-right text-xs text-slate-600 space-y-0.5 border-t sm:border-t-0 sm:border-l border-blue-200 pt-2 sm:pt-0 sm:pl-4">
                  <p className="flex items-center sm:justify-end gap-1.5 font-mono">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{profile.reportingManager.user.phone || "+91 9196596975"}</span>
                  </p>
                  <p className="flex items-center sm:justify-end gap-1.5 font-mono">
                    <Mail className="w-3 h-3 text-sky-600" />
                    <span>{profile.reportingManager.user.email}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Contact & Professional Coordinates */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Official Coordinates & Work Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Login / Official Email</span>
                  <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">{profile.user.email}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Personal / Primary Phone</span>
                  <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">{profile.user.phone || profile.personalPhone || "—"}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Assigned Work Shift</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {profile.shift ? `${profile.shift.name} (${profile.shift.startTime} - ${profile.shift.endTime})` : "General Shift (09:30 AM - 06:30 PM)"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Calling Routing Number</span>
                  <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">{profile.user.callingNumber || profile.user.phone || "—"}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">WhatsApp Routing</span>
                  <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">{profile.user.whatsappNumber || profile.user.phone || "—"}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Branch & Location</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{profile.branch || "Prayagraj Main Campus"}</p>
                </div>
              </div>
            </div>

            {/* Uploaded Documents & KYC Certificates */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Official KYC & Uploaded Documents ({profile.documents?.length || 0})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Click any document to view or download
                </span>
              </div>

              {!profile.documents || profile.documents.length === 0 ? (
                <div className="p-6 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50 text-slate-500 text-xs">
                  No verified KYC documents on file. Please contact HR or Administration to upload KYC documents.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl shadow-xs cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 truncate transition">
                            {doc.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[9px] font-mono text-slate-500 border-slate-200">
                              {doc.documentType}
                            </Badge>
                            {doc.isVerified && (
                              <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-2">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Institutional Compliance Notice */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>
                Employee profile and credential details are managed by SoftLab Global Human Resources. To update official credentials, report to your immediate reporting manager.
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            SoftLab Global Enterprise CRM & HRMS
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Document High-Resolution Preview Modal */}
      {selectedDoc && (
        <DocumentPreviewModal
          isOpen={Boolean(selectedDoc)}
          onClose={() => setSelectedDoc(null)}
          document={selectedDoc}
        />
      )}
    </div>
  );
}
