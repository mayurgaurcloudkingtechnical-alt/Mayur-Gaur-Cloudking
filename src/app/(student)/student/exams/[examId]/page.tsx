"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/trpc/react";
import { ExamPlayer } from "@/components/exam/exam-player";
import { AlertCircle, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function StudentExamDetailPage() {
  const params = useParams();
  const examId = params?.examId as string;

  const [activeAttempt, setActiveAttempt] = useState<any>(null);

  const { data, isLoading, error } = api.exam.getStudentExam.useQuery(
    { examId },
    { enabled: Boolean(examId) }
  );

  const startAttemptMutation = api.exam.startAttempt.useMutation();

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Exam Not Available</h2>
        <p className="text-sm text-slate-600">{error?.message || "Could not load exam details."}</p>
        <Link
          href="/student/exams"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Exams</span>
        </Link>
      </div>
    );
  }

  const { exam, attemptCount, canAttempt } = data;

  if (activeAttempt) {
    return <ExamPlayer exam={exam} initialAttempt={activeAttempt} />;
  }

  const handleStartExam = async () => {
    try {
      const attempt = await startAttemptMutation.mutateAsync({ examId });
      setActiveAttempt(attempt);
    } catch (err: any) {
      alert(err.message || "Failed to start exam attempt.");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link
        href="/student/exams"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Assessments</span>
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 uppercase">
              {exam.type === "FINAL_EXAM" ? "Final Certification Exam" : "Module Assessment"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
          <p className="text-sm text-slate-500 mt-1">Course: {exam.course?.title}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
          <div>
            <span className="text-xs text-slate-500">Duration</span>
            <div className="text-base font-bold text-slate-800">{exam.durationMinutes} mins</div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Total Marks</span>
            <div className="text-base font-bold text-slate-800">{exam.totalMarks}</div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Pass Mark</span>
            <div className="text-base font-bold text-slate-800">{exam.passingPercentage}%</div>
          </div>
          <div>
            <span className="text-xs text-slate-500">Attempts</span>
            <div className="text-base font-bold text-slate-800">
              {attemptCount} / {exam.maxAttempts}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Important Instructions</span>
          </h3>
          <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
            <li>Ensure you have a stable internet connection before launching the exam.</li>
            <li>Do not refresh, reload, or navigate away from the exam tab during your attempt.</li>
            <li>The timer will run continuously once you start the attempt.</li>
            {exam.negativeMarking && (
              <li className="text-rose-600 font-medium">
                Negative marking is enabled: -{exam.negativeMarksPerQuestion} mark(s) for each incorrect answer.
              </li>
            )}
            <li>The exam will automatically submit when the timer expires.</li>
          </ul>
        </div>

        <div className="pt-4 border-t flex items-center justify-end">
          {canAttempt ? (
            <button
              onClick={handleStartExam}
              disabled={startAttemptMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition disabled:opacity-50"
            >
              {startAttemptMutation.isPending ? "Preparing Exam..." : "Start Examination Now"}
            </button>
          ) : (
            <div className="text-sm text-rose-600 font-medium">
              Maximum attempt limit reached ({exam.maxAttempts}). You cannot retake this exam.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}