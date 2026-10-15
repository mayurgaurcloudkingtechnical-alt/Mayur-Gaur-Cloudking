"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/react";
import { LeadStatus } from "@prisma/client";
import { CheckCircle2, XCircle, Clock, Sparkles, Filter, ShieldCheck, Tag } from "lucide-react";

interface LeadQualificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    fullName: string;
    phone: string;
    email?: string | null;
    status: LeadStatus;
    pipelineStage?: string | null;
    serviceCategory?: string | null;
    purchaseTimeline?: string | null;
    qualificationReason?: string | null;
    disqualificationReason?: string | null;
    source?: string | null;
    campaignName?: string | null;
  } | null;
  onSuccess?: () => void;
}

export function LeadQualificationDialog({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: LeadQualificationDialogProps) {
  const [status, setStatus] = useState<LeadStatus>(LeadStatus.QUALIFIED);
  const [pipelineStage, setPipelineStage] = useState<"COURSE_ADMISSIONS" | "BOSSE_DPGU" | "BUSINESS_SERVICES">(
    "COURSE_ADMISSIONS"
  );
  const [qualificationReason, setQualificationReason] = useState("");
  const [disqualificationReason, setDisqualificationReason] = useState("");
  const [purchaseTimeline, setPurchaseTimeline] = useState("IMMEDIATE");
  const [serviceCategory, setServiceCategory] = useState("IT_COURSES");
  const [nextFollowUpDays, setNextFollowUpDays] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const utils = api.useUtils();

  useEffect(() => {
    if (lead) {
      setStatus(lead.status || LeadStatus.QUALIFIED);
      if (
        lead.pipelineStage === "COURSE_ADMISSIONS" ||
        lead.pipelineStage === "BOSSE_DPGU" ||
        lead.pipelineStage === "BUSINESS_SERVICES"
      ) {
        setPipelineStage(lead.pipelineStage);
      } else {
        setPipelineStage("COURSE_ADMISSIONS");
      }
      setQualificationReason(lead.qualificationReason || "");
      setDisqualificationReason(lead.disqualificationReason || "");
      setPurchaseTimeline(lead.purchaseTimeline || "IMMEDIATE");
      setServiceCategory(lead.serviceCategory || "IT_COURSES");
      setNotes("");
      setFeedback(null);
    }
  }, [lead]);

  const updateMutation = api.crm.updateLeadQualification.useMutation({
    onSuccess: () => {
      utils.crm.listLeads.invalidate();
      if (lead?.id) {
        utils.crm.getLeadDetails.invalidate({ leadId: lead.id });
      }
      utils.crm.getStats.invalidate();
      if (onSuccess) onSuccess();
      onOpenChange(false);
    },
    onError: (err) => {
      setFeedback(err.message || "Failed to update qualification status");
    },
  });

  if (!lead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    let nextFollowUpDate: Date | null = null;
    if (nextFollowUpDays > 0) {
      const d = new Date();
      d.setDate(d.getDate() + nextFollowUpDays);
      nextFollowUpDate = d;
    }

    updateMutation.mutate({
      leadId: lead.id,
      status,
      pipelineStage,
      qualificationReason: status === LeadStatus.QUALIFIED ? qualificationReason || "Qualified candidate by counselor" : undefined,
      disqualificationReason: status === LeadStatus.DISQUALIFIED ? disqualificationReason || "Not suitable" : undefined,
      purchaseTimeline,
      serviceCategory,
      nextFollowUp: nextFollowUpDate,
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white p-6 rounded-2xl shadow-2xl border border-slate-200">
        <DialogHeader className="space-y-1 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <span>Lead Qualification & Pipeline Routing</span>
            </DialogTitle>
            <Badge variant="outline" className="text-xs font-mono">
              {lead.source || "CRM Lead"}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Qualify, route to appropriate team pipeline, and schedule automated next interaction.
          </DialogDescription>
        </DialogHeader>

        {/* Prospect Header Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">{lead.fullName}</span>
            <span className="font-mono text-slate-600">{lead.phone}</span>
          </div>
          {lead.campaignName && (
            <div className="text-[11px] text-slate-500 font-mono truncate">
              Campaign: <span className="text-slate-800 font-semibold">{lead.campaignName}</span>
            </div>
          )}
        </div>

        {feedback && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {feedback}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Target Pipeline Stage */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">
              Assigned Pipeline Stage & Department
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPipelineStage("COURSE_ADMISSIONS")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  pipelineStage === "COURSE_ADMISSIONS"
                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-400 font-bold"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="text-xs font-bold">Course Admissions</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Admissions Counselors</div>
              </button>

              <button
                type="button"
                onClick={() => setPipelineStage("BOSSE_DPGU")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  pipelineStage === "BOSSE_DPGU"
                    ? "border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-400 font-bold"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="text-xs font-bold">BOSSE & University</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Education Desk</div>
              </button>

              <button
                type="button"
                onClick={() => setPipelineStage("BUSINESS_SERVICES")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  pipelineStage === "BUSINESS_SERVICES"
                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-400 font-bold"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="text-xs font-bold">Business Services</div>
                <div className="text-[10px] text-slate-500 mt-0.5">BD Managers</div>
              </button>
            </div>
          </div>

          {/* Lead Status Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">Qualification Status</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: LeadStatus.QUALIFIED, label: "Qualified", bg: "bg-emerald-600 text-white" },
                { val: LeadStatus.INTERESTED, label: "Interested", bg: "bg-indigo-600 text-white" },
                { val: LeadStatus.CONTACTED, label: "Contacted", bg: "bg-blue-600 text-white" },
                { val: LeadStatus.DISQUALIFIED, label: "Disqualified", bg: "bg-rose-600 text-white" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.val}
                  onClick={() => setStatus(item.val)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all ${
                    status === item.val
                      ? item.bg + " shadow-sm ring-2 ring-slate-400"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason input based on status */}
          {status === LeadStatus.QUALIFIED && (
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Qualification Criterion / Reason</Label>
              <select
                value={qualificationReason}
                onChange={(e) => setQualificationReason(e.target.value)}
                className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
              >
                <option value="Meets eligibility & budget requirements">Meets eligibility & budget requirements</option>
                <option value="Urgent admission seeker for upcoming batch">Urgent admission seeker for upcoming batch</option>
                <option value="Verified student prospect with parent consent">Verified student prospect with parent consent</option>
                <option value="Graduate looking for placement & career transition">Graduate looking for placement & career transition</option>
                <option value="Verified B2B / Enterprise Decision Maker">Verified B2B / Enterprise Decision Maker</option>
              </select>
            </div>
          )}

          {status === LeadStatus.DISQUALIFIED && (
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Disqualification Reason</Label>
              <select
                value={disqualificationReason}
                onChange={(e) => setDisqualificationReason(e.target.value)}
                className="w-full h-8 px-2 border border-rose-300 rounded-lg text-xs bg-white text-rose-900"
              >
                <option value="Budget constraint / Can not afford fees">Budget constraint / Can not afford fees</option>
                <option value="Invalid contact details / Non-responsive">Invalid contact details / Non-responsive</option>
                <option value="Location mismatch / Outside operational radius">Location mismatch / Outside operational radius</option>
                <option value="Under-age / Ineligible academic profile">Under-age / Ineligible academic profile</option>
                <option value="Accidental submission / Did not intend to submit">Accidental submission / Did not intend to submit</option>
                <option value="Competitor or spam enquiry">Competitor or spam enquiry</option>
              </select>
            </div>
          )}

          {/* Purchase Timeline & Service Category Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Purchase Timeline</Label>
              <select
                value={purchaseTimeline}
                onChange={(e) => setPurchaseTimeline(e.target.value)}
                className="w-full h-8 px-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
              >
                <option value="IMMEDIATE">Immediate (1-3 Days)</option>
                <option value="NEXT_7_DAYS">Within 7 Days</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="NEXT_BATCH">Next Month / Next Batch</option>
                <option value="FUTURE_INQUIRY">Future Exploration (60+ Days)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Service Category</Label>
              <Input
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value)}
                placeholder="e.g. IT_COURSES, BOSSE_12TH, SOFTWARE"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Next Follow Up Presets */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700">Next Scheduled Interaction</Label>
            <div className="flex gap-2">
              {[
                { days: 1, label: "Tomorrow" },
                { days: 3, label: "In 3 Days" },
                { days: 7, label: "Next Week" },
                { days: 0, label: "No Auto-Schedule" },
              ].map((p) => (
                <button
                  type="button"
                  key={p.days}
                  onClick={() => setNextFollowUpDays(p.days)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold border transition ${
                    nextFollowUpDays === p.days
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Counselor Internal Notes */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700">Counselor / Telecaller Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Candidate inquired about placement record and fee EMI options..."
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{updateMutation.isPending ? "Updating..." : "Save Qualification"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
