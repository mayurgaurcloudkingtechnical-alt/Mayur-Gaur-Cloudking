"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatchTable } from "./batch-table";
import { CreateBatchDialog } from "./create-batch-dialog";
import { api } from "@/lib/trpc/react";
import { BatchStatus, DeliveryMode } from "@prisma/client";
import { Plus, Search, Calendar, Users, CheckCircle, Clock } from "lucide-react";

interface BatchesViewProps {
  initialCourseId?: string;
}

export function BatchesView({ initialCourseId }: BatchesViewProps) {
  const [search, setSearch] = React.useState("");
  const [courseId, setCourseId] = React.useState(initialCourseId || "");
  const [status, setStatus] = React.useState<BatchStatus | undefined>(undefined);
  const [deliveryMode, setDeliveryMode] = React.useState<DeliveryMode | undefined>(undefined);
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);

  const { data: coursesData } = api.course.list.useQuery({ pageSize: 50 });

  const { data, isLoading } = api.batch.list.useQuery({
    courseId: courseId || undefined,
    status,
    deliveryMode,
    search: search.trim() || undefined,
    page,
    pageSize: 10,
  });

  const batches = data?.batches || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Metrics
  const ongoingCount = batches.filter((b) => b.status === BatchStatus.ONGOING).length;
  const enrollingCount = batches.filter((b) => b.status === BatchStatus.OPEN_FOR_ENROLLMENT).length;
  const upcomingCount = batches.filter((b) => b.status === BatchStatus.UPCOMING).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Batches & Cohorts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor institutional batch lifecycles, student capacity, faculty leads, and schedule sessions.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Batch
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Batches
            </CardTitle>
            <Calendar className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{total}</div>
            <p className="text-xs text-slate-500 mt-1">Across all academic courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Ongoing Active
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{ongoingCount}</div>
            <p className="text-xs text-slate-500 mt-1">Classes actively in session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Open For Admissions
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{enrollingCount}</div>
            <p className="text-xs text-slate-500 mt-1">Accepting student enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Upcoming Starts
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{upcomingCount}</div>
            <p className="text-xs text-slate-500 mt-1">Scheduled to launch soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search code or cohort..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-xs"
          />
        </div>

        <div>
          <select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setPage(1);
            }}
            className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 h-9"
          >
            <option value="">All Courses</option>
            {coursesData?.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={status || ""}
            onChange={(e) => {
              setStatus(e.target.value ? (e.target.value as BatchStatus) : undefined);
              setPage(1);
            }}
            className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 h-9"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="UPCOMING">UPCOMING</option>
            <option value="OPEN_FOR_ENROLLMENT">OPEN FOR ENROLLMENT</option>
            <option value="ONGOING">ONGOING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div>
          <select
            value={deliveryMode || ""}
            onChange={(e) => {
              setDeliveryMode(e.target.value ? (e.target.value as DeliveryMode) : undefined);
              setPage(1);
            }}
            className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 h-9"
          >
            <option value="">All Delivery Modes</option>
            <option value="HYBRID">HYBRID</option>
            <option value="OFFLINE">OFFLINE</option>
            <option value="ONLINE">ONLINE</option>
          </select>
        </div>
      </div>

      {/* Batches Table */}
      <BatchTable batches={batches} isLoading={isLoading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-2">
          <p className="text-xs text-slate-500">
            Showing Page {page} of {totalPages} ({total} total batches)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <CreateBatchDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultCourseId={courseId}
      />
    </div>
  );
}
