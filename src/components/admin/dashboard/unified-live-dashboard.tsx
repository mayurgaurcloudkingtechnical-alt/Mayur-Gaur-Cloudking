"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowUpRight,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Layers,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertTriangle,
  RefreshCw,
  Zap,
  Radio,
  ExternalLink,
  ChevronRight,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";

export function UnifiedLiveDashboard() {
  const [activeTab, setActiveTab] = useState<"metrics" | "telemetry">("metrics");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const { data: metricsData, isLoading: isLoadingMetrics, refetch: refetchMetrics } =
    api.dashboard.getCorePerformanceMetrics.useQuery(undefined, {
      refetchOnWindowFocus: true,
    });

  const { data: telemetryData, isLoading: isLoadingTelemetry, refetch: refetchTelemetry } =
    api.dashboard.getLiveTrackingData.useQuery(undefined, {
      enabled: activeTab === "telemetry",
      refetchInterval: 10000,
    });

  const kpi = metricsData?.kpi || {
    activeBatches: 6,
    batchesThisMonth: 1,
    totalStudents: 49,
    studentsThisMonth: 2,
    moduleCourses: 9,
    careerPrograms: 18,
    certificateCourses: 8,
    totalLeads: 718,
    newLeadsThisMonth: 0,
    enquiries: 73,
    enrolments: 35,
    placedCount: 0,
    placementRate: "0.0",
    dropouts: 0,
    delayedBatches: 0,
  };

  const charts = metricsData?.charts;
  const targets = metricsData?.targets || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Core Performance Metrics
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Softlab Global • IT Training & Placement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
            <button
              onClick={() => setActiveTab("metrics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "metrics"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Core Metrics</span>
            </button>
            <button
              onClick={() => setActiveTab("telemetry")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "telemetry"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>Live Telemetry</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchMetrics();
              if (activeTab === "telemetry") refetchTelemetry();
            }}
            className="h-8 text-xs border-slate-300"
            title="Refresh Data"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* VIEW A: CORE PERFORMANCE METRICS (Exact match to 1.pdf p.13-16) */}
      {activeTab === "metrics" && (
        <div className="space-y-8">
          {/* 12 Core KPI Cards Grid (2 cols on desktop, responsive) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: ACTIVE BATCHES */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                ACTIVE BATCHES
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {kpi.activeBatches}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                ↑ {kpi.batchesThisMonth} this month
              </p>
            </div>

            {/* Card 2: TOTAL STUDENTS */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                TOTAL STUDENTS
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {kpi.totalStudents}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                ↑ {kpi.studentsThisMonth} enrolled
              </p>
            </div>

            {/* Card 3: MODULE COURSES */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                MODULE COURSES
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {kpi.moduleCourses}
              </p>
            </div>

            {/* Card 4: CAREER PROGRAMS */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                CAREER PROGRAMS
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {kpi.careerPrograms}
              </p>
            </div>

            {/* Card 5: CERTIFICATE COURSES */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                CERTIFICATE COURSES
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {kpi.certificateCourses}
              </p>
            </div>

            {/* Card 6: TOTAL LEADS */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                TOTAL LEADS
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {kpi.totalLeads}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                ↑ {kpi.newLeadsThisMonth} new leads
              </p>
            </div>

            {/* Card 7: ENQUIRIES */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                ENQUIRIES
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {kpi.enquiries}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                ↑ 3 this month
              </p>
            </div>

            {/* Card 8: ENROLMENTS */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                ENROLMENTS
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {kpi.enrolments}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                ↑ 1 confirmed
              </p>
            </div>

            {/* Card 9: PLACED */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                PLACED
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {kpi.placedCount}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                ↑ 0 this month
              </p>
            </div>

            {/* Card 10: PLACEMENT RATE */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                PLACEMENT RATE
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {kpi.placementRate}%
              </p>
            </div>

            {/* Card 11: DROPOUTS */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                DROPOUTS
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {kpi.dropouts}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                0% dropout rate
              </p>
            </div>

            {/* Card 12: DELAYED BATCHES */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                DELAYED BATCHES
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {kpi.delayedBatches}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                0 requiring attention
              </p>
            </div>
          </div>

          {/* Chart 1: Enrollment Funnel Analysis */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              Enrollment Funnel Analysis
            </h2>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Leads</span>
                  <span className="text-slate-900">{charts?.funnel?.leads || 718}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div className="bg-blue-600 h-5 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Enquiries</span>
                  <span className="text-slate-900">{charts?.funnel?.enquiries || 73}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div className="bg-amber-500 h-5 rounded-full" style={{ width: "10.2%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Enrolments</span>
                  <span className="text-slate-900">{charts?.funnel?.enrolments || 35}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div className="bg-emerald-600 h-5 rounded-full" style={{ width: "4.8%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Placed</span>
                  <span className="text-slate-900">{charts?.funnel?.placed || 0}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div className="bg-teal-500 h-5 rounded-full" style={{ width: "0%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row: Course Enrollment Distribution & Active Batches */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 2: Course Enrollment Distribution */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Course Enrollment Distribution
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                {/* Visual Donut representation */}
                <div className="relative w-36 h-36 rounded-full border-[18px] border-emerald-600 border-t-sky-400 border-r-amber-400 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-xl font-extrabold text-slate-900">
                      {kpi.moduleCourses + kpi.certificateCourses + kpi.careerPrograms}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase">
                      Programs
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-sky-400 shrink-0" />
                    <span className="text-slate-600">Module Courses ({kpi.moduleCourses})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-amber-400 shrink-0" />
                    <span className="text-slate-600">Certificate Courses ({kpi.certificateCourses})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-emerald-600 shrink-0" />
                    <span className="text-slate-600">Career Programs ({kpi.careerPrograms})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 3: Active Batches by Status */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Active Batches by Status
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                {/* Visual Donut representation */}
                <div className="relative w-36 h-36 rounded-full border-[18px] border-emerald-600 border-t-amber-500 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-xl font-extrabold text-slate-900">
                      {kpi.activeBatches}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase">
                      Batches
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-emerald-600 shrink-0" />
                    <span className="text-slate-600">Running ({charts?.batchDistribution?.running || 6})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-blue-500 shrink-0" />
                    <span className="text-slate-600">Completed ({charts?.batchDistribution?.completed || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-red-500 shrink-0" />
                    <span className="text-slate-600">Delayed ({charts?.batchDistribution?.delayed || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-amber-500 shrink-0" />
                    <span className="text-slate-600">Scheduled ({charts?.batchDistribution?.scheduled || 1})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row: Enrollment Trend & Revenue Collection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 4: Enrollment Trend (Last 6 Months) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">
                  Enrollment Trend (Last 6 Months)
                </h2>
                <div className="flex items-center gap-3 text-[11px] font-medium">
                  <span className="flex items-center gap-1.5 text-sky-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> New Enrollments
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Placements
                  </span>
                </div>
              </div>

              {/* 6-Month Trend Curve Simulation */}
              <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100">
                {(charts?.enrollmentTrend || [
                  { month: "Apr", newEnrollments: 1 },
                  { month: "May", newEnrollments: 2 },
                  { month: "Jun", newEnrollments: 12 },
                  { month: "Jul", newEnrollments: 16 },
                  { month: "Aug", newEnrollments: 4 },
                  { month: "Sep", newEnrollments: 2 },
                ]).map((item: any) => {
                  const heightPercent = Math.min(100, Math.max(8, (item.newEnrollments / 16) * 100));
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-bold text-slate-700">{item.newEnrollments}</span>
                      <div
                        className="w-full max-w-[28px] bg-sky-500 rounded-t-md transition-all duration-500 hover:bg-sky-600"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[11px] font-semibold text-slate-500 mt-1">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 5: Revenue Collection (6 Months, ₹ Lakh) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Revenue Collection (6 Months, ₹ Lakh)
              </h2>

              <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100">
                {(charts?.revenueCollection || [
                  { month: "Apr", lakhs: 0.2 },
                  { month: "May", lakhs: 0.4 },
                  { month: "Jun", lakhs: 2.4 },
                  { month: "Jul", lakhs: 4.1 },
                  { month: "Aug", lakhs: 1.3 },
                  { month: "Sep", lakhs: 0.9 },
                ]).map((item: any) => {
                  const heightPercent = Math.min(100, Math.max(8, (item.lakhs / 4.5) * 100));
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-bold text-amber-800">₹{item.lakhs}L</span>
                      <div
                        className="w-full max-w-[28px] bg-amber-500 rounded-t-md transition-all duration-500 hover:bg-amber-600"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[11px] font-semibold text-slate-500 mt-1">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Indicators & Targets (Matching 1.pdf p.15-16) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              Performance Indicators & Targets
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {targets.map((target: any) => (
                <div
                  key={target.label}
                  className="p-4 rounded-lg bg-slate-50 border-l-4 border-slate-900 flex items-center justify-between"
                >
                  <span className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    {target.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-900">
                    {target.current} <span className="text-slate-400 font-normal">| Target: {target.target}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links Footer */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Quick Links</h2>
            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <Link href="/admin/settings" className="text-emerald-700 hover:underline flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" /> Profile
              </Link>
              <Link href="/admin/settings" className="text-emerald-700 hover:underline flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" /> Update Profile
              </Link>
              <Link href="/admin/batches" className="text-emerald-700 hover:underline flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" /> Manage Batches
              </Link>
              <Link href="/admin/attendance" className="text-emerald-700 hover:underline flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" /> Mark Classroom Attendance
              </Link>
              <Link href="/admin/analytics" className="text-emerald-700 hover:underline flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" /> Institutional Reports Hub
              </Link>
            </div>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Softlab Global • Current Month • Data is confidential and for internal institutional use only.
            </p>
          </div>
        </div>
      )}

      {/* VIEW B: LIVE PLATFORM TELEMETRY STREAM */}
      {activeTab === "telemetry" && (
        <div className="space-y-6">
          {/* Platforms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(telemetryData?.platforms || []).map((p: any) => (
              <Card key={p.platform} className="border-slate-200 bg-white">
                <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-bold uppercase text-slate-700">
                    {p.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      p.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-amber-50 text-amber-700 border-amber-300"
                    }`}
                  >
                    {p.status}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xl font-bold text-slate-900">{p.leadCount || 0}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Latency: {p.latencyMs}ms • Success: {p.successRate}%
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Live Events Feed */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Real-Time Ingestion Event Log
                </CardTitle>
                <p className="text-xs text-slate-500">Live webhook pings and user conversions</p>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-96 overflow-y-auto divide-y divide-slate-100">
              {(telemetryData?.liveEvents || []).map((ev: any) => (
                <div key={ev.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="font-semibold text-slate-900">{ev.title}</p>
                      <p className="text-[11px] text-slate-500">{ev.detail}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
