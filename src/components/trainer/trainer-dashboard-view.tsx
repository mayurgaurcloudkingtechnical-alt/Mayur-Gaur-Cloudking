"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  ClipboardCheck,
  BookOpen,
  ArrowRight,
  Clock,
  MapPin,
  Video,
  ExternalLink,
} from "lucide-react";

export function TrainerDashboardView() {
  const { data, isLoading } = api.trainer.getDashboard.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Loading faculty dashboard overview...</p>
      </div>
    );
  }

  const {
    assignedBatchCount = 0,
    activeStudentsCount = 0,
    scheduledClassCount = 0,
    attendanceLoggedCount = 0,
    batches = [],
    upcomingClasses = [],
  } = data || {};

  return (
    <div className="space-y-8">
      {/* 1. Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/trainer/batches" className="block transition-transform hover:scale-[1.02]">
          <Card className="border-emerald-100 hover:border-emerald-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Assigned Batches</CardTitle>
              <Users className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{assignedBatchCount}</div>
              <p className="text-xs text-slate-500 mt-1">Active assigned cohorts →</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Active Students</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{activeStudentsCount}</div>
            <p className="text-xs text-slate-500 mt-1">Enrolled across your cohorts</p>
          </CardContent>
        </Card>

        <Link href="/trainer/classes" className="block transition-transform hover:scale-[1.02]">
          <Card className="border-emerald-100 hover:border-emerald-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Upcoming Classes</CardTitle>
              <Calendar className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{scheduledClassCount}</div>
              <p className="text-xs text-slate-500 mt-1">Scheduled sessions →</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Attendance Logged</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{attendanceLoggedCount}</div>
            <p className="text-xs text-slate-500 mt-1">Sessions with verified records</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Upcoming Sessions & Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upcoming Live Sessions</h2>
            <p className="text-xs text-slate-500">Your scheduled lectures and practical sessions</p>
          </div>
          <Link href="/trainer/classes">
            <Button variant="outline" size="sm" className="text-xs">
              View All Schedule <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {upcomingClasses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Calendar className="h-8 w-8 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700 text-sm">No upcoming classes</p>
              <p className="text-xs text-slate-500 mt-1">
                You do not have any classes scheduled for the coming days.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingClasses.map((cls: any) => {
              const sessionDate = new Date(cls.scheduledAt);
              return (
                <Card key={cls.id} className="flex flex-col justify-between border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {cls.batchCode}
                      </span>
                      <Badge variant={cls.status === "COMPLETED" ? "success" : "secondary"} className="text-[10px]">
                        {cls.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 line-clamp-1">
                      {cls.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 line-clamp-1">
                      {cls.batchName}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {sessionDate.toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        •{" "}
                        {sessionDate.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {cls.location && (
                      <div className="flex items-center gap-2 text-slate-600">
                        {cls.location.startsWith("http") ? (
                          <Video className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span className="truncate">{cls.location}</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center gap-2">
                      <Link href={`/trainer/batches/${cls.batchId}`} className="flex-1">
                        <Button
                          variant={cls.hasAttendance ? "outline" : "default"}
                          size="sm"
                          className="w-full text-xs h-8"
                        >
                          <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
                          {cls.hasAttendance ? "Review Attendance" : "Mark Attendance"}
                        </Button>
                      </Link>

                      {cls.location?.startsWith("http") && (
                        <a
                          href={cls.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                          title="Join Class"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Assigned Batches Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Assigned Cohort Batches</h2>
            <p className="text-xs text-slate-500">Overview of cohorts currently under your instruction</p>
          </div>
          <Link href="/trainer/batches">
            <Button variant="outline" size="sm" className="text-xs">
              View All Batches <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {batches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <BookOpen className="h-10 w-10 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No batches assigned</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                You are currently not assigned as primary or co-faculty to any active cohort batches. Please reach out to your academic administrator.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch: any) => (
              <Card key={batch.id} className="border-slate-200 hover:border-slate-300 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {batch.code}
                    </span>
                    <Badge variant="default" className="text-[10px]">
                      {batch.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 line-clamp-1">
                    {batch.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 line-clamp-1">
                    {batch.courseTitle}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-md">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Students</span>
                      <span className="font-semibold text-slate-800">{batch.activeStudents} Active</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Delivery</span>
                      <span className="font-semibold text-slate-800">{batch.deliveryMode}</span>
                    </div>
                  </div>

                  <Link href={`/trainer/batches/${batch.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8">
                      Open Batch Workspace <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
