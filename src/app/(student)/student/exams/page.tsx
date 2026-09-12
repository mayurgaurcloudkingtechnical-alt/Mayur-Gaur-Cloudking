"use client";

import React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { FileQuestion, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default function StudentExamsPage() {
  const { data: exams, isLoading } = api.exam.listStudentExams.useQuery();

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Exams & Assessments</h1>
        <p className="text-sm text-slate-600">
          Take course quizzes and final certification exams to validate your knowledge.
        </p>
      </div>

      {!exams || exams.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FileQuestion className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No Exams Available</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            There are currently no published exams for your enrolled courses. Check back after completing modules.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam: any) => {
            const hasAttempt = Boolean(exam.latestAttempt);
            const isPassed = exam.latestAttempt?.isPassed;

            return (
              <div
                key={exam.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                      {exam.type === "FINAL_EXAM" ? "Final Exam" : "Module Quiz"}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Attempts: {exam.userAttemptCount} / {exam.maxAttempts}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{exam.title}</h3>
                  <p className="text-xs text-slate-500 mb-3">{exam.course?.title}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-600 border-t pt-3 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.durationMinutes} Mins</span>
                    </div>
                    <div>
                      <span>Total Marks: </span>
                      <span className="font-semibold text-slate-800">{exam.totalMarks}</span>
                    </div>
                    <div>
                      <span>Pass: </span>
                      <span className="font-semibold text-slate-800">{exam.passingPercentage}%</span>
                    </div>
                  </div>

                  {hasAttempt && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-medium mb-4 flex items-center justify-between ${
                        isPassed
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <span>{isPassed ? "Passed" : "Not Passed"}</span>
                      </div>
                      <span className="font-mono font-bold">
                        {exam.latestAttempt.percentage}% ({exam.latestAttempt.finalScore} marks)
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t flex items-center justify-between">
                  {hasAttempt && (
                    <Link
                      href={`/student/results/${exam.latestAttempt.id}`}
                      className="text-xs text-slate-600 hover:text-slate-900 font-medium underline"
                    >
                      View Result
                    </Link>
                  )}

                  {exam.canAttempt ? (
                    <Link
                      href={`/student/exams/${exam.id}`}
                      className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold ml-auto transition"
                    >
                      <span>{hasAttempt ? "Retake Exam" : "Start Exam"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400 italic ml-auto">No attempts remaining</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
