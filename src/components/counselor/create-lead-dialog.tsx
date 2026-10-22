"use client";

import * as React from "react";
import { useState } from "react";
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
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvText(text);
      }
    };
    reader.readAsText(file);
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

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setBulkFeedback(null);

    if (!csvText.trim()) {
      setErrorMsg("Please paste CSV data or candidate rows.");
      return;
    }

    const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
    const leadsToImport: Array<{
      fullName: string;
      phone: string;
      email?: string;
      city?: string;
      courseName?: string;
      source?: LeadSource;
      notes?: string;
    }> = [];

    for (const line of lines) {
      // Ignore header row if present
      if (line.toLowerCase().startsWith("name") || line.toLowerCase().startsWith("full name")) {
        continue;
      }
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        const rawName = parts[0];
        const rawPh = parts[1].replace(/\D/g, "").slice(-10);
        if (rawName && rawPh.length === 10) {
          leadsToImport.push({
            fullName: rawName,
            phone: rawPh,
            email: parts[2] || undefined,
            courseName: parts[3] || undefined,
            city: parts[4] || "Prayagraj",
            source: LeadSource.BULK_UPLOAD,
            notes: "Uploaded via Bulk Lead Assistant",
          });
        }
      }
    }

    if (leadsToImport.length === 0) {
      setErrorMsg("No valid lead rows found. Format required: Name, Phone (10 digits), Email, Course");
      return;
    }

    bulkMutation.mutate({
      fileName: selectedFileName || "batch_upload.csv",
      leads: leadsToImport,
    });
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
          ) : (
            /* Bulk CSV Import Tab */
            <form onSubmit={handleBulkSubmit} className="space-y-3 pt-1">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold flex items-center gap-1.5 text-slate-900">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Upload CSV File or Paste Rows</span>
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 shadow-xs">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedFileName ? "Change File" : "Choose File"}</span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {selectedFileName && (
                  <div className="text-[11px] text-emerald-700 font-medium">
                    Loaded file: {selectedFileName}
                  </div>
                )}
                <p className="text-[11px] text-slate-500">
                  Format: <code>Candidate Name, 10-Digit Phone, Email, Course Title, City</code>
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Example: Rahul Sharma, 9876543210, rahul@gmail.com, Cloud Computing, Prayagraj
                </p>
              </div>

              <textarea
                rows={6}
                placeholder="Rahul Sharma, 9876543210, rahul@example.com, Cloud Computing, Prayagraj&#10;Pooja Verma, 9876543211, pooja@example.com, Full Stack Java, Prayagraj"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

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
                  disabled={bulkMutation.isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={bulkMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {bulkMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Importing Leads...
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
