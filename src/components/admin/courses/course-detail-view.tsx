"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/react";
import { ContentStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditCourseDialog } from "./edit-course-dialog";
import {
  ArrowLeft,
  Edit2,
  CheckCircle,
  Clock,
  Archive,
  Calendar,
  IndianRupee,
  Users,
  Award,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface CourseDetailViewProps {
  courseId: string;
}

export function CourseDetailView({ courseId }: CourseDetailViewProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const { data: course, isLoading, error } = api.course.getById.useQuery({
    id: courseId,
  });

  const utils = api.useUtils();

  const setStatusMutation = api.course.setStatus.useMutation({
    onSuccess: () => {
      utils.course.getById.invalidate({ id: courseId });
      utils.course.list.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Loading course curriculum details...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-800">Course Not Found</p>
        <p className="text-xs text-red-600 mt-1">
          The requested course record does not exist or has been deleted.
        </p>
        <Link href="/admin/courses">
          <Button variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Catalog
          </Button>
        </Link>
      </div>
    );
  }

  const formattedINR = `₹${(course.baseFee / 100).toLocaleString("en-IN")}`;

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
    <div className="space-y-6">
      {/* Back button and Header */}
      <div>
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Courses Catalog
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
              {getStatusBadge(course.status)}
            </div>
            <p className="font-mono text-xs text-slate-400 mt-0.5">
              Slug: /{course.slug} • ID: {course.id}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              size="sm"
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Link href={`/admin/courses/${course.id}/curriculum`}>
                <BookOpen className="h-3.5 w-3.5" /> Manage Curriculum (CMS)
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Course
            </Button>

            {course.status === "DRAFT" && (
              <Button
                size="sm"
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                disabled={setStatusMutation.isPending}
                onClick={() =>
                  setStatusMutation.mutate({
                    id: course.id,
                    status: ContentStatus.PUBLISHED,
                  })
                }
              >
                <CheckCircle className="h-3.5 w-3.5" /> Publish Course
              </Button>
            )}

            {course.status === "PUBLISHED" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                disabled={setStatusMutation.isPending}
                onClick={() =>
                  setStatusMutation.mutate({
                    id: course.id,
                    status: ContentStatus.DRAFT,
                  })
                }
              >
                <Clock className="h-3.5 w-3.5" /> Unpublish (Draft)
              </Button>
            )}

            {course.status !== "ARCHIVED" && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-slate-500 hover:text-slate-900"
                disabled={setStatusMutation.isPending}
                onClick={() =>
                  setStatusMutation.mutate({
                    id: course.id,
                    status: ContentStatus.ARCHIVED,
                  })
                }
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Meta Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Base Tuition Fee
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formattedINR}</div>
            <p className="font-mono text-[11px] text-slate-400 mt-0.5">
              {course.baseFee} integer Paise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Course Duration
            </CardTitle>
            <Calendar className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{course.durationWeeks} Weeks</div>
            <p className="text-xs text-slate-500 mt-0.5">Standard cohort delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Target Level
            </CardTitle>
            <Award className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-slate-900 mt-1">{course.level || "All Levels"}</div>
            <p className="text-xs text-slate-500 mt-0.5">Language: {course.language || "English / Hindi"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Batches
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{course.batches.length}</div>
            <p className="text-xs text-slate-500 mt-0.5">Associated cohorts</p>
          </CardContent>
        </Card>
      </div>

      {/* Curriculum Summary & Eligibility */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Course Overview & Syllabus Outline</CardTitle>
            <CardDescription>{course.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Description
              </h4>
              <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                {course.description}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student Eligibility
              </h4>
              <p className="text-sm text-slate-600">
                {course.eligibility || "Open to all learners and working professionals."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Faculty */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assigned Faculty</CardTitle>
            <CardDescription>Instructors authorized for curriculum delivery</CardDescription>
          </CardHeader>
          <CardContent>
            {course.trainers.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No faculty instructors assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {course.trainers.map(({ trainer }) => (
                  <div
                    key={trainer.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3 bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {trainer.user.firstName} {trainer.user.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{trainer.user.email}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Faculty
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linked Batches Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Academic Batches for this Course</CardTitle>
            <CardDescription>
              Cohorts running or scheduled for {course.title}
            </CardDescription>
          </div>
          <Link href={`/admin/batches?courseId=${course.id}`}>
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <ExternalLink className="h-3.5 w-3.5" /> Manage Batches
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {course.batches.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No academic batches created for this course yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Code</TableHead>
                  <TableHead>Cohort Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Delivery Mode</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {course.batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono text-xs font-semibold text-emerald-700">
                      {batch.code}
                    </TableCell>
                    <TableCell className="font-medium text-slate-800 text-sm">
                      {batch.name}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {new Date(batch.startDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">
                        {batch.deliveryMode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {batch.maxCapacity} seats
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          batch.status === "ONGOING"
                            ? "success"
                            : batch.status === "OPEN_FOR_ENROLLMENT"
                            ? "default"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {batch.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {batch._count.classes} sessions
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/batches/${batch.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          View Batch
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EditCourseDialog
        course={course}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}
