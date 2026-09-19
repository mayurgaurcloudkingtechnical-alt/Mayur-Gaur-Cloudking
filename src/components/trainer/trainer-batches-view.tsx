"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/trpc/react";
import { BatchStatus, DeliveryMode } from "@prisma/client";
import { Plus, Minus, Edit2, Users, ClipboardCheck, Eye } from "lucide-react";
import { CreateBatchDialog } from "@/components/admin/batches/create-batch-dialog";
import { EditBatchDialog } from "@/components/admin/batches/edit-batch-dialog";

export function TrainerBatchesView() {
  // Filter form state
  const [batchName, setBatchName] = React.useState("");
  const [centre, setCentre] = React.useState("Softlab Global");
  const [courseId, setCourseId] = React.useState("");
  const [facultyId, setFacultyId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  // Applied query state
  const [queryFilters, setQueryFilters] = React.useState({
    batchName: "",
    courseId: "",
    facultyId: "",
    startDate: "",
    endDate: "",
  });

  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingBatch, setEditingBatch] = React.useState<any | null>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const { data: coursesData } = api.course.list.useQuery({ pageSize: 100 });
  const { data: trainersData } = api.batch.getAvailableTrainers.useQuery();

  const { data, isLoading, refetch } = api.batch.list.useQuery({
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

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

  function getStatusBadge(status: BatchStatus) {
    switch (status) {
      case "ONGOING":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Running</span>;
      case "OPEN_FOR_ENROLLMENT":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">Enrolling</span>;
      case "UPCOMING":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-100 text-sky-800">Upcoming</span>;
      case "DRAFT":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">Draft</span>;
      case "COMPLETED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">Completed</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header matching Batches.pdf (Page 3 & 4) */}
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
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 focus:border-[#0088cc]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 focus:border-[#0088cc]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            className="bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs h-8 px-6 rounded uppercase tracking-wide transition-colors shadow-sm"
          >
            FILTER
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="bg-[#2c3e50] hover:bg-[#1a252f] text-white font-bold text-xs h-8 px-6 rounded uppercase tracking-wide transition-colors shadow-sm"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Expandable Table matching Batches.pdf */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded border border-slate-200 bg-white">
          <p className="text-sm text-slate-500">Loading academic batches...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-semibold text-slate-700">No batches found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try clearing your filters or create a new batch cohort.
          </p>
        </div>
      ) : (
        <div className="rounded border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-[#f8fafc] border-b border-slate-200">
              <TableRow>
                <TableHead className="w-10 text-center px-2"></TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider py-3">Name</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider py-3">Course</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider py-3">Batch Time</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider py-3">Faculty</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider py-3">Facility</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider py-3">Batch Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b: any) => {
                const isExpanded = expandedIds.has(b.id);
                const primaryTrainer = b.trainers?.find((t: any) => t.isPrimary)?.trainer?.user || b.trainers?.[0]?.trainer?.user;
                const formattedStart = new Date(b.startDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const formattedEnd = b.endDate
                  ? new Date(b.endDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "TBD";

                return (
                  <React.Fragment key={b.id}>
                    <TableRow className={`hover:bg-slate-50/70 transition-colors ${isExpanded ? "bg-slate-50/60" : ""}`}>
                      {/* Expandable toggle button (+) */}
                      <TableCell className="w-10 text-center px-2 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleExpand(b.id)}
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0088cc] text-white hover:bg-[#0077b3] transition-colors focus:outline-none focus:ring-1 focus:ring-[#0088cc]"
                          title={isExpanded ? "Collapse Details" : "Expand Details"}
                        >
                          {isExpanded ? (
                            <Minus className="w-3 h-3 stroke-[3]" />
                          ) : (
                            <Plus className="w-3 h-3 stroke-[3]" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="font-semibold text-slate-900 text-xs">{b.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{b.code}</div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Link
                          href={`/trainer/courses/${b.course.id}`}
                          className="text-xs font-medium text-slate-800 hover:text-[#0088cc] hover:underline line-clamp-1"
                        >
                          {b.course.title}
                        </Link>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-slate-600">
                        10:00 AM - 01:00 PM
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-slate-700 font-medium">
                        {primaryTrainer ? (
                          <span>{primaryTrainer.firstName} {primaryTrainer.lastName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Faculty Assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-slate-600">
                        {b.location || "Softlab Global • Lab A"}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded border border-slate-200 text-slate-700 bg-slate-50">
                          {b.deliveryMode}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Row Drawer matching Batches.pdf */}
                    {isExpanded && (
                      <TableRow className="bg-[#f8fafc] border-t border-b border-slate-200">
                        <TableCell colSpan={7} className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs flex-1">
                              <div>
                                <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">No Of Students</span>
                                <span className="text-slate-900 font-bold text-sm mt-0.5 block">
                                  {b._count?.enrollments ?? 0} Students
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">Status</span>
                                <div className="mt-1">{getStatusBadge(b.status)}</div>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">Start Date</span>
                                <span className="text-slate-800 font-medium text-xs mt-0.5 block">{formattedStart}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">End Date</span>
                                <span className="text-slate-800 font-medium text-xs mt-0.5 block">{formattedEnd}</span>
                              </div>
                            </div>

                            {/* Quick Action Icons matching Batches.pdf */}
                            <div className="flex items-center gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                              <button
                                type="button"
                                onClick={() => setEditingBatch(b)}
                                className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-[#0088cc] transition-colors border border-slate-200"
                                title="Edit Batch"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <Link
                                href={`/trainer/batches/${b.id}`}
                                className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-[#0088cc] transition-colors border border-slate-200"
                                title="View Students"
                              >
                                <Users className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/trainer/attendance?batchId=${b.id}`}
                                className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-[#0088cc] transition-colors border border-slate-200"
                                title="Mark Attendance"
                              >
                                <ClipboardCheck className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/trainer/batches/${b.id}`}
                                className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-[#0088cc] transition-colors border border-slate-200"
                                title="Batch Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Showing Page {page} of {totalPages} ({total} total batches)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs h-8"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs h-8"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateBatchDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => refetch()}
      />

      <EditBatchDialog
        batch={editingBatch}
        open={Boolean(editingBatch)}
        onOpenChange={(open) => {
          if (!open) setEditingBatch(null);
        }}
      />
    </div>
  );
}
