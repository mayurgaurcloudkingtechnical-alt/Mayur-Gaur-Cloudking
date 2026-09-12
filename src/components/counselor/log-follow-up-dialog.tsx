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
import { Label } from "@/components/ui/label";
import { FollowUpType, LeadStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";

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
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState<LeadStatus>(currentStatus);
  const [nextDate, setNextDate] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const logMutation = api.crm.logFollowUp.useMutation({
    onSuccess: () => {
      setNotes("");
      setNextDate("");
      setErrorMsg(null);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (err: { message?: string }) => {
      setErrorMsg(err.message || "Failed to log interaction.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setErrorMsg("Please enter notes summarizing the interaction.");
      return;
    }

    logMutation.mutate({
      leadId,
      type,
      notes: notes.trim(),
      newStatus,
      nextFollowUpDate: nextDate ? new Date(nextDate) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Log Interaction — {leadName}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Record details of a phone call, WhatsApp exchange, counseling meeting, or status update.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="rounded bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Interaction Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FollowUpType)}
                className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900"
              >
                <option value={FollowUpType.CALL}>Phone Call</option>
                <option value={FollowUpType.MESSAGE}>Message / WhatsApp</option>
                <option value={FollowUpType.COUNSELLING_SESSION}>Counseling Session</option>
                <option value={FollowUpType.NOTE}>Internal Note</option>
                <option value={FollowUpType.STATUS_CHANGE}>Status Update</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Pipeline Status</Label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900"
              >
                {Object.values(LeadStatus).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Next Follow-Up Date (Optional)
            </Label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Interaction Summary <span className="text-red-500">*</span>
            </Label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Candidate discussed batch timings, requested fee structure, confirmed attendance for Saturday demo..."
              required
              className="flex w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={logMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={logMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
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
      </div>
    </Dialog>
  );
}
