"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseTable } from "./course-table";
import { CreateCourseDialog } from "./create-course-dialog";
import { api } from "@/lib/trpc/react";
import { ContentStatus } from "@prisma/client";
import { Plus, Search, BookOpen, CheckCircle, Clock, Archive } from "lucide-react";

export function CoursesView() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ContentStatus | undefined>(undefined);
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);

  const { data, isLoading } = api.course.list.useQuery({
    search: search.trim() || undefined,
    status: statusFilter,
    page,
    pageSize: 10,
  });

  const courses = data?.courses || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Stats calculation
  const publishedCount = courses.filter((c) => c.status === ContentStatus.PUBLISHED).length;
  const draftCount = courses.filter((c) => c.status === ContentStatus.DRAFT).length;
  const archivedCount = courses.filter((c) => c.status === ContentStatus.ARCHIVED).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Course Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage course curriculum, integer Paise pricing, publishing status, and faculty assignments.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Course
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{total}</div>
            <p className="text-xs text-slate-500 mt-1">Across institutional catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Published Live
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{publishedCount}</div>
            <p className="text-xs text-slate-500 mt-1">Active on marketplace</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Drafts
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{draftCount}</div>
            <p className="text-xs text-slate-500 mt-1">Under curriculum revision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Archived
            </CardTitle>
            <Archive className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{archivedCount}</div>
            <p className="text-xs text-slate-500 mt-1">Retired offerings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search courses by title, slug, or keywords..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <Button
            variant={statusFilter === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(undefined);
              setPage(1);
            }}
            className="text-xs"
          >
            All
          </Button>
          <Button
            variant={statusFilter === ContentStatus.PUBLISHED ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(ContentStatus.PUBLISHED);
              setPage(1);
            }}
            className="text-xs"
          >
            Published
          </Button>
          <Button
            variant={statusFilter === ContentStatus.DRAFT ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(ContentStatus.DRAFT);
              setPage(1);
            }}
            className="text-xs"
          >
            Drafts
          </Button>
          <Button
            variant={statusFilter === ContentStatus.ARCHIVED ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(ContentStatus.ARCHIVED);
              setPage(1);
            }}
            className="text-xs"
          >
            Archived
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <CourseTable courses={courses} isLoading={isLoading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-2">
          <p className="text-xs text-slate-500">
            Showing Page {page} of {totalPages} ({total} total courses)
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

      <CreateCourseDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
