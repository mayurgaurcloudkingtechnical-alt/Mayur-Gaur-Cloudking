"use client";

import * as React from "react";
import { useState } from "react";
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
  RefreshCw,
  BarChart3,
  TrendingUp,
  Award,
  Briefcase,
  CheckCircle2,
  Layers,
  ChevronRight,
  ExternalLink,
  Target,
} from "lucide-react";

export function TrainerDashboardView() {
  const [activeTab, setActiveTab] = useState<"metrics" | "teaching">("metrics");

  const { data: metricsData, isLoading: isMetricsLoading, refetch: refetchMetrics } =
    api.dashboard.getCorePerformanceMetrics.useQuery(undefined, {
      refetchOnWindowFocus: true,
    });

  const { data: trainerData, isLoading: isTrainerLoading, refetch: refetchTrainer } =
    api.trainer.getDashboard.useQuery();

  const handleRefresh = () => {
    refetchMetrics();
    refetchTrainer();
  };

  const kpi = metricsData?.kpi || {
    activeBatches: 8,
    batchesThisMonth: 2,
    totalStudents: 348,
    studentsThisMonth: 18,
    moduleCourses: 37,
    careerPrograms: 7,
    certificateCourses: 14,
    totalLeads: 389,
    newLeadsThisMonth: 42,
    enquiries: 214,
    enrolments: 128,
    placedCount: 92,
    placementRate: "84.2",
    dropouts: 6,
    delayedBatches: 1,
  };

  const trainerBatches = trainerData?.batches || [];
  const upcomingClasses = trainerData?.upcomingClasses || [];

  return (
    <div className="space-y-6">
      {/* Top Header matching Dashboard.pdf (Pages 8-11) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Core Performance Metrics
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#0088cc]/10 text-[#0088cc] border border-[#0088cc]/20">
              SoftLab Global LMS
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
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
              onClick={() => setActiveTab("teaching")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "teaching"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
              <span>Faculty Desk</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 text-xs border-slate-300"
            title="Refresh Real-time Data"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* VIEW A: CORE PERFORMANCE METRICS (Exact match to Dashboard.pdf Pages 8-11) */}
      {activeTab === "metrics" && (
        <div className="space-y-8">
          {/* 12 Core KPI Cards Grid (PDF Page 8) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* 1. ACTIVE BATCHES */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0088cc]/50 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                ACTIVE BATCHES
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1.5">
                {kpi.activeBatches}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                ↑ +12% vs last mo
              </p>
            </div>

            {/* 2. TOTAL STUDENTS */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0088cc]/50 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                TOTAL STUDENTS
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1.5">
                {kpi.totalStudents}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                ↑ +18% vs last mo
              </p>
            </div>

            {/* 3. MODULE COURSES */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0088cc]/50 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                MODULE COURSES
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1.5">
                {kpi.moduleCourses}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Full course catalog
              </p>
            </div>

            {/* 4. CAREER PROGRAMS */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0088cc]/50 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                CAREER PROGRAMS
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1.5">
                {kpi.careerPrograms}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Placement tracks
              </p>
            </div>

            {/* 5. CERTIFICATE COURSES */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0088cc]/50 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                CERTIFICATE COURSES
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1.5">
                {kpi.certificateCourses}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Short-term certifications
              </p>
            </div>

            {/* 6. TOTAL LEADS */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0088cc]/50 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                TOTAL LEADS
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1.5">
                {kpi.totalLeads}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Q1 Inbound pipeline
              </p>
            </div>

            {/* 7. ENQUIRIES */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0088cc]/50 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                ENQUIRIES
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1.5">
                {kpi.enquiries}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                Converted 55%
              </p>
            </div>

            {/* 8. ENROLMENTS */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0088cc]/50 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                ENROLMENTS
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1.5">
                {kpi.enrolments}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                This quarter admissions
              </p>
            </div>

            {/* 9. PLACED */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0088cc]/50 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                PLACED
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1.5">
                {kpi.placedCount}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                2025-26 Cohort batch
              </p>
            </div>

            {/* 10. PLACEMENT RATE */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0088cc]/50 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                PLACEMENT RATE
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1.5">
                {kpi.placementRate}%
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                Target: 85% • High track
              </p>
            </div>

            {/* 11. DROPOUTS */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0088cc]/50 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                DROPOUTS
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1.5">
                {kpi.dropouts}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                1.7% low risk
              </p>
            </div>

            {/* 12. DELAYED BATCHES */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0088cc]/50 transition">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                DELAYED BATCHES
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1.5">
                {kpi.delayedBatches}
              </p>
              <p className="text-xs text-amber-600 font-medium mt-1">
                Action required
              </p>
            </div>
          </div>

          {/* PDF Page 9: Enrollment Funnel Analysis & Course Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment Funnel Analysis */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Enrollment Funnel Analysis
                </h2>
                <span className="text-xs font-semibold text-slate-500">Pipeline Conversion</span>
              </div>

              <div className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Total Inquiries</span>
                    <span className="font-bold text-slate-900">1,240 (100%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-[#0088cc] h-full rounded-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Counseling Done</span>
                    <span className="font-bold text-slate-900">868 (70%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-[#0088cc]/80 h-full rounded-full w-[70%]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Demo Attended</span>
                    <span className="font-bold text-slate-900">520 (42%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-[#0088cc]/65 h-full rounded-full w-[42%]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Admissions Confirmed</span>
                    <span className="font-bold text-slate-900">348 (28%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-[#0088cc]/50 h-full rounded-full w-[28%]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Placement Ready</span>
                    <span className="font-bold text-slate-900">293 (24%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[24%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Course Distribution */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Course Distribution
                </h2>
                <span className="text-xs font-semibold text-slate-500">Curriculum Breadth</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                  <span className="text-blue-800 text-[11px] font-bold block">Full Stack Web Dev</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">28%</span>
                  <span className="text-[10px] text-slate-500">MERN • Java • Python</span>
                </div>

                <div className="p-3 rounded-lg bg-cyan-50/60 border border-cyan-100">
                  <span className="text-cyan-800 text-[11px] font-bold block">Cloud & DevOps</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">22%</span>
                  <span className="text-[10px] text-slate-500">AWS • Azure • Docker</span>
                </div>

                <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-100">
                  <span className="text-purple-800 text-[11px] font-bold block">Data Science & AI</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">18%</span>
                  <span className="text-[10px] text-slate-500">Python • ML • Tableau</span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <span className="text-emerald-800 text-[11px] font-bold block">Cyber Security</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">14%</span>
                  <span className="text-[10px] text-slate-500">Ethical Hacking • SOC</span>
                </div>

                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100">
                  <span className="text-amber-800 text-[11px] font-bold block">Software Testing</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">10%</span>
                  <span className="text-[10px] text-slate-500">Selenium • Manual • QA</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 text-[11px] font-bold block">Others & Electives</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">8%</span>
                  <span className="text-[10px] text-slate-500">Mobile • UI/UX • Certs</span>
                </div>
              </div>
            </div>
          </div>

          {/* PDF Page 10: 6-Month Trend, Revenue Collection & Active Batches */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 6-Month Trend */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
                6-Month Trend Line
              </h2>
              <p className="text-xs text-slate-500 mb-4">Admissions vs Placements Growth</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">Oct 2025</span>
                  <span className="font-mono text-slate-900">42 Adm / 18 Placed</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">Nov 2025</span>
                  <span className="font-mono text-slate-900">54 Adm / 22 Placed</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">Dec 2025</span>
                  <span className="font-mono text-slate-900">48 Adm / 20 Placed</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">Jan 2026</span>
                  <span className="font-mono text-slate-900">62 Adm / 25 Placed</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">Feb 2026</span>
                  <span className="font-mono text-slate-900">70 Adm / 28 Placed</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-emerald-50 border border-emerald-100">
                  <span className="font-bold text-emerald-800">Mar 2026 (Live)</span>
                  <span className="font-mono font-bold text-emerald-900">82 Adm / 32 Placed</span>
                </div>
              </div>
            </div>

            {/* Revenue Collection */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
                Revenue Collection (₹ Lakh)
              </h2>
              <p className="text-xs text-slate-500 mb-4">Monthly tuition & course fee collection</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600">Jan: ₹ 25.6 Lakh</span>
                    <span className="font-bold text-slate-800">82%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#0088cc] h-full rounded-full w-[82%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600">Feb: ₹ 28.2 Lakh</span>
                    <span className="font-bold text-slate-800">90%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#0088cc] h-full rounded-full w-[90%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600">Mar: ₹ 31.5 Lakh</span>
                    <span className="font-bold text-emerald-700">100%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full w-full" />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Quarter Total</span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm">₹ 85.3 Lakh</span>
                </div>
              </div>
            </div>

            {/* Active Batches Donut Breakdown */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
                Active Batches by Program
              </h2>
              <p className="text-xs text-slate-500 mb-4">Running academic cohorts breakdown</p>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">Full Stack Web Dev</span>
                  <Badge variant="outline" className="font-bold text-[#0088cc] bg-blue-50">3 Batches</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">Cloud & DevOps</span>
                  <Badge variant="outline" className="font-bold text-cyan-700 bg-cyan-50">2 Batches</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">Data Science & AI</span>
                  <Badge variant="outline" className="font-bold text-purple-700 bg-purple-50">1 Batch</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">Cyber Security</span>
                  <Badge variant="outline" className="font-bold text-emerald-700 bg-emerald-50">1 Batch</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">Software Testing / QA</span>
                  <Badge variant="outline" className="font-bold text-amber-700 bg-amber-50">1 Batch</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* PDF Page 11: Performance Indicators & Targets */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Performance Indicators & Institutional Targets
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="bg-white p-4 rounded-xl border-l-4 border-l-[#0088cc] border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Batch Completion Rate</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">91.4%</span>
                <div className="flex items-center justify-between text-xs mt-2 text-slate-500">
                  <span>Target: 90.0%</span>
                  <span className="font-bold text-emerald-600">On Track</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-4 rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Student Satisfaction (CSAT)</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">4.6 / 5.0</span>
                <div className="flex items-center justify-between text-xs mt-2 text-slate-500">
                  <span>Target: 4.5</span>
                  <span className="font-bold text-emerald-600">Exceeded</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-4 rounded-xl border-l-4 border-l-amber-500 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Trainer Utilization</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">78.5%</span>
                <div className="flex items-center justify-between text-xs mt-2 text-slate-500">
                  <span>Target: 80.0%</span>
                  <span className="font-bold text-slate-700">Normal</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white p-4 rounded-xl border-l-4 border-l-purple-500 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Avg. Placement Package</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">₹ 6.8 LPA</span>
                <div className="flex items-center justify-between text-xs mt-2 text-slate-500">
                  <span>Target: ₹ 6.5 LPA</span>
                  <span className="font-bold text-emerald-600">Exceeded</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: FACULTY TEACHING DESK & COHORTS */}
      {(activeTab === "teaching" || activeTab === "metrics") && (
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Faculty Workspace & Cohort Roster</h2>
              <p className="text-xs text-slate-500">Quick access to assigned batches, attendance logs, and curriculum</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/trainer/batches">
                <Button variant="outline" size="sm" className="text-xs h-8">
                  View All Batches <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Portal Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/trainer/batches"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#0088cc] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#0088cc] group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-3">Assigned Batches</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage cohorts, student lists, and schedules</p>
            </Link>

            <Link
              href="/trainer/attendance"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-3">Daily Attendance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Take roll-call, mark present/absent, log topics</p>
            </Link>

            <Link
              href="/trainer/courses"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-3">Course Topics & CMS</h3>
              <p className="text-xs text-slate-500 mt-0.5">Explore 37 IT curriculum specs and modules</p>
            </Link>

            <Link
              href="/trainer/classes"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-3">Live Class Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">Start virtual lecture rooms and meeting links</p>
            </Link>
          </div>

          {/* Assigned Batches Cards */}
          {trainerBatches.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Your Assigned Cohorts</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {trainerBatches.slice(0, 3).map((b: any) => (
                  <div key={b.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {b.code}
                      </span>
                      <Badge variant={b.status === "ONGOING" ? "success" : "secondary"} className="text-[10px]">
                        {b.status}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                      <p className="text-xs text-slate-500">{b.courseTitle}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <span>{b.activeStudentCount} Students Enrolled</span>
                      <Link
                        href={`/trainer/attendance?batchId=${b.id}`}
                        className="text-[#0088cc] hover:underline font-semibold flex items-center gap-1"
                      >
                        Roll-Call <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Class Sessions */}
          {upcomingClasses.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Upcoming Scheduled Lectures</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingClasses.slice(0, 3).map((cls: any) => {
                  const sessionDate = new Date(cls.scheduledAt);
                  return (
                    <div key={cls.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#0088cc] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {cls.batchCode}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {sessionDate.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{cls.title}</h4>
                      <p className="text-xs text-slate-500">{cls.batchName}</p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {sessionDate.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        <Link
                          href="/trainer/classes"
                          className="text-xs text-[#0088cc] hover:underline font-semibold"
                        >
                          Join Session →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
