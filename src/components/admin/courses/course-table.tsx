"use client";

import * as React from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContentStatus } from "@prisma/client";
import { api } from "@/lib/trpc/react";
import { ExternalLink, Edit2, Eye, Archive, CheckCircle, Clock } from "lucide-react";
import { EditCourseDialog } from "./edit-course-dialog";

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  durationWeeks: number;
  baseFee: number;
  level?: string | null;
  language?: string | null;
  eligibility?: string | null;
  status: ContentStatus;
  _count: {
    batches: number;
  };
  trainers: Array<{
    trainerId: string;
    trainer: {
      user: {
        id: string;
        firstName: string;
        lastName: string;
      };
    };
  }>;
}

interface CourseTableProps {
  courses: CourseItem[];
  isLoading?: boolean;
}

export function CourseTable({ courses, isLoading }: CourseTableProps) {
  const [editingCourse, setEditingCourse] = React.useState<CourseItem | null>(null);
  const utils = api.useUtils();

  const setStatusMutation = api.course.setStatus.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <p className="text-sm text-slate-500">Loading courses catalog...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-semibold text-slate-700">No courses found</p>
        <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filters.</p>
      </div>
    );
  }

  function getStatusBadge(status: ContentStatus) {
    switch (status) {
      case "PUBLISHED":
        return <Badge variant="success">PUBLISHED</Badge>;
      case "DRAFT":
        return <Badge variant="default" className="bg-amber-100 text-amber-800">DRAFT</Badge>;
      case "ARCHIVED":
        return <Badge variant="secondary">ARCHIVED</Badge>;
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Base Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Batches</TableHead>
              <TableHead>Assigned Faculty</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((c) => {
              const formattedPrice = `₹${(c.baseFee / 100).toLocaleString("en-IN")}`;

              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{c.title}</div>
                    <div className="font-mono text-[11px] text-slate-400">/{c.slug}</div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {c.durationWeeks} weeks
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900 text-sm">{formattedPrice}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {c.baseFee} Paise
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(c.status)}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">
                    {c._count.batches}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {c.trainers.length === 0 ? (
                      <span className="text-slate-400 italic">None</span>
                    ) : (
                      c.trainers.map((t) => `${t.trainer.user.firstName}`).join(", ")
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/admin/courses/${c.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setEditingCourse(c)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>

                      {c.status === "DRAFT" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700"
                          disabled={setStatusMutation.isPending}
                          onClick={() =>
                            setStatusMutation.mutate({
                              id: c.id,
                              status: ContentStatus.PUBLISHED,
                            })
                          }
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Publish
                        </Button>
                      )}

                      {c.status === "PUBLISHED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700"
                          disabled={setStatusMutation.isPending}
                          onClick={() =>
                            setStatusMutation.mutate({
                              id: c.id,
                              status: ContentStatus.DRAFT,
                            })
                          }
                        >
                          <Clock className="h-3.5 w-3.5 mr-1" /> Unpublish
                        </Button>
                      )}

                      {c.status !== "ARCHIVED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-slate-400 hover:text-slate-700"
                          disabled={setStatusMutation.isPending}
                          onClick={() =>
                            setStatusMutation.mutate({
                              id: c.id,
                              status: ContentStatus.ARCHIVED,
                            })
                          }
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <EditCourseDialog
        course={editingCourse}
        open={Boolean(editingCourse)}
        onOpenChange={(open) => {
          if (!open) setEditingCourse(null);
        }}
      />
    </>
  );
}
