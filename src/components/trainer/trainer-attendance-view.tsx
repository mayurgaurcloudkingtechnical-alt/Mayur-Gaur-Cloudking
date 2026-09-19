"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/trpc/react";
import { Input } from "@/components/ui/input";
import { AttendanceStatus } from "@prisma/client";
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Save,
  Users,
  Search,
  BookOpen,
  Video,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TrainerAttendanceView() {
  const searchParams = useSearchParams();
  const queryBatchId = searchParams.get("batchId");

  const [centre, setCentre] = useState("Softlab Global");
  const [selectedBatchId, setSelectedBatchId] = useState<string>(queryBatchId || "");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [searchStudent, setSearchStudent] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"attendance" | "sessions">("attendance");

  // Local student status map: { studentProfileId: AttendanceStatus }
  const [studentStatusMap, setStudentStatusMap] = useState<Record<string, AttendanceStatus>>({});

  // 1. Fetch batches
  const { data: batchesData, isLoading: isBatchesLoading } = api.batch.list.useQuery({ pageSize: 50 });
  const batches = batchesData?.batches || [];

  // Auto-select batch from param or first batch
  useEffect(() => {
    if (queryBatchId) {
      setSelectedBatchId(queryBatchId);
    } else if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, queryBatchId, selectedBatchId]);

  // 2. Fetch workspace for selected batch and date
  const {
    data: workspace,
    isLoading: isWorkspaceLoading,
    refetch: refetchWorkspace,
  } = api.attendance.getBatchAttendanceWorkspace.useQuery(
    {
      batchId: selectedBatchId,
      date: attendanceDate,
    },
    { enabled: !!selectedBatchId }
  );

  // 3. Fetch trainer's live sessions for the sessions tab
  const { data: scheduledSessions } = api.schedule.listTrainerSchedule.useQuery();

  // Initialize/sync studentStatusMap when workspace loads
  useEffect(() => {
    if (workspace?.students) {
      const initialMap: Record<string, AttendanceStatus> = {};
      workspace.students.forEach((s) => {
        initialMap[s.studentProfileId] = s.status;
      });
      setStudentStatusMap(initialMap);
    }
    if (workspace?.topicCovered && !selectedTopic) {
      setSelectedTopic(workspace.topicCovered);
    }
  }, [workspace]);

  // Save attendance mutation
  const utils = api.useUtils();
  const saveMutation = api.attendance.saveBatchAttendanceDirect.useMutation({
    onSuccess: () => {
      setSaveSuccessMsg("Attendance successfully recorded into system database!");
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      refetchWorkspace();
      utils.attendance.getBatchAttendanceStats.invalidate();
    },
  });

  const handleStatusChange = (studentProfileId: string, status: AttendanceStatus) => {
    setStudentStatusMap((prev) => ({
      ...prev,
      [studentProfileId]: status,
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!workspace?.students) return;
    const updated: Record<string, AttendanceStatus> = {};
    workspace.students.forEach((s) => {
      updated[s.studentProfileId] = status;
    });
    setStudentStatusMap(updated);
  };

  const handleSaveAttendance = () => {
    if (!selectedBatchId || !workspace?.students) return;
    const entries = workspace.students.map((s) => ({
      studentId: s.studentProfileId,
      status: studentStatusMap[s.studentProfileId] || AttendanceStatus.PRESENT,
    }));

    saveMutation.mutate({
      batchId: selectedBatchId,
      date: attendanceDate,
      topicCovered: selectedTopic || workspace.topicCovered,
      entries,
    });
  };

  // Filter students based on search input
  const filteredStudents = useMemo(() => {
    if (!workspace?.students) return [];
    if (!searchStudent.trim()) return workspace.students;
    const q = searchStudent.toLowerCase();
    return workspace.students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q)
    );
  }, [workspace, searchStudent]);

  // Live tally
  const summaryCounts = useMemo(() => {
    const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    if (!workspace?.students) return counts;
    workspace.students.forEach((s) => {
      const status = studentStatusMap[s.studentProfileId] || AttendanceStatus.PRESENT;
      if (status in counts) {
        counts[status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [workspace, studentStatusMap]);

  const batchMeta = workspace?.batch;
  const formattedStartDate = batchMeta?.startDate
    ? new Date(batchMeta.startDate).toLocaleDateString("en-GB")
    : "15/01/2026";
  const formattedEndDate = batchMeta?.endDate
    ? new Date(batchMeta.endDate).toLocaleDateString("en-GB")
    : "15/04/2026";

  return (
    <div className="space-y-4 pb-24">
      {/* Page Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#0088cc]" />
            Faculty Attendance Register
          </h1>
          <p className="text-xs text-slate-500">
            Real-time candidate attendance tracking, roll-call logs, and session curriculum
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "attendance"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>Attendance Sheet</span>
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "sessions"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Live Class Schedule</span>
          </button>
        </div>
      </div>

      {activeTab === "attendance" && (
        <>
          {/* Top Filter Card matching Attendance.pdf (Pages 1 & 2) */}
          <div className="bg-white rounded border border-slate-200 p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Centre</label>
                <select
                  value={centre}
                  onChange={(e) => setCentre(e.target.value)}
                  className="block w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm focus:border-[#0088cc] focus:outline-none"
                >
                  <option value="Softlab Global">Softlab Global</option>
                  <option value="Main Campus">Main Campus</option>
                  <option value="Online">Online Centre</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="block w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm focus:border-[#0088cc] focus:outline-none"
                >
                  {batches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Topic</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="block w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm focus:border-[#0088cc] focus:outline-none"
                >
                  {workspace?.topics?.map((topic: string, i: number) => (
                    <option key={i} value={topic}>
                      {topic}
                    </option>
                  )) || <option value="Core Module & Practical Lab">Core Module & Practical Lab</option>}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => refetchWorkspace()}
                  className="flex-1 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs h-8 px-4 rounded uppercase tracking-wide transition-colors shadow-sm"
                >
                  FILTER
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (batches.length > 0) setSelectedBatchId(batches[0].id);
                    setAttendanceDate(new Date().toISOString().slice(0, 10));
                  }}
                  className="bg-[#2c3e50] hover:bg-[#1a252f] text-white font-bold text-xs h-8 px-4 rounded uppercase tracking-wide transition-colors shadow-sm"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* 4 Metadata Cards matching Attendance.pdf */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded border border-slate-200 p-3.5 shadow-sm">
              <span className="text-slate-400 text-[11px] font-medium block">Title</span>
              <p className="text-slate-800 font-bold text-xs mt-0.5 truncate" title={batchMeta ? `${batchMeta.courseTitle} - ${batchMeta.name}` : "Course Title"}>
                {batchMeta ? `${batchMeta.courseTitle} - ${batchMeta.name}` : "Web Development Cohort"}
              </p>
            </div>

            <div className="bg-white rounded border border-slate-200 p-3.5 shadow-sm">
              <span className="text-slate-400 text-[11px] font-medium block">Dates</span>
              <p className="text-slate-800 font-bold text-xs mt-0.5">
                {formattedStartDate} - {formattedEndDate}
              </p>
            </div>

            <div className="bg-white rounded border border-slate-200 p-3.5 shadow-sm">
              <span className="text-slate-400 text-[11px] font-medium block">Time</span>
              <p className="text-slate-800 font-bold text-xs mt-0.5">
                10:00 AM - 01:00 PM
              </p>
            </div>

            <div className="bg-white rounded border border-slate-200 p-3.5 shadow-sm">
              <span className="text-slate-400 text-[11px] font-medium block">Days</span>
              <p className="text-slate-800 font-bold text-xs mt-0.5">
                Mon, Tue, Wed, Thu, Fri
              </p>
            </div>
          </div>

          {/* Success Notification Banner */}
          {saveSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Attendance Control & Bulk Action Bar matching Attendance.pdf */}
          <div className="bg-white rounded border border-slate-200 p-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Attendance Date:</span>
                <Input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="h-8 text-xs w-36 bg-white border-slate-200 focus:border-[#0088cc]"
                />
              </div>

              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => handleMarkAll(AttendanceStatus.PRESENT)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll(AttendanceStatus.ABSENT)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                >
                  All Absent
                </button>
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search candidate in batch..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="pl-8 h-8 text-xs bg-white border-slate-200 focus:border-[#0088cc]"
              />
            </div>
          </div>

          {/* Student Attendance Table matching Attendance.pdf */}
          <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <input type="checkbox" className="rounded border-slate-300 text-[#0088cc] focus:ring-[#0088cc]" />
                  </th>
                  <th className="py-3 px-4">Enrollment</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isWorkspaceLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4 animate-spin text-[#0088cc]" />
                        <span>Loading student roster...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No active students found</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        This batch has no enrolled students or none match the search filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s: any) => {
                    const currentStatus = studentStatusMap[s.studentProfileId] || AttendanceStatus.PRESENT;
                    return (
                      <tr key={s.studentProfileId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center">
                          <input type="checkbox" className="rounded border-slate-300 text-[#0088cc] focus:ring-[#0088cc]" />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {s.studentId}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {s.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {s.email}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {s.phone}
                        </td>
                        <td className="py-3 px-4">
                          {/* 4 status toggle buttons matching Attendance.pdf */}
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.studentProfileId, AttendanceStatus.PRESENT)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                                currentStatus === AttendanceStatus.PRESENT
                                  ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300"
                                  : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.studentProfileId, AttendanceStatus.ABSENT)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                                currentStatus === AttendanceStatus.ABSENT
                                  ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-300"
                                  : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.studentProfileId, AttendanceStatus.LATE)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                                currentStatus === AttendanceStatus.LATE
                                  ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-300"
                                  : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                              }`}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.studentProfileId, AttendanceStatus.EXCUSED)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                                currentStatus === AttendanceStatus.EXCUSED
                                  ? "bg-slate-700 text-white shadow-sm ring-2 ring-slate-400"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                              }`}
                            >
                              Leave
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Sticky Summary & SAVE ATTENDANCE Bar matching Attendance.pdf */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-6 py-3 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
              <span className="text-emerald-700">Present: {summaryCounts.PRESENT}</span>
              <span className="text-slate-300">•</span>
              <span className="text-rose-700">Absent: {summaryCounts.ABSENT}</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-700">Late: {summaryCounts.LATE}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700">Leave: {summaryCounts.EXCUSED}</span>
            </div>

            <button
              type="button"
              disabled={saveMutation.isPending || !selectedBatchId || !workspace?.students?.length}
              onClick={handleSaveAttendance}
              className="inline-flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077b3] disabled:opacity-50 text-white font-bold text-xs uppercase px-6 py-2.5 rounded shadow transition-all"
            >
              {saveMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>SAVE ATTENDANCE</span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {activeTab === "sessions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Faculty Scheduled Lectures & Practical Sessions</h2>
            <Badge variant="outline" className="text-xs">
              {scheduledSessions?.length || 0} Total Sessions
            </Badge>
          </div>

          {!scheduledSessions || scheduledSessions.length === 0 ? (
            <div className="bg-white p-12 rounded border border-dashed border-slate-300 text-center">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No scheduled sessions</p>
              <p className="text-xs text-slate-500 mt-1">
                You do not have any upcoming class sessions scheduled on your calendar.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {scheduledSessions.map((cls: any) => {
                const sessionDate = new Date(cls.scheduledAt);
                const isUpcoming = sessionDate.getTime() >= Date.now();

                return (
                  <div key={cls.id} className="bg-white rounded border border-slate-200 p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {cls.batch.code}
                      </span>
                      <Badge variant={isUpcoming ? "success" : "secondary"} className="text-[10px]">
                        {cls.mode}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{cls.title}</h3>
                      <p className="text-xs text-slate-500">{cls.batch.course.title}</p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#0088cc]" />
                        <span>
                          {sessionDate.toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {sessionDate.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {cls.meetingUrl && (
                      <a
                        href={cls.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-bold py-2 rounded transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Launch Live Lecture
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
