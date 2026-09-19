"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AttendanceStatus } from "@prisma/client";
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  Check,
  Users,
  Search,
  BookOpen,
} from "lucide-react";

export function AttendanceOverviewView() {
  const [centre, setCentre] = useState("Softlab Global");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [searchStudent, setSearchStudent] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Student status local state map: { studentProfileId: AttendanceStatus }
  const [studentStatusMap, setStudentStatusMap] = useState<Record<string, AttendanceStatus>>({});

  // 1. Fetch all batches for filter dropdown
  const { data: batchesData } = api.batch.list.useQuery({ pageSize: 50 });
  const batches = batchesData?.batches || [];

  // Auto-select first batch if none selected
  React.useEffect(() => {
    if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  // 2. Fetch batch attendance workspace for the selected batch and date
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

  // Initialize/sync studentStatusMap when workspace loads
  React.useEffect(() => {
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
      utils.attendance.getInstitutionalAttendance.invalidate();
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
        s.email.toLowerCase().includes(q)
    );
  }, [workspace, searchStudent]);

  // Summary counts calculated from live state
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
    <div className="space-y-4 pb-20">
      {/* Top Filter Card matching Attendance.pdf */}
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
              {batches.map((b) => (
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
              {workspace?.topics?.map((topic, i) => (
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
          <p className="text-slate-800 font-bold text-xs mt-0.5 truncate" title={batchMeta ? `${batchMeta.courseTitle} - ${batchMeta.name}` : "Full Stack Web Development"}>
            {batchMeta ? `${batchMeta.courseTitle} - ${batchMeta.name}` : "Full Stack Web Development"}
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

      {/* Success Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Attendance Control & Action Bar matching Attendance.pdf */}
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
              className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll(AttendanceStatus.ABSENT)}
              className="px-2.5 py-1 text-[11px] font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
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
              filteredStudents.map((s) => {
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
    </div>
  );
}
