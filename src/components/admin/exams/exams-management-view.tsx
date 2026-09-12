"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import { FileQuestion, Plus, CheckCircle, Clock, Search } from "lucide-react";

export function ExamsManagementView() {
  const [activeTab, setActiveTab] = useState<"exams" | "questions">("exams");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const { data: coursesData } = api.course.list.useQuery({});
  const courses = coursesData?.courses || [];
  const { data: exams, refetch: refetchExams } = api.exam.listAdminExams.useQuery({
    courseId: selectedCourseId || undefined,
  });

  const updateStatusMutation = api.exam.updateStatus.useMutation({
    onSuccess: () => refetchExams(),
  });

  const handleToggleStatus = async (exam: any) => {
    const nextStatus = exam.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await updateStatusMutation.mutateAsync({ id: exam.id, status: nextStatus });
    } catch (err: any) {
      alert(err.message || "Failed to update exam status.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exams & Question Bank</h1>
          <p className="text-sm text-slate-600">
            Create, publish, and manage quizzes, final examinations, and question repositories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white text-slate-700"
          >
            <option value="">All Courses</option>
            {courses?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("exams")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "exams"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Examinations ({exams?.length || 0})
        </button>
      </div>

      {/* Exams Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="px-5 py-3.5">Title</th>
              <th className="px-5 py-3.5">Course</th>
              <th className="px-5 py-3.5">Type</th>
              <th className="px-5 py-3.5">Duration</th>
              <th className="px-5 py-3.5">Pass %</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {exams && exams.length > 0 ? (
              exams.map((exam: any) => (
                <tr key={exam.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-semibold text-slate-900">{exam.title}</td>
                  <td className="px-5 py-4 text-slate-600 text-xs">{exam.course?.title}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {exam.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 text-xs">{exam.durationMinutes} mins</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-700">
                    {exam.passingPercentage}%
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        exam.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {exam.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(exam)}
                      disabled={updateStatusMutation.isPending}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
                    >
                      {exam.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-500 text-sm">
                  No exams found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}