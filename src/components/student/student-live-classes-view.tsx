"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Video,
  Play,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Radio,
  BookOpen,
} from "lucide-react";
import { VirtualClassroomModal } from "@/components/classroom/virtual-classroom-modal";

export function StudentLiveClassesView() {
  const [activeJoinClassId, setActiveJoinClassId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");

  const { data: classes = [], isLoading, refetch } = api.classroom.getStudentClasses.useQuery();

  const filteredClasses = useMemo(() => {
    const now = Date.now();
    if (filter === "upcoming") {
      return classes.filter(
        (c) => c.status === "IN_PROGRESS" || new Date(c.scheduledAt).getTime() + c.durationMin * 60000 >= now
      );
    }
    return classes.filter(
      (c) => c.status === "COMPLETED" || new Date(c.scheduledAt).getTime() + c.durationMin * 60000 < now
    );
  }, [classes, filter]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">My Live Classes & Lecture Hall</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Access real-time interactive lectures strictly for your allocated cohort batch. Attendance and recordings are tracked automatically.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilter("upcoming")}
            className={`text-xs h-8 px-3 rounded-lg ${filter === "upcoming" ? "bg-indigo-600 text-white font-bold" : "text-slate-300 hover:text-white"}`}
          >
            Upcoming Lectures
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilter("past")}
            className={`text-xs h-8 px-3 rounded-lg ${filter === "past" ? "bg-indigo-600 text-white font-bold" : "text-slate-300 hover:text-white"}`}
          >
            Past & Recordings
          </Button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading your batch timetable...</div>
      ) : filteredClasses.length === 0 ? (
        <Card className="border-slate-200 shadow-sm text-center p-12">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700 text-sm">
            {filter === "upcoming" ? "No Upcoming Live Classes Scheduled" : "No Past Lectures Found"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Lectures scheduled by your faculty for your allocated batch will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((c) => {
            const isLive = c.status === "IN_PROGRESS";
            const sessionTime = new Date(c.scheduledAt).getTime();
            const now = Date.now();
            const joinWindowStart = sessionTime - 15 * 60 * 1000;
            const canJoin = isLive || (now >= joinWindowStart && c.status !== "COMPLETED");

            const myAttendance = c.liveAttendances[0];

            return (
              <Card key={c.id} className="border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                      {c.batch.code}
                    </span>
                    <Badge
                      className={
                        isLive
                          ? "bg-rose-500/10 text-rose-700 border-rose-300 animate-pulse"
                          : c.status === "COMPLETED"
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }
                    >
                      {c.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 line-clamp-2">{c.title}</CardTitle>
                  <p className="text-xs text-slate-500 line-clamp-1">{c.batch.course.title}</p>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs">
                  <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{new Date(c.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{c.durationMin} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        Faculty: {c.trainer ? `${c.trainer.user.firstName} ${c.trainer.user.lastName}` : "Assigned Instructor"}
                      </span>
                    </div>
                  </div>

                  {myAttendance && (
                    <div className="bg-slate-50 rounded-lg p-2 text-[11px] border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-600">My Attendance:</span>
                      <span className="font-bold text-emerald-700">
                        {myAttendance.status} ({myAttendance.attendancePercentage}%)
                      </span>
                    </div>
                  )}

                  {c.recordings.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-2 text-[11px] border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Lecture Archive:</span>
                      {c.recordings[0].youTubeUrl ? (
                        <a
                          href={c.recordings[0].youTubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-rose-600 hover:underline font-semibold flex items-center gap-1"
                        >
                          Watch on YouTube <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-emerald-700 font-semibold">Available in LMS</span>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100">
                    {c.status === "COMPLETED" ? (
                      <Button size="sm" variant="outline" disabled className="w-full text-xs text-slate-500">
                        Class Concluded
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!canJoin}
                        onClick={() => setActiveJoinClassId(c.id)}
                        className={`w-full text-xs font-bold gap-1.5 ${canJoin ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" : "bg-slate-100 text-slate-400"}`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{canJoin ? (isLive ? "Join Live Class Now" : "Enter Classroom") : "Doors Open 15m Before Start"}</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Classroom Modal */}
      {activeJoinClassId && (
        <VirtualClassroomModal
          classId={activeJoinClassId}
          onClose={() => {
            setActiveJoinClassId(null);
            refetch();
          }}
          isHost={false}
        />
      )}
    </div>
  );
}
