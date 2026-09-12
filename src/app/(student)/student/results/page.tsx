"use client";

import React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Award, CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react";

export default function StudentResultsPage() {
  const { data: attempts, isLoading } = api.exam.listMyAttempts.useQuery();

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Exam Results & History</h1>
        <p className="text-sm text-slate-600">
          Review your score breakdowns and performance across past examinations.
        </p>
      </div>

      {!attempts || attempts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No Assessment Records</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            You haven&apos;t attempted any quizzes or examinations yet.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Exam Title</th>
                <th className="px-5 py-3.5">Attempt</th>
                <th className="px-5 py-3.5">Score</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {attempts.map((att: any) => (
                <tr key={att.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-4 font-medium text-slate-900">
                    <div>{att.exam.title}</div>
                    <div className="text-xs text-slate-400">{att.exam.course?.title}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-mono text-xs">
                    #{att.attemptNumber}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">
                      {att.finalScore} / {att.exam.totalMarks}
                    </div>
                    <div className="text-xs text-slate-500">{att.percentage}%</div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        att.isPassed
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {att.isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{att.isPassed ? "PASSED" : "FAILED"}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {new Date(att.startedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/student/results/${att.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Breakdown</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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