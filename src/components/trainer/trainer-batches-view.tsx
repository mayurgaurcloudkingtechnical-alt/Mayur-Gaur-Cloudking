"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { BatchStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  BookOpen,
  ArrowRight,
  MapPin,
  Video,
  CheckCircle2,
} from "lucide-react";

export function TrainerBatchesView() {
  const [statusFilter, setStatusFilter] = React.useState<BatchStatus | "ALL">("ALL");

  const queryInput = statusFilter === "ALL" ? undefined : { status: statusFilter };
  const { data: batches, isLoading } = api.trainer.listBatches.useQuery(queryInput);

  const filterOptions: { label: string; value: BatchStatus | "ALL" }[] = [
    { label: "All Batches", value: "ALL" },
    { label: "Ongoing", value: BatchStatus.ONGOING },
    { label: "Upcoming", value: BatchStatus.UPCOMING },
    { label: "Completed", value: BatchStatus.COMPLETED },
    { label: "Cancelled", value: BatchStatus.CANCELLED },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Loading your assigned cohort batches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Faculty Assigned Batches</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your cohort workspaces, class sessions, attendance rosters, and student progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={statusFilter === opt.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(opt.value)}
              className="text-xs h-8"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {!batches || batches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <BookOpen className="h-10 w-10 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No batches found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              You do not have any {statusFilter !== "ALL" ? statusFilter.toLowerCase() : ""} batches assigned.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch: any) => {
            const startDate = new Date(batch.startDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const endDate = batch.endDate
              ? new Date(batch.endDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Ongoing";

            return (
              <Card key={batch.id} className="flex flex-col justify-between border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {batch.code}
                    </span>
                    <Badge variant={batch.status === "ONGOING" ? "success" : "secondary"} className="text-[10px]">
                      {batch.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 line-clamp-1">
                    {batch.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 line-clamp-1">
                    {batch.courseTitle} ({batch.durationWeeks} Weeks)
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-md">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Timeline</span>
                      <span className="font-semibold text-slate-800 truncate block">{startDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mode</span>
                      <span className="font-semibold text-slate-800">{batch.deliveryMode}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-emerald-600" />
                        Active Enrolled Students:
                      </span>
                      <span className="font-bold text-slate-800">{batch.activeStudentCount}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Classes Delivered:
                      </span>
                      <span className="font-bold text-slate-800">
                        {batch.completedClasses} / {batch.totalClasses}
                      </span>
                    </div>

                    {batch.location && (
                      <div className="flex items-center gap-1.5 text-slate-500 truncate pt-1 border-t border-slate-100">
                        {batch.location.startsWith("http") ? (
                          <Video className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span className="truncate">{batch.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Link href={`/trainer/batches/${batch.id}`} className="block">
                      <Button className="w-full text-xs h-9 font-semibold">
                        Enter Batch Workspace <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
