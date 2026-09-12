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
  ArrowLeft,
  Clock,
  MapPin,
  Video,
  Settings2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { AttendanceSheet } from "./attendance-sheet";
import { SessionControlsDialog } from "./session-controls-dialog";

interface TrainerBatchWorkspaceViewProps {
  batchId: string;
}

export function TrainerBatchWorkspaceView({ batchId }: TrainerBatchWorkspaceViewProps) {
  const [activeTab, setActiveTab] = React.useState<"sessions" | "roster" | "stats" | "curriculum">("sessions");
  const [selectedAttendanceSessionId, setSelectedAttendanceSessionId] = React.useState<string | null>(null);
  const [editingSession, setEditingSession] = React.useState<any | null>(null);

  const { data, isLoading, error } = api.trainer.getBatchWorkspace.useQuery({ batchId });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Loading faculty batch workspace...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-rose-200 bg-rose-50 p-6 text-center">
        <p className="font-semibold text-rose-800 text-sm">Access Denied or Batch Not Found</p>
        <p className="text-xs text-rose-600 mt-1">
          {error?.message || "You are not authorized to view this batch workspace."}
        </p>
        <div className="mt-4">
          <Link href="/trainer/batches">
            <Button variant="outline" size="sm" className="text-xs">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to My Batches
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const { batch, sessions, roster } = data;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div>
        <Link
          href="/trainer/batches"
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Assigned Batches
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {batch.code}
              </span>
              <Badge variant={batch.status === "ONGOING" ? "success" : "secondary"} className="text-[10px]">
                {batch.status}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {batch.deliveryMode}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{batch.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Course: <span className="font-semibold text-slate-700">{batch.courseTitle}</span> • {roster.length} Active Students
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "sessions" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("sessions")}
              className="text-xs h-8"
            >
              <Calendar className="mr-1.5 h-3.5 w-3.5" /> Sessions ({sessions.length})
            </Button>
            <Button
              variant={activeTab === "roster" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("roster")}
              className="text-xs h-8"
            >
              <Users className="mr-1.5 h-3.5 w-3.5" /> Roster ({roster.length})
            </Button>
            <Button
              variant={activeTab === "curriculum" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("curriculum")}
              className="text-xs h-8"
            >
              <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Curriculum
            </Button>
          </div>
        </div>
      </div>

      {/* 2. TAB: Sessions & Attendance */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Calendar className="h-10 w-10 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">No scheduled sessions</p>
                <p className="text-xs text-slate-500 mt-1">
                  Classes have not been scheduled yet for this cohort batch.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {sessions.map((session: any) => {
                const sessionDate = new Date(session.scheduledAt);
                return (
                  <Card key={session.id} className="border-slate-200 hover:border-slate-300 transition-colors">
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{session.title}</span>
                          <Badge
                            variant={
                              session.status === "COMPLETED"
                                ? "success"
                                : session.status === "CANCELLED"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {session.status}
                          </Badge>
                          {session.hasAttendance && (
                            <Badge variant="success" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200">
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Attendance Verified
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {sessionDate.toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            at{" "}
                            {sessionDate.toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            ({session.durationMin}m)
                          </span>

                          {session.location && (
                            <span className="flex items-center gap-1">
                              {session.location.startsWith("http") ? (
                                <Video className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              )}
                              <span className="truncate max-w-[200px]">{session.location}</span>
                            </span>
                          )}

                          {session.coveredLessonTitle && (
                            <span className="text-emerald-700 font-medium">
                              Lesson: {session.coveredLessonTitle}
                            </span>
                          )}
                        </div>

                        {session.topicCovered && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-1.5 rounded mt-1">
                            <strong>Covered:</strong> {session.topicCovered}
                          </p>
                        )}

                        {session.statusReason && (
                          <p className="text-xs text-amber-800 bg-amber-50 p-1.5 rounded mt-1">
                            <strong>Note ({session.status}):</strong> {session.statusReason}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSession(session)}
                          className="text-xs h-8"
                          title="Update Session Status & Notes"
                        >
                          <Settings2 className="h-3.5 w-3.5 mr-1" /> Controls
                        </Button>

                        <Button
                          variant={session.hasAttendance ? "outline" : "default"}
                          size="sm"
                          onClick={() => setSelectedAttendanceSessionId(session.id)}
                          className="text-xs h-8"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                          {session.hasAttendance ? "Review Attendance" : "Mark Attendance"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: Student Roster (Read-Only Essentials) */}
      {activeTab === "roster" && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              Active Enrolled Students ({roster.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Teaching-essential roster. Financial records and admissions discounts are partitioned.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {roster.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active students currently enrolled in this batch.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {roster.map((student: any) => (
                  <div
                    key={student.enrollmentId}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {student.studentId}
                        </span>
                        <Badge variant="success" className="text-[10px]">
                          {student.status}
                        </Badge>
                      </div>
                      <span className="text-slate-400 text-[11px] block">{student.email}</span>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">LMS Progress</span>
                        <span className="font-semibold text-emerald-700">
                          {student.progressPercent}% ({student.completedLessons} Lessons)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. TAB: Curriculum Reference */}
      {activeTab === "curriculum" && (
        <div className="space-y-4">
          {batch.courseModules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-xs text-slate-500">
                No published curriculum modules found for this course.
              </CardContent>
            </Card>
          ) : (
            batch.courseModules.map((mod: any, idx: number) => (
              <Card key={mod.id} className="border-slate-200">
                <CardHeader className="py-3 bg-slate-50 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Module {idx + 1}: {mod.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-slate-100 text-xs">
                  {mod.lessons.map((les: any, lIdx: number) => (
                    <div key={les.id} className="p-3 flex items-center justify-between">
                      <span className="text-slate-700">
                        {lIdx + 1}. {les.title}
                      </span>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Badge variant="outline" className="text-[10px]">
                          {les.type}
                        </Badge>
                        <span>{les.durationMin}m</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Attendance Sheet Modal */}
      {selectedAttendanceSessionId && (
        <AttendanceSheet
          sessionId={selectedAttendanceSessionId}
          onClose={() => setSelectedAttendanceSessionId(null)}
        />
      )}

      {/* Session Controls Dialog */}
      {editingSession && (
        <SessionControlsDialog
          session={editingSession}
          courseModules={batch.courseModules}
          onClose={() => setEditingSession(null)}
        />
      )}
    </div>
  );
}
