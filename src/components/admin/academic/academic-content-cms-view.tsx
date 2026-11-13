"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  History,
  Layers,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";

export function AcademicContentCmsView() {
  const [activeTab, setActiveTab] = useState<"courses" | "bulk" | "english">("courses");
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Lesson editor state
  const [editTitle, setEditTitle] = useState("");
  const [editBodyText, setEditBodyText] = useState("");
  const [editObjectives, setEditObjectives] = useState("");
  const [editPractical, setEditPractical] = useState("");
  const [editAssignment, setEditAssignment] = useState("");
  const [editProject, setEditProject] = useState("");
  const [editExpectedOutput, setEditExpectedOutput] = useState("");
  const [editTools, setEditTools] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editDocUrl, setEditDocUrl] = useState("");

  // Bulk import state
  const [bulkJsonText, setBulkJsonText] = useState("");
  const [bulkFileName, setBulkFileName] = useState("bulk-content-upload.json");
  const [previewResult, setPreviewResult] = useState<any>(null);

  const coursesQuery = api.academicContent.listCourses.useQuery({
    search: search || undefined,
    providerType: providerFilter,
  });

  const hierarchyQuery = api.academicContent.getCourseHierarchy.useQuery(
    { courseId: selectedCourseId! },
    { enabled: Boolean(selectedCourseId) }
  );

  const versionQuery = api.academicContent.getVersionHistory.useQuery(
    { lessonId: selectedLessonId! },
    { enabled: Boolean(selectedLessonId) }
  );

  const englishAuditQuery = api.complimentaryEnglish.auditEligibility.useQuery(undefined, {
    enabled: activeTab === "english",
  });
  const englishAnalyticsQuery = api.complimentaryEnglish.getAnalytics.useQuery(undefined, {
    enabled: activeTab === "english",
  });

  const updateLessonMut = api.academicContent.updateLessonContent.useMutation({
    onSuccess: (res) => {
      setStatusMsg(`Saved! Version v${res.versionSaved} snapshot recorded.`);
      hierarchyQuery.refetch();
      versionQuery.refetch();
      coursesQuery.refetch();
    },
    onError: (e) => setStatusMsg(`Error: ${e.message}`),
  });

  const rollbackVersionMut = api.academicContent.rollbackVersion.useMutation({
    onSuccess: () => {
      setStatusMsg("Rolled back lesson content to selected version.");
      hierarchyQuery.refetch();
      versionQuery.refetch();
    },
  });

  const previewBulkMut = api.academicContent.previewBulkImport.useMutation({
    onSuccess: (res) => {
      setPreviewResult(res);
      setStatusMsg(`Preview ready: ${res.summary.updates} updates, ${res.summary.creates} new topics.`);
    },
    onError: (e) => setStatusMsg(`Bulk preview error: ${e.message}`),
  });

  const approveBulkMut = api.academicContent.approveBulkImport.useMutation({
    onSuccess: (res) => {
      setStatusMsg(`Approved & Imported: ${res.appliedUpdates} updates, ${res.appliedCreates} new topics.`);
      setPreviewResult(null);
      coursesQuery.refetch();
      hierarchyQuery.refetch();
    },
  });

  const rollbackBulkMut = api.academicContent.rollbackBulkImport.useMutation({
    onSuccess: (res) => {
      setStatusMsg(`Rolled back bulk import (${res.restoredLessons} lessons restored).`);
      hierarchyQuery.refetch();
    },
  });

  const migrateEnglishMut = api.complimentaryEnglish.runMigration.useMutation({
    onSuccess: (res) => {
      setStatusMsg(
        `Migration complete: ${res.newlyGranted} newly enrolled (100% Complimentary, ₹0 payable), ${res.alreadyEnrolled} already enrolled.`
      );
      englishAuditQuery.refetch();
      englishAnalyticsQuery.refetch();
    },
  });

  const loadLessonIntoEditor = (lesson: any) => {
    setSelectedLessonId(lesson.id);
    setEditTitle(lesson.title || "");
    setEditBodyText(lesson.contentDetails?.bodyText || lesson.contentDetails?.bodyHtml || "");
    setEditObjectives(lesson.contentDetails?.learningObjectives || "");
    setEditPractical(lesson.contentDetails?.practicalInstructions || "");
    setEditAssignment(lesson.contentDetails?.assignmentPrompt || "");
    setEditProject(lesson.contentDetails?.projectPrompt || "");
    setEditExpectedOutput(lesson.contentDetails?.expectedOutput || "");
    setEditTools(lesson.contentDetails?.requiredTools || "");
    setEditVideoUrl(lesson.contentDetails?.videoUrl || "");
    setEditDocUrl(lesson.contentDetails?.documentUrl || "");
  };

  const handleBulkPreview = () => {
    try {
      const parsed = JSON.parse(bulkJsonText);
      const rows = Array.isArray(parsed) ? parsed : parsed.bulkImportTemplate || parsed.rows || [];
      previewBulkMut.mutate({ fileName: bulkFileName, rows });
    } catch {
      setStatusMsg("Invalid JSON format. Paste an array of rows or export JSON from Master Workbook.");
    }
  };

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-xs font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b pb-3">
        <Button
          variant={activeTab === "courses" ? "default" : "outline"}
          onClick={() => setActiveTab("courses")}
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" /> Course Curriculum CMS
        </Button>
        <Button
          variant={activeTab === "bulk" ? "default" : "outline"}
          onClick={() => setActiveTab("bulk")}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" /> Safe Bulk Import & Rollback
        </Button>
        <Button
          variant={activeTab === "english" ? "default" : "outline"}
          onClick={() => setActiveTab("english")}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" /> Professional English Benefit & Migration
        </Button>
      </div>

      {activeTab === "courses" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Course List */}
          <div className="lg:col-span-4 space-y-3 rounded-xl border bg-white p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Search 83+ courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="rounded-md border px-2 text-xs"
              >
                <option value="ALL">All</option>
                <option value="SOFTLAB">SoftLab</option>
                <option value="UNIVERSITY">University</option>
                <option value="BOARD">Board</option>
              </select>
            </div>

            <div className="max-h-[640px] overflow-y-auto space-y-2 pr-1">
              {(coursesQuery.data || []).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCourseId(c.id);
                    setSelectedLessonId(null);
                  }}
                  className={`w-full text-left rounded-lg border p-3 transition ${
                    selectedCourseId === c.id
                      ? "border-sky-500 bg-sky-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-900 line-clamp-2">{c.title}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {c.completionPct}%
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{c.modulesCount} Modules</span>
                    <span>• {c.lessonsCount} Topics</span>
                    <span>• {c.withPracticalCount} Practicals</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Hierarchy & Topic Editor */}
          <div className="lg:col-span-8 space-y-4">
            {!selectedCourseId ? (
              <div className="rounded-xl border border-dashed p-12 text-center text-slate-500">
                <Layers className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                Select a course on the left to inspect modules, topics, theory, practicals, and version history.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border bg-white p-4">
                  <h3 className="font-bold text-lg text-slate-900">
                    {hierarchyQuery.data?.course.title || "Loading..."}
                  </h3>
                  <div className="mt-3 space-y-3 max-h-[260px] overflow-y-auto">
                    {hierarchyQuery.data?.course.modules.map((m) => (
                      <div key={m.id} className="rounded-lg border p-3 bg-slate-50">
                        <div className="font-semibold text-sm text-slate-800">{m.title}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {m.lessons.map((l) => (
                            <button
                              key={l.id}
                              onClick={() => loadLessonIntoEditor(l)}
                              className={`text-xs px-2.5 py-1.5 rounded-md border ${
                                selectedLessonId === l.id
                                  ? "bg-sky-600 text-white border-sky-600"
                                  : "bg-white text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {l.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedLessonId && (
                  <div className="rounded-xl border bg-white p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">Topic Content Editor (Versioned)</h4>
                      <Button
                        size="sm"
                        disabled={updateLessonMut.isPending}
                        onClick={() =>
                          updateLessonMut.mutate({
                            lessonId: selectedLessonId,
                            title: editTitle,
                            bodyText: editBodyText,
                            learningObjectives: editObjectives,
                            practicalInstructions: editPractical,
                            assignmentPrompt: editAssignment,
                            projectPrompt: editProject,
                            expectedOutput: editExpectedOutput,
                            requiredTools: editTools,
                            videoUrl: editVideoUrl,
                            documentUrl: editDocUrl,
                          })
                        }
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" /> Save & Create Version
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Topic Title</Label>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                      </div>
                      <div>
                        <Label>Required Software / Tools</Label>
                        <Input value={editTools} onChange={(e) => setEditTools(e.target.value)} placeholder="e.g. Python 3.11, Docker, SQLite" />
                      </div>
                      <div>
                        <Label>Video Lesson URL</Label>
                        <Input value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)} placeholder="https://..." />
                      </div>
                      <div>
                        <Label>PDF / Slides / Document URL</Label>
                        <Input value={editDocUrl} onChange={(e) => setEditDocUrl(e.target.value)} placeholder="https://..." />
                      </div>
                    </div>

                    <div>
                      <Label>Learning Objectives</Label>
                      <Textarea rows={2} value={editObjectives} onChange={(e) => setEditObjectives(e.target.value)} />
                    </div>
                    <div>
                      <Label>Theory Content</Label>
                      <Textarea rows={4} value={editBodyText} onChange={(e) => setEditBodyText(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Step-by-Step Practical Instructions</Label>
                        <Textarea rows={3} value={editPractical} onChange={(e) => setEditPractical(e.target.value)} />
                      </div>
                      <div>
                        <Label>Expected Output</Label>
                        <Textarea rows={3} value={editExpectedOutput} onChange={(e) => setEditExpectedOutput(e.target.value)} />
                      </div>
                      <div>
                        <Label>Assignment Prompt</Label>
                        <Textarea rows={2} value={editAssignment} onChange={(e) => setEditAssignment(e.target.value)} />
                      </div>
                      <div>
                        <Label>Project Prompt</Label>
                        <Textarea rows={2} value={editProject} onChange={(e) => setEditProject(e.target.value)} />
                      </div>
                    </div>

                    {/* Version History */}
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                        <History className="h-4 w-4" /> Content Version History
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {(versionQuery.data || []).map((v) => (
                          <div key={v.id} className="flex items-center justify-between text-xs border rounded px-3 py-1.5 bg-slate-50">
                            <span>
                              <strong>v{v.versionNumber}</strong> • {v.changeSource} • {new Date(v.createdAt).toLocaleString()}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rollbackVersionMut.mutate({ versionId: v.id })}
                              className="h-6 text-[11px] gap-1"
                            >
                              <RotateCcw className="h-3 w-3" /> Rollback
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "bulk" && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h3 className="font-bold text-lg text-slate-900">Safe Bulk Content Import (Preview → Approve → Rollback)</h3>
          <p className="text-sm text-slate-600">
            Paste structured JSON from <code>SoftLab_Global_Course_Content_Master.json</code> (or upload a JSON file).
            Existing content is never silently overwritten or deleted without Admin approval.
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept=".json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBulkFileName(file.name);
                setBulkJsonText(await file.text());
              }}
              className="max-w-sm"
            />
            <Button onClick={handleBulkPreview} disabled={previewBulkMut.isPending || !bulkJsonText} className="gap-2">
              <Upload className="h-4 w-4" /> Validate & Preview Changes
            </Button>
          </div>
          <Textarea
            rows={7}
            placeholder='[{"courseSlug":"full-stack-web-development","moduleTitle":"...","topicTitle":"...","bodyText":"...","practicalInstructions":"..."}]'
            value={bulkJsonText}
            onChange={(e) => setBulkJsonText(e.target.value)}
            className="font-mono text-xs"
          />

          {previewResult && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-amber-900">
                  Preview Summary: {previewResult.summary.updates} Updates • {previewResult.summary.creates} New Topics •{" "}
                  {previewResult.summary.duplicates} Duplicates Skipped • {previewResult.summary.invalid} Invalid
                </div>
                <Button
                  onClick={() => approveBulkMut.mutate({ jobId: previewResult.jobId })}
                  disabled={approveBulkMut.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve & Import
                </Button>
              </div>
            </div>
          )}

          {hierarchyQuery.data?.importJobs && hierarchyQuery.data.importJobs.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-2">Recent Bulk Import Jobs</h4>
              <div className="space-y-2">
                {hierarchyQuery.data.importJobs.map((j: any) => (
                  <div key={j.id} className="flex items-center justify-between text-xs border rounded p-2.5">
                    <span>
                      <strong>{j.fileName}</strong> • {j.status} • {new Date(j.createdAt).toLocaleString()}
                    </span>
                    {j.status === "APPROVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rollbackBulkMut.mutate({ jobId: j.id })}
                        className="h-7 text-xs gap-1"
                      >
                        <RotateCcw className="h-3 w-3" /> Rollback Job
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "english" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-slate-500">Proposed Standalone Fee</div>
              <div className="text-2xl font-bold text-slate-900">
                ₹{(englishAnalyticsQuery.data?.proposedFeeINR ?? 14999).toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-amber-600 mt-1">Configurable by Admin</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-slate-500">Complimentary Enrollments</div>
              <div className="text-2xl font-bold text-emerald-700">
                {englishAnalyticsQuery.data?.complimentaryEnrollments ?? 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">100% Discount (₹0 Payable)</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-slate-500">Standalone Paid Enrollments</div>
              <div className="text-2xl font-bold text-sky-700">
                {englishAnalyticsQuery.data?.paidEnrollments ?? 0}
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-slate-500">Non-Cash Waivers (Not Revenue)</div>
              <div className="text-2xl font-bold text-slate-900">
                ₹{(englishAnalyticsQuery.data?.totalNonCashWaiversINR ?? 0).toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg">Eligible Existing Students Audit & Idempotent Migration</h3>
                <p className="text-xs text-slate-500">
                  Grants 1 complimentary enrollment per eligible SoftLab student with ₹0 payable and 0 duplicate records.
                </p>
              </div>
              <Button
                onClick={() => migrateEnglishMut.mutate()}
                disabled={migrateEnglishMut.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Run Complimentary Migration ({englishAuditQuery.data?.eligibleForGrant ?? 0} Eligible)
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-left">
                    <th className="p-2">Student ID</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Primary Technical Course</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(englishAuditQuery.data?.students || []).map((st) => (
                    <tr key={st.studentProfileId} className="border-b">
                      <td className="p-2 font-mono">{st.studentCode}</td>
                      <td className="p-2">{st.studentName}</td>
                      <td className="p-2">{st.primaryCourse}</td>
                      <td className="p-2">
                        {st.alreadyHasEnglish ? (
                          <Badge className="bg-emerald-100 text-emerald-800">Enrolled (Complimentary)</Badge>
                        ) : st.eligibleForGrant ? (
                          <Badge className="bg-amber-100 text-amber-800">Eligible — Pending Grant</Badge>
                        ) : (
                          <Badge variant="outline">Not Eligible</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
