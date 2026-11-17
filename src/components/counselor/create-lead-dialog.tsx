"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { api } from "@/lib/trpc/react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadSource } from "@prisma/client";
import {
  Loader2,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  BookOpen,
  Clock,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { LeadInstantActionDialog, LeadActionTarget } from "./lead-instant-action-dialog";

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (leadId: string) => void;
  onProceedToApplication?: (lead: any) => void;
}

export function CreateLeadDialog({
  open,
  onOpenChange,
  onSuccess,
  onProceedToApplication,
}: CreateLeadDialogProps) {
  const [activeTab, setActiveTab] = useState<"single" | "bulk" | "smart">("single");
  const [smartText, setSmartText] = useState("");
  const [smartParsed, setSmartParsed] = useState<any[]>([]);
  const [smartRequireApproval, setSmartRequireApproval] = useState(true);
  const [smartAssignToId, setSmartAssignToId] = useState("");
  const [smartBusy, setSmartBusy] = useState(false);

  // Single Lead Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Prayagraj");
  const [qualification, setQualification] = useState("");
  const [interestedCourseId, setInterestedCourseId] = useState("");
  const [source, setSource] = useState<LeadSource>(LeadSource.WALK_IN);
  const [qualityScore, setQualityScore] = useState<string>("HOT");
  const [notes, setNotes] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Bulk Upload State
  const [csvText, setCsvText] = useState("");
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Array<{ row: number; reason: string }>>([]);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [activeBatch, setActiveBatch] = useState<{
    id: string;
    batchCode: string;
    status: string;
    totalRows: number;
    processedRows: number;
    createdCount: number;
    duplicateCount: number;
    failedCount: number;
    currentChunk: number;
    totalChunks: number;
    progressPercent: number;
  } | null>(null);

  // Instant Action State
  const [instantLead, setInstantLead] = useState<LeadActionTarget | null>(null);
  const [instantActionOpen, setInstantActionOpen] = useState(false);

  const utils = api.useUtils();
  const { data: courses = [] } = api.crm.listPublicCourses.useQuery();
  const { data: counselors = [] } = api.crm.listCounselors.useQuery();
  const { data: myProfile } = api.crm.getMyCallingProfile.useQuery();

  const createMutation = api.crm.createLead.useMutation({
    onSuccess: (data: any) => {
      setErrorMsg(null);
      utils.crm.listLeads.invalidate();
      utils.crm.getStats.invalidate();
      utils.crm.getPipelineOverview.invalidate();

      const matchedCourse = courses.find((c: any) => c.id === (interestedCourseId || data.lead.interestedCourseId));

      const actionTarget: LeadActionTarget = {
        id: data.lead.id,
        fullName: data.lead.fullName,
        phone: data.lead.phone,
        email: data.lead.email || undefined,
        city: data.lead.city || undefined,
        courseTitle: matchedCourse?.title || "Professional Tech Program",
        rawLead: data.lead,
      };

      // Reset form
      setFullName("");
      setPhone("");
      setEmail("");
      setNotes("");

      if (onSuccess) onSuccess(data.lead.id);

      // Open Instant Action popup with WhatsApp, Calling, and Application Redirect
      onOpenChange(false);
      setInstantLead(actionTarget);
      setInstantActionOpen(true);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to create lead record.");
    },
  });

  const bulkMutation = api.crm.bulkCreateLeads.useMutation({
    onSuccess: (res: any) => {
      utils.crm.listLeads.invalidate();
      utils.crm.getStats.invalidate();
      setRowErrors(res.rowErrors || []);
      const summaryMsg = `Batch [${res.batchCode}]: Created ${res.createdCount} new lead(s), updated ${res.updatedCount} duplicate(s)${
        res.failedCount > 0 ? `, ${res.failedCount} failed row(s)` : ""
      }.`;
      setBulkFeedback(summaryMsg);
      setCsvText("");

      if (res.leads && res.leads.length > 0 && res.failedCount === 0) {
        const firstLead = res.leads[0];
        const actionTarget: LeadActionTarget = {
          id: firstLead.id,
          fullName: firstLead.fullName,
          phone: firstLead.phone,
          email: firstLead.email || undefined,
          city: firstLead.city || undefined,
          courseTitle: "Imported Lead Cohort",
          rawLead: firstLead,
        };
        onOpenChange(false);
        setInstantLead(actionTarget);
        setInstantActionOpen(true);
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to bulk import leads.");
    },
  });

  const parseJsonSafely = async (res: Response) => {
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(`Server returned non-JSON response (${res.status}): ${text.slice(0, 120)}`);
    }
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Request failed with status ${res.status}`);
    }
    return json;
  };

  useEffect(() => {
    if (!activeBatch?.id) return;
    if (!["QUEUED", "PROCESSING"].includes(activeBatch.status)) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/leads/bulk-import?batchId=${encodeURIComponent(activeBatch.id)}`);
        const data = await parseJsonSafely(res);
        if (data?.batch) {
          setActiveBatch(data.batch);
          if (["COMPLETED", "COMPLETED_WITH_ERRORS", "FAILED", "CANCELLED"].includes(data.batch.status)) {
            utils.crm.listLeads.invalidate();
            utils.crm.getStats.invalidate();
            utils.crm.getPipelineOverview.invalidate();
            utils.crm.listImportBatches.invalidate();
            setBulkFeedback(
              `Batch ${data.batch.batchCode} (${data.batch.status}): Created ${data.batch.createdCount}/${data.batch.totalRows} leads in ON_HOLD (${data.batch.duplicateCount || 0} duplicates flagged & preserved, ${data.batch.failedCount || 0} failed).`
            );
            if (Array.isArray(data.batch.errorSummary)) {
              setRowErrors(data.batch.errorSummary);
            }
          }
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to poll import progress.");
      }
    }, 1200);

    return () => clearInterval(timer);
  }, [activeBatch?.id, activeBatch?.status, utils]);

  const handleBatchAction = async (action: "PAUSE" | "RESUME" | "CANCEL" | "RETRY_FAILED") => {
    if (!activeBatch?.id) return;
    if (action === "CANCEL" && !window.confirm("Cancel this bulk import job? Already processed chunks will remain saved.")) {
      return;
    }
    try {
      setErrorMsg(null);
      const res = await fetch("/api/leads/bulk-import", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: activeBatch.id, action }),
      });
      const data = await parseJsonSafely(res);
      if (data?.batch) {
        setActiveBatch((prev) => ({ ...(prev || {}), ...data.batch }));
      }
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to ${action.toLowerCase()} batch.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setSelectedFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    setErrorMsg(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (["csv", "txt", "json"].includes(ext) && file.size <= 512 * 1024) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) setCsvText(text);
      };
      reader.readAsText(file);
    } else {
      setCsvText("");
    }
  };

  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    createMutation.mutate({
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email.trim() || undefined,
      city: city.trim() || undefined,
      qualification: qualification.trim() || undefined,
      interestedCourseId: interestedCourseId || undefined,
      source,
      qualityScore,
      notes: notes.trim() || undefined,
      assignedToId: assignedToId || undefined,
      nextFollowUp: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
    });
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setBulkFeedback(null);
    setRowErrors([]);

    if (!selectedFile && !csvText.trim()) {
      setErrorMsg("Please select a CSV/XLSX/TXT/JSON/PDF file or paste candidate rows.");
      return;
    }

    setIsSubmittingBulk(true);
    try {
      let res: Response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("chunkSize", "500");
        formData.append("targetStatus", "ON_HOLD");
        formData.append("source", "BULK_UPLOAD");
        res = await fetch("/api/leads/bulk-import", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/leads/bulk-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: selectedFileName || "batch_upload.csv",
            rawText: csvText,
            chunkSize: 500,
            targetStatus: "ON_HOLD",
            source: "BULK_UPLOAD",
          }),
        });
      }

      const data = await parseJsonSafely(res);
      if (data?.batch) {
        setActiveBatch(data.batch);
        setBulkFeedback(
          data.message ||
            `Queued ${data.batch.totalRows} leads across ${data.batch.totalChunks} chunks in ON_HOLD.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to start chunked bulk import.");
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleProceedApplication = (lead: LeadActionTarget) => {
    if (onProceedToApplication) {
      onProceedToApplication(lead.rawLead || lead);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <div className="space-y-3 font-sans">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                <span>Add / Upload Enquiry or Lead</span>
              </DialogTitle>
              {myProfile && (
                <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Calling: <strong>{myProfile.callingNumber}</strong>
                </div>
              )}
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Log inquiries, walk-ins, or bulk upload datasets with instant WhatsApp & Calling connectivity.
            </DialogDescription>

            {/* View Switcher: Single vs Bulk Upload */}
            <div className="flex items-center gap-2 pt-2 border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("single")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                  activeTab === "single"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Single Lead Entry
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bulk")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "bulk"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload CSV / Bulk Leads</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("smart")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "smart"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Smart Capture (Any Format)</span>
              </button>
            </div>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          {bulkFeedback && (
            <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{bulkFeedback}</span>
            </div>
          )}

          {activeTab === "single" ? (
            <form onSubmit={handleSubmitSingle} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Candidate Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>Mobile Phone (10 Digits)</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Mail className="h-3 w-3 text-slate-400" />
                    <span>Email Address</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="candidate@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>City / District</span>
                  </Label>
                  <Input
                    placeholder="e.g. Prayagraj"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-slate-400" />
                    <span>Interested Course / Technology</span>
                  </Label>
                  <select
                    value={interestedCourseId}
                    onChange={(e) => setInterestedCourseId(e.target.value)}
                    className="w-full h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">General IT / Multiple Courses</option>
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Lead Source / Channel</Label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as LeadSource)}
                    className="w-full h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={LeadSource.WALK_IN}>Direct / Walk-In</option>
                    <option value={LeadSource.WEBSITE}>Website Inbound</option>
                    <option value={LeadSource.WHATSAPP}>WhatsApp Outreach</option>
                    <option value={LeadSource.AI_CALLING}>AI Calling Direct</option>
                    <option value={LeadSource.REFERRAL}>Student Referral</option>
                    <option value={LeadSource.GOOGLE_ADS}>Google Ads</option>
                    <option value={LeadSource.META_ADS_FB}>Facebook Ads</option>
                    <option value={LeadSource.META_ADS_IG}>Instagram Ads</option>
                    <option value={LeadSource.CAMPUS_DRIVE}>College / Seminar Drive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Counseling Notes / Discussion</Label>
                <textarea
                  rows={2}
                  placeholder="Candidate background, batch timing preference, fee inquiry notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={createMutation.isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving Lead...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Save Lead & Connect Instantly</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : activeTab === "bulk" ? (
            /* Bulk CSV Import Tab */
            <form onSubmit={handleBulkSubmit} className="space-y-3 pt-1">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold flex items-center gap-1.5 text-slate-900">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Upload CSV File or Paste Rows</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const sample = [
                          "Candidate Name,Phone,Email,Course Title,City",
                          "Rahul Sharma,9876543210,rahul@example.com,Cloud Computing,Prayagraj",
                          "Pooja Verma,9876543211,pooja@example.com,Full Stack Development,Prayagraj",
                        ].join("\n");
                        const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "SoftLab_Bulk_Leads_Template.csv";
                        a.click();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-700"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Sample Template</span>
                    </button>
                    <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 shadow-xs">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{selectedFileName ? "Change File" : "Choose File"}</span>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls,.txt,.json,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                {selectedFileName && (
                  <div className="text-[11px] text-emerald-700 font-medium">
                    Loaded file: {selectedFileName} {selectedFile && selectedFile.size > 512 * 1024 ? "(Streamed directly to chunked import engine)" : ""}
                  </div>
                )}
                <p className="text-[11px] text-slate-500">
                  Supports CSV, XLSX, TXT, JSON, PDF (10,000–100,000+ rows, 500/chunk, all duplicates preserved in ON_HOLD).
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Columns: Candidate Name, 10-Digit Phone, Email, Course Title, City, Source, Remarks, Lead Date, Campaign, Original Owner
                </p>
              </div>

              <textarea
                rows={5}
                placeholder="Rahul Sharma, 9876543210, rahul@example.com, Cloud Computing, Prayagraj&#10;Pooja Verma, 9876543211, pooja@example.com, Full Stack Java, Prayagraj"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              {activeBatch && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Job {activeBatch.batchCode} — {activeBatch.status}
                    </span>
                    <span className="font-mono text-slate-600">
                      {activeBatch.processedRows}/{activeBatch.totalRows} ({activeBatch.progressPercent}%) • Chunk {activeBatch.currentChunk}/{activeBatch.totalChunks}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${activeBatch.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-slate-700">
                    <span>Staged (ON_HOLD): <strong>{activeBatch.createdCount}</strong></span>
                    <span>Duplicates Flagged: <strong>{activeBatch.duplicateCount}</strong></span>
                    <span>Failed: <strong>{activeBatch.failedCount}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["QUEUED", "PROCESSING"].includes(activeBatch.status) && (
                      <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleBatchAction("PAUSE")}>
                        Pause
                      </Button>
                    )}
                    {activeBatch.status === "PAUSED" && (
                      <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleBatchAction("RESUME")}>
                        Resume
                      </Button>
                    )}
                    {["QUEUED", "PROCESSING", "PAUSED"].includes(activeBatch.status) && (
                      <Button type="button" size="sm" variant="destructive" className="h-7 text-[11px]" onClick={() => handleBatchAction("CANCEL")}>
                        Cancel Import
                      </Button>
                    )}
                    {activeBatch.failedCount > 0 && (
                      <>
                        <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleBatchAction("RETRY_FAILED")}>
                          Retry Failed ({activeBatch.failedCount})
                        </Button>
                        <a
                          href={`/api/leads/bulk-import?batchId=${encodeURIComponent(activeBatch.id)}&action=failed_csv`}
                          className="inline-flex items-center px-2.5 h-7 rounded-md border border-slate-300 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Download Failed CSV
                        </a>
                      </>
                    )}
                  </div>
                </div>
              )}

              {rowErrors.length > 0 && (
                <div className="max-h-28 overflow-y-auto rounded-lg bg-red-50 p-2 text-[11px] text-red-700 border border-red-200 space-y-1">
                  <div className="font-bold">Failed Rows ({rowErrors.length}):</div>
                  {rowErrors.map((err, idx) => (
                    <div key={idx}>Row {err.row}: {err.reason}</div>
                  ))}
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmittingBulk}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingBulk}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmittingBulk ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Starting Chunked Import...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Import Leads to Pipeline</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> AI Any-Format Lead Capture
                </div>
                <p className="text-[11px] text-indigo-700">
                  Paste data in ANY format (WhatsApp chat messages, Excel copy-paste, raw notes, JSON, or mixed phone lists). AI automatically extracts Name, Phone, Email, Course & City.
                </p>
              </div>
              <textarea
                rows={5}
                placeholder="Paste any format here... e.g.:&#10;Rohan Gupta 9876543210 interested in Data Science from Lucknow&#10;Ananya Singh | 9123456789 | Python | ananya@gmail.com"
                value={smartText}
                onChange={(e) => setSmartText(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-mono"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={smartRequireApproval}
                    onChange={(e) => setSmartRequireApproval(e.target.checked)}
                  />
                  Stage as ON_HOLD (Wait for Manager / Super Admin Approval)
                </label>
                <Button
                  type="button"
                  size="sm"
                  disabled={smartBusy || !smartText.trim()}
                  onClick={async () => {
                    setSmartBusy(true);
                    setErrorMsg(null);
                    setBulkFeedback(null);
                    try {
                      const res = await fetch("/api/leads/smart-import", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "parse", rawText: smartText }),
                      });
                      const d = await res.json();
                      if (d.success) setSmartParsed(d.rows || []);
                      else setErrorMsg(d.error || "Could not parse data.");
                    } finally {
                      setSmartBusy(false);
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  {smartBusy ? "Analyzing..." : "AI Auto-Extract Leads"}
                </Button>
              </div>

              {smartParsed.length > 0 && (
                <div className="space-y-2 border rounded-lg p-2.5 bg-slate-50">
                  {smartParsed.some((r: any) => r.isDuplicate) && (
                    <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded px-2.5 py-1.5 text-[11px] font-semibold">
                      {smartParsed.filter((r: any) => r.isDuplicate).length} potential duplicate record(s) detected. No records have been removed.
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Extracted {smartParsed.length} Lead(s)
                    </span>
                    <select
                      value={smartAssignToId}
                      onChange={(e) => setSmartAssignToId(e.target.value)}
                      className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-700"
                    >
                      <option value="">Unassigned (Distribute Later)</option>
                      {counselors.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName} ({c.roleCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="max-h-40 overflow-y-auto text-[11px] divide-y divide-slate-200 bg-white rounded border">
                    {smartParsed.map((r: any, i: number) => (
                      <div key={i} className="px-2 py-1.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {r.isDuplicate && (
                            <label className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-semibold">
                              <input
                                type="checkbox"
                                checked={Boolean(r._skip)}
                                onChange={(e) => {
                                  const next = [...smartParsed];
                                  next[i] = { ...next[i], _skip: e.target.checked };
                                  setSmartParsed(next);
                                }}
                              />
                              Skip
                            </label>
                          )}
                          <span className="font-semibold text-slate-800">{r.fullName}</span>
                          {r.isDuplicate && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                              {r.duplicateReason || "Duplicate"}
                              {r.existingLead ? ` (Existing: ${r.existingLead.fullName} / ${r.existingLead.ownerName})` : ""}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-emerald-700">{r.phone}</span>
                        <span className="text-slate-500 truncate max-w-[120px]">{r.course}</span>
                        <span className="text-slate-400">{r.city}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSmartParsed([])}
                      className="text-xs"
                    >
                      Cancel Import
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={smartBusy}
                      onClick={async () => {
                        setSmartBusy(true);
                        setErrorMsg(null);
                        try {
                          const skipIndices = smartParsed
                            .map((r: any, idx: number) => (r._skip ? idx : -1))
                            .filter((idx: number) => idx >= 0);
                          const res = await fetch("/api/leads/smart-import", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "commit",
                              rows: smartParsed,
                              skipIndices,
                              requireApproval: smartRequireApproval,
                              assignToId: smartAssignToId || undefined,
                            }),
                          });
                          const d = await res.json();
                          if (d.success) {
                            setBulkFeedback(d.message);
                            setSmartParsed([]);
                            setSmartText("");
                            utils.crm.listLeads.invalidate();
                            utils.crm.getStats.invalidate();
                          } else {
                            setErrorMsg(d.error || "Failed to store leads.");
                          }
                        } finally {
                          setSmartBusy(false);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      Upload All {smartParsed.filter((r: any) => !r._skip).length} Leads
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>

      {/* Instant Action Dialog with 1-Click WhatsApp, Calling, and Redirect to Application */}
      <LeadInstantActionDialog
        open={instantActionOpen}
        onOpenChange={setInstantActionOpen}
        lead={instantLead}
        counselorProfile={myProfile}
        onProceedToApplication={handleProceedApplication}
        onAddAnother={() => {
          setInstantActionOpen(false);
          onOpenChange(true);
        }}
      />
    </>
  );
}
