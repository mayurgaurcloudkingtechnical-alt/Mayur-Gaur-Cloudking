"use client";

import * as React from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BatchStatus, DeliveryMode } from "@prisma/client";
import { api } from "@/lib/trpc/react";
import { Eye, Edit2, Plus, Minus, Users, ClipboardCheck } from "lucide-react";
import { EditBatchDialog } from "./edit-batch-dialog";

export interface BatchItem {
  id: string;
  code: string;
  name: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  status: BatchStatus;
  maxCapacity: number;
  deliveryMode: DeliveryMode;
  location?: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
    durationWeeks: number;
  };
  trainers: Array<{
    isPrimary: boolean;
    trainerId: string;
    trainer: {
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  }>;
  _count: {
    classes: number;
    enrollments?: number;
  };
}

interface BatchTableProps {
  batches: BatchItem[];
  isLoading?: boolean;
}

export function BatchTable({ batches, isLoading }: BatchTableProps) {
  const [editingBatch, setEditingBatch] = React.useState<BatchItem | null>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

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

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded border border-slate-200 bg-white">
        <p className="text-sm text-slate-500">Loading academic batches...</p>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="font-semibold text-slate-700">No batches found</p>
        <p className="text-xs text-slate-500 mt-1">
          Try clearing your filters or create a new batch cohort.
        </p>
      </div>
    );
  }

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
    <>
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
            {batches.map((b) => {
              const isExpanded = expandedIds.has(b.id);
              const primaryTrainer = b.trainers.find((t) => t.isPrimary)?.trainer?.user || b.trainers[0]?.trainer?.user;
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
                    {/* Expandable toggle button (+) matching Batches.pdf */}
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
                        href={`/admin/courses/${b.course.id}`}
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
                        <span className="text-slate-400 italic">Unassigned</span>
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
                              href={`/admin/students?batchId=${b.id}`}
                              className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-[#0088cc] transition-colors border border-slate-200"
                              title="View Students"
                            >
                              <Users className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/admin/attendance?batchId=${b.id}`}
                              className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-[#0088cc] transition-colors border border-slate-200"
                              title="Mark Attendance"
                            >
                              <ClipboardCheck className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/admin/batches/${b.id}`}
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

      <EditBatchDialog
        batch={editingBatch}
        open={Boolean(editingBatch)}
        onOpenChange={(open) => {
          if (!open) setEditingBatch(null);
        }}
      />
    </>
  );
}
