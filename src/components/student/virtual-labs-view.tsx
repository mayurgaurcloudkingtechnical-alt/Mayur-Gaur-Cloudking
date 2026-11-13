"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Code2,
  Database,
  Download,
  FileSpreadsheet,
  Network,
  Play,
  Send,
  ShieldCheck,
  Terminal,
} from "lucide-react";

const STARTER_SNIPPETS: Record<string, string> = {
  python: '# SoftLab Global Isolated Python 3.11 Sandbox\nprint("Hello from SoftLab Global Virtual Lab!")\n',
  javascript: '// SoftLab Global Isolated Node.js 20 Sandbox\nconsole.log("Hello from SoftLab JS Lab!");\n',
  c: '#include <stdio.h>\nint main() {\n  printf("Hello from SoftLab C Sandbox!\\n");\n  return 0;\n}\n',
  cpp: '#include <iostream>\nint main() {\n  std::cout << "Hello from SoftLab C++ Sandbox!" << std::endl;\n  return 0;\n}\n',
  java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello from SoftLab Java Sandbox!");\n  }\n}\n',
  php: '<?php\necho "Hello from SoftLab PHP Sandbox!\\n";\n',
  bash: '#!/bin/sh\nuname -a\necho "SoftLab Linux Shell Sandbox Ready"\n',
  sql: '-- Isolated Practice SQLite DB (tables: departments, students)\nSELECT s.id, s.name, s.course, s.marks, d.name AS department\nFROM students s\nJOIN departments d ON s.dept_id = d.id\nORDER BY s.marks DESC;',
  html: '<!DOCTYPE html>\n<html>\n<body style="font-family:sans-serif;padding:16px;">\n  <h2 style="color:#0B2241">SoftLab HTML/CSS/JS Sandbox</h2>\n  <p>Edit this code and inspect live output.</p>\n</body>\n</html>',
};

function computeCidr(cidrInput: string) {
  const [ipStr, prefixStr] = cidrInput.trim().split("/");
  const prefix = Number(prefixStr);
  const parts = (ipStr || "").split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255) || Number.isNaN(prefix) || prefix < 0 || prefix > 32) {
    return null;
  }
  const ipNum = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const toIp = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  const totalHosts = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.pow(2, 32 - prefix) - 2;
  return {
    network: toIp(network),
    broadcast: toIp(broadcast),
    subnetMask: toIp(mask),
    firstUsable: prefix >= 31 ? toIp(network) : toIp(network + 1),
    lastUsable: prefix >= 31 ? toIp(broadcast) : toIp(broadcast - 1),
    usableHosts: totalHosts,
  };
}

export function StudentVirtualLabsView() {
  const [workspaceMode, setWorkspaceMode] = useState<"code" | "network" | "office" | "performance">("code");
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>(STARTER_SNIPPETS.python);
  const [stdin, setStdin] = useState<string>("");
  const [execResult, setExecResult] = useState<any>(null);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [cidrInput, setCidrInput] = useState("192.168.10.25/26");

  const infraQuery = api.virtualLabs.getInfrastructureStatus.useQuery();
  const perfQuery = api.virtualLabs.getStudentPerformance.useQuery();
  const labsQuery = api.virtualLabs.listLabs.useQuery();

  const runMut = api.virtualLabs.executeCode.useMutation({
    onSuccess: (res) => setExecResult(res),
    onError: (e) => setExecResult({ stdout: "", stderr: e.message, exitCode: 1, durationMs: 0, sandboxMode: "ERROR" }),
  });

  const submitMut = api.virtualLabs.submitLab.useMutation({
    onSuccess: (sub) => {
      setSubmitMsg(`Practical submitted! Attempt #${sub.attemptNumber} • Status: ${sub.status}`);
      perfQuery.refetch();
    },
    onError: (e) => setSubmitMsg(`Submission error: ${e.message}`),
  });

  const selectLab = (lab: any) => {
    setSelectedLabId(lab.id);
    const lang = lab.language || "python";
    setLanguage(lang);
    setCode(lab.starterCode || STARTER_SNIPPETS[lang] || "");
    setExecResult(null);
    setSubmitMsg(null);
    if (lang === "network_sim") setWorkspaceMode("network");
    else if (lang.startsWith("collabora_")) setWorkspaceMode("office");
    else setWorkspaceMode("code");
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `softlab-practical.${language === "python" ? "py" : language === "javascript" ? "js" : language}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cidrResult = computeCidr(cidrInput);

  return (
    <div className="space-y-6">
      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border bg-white p-3.5">
          <div className="text-xs text-slate-500">Assigned Practicals</div>
          <div className="text-xl font-bold">{perfQuery.data?.assignedCount ?? 0}</div>
        </div>
        <div className="rounded-xl border bg-white p-3.5">
          <div className="text-xs text-slate-500">Completed</div>
          <div className="text-xl font-bold text-emerald-600">{perfQuery.data?.completedCount ?? 0}</div>
        </div>
        <div className="rounded-xl border bg-white p-3.5">
          <div className="text-xs text-slate-500">Pending</div>
          <div className="text-xl font-bold text-amber-600">{perfQuery.data?.pendingCount ?? 0}</div>
        </div>
        <div className="rounded-xl border bg-white p-3.5">
          <div className="text-xs text-slate-500">Resubmit Requested</div>
          <div className="text-xl font-bold text-rose-600">{perfQuery.data?.resubmitCount ?? 0}</div>
        </div>
        <div className="rounded-xl border bg-white p-3.5">
          <div className="text-xs text-slate-500">Completion Rate</div>
          <div className="text-xl font-bold text-sky-600">{perfQuery.data?.completionPct ?? 0}%</div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        <Button variant={workspaceMode === "code" ? "default" : "outline"} onClick={() => setWorkspaceMode("code")} className="gap-2">
          <Code2 className="h-4 w-4" /> Code / SQL / Linux Sandbox
        </Button>
        <Button variant={workspaceMode === "network" ? "default" : "outline"} onClick={() => setWorkspaceMode("network")} className="gap-2">
          <Network className="h-4 w-4" /> Networking & CCNA Subnet Lab
        </Button>
        <Button variant={workspaceMode === "office" ? "default" : "outline"} onClick={() => setWorkspaceMode("office")} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Office & Productivity Lab (Collabora CODE)
        </Button>
        <Button variant={workspaceMode === "performance" ? "default" : "outline"} onClick={() => setWorkspaceMode("performance")} className="gap-2">
          <CheckCircle2 className="h-4 w-4" /> My Practical Performance
        </Button>
      </div>

      {submitMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
          {submitMsg}
        </div>
      )}

      {workspaceMode === "code" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Assigned Labs Sidebar */}
          <div className="lg:col-span-4 rounded-xl border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Course Practical Labs</h3>
              <Badge variant="outline" className="text-[10px] gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" /> Isolated Sandbox
              </Badge>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {(labsQuery.data || []).length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center">
                  No assigned labs yet. Use the interactive multi-language sandbox on the right to practice freely!
                </div>
              ) : (
                (labsQuery.data || []).map((lab) => (
                  <button
                    key={lab.id}
                    onClick={() => selectLab(lab)}
                    className={`w-full text-left rounded-lg border p-3 ${
                      selectedLabId === lab.id ? "border-sky-500 bg-sky-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-semibold text-sm text-slate-900">{lab.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {lab.courseTitle} • {lab.language.toUpperCase()} • {lab.maxMarks} Marks
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Code Editor & Console */}
          <div className="lg:col-span-8 rounded-xl border bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-sky-600" />
                <select
                  value={language}
                  onChange={(e) => {
                    const lang = e.target.value;
                    setLanguage(lang);
                    if (!selectedLabId && STARTER_SNIPPETS[lang]) {
                      setCode(STARTER_SNIPPETS[lang]);
                    }
                  }}
                  className="rounded-md border px-2.5 py-1.5 text-sm font-medium"
                >
                  <option value="python">Python 3.11</option>
                  <option value="javascript">JavaScript (Node 20)</option>
                  <option value="c">C (GCC 13)</option>
                  <option value="cpp">C++ (G++ 13)</option>
                  <option value="java">Java 17</option>
                  <option value="php">PHP 8.2</option>
                  <option value="bash">Linux Bash / Shell</option>
                  <option value="sql">SQL (Isolated SQLite DB)</option>
                  <option value="html">HTML / CSS / JS (Live Preview)</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={downloadCode} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
                <Button
                  size="sm"
                  disabled={runMut.isPending}
                  onClick={() =>
                    runMut.mutate({
                      labId: selectedLabId || undefined,
                      labType: language === "sql" ? "DATABASE" : language === "bash" ? "LINUX_CLOUD" : "PROGRAMMING",
                      language,
                      code,
                      stdin,
                    })
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                >
                  <Play className="h-3.5 w-3.5" /> {runMut.isPending ? "Running..." : "Run / Compile"}
                </Button>
                {selectedLabId && (
                  <Button
                    size="sm"
                    disabled={submitMut.isPending}
                    onClick={() => submitMut.mutate({ labId: selectedLabId, submittedCode: code, durationSeconds: 120 })}
                    className="gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" /> Submit Practical
                  </Button>
                )}
              </div>
            </div>

            <Textarea
              rows={13}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-xs bg-slate-950 text-slate-100 p-3 rounded-lg"
            />

            {language === "html" ? (
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Sandboxed HTML Preview</div>
                <iframe sandbox="allow-scripts" srcDoc={code} className="w-full h-48 bg-white" title="HTML Sandbox" />
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Optional Standard Input (stdin)..."
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  className="font-mono text-xs"
                />
                {execResult && (
                  <div className="rounded-lg border bg-slate-900 text-slate-100 p-3 font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Sandbox: {execResult.sandboxMode}</span>
                      <span>Exit: {execResult.exitCode} • {execResult.durationMs}ms</span>
                    </div>
                    {execResult.stdout && <pre className="whitespace-pre-wrap text-emerald-300">{execResult.stdout}</pre>}
                    {execResult.stderr && <pre className="whitespace-pre-wrap text-rose-400">{execResult.stderr}</pre>}
                    {execResult.tableRows && execResult.tableRows.length > 0 && (
                      <div className="overflow-x-auto bg-white text-slate-900 rounded p-2">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b font-semibold text-left">
                              {Object.keys(execResult.tableRows[0]).map((k) => (
                                <th key={k} className="p-1.5">{k}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {execResult.tableRows.map((row: any, i: number) => (
                              <tr key={i} className="border-b">
                                {Object.values(row).map((v: any, j: number) => (
                                  <td key={j} className="p-1.5">{String(v)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {workspaceMode === "network" && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-sky-600" />
            <h3 className="font-bold text-lg">CCNA & Networking Subnetting / CIDR Lab Simulator</h3>
          </div>
          <p className="text-sm text-slate-600">
            Practice IPv4 subnetting, network/broadcast address calculation, usable host ranges, and VLAN/NAT verification in your browser.
          </p>
          <div className="flex gap-2 max-w-md">
            <Input value={cidrInput} onChange={(e) => setCidrInput(e.target.value)} placeholder="e.g. 192.168.10.25/26" className="font-mono" />
          </div>
          {cidrResult ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border p-3 bg-slate-50"><div className="text-xs text-slate-500">Network Address</div><div className="font-mono font-bold">{cidrResult.network}</div></div>
              <div className="rounded-lg border p-3 bg-slate-50"><div className="text-xs text-slate-500">Broadcast Address</div><div className="font-mono font-bold">{cidrResult.broadcast}</div></div>
              <div className="rounded-lg border p-3 bg-slate-50"><div className="text-xs text-slate-500">Subnet Mask</div><div className="font-mono font-bold">{cidrResult.subnetMask}</div></div>
              <div className="rounded-lg border p-3 bg-slate-50"><div className="text-xs text-slate-500">First Usable Host</div><div className="font-mono font-bold">{cidrResult.firstUsable}</div></div>
              <div className="rounded-lg border p-3 bg-slate-50"><div className="text-xs text-slate-500">Last Usable Host</div><div className="font-mono font-bold">{cidrResult.lastUsable}</div></div>
              <div className="rounded-lg border p-3 bg-slate-50"><div className="text-xs text-slate-500">Usable Hosts</div><div className="font-mono font-bold">{cidrResult.usableHosts}</div></div>
            </div>
          ) : (
            <div className="text-sm text-rose-600">Enter a valid IPv4 CIDR (e.g. 10.0.0.1/24).</div>
          )}
        </div>
      )}

      {workspaceMode === "office" && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-lg">Office & Productivity Practical Workspace</h3>
            </div>
            <Badge className={infraQuery.data?.collabora.available ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
              {infraQuery.data?.collabora.available ? "Collabora CODE 24.04 Online" : "Collabora Status Check"}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            {infraQuery.data?.collabora.details || "Checking Collabora CODE Office Server..."}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border p-4 bg-slate-50">
              <div className="font-semibold text-slate-900">Word / Excel / PowerPoint Practicals (Collabora CODE)</div>
              <p className="text-xs text-slate-600 mt-1">
                Collabora CODE container (<code>collabora/code:24.04.8.1.1</code>) is active on the SoftLab Global VPS for document formatting, spreadsheet formulas (IF/SUMIF/VLOOKUP/Pivot), and presentation decks.
              </p>
            </div>
            <div className="rounded-lg border p-4 bg-slate-50">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Database className="h-4 w-4 text-sky-600" /> Relational Database Alternative (Access Concepts)
              </div>
              <p className="text-xs text-slate-600 mt-1">
                For Microsoft Access relational database concepts (tables, relationships, queries, and reports), use the built-in browser <strong>Isolated SQL Sandbox</strong> tab above.
              </p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => { setLanguage("sql"); setCode(STARTER_SNIPPETS.sql); setWorkspaceMode("code"); }}>
                Open Relational SQL Lab
              </Button>
            </div>
          </div>
        </div>
      )}

      {workspaceMode === "performance" && (
        <div className="rounded-xl border bg-white p-5 space-y-3">
          <h3 className="font-bold text-lg">My Practical Submission History & Trainer Feedback</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-left">
                  <th className="p-2">Lab</th>
                  <th className="p-2">Attempt</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Trainer Remarks</th>
                  <th className="p-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {(perfQuery.data?.submissions || []).map((s: any) => (
                  <tr key={s.id} className="border-b">
                    <td className="p-2 font-medium">{s.lab?.title || s.labId}</td>
                    <td className="p-2">#{s.attemptNumber}</td>
                    <td className="p-2"><Badge variant="outline">{s.status}</Badge></td>
                    <td className="p-2">{s.score !== null ? `${s.score}/${s.maxScore}` : "Pending"}</td>
                    <td className="p-2">{s.trainerFeedback || "—"}</td>
                    <td className="p-2">{new Date(s.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
