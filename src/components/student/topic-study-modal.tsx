"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/trpc/react";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Cpu,
  HelpCircle,
  Wrench,
  Copy,
  Check,
  Clock,
  Sparkles,
  Layers,
  Play,
  RotateCcw,
  Terminal,
  ExternalLink,
  Target,
  Award,
} from "lucide-react";
import { getTopicStudyNotes, TopicStudyMaterial } from "@/lib/topic-study-engine";

interface TopicStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string | null;
  courseTitle?: string;
  moduleTitle?: string;
  allTopics?: string[];
  onSelectTopic?: (topic: string) => void;
  onMarkComplete?: (topic: string) => void;
  completedTopics?: Set<string>;
}

const PLAYGROUND_LANGUAGES = [
  { value: "python", label: "Python 3.11" },
  { value: "javascript", label: "JavaScript (Node 20)" },
  { value: "c", label: "C (GCC 13)" },
  { value: "cpp", label: "C++ (G++ 13)" },
  { value: "java", label: "Java 17" },
  { value: "sql", label: "SQL (SQLite Sandbox)" },
  { value: "bash", label: "Bash / Linux Shell" },
];

function mapLanguageToSandbox(rawLang?: string): string {
  const l = (rawLang || "python").toLowerCase().trim();
  if (l === "py" || l === "python3") return "python";
  if (l === "js" || l === "node" || l === "ts" || l === "typescript") return "javascript";
  if (l === "c++") return "cpp";
  if (l === "sh" || l === "shell" || l === "cmd") return "bash";
  if (["python", "javascript", "c", "cpp", "java", "sql", "bash", "php"].includes(l)) return l;
  return "python";
}

export function TopicStudyModal({
  isOpen,
  onClose,
  topicTitle,
  courseTitle,
  moduleTitle,
  allTopics = [],
  onSelectTopic,
  onMarkComplete,
  completedTopics = new Set(),
}: TopicStudyModalProps) {
  const [copiedCodeIndex, setCopiedCodeIndex] = React.useState<number | null>(null);
  const [activeTab, setActiveTab] = React.useState<
    "notes" | "architecture" | "lab" | "examples" | "troubleshooting" | "interview"
  >("notes");

  // Interactive Live Code Playground State
  const [playgroundLang, setPlaygroundLang] = React.useState<string>("python");
  const [playgroundCode, setPlaygroundCode] = React.useState<string>("");
  const [defaultPlaygroundCode, setDefaultPlaygroundCode] = React.useState<string>("");
  const [playgroundStdin, setPlaygroundStdin] = React.useState<string>("");
  const [playgroundResult, setPlaygroundResult] = React.useState<{
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
    sandboxMode: string;
    tableRows?: Array<Record<string, unknown>>;
  } | null>(null);

  const executeCodeMutation = api.virtualLabs.executeCode.useMutation({
    onSuccess: (data) => {
      setPlaygroundResult({
        stdout: data.stdout,
        stderr: data.stderr,
        exitCode: data.exitCode,
        durationMs: data.durationMs,
        sandboxMode: data.sandboxMode,
        tableRows: data.tableRows,
      });
    },
    onError: (err) => {
      setPlaygroundResult({
        stdout: "",
        stderr: err.message || "Sandbox execution failed.",
        exitCode: 1,
        durationMs: 0,
        sandboxMode: "ERROR",
      });
    },
  });

  const notes: TopicStudyMaterial | null = React.useMemo(() => {
    if (!topicTitle) return null;
    return getTopicStudyNotes(topicTitle, courseTitle, moduleTitle);
  }, [topicTitle, courseTitle, moduleTitle]);

  // Initialize default starter code whenever topic changes
  React.useEffect(() => {
    if (!notes) return;
    const firstCmd = notes.practicalLab.commandsOrCode[0];
    const firstEx = notes.practicalExamples?.[0];
    const rawLang = firstCmd?.language || firstEx?.language || "python";
    const mappedLang = mapLanguageToSandbox(rawLang);
    const starter =
      firstCmd?.code ||
      firstEx?.code ||
      `# SoftLab Global — Interactive Python 3.11 Sandbox\nprint("Studying Topic: ${notes.title}")\n`;
    setPlaygroundLang(mappedLang);
    setPlaygroundCode(starter);
    setDefaultPlaygroundCode(starter);
    setPlaygroundStdin("");
    setPlaygroundResult(null);
  }, [notes]);

  if (!topicTitle || !notes) return null;

  const isCompleted = completedTopics.has(topicTitle.toLowerCase().trim());

  const currentIndex = allTopics.findIndex(
    (t) => t.toLowerCase().trim() === topicTitle.toLowerCase().trim()
  );
  const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null;
  const nextTopic = currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null;

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(idx);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const handleRunPlayground = () => {
    if (!playgroundCode.trim()) return;
    executeCodeMutation.mutate({
      labType: "PROGRAMMING",
      language: playgroundLang,
      code: playgroundCode,
      stdin: playgroundStdin || undefined,
    });
  };

  const handleLoadIntoPlayground = (code: string, lang?: string) => {
    setPlaygroundLang(mapLanguageToSandbox(lang));
    setPlaygroundCode(code);
    setPlaygroundResult(null);
    setActiveTab("lab");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] sm:w-[94vw] max-w-[1440px] h-[92vh] sm:h-[90vh] max-h-[92vh] sm:max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white rounded-2xl border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 sm:p-6 pr-14 sm:pr-16 text-white border-b border-slate-800 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px] font-medium">
                {notes.category}
              </Badge>
              <span className="flex items-center gap-1 text-slate-400 text-xs">
                <Clock className="h-3 w-3" /> {notes.readingTimeMin} min read
              </span>
            </div>

            <Button
              size="sm"
              variant={isCompleted ? "secondary" : "default"}
              onClick={() => onMarkComplete && onMarkComplete(topicTitle)}
              className={
                isCompleted
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 text-xs h-8 px-3"
                  : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8 px-3"
              }
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              {isCompleted ? "Understood ✓" : "Mark as Understood"}
            </Button>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-400 flex-shrink-0" />
            <span>{notes.title}</span>
          </DialogTitle>

          <DialogDescription className="text-slate-300 text-xs mt-1">
            {moduleTitle ? `${moduleTitle} • ` : ""}Official SoftLab Global Deep-Dive Study Guide & Live Code Playground
          </DialogDescription>

          {/* Navigation Tabs (6 Tabs) */}
          <div className="flex items-center gap-1.5 mt-5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "notes"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> Core Concepts
            </button>

            <button
              onClick={() => setActiveTab("architecture")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "architecture"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Architecture & Flow
            </button>

            <button
              onClick={() => setActiveTab("lab")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "lab"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" /> Hands-on Lab & Code Playground
            </button>

            <button
              onClick={() => setActiveTab("examples")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "examples"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Cpu className="h-3.5 w-3.5" /> Practical Examples & Exercises
            </button>

            <button
              onClick={() => setActiveTab("troubleshooting")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "troubleshooting"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Wrench className="h-3.5 w-3.5" /> Troubleshooting
            </button>

            <button
              onClick={() => setActiveTab("interview")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "interview"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" /> Interview Prep & References
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-sm">
          {/* TAB 1: CORE CONCEPTS */}
          {activeTab === "notes" && (
            <div className="space-y-5">
              {/* Executive Overview */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl leading-relaxed text-slate-800">
                <span className="font-semibold text-emerald-950 flex items-center gap-1.5 mb-1 text-sm">
                  <Sparkles className="h-4 w-4 text-emerald-600" /> Executive Overview
                </span>
                <p className="text-xs sm:text-sm text-slate-700">{notes.overview}</p>
              </div>

              {/* Learning Objectives */}
              {notes.learningObjectives && notes.learningObjectives.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-600" />
                    Learning Objectives
                  </h4>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-slate-700">
                    {notes.learningObjectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Syntax Reference Block */}
              {notes.syntaxSummary && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-indigo-600" />
                      Canonical Syntax & Idiom Reference
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLoadIntoPlayground(notes.syntaxSummary!, "python")}
                      className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1"
                    >
                      <Play className="h-3 w-3" /> Try in Code Playground
                    </Button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                    {notes.syntaxSummary}
                  </pre>
                </div>
              )}

              {/* Technical Concepts */}
              {notes.concepts.map((concept, cIdx) => (
                <div key={cIdx} className="space-y-2 border-b border-slate-100 pb-4 last:border-0">
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {concept.heading}
                  </h4>
                  <ul className="space-y-2 pl-4 list-disc text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {concept.points.map((pt, pIdx) => (
                      <li key={pIdx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Real-World Applications & Best Practices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.realWorldApplications && notes.realWorldApplications.length > 0 && (
                  <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2">
                    <h5 className="font-bold text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-indigo-600" /> Real-World Applications
                    </h5>
                    <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-700">
                      {notes.realWorldApplications.map((app, idx) => (
                        <li key={idx}>{app}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {notes.bestPractices && notes.bestPractices.length > 0 && (
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
                    <h5 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-emerald-600" /> Industry Best Practices
                    </h5>
                    <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-700">
                      {notes.bestPractices.map((bp, idx) => (
                        <li key={idx}>{bp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Topic Summary */}
              {notes.summary && (
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs leading-relaxed">
                  <strong className="text-emerald-400">Key Takeaway Summary: </strong>
                  {notes.summary}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ARCHITECTURE & SYSTEM FLOW */}
          {activeTab === "architecture" && (
            <div className="space-y-5">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {notes.architecture.explanation}
              </p>

              {notes.architecture.diagram && (
                <div className="bg-slate-950 text-emerald-400 p-5 rounded-xl font-mono text-xs overflow-x-auto shadow-inner border border-slate-800 leading-normal">
                  <pre className="font-mono text-xs leading-relaxed whitespace-pre min-w-max">
                    {notes.architecture.diagram}
                  </pre>
                </div>
              )}

              {notes.architecture.specifications && notes.architecture.specifications.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Technical Specifications
                  </div>
                  <div className="divide-y divide-slate-100">
                    {notes.architecture.specifications.map((spec, sIdx) => (
                      <div key={sIdx} className="px-4 py-2.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">{spec.key}</span>
                        <span className="font-mono text-slate-900 font-semibold">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HANDS-ON COMMANDS & LIVE CODE PLAYGROUND */}
          {activeTab === "lab" && (
            <div className="space-y-6">
              {/* Interactive Live Code Playground */}
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-slate-950 text-white overflow-hidden shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Terminal className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        Interactive Live Code Playground
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                          Docker Isolated Sandbox
                        </Badge>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Edit the code below, supply optional Stdin input, and click Run Code to execute live.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={playgroundLang}
                      onChange={(e) => setPlaygroundLang(e.target.value)}
                      className="h-8 rounded-lg bg-slate-800 border border-slate-700 px-2.5 text-xs text-slate-200 font-mono"
                    >
                      {PLAYGROUND_LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(playgroundCode, 9999)}
                      className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 gap-1"
                    >
                      {copiedCodeIndex === 9999 ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPlaygroundCode(defaultPlaygroundCode);
                        setPlaygroundStdin("");
                        setPlaygroundResult(null);
                      }}
                      className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 gap-1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </Button>

                    <Button
                      size="sm"
                      disabled={executeCodeMutation.isPending}
                      onClick={handleRunPlayground}
                      className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-1.5 px-3"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      {executeCodeMutation.isPending ? "Running..." : "Run Code"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
                  <div className="lg:col-span-2 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>SOURCE CODE EDITOR ({playgroundLang.toUpperCase()})</span>
                      <span>UTF-8 • PEP 8</span>
                    </div>
                    <textarea
                      value={playgroundCode}
                      onChange={(e) => setPlaygroundCode(e.target.value)}
                      rows={11}
                      spellCheck={false}
                      className="w-full rounded-xl bg-slate-900/90 border border-slate-800 p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 leading-relaxed resize-y"
                      placeholder="Write your code here..."
                    />
                  </div>

                  <div className="p-3 space-y-3 flex flex-col justify-between bg-slate-900/40">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-400 block">
                        STANDARD INPUT (stdin) — Optional
                      </label>
                      <textarea
                        value={playgroundStdin}
                        onChange={(e) => setPlaygroundStdin(e.target.value)}
                        rows={3}
                        spellCheck={false}
                        placeholder="Enter input lines for input()..."
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>EXECUTION OUTPUT</span>
                        {playgroundResult && (
                          <span
                            className={
                              playgroundResult.exitCode === 0 ? "text-emerald-400" : "text-rose-400"
                            }
                          >
                            Exit: {playgroundResult.exitCode} ({playgroundResult.durationMs}ms)
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-h-[120px] rounded-lg bg-black/80 border border-slate-800 p-3 font-mono text-xs overflow-x-auto">
                        {executeCodeMutation.isPending ? (
                          <span className="text-amber-300 animate-pulse">
                            Executing inside isolated sandbox container...
                          </span>
                        ) : playgroundResult ? (
                          <div className="space-y-2">
                            {playgroundResult.stdout && (
                              <pre className="text-emerald-400 whitespace-pre-wrap">
                                {playgroundResult.stdout}
                              </pre>
                            )}
                            {playgroundResult.stderr && (
                              <pre className="text-rose-400 whitespace-pre-wrap">
                                {playgroundResult.stderr}
                              </pre>
                            )}
                            {!playgroundResult.stdout && !playgroundResult.stderr && (
                              <span className="text-slate-500">
                                Program finished with no output (exit code 0).
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">
                            Click &quot;Run Code&quot; to execute this program and view live output.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reference Lab Snippets */}
              <div className="border-l-4 border-sky-500 pl-3 py-1">
                <h4 className="font-bold text-slate-900 text-sm">{notes.practicalLab.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  <strong>Prerequisites:</strong> {notes.practicalLab.prerequisites}
                </p>
              </div>

              {notes.practicalLab.commandsOrCode.map((cmd, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-700">{cmd.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLoadIntoPlayground(cmd.code, cmd.language)}
                      className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1"
                    >
                      <Play className="h-3 w-3" /> Load into Playground
                    </Button>
                  </div>
                  <div className="relative group rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 text-[11px] text-slate-400 border-b border-slate-800 font-mono">
                      <span>{cmd.language.toUpperCase()}</span>
                      <button
                        onClick={() => handleCopy(cmd.code, idx)}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        {copiedCodeIndex === idx ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                      {cmd.code}
                    </pre>
                  </div>
                </div>
              ))}

              {notes.practicalLab.expectedOutput && (
                <div className="p-3 bg-slate-100 rounded-xl text-xs space-y-1">
                  <span className="font-semibold text-slate-700">Expected Terminal Output:</span>
                  <pre className="font-mono text-slate-800 text-[11px] whitespace-pre-wrap">
                    {notes.practicalLab.expectedOutput}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PRACTICAL EXAMPLES & EXERCISES */}
          {activeTab === "examples" && (
            <div className="space-y-6">
              {(!notes.practicalExamples || notes.practicalExamples.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                  <Cpu className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="font-medium text-sm">Industry Scenario Implementation</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Review the Hands-on Lab & Code Playground tab for executable snippets.
                  </p>
                </div>
              ) : (
                notes.practicalExamples.map((ex, exIdx) => (
                  <div key={exIdx} className="space-y-3 p-5 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          Scenario {exIdx + 1}
                        </span>
                        <span>{ex.title}</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          {ex.language}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadIntoPlayground(ex.code, ex.language)}
                          className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1"
                        >
                          <Play className="h-3 w-3" /> Run in Playground
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                      <strong>Business Context:</strong> {ex.scenario}
                    </p>
                    <div className="relative group rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 text-[11px] text-slate-400 border-b border-slate-800 font-mono">
                        <span>{ex.language.toUpperCase()} PRODUCTION SCRIPT</span>
                        <button
                          onClick={() => handleCopy(ex.code, 1000 + exIdx)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          {copiedCodeIndex === 1000 + exIdx ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                        {ex.code}
                      </pre>
                    </div>
                    {ex.output && (
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-200 font-mono">
                        <span className="text-[10px] text-slate-400 uppercase block mb-1">
                          Expected Output:
                        </span>
                        <pre className="whitespace-pre-wrap text-emerald-300">{ex.output}</pre>
                      </div>
                    )}
                    <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-200 text-xs text-slate-700 space-y-2">
                      <div>
                        <strong className="text-emerald-950 font-semibold">Detailed Code Walkthrough:</strong>
                        <p className="mt-1 leading-relaxed">{ex.explanation}</p>
                      </div>
                      {ex.lineByLine && ex.lineByLine.length > 0 && (
                        <div className="pt-2 border-t border-emerald-200/70">
                          <strong className="text-emerald-950 font-semibold block mb-1">
                            Line-by-Line Execution Breakdown:
                          </strong>
                          <ul className="space-y-1 pl-4 list-disc text-slate-700">
                            {ex.lineByLine.map((line, lIdx) => (
                              <li key={lIdx}>{line}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Student Coding Exercises */}
              {notes.exercises && notes.exercises.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-emerald-600" />
                    Hands-on Coding Exercises
                  </h4>
                  {notes.exercises.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2.5 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-indigo-600 text-white text-[10px]">
                            Exercise {idx + 1} • {ex.difficulty}
                          </Badge>
                          <span className="font-bold text-slate-900 text-sm">{ex.title}</span>
                        </div>
                        {ex.starterCode && (
                          <Button
                            size="sm"
                            onClick={() => handleLoadIntoPlayground(ex.starterCode!, "python")}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <Play className="h-3 w-3" /> Solve in Code Playground
                          </Button>
                        )}
                      </div>
                      <p className="text-slate-700 leading-relaxed">{ex.prompt}</p>
                      {ex.expectedOutput && (
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-800">
                          <strong className="text-slate-500 block mb-0.5">Expected Output:</strong>
                          <pre className="whitespace-pre-wrap">{ex.expectedOutput}</pre>
                        </div>
                      )}
                      <p className="text-[11px] text-indigo-900">
                        <strong>Hint:</strong> {ex.solutionHint}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TROUBLESHOOTING */}
          {activeTab === "troubleshooting" && (
            <div className="space-y-4">
              {notes.troubleshooting.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No critical known faults reported for this topic. Follow standard operational guidelines.
                </p>
              ) : (
                notes.troubleshooting.map((t, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-rose-900 font-bold text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                      <span>{t.issue}</span>
                    </div>
                    <div className="pl-3.5 space-y-1 text-slate-700">
                      <p>
                        <strong className="text-slate-900">Root Cause:</strong> {t.cause}
                      </p>
                      <p className="text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                        <strong className="text-emerald-950">Resolution Procedure:</strong> {t.solution}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 6: INTERVIEW PREP & AUTHORITATIVE REFERENCES */}
          {activeTab === "interview" && (
            <div className="space-y-6">
              <div className="space-y-4">
                {notes.interviewPrep.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                    <div className="font-bold text-slate-900 text-sm flex items-start gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono">
                        Q{idx + 1}
                      </span>
                      <span>{item.question}</span>
                    </div>
                    <div className="pl-6 text-slate-700 leading-relaxed">
                      <p className="text-xs sm:text-sm">{item.answer}</p>
                      {item.tip && (
                        <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                          <span>
                            <strong>Mentor Tip:</strong> {item.tip}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {notes.references && notes.references.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    Authoritative Educational References & Further Reading
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {notes.references.map((ref, idx) => (
                      <a
                        key={idx}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 transition-colors flex flex-col justify-between gap-1 text-xs group"
                      >
                        <span className="text-[10px] font-bold uppercase text-emerald-700">
                          {ref.source}
                        </span>
                        <span className="font-semibold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between gap-1">
                          <span className="truncate">{ref.title}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div>
            {prevTopic ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectTopic && onSelectTopic(prevTopic)}
                className="text-xs h-8"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous: {prevTopic.slice(0, 24)}
              </Button>
            ) : (
              <span className="text-slate-400 text-[11px]">First topic in module</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {nextTopic && (
              <Button
                size="sm"
                onClick={() => onSelectTopic && onSelectTopic(nextTopic)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8"
              >
                Next: {nextTopic.slice(0, 24)} <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
