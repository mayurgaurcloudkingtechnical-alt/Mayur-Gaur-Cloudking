"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Award,
  HelpCircle,
} from "lucide-react";

export default function StudentResultDetailPage() {
  const params = useParams();
  const attemptId = params?.attemptId as string;

  const { data: attempt, isLoading, error } = api.exam.getAttemptResult.useQuery(
    { attemptId },
    { enabled: Boolean(attemptId) }
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Result Not Found</h2>
        <p className="text-sm text-slate-500">{error?.message || "Could not retrieve attempt result."}</p>
        <Link href="/student/results" className="text-sm text-primary font-semibold">
          Back to Results
        </Link>
      </div>
    );
  }

  const { exam, answers } = attempt;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link
        href="/student/results"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Results</span>
      </Link>

      {/* Header Summary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 uppercase">
              Assessment Summary
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">{exam.title}</h1>
            <p className="text-xs text-slate-500">{exam.course?.title}</p>
          </div>

          <div
            className={`px-5 py-3 rounded-xl border flex items-center gap-3 ${
              attempt.isPassed
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {attempt.isPassed ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : (
              <XCircle className="w-8 h-8 text-rose-600" />
            )}
            <div>
              <div className="text-xs uppercase font-bold tracking-wider">Status</div>
              <div className="text-xl font-black">{attempt.isPassed ? "PASSED" : "NOT PASSED"}</div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500">Score Earned</span>
            <div className="text-xl font-bold text-slate-900">
              {attempt.finalScore} / {exam.totalMarks}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500">Percentage</span>
            <div className="text-xl font-bold text-slate-900">{attempt.percentage}%</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500">Correct / Total</span>
            <div className="text-xl font-bold text-slate-900">
              {attempt.correctAnswers} / {attempt.totalQuestions}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500">Time Taken</span>
            <div className="text-xl font-bold text-slate-900">
              {attempt.timeTakenSeconds ? `${Math.floor(attempt.timeTakenSeconds / 60)}m` : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Answer Review Section */}
      {exam.allowReview && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Question Review & Explanations</h2>

          <div className="space-y-4">
            {answers.map((ans: any, idx: number) => {
              const q = ans.question;
              const options = Array.isArray(q.options) ? q.options : [];

              return (
                <div
                  key={ans.id}
                  className={`bg-white border rounded-xl p-5 shadow-sm space-y-3 ${
                    ans.isCorrect ? "border-slate-200" : "border-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs border-b pb-2">
                    <span className="font-semibold text-slate-700">Question {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded ${
                          ans.isCorrect
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {ans.marksAwarded > 0 ? `+${ans.marksAwarded}` : ans.marksAwarded} Marks
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-900 whitespace-pre-wrap">
                    {q.questionText}
                  </p>

                  {/* Options List */}
                  <div className="space-y-1.5 text-xs">
                    {options.map((opt: any) => {
                      const isUserChoice = ans.selectedAnswer === opt.id;
                      const isCorrectChoice = q.correctAnswer === opt.id;

                      let rowClass = "p-2 rounded border border-slate-100 bg-slate-50 text-slate-700";
                      if (isCorrectChoice) {
                        rowClass = "p-2 rounded border border-emerald-300 bg-emerald-50/70 text-emerald-900 font-medium";
                      } else if (isUserChoice && !isCorrectChoice) {
                        rowClass = "p-2 rounded border border-rose-300 bg-rose-50/70 text-rose-900 font-medium";
                      }

                      return (
                        <div key={opt.id} className={`flex items-center justify-between ${rowClass}`}>
                          <span>{opt.text}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider">
                            {isCorrectChoice && "✓ Correct Answer"}
                            {isUserChoice && !isCorrectChoice && "✗ Your Answer"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation if present */}
                  {q.explanation && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                      <div>
                        <span className="font-bold">Explanation: </span>
                        <span>{q.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}