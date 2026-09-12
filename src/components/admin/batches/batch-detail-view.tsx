"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { BatchStatus, DeliveryMode } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateClassDialog } from "./create-class-dialog";
import { EditBatchDialog } from "./edit-batch-dialog";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
} from "lucide-react";

interface BatchDetailViewProps {
  batchId: string;
}

export function BatchDetailView({ batchId }: BatchDetailViewProps) {
  const [scheduleModalOpen, setScheduleModalOpen] = React.useState(false);
  const [editBatchOpen, setEditBatchOpen] = React.useState(false);

  const { data: batch, isLoading, error } = api.batch.getById.useQuery({
    id: batchId,
  });

  const utils = api.useUtils();

  const updateStatusMutation = api.batch.updateStatus.useMutation({
    onSuccess: () => {
      utils.batch.getById.invalidate({ id: batchId });
      utils.batch.list.invalidate();
    },
  });

  const deleteClassMutation = api.schedule.deleteClass.useMutation({
    onSuccess: () => {
      utils.batch.getById.invalidate({ id: batchId });
      utils.schedule.listByBatch.invalidate({ batchId });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Loading batch details and class schedule...</p>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-800">Batch Not Found</p>
        <p className="text-xs text-red-600 mt-1">
          The requested batch does not exist or has been removed.
        </p>
        <Link href="/admin/batches">
          <Button variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Batches
          </Button>
        </Link>
      </div>
    );
  }

  const primaryTrainer = batch.trainers.find((t) => t.isPrimary)?.trainer;
  const secondaryTrainers = batch.trainers.filter((t) => !t.isPrimary).map((t) => t.trainer);

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div>
        <Link
          href="/admin/batches"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Batches Catalog
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                {batch.code}
              </span>
              <h1 className="text-2xl font-bold text-slate-900">{batch.name}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Course:{" "}
              <Link
                href={`/admin/courses/${batch.course.id}`}
                className="font-semibold text-emerald-700 hover:underline"
              >
                {batch.course.title}
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditBatchOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Cohort
            </Button>

            {/* Lifecycle Status Selector */}
            <select
              value={batch.status}
              disabled={updateStatusMutation.isPending}
              onChange={(e) =>
                updateStatusMutation.mutate({
                  id: batch.id,
                  status: e.target.value as BatchStatus,
                })
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="OPEN_FOR_ENROLLMENT">OPEN FOR ENROLLMENT</option>
              <option value="ONGOING">ONGOING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meta Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Start Date
            </CardTitle>
            <Calendar className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900">
              {new Date(batch.startDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              End:{" "}
              {batch.endDate
                ? new Date(batch.endDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Open-ended"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Delivery Mode
            </CardTitle>
            <Video className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900">{batch.deliveryMode}</div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {batch.location || "Room / Virtual Link Not Set"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Seat Capacity
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900">{batch.maxCapacity} Seats</div>
            <p className="text-xs text-slate-500 mt-0.5">Max batch enrollment cap</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Scheduled Classes
            </CardTitle>
            <Clock className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900">{batch.classes.length}</div>
            <p className="text-xs text-slate-500 mt-0.5">Active curriculum sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Faculty Team & Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Batch Logistics & Location</CardTitle>
            <CardDescription>Classroom coordinates and cohort parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Physical / Virtual Coordinate:</strong>{" "}
                {batch.location || "Not configured"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Course Length:</strong> {batch.course.durationWeeks} Weeks
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Users className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Cohort Size Cap:</strong> Maximum {batch.maxCapacity} students
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assigned Faculty</CardTitle>
            <CardDescription>Designated course instructors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {primaryTrainer ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-800 uppercase">Primary Lead</p>
                  <Badge variant="success" className="text-[10px]">Lead</Badge>
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {primaryTrainer.user.firstName} {primaryTrainer.user.lastName}
                </p>
                <p className="text-xs text-slate-500">{primaryTrainer.user.email}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No primary instructor assigned.</p>
            )}

            {secondaryTrainers.map((t) => (
              <div key={t.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase">Supporting Faculty</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {t.user.firstName} {t.user.lastName}
                </p>
                <p className="text-xs text-slate-500">{t.user.email}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Academic Schedule Foundation */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base">Academic Schedule & Class Sessions</CardTitle>
            <CardDescription>
              Chronological schedule of lectures, labs, and interactive meetings
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setScheduleModalOpen(true)}
            className="gap-1.5 text-xs self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Schedule Session
          </Button>
        </CardHeader>
        <CardContent>
          {batch.classes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <p className="font-semibold text-slate-700">No scheduled sessions yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Click &quot;Schedule Session&quot; to add your first lecture or lab topic.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Topic & Agenda</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Location / Meeting Link</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.classes.map((cls) => {
                    const sessionDate = new Date(cls.scheduledAt);
                    const formattedDateTime = sessionDate.toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    });

                    return (
                      <TableRow key={cls.id}>
                        <TableCell className="font-semibold text-xs text-slate-900 whitespace-nowrap">
                          {formattedDateTime}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                          {cls.durationMin} min
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm text-slate-900">{cls.title}</div>
                          {cls.agendaNotes && (
                            <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {cls.agendaNotes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {cls.mode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                          {cls.location?.startsWith("http") ? (
                            <a
                              href={cls.location}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              Join Link <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            cls.location || "TBD"
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                          {cls.trainer ? (
                            `${cls.trainer.user.firstName} ${cls.trainer.user.lastName}`
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            disabled={deleteClassMutation.isPending}
                            onClick={() => deleteClassMutation.mutate({ id: cls.id })}
                            title="Remove Session"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateClassDialog
        batchId={batch.id}
        batchStartDate={batch.startDate}
        batchEndDate={batch.endDate}
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
      />

      <EditBatchDialog
        batch={batch}
        open={editBatchOpen}
        onOpenChange={setEditBatchOpen}
      />
    </div>
  );
}
