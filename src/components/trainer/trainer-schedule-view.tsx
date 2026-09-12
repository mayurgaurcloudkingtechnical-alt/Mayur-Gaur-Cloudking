"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, MapPin, ExternalLink, BookOpen } from "lucide-react";

export function TrainerScheduleView() {
  const [filter, setFilter] = React.useState<"all" | "upcoming" | "past">("upcoming");

  const { data: classes, isLoading } = api.schedule.listTrainerSchedule.useQuery();

  const filteredClasses = React.useMemo(() => {
    if (!classes) return [];
    const nowTime = Date.now();
    if (filter === "upcoming") {
      return classes.filter((c) => new Date(c.scheduledAt).getTime() >= nowTime);
    }
    if (filter === "past") {
      return classes.filter((c) => new Date(c.scheduledAt).getTime() < nowTime);
    }
    return classes;
  }, [classes, filter]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Loading your faculty live classes schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Faculty Live Classes Schedule</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Your assigned curriculum lectures, interactive labs, and meeting links.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
          <Button
            variant={filter === "upcoming" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("upcoming")}
            className="text-xs h-8"
          >
            Upcoming
          </Button>
          <Button
            variant={filter === "past" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("past")}
            className="text-xs h-8"
          >
            Past Sessions
          </Button>
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-xs h-8"
          >
            All Sessions
          </Button>
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Calendar className="h-10 w-10 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No sessions found</p>
            <p className="text-xs text-slate-500 mt-1">
              You do not have any {filter} sessions scheduled for your assigned batches.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => {
            const sessionDate = new Date(cls.scheduledAt);
            const isUpcoming = sessionDate.getTime() >= Date.now();

            return (
              <Card key={cls.id} className="flex flex-col justify-between border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {cls.batch.code}
                    </span>
                    <Badge variant={isUpcoming ? "success" : "secondary"} className="text-[10px]">
                      {cls.mode}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 line-clamp-2">
                    {cls.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 line-clamp-1">
                    {cls.batch.course.title}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    <span>
                      {sessionDate.toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-emerald-600" />
                    <span>
                      {sessionDate.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      ({cls.durationMin} mins)
                    </span>
                  </div>

                  {cls.location && (
                    <div className="flex items-center gap-2 text-slate-600">
                      {cls.location.startsWith("http") ? (
                        <Video className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                      <span className="truncate">{cls.location}</span>
                    </div>
                  )}

                  {cls.agendaNotes && (
                    <div className="rounded bg-slate-50 p-2 text-slate-600 text-[11px] line-clamp-2">
                      <strong>Agenda:</strong> {cls.agendaNotes}
                    </div>
                  )}

                  {cls.location?.startsWith("http") && isUpcoming && (
                    <div className="pt-2">
                      <a
                        href={cls.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                      >
                        Join Live Classroom <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
