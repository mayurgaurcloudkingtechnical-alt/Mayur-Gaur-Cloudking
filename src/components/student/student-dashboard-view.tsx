"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Calendar,
  PlayCircle,
  Award,
  Video,
  MapPin,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function StudentDashboardView() {
  const { data, isLoading, error } = api.learning.getDashboardOverview.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner className="h-8 w-8 text-emerald-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
        Failed to load student dashboard: {error?.message ?? "Unknown error"}
      </div>
    );
  }

  const { stats, enrollments, upcomingClasses } = data;
  const recentEnrollment = enrollments[0];

  return (
    <div className="space-y-8">
      {/* 4 Key Metric Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.enrolledCoursesCount}</div>
            <p className="text-xs text-slate-500 mt-1">Active academic programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Completed Lessons</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.completedLessonsCount}
              <span className="text-xs font-normal text-slate-500 ml-1">/ {stats.totalLessonsCount}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Curriculum milestones achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Overall Progress</CardTitle>
            <Award className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{stats.overallProgressPercent}%</div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${stats.overallProgressPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Upcoming Classes</CardTitle>
            <Clock className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{upcomingClasses.length}</div>
            <p className="text-xs text-slate-500 mt-1">Scheduled cohort sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Banner */}
      {recentEnrollment && recentEnrollment.totalLessons > 0 && (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white overflow-hidden shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-semibold">
                    <Sparkles className="mr-1 h-3 w-3" /> Continue Learning
                  </Badge>
                  {recentEnrollment.batchCode && (
                    <span className="text-xs text-emerald-800 font-mono">
                      Cohort: {recentEnrollment.batchCode}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{recentEnrollment.courseTitle}</h3>
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Next Lesson: </span>
                  <span className="font-semibold text-slate-800">
                    {recentEnrollment.lastAccessedLessonTitle ?? "Begin First Module"}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-medium text-slate-500">Progress</span>
                  <p className="text-sm font-bold text-emerald-700">{recentEnrollment.progressPercent}%</p>
                </div>
                <Link
                  href={`/student/learning/${recentEnrollment.id}${
                    recentEnrollment.lastAccessedLessonId
                      ? `?lessonId=${recentEnrollment.lastAccessedLessonId}`
                      : ""
                  }`}
                >
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    Resume Lesson <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2-Column Section: Enrolled Courses & Upcoming Classes */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Enrolled Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Enrolled Courses</h2>
              <p className="text-xs text-slate-500">Your registered academic curricula</p>
            </div>
            <Link href="/student/courses">
              <Button variant="outline" size="sm" className="text-xs">
                View All Courses
              </Button>
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-500">
                <BookOpen className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                <p className="font-medium text-slate-800">No active course enrollments</p>
                <p className="text-xs mt-1">
                  Once your enrollment is confirmed by administration, your course curriculum will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enr: any) => (
                <div
                  key={enr.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{enr.courseTitle}</h4>
                      {enr.batchCode && (
                        <Badge variant="outline" className="text-[10px] font-mono text-emerald-700 bg-emerald-50">
                          {enr.batchCode}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {enr.completedLessons} of {enr.totalLessons} lessons completed • {enr.durationWeeks} weeks
                    </p>
                    <div className="w-48 max-w-full pt-1">
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                          style={{ width: `${enr.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-700">{enr.progressPercent}%</span>
                    <Link
                      href={`/student/learning/${enr.id}${
                        enr.lastAccessedLessonId ? `?lessonId=${enr.lastAccessedLessonId}` : ""
                      }`}
                    >
                      <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs">
                        Open LMS <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Upcoming Batch Classes */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Upcoming Live Classes</h2>
            <p className="text-xs text-slate-500">Scheduled sessions for your cohort</p>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              {upcomingClasses.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-1" />
                  <p>No upcoming live classes scheduled right now.</p>
                </div>
              ) : (
                upcomingClasses.map((cls: any) => (
                  <div
                    key={cls.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 line-clamp-1">{cls.title}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {cls.mode}
                      </Badge>
                    </div>
                    <div className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {new Date(cls.scheduledAt).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>({cls.durationMin} min)</span>
                    </div>
                    <div className="text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>Instructor: {cls.trainerName}</span>
                      {cls.location && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {cls.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
