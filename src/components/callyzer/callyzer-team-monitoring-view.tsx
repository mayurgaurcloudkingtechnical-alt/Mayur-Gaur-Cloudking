"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/trpc/react";
import {
  PhoneCall,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  Coffee,
  UserCheck,
  Edit2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Radio,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CallyzerAppReportView } from "@/components/callyzer/callyzer-app-report-view";
import { CallRecordingPlayer } from "@/components/common/call-recording-player";

export function CallyzerTeamMonitoringView() {
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedManager, setSelectedManager] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"report" | "live" | "logs">("report");
  const [selectedStaffForLogs, setSelectedStaffForLogs] = useState<any | null>(null);
  const [editingCallLog, setEditingCallLog] = useState<any | null>(null);
  const [editDisposition, setEditDisposition] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Target editing state
  const [editingTargetStaff, setEditingTargetStaff] = useState<any | null>(null);
  const [newTargetValue, setNewTargetValue] = useState<number>(50);

  const utils = api.useUtils();

  // Reporting Managers query
  const { data: reportingManagers = [] } = api.callyzer.listReportingManagers.useQuery();

  // Live polling every 6 seconds for true real-time Callyzer experience
  const { data: liveData, isLoading, refetch, isFetching } = api.callyzer.getLiveTeamMonitoring.useQuery(
    {
      roleCode: selectedRole === "ALL" ? undefined : selectedRole,
      managerId: selectedManager === "ALL" ? undefined : selectedManager,
      search: search.trim() || undefined,
    },
    {
      refetchInterval: 6000,
      refetchOnWindowFocus: true,
    }
  );

  // Call Logs query
  const { data: logsData, refetch: refetchLogs } = api.callyzer.listCallLogs.useQuery({
    roleCode: selectedRole === "ALL" ? undefined : selectedRole,
    managerId: selectedManager === "ALL" ? undefined : selectedManager,
    date: selectedDate,
    search: search.trim() || undefined,
    pageSize: 30,
  });

  // Edit call log mutation
  const updateLogMutation = api.callyzer.updateCallLog.useMutation({
    onSuccess: () => {
      setEditingCallLog(null);
      utils.callyzer.listCallLogs.invalidate();
      utils.callyzer.getLiveTeamMonitoring.invalidate();
    },
  });

  // Update staff target mutation
  const updateTargetMutation = api.callyzer.updateDailyTarget.useMutation({
    onSuccess: () => {
      setEditingTargetStaff(null);
      utils.callyzer.getLiveTeamMonitoring.invalidate();
    },
  });

  const summary = liveData?.summary;
  const staffList = liveData?.staffList || [];
  const roleBreakdowns = liveData?.roleBreakdowns;
  const callLogs = logsData?.logs || [];

  // Export to CSV function
  const handleExportCSV = () => {
    if (!callLogs.length) return;
    const headers = ["Date", "Staff Name", "Role", "Reporting Manager", "Contact Name", "Phone", "Type", "Status", "Duration (Sec)", "Disposition", "Notes"];
    const rows = callLogs.map((l: any) => [
      new Date(l.createdAt).toLocaleString(),
      `"${l.user?.firstName || ""} ${l.user?.lastName || ""}"`,
      l.roleCode,
      `"${l.reportingManagerName || "Head Office Direct"}"`,
      `"${l.contactName || ""}"`,
      `"${l.contactPhone || ""}"`,
      l.callType,
      l.callStatus,
      l.durationSeconds,
      l.disposition,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SoftLab-Call-Report-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Callyzer Top Header & Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Radio className="w-5 h-5 animate-pulse text-emerald-400" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">Callyzer Live Staff Monitoring & Call Analytics</h2>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono">
                    LIVE REAL-TIME FEED
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Real-time call tracking, live caller statuses, talk-time analytics, and daily performance metrics.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => refetch()}
              disabled={isFetching}
              size="sm"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span>{isFetching ? "Syncing..." : "Live Refresh"}</span>
            </Button>

            <Button
              onClick={handleExportCSV}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Live KPI Quick Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">Currently On Call</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xl font-black text-emerald-400">{summary?.currentlyOnCall ?? 0}</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">Available Callers</p>
            <p className="text-xl font-black text-sky-400 mt-1">{summary?.currentlyAvailable ?? 0}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">On Break</p>
            <p className="text-xl font-black text-amber-400 mt-1">{summary?.currentlyOnBreak ?? 0}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">Total Dials Today</p>
            <p className="text-xl font-black text-white mt-1">{summary?.totalTeamCallsToday ?? 0}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">Connected Calls</p>
            <p className="text-xl font-black text-indigo-300 mt-1">
              {summary?.totalTeamConnected ?? 0} ({summary?.teamConnectionRate ?? 0}%)
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">Total Talk Time</p>
            <p className="text-xl font-black text-white mt-1 font-mono">
              {summary?.totalTeamTalkTimeFormatted || "0s"}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">Conversions / Hot</p>
            <p className="text-xl font-black text-emerald-400 mt-1">{summary?.totalTeamConversions ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Post-Wise / Role-Wise Comparative Breakdown Strip */}
      {roleBreakdowns && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Counselors */}
          <div
            onClick={() => setSelectedRole(selectedRole === "COUNSELOR" ? "ALL" : "COUNSELOR")}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              selectedRole === "COUNSELOR"
                ? "bg-blue-50/80 border-blue-400 shadow-sm"
                : "bg-white border-slate-200 hover:border-blue-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">Counselor Team Desk</h4>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {roleBreakdowns.counselors.count} Staff
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-[10px] text-slate-500">Active Calls</p>
                <p className="text-sm font-bold text-blue-600">{roleBreakdowns.counselors.activeNow}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-[10px] text-slate-500">Calls Today</p>
                <p className="text-sm font-bold text-slate-800">{roleBreakdowns.counselors.callsToday}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-[10px] text-slate-500">Talk Time</p>
                <p className="text-xs font-bold font-mono text-slate-800">{roleBreakdowns.counselors.talkTimeFormatted}</p>
              </div>
            </div>
          </div>

          {/* Telecallers */}
          <div
            onClick={() => setSelectedRole(selectedRole === "TELECALLER" ? "ALL" : "TELECALLER")}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              selectedRole === "TELECALLER"
                ? "bg-purple-50/80 border-purple-400 shadow-sm"
                : "bg-white border-slate-200 hover:border-purple-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <h4 className="font-bold text-slate-900 text-sm">Telecaller Calling Desk</h4>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {roleBreakdowns.telecallers.count} Staff
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-[10px] text-slate-500">Active Calls</p>
                <p className="text-sm font-bold text-purple-600">{roleBreakdowns.telecallers.activeNow}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-[10px] text-slate-500">Calls Today</p>
                <p className="text-sm font-bold text-slate-800">{roleBreakdowns.telecallers.callsToday}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-[10px] text-slate-500">Talk Time</p>
                <p className="text-xs font-bold font-mono text-slate-800">{roleBreakdowns.telecallers.talkTimeFormatted}</p>
              </div>
            </div>
          </div>

          {/* Marketing & Admin */}
          <div
            onClick={() => setSelectedRole(selectedRole === "ADMIN" ? "ALL" : "ADMIN")}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              selectedRole === "ADMIN"
                ? "bg-emerald-50/80 border-emerald-400 shadow-sm"
                : "bg-white border-slate-200 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm">Admissions & Management</h4>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {roleBreakdowns.marketing.count} Staff
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-[10px] text-slate-500">Active Calls</p>
                <p className="text-sm font-bold text-emerald-600">{roleBreakdowns.marketing.activeNow}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-[10px] text-slate-500">Calls Today</p>
                <p className="text-sm font-bold text-slate-800">{roleBreakdowns.marketing.callsToday}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-[10px] text-slate-500">Conversions</p>
                <p className="text-sm font-bold text-emerald-600">{roleBreakdowns.marketing.conversions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Search Filter Bar */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setActiveTab("report")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "report" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>📊 Calling Summary & Analysis</span>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] px-1 py-0">
                  App Format
                </Badge>
              </button>
              <button
                onClick={() => setActiveTab("live")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === "live" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🔴 Live Telephony Feed ({staffList.length})
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === "logs" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📋 Call History Logs ({callLogs.length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search staff, client, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              {activeTab === "logs" && (
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-8 text-xs w-[140px]"
                />
              )}

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="h-8 text-xs rounded-md border border-slate-300 px-2 bg-white"
              >
                <option value="ALL">All Posts / Roles</option>
                <option value="COUNSELOR">Counselors</option>
                <option value="TELECALLER">Telecallers</option>
                <option value="ADMIN">Admins / Higher Credentials</option>
              </select>

              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="h-8 text-xs rounded-md border border-slate-300 px-2 bg-white"
              >
                <option value="ALL">🏢 All Hierarchy / All Teams</option>
                <option value="UNASSIGNED">Direct Head Office (Unassigned)</option>
                {reportingManagers.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    👔 {m.user.firstName} {m.user.lastName} ({m._count?.subordinates ?? 0} team)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TAB 0: CALLYZER APP FORMAT REPORT (SUMMARY & ANALYSIS) */}
      {activeTab === "report" && <CallyzerAppReportView />}

      {/* TAB 1: LIVE TEAM MONITORING FEED */}
      {activeTab === "live" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full p-12 text-center text-slate-400 text-xs font-semibold">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading real-time caller tracking...
            </div>
          ) : staffList.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 text-xs font-semibold bg-white rounded-xl border border-dashed border-slate-200">
              No staff members found matching filter criteria.
            </div>
          ) : (
            staffList.map((staff: any) => {
              const isOnCall = staff.liveStatus === "ON_CALL";
              const isAvailable = staff.liveStatus === "AVAILABLE";
              const isBreak = staff.liveStatus === "ON_BREAK";

              return (
                <Card
                  key={staff.userId}
                  className={`border transition hover:shadow-md ${
                    isOnCall
                      ? "border-emerald-300 bg-gradient-to-br from-emerald-50/50 via-white to-white ring-1 ring-emerald-400"
                      : isBreak
                      ? "border-amber-200 bg-amber-50/30"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <CardContent className="p-4 space-y-3.5">
                    {/* Header Info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {staff.fullName
                            .split(" ")
                            .map((n: string) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-900 text-sm leading-tight">{staff.fullName}</h4>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {staff.designation} • <span className="font-mono text-indigo-600 font-bold">{staff.employeeId}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="text-slate-400">Reports to:</span>
                            <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {staff.reportingManagerName || "Head Office Direct"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Live Status Pill */}
                      {isOnCall ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 shadow-xs border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                          On Call
                        </span>
                      ) : isBreak ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Coffee className="w-3 h-3 text-amber-600" />
                          On Break
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          Available
                        </span>
                      )}
                    </div>

                    {/* Active In-Call Highlight Box */}
                    {isOnCall && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between text-emerald-900 font-bold">
                          <span className="flex items-center gap-1">
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                            {staff.currentCallContact || "Active Client"}
                          </span>
                          <span className="font-mono text-emerald-700 font-black">{staff.currentCallDurationFormatted}</span>
                        </div>
                        {staff.currentCallPhone && (
                          <p className="text-[11px] text-emerald-700 font-mono">{staff.currentCallPhone}</p>
                        )}
                      </div>
                    )}

                    {/* Break Info */}
                    {isBreak && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                        <span>Reason: {staff.breakReason || "Personal Break"}</span>
                        <span className="font-mono font-bold text-amber-800">{staff.breakDurationFormatted}</span>
                      </div>
                    )}

                    {/* Idle Information */}
                    {!isOnCall && !isBreak && (
                      <div className="text-[11px] text-slate-500 flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                        <span>Inactivity / Idle Time:</span>
                        <span className="font-semibold text-slate-700">{staff.idleMinutes}m idle</span>
                      </div>
                    )}

                    {/* Today's Target & Calling Metric */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Daily Target Progress</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {staff.todayCallsCount} / {staff.dailyTarget} Calls ({staff.targetProgressPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            staff.targetProgressPercent >= 100
                              ? "bg-emerald-500"
                              : staff.targetProgressPercent >= 50
                              ? "bg-indigo-600"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(100, staff.targetProgressPercent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Today's Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                      <div className="p-1.5 bg-slate-50 rounded-lg">
                        <p className="text-[10px] text-slate-400">Talk Time</p>
                        <p className="text-xs font-bold font-mono text-slate-900">{staff.todayTalkTimeFormatted}</p>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg">
                        <p className="text-[10px] text-slate-400">Connected</p>
                        <p className="text-xs font-bold text-indigo-700">{staff.todayConnectedCount}</p>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg">
                        <p className="text-[10px] text-slate-400">Conversions</p>
                        <p className="text-xs font-bold text-emerald-600">{staff.todayConversionsCount}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        onClick={() => setSelectedStaffForLogs(staff)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5"
                      >
                        <span>View Today's Dials ({staff.todayCallsCount})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setEditingTargetStaff(staff);
                          setNewTargetValue(staff.dailyTarget);
                        }}
                        className="text-[11px] text-slate-400 hover:text-slate-600"
                      >
                        Edit Target
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: CALL HISTORY LOGS */}
      {activeTab === "logs" && (
        <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[11px] font-bold text-slate-500">
                <tr>
                  <th className="p-3">Staff Caller</th>
                  <th className="p-3">Contact / Client</th>
                  <th className="p-3">Call Type</th>
                  <th className="p-3">Talk-Time Duration</th>
                  <th className="p-3">Disposition / Outcome</th>
                  <th className="p-3">Notes & Next Follow-up</th>
                  <th className="p-3">Audio Recording</th>
                  <th className="p-3">Time</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {callLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold">
                      No call records logged for this filter.
                    </td>
                  </tr>
                ) : (
                  callLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">
                          {log.user?.firstName} {log.user?.lastName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {log.roleCode}
                          </Badge>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Mgr: {log.reportingManagerName || "Head Office"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{log.contactName}</p>
                        <p className="font-mono text-slate-500 text-[11px]">{log.contactPhone}</p>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {log.callType}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {log.durationFormatted}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.disposition === "ADMISSION_CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800"
                              : log.disposition === "INTERESTED"
                              ? "bg-blue-100 text-blue-800"
                              : log.disposition === "CALLBACK"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {log.disposition}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="truncate text-slate-700">{log.notes || "—"}</p>
                        {log.nextFollowUpDate && (
                          <p className="text-[10px] text-indigo-600 font-medium">
                            Follow-up: {new Date(log.nextFollowUpDate).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <CallRecordingPlayer
                          recordingUrl={log.recordingUrl}
                          transcript={log.transcript}
                          contactName={log.contactName}
                          contactPhone={log.contactPhone}
                          callDurationSeconds={log.durationSeconds}
                          disposition={log.disposition}
                          compact={true}
                        />
                      </td>
                      <td className="p-3 text-[11px] text-slate-500">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          onClick={() => {
                            setEditingCallLog(log);
                            setEditDisposition(log.disposition);
                            setEditNotes(log.notes || "");
                          }}
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* STAFF DETAIL MODAL */}
      {selectedStaffForLogs && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white border-slate-200 shadow-xl max-h-[85vh] flex flex-col">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-indigo-600" />
                  Today's Call History: {selectedStaffForLogs.fullName}
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedStaffForLogs.designation} • Employee ID: {selectedStaffForLogs.employeeId}
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedStaffForLogs(null)}>
                Close
              </Button>
            </CardHeader>
            <div className="p-4 overflow-y-auto space-y-2">
              {selectedStaffForLogs.recentCalls.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No calls logged yet today by this staff member.</p>
              ) : (
                selectedStaffForLogs.recentCalls.map((c: any) => (
                  <div key={c.id} className="p-3 border border-slate-200 rounded-xl text-xs space-y-1 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{c.contactName} ({c.contactPhone})</span>
                      <span className="font-mono font-bold text-indigo-700">{Math.floor(c.durationSeconds / 60)}m {c.durationSeconds % 60}s</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Outcome: <strong className="text-slate-800">{c.disposition}</strong></span>
                      <div className="flex items-center gap-2">
                        <CallRecordingPlayer
                          recordingUrl={c.recordingUrl}
                          transcript={c.transcript}
                          contactName={c.contactName}
                          contactPhone={c.contactPhone}
                          callDurationSeconds={c.durationSeconds}
                          disposition={c.disposition}
                          compact={true}
                        />
                        <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    {c.notes && <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">{c.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* EDIT CALL LOG MODAL */}
      {editingCallLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                Edit Call Disposition & Notes
              </CardTitle>
            </CardHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateLogMutation.mutate({
                  callLogId: editingCallLog.id,
                  disposition: editDisposition,
                  notes: editNotes,
                });
              }}
            >
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Client / Contact</label>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {editingCallLog.contactName} ({editingCallLog.contactPhone})
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Call Disposition</label>
                  <select
                    value={editDisposition}
                    onChange={(e) => setEditDisposition(e.target.value)}
                    className="w-full h-8 text-xs mt-1 rounded-md border border-slate-300 px-2 bg-white"
                  >
                    <option value="INTERESTED">INTERESTED</option>
                    <option value="ADMISSION_CONFIRMED">ADMISSION_CONFIRMED</option>
                    <option value="CALLBACK">CALLBACK_REQUESTED</option>
                    <option value="FOLLOW_UP">FOLLOW_UP_SCHEDULED</option>
                    <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                    <option value="BUSY_NO_ANSWER">BUSY_NO_ANSWER</option>
                    <option value="WRONG_NUMBER">WRONG_NUMBER</option>
                    <option value="ENQUIRY_RESOLVED">ENQUIRY_RESOLVED</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Remarks & Objections</label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full text-xs mt-1 rounded-md border border-slate-300 p-2"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingCallLog(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateLogMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                  >
                    {updateLogMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* EDIT DAILY TARGET MODAL */}
      {editingTargetStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-white border-slate-200 shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Set Daily Calling Target
              </CardTitle>
            </CardHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateTargetMutation.mutate({
                  userId: editingTargetStaff.userId,
                  targetCalls: Number(newTargetValue),
                });
              }}
            >
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-slate-600">
                  Adjust daily calls target for <strong className="text-slate-900">{editingTargetStaff.fullName}</strong>.
                </p>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Target Dials / Day</label>
                  <Input
                    type="number"
                    min={5}
                    max={300}
                    value={newTargetValue}
                    onChange={(e) => setNewTargetValue(Number(e.target.value))}
                    className="h-8 text-xs font-mono mt-1"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingTargetStaff(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateTargetMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                  >
                    {updateTargetMutation.isPending ? "Updating..." : "Update Target"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
