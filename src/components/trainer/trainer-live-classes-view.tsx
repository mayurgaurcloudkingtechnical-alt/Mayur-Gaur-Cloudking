"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Video,
  Users,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
  Radio,
  Share2,
  FileText,
  ExternalLink,
  Edit,
} from "lucide-react";
import { VirtualClassroomModal } from "@/components/classroom/virtual-classroom-modal";

export function TrainerLiveClassesView() {
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [selectedRosterClassId, setSelectedRosterClassId] = useState<string | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Scheduling Form State
  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [agendaNotes, setAgendaNotes] = useState("");
  const [allowAutoPublishYouTube, setAllowAutoPublishYouTube] = useState(false);

  const utils = api.useUtils();
  const { data: classes = [], isLoading } = api.classroom.getTrainerClasses.useQuery();
  const { data: batches = [] } = api.trainer.listBatches.useQuery();

  const scheduleMutation = api.classroom.scheduleLiveClass.useMutation({
    onSuccess: () => {
      setIsScheduleOpen(false);
      setTitle("");
      setScheduledAt("");
      setAgendaNotes("");
      utils.classroom.getTrainerClasses.invalidate();
    },
    onError: (err) => alert(`Failed to schedule class: ${err.message}`),
  });

  const startSessionMutation = api.classroom.startClassSession.useMutation({
    onSuccess: (_, variables) => {
      setActiveClassId(variables.classId);
      utils.classroom.getTrainerClasses.invalidate();
    },
  });

  const { data: roster = [] } = api.classroom.getClassAttendanceRoster.useQuery(
    { classId: selectedRosterClassId! },
    { enabled: !!selectedRosterClassId }
  );

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !title || !scheduledAt) {
      alert("Please select batch, enter lecture topic, and schedule date/time.");
      return;
    }

    scheduleMutation.mutate({
      batchId,
      title,
      scheduledAt: new Date(scheduledAt),
      durationMin,
      agendaNotes,
      allowAutoPublishYouTube,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Faculty Live Classroom Studio</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Conduct interactive batch-wise lectures, manage multi-participant rooms, track automatic student attendance, and archive recordings.
          </p>
        </div>

        <Button
          onClick={() => setIsScheduleOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-2 px-4 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Live Lecture</span>
        </Button>
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading assigned live classes...</div>
      ) : classes.length === 0 ? (
        <Card className="border-slate-200 shadow-sm text-center p-12">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700 text-sm">No Live Lectures Scheduled</p>
          <p className="text-xs text-slate-500 mt-1">Schedule your next batch lecture above to alert enrolled students.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => {
            const isLive = c.status === "IN_PROGRESS";
            const isCompleted = c.status === "COMPLETED";

            return (
              <Card key={c.id} className="border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                      {c.batch.code}
                    </span>
                    <Badge
                      className={
                        isLive
                          ? "bg-rose-500/10 text-rose-700 border-rose-300 animate-pulse"
                          : isCompleted
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }
                    >
                      {c.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 line-clamp-2">{c.title}</CardTitle>
                  <p className="text-xs text-slate-500 line-clamp-1">{c.batch.course.title}</p>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs">
                  <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{new Date(c.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{c.durationMin} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{c.batch.enrollments.length} Enrolled Batch Students</span>
                    </div>
                  </div>

                  {c.recordings.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-2 text-[11px] border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Lecture Recording:</span>
                      {c.recordings[0].youTubeUrl ? (
                        <a
                          href={c.recordings[0].youTubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-rose-600 hover:underline font-semibold flex items-center gap-1"
                        >
                          YouTube Published <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-emerald-700 font-semibold">Ready in LMS</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    {isCompleted ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRosterClassId(c.id)}
                        className="w-full text-xs font-semibold gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Attendance Roster</span>
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (isLive) {
                              setActiveClassId(c.id);
                            } else {
                              startSessionMutation.mutate({ classId: c.id });
                            }
                          }}
                          className={`flex-1 text-xs font-bold gap-1.5 ${isLive ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isLive ? "Enter Classroom" : "Start Live Class"}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRosterClassId(c.id)}
                          className="text-xs px-2.5"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule Live Lecture Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Schedule Live Batch Lecture</h3>
              <button onClick={() => setIsScheduleOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Assigned Batch *</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-500 bg-white"
                  required
                >
                  <option value="">-- Choose Assigned Batch --</option>
                  {batches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.course?.title || b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lecture Topic / Curriculum Objective *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Next.js App Router Architecture & Server Actions"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date & Time (IST) *</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Minutes) *</label>
                  <input
                    type="number"
                    value={durationMin}
                    onChange={(e) => setDurationMin(parseInt(e.target.value, 10))}
                    min={15}
                    max={360}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Agenda & Learning Materials</label>
                <textarea
                  value={agendaNotes}
                  onChange={(e) => setAgendaNotes(e.target.value)}
                  rows={2}
                  placeholder="Topics, code repos, or prerequisite notes for students..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Auto-Publish to Official YouTube</span>
                  <span className="text-[11px] text-slate-500">
                    Automatically enqueue recording to official channel upon lecture completion
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowAutoPublishYouTube}
                  onChange={(e) => setAllowAutoPublishYouTube(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsScheduleOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={scheduleMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {scheduleMutation.isPending ? "Scheduling..." : "Schedule Lecture"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Roster Drawer */}
      {selectedRosterClassId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Lecture Attendance & Engagement Roster</h3>
                <p className="text-xs text-slate-500">Calculated from server-side session heartbeats</p>
              </div>
              <button
                onClick={() => setSelectedRosterClassId(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
              {roster.length === 0 ? (
                <p className="py-8 text-center text-slate-500">No enrolled students in this batch.</p>
              ) : (
                roster.map((s) => (
                  <div key={s.studentId} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{s.studentName}</span>
                        <span className="font-mono text-[10px] text-slate-400">{s.studentCode}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Duration: {Math.round(s.totalDurationSeconds / 60)} mins</span>
                        <span>•</span>
                        <span>Attendance: {s.attendancePercentage}%</span>
                        {s.isManuallyCorrected && (
                          <span className="text-amber-600 font-semibold">(Manually Adjusted)</span>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={
                        s.status === "PRESENT"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : s.status === "LATE"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <Button size="sm" variant="outline" onClick={() => setSelectedRosterClassId(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Classroom Modal */}
      {activeClassId && (
        <VirtualClassroomModal
          classId={activeClassId}
          onClose={() => {
            setActiveClassId(null);
            utils.classroom.getTrainerClasses.invalidate();
          }}
          isHost={true}
        />
      )}
    </div>
  );
}
