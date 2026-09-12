"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen, PlayCircle, Clock, CheckCircle2, ArrowRight } from "lucide-react";

export function EnrolledCoursesView() {
  const { data: courses, isLoading, error } = api.learning.getEnrolledCourses.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner className="h-8 w-8 text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
        Failed to load enrolled courses: {error.message}
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="h-6 w-6" />}
        title="No Enrolled Courses Found"
        description="You have not been assigned to any course batch yet. Reach out to your academic counselor or admissions desk to finalize your cohort enrollment."
        action={
          <Link href="/courses">
            <Button variant="outline">Explore Course Catalog</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((enr: any) => {
          const isStarted = enr.completedLessons > 0 || enr.lastAccessedLessonId;
          const isCompleted = enr.totalLessons > 0 && enr.completedLessons === enr.totalLessons;

          return (
            <Card key={enr.id} className="flex flex-col overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
              <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                {enr.thumbnailUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={enr.thumbnailUrl}
                    alt={enr.courseTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <BookOpen className="h-10 w-10 text-emerald-500 mb-2" />
                    <span className="text-xs font-medium text-slate-300">SOFTLAB GLOBAL ACADEMY</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge
                    variant={isCompleted ? "default" : "secondary"}
                    className={
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-900/80 text-white backdrop-blur text-[10px]"
                    }
                  >
                    {isCompleted ? "Completed" : `${enr.progressPercent}% Finished`}
                  </Badge>
                </div>
              </div>

              <CardHeader className="flex-1 pb-3">
                {enr.batchCode && (
                  <div className="mb-1">
                    <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Cohort: {enr.batchCode}
                    </span>
                  </div>
                )}
                <CardTitle className="text-lg font-bold text-slate-900 line-clamp-1">
                  {enr.courseTitle}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {enr.courseSummary}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">Curriculum Progress</span>
                    <span className="font-semibold text-slate-900">{enr.progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? "bg-emerald-500" : "bg-emerald-600"
                      }`}
                      style={{ width: `${enr.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      {enr.completedLessons} / {enr.totalLessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {enr.durationWeeks} weeks
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href={`/student/learning/${enr.id}${
                      enr.lastAccessedLessonId ? `?lessonId=${enr.lastAccessedLessonId}` : ""
                    }`}
                    className="block w-full"
                  >
                    <Button
                      className={`w-full ${
                        isCompleted
                          ? "bg-slate-800 hover:bg-slate-900 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {isCompleted ? (
                        <>Review Course <ArrowRight className="ml-1.5 h-4 w-4" /></>
                      ) : isStarted ? (
                        <>Resume Learning <PlayCircle className="ml-1.5 h-4 w-4" /></>
                      ) : (
                        <>Start Course <ArrowRight className="ml-1.5 h-4 w-4" /></>
                      )}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
