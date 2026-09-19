"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BatchTable } from "./batch-table";
import { CreateBatchDialog } from "./create-batch-dialog";
import { api } from "@/lib/trpc/react";
import { Plus } from "lucide-react";

interface BatchesViewProps {
  initialCourseId?: string;
}

export function BatchesView({ initialCourseId }: BatchesViewProps) {
  // Filter form state
  const [batchName, setBatchName] = React.useState("");
  const [centre, setCentre] = React.useState("Softlab Global");
  const [courseId, setCourseId] = React.useState(initialCourseId || "");
  const [facultyId, setFacultyId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  // Applied query state
  const [queryFilters, setQueryFilters] = React.useState({
    batchName: "",
    courseId: initialCourseId || "",
    facultyId: "",
    startDate: "",
    endDate: "",
  });

  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);

  const { data: coursesData } = api.course.list.useQuery({ pageSize: 100 });
  const { data: trainersData } = api.batch.getAvailableTrainers.useQuery();

  const { data, isLoading } = api.batch.list.useQuery({
    courseId: queryFilters.courseId || undefined,
    facultyId: queryFilters.facultyId || undefined,
    startDate: queryFilters.startDate || undefined,
    endDate: queryFilters.endDate || undefined,
    search: queryFilters.batchName.trim() || undefined,
    page,
    pageSize: 10,
  });

  const batches = data?.batches || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryFilters({
      batchName,
      courseId,
      facultyId,
      startDate,
      endDate,
    });
    setPage(1);
  };

  const handleReset = () => {
    setBatchName("");
    setCentre("Softlab Global");
    setCourseId("");
    setFacultyId("");
    setStartDate("");
    setEndDate("");
    setQueryFilters({
      batchName: "",
      courseId: "",
      facultyId: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Top Header matching Batches.pdf */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Batches</h1>
          <p className="text-xs text-slate-500">Institutional cohorts, session schedules, and faculty assignment</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs px-4 py-2 rounded shadow-sm uppercase tracking-wide transition-colors"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" /> ADD NEW
        </button>
      </div>

      {/* Filter Card matching Batches.pdf specifications */}
      <form onSubmit={handleFilter} className="bg-white rounded border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Batch Name</label>
            <Input
              type="text"
              placeholder="Batch Name"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 focus:border-[#0088cc]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Centre</label>
            <select
              value={centre}
              onChange={(e) => setCentre(e.target.value)}
              className="block w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm focus:border-[#0088cc] focus:outline-none"
            >
              <option value="Softlab Global">Softlab Global</option>
              <option value="Main Campus">Main Campus</option>
              <option value="Online">Online Centre</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="block w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm focus:border-[#0088cc] focus:outline-none"
            >
              <option value="">Select Course</option>
              {coursesData?.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Faculty</label>
            <select
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              className="block w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-sm focus:border-[#0088cc] focus:outline-none"
            >
              <option value="">Select Faculty</option>
              {trainersData?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.firstName} {t.user.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Start Date</label>
            <Input
              type="date"
              placeholder="dd-mm-yyyy"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 focus:border-[#0088cc]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">End Date</label>
            <Input
              type="date"
              placeholder="dd-mm-yyyy"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 focus:border-[#0088cc]"
            />
          </div>
        </div>

        {/* Action Buttons matching Batches.pdf */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="submit"
            className="bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs px-5 py-1.5 rounded uppercase tracking-wide transition-colors shadow-sm"
          >
            FILTER
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="bg-[#2c3e50] hover:bg-[#1a252f] text-white font-bold text-xs px-5 py-1.5 rounded uppercase tracking-wide transition-colors shadow-sm"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Batches Table with expandable (+) rows */}
      <BatchTable batches={batches as any} isLoading={isLoading} />

      {/* Pagination Footer matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 text-xs text-slate-600">
        <div>
          Showing {total === 0 ? 0 : (page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} entries
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(1)}
            className="px-2.5 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 bg-[#0088cc] text-white font-semibold rounded text-xs">
            {page}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(totalPages)}
            className="px-2.5 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>

      <CreateBatchDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultCourseId={courseId}
      />
    </div>
  );
}
