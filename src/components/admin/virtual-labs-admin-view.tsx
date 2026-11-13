"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, FlaskConical, Plus } from "lucide-react";

export function AdminVirtualLabsView() {
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [labType, setLabType] = useState("PROGRAMMING");
  const [language, setLanguage] = useState("python");
  const [instructions, setInstructions] = useState("");
  const [starterCode, setStarterCode] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [reviewMarks, setReviewMarks] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const coursesQuery = api.academicContent.listCourses.useQuery();
  const analyticsQuery = api.virtualLabs.getAdminLabAnalytics.useQuery();
  const infraQuery = api.virtualLabs.getInfrastructureStatus.useQuery();
  const submissionsQuery = api.virtualLabs.listSubmissionsForReview.useQuery();

  const createLabMut = api.virtualLabs.createLab.useMutation({
    onSuccess: (lab) => {
      setMsg(`Created lab: ${lab.title}`);
      setTitle("");
      setInstructions("");
      setStarterCode("");
      analyticsQuery.refetch();
    },
    onError: (e) => setMsg(`Error: ${e.message}`),
  });

  const reviewMut = api.virtualLabs.reviewSubmission.useMutation({
    onSuccess: () => {
      setMsg("Submission evaluated and saved.");
      submissionsQuery.refetch();
      analyticsQuery.refetch();
    },
  });

  return (
    <div className="space-y-6">
      {msg && <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-900">{msg}</div>}

      {/* Analytics & Infra Health */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-slate-500">Published Labs</div>
          <div className="text-2xl font-bold">{analyticsQuery.data?.totalLabs ?? 0}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-slate-500">Total Submissions</div>
          <div className="text-2xl font-bold">{analyticsQuery.data?.totalSubmissions ?? 0}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-slate-500">Pending Review</div>
          <div className="text-2xl font-bold text-amber-600">{analyticsQuery.data?.pendingReviews ?? 0}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-slate-500">Sandbox Executions</div>
          <div className="text-2xl font-bold text-sky-700">{analyticsQuery.data?.totalExecutions ?? 0}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-slate-500">Collabora CODE</div>
          <div className="text-sm font-bold text-emerald-700 mt-1">
            {infraQuery.data?.collabora.available ? "Online (24.04)" : "Check Service"}
          </div>
        </div>
      </div>

      {/* Create Lab Form */}
      <div className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center gap-2 font-bold text-lg">
          <FlaskConical className="h-5 w-5 text-sky-600" /> Create & Assign Practical Lab
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Label>Lab Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Python Loops & Functions Lab" />
          </div>
          <div>
            <Label>Course</Label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
              <option value="">Select Course...</option>
              {(coursesQuery.data || []).map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Language / Tool</Label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setLabType(e.target.value === "sql" ? "DATABASE" : e.target.value === "bash" ? "LINUX_CLOUD" : e.target.value === "network_sim" ? "NETWORKING" : "PROGRAMMING");
              }}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="php">PHP</option>
              <option value="bash">Linux Bash</option>
              <option value="sql">SQL (Isolated SQLite)</option>
              <option value="html">HTML / CSS / JS</option>
              <option value="network_sim">CCNA Subnet Simulator</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Instructions</Label>
            <Textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          </div>
          <div>
            <Label>Starter Code</Label>
            <Textarea rows={3} value={starterCode} onChange={(e) => setStarterCode(e.target.value)} className="font-mono text-xs" />
          </div>
          <div>
            <Label>Expected Output (for Auto-Grading Test Case)</Label>
            <Textarea rows={3} value={expectedOutput} onChange={(e) => setExpectedOutput(e.target.value)} className="font-mono text-xs" />
          </div>
        </div>

        <Button
          disabled={createLabMut.isPending || !courseId || !title || !instructions}
          onClick={() =>
            createLabMut.mutate({
              courseId,
              title,
              labType,
              language,
              instructions,
              starterCode,
              expectedOutput,
              testCasesJson: expectedOutput ? [{ name: "Expected Output Match", expectedOutput }] : undefined,
            })
          }
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Publish Practical Lab
        </Button>
      </div>

      {/* Submission Review Queue */}
      <div className="rounded-xl border bg-white p-5 space-y-3">
        <h3 className="font-bold text-lg">Student Practical Submissions & Evaluation</h3>
        <div className="space-y-3">
          {(submissionsQuery.data || []).map((s: any) => (
            <div key={s.id} className="rounded-lg border p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-sm">{s.studentLabel}</span>
                  <span className="text-xs text-slate-500 ml-2">• {s.lab?.title} (Attempt #{s.attemptNumber})</span>
                </div>
                <Badge variant="outline">{s.status}</Badge>
              </div>
              {s.executionResult && (
                <pre className="rounded bg-slate-900 text-emerald-300 p-2 text-xs overflow-x-auto max-h-28">{s.executionResult}</pre>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  placeholder={`Marks / ${s.lab?.maxMarks || 100}`}
                  value={reviewMarks[s.id] ?? (s.score !== null ? String(s.score) : "")}
                  onChange={(e) => setReviewMarks({ ...reviewMarks, [s.id]: e.target.value })}
                  className="w-32 h-8 text-xs"
                />
                <Input
                  placeholder="Trainer feedback..."
                  value={reviewNotes[s.id] ?? s.trainerFeedback ?? ""}
                  onChange={(e) => setReviewNotes({ ...reviewNotes, [s.id]: e.target.value })}
                  className="flex-1 h-8 text-xs"
                />
                <Button
                  size="sm"
                  onClick={() =>
                    reviewMut.mutate({
                      submissionId: s.id,
                      score: Number(reviewMarks[s.id] || s.score || 80),
                      trainerFeedback: reviewNotes[s.id] || "Approved",
                      status: "APPROVED",
                    })
                  }
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    reviewMut.mutate({
                      submissionId: s.id,
                      score: Number(reviewMarks[s.id] || 0),
                      trainerFeedback: reviewNotes[s.id] || "Please revise and resubmit",
                      status: "RESUBMIT_REQUESTED",
                    })
                  }
                  className="h-8"
                >
                  Request Resubmit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
