"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Eye,
  Printer,
  X,
  Loader2,
  Lock,
  KeyRound,
  GraduationCap,
} from "lucide-react";

interface ResendWelcomePostcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId?: string;
  studentProfileId?: string;
  onSuccess?: () => void;
}

export function ResendWelcomePostcardDialog({
  open,
  onOpenChange,
  applicationId,
  studentProfileId,
  onSuccess,
}: ResendWelcomePostcardDialogProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "whatsapp" | "history">("preview");
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelWhatsApp, setChannelWhatsApp] = useState(true);
  const [credentialMode, setCredentialMode] = useState<"KEEP_EXISTING" | "GENERATE_TEMPORARY">("KEEP_EXISTING");
  const [confirmReset, setConfirmReset] = useState(false);
  const [resultSuccess, setResultSuccess] = useState<{
    emailSent: boolean;
    whatsappSent: boolean;
    resetPasswordApplied: boolean;
    channel: string;
    maskedEmail: string;
    maskedPhone: string;
    managementBcc: string;
    dispatchedAt: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const utils = api.useUtils();

  // 1. Fetch dispatch status query
  const crmStatusQuery = api.crm.getAdmissionDispatchStatus.useQuery(
    { applicationId: applicationId || "" },
    { enabled: open && Boolean(applicationId) }
  );

  const adminStatusQuery = api.admin.getStudentDispatchStatus.useQuery(
    { studentProfileId: studentProfileId || "" },
    { enabled: open && Boolean(studentProfileId) && !applicationId }
  );

  const statusData = applicationId ? crmStatusQuery.data : adminStatusQuery.data;
  const isStatusLoading = applicationId ? crmStatusQuery.isLoading : adminStatusQuery.isLoading;

  // 2. Fetch live preview
  const crmPreviewQuery = api.crm.previewWelcomePostcard.useQuery(
    {
      applicationId: applicationId || "",
      credentialMode,
    },
    { enabled: open && Boolean(applicationId) }
  );

  const adminPreviewQuery = api.admin.previewWelcomePostcard.useQuery(
    {
      studentProfileId: studentProfileId || "",
      credentialMode,
    },
    { enabled: open && Boolean(studentProfileId) && !applicationId }
  );

  const previewData = applicationId ? crmPreviewQuery.data : adminPreviewQuery.data;
  const isPreviewLoading = applicationId ? crmPreviewQuery.isLoading : adminPreviewQuery.isLoading;

  // 3. Mutations for dispatch
  const crmResendMutation = api.crm.resendWelcomePostcard.useMutation({
    onSuccess: (res) => {
      setResultSuccess(res);
      setErrorMsg(null);
      utils.crm.getAdmissionDispatchStatus.invalidate({ applicationId });
      utils.crm.listApplications.invalidate();
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to resend welcome postcard.");
    },
  });

  const adminResendMutation = api.admin.resendStudentWelcomePostcard.useMutation({
    onSuccess: (res) => {
      setResultSuccess(res);
      setErrorMsg(null);
      utils.admin.getStudentDispatchStatus.invalidate({ studentProfileId });
      utils.admin.getStudentDetails.invalidate({ id: studentProfileId || "" });
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to resend student welcome postcard.");
    },
  });

  const isPending = crmResendMutation.isPending || adminResendMutation.isPending;

  const handleDispatch = () => {
    setErrorMsg(null);
    if (!channelEmail && !channelWhatsApp) {
      setErrorMsg("Please select at least one delivery channel (Email or WhatsApp).");
      return;
    }

    if (credentialMode === "GENERATE_TEMPORARY" && !confirmReset) {
      setErrorMsg("Please check the confirmation box to authorize resetting the student's password.");
      return;
    }

    const channel = channelEmail && channelWhatsApp ? "BOTH" : channelEmail ? "EMAIL" : "WHATSAPP";
    const resetPassword = credentialMode === "GENERATE_TEMPORARY";

    if (applicationId) {
      crmResendMutation.mutate({
        applicationId,
        channel,
        resetPassword,
      });
    } else if (studentProfileId) {
      adminResendMutation.mutate({
        studentProfileId,
        channel,
        resetPassword,
      });
    }
  };

  const handleClose = () => {
    setResultSuccess(null);
    setErrorMsg(null);
    setCredentialMode("KEEP_EXISTING");
    setConfirmReset(false);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99990] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div
        className="fixed inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Student Welcome Postcard & LMS Credentials</span>
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px] px-2 py-0.5">
                  Permanent Dispatch
                </Badge>
              </h2>
              <p className="text-xs text-slate-300">
                Official institutional admission confirmation, curriculum onboarding, and portal access
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Recipient & Current Status Banner */}
          {isStatusLoading ? (
            <div className="flex items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-200">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mr-2" />
              <span className="text-sm font-medium text-slate-600">Loading student admission status...</span>
            </div>
          ) : statusData ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{statusData.studentName}</span>
                    <Badge variant="outline" className="font-mono text-xs bg-white text-emerald-700 border-emerald-300">
                      {statusData.studentId || statusData.applicationNumber}
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Program: <strong className="text-slate-800">{statusData.courseTitle}</strong>
                    {statusData.specialization ? ` (${statusData.specialization})` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {statusData.accountStatus === "WELCOME_SENT" ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold text-xs flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Welcome Sent</span>
                    </Badge>
                  ) : statusData.accountStatus === "ACCOUNT_CREATED_NOT_SENT" ? (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-semibold text-xs flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      <span>Account Active • Welcome Not Dispatched</span>
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-200 text-slate-700 font-semibold text-xs">
                      Account Pending
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium">
                    Resend Available
                  </Badge>
                </div>
              </div>

              {/* Masked Contact details & counselor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-[11px] text-slate-400 block">Verified Student Email</span>
                    <strong className="text-slate-800 font-mono">{statusData.maskedEmail}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-[11px] text-slate-400 block">WhatsApp / Calling Number</span>
                    <strong className="text-slate-800 font-mono">{statusData.maskedPhone}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-[11px] text-slate-400 block">Enrolling Counselor</span>
                    <strong className="text-slate-800">{statusData.counselorName || "Admissions Desk"}</strong>
                  </div>
                </div>
              </div>

              {statusData.lastDispatchedAt && (
                <p className="text-[11px] text-slate-500 pt-1">
                  Last Dispatched:{" "}
                  <strong>{new Date(statusData.lastDispatchedAt).toLocaleString("en-IN")}</strong>
                  {statusData.lastChannel && (
                    <span>
                      {" "}via <strong className="text-slate-700">{statusData.lastChannel}</strong>
                    </span>
                  )}
                </p>
              )}
            </div>
          ) : null}

          {/* Success Banner */}
          {resultSuccess && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-emerald-950 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>Student Welcome Materials Dispatched Successfully!</span>
              </div>
              <p className="text-xs text-emerald-800">
                Official admission welcome postcard and login instructions have been delivered.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                  <Mail className="h-3.5 w-3.5 text-emerald-600" />
                  Email: {resultSuccess.emailSent ? "Delivered" : "Skipped"} ({resultSuccess.maskedEmail})
                </span>
                <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                  WhatsApp: {resultSuccess.whatsappSent ? "Delivered" : "Skipped"} ({resultSuccess.maskedPhone})
                </span>
                <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-slate-600">
                  Management BCC: {resultSuccess.managementBcc}
                </span>
                {resultSuccess.resetPasswordApplied && (
                  <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
                    New Temporary Password Dispatched
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Controls: Channels & Credential Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Channel Selection */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Delivery Channels</span>
                </Label>
                <span className="text-[11px] text-slate-400">Select target channels</span>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={channelEmail}
                    onChange={(e) => setChannelEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-600" />
                      Email Postcard
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Rich HTML branded postcard with curriculum details & BCC to management
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={channelWhatsApp}
                    onChange={(e) => setChannelWhatsApp(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                      WhatsApp Access Alert
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Direct WhatsApp message with portal link & official student coordinates
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Credential Safety Architecture */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Credential Handling</span>
                </Label>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                  Safe Policy
                </Badge>
              </div>

              <div className="space-y-2">
                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    credentialMode === "KEEP_EXISTING"
                      ? "bg-emerald-50/60 border-emerald-300"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="credentialMode"
                    value="KEEP_EXISTING"
                    checked={credentialMode === "KEEP_EXISTING"}
                    onChange={() => {
                      setCredentialMode("KEEP_EXISTING");
                      setConfirmReset(false);
                    }}
                    className="mt-0.5 h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900 block">
                      Send Login Instructions (Preserve Password)
                    </span>
                    <span className="text-[11px] text-slate-600 leading-relaxed block mt-0.5">
                      Recommended for active students. Dispatches welcome details and portal links without altering their existing password.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    credentialMode === "GENERATE_TEMPORARY"
                      ? "bg-amber-50/70 border-amber-300"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="credentialMode"
                    value="GENERATE_TEMPORARY"
                    checked={credentialMode === "GENERATE_TEMPORARY"}
                    onChange={() => setCredentialMode("GENERATE_TEMPORARY")}
                    className="mt-0.5 h-4 w-4 border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                      <KeyRound className="h-3 w-3 text-amber-700" />
                      Reset & Generate New Temporary Password
                    </span>
                    <span className="text-[11px] text-slate-600 leading-relaxed block mt-0.5">
                      Explicit reset. Generates a new secure temporary password, hashes it with bcrypt, and sends it to the student.
                    </span>
                  </div>
                </label>

                {credentialMode === "GENERATE_TEMPORARY" && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg space-y-2 mt-2">
                    <label className="flex items-start gap-2 cursor-pointer text-xs text-amber-900 font-medium">
                      <input
                        type="checkbox"
                        checked={confirmReset}
                        onChange={(e) => setConfirmReset(e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                      />
                      <span>
                        I authorize resetting the current password for{" "}
                        <strong>{statusData?.studentName || "this student"}</strong> and issuing new credentials.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs for Preview & History */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 pt-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "preview"
                      ? "border-emerald-600 text-emerald-800 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Email Postcard Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("whatsapp")}
                  className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "whatsapp"
                      ? "border-emerald-600 text-emerald-800 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp Message Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "history"
                      ? "border-emerald-600 text-emerald-800 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Delivery History ({statusData?.dispatchHistory?.length || 0})</span>
                </button>
              </div>

              {activeTab === "preview" && previewData && (
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      printWindow.document.write(previewData.postcardHtml);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => printWindow.print(), 250);
                    }
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 mb-1"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  <span>Print Postcard</span>
                </button>
              )}
            </div>

            {/* Tab 1: Rendered HTML Email Postcard */}
            {activeTab === "preview" && (
              <div className="p-4 bg-slate-100 flex justify-center max-h-[420px] overflow-y-auto">
                {isPreviewLoading ? (
                  <div className="p-8 flex items-center justify-center text-slate-500 text-xs">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Generating live postcard preview...
                  </div>
                ) : previewData ? (
                  <div className="w-full max-w-2xl bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
                    <div
                      dangerouslySetInnerHTML={{ __html: previewData.postcardHtml }}
                      className="p-2"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Preview not available.</p>
                )}
              </div>
            )}

            {/* Tab 2: Formatted WhatsApp Message Preview */}
            {activeTab === "whatsapp" && (
              <div className="p-6 bg-slate-100 flex justify-center max-h-[420px] overflow-y-auto">
                {isPreviewLoading ? (
                  <div className="p-8 flex items-center justify-center text-slate-500 text-xs">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Generating WhatsApp preview...
                  </div>
                ) : previewData ? (
                  <div className="w-full max-w-md bg-[#e5ddd5] p-4 rounded-2xl shadow-inner border border-slate-300">
                    <div className="bg-white rounded-lg p-3.5 shadow-sm text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed border-l-4 border-emerald-600">
                      {previewData.whatsappMessageText}
                    </div>
                    <div className="mt-2 text-right text-[11px] text-slate-500 flex items-center justify-end gap-1">
                      <span>WhatsApp Cloud API Standard Format</span>
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Preview not available.</p>
                )}
              </div>
            )}

            {/* Tab 3: Dispatch & Timeline Audit History */}
            {activeTab === "history" && (
              <div className="p-4 max-h-[420px] overflow-y-auto space-y-3">
                {statusData?.dispatchHistory && statusData.dispatchHistory.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {statusData.dispatchHistory.map((item) => (
                      <div key={item.id} className="p-3 bg-white hover:bg-slate-50/80 transition-colors text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 font-semibold">{item.title}</strong>
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.createdAt).toLocaleString("en-IN")}
                          </span>
                        </div>
                        {item.summary && (
                          <p className="text-slate-600 text-[11px] leading-relaxed">{item.summary}</p>
                        )}
                        {item.metadata && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                            {item.metadata.channel && (
                              <Badge variant="outline" className="text-[10px] bg-slate-50">
                                Channel: {item.metadata.channel}
                              </Badge>
                            )}
                            {item.metadata.actorName && (
                              <Badge variant="outline" className="text-[10px] bg-slate-50">
                                Staff: {item.metadata.actorName} ({item.metadata.actorRole || "CRM"})
                              </Badge>
                            )}
                            {item.metadata.resetPasswordApplied && (
                              <Badge className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                                Password Reset Applied
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No past dispatch events recorded for this student record.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {credentialMode === "GENERATE_TEMPORARY" ? (
              <span className="text-amber-800 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                New temporary password will be generated & dispatched
              </span>
            ) : (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Current student password preserved (safe dispatch)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleDispatch}
              disabled={isPending || (!channelEmail && !channelWhatsApp)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Dispatching Postcard...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Postcard Now</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
