"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  BookOpen,
  FlaskConical,
  FolderKanban,
  HelpCircle,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  RotateCcw,
  Play,
} from "lucide-react";

export function AiAcademicEnginePanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [runningCourseId, setRunningCourseId] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState("");
  const [tab, setTab] = useState<"courses" | "sources" | "logs">("courses");
  const [search, setSearch] = useState("");
  const [banner, setBanner] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/academic-engine");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load AI Academic Engine");
      setData(json);
    } catch (e: any) {
      setBanner({ type: "err", msg: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const seedSources = async () => {
    setBanner(null);
    const res = await fetch("/api/academic-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "SEED_SOURCES_AND_RUBRICS" }),
    });
    const json = await res.json();
    if (res.ok) {
      setBanner({ type: "ok", msg: `Seeded ${json.sourcesCount} academic sources and ${json.rubricsSeeded} rubric criteria.` });
      await load();
    } else {
      setBanner({ type: "err", msg: json.error || "Failed to seed sources" });
    }
  };

  const runCourse = async (courseId: string) => {
    setRunningCourseId(courseId);
    setBanner(null);
    try {
      const res = await fetch("/api/academic-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GENERATE_COURSE", courseId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generation failed");
      const r = json.result;
      setBanner({
        type: "ok",
        msg: `${r.title}: +${r.lessonsUpdated} lessons enriched, +${r.labsCreated} labs, +${r.mcqsCreated} MCQs, +${r.projectsCreated} projects, +${r.examsCreated} exams.`,
      });
      await load();
    } catch (e: any) {
      setBanner({ type: "err", msg: e.message });
    } finally {
      setRunningCourseId(null);
    }
  };

  const runAllIncomplete = async () => {
    const pending = (data?.courses || []).filter(
      (c: any) => c.completionPercent < 100 || c.labsCount === 0 || c.projectsCount === 0 || c.mcqsCount === 0
    );
    if (pending.length === 0) {
      setBanner({ type: "ok", msg: "All 54 SOFTLAB courses are already 100% populated and published!" });
      return;
    }
    setBatchRunning(true);
    for (let i = 0; i < pending.length; i++) {
      setBatchProgress(`Processing ${i + 1} / ${pending.length}: ${pending[i].title}`);
      await fetch("/api/academic-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GENERATE_COURSE", courseId: pending[i].id }),
      });
    }
    setBatchRunning(false);
    setBatchProgress("");
    setBanner({ type: "ok", msg: `Batch completed for ${pending.length} SOFTLAB courses.` });
    await load();
  };

  const rollbackVersion = async (versionId: string) => {
    const res = await fetch("/api/academic-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ROLLBACK", versionId }),
    });
    const json = await res.json();
    if (res.ok) {
      setBanner({ type: "ok", msg: `Rolled back lesson ${json.result.lessonId} to version ${json.result.restoredVersion}.` });
      await load();
    } else {
      setBanner({ type: "err", msg: json.error || "Rollback failed" });
    }
  };

  const s = data?.summary || {};
  const courses = (data?.courses || []).filter((c: any) =>
    !search.trim() ? true : c.title.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-600" />
            AI Academic Content Engine (54 SOFTLAB Courses)
          </h2>
          <p className="text-xs text-slate-500">
            Source-attributed theory, diagrams, isolated practical labs, duration-based projects, 10+ MCQs/topic &amp; auto-publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={seedSources}
            className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            Sync Source Library &amp; Rubrics
          </button>
          <button
            type="button"
            onClick={runAllIncomplete}
            disabled={batchRunning}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            {batchRunning ? batchProgress : "Generate & Publish All Pending"}
          </button>
          <a
            href="/api/academic-engine?export=xlsx"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          >
            <Download className="h-3.5 w-3.5" />
            Export 11-Sheet Excel (.xlsx)
          </a>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-medium ${
            banner.type === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {banner.msg}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "SOFTLAB Courses", value: s.totalSoftlabCourses ?? 0, icon: BookOpen },
          { label: "Modules / Lessons", value: `${s.totalModules ?? 0} / ${s.totalLessons ?? 0}`, icon: BookOpen },
          { label: "Theory Completed", value: s.theoryCompleted ?? 0, icon: CheckCircle2 },
          { label: "Practical Labs", value: s.labsGenerated ?? 0, icon: FlaskConical },
          { label: "Projects Allocated", value: s.projectsGenerated ?? 0, icon: FolderKanban },
          { label: "MCQs / Exams", value: `${s.mcqsGenerated ?? 0} / ${s.examsGenerated ?? 0}`, icon: HelpCircle },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>{k.label}</span>
                <Icon className="h-3.5 w-3.5 text-sky-600" />
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">{k.value}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("courses")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === "courses" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700"}`}
          >
            Course Matrix ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("sources")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === "sources" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700"}`}
          >
            Academic Source Library ({(data?.sources || []).length})
          </button>
          <button
            type="button"
            onClick={() => setTab("logs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === "logs" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700"}`}
          >
            Publishing &amp; Correction Logs ({(data?.recentLogs || []).length})
          </button>
        </div>

        {tab === "courses" && (
          <input
            type="text"
            placeholder="Filter 54 SOFTLAB courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 w-64"
          />
        )}
      </div>

      {tab === "courses" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-semibold text-slate-500">
              <tr>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Modules / Lessons</th>
                <th className="py-3 px-3">Theory %</th>
                <th className="py-3 px-3">Labs</th>
                <th className="py-3 px-3">Projects (Min/Maj)</th>
                <th className="py-3 px-3">MCQs / Exams</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-900">{c.title}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{c.slug}</div>
                  </td>
                  <td className="py-2.5 px-3">{c.durationWeeks}w</td>
                  <td className="py-2.5 px-3">{c.modulesCount} / {c.lessonsCount}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.completionPercent === 100 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                      {c.completionPercent}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">{c.labsCount}</td>
                  <td className="py-2.5 px-3">
                    {c.projectsCount} ({c.minorProjects}/{c.majorProjects})
                  </td>
                  <td className="py-2.5 px-3">{c.mcqsCount} / {c.examsCount}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      disabled={runningCourseId === c.id || batchRunning}
                      onClick={() => runCourse(c.id)}
                      className="px-2.5 py-1 rounded bg-sky-600 text-white text-[11px] font-semibold hover:bg-sky-700 disabled:opacity-50"
                    >
                      {runningCourseId === c.id ? "Generating..." : "Generate & Publish"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "sources" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-[11px] uppercase font-semibold text-slate-500">
              <tr>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Base URL</th>
                <th className="py-3 px-4">Access Mode</th>
                <th className="py-3 px-4">License / Compliance</th>
                <th className="py-3 px-4">Categories</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.sources || []).map((src: any) => (
                <tr key={src.id}>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-sky-600" />
                    {src.name}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-sky-700">{src.baseUrl}</td>
                  <td className="py-2.5 px-4">{src.accessStatus}</td>
                  <td className="py-2.5 px-4">{src.licenseStatus}</td>
                  <td className="py-2.5 px-4">{(src.subjectCategories || []).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "logs" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-[11px] uppercase font-semibold text-slate-500">
              <tr>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Course / Lesson</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Rollback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.recentLogs || []).map((log: any) => (
                <tr key={log.id}>
                  <td className="py-2.5 px-4 font-semibold">{log.stage}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${log.status === "PASS" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">{log.confidenceScore}%</td>
                  <td className="py-2.5 px-4 font-mono text-[11px]">{log.courseId} / {log.lessonId || "-"}</td>
                  <td className="py-2.5 px-4">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right">
                    {log.versionId && (
                      <button
                        type="button"
                        onClick={() => rollbackVersion(log.versionId)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300 text-[11px] font-semibold hover:bg-slate-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Rollback
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
