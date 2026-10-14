"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  BarChart3,
  TrendingUp,
  GraduationCap,
  MessageSquare,
  Loader2,
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
  const [viewTab, setViewTab] = useState<"workspace" | "authorityReport">("workspace");

  // Master Authority Report Query
  const {
    data: masterReport,
    isLoading: isMasterLoading,
    refetch: refetchMaster,
  } = api.attendance.getAuthorityMasterReport.useQuery(undefined, {
    enabled: viewTab === "authorityReport",
  });

  // Direct Student WhatsApp Notice Mutation
  const sendStudentNoticeMutation = api.admin.sendStudentWhatsAppDirect.useMutation({
    onSuccess: (res) => {
      alert(`WhatsApp compliance notice dispatched to +91 ${res.phone.slice(-10)}!`);
      if (res.whatsappUrl) {
        window.open(res.whatsappUrl, "_blank");
      }
    },
    onError: (err) => {
      alert(`Failed to send WhatsApp notice: ${err.message}`);
    },
  });

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
      {/* Top View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewTab("workspace")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              viewTab === "workspace"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>Daily Attendance Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab("authorityReport")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              viewTab === "authorityReport"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-indigo-900 hover:bg-indigo-50"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Authority Master Report & Course Tracking</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Academic Campus: <strong className="text-slate-800">Civil Lines, Prayagraj</strong>
        </div>
      </div>

      {viewTab === "workspace" && (
        <>
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
        </>
      )}

      {/* Authority Institutional Compliance & Course Tracking Master Report */}
      {viewTab === "authorityReport" && (
        <div className="space-y-6">
          {/* Top Master Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200 shadow-2xs bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Active Learners
                  </span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                    {isMasterLoading ? "..." : masterReport?.metrics.totalActiveStudents ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-2xs bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Institutional Attendance
                  </span>
                  <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">
                    {isMasterLoading ? "..." : `${masterReport?.metrics.institutionalAttendancePercentage ?? 0}%`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-2xs bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Course / Syllabus Covered
                  </span>
                  <p className="text-2xl font-extrabold text-indigo-700 mt-0.5">
                    {isMasterLoading ? "..." : `${masterReport?.metrics.institutionalCourseProgressPercentage ?? 0}%`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-2xs bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    At-Risk Students (&lt;75%)
                  </span>
                  <p className="text-2xl font-extrabold text-amber-700 mt-0.5">
                    {isMasterLoading ? "..." : masterReport?.metrics.atRiskStudentsCount ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Batch Performance & Course Tracking Matrix */}
          <Card className="border-slate-200 shadow-2xs bg-white">
            <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#0088cc]" />
                  <span>Cohort Attendance & Syllabus Progress Matrix</span>
                </CardTitle>
                <p className="text-xs text-slate-500">Live batch compliance monitored across faculty and trainers</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchMaster()}
                className="text-xs h-8"
              >
                <Clock className="h-3 w-3 mr-1" /> Sync
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Batch Code</th>
                      <th className="py-2.5 px-3">Cohort Name</th>
                      <th className="py-2.5 px-3">Course / Program</th>
                      <th className="py-2.5 px-3">Assigned Trainer</th>
                      <th className="py-2.5 px-3 text-center">Enrolled</th>
                      <th className="py-2.5 px-3 text-center">Sessions Held</th>
                      <th className="py-2.5 px-3 text-center">Avg Attendance</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Syllabus Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {masterReport?.batches && masterReport.batches.length > 0 ? (
                      masterReport.batches.map((b) => (
                        <tr key={b.batchId} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{b.batchCode}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{b.batchName}</td>
                          <td className="py-2.5 px-3 text-slate-600">{b.courseTitle}</td>
                          <td className="py-2.5 px-3 text-slate-700">{b.trainers.join(", ") || "Faculty Assigned"}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">{b.studentCount}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{b.sessionsCount}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                b.attendancePercentage >= 75
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {b.attendancePercentage}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                                <span>{b.courseProgressPercentage}% Complete</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full transition-all"
                                  style={{ width: `${Math.min(100, b.courseProgressPercentage)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          {isMasterLoading ? "Loading institutional matrix..." : "No active batches currently found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* At-Risk Students & Direct WhatsApp Outreach Roster */}
          <Card className="border-amber-200 bg-amber-50/20 shadow-2xs">
            <CardHeader className="py-3 px-4 border-b border-amber-200/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>At-Risk Learners Roster (&lt;75% Attendance Compliance)</span>
                </CardTitle>
                <p className="text-xs text-amber-800">1-click WhatsApp notification to alert students of attendance policy</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-amber-100/50 text-amber-950 border-b border-amber-200 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Enrolled Course</th>
                      <th className="py-2.5 px-3">Cohort</th>
                      <th className="py-2.5 px-3 text-center">Attendance %</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 bg-white">
                    {masterReport?.atRiskStudents && masterReport.atRiskStudents.length > 0 ? (
                      masterReport.atRiskStudents.map((s) => (
                        <tr key={s.studentProfileId} className="hover:bg-amber-50/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{s.name}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{s.studentId}</td>
                          <td className="py-2.5 px-3 text-slate-600">{s.courseTitle}</td>
                          <td className="py-2.5 px-3 text-slate-700">{s.batchName}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                              {s.attendancePercentage}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Button
                              size="sm"
                              disabled={sendStudentNoticeMutation.isPending}
                              onClick={() => {
                                sendStudentNoticeMutation.mutate({
                                  studentProfileId: s.studentProfileId,
                                  messageType: "ATTENDANCE_WARNING",
                                  attendancePercentage: s.attendancePercentage,
                                });
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 gap-1 font-semibold"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>WhatsApp Notice</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          {isMasterLoading ? "Loading roster..." : "🎉 All active learners currently meet or exceed attendance compliance!"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
