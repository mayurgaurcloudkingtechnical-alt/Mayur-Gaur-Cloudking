"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api as trpc } from "@/lib/trpc/react";
import { INITIAL_DIAGNOSTIC_QUESTIONS } from "@/lib/constants/skillverse-data";
import { CheckCircle2, AlertTriangle, Award, ArrowRight, Loader2 } from "lucide-react";

export default function SkillverseStudentAssessmentPage() {
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentClass, setCurrentClass] = useState("Class 9");
  const [board, setBoard] = useState("CBSE");
  const [parentConsentAccepted, setParentConsentAccepted] = useState(false);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const submitMutation = trpc.skillverse.submitDiagnosticAssessment.useMutation({
    onSuccess: (data) => {
      setErrorMsg(null);
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err) => {
      setErrorMsg(err.message || "Could not submit assessment.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!parentConsentAccepted) {
      setErrorMsg("Parent/Guardian consent is required to evaluate and store diagnostic scores.");
      return;
    }

    const answers = INITIAL_DIAGNOSTIC_QUESTIONS.map((q) => ({
      questionId: q.id,
      selectedIndex: selectedAnswers[q.id] ?? -1,
    }));

    submitMutation.mutate({
      studentName,
      parentName,
      phone,
      email,
      currentClass,
      board,
      answers,
      parentConsentAccepted,
    });
  };

  if (result) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="bg-white rounded-3xl border-2 border-emerald-200 p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase">
                <Award className="w-4 h-4" /> Diagnostic Report Card — {result.attemptId}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {result.studentName} ({result.currentClass} • {result.board})
              </h1>
            </div>
            <div className="bg-[#071630] text-white px-6 py-4 rounded-2xl text-center">
              <span className="text-xs text-slate-300 block">Diagnostic Score</span>
              <span className="text-3xl font-black text-lime-400">
                {result.score} / {result.maxScore} ({result.percentage}%)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs sm:text-sm text-blue-950">
            <strong>Recommended Skillverse Learning Pathway:</strong> {result.recommendedPackage}
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Subject-Wise Answer Review & Explanations
            </h2>
            {result.breakdown.map((item: any, idx: number) => (
              <div
                key={item.questionId}
                className={`p-4 rounded-2xl border text-xs ${
                  item.isCorrect
                    ? "bg-emerald-50/60 border-emerald-200"
                    : "bg-amber-50/60 border-amber-200"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                  <span>
                    Q{idx + 1}. {item.subject}
                  </span>
                  <span className={item.isCorrect ? "text-emerald-700" : "text-amber-700"}>
                    {item.isCorrect ? "Correct (+1)" : "Needs Concept Review"}
                  </span>
                </div>
                <p className="text-slate-700">{item.explanation}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <Link
              href="/skillverse/admissions"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              Proceed to Admission Counseling →
            </Link>
            <Link
              href="/skillverse/free-demo-class"
              className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
            >
              Book Free Demo Class
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="bg-gradient-to-r from-[#071630] to-[#0052CC] rounded-3xl p-8 text-white space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-lime-300">
          Zero-Cost Academic & Skill Diagnostic (₹0)
        </span>
        <h1 className="text-2xl sm:text-3xl font-black">
          SLG SKILLVERSE Student Diagnostic Assessment
        </h1>
        <p className="text-xs sm:text-sm text-slate-200">
          Evaluate baseline aptitude across Mathematics, Science, Logical Reasoning, Responsible AI
          Literacy, and English Grammar. Instant evaluation with answer explanations.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-900 text-base">
            1. Student & Parent Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Student Name *</label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Parent/Guardian Name *</label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Parent Mobile *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Parent Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Class *</label>
              <select
                value={currentClass}
                onChange={(e) => setCurrentClass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
              >
                <option value="Class 8">Class 8</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Board *</label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
              >
                <option value="CBSE">CBSE</option>
                <option value="ICSE / ISC">ICSE / ISC</option>
                <option value="UP Board">UP Board</option>
                <option value="State Board">State Board</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {INITIAL_DIAGNOSTIC_QUESTIONS.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-bold">
                  Question {idx + 1} • {q.subject}
                </span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{q.question}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {q.options.map((opt, optIdx) => {
                  const chosen = selectedAnswers[q.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() =>
                        setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                      }
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        chosen
                          ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/20"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}. {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={parentConsentAccepted}
              onChange={(e) => setParentConsentAccepted(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-blue-600"
            />
            <span>
              I am the parent/legal guardian and consent to evaluating this diagnostic assessment
              and receiving the student's academic recommendation report.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#15803D] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Evaluating Assessment...
              </>
            ) : (
              <>
                Submit Assessment & View Instant Scorecard <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
