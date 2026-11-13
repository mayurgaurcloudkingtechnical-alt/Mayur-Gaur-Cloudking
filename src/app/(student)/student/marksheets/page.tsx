"use client";

import React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { FileCheck2, CheckCircle2, XCircle, ArrowRight, Award } from "lucide-react";

export default function StudentMarksheetsPage() {
  const { data: attempts, isLoading } = api.exam.listMyAttempts.useQuery();

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-56 bg-slate-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const gradedAttempts = (attempts || []).filter((a: any) => a.submittedAt);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Academic Marksheets & Transcripts</h1>
        <p className="text-sm text-slate-600">
          View your official examination scorecards, pass/fail status, and percentage transcripts.
        </p>
      </div>

      {gradedAttempts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FileCheck2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No Marksheets Published Yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Complete your scheduled course examinations to generate official marksheets.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gradedAttempts.map((attempt: any) => {
            const passed = attempt.passed;
            const totalMarks = attempt.exam?.totalMarks || 100;
            const score = attempt.score ?? 0;
            const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

            return (
              <div
                key={attempt.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        passed
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {passed ? "PASSED" : "NEEDS IMPROVEMENT"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(attempt.submittedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {attempt.exam?.title || "Assessment Marksheet"}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Score: <strong>{score} / {totalMarks}</strong> ({percentage}%)
                  </p>
                </div>

                <Link
                  href={`/student/results/${attempt.id}`}
                  className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Detailed Scorecard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
