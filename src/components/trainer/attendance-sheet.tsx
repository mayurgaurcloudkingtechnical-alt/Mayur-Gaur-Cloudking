"use client";

import * as React from "react";
import { api } from "@/lib/trpc/react";
import { AttendanceStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Check,
  X,
  Clock,
  HelpCircle,
  Save,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface AttendanceSheetProps {
  sessionId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AttendanceSheet({ sessionId, onClose, onSuccess }: AttendanceSheetProps) {
  const utils = api.useUtils();
  const { data, isLoading } = api.attendance.getSessionRoster.useQuery({ sessionId });

  const [topicCovered, setTopicCovered] = React.useState<string>("");
  const [entries, setEntries] = React.useState<
    Map<string, { status: AttendanceStatus; remark: string }>
  >(new Map());
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<boolean>(false);

  // Initialize entries from server roster
  React.useEffect(() => {
    if (data) {
      setTopicCovered(data.session.topicCovered || "");
      const initialMap = new Map<string, { status: AttendanceStatus; remark: string }>();
      for (const student of data.roster) {
        initialMap.set(student.studentProfileId, {
          status: student.status,
          remark: student.remark || "",
        });
      }
      setEntries(initialMap);
    }
  }, [data]);

  const saveMutation = api.attendance.saveSessionAttendance.useMutation({
    onSuccess: () => {
      setSaveSuccess(true);
      setSaveError(null);
      utils.attendance.getSessionRoster.invalidate({ sessionId });
      utils.trainer.getBatchWorkspace.invalidate();
      utils.trainer.getDashboard.invalidate();
      if (onSuccess) onSuccess();
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err) => {
      setSaveError(err.message || "Failed to save attendance record.");
      setSaveSuccess(false);
    },
  });

  const handleStatusChange = (studentProfileId: string, status: AttendanceStatus) => {
    setEntries((prev) => {
      const next = new Map(prev);
      const curr = next.get(studentProfileId) || { status: AttendanceStatus.PRESENT, remark: "" };
      next.set(studentProfileId, { ...curr, status });
      return next;
    });
  };

  const handleRemarkChange = (studentProfileId: string, remark: string) => {
    setEntries((prev) => {
      const next = new Map(prev);
      const curr = next.get(studentProfileId) || { status: AttendanceStatus.PRESENT, remark: "" };
      next.set(studentProfileId, { ...curr, remark });
      return next;
    });
  };

  const markAll = (status: AttendanceStatus) => {
    if (!data) return;
    setEntries((prev) => {
      const next = new Map(prev);
      for (const student of data.roster) {
        const curr = next.get(student.studentProfileId) || { status, remark: "" };
        next.set(student.studentProfileId, { ...curr, status });
      }
      return next;
    });
  };

  if (isLoading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="w-full max-w-lg p-6 text-center">
          <p className="text-sm text-slate-500">Loading session attendance roster...</p>
        </Card>
      </div>
    );
  }

  const { session, isMarked, markedByName, markedAt, roster } = data;

  // Live Summary calculation
  let presentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let absentCount = 0;

  for (const student of roster) {
    const entry = entries.get(student.studentProfileId);
    const status = entry?.status ?? student.status;
    if (status === AttendanceStatus.PRESENT) presentCount++;
    else if (status === AttendanceStatus.LATE) lateCount++;
    else if (status === AttendanceStatus.EXCUSED) excusedCount++;
    else if (status === AttendanceStatus.ABSENT) absentCount++;
  }

  const total = roster.length;
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  const handleSave = () => {
    setSaveError(null);
    const payload = roster.map((student: any) => ({
      studentId: student.studentProfileId,
      status: entries.get(student.studentProfileId)?.status ?? AttendanceStatus.PRESENT,
      remark: entries.get(student.studentProfileId)?.remark?.trim() || undefined,
    }));

    saveMutation.mutate({
      sessionId: session.id,
      topicCovered: topicCovered.trim() || undefined,
      entries: payload,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white shadow-2xl border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {session.batchCode}
                </span>
                <Badge variant={isMarked ? "success" : "secondary"} className="text-[10px]">
                  {isMarked ? "Verified & Logged" : "Pending Attendance"}
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">{session.title}</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {session.courseTitle} • {session.durationMin} mins • {session.mode}
                {markedByName && markedAt && (
                  <span className="ml-2 text-slate-400">
                    (Last updated by {markedByName} on {new Date(markedAt).toLocaleDateString()})
                  </span>
                )}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Metrics & Topic Covered Bar */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Curriculum Topic / Notes Covered:
              </label>
              <input
                type="text"
                value={topicCovered}
                onChange={(e) => setTopicCovered(e.target.value)}
                placeholder="e.g., React Server Components, Database Migrations, Live Lab..."
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-col justify-end">
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">{presentCount} Present</span>
                  <span className="text-amber-700 font-bold">{lateCount} Late</span>
                  <span className="text-blue-700 font-bold">{excusedCount} Excused</span>
                  <span className="text-rose-700 font-bold">{absentCount} Absent</span>
                </div>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-xs">
                  {attendanceRate}% Rate
                </span>
              </div>
            </div>
          </div>

          {/* Batch Actions */}
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">Active Roster ({roster.length} students)</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAll(AttendanceStatus.PRESENT)}
                className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                Mark All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAll(AttendanceStatus.ABSENT)}
                className="h-7 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                Mark All Absent
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Scrollable Roster Table */}
        <CardContent className="flex-1 overflow-y-auto p-0">
          {roster.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No active students enrolled in this batch cohort.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {roster.map((student: any) => {
                const current = entries.get(student.studentProfileId);
                const status = current?.status ?? student.status;
                const remark = current?.remark ?? "";

                const statusColors: Record<AttendanceStatus, { bg: string; text: string }> = {
                  PRESENT: { bg: "bg-emerald-600 text-white", text: "text-emerald-700" },
                  LATE: { bg: "bg-amber-600 text-white", text: "text-amber-700" },
                  EXCUSED: { bg: "bg-blue-600 text-white", text: "text-blue-700" },
                  ABSENT: { bg: "bg-rose-600 text-white", text: "text-rose-700" },
                };

                return (
                  <div
                    key={student.studentProfileId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {student.studentId}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate">{student.email}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
                        {([
                          AttendanceStatus.PRESENT,
                          AttendanceStatus.LATE,
                          AttendanceStatus.EXCUSED,
                          AttendanceStatus.ABSENT,
                        ] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(student.studentProfileId, st)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold capitalize transition-all ${
                              status === st
                                ? `${statusColors[st].bg} shadow-xs`
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {st.toLowerCase()}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={remark}
                        onChange={(e) => handleRemarkChange(student.studentProfileId, e.target.value)}
                        placeholder="Optional remark..."
                        className="w-full sm:w-36 rounded border border-slate-200 px-2 py-1 text-[11px] text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Footer with save actions and feedback */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Attendance saved successfully!
              </span>
            )}
            {saveError && (
              <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                <AlertCircle className="h-4 w-4" /> {saveError}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1 sm:flex-initial text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex-1 sm:flex-initial text-xs font-semibold"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saveMutation.isPending ? "Saving Record..." : "Save Verified Attendance"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
