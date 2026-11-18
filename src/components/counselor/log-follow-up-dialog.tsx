"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { api } from "@/lib/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FollowUpType, LeadStatus } from "@prisma/client";
import { Loader2, CheckCircle2, AlertCircle, PhoneCall, Calendar } from "lucide-react";
import { CANONICAL_DISPOSITIONS, resolveCanonicalDisposition } from "@/config/dispositions.config";

interface LogFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  currentStatus: LeadStatus;
  onSuccess?: () => void;
}

export function LogFollowUpDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  currentStatus,
  onSuccess,
}: LogFollowUpDialogProps) {
  const [type, setType] = useState<FollowUpType>(FollowUpType.CALL);
  const [disposition, setDisposition] = useState<string>("INTERESTED");
  const [newStatus, setNewStatus] = useState<LeadStatus>(
    currentStatus === LeadStatus.NEW ? LeadStatus.INTERESTED : currentStatus
  );
  const [nextDate, setNextDate] = useState("");
  const [durationSeconds, setDurationSeconds] = useState<number>(60);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const utils = api.useUtils();

  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setNewStatus(currentStatus === LeadStatus.NEW ? LeadStatus.INTERESTED : currentStatus);
    }
  }, [open, currentStatus]);

  const selectedDispositionMeta = resolveCanonicalDisposition(disposition);

  const handleDispositionChange = (code: string) => {
    setDisposition(code);
    const meta = resolveCanonicalDisposition(code);
    setNewStatus(meta.mappedLeadStatus);
    if (!meta.requiresFollowUp) {
      setNextDate("");
    }
  };

  const logMutation = api.crm.logFollowUp.useMutation({
    onSuccess: async () => {
      setSuccessMsg("Interaction & disposition saved and synchronized across CRM timelines.");
      await Promise.all([
        utils.crm.getLeadDetails.invalidate({ leadId }),
        utils.omnichannel.getCustomerTimeline.invalidate({ leadId }),
        utils.crm.listLeads.invalidate(),
        utils.crm.getStats.invalidate(),
      ]);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setNotes("");
        setNextDate("");
        setErrorMsg(null);
        setSuccessMsg(null);
        onOpenChange(false);
      }, 450);
    },
    onError: (err: { message?: string }) => {
      setErrorMsg(err.message || "Failed to log interaction.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (logMutation.isPending) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!notes.trim() || notes.trim().length < 2) {
      setErrorMsg("Please enter notes summarizing the interaction (minimum 2 characters).");
      return;
    }

    let parsedDate: Date | null = null;
    if (nextDate) {
      const candidate = new Date(nextDate);
      if (isNaN(candidate.getTime())) {
        setErrorMsg("Please enter a valid Next Follow-Up Date.");
        return;
      }
      parsedDate = candidate;
    }

    logMutation.mutate({
      leadId,
      type,
      disposition,
      durationSeconds: type === FollowUpType.CALL ? Math.max(0, Number(durationSeconds) || 0) : 0,
      notes: notes.trim(),
      newStatus,
      nextFollowUpDate: parsedDate,
    });
  };

  const initialOptions = CANONICAL_DISPOSITIONS.filter((d) => d.category === "INITIAL_CONTACT");
  const engagedOptions = CANONICAL_DISPOSITIONS.filter((d) => d.category === "ENGAGED_INTEREST");
  const counsellingOptions = CANONICAL_DISPOSITIONS.filter((d) => d.category === "COUNSELLING_ADMISSION");
  const terminalOptions = CANONICAL_DISPOSITIONS.filter((d) => d.category === "TERMINAL_CLOSED");

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (logMutation.isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-xl p-6 bg-white rounded-2xl border border-slate-200 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 leading-snug">
            <PhoneCall className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Log Interaction — {leadName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
            Record phone call disposition, WhatsApp exchange, counseling meeting, or follow-up schedule. Synchronizes automatically with CRM History, 360° Timeline, and Call Intelligence.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="interaction-type" className="text-xs font-semibold text-slate-700 block">
                Interaction Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="interaction-type"
                value={type}
                onChange={(e) => setType(e.target.value as FollowUpType)}
                className="flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={FollowUpType.CALL}>Phone Call</option>
                <option value={FollowUpType.MESSAGE}>Message / WhatsApp</option>
                <option value={FollowUpType.COUNSELLING_SESSION}>Counseling Session</option>
                <option value={FollowUpType.NOTE}>Internal Note</option>
                <option value={FollowUpType.STATUS_CHANGE}>Status Update</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="disposition-select" className="text-xs font-semibold text-slate-700 block">
                Call / Interaction Disposition <span className="text-red-500">*</span>
              </Label>
              <select
                id="disposition-select"
                value={disposition}
                onChange={(e) => handleDispositionChange(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <optgroup label="1. Program Interest & Engagement">
                  {engagedOptions.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} — {d.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="2. Call Outcomes & Follow-Up">
                  {initialOptions.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} — {d.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="3. Counselling & Admission Stage">
                  {counsellingOptions.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} — {d.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="4. Terminal / Closed Dispositions">
                  {terminalOptions.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} — {d.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="pipeline-status" className="text-xs font-semibold text-slate-700 block">
                Pipeline Status
              </Label>
              <select
                id="pipeline-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                className="flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.values(LeadStatus).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="next-followup-date" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>
                  Next Follow-Up Date{" "}
                  {selectedDispositionMeta.requiresFollowUp ? "(Recommended)" : "(Optional)"}
                </span>
              </Label>
              <input
                id="next-followup-date"
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {type === FollowUpType.CALL && (
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-semibold text-slate-800 block">
                  Manual Call Duration (Seconds)
                </span>
                <span className="text-[11px] text-slate-500">
                  Logged as MANUAL_LOG unless initiated via verified carrier line.
                </span>
              </div>
              <input
                type="number"
                min={0}
                max={7200}
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Math.max(0, Number(e.target.value)))}
                className="h-8 w-28 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-mono text-slate-900"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="interaction-notes" className="text-xs font-semibold text-slate-700 block">
              Interaction Summary / Notes <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="interaction-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Candidate discussed batch timings, requested fee structure, confirmed attendance for Saturday demo..."
              required
              className="flex w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={logMutation.isPending}
              className="text-xs h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={logMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-5"
            >
              {logMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Interaction"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
