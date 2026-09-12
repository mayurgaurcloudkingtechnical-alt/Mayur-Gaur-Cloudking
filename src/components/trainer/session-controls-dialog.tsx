"use client";

import * as React from "react";
import { api } from "@/lib/trpc/react";
import { ClassSessionStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Save, AlertCircle, CheckCircle2 } from "lucide-react";

interface SessionControlsDialogProps {
  session: {
    id: string;
    title: string;
    scheduledAt: Date | string;
    status: ClassSessionStatus;
    statusReason?: string | null;
    topicCovered?: string | null;
    agendaNotes?: string | null;
  };
  courseModules?: { id: string; title: string; lessons: { id: string; title: string }[] }[];
  onClose: () => void;
  onSuccess?: () => void;
}

export function SessionControlsDialog({
  session,
  courseModules = [],
  onClose,
  onSuccess,
}: SessionControlsDialogProps) {
  const utils = api.useUtils();
  const [status, setStatus] = React.useState<ClassSessionStatus>(session.status);
  const [statusReason, setStatusReason] = React.useState<string>(session.statusReason || "");
  const [topicCovered, setTopicCovered] = React.useState<string>(session.topicCovered || "");
  const [agendaNotes, setAgendaNotes] = React.useState<string>(session.agendaNotes || "");
  const [coveredLessonId, setCoveredLessonId] = React.useState<string>("");
  const [rescheduleDate, setRescheduleDate] = React.useState<string>(
    new Date(session.scheduledAt).toISOString().slice(0, 16)
  );

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const mutation = api.schedule.updateSessionDelivery.useMutation({
    onSuccess: () => {
      utils.trainer.getBatchWorkspace.invalidate();
      utils.schedule.listByBatch.invalidate();
      utils.trainer.getDashboard.invalidate();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => {
      setErrorMessage(err.message || "Failed to update session delivery controls.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if ((status === "CANCELLED" || status === "RESCHEDULED") && !statusReason.trim()) {
      setErrorMessage(`Please provide a documented reason for marking the session as ${status.toLowerCase()}.`);
      return;
    }

    mutation.mutate({
      id: session.id,
      status,
      statusReason: statusReason.trim() || undefined,
      topicCovered: topicCovered.trim() || undefined,
      agendaNotes: agendaNotes.trim() || undefined,
      rescheduledAt: status === "RESCHEDULED" ? new Date(rescheduleDate) : undefined,
      coveredLessonId: coveredLessonId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Session Delivery Controls
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 line-clamp-1">
                {session.title}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4 text-xs">
            {errorMessage && (
              <div className="rounded-md bg-rose-50 p-2.5 text-rose-700 flex items-center gap-2 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Session Delivery Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(["SCHEDULED", "COMPLETED", "RESCHEDULED", "CANCELLED"] as ClassSessionStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`py-1.5 px-2 rounded text-xs font-semibold border transition-all ${
                      status === s
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {status === "RESCHEDULED" && (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Date & Time (Within Batch Period)</label>
                <input
                  type="datetime-local"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            )}

            {(status === "CANCELLED" || status === "RESCHEDULED") && (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Documented Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={2}
                  placeholder={`Document reason for ${status.toLowerCase()} session...`}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Topic / Curriculum Covered</label>
              <input
                type="text"
                value={topicCovered}
                onChange={(e) => setTopicCovered(e.target.value)}
                placeholder="e.g. Module 3 Lecture & Live Coding"
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {courseModules.length > 0 && (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Link Covered Curriculum Lesson</label>
                <select
                  value={coveredLessonId}
                  onChange={(e) => setCoveredLessonId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Optional: Link Lesson --</option>
                  {courseModules.map((mod) => (
                    <optgroup key={mod.id} label={mod.title}>
                      {mod.lessons.map((les) => (
                        <option key={les.id} value={les.id}>
                          {les.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Internal Faculty Notes / Agenda</label>
              <textarea
                value={agendaNotes}
                onChange={(e) => setAgendaNotes(e.target.value)}
                rows={2}
                placeholder="Notes for faculty or student instructions..."
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </CardContent>

          <div className="border-t border-slate-100 p-4 bg-slate-50 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={mutation.isPending} className="text-xs font-semibold">
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {mutation.isPending ? "Saving..." : "Update Session"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
