"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/trpc/react";
import { PhoneCall, CheckCircle2, X } from "lucide-react";
import { CANONICAL_DISPOSITIONS } from "@/config/dispositions.config";

interface CallyzerDispositionModalProps {
  lead: any;
  callDurationSeconds?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function CallyzerDispositionModal({
  lead,
  callDurationSeconds = 60,
  onClose,
  onSuccess,
}: CallyzerDispositionModalProps) {
  const [disposition, setDisposition] = useState("INTERESTED");
  const [callStatus, setCallStatus] = useState<"CONNECTED" | "BUSY" | "NO_ANSWER" | "FAILED">("CONNECTED");
  const [duration, setDuration] = useState(callDurationSeconds || 60);
  const [notes, setNotes] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const logCallMutation = api.callyzer.logCallActivity.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to save call disposition");
    },
  });

  const handleSave = () => {
    setErrorMsg("");
    const contactName = lead?.fullName || lead?.name || "Prospective Student";
    const contactPhone = lead?.phone || "";

    if (!contactPhone) {
      setErrorMsg("Lead phone number is missing");
      return;
    }

    logCallMutation.mutate({
      leadId: lead?.id,
      contactName,
      contactPhone,
      callType: "OUTGOING",
      callStatus,
      disposition,
      durationSeconds: Number(duration),
      notes: notes.trim() || undefined,
      nextFollowUpDate: nextFollowUp ? new Date(nextFollowUp) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Save Call Record & Disposition
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 flex justify-between items-center">
          <div>
            <p className="font-semibold text-slate-900">{lead?.fullName || lead?.name || "Student"}</p>
            <p className="text-slate-500">{lead?.phone || "No phone number"}</p>
          </div>
          {lead?.status && (
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
              {lead.status}
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="mt-4 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Call Outcome</label>
              <select
                value={callStatus}
                onChange={(e) => setCallStatus(e.target.value as any)}
                className="w-full mt-1 h-9 text-xs border border-slate-300 rounded-lg px-2.5 bg-white font-medium text-slate-800"
              >
                <option value="CONNECTED">Connected</option>
                <option value="BUSY">Busy</option>
                <option value="NO_ANSWER">No Answer</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Talk Time (Seconds)</label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1 h-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Business Disposition</label>
            <select
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
              className="w-full mt-1 h-9 text-xs border border-slate-300 rounded-lg px-2.5 bg-white font-medium text-slate-800"
            >
              {CANONICAL_DISPOSITIONS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} — {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Next Follow-Up Date (Optional)</label>
            <Input
              type="datetime-local"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
              className="mt-1 h-9 text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">Call Notes & Summary</label>
            <textarea
              rows={3}
              placeholder="Record discussion details, student concerns, or next steps..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1 p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={logCallMutation.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={logCallMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-4 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {logCallMutation.isPending ? "Saving..." : "Save Call Record"}
          </Button>
        </div>
      </div>
    </div>
  );
}
