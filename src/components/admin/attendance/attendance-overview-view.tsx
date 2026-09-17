"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Filter,
} from "lucide-react";

export function AttendanceOverviewView() {
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const { data, isLoading, refetch } = api.attendance.getInstitutionalAttendance.useQuery({
    batchId: selectedBatchId || undefined,
  });

  const metrics = data?.metrics || {
    totalRecords: 0,
    totalEntries: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    overallPercentage: 100,
  };

  const records = data?.records || [];
  const batches = data?.batches || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Overall Attendance</p>
              <h3 className="text-2xl font-bold text-slate-800">{metrics.overallPercentage}%</h3>
              <p className="text-xs text-slate-500 mt-0.5">Across all class sessions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Conducted Sessions</p>
              <h3 className="text-2xl font-bold text-slate-800">{metrics.totalRecords}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Logged in system</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Student Verifications</p>
              <h3 className="text-2xl font-bold text-slate-800">{metrics.totalEntries}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {metrics.totalPresent} Present • {metrics.totalAbsent} Absent
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Active Batches</p>
              <h3 className="text-2xl font-bold text-slate-800">{batches.length}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Under live supervision</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Performance Overview */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Cohort Attendance Monitoring</CardTitle>
            <p className="text-xs text-slate-500">Filter and audit session presence across scheduled batches</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                aria-label="Filter by Batch"
                className="h-9 px-3 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Batches / Cohorts</option>
                {batches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
            {selectedBatchId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBatchId("")}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* Active Cohorts Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Cohort Rosters Summary
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {batches.map((b: any) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBatchId(selectedBatchId === b.id ? "" : b.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    selectedBatchId === b.id
                      ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800 line-clamp-1">{b.name}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {b.code}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{b.courseTitle}</p>
                  <div className="flex items-center justify-between text-xs text-slate-600 mt-3 pt-2 border-t border-slate-200/60">
                    <span>{b.activeStudents} Active Learners</span>
                    <span className="font-semibold text-emerald-700">{b.totalSessions} Sessions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Attendance Records Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Logged Class Sessions & Roster Compliance
              </h4>
              <span className="text-xs text-slate-500">Showing recent {records.length} sessions</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Batch / Cohort</th>
                    <th className="py-3 px-4">Session & Topic</th>
                    <th className="py-3 px-4">Instructor</th>
                    <th className="py-3 px-4 text-center">Roster Ratio</th>
                    <th className="py-3 px-4 text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="h-5 w-5 animate-spin text-emerald-600" />
                          <span>Loading attendance logs...</span>
                        </div>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        <ClipboardCheck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No attendance records found</p>
                        <p className="text-slate-400 text-xs">
                          {selectedBatchId
                            ? "This cohort does not have marked class sessions yet."
                            : "No class sessions have been logged yet."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    records.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {new Date(r.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{r.batchName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{r.batchCode}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{r.sessionTitle}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{r.topicCovered}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{r.markedByName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[11px]">
                            <span className="text-emerald-700 font-bold">{r.present} P</span>
                            <span>•</span>
                            <span className="text-red-600 font-bold">{r.absent} A</span>
                            {r.late > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-amber-600 font-bold">{r.late} L</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge
                            className={`font-semibold text-[11px] ${
                              r.rate >= 80
                                ? "bg-emerald-100 text-emerald-800"
                                : r.rate >= 60
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {r.rate}%
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
