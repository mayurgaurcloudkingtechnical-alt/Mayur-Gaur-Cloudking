"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowRight,
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
  const [activeTab, setActiveTab] = React.useState<"notes" | "architecture" | "lab" | "troubleshooting" | "interview">("notes");

  if (!topicTitle) return null;

  const notes: TopicStudyMaterial = getTopicStudyNotes(topicTitle, courseTitle, moduleTitle);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white sm:rounded-2xl border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 text-white border-b border-slate-800">
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
            {moduleTitle ? `${moduleTitle} • ` : ""}Official SoftLab Global Deep-Dive Study Guide
          </DialogDescription>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "notes"
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> Core Concepts
            </button>

            <button
              onClick={() => setActiveTab("architecture")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "architecture"
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Architecture & Flow
            </button>

            <button
              onClick={() => setActiveTab("lab")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "lab"
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" /> Hands-on Commands
            </button>

            <button
              onClick={() => setActiveTab("troubleshooting")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "troubleshooting"
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Wrench className="h-3.5 w-3.5" /> Troubleshooting
            </button>

            <button
              onClick={() => setActiveTab("interview")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "interview"
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" /> Interview Q&A
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-sm">
          {/* TAB 1: CORE CONCEPTS */}
          {activeTab === "notes" && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl leading-relaxed text-slate-800">
                <span className="font-semibold text-emerald-950 flex items-center gap-1.5 mb-1 text-sm">
                  <Sparkles className="h-4 w-4 text-emerald-600" /> Executive Overview
                </span>
                <p className="text-xs sm:text-sm text-slate-700">{notes.overview}</p>
              </div>

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
            </div>
          )}

          {/* TAB 2: ARCHITECTURE & SYSTEM FLOW */}
          {activeTab === "architecture" && (
            <div className="space-y-5">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {notes.architecture.explanation}
              </p>

              {notes.architecture.diagram && (
                <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner border border-slate-800 leading-tight">
                  <pre>{notes.architecture.diagram}</pre>
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

          {/* TAB 3: HANDS-ON COMMANDS & LAB */}
          {activeTab === "lab" && (
            <div className="space-y-5">
              <div className="border-l-4 border-sky-500 pl-3 py-1">
                <h4 className="font-bold text-slate-900 text-sm">{notes.practicalLab.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  <strong>Prerequisites:</strong> {notes.practicalLab.prerequisites}
                </p>
              </div>

              {notes.practicalLab.commandsOrCode.map((cmd, idx) => (
                <div key={idx} className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-700">{cmd.description}</p>
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

          {/* TAB 4: TROUBLESHOOTING */}
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

          {/* TAB 5: INTERVIEW PREP */}
          {activeTab === "interview" && (
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
                        <span><strong>Mentor Tip:</strong> {item.tip}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
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
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous: {prevTopic.slice(0, 20)}...
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
                Next: {nextTopic.slice(0, 20)}... <ChevronRight className="ml-1 h-3.5 w-3.5" />
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
