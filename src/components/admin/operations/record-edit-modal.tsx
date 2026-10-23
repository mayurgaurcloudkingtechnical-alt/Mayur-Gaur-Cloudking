"use client";

import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit3, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

export interface RecordEditTarget {
  recordType: "SCHEDULED_CLASS" | "LIVE_ATTENDANCE" | "MOCK_INTERVIEW" | "RECRUITER_INTERVIEW" | "YOUTUBE_QUEUE";
  recordId: string;
  title: string;
  currentValues: Record<string, any>;
}

interface RecordEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: RecordEditTarget | null;
  onSuccess?: () => void;
}

export function RecordEditModal({ isOpen, onClose, target, onSuccess }: RecordEditModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [changeReason, setChangeReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Initialize form data when target changes
  React.useEffect(() => {
    if (target) {
      setFormData({ ...target.currentValues });
      setChangeReason("");
      setErrorMsg("");
    }
  }, [target]);

  const editMutation = api.management.editOperationalRecord.useMutation({
    onSuccess: () => {
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  if (!target) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeReason || changeReason.trim().length < 5) {
      setErrorMsg("A documented change reason (at least 5 characters) is required for management audit.");
      return;
    }

    editMutation.mutate({
      recordType: target.recordType,
      recordId: target.recordId,
      changeReason: changeReason.trim(),
      updates: formData,
    });
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-900/50 text-indigo-400 border border-indigo-700/50">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Audited Management Correction
                <Badge variant="outline" className="border-indigo-500 text-indigo-400">
                  {target.recordType}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm mt-0.5">
                Target Record: {target.title} ({target.recordId})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg flex items-start gap-2.5 text-xs text-amber-300">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
            <div>
              <span className="font-semibold">Audit Integrity Requirement:</span> Every correction creates an
              immutable entry in the PostgreSQL audit log preserving the previous snapshot and tracking your user
              identity.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
            {/* Dynamic fields based on record type */}
            {target.recordType === "SCHEDULED_CLASS" && (
              <>
                <div className="col-span-2">
                  <Label className="text-xs text-slate-300">Class Lecture Title</Label>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Status</Label>
                  <select
                    value={formData.status || "SCHEDULED"}
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (LIVE)</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="RESCHEDULED">RESCHEDULED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Scheduled Duration (Minutes)</Label>
                  <Input
                    type="number"
                    value={formData.durationMin || 60}
                    onChange={(e) => handleFieldChange("durationMin", e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-slate-300">Agenda / Session Notes</Label>
                  <Input
                    value={formData.agendaNotes || ""}
                    onChange={(e) => handleFieldChange("agendaNotes", e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
              </>
            )}

            {target.recordType === "LIVE_ATTENDANCE" && (
              <>
                <div>
                  <Label className="text-xs text-slate-300">Attendance Status</Label>
                  <select
                    value={formData.status || "ABSENT"}
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm"
                  >
                    <option value="PRESENT">PRESENT (&gt;= 75%)</option>
                    <option value="PARTIAL">PARTIAL (30% - 74%)</option>
                    <option value="ABSENT">ABSENT (&lt; 30%)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Active Duration (Seconds)</Label>
                  <Input
                    type="number"
                    value={formData.totalDurationSeconds || 0}
                    onChange={(e) => handleFieldChange("totalDurationSeconds", e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
              </>
            )}

            {target.recordType === "MOCK_INTERVIEW" && (
              <>
                <div>
                  <Label className="text-xs text-slate-300">Status</Label>
                  <select
                    value={formData.status || "SCHEDULED"}
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-slate-300">Placement Recommendations</Label>
                  <Input
                    value={formData.recommendations || ""}
                    onChange={(e) => handleFieldChange("recommendations", e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
              </>
            )}

            {target.recordType === "RECRUITER_INTERVIEW" && (
              <>
                <div>
                  <Label className="text-xs text-slate-300">Stage</Label>
                  <select
                    value={formData.stage || "TECHNICAL"}
                    onChange={(e) => handleFieldChange("stage", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm"
                  >
                    <option value="SCREENING">SCREENING</option>
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="MANAGERIAL">MANAGERIAL</option>
                    <option value="FINAL_HR">FINAL_HR</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Selection Decision</Label>
                  <select
                    value={formData.selectionDecision || ""}
                    onChange={(e) => handleFieldChange("selectionDecision", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm"
                  >
                    <option value="">-- Pending Decision --</option>
                    <option value="SELECTED">SELECTED (OFFER EXTENDED)</option>
                    <option value="SHORTLISTED_NEXT_ROUND">SHORTLISTED NEXT ROUND</option>
                    <option value="ON_HOLD">ON HOLD</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </>
            )}

            {target.recordType === "YOUTUBE_QUEUE" && (
              <>
                <div className="col-span-2">
                  <Label className="text-xs text-slate-300">YouTube Video Title</Label>
                  <Input
                    value={formData.videoTitle || ""}
                    onChange={(e) => handleFieldChange("videoTitle", e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Privacy Visibility</Label>
                  <select
                    value={formData.targetPrivacy || "UNLISTED"}
                    onChange={(e) => handleFieldChange("targetPrivacy", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm"
                  >
                    <option value="UNLISTED">UNLISTED</option>
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="PRIVATE">PRIVATE</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Queue Status</Label>
                  <select
                    value={formData.status || "QUEUED"}
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm"
                  >
                    <option value="QUEUED">QUEUED (READY FOR RETRY)</option>
                    <option value="UPLOADING">UPLOADING</option>
                    <option value="FAILED">FAILED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Mandatory Change Reason */}
          <div className="pt-2 border-t border-slate-800">
            <Label className="text-xs font-semibold text-indigo-300">
              Mandatory Management Change Reason *
            </Label>
            <Input
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="e.g. Corrected attendance status following verified medical leave certificate"
              className="bg-slate-800 border-slate-700 text-white mt-1"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Minimum 5 characters. This explanation will be permanently recorded in the institutional audit log.
            </p>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={editMutation.isPending}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={editMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              {editMutation.isPending ? "Applying Correction..." : "Save Audited Correction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
