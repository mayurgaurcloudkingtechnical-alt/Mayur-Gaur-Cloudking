"use client";

import React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { FileText, ArrowRight, BookOpen, CheckCircle2, Clock } from "lucide-react";

export default function StudentAssignmentsPage() {
  const { data: overview, isLoading } = api.student.getDashboardOverview.useQuery();

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-56 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const enrollments = overview?.enrollments || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Practical Assignments & Labs</h1>
        <p className="text-sm text-slate-600">
          Access module exercises, hands-on projects, and lab submissions for your enrolled programs.
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No Active Course Assignments</h3>
          <p className="text-sm text-slate-500 mt-1">
            Once enrolled in a course or internship, your practical lab tasks will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((enrollment: any) => (
            <div
              key={enrollment.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-emerald-300 transition flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <BookOpen className="w-3.5 h-3.5" />
                    {enrollment.course?.code || "COURSE"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    {enrollment.progressPercent >= 100 ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Completed
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {enrollment.progressPercent || 0}% Progress
                      </>
                    )}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {enrollment.course?.title || "Enrolled Program"}
                </h3>
                <p className="text-xs text-slate-600">
                  Open the interactive LMS workspace to complete module assignments, coding labs, and project checkpoints.
                </p>
              </div>

              <Link
                href={`/student/learning/${enrollment.id}`}
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition"
              >
                <span>Open Assignments & Labs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
