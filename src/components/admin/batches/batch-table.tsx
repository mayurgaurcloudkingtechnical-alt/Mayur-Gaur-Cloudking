"use client";

import * as React from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BatchStatus, DeliveryMode } from "@prisma/client";
import { api } from "@/lib/trpc/react";
import { Eye, Edit2 } from "lucide-react";
import { EditBatchDialog } from "./edit-batch-dialog";

interface BatchItem {
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
  };
}

interface BatchTableProps {
  batches: BatchItem[];
  isLoading?: boolean;
}

export function BatchTable({ batches, isLoading }: BatchTableProps) {
  const [editingBatch, setEditingBatch] = React.useState<BatchItem | null>(null);
  const utils = api.useUtils();

  const updateStatusMutation = api.batch.updateStatus.useMutation({
    onSuccess: () => {
      utils.batch.list.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <p className="text-sm text-slate-500">Loading academic batches...</p>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
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
        return <Badge variant="success">ONGOING</Badge>;
      case "OPEN_FOR_ENROLLMENT":
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">ENROLLING</Badge>;
      case "UPCOMING":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">UPCOMING</Badge>;
      case "DRAFT":
        return <Badge variant="default" className="bg-amber-100 text-amber-800">DRAFT</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary">COMPLETED</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">CANCELLED</Badge>;
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Code & Name</TableHead>
              <TableHead>Academic Course</TableHead>
              <TableHead>Start - End Dates</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Faculty Lead</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((b) => {
              const primaryTrainer = b.trainers.find((t) => t.isPrimary)?.trainer.user;
              const formattedStart = new Date(b.startDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const formattedEnd = b.endDate
                ? new Date(b.endDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "TBD";

              return (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="font-mono text-xs font-bold text-emerald-700">{b.code}</div>
                    <div className="font-medium text-slate-800 text-sm">{b.name}</div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/courses/${b.course.id}`}
                      className="text-xs font-medium text-slate-900 hover:text-emerald-700 hover:underline line-clamp-1"
                    >
                      {b.course.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    <div>{formattedStart}</div>
                    <div className="text-[11px] text-slate-400">to {formattedEnd}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px]">
                      {b.deliveryMode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 font-medium">
                    {b.maxCapacity} seats
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {primaryTrainer ? (
                      <span>{primaryTrainer.firstName} {primaryTrainer.lastName}</span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(b.status)}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">
                    {b._count.classes} sessions
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/admin/batches/${b.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setEditingBatch(b)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
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
