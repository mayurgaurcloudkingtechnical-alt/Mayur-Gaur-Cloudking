"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  PhoneCall,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Filter,
  RefreshCw,
  Share2,
  MessageSquare,
  Copy,
  Check,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  ChevronDown,
  BarChart2,
  ExternalLink,
  Flame,
  User,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type PresetType = "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "THIS_MONTH";

export function CallyzerAppReportView() {
  const [activeTab, setActiveTab] = useState<"summary" | "analysis">("summary");
  const [preset, setPreset] = useState<PresetType>("TODAY");
  const [selectedUserId, setSelectedUserId] = useState<string>("ME");
  const [copied, setCopied] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Fetch staff list for managers / admins
  const { data: staffList = [] } = api.callyzer.listStaffForCallyzer.useQuery();

  // Fetch Callyzer summary report
  const {
    data: report,
    isLoading,
    refetch,
    isFetching,
  } = api.callyzer.getCallyzerSummaryReport.useQuery(
    {
      preset,
      userId: selectedUserId === "ME" ? undefined : selectedUserId,
    },
    {
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    }
  );

  const summary = report?.summary;
  const analysis = report?.analysis;
  const whatsapp = report?.whatsapp;
  const staffInfo = report?.staffInfo;

  const handleCopyReport = () => {
    if (!whatsapp?.text) return;
    navigator.clipboard.writeText(whatsapp.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const presetLabels: Record<PresetType, string> = {
    TODAY: "Today",
    YESTERDAY: "Yesterday",
    LAST_7_DAYS: "Last 7 Days",
    THIS_MONTH: "This Month",
  };

  return (
    <div className="space-y-6">
      {/* 1. Callyzer App Header Bar (Matching Mobile Reference) */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          {/* Staff & Title Info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5">
                ● Callyzer Telephony Live
              </Badge>
              {staffInfo?.roleCode && (
                <Badge variant="outline" className="border-slate-700 text-slate-300 text-[11px]">
                  {staffInfo.roleCode}
                </Badge>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{staffInfo?.name || "My Calling Report"}</span>
              {staffInfo?.employeeId && (
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({staffInfo.employeeId})
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Inbuilt calling analytics, duration logs, and daily WhatsApp broadcast dossier.
            </p>
          </div>

          {/* Quick Staff Switcher & Date Preset Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Staff Selector (For Managers & Admins) */}
            {staffList.length > 0 && (
              <div className="relative">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 pr-8 font-medium appearance-none cursor-pointer hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ME">👤 My Calling Report</option>
                  <option value="ALL">👥 All Staff (Team Total)</option>
                  <optgroup label="Counselors & Telecallers">
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.roleCode} • {s.employeeId})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Refresh */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white h-9 px-3 gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Date Interval Bar (Matching exact Callyzer top strip) */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-sm tracking-wide text-white font-bold">
              {report?.dateRangeLabel || "Today 12:00 AM - 11:59 PM"}
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            {(["TODAY", "YESTERDAY", "LAST_7_DAYS", "THIS_MONTH"] as PresetType[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                  preset === p
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {presetLabels[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. WhatsApp Group Broadcast Action Banner */}
      <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/40 p-4 rounded-xl border border-emerald-800/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Post Calling Report to WhatsApp Group</span>
              <Badge className="bg-emerald-600/30 text-emerald-300 border-emerald-500/30 text-[10px]">
                1-Click Share
              </Badge>
            </h4>
            <p className="text-xs text-slate-300">
              Broadcast daily calling summary dossier to your official counselor WhatsApp group or direct staff number.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Post to WhatsApp Group */}
          <Button
            asChild
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 gap-1.5 shadow-md shadow-emerald-950/40"
          >
            <a
              href={whatsapp?.groupShareUrl || "https://api.whatsapp.com"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Post to WhatsApp Group</span>
            </a>
          </Button>

          {/* Send to Staff Number */}
          {whatsapp?.staffDirectUrl && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-emerald-700 bg-slate-900/80 hover:bg-emerald-950 text-emerald-300 text-xs h-9 gap-1.5"
            >
              <a
                href={whatsapp.staffDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Send to Staff Phone</span>
              </a>
            </Button>
          )}

          {/* Copy Report */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyReport}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white text-xs h-9 gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Text"}</span>
          </Button>

          {/* Preview Text */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreviewModal(true)}
            className="text-xs text-slate-400 hover:text-white hover:bg-slate-800 h-9"
          >
            Preview
          </Button>
        </div>
      </div>

      {/* 3. Sub-Tab Switcher: Summary vs Analysis (Matching Callyzer Mobile App) */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-300 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`px-8 py-2 rounded-lg text-sm font-extrabold transition-all ${
              activeTab === "summary"
                ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("analysis")}
            className={`px-8 py-2 rounded-lg text-sm font-extrabold transition-all ${
              activeTab === "analysis"
                ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Analysis
          </button>
        </div>
      </div>

      {/* TAB 1: SUMMARY — 8 CARDS MATCHING EXACT CALLYZER SCREENSHOT */}
      {activeTab === "summary" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Phone Calls */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between min-h-[145px]">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Total Phone Calls
              </span>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <PhoneCall className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {summary?.totalPhoneCalls ?? 0}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{summary?.totalTalkTimeFormatted ?? "0s"}</span>
              </div>
            </div>
          </Card>

          {/* Card 2: Incoming Calls */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between min-h-[145px]">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Incoming Calls
              </span>
              <div className="p-2.5 rounded-xl bg-lime-50 dark:bg-lime-950/40 text-lime-600 dark:text-lime-400 border border-lime-200 dark:border-lime-800">
                <PhoneIncoming className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {summary?.incomingCalls ?? 0}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{summary?.incomingTalkTimeFormatted ?? "0s"}</span>
              </div>
            </div>
          </Card>

          {/* Card 3: Outgoing Calls */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between min-h-[145px]">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Outgoing Calls
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <PhoneOutgoing className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {summary?.outgoingCalls ?? 0}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{summary?.outgoingTalkTimeFormatted ?? "0s"}</span>
              </div>
            </div>
          </Card>

          {/* Card 4: Missed Calls */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between min-h-[145px]">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Missed Calls
              </span>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                <PhoneMissed className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {summary?.missedCalls ?? 0}
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Inbound calls not attended
              </p>
            </div>
          </Card>

          {/* Card 5: Rejected Calls */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between min-h-[145px]">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Rejected Calls
              </span>
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                <PhoneOff className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {summary?.rejectedCalls ?? 0}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Declined or busy connections
              </p>
            </div>
          </Card>

          {/* Card 6: Never Attended Calls */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between min-h-[145px]">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Never Attended Calls
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 border border-amber-200 dark:border-amber-800">
                <PhoneOff className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {summary?.neverAttendedCalls ?? 0}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Zero talk-time abandoned
              </p>
            </div>
          </Card>

          {/* Card 7: Not Pickup by Client */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between min-h-[145px]">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Not Pickup by Client
              </span>
              <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                <PhoneOutgoing className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {summary?.notPickupByClient ?? 0}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Outgoing client no-answers
              </p>
            </div>
          </Card>

          {/* Card 8: Unique Calls */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between min-h-[145px]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Unique Calls
                </span>
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[9px] px-1.5 py-0 font-bold">
                  Premium Plus
                </Badge>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                {summary?.uniqueCalls ?? 0}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unique client prospects contacted
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: ANALYSIS — HOURLY DISTRIBUTION & PERFORMANCE EFFICIENCY */}
      {activeTab === "analysis" && (
        <div className="space-y-6">
          {/* Top Performance Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Connection Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                {summary?.connectionRate ?? 0}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {summary?.connectedCalls ?? 0} connected out of {summary?.totalPhoneCalls ?? 0} attempts
              </p>
            </Card>

            <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Average Duration</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                {summary?.avgDurationFormatted ?? "0s"}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Average conversation length per call
              </p>
            </Card>

            <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Conversions / Leads</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
                {summary?.conversions ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Marked Interested or Admission Confirmed
              </p>
            </Card>
          </div>

          {/* Hourly Distribution Bar Chart */}
          <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="p-0 pb-5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-500" />
                <span>Hourly Calling Activity Distribution</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Call volume across business working hours (9:00 AM – 7:00 PM IST)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2">
                {analysis?.hourlyDistribution?.slice(8, 20).map((h) => {
                  const maxCalls = Math.max(1, ...(analysis?.hourlyDistribution?.map((x) => x.calls) || [1]));
                  const heightPercent = Math.max(8, Math.round((h.calls / maxCalls) * 100));
                  return (
                    <div key={h.hour} className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {h.calls > 0 ? h.calls : "—"}
                      </span>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg h-28 flex items-end p-1">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-md transition-all ${
                            h.calls > 0 ? "bg-blue-600 hover:bg-blue-500" : "bg-transparent"
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {h.label.replace(":00", "")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Disposition Breakdown */}
          {analysis?.dispositionCounts && Object.keys(analysis.dispositionCounts).length > 0 && (
            <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-sm font-bold">Dispositions Breakdown</CardTitle>
                <CardDescription className="text-xs">Outcome of logged calls</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(analysis.dispositionCounts).map(([disp, count]) => (
                    <div
                      key={disp}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1"
                    >
                      <span className="text-[11px] font-semibold text-slate-500 uppercase truncate block">
                        {disp.replace(/_/g, " ")}
                      </span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 4. WhatsApp Text Preview Dialog */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-lg bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Calling Report Preview</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Formatted WhatsApp dossier ready for transmission to the group.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[360px] overflow-y-auto text-emerald-300">
            {whatsapp?.text}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyReport}
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white text-xs h-9 gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Text"}</span>
            </Button>

            <Button
              asChild
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 gap-1.5"
            >
              <a
                href={whatsapp?.groupShareUrl || "https://api.whatsapp.com"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Open in WhatsApp</span>
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
