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
  Trash2,
  Plus,
  AlertTriangle,
  FileDown,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CallyzerAppReportView } from "@/components/callyzer/callyzer-app-report-view";
import { CallRecordingPlayer } from "@/components/common/call-recording-player";

const toLocalDatetimeInput = (dateInput: Date | string | number | null | undefined) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function CallyzerTeamMonitoringView() {
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedManager, setSelectedManager] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"report" | "live" | "logs">("report");
  const [selectedStaffForLogs, setSelectedStaffForLogs] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Target editing state
  const [editingTargetStaff, setEditingTargetStaff] = useState<any | null>(null);
  const [newTargetValue, setNewTargetValue] = useState<number>(50);

  // Full Edit Modal State
  const [editingCallLog, setEditingCallLog] = useState<any | null>(null);
  const [editContactName, setEditContactName] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editUserId, setEditUserId] = useState("");
  const [editCallType, setEditCallType] = useState<"OUTGOING" | "INCOMING" | "MISSED" | "REJECTED">("OUTGOING");
  const [editCallStatus, setEditCallStatus] = useState<"CONNECTED" | "BUSY" | "NO_ANSWER" | "FAILED">("CONNECTED");
  const [editDurationMinutes, setEditDurationMinutes] = useState(0);
  const [editDurationSeconds, setEditDurationSeconds] = useState(0);
  const [editDisposition, setEditDisposition] = useState("INTERESTED");
  const [editNotes, setEditNotes] = useState("");
  const [editFollowUpDate, setEditFollowUpDate] = useState("");
  const [editCreatedAt, setEditCreatedAt] = useState("");

  // Create Manual Call Log Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [newCallType, setNewCallType] = useState<"OUTGOING" | "INCOMING" | "MISSED" | "REJECTED">("OUTGOING");
  const [newCallStatus, setNewCallStatus] = useState<"CONNECTED" | "BUSY" | "NO_ANSWER" | "FAILED">("CONNECTED");
  const [newDurationMinutes, setNewDurationMinutes] = useState(0);
  const [newDurationSeconds, setNewDurationSeconds] = useState(0);
  const [newDisposition, setNewDisposition] = useState("INTERESTED");
  const [newNotes, setNewNotes] = useState("");
  const [newFollowUpDate, setNewFollowUpDate] = useState("");
  const [newCreatedAt, setNewCreatedAt] = useState(toLocalDatetimeInput(new Date()));

  // Delete State
  const [deletingCallLog, setDeletingCallLog] = useState<any | null>(null);
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const utils = api.useUtils();

  // Reporting Managers & Staff Members queries
  const { data: reportingManagers = [] } = api.callyzer.listReportingManagers.useQuery();
  const { data: staffMembers = [] } = api.callyzer.listStaffForCallyzer.useQuery();

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
  const { data: logsData } = api.callyzer.listCallLogs.useQuery({
    roleCode: selectedRole === "ALL" ? undefined : selectedRole,
    managerId: selectedManager === "ALL" ? undefined : selectedManager,
    date: selectedDate,
    search: search.trim() || undefined,
    pageSize: 50,
  });

  // Edit call log mutation
  const updateLogMutation = api.callyzer.updateCallLog.useMutation({
    onSuccess: () => {
      setEditingCallLog(null);
      utils.callyzer.listCallLogs.invalidate();
      utils.callyzer.getLiveTeamMonitoring.invalidate();
    },
  });

  // Delete single call log mutation
  const deleteLogMutation = api.callyzer.deleteCallLog.useMutation({
    onSuccess: () => {
      const deletedId = deletingCallLog?.id;
      setDeletingCallLog(null);
      if (deletedId) {
        setSelectedLogIds((prev) => {
          const next = new Set(prev);
          next.delete(deletedId);
          return next;
        });
      }
      utils.callyzer.listCallLogs.invalidate();
      utils.callyzer.getLiveTeamMonitoring.invalidate();
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = api.callyzer.deleteCallLogsBulk.useMutation({
    onSuccess: () => {
      setShowBulkDeleteConfirm(false);
      setSelectedLogIds(new Set());
      utils.callyzer.listCallLogs.invalidate();
      utils.callyzer.getLiveTeamMonitoring.invalidate();
    },
  });

  // Create manual call log mutation
  const createLogMutation = api.callyzer.createManualCallLog.useMutation({
    onSuccess: () => {
      setShowCreateModal(false);
      setNewContactName("");
      setNewContactPhone("");
      setNewNotes("");
      setNewFollowUpDate("");
      setNewDurationMinutes(0);
      setNewDurationSeconds(0);
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

  // Helper to open edit modal with all current log values
  const openEditModal = (log: any) => {
    setEditingCallLog(log);
    setEditContactName(log.contactName || "");
    setEditContactPhone(log.contactPhone || "");
    setEditUserId(log.userId || log.user?.id || "");
    setEditCallType(log.callType || "OUTGOING");
    setEditCallStatus(log.callStatus || "CONNECTED");
    const totalSec = log.durationSeconds || 0;
    setEditDurationMinutes(Math.floor(totalSec / 60));
    setEditDurationSeconds(totalSec % 60);
    setEditDisposition(log.disposition || "INTERESTED");
    setEditNotes(log.notes || "");
    setEditFollowUpDate(log.nextFollowUpDate ? new Date(log.nextFollowUpDate).toISOString().slice(0, 10) : "");
    setEditCreatedAt(toLocalDatetimeInput(log.createdAt));
  };

  // Helper to download content
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate Excel SpreadsheetML XML
  const generateExcelXml = (logs: any[]) => {
    const escapeXml = (unsafe: any) => {
      if (unsafe === null || unsafe === undefined) return "";
      return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const rows = logs
      .map(
        (l: any, idx: number) => `
    <Row>
      <Cell ss:StyleID="Number"><Data ss:Type="Number">${idx + 1}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(new Date(l.createdAt).toLocaleString())}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(`${l.user?.firstName || ""} ${l.user?.lastName || ""}`.trim())}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.roleCode || "")}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.callerEmployeeId || l.user?.staffProfile?.employeeId || "-")}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.reportingManagerName || "Head Office Direct")}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.contactName || "")}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.contactPhone || "")}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.callType || "OUTGOING")}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.callStatus || "CONNECTED")}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.durationFormatted || `${l.durationSeconds}s`)}</Data></Cell>
      <Cell ss:StyleID="Number"><Data ss:Type="Number">${l.durationSeconds || 0}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.disposition || "")}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.notes || "")}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.nextFollowUpDate ? new Date(l.nextFollowUpDate).toLocaleDateString() : "-")}</Data></Cell>
      <Cell ss:StyleID="Text"><Data ss:Type="String">${escapeXml(l.recordingUrl || "None")}</Data></Cell>
    </Row>`
      )
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Text">
   <NumberFormat ss:Format="@"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Number">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Call Logs">
  <Table>
   <Column ss:Width="40"/>
   <Column ss:Width="130"/>
   <Column ss:Width="130"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="140"/>
   <Column ss:Width="140"/>
   <Column ss:Width="120"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Column ss:Width="70"/>
   <Column ss:Width="140"/>
   <Column ss:Width="220"/>
   <Column ss:Width="100"/>
   <Column ss:Width="180"/>
   <Row ss:Height="26">
    <Cell ss:StyleID="Header"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Date &amp; Time</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Staff Caller</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Role</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Employee ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Reporting Manager</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Client / Lead Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Phone Number</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Call Type</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Call Status</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Duration</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Duration (Sec)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Disposition</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Notes &amp; Remarks</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Next Follow-Up</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Audio Recording</Data></Cell>
   </Row>
   ${rows}
  </Table>
 </Worksheet>
</Workbook>`;
  };

  // Generate CSV Content with UTF-8 BOM
  const generateCsvContent = (logs: any[]) => {
    const headers = [
      "S.No",
      "Date & Time",
      "Staff Caller",
      "Role",
      "Employee ID",
      "Reporting Manager",
      "Client / Lead Name",
      "Phone Number",
      "Call Type",
      "Call Status",
      "Duration",
      "Duration (Sec)",
      "Disposition",
      "Notes & Remarks",
      "Next Follow-Up",
      "Audio Recording URL",
    ];
    const rows = logs.map((l: any, idx: number) => [
      idx + 1,
      `"${new Date(l.createdAt).toLocaleString()}"`,
      `"${l.user?.firstName || ""} ${l.user?.lastName || ""}"`,
      l.roleCode || "",
      `"${l.callerEmployeeId || l.user?.staffProfile?.employeeId || "-"}"`,
      `"${l.reportingManagerName || "Head Office Direct"}"`,
      `"${(l.contactName || "").replace(/"/g, '""')}"`,
      `"\t${l.contactPhone || ""}"`,
      l.callType || "OUTGOING",
      l.callStatus || "CONNECTED",
      `"${l.durationFormatted || `${l.durationSeconds}s`}"`,
      l.durationSeconds || 0,
      `"${l.disposition || ""}"`,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      `"${l.nextFollowUpDate ? new Date(l.nextFollowUpDate).toLocaleDateString() : "-"}"`,
      `"${l.recordingUrl || ""}"`,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  };

  // Download Excel (.xls)
  const handleDownloadExcel = async (exportSelectedOnly = false) => {
    setIsExporting(true);
    try {
      let logsToExport = callLogs;
      if (exportSelectedOnly && selectedLogIds.size > 0) {
        logsToExport = callLogs.filter((l: any) => selectedLogIds.has(l.id));
      } else {
        try {
          const allLogs = await utils.callyzer.exportCallLogs.fetch({
            roleCode: selectedRole === "ALL" ? undefined : selectedRole,
            managerId: selectedManager === "ALL" ? undefined : selectedManager,
            date: selectedDate,
            search: search.trim() || undefined,
          });
          if (allLogs && allLogs.length > 0) {
            logsToExport = allLogs;
          }
        } catch {
          // fallback to current logs
        }
      }

      if (!logsToExport.length) {
        alert("No call records found to export.");
        return;
      }

      const xml = generateExcelXml(logsToExport);
      downloadFile(xml, `SoftLab-Call-Report-${selectedDate}.xls`, "application/vnd.ms-excel;charset=utf-8;");
    } finally {
      setIsExporting(false);
    }
  };

  // Download CSV (.csv)
  const handleDownloadCSV = async (exportSelectedOnly = false) => {
    setIsExporting(true);
    try {
      let logsToExport = callLogs;
      if (exportSelectedOnly && selectedLogIds.size > 0) {
        logsToExport = callLogs.filter((l: any) => selectedLogIds.has(l.id));
      } else {
        try {
          const allLogs = await utils.callyzer.exportCallLogs.fetch({
            roleCode: selectedRole === "ALL" ? undefined : selectedRole,
            managerId: selectedManager === "ALL" ? undefined : selectedManager,
            date: selectedDate,
            search: search.trim() || undefined,
          });
          if (allLogs && allLogs.length > 0) {
            logsToExport = allLogs;
          }
        } catch {
          // fallback
        }
      }

      if (!logsToExport.length) {
        alert("No call records found to export.");
        return;
      }

      const csv = generateCsvContent(logsToExport);
      downloadFile("\uFEFF" + csv, `SoftLab-Call-Report-${selectedDate}.csv`, "text/csv;charset=utf-8;");
    } finally {
      setIsExporting(false);
    }
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
              onClick={() => handleDownloadExcel(false)}
              disabled={isExporting}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isExporting ? "Exporting..." : "Export Excel"}</span>
            </Button>

            <Button
              onClick={() => handleDownloadCSV(false)}
              disabled={isExporting}
              size="sm"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
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

              {activeTab === "logs" && (
                <>
                  <Button
                    onClick={() => handleDownloadExcel(false)}
                    disabled={isExporting}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-2.5 flex items-center gap-1.5 font-semibold shadow-xs"
                    title="Export complete calling and leads data to Microsoft Excel"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{isExporting ? "Exporting..." : "Excel (.xls)"}</span>
                  </Button>

                  <Button
                    onClick={() => handleDownloadCSV(false)}
                    disabled={isExporting}
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 px-2.5 flex items-center gap-1.5 font-semibold text-slate-700"
                    title="Export data as CSV file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </Button>

                  <Button
                    onClick={() => {
                      setNewCreatedAt(toLocalDatetimeInput(new Date()));
                      setShowCreateModal(true);
                    }}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-2.5 flex items-center gap-1.5 font-semibold shadow-xs"
                    title="Add a new lead call record manually"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Record</span>
                  </Button>
                </>
              )}
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
          {/* Bulk Selection Action Toolbar */}
          {selectedLogIds.size > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 p-2.5 px-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                <span className="text-xs font-bold text-indigo-950">
                  {selectedLogIds.size} record{selectedLogIds.size > 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleDownloadExcel(true)}
                  disabled={isExporting}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5 flex items-center gap-1 font-semibold shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Selected Excel</span>
                </Button>
                <Button
                  onClick={() => handleDownloadCSV(true)}
                  disabled={isExporting}
                  size="sm"
                  variant="outline"
                  className="bg-white text-slate-700 text-xs h-7 px-2.5 flex items-center gap-1 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </Button>
                <Button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  size="sm"
                  variant="destructive"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-7 px-2.5 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedLogIds.size})</span>
                </Button>
                <Button
                  onClick={() => setSelectedLogIds(new Set())}
                  size="sm"
                  variant="ghost"
                  className="text-slate-500 hover:text-slate-800 text-xs h-7 px-2"
                >
                  Cancel Selection
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[11px] font-bold text-slate-500">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={callLogs.length > 0 && callLogs.every((l: any) => selectedLogIds.has(l.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLogIds(new Set(callLogs.map((l: any) => l.id)));
                        } else {
                          setSelectedLogIds(new Set());
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      title="Select all visible records"
                    />
                  </th>
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
                    <td colSpan={10} className="p-8 text-center text-slate-400 font-semibold">
                      No call records logged for this filter.
                    </td>
                  </tr>
                ) : (
                  callLogs.map((log: any) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 transition ${
                        selectedLogIds.has(log.id) ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedLogIds.has(log.id)}
                          onChange={(e) => {
                            const next = new Set(selectedLogIds);
                            if (e.target.checked) {
                              next.add(log.id);
                            } else {
                              next.delete(log.id);
                            }
                            setSelectedLogIds(next);
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
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
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => openEditModal(log)}
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-slate-600 hover:text-indigo-600 hover:border-indigo-300"
                            title="Edit all fields of this record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            onClick={() => setDeletingCallLog(log)}
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                            title="Delete this call record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
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

      {/* COMPREHENSIVE FULL EDIT CALL LOG MODAL */}
      {editingCallLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-xl bg-white border-slate-200 shadow-2xl my-6">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                    <Edit2 className="w-4 h-4 text-indigo-600" />
                    Edit Call Record & Lead Details
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Modify caller assignment, client details, duration, outcome, and follow-up notes.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  ID: {editingCallLog.id.slice(-8)}
                </Badge>
              </div>
            </CardHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const totalSeconds = Number(editDurationMinutes || 0) * 60 + Number(editDurationSeconds || 0);
                updateLogMutation.mutate({
                  callLogId: editingCallLog.id,
                  contactName: editContactName.trim(),
                  contactPhone: editContactPhone.trim(),
                  userId: editUserId,
                  callType: editCallType,
                  callStatus: editCallStatus,
                  durationSeconds: totalSeconds,
                  disposition: editDisposition,
                  notes: editNotes,
                  nextFollowUpDate: editFollowUpDate ? new Date(editFollowUpDate) : null,
                  createdAt: editCreatedAt ? new Date(editCreatedAt) : undefined,
                });
              }}
            >
              <CardContent className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* 1. Staff Caller Assignment */}
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    Staff Caller / Assigned Telecaller
                  </label>
                  <select
                    value={editUserId}
                    onChange={(e) => setEditUserId(e.target.value)}
                    className="w-full h-8 text-xs mt-1 rounded-md border border-slate-300 px-2 bg-white"
                  >
                    {staffMembers.length > 0 ? (
                      staffMembers.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.roleCode} • {s.employeeId || "Staff"})
                        </option>
                      ))
                    ) : (
                      <option value={editingCallLog.userId}>
                        {editingCallLog.user?.firstName} {editingCallLog.user?.lastName} ({editingCallLog.roleCode})
                      </option>
                    )}
                  </select>
                </div>

                {/* 2. Contact / Client Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Contact / Client Name</label>
                    <Input
                      type="text"
                      required
                      value={editContactName}
                      onChange={(e) => setEditContactName(e.target.value)}
                      className="h-8 text-xs mt-1"
                      placeholder="e.g. Mayur Gaur"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Phone Number</label>
                    <Input
                      type="text"
                      required
                      value={editContactPhone}
                      onChange={(e) => setEditContactPhone(e.target.value)}
                      className="h-8 text-xs mt-1 font-mono"
                      placeholder="e.g. +91 9196596975"
                    />
                  </div>
                </div>

                {/* 3. Telephony Type & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Call Type</label>
                    <select
                      value={editCallType}
                      onChange={(e) => setEditCallType(e.target.value as any)}
                      className="w-full h-8 text-xs mt-1 rounded-md border border-slate-300 px-2 bg-white"
                    >
                      <option value="OUTGOING">OUTGOING</option>
                      <option value="INCOMING">INCOMING</option>
                      <option value="MISSED">MISSED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Call Status</label>
                    <select
                      value={editCallStatus}
                      onChange={(e) => setEditCallStatus(e.target.value as any)}
                      className="w-full h-8 text-xs mt-1 rounded-md border border-slate-300 px-2 bg-white"
                    >
                      <option value="CONNECTED">CONNECTED</option>
                      <option value="BUSY">BUSY</option>
                      <option value="NO_ANSWER">NO_ANSWER</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                  </div>
                </div>

                {/* 4. Talk-Time Duration */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      Talk-Time Duration
                    </label>
                    <span className="text-[11px] font-mono text-indigo-700 font-bold">
                      Total: {Math.floor(editDurationMinutes || 0)}m {editDurationSeconds || 0}s (
                      {Number(editDurationMinutes || 0) * 60 + Number(editDurationSeconds || 0)}s)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div>
                      <Input
                        type="number"
                        min={0}
                        max={600}
                        value={editDurationMinutes}
                        onChange={(e) => setEditDurationMinutes(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                        placeholder="Minutes"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Minutes</span>
                    </div>
                    <div>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={editDurationSeconds}
                        onChange={(e) => setEditDurationSeconds(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                        placeholder="Seconds"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Seconds</span>
                    </div>
                  </div>
                </div>

                {/* 5. Disposition & Next Follow-Up */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Call Disposition / Outcome</label>
                    <select
                      value={editDisposition}
                      onChange={(e) => setEditDisposition(e.target.value)}
                      className="w-full h-8 text-xs mt-1 rounded-md border border-slate-300 px-2 bg-white font-semibold"
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
                    <label className="text-xs font-bold text-slate-700">Next Follow-Up Date</label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Input
                        type="date"
                        value={editFollowUpDate}
                        onChange={(e) => setEditFollowUpDate(e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      {editFollowUpDate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditFollowUpDate("")}
                          className="h-8 px-2 text-[11px] text-slate-500 hover:text-slate-800"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. Call Discussion Notes & Remarks */}
                <div>
                  <label className="text-xs font-bold text-slate-700">Remarks & Discussion Notes</label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Candidate discussed Python course fees, requested evening batch syllabus..."
                    className="w-full text-xs mt-1 rounded-md border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 7. Call Timestamp */}
                <div>
                  <label className="text-xs font-bold text-slate-700">Call Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={editCreatedAt}
                    onChange={(e) => setEditCreatedAt(e.target.value)}
                    className="h-8 text-xs mt-1 w-full sm:w-64"
                  />
                </div>
              </CardContent>

              <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/70">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const toDelete = editingCallLog;
                    setEditingCallLog(null);
                    setDeletingCallLog(toDelete);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingCallLog(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateLogMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 shadow-sm"
                  >
                    {updateLogMutation.isPending ? "Saving..." : "Save All Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* SINGLE CALL LOG DELETE CONFIRMATION MODAL */}
      {deletingCallLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Confirm Record Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete this call record?
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <p>
                  <strong className="text-slate-800">Contact:</strong> {deletingCallLog.contactName} ({deletingCallLog.contactPhone})
                </p>
                <p>
                  <strong className="text-slate-800">Staff Caller:</strong> {deletingCallLog.user?.firstName} {deletingCallLog.user?.lastName} ({deletingCallLog.roleCode})
                </p>
                <p>
                  <strong className="text-slate-800">Disposition:</strong> {deletingCallLog.disposition} • Duration: {deletingCallLog.durationFormatted}
                </p>
                <p className="text-[11px] text-slate-500">
                  <strong className="text-slate-700">Logged on:</strong> {new Date(deletingCallLog.createdAt).toLocaleString()}
                </p>
              </div>
              <p className="text-[11px] text-rose-600 font-medium">
                ⚠️ This record will be removed from Callyzer reporting, lead history, and talk-time tallies.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDeletingCallLog(null)}
                  disabled={deleteLogMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={deleteLogMutation.isPending}
                  onClick={() => deleteLogMutation.mutate({ callLogId: deletingCallLog.id })}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                >
                  {deleteLogMutation.isPending ? "Deleting..." : "Yes, Delete Record"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Bulk Delete Call Records
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete{" "}
                <strong className="text-rose-600 font-bold">{selectedLogIds.size}</strong> selected call records?
              </p>
              <p className="text-[11px] text-slate-500">
                All selected logs will be removed immediately from Callyzer statistics and calling history.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={bulkDeleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={bulkDeleteMutation.isPending}
                  onClick={() => bulkDeleteMutation.mutate({ callLogIds: Array.from(selectedLogIds) })}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                >
                  {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${selectedLogIds.size} Records`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MANUAL CREATE CALL RECORD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-xl bg-white border-slate-200 shadow-2xl my-6">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Plus className="w-4 h-4 text-indigo-600" />
                Add New Call / Lead Activity Record
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Manually record a call conducted offline or log an external candidate discussion.
              </CardDescription>
            </CardHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const totalSeconds = Number(newDurationMinutes || 0) * 60 + Number(newDurationSeconds || 0);
                createLogMutation.mutate({
                  userId: newUserId || undefined,
                  contactName: newContactName.trim(),
                  contactPhone: newContactPhone.trim(),
                  callType: newCallType,
                  callStatus: newCallStatus,
                  durationSeconds: totalSeconds,
                  disposition: newDisposition,
                  notes: newNotes,
                  nextFollowUpDate: newFollowUpDate ? new Date(newFollowUpDate) : null,
                  createdAt: newCreatedAt ? new Date(newCreatedAt) : undefined,
                });
              }}
            >
              <CardContent className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* 1. Staff Caller Assignment */}
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    Staff Caller / Assigned Telecaller
                  </label>
                  <select
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    className="w-full h-8 text-xs mt-1 rounded-md border border-slate-300 px-2 bg-white"
                  >
                    <option value="">👤 Current Logged-in Staff</option>
                    {staffMembers.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.roleCode} • {s.employeeId || "Staff"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Contact / Candidate Name</label>
                    <Input
                      type="text"
                      required
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="h-8 text-xs mt-1"
                      placeholder="e.g. Mayur Gaur"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Phone Number</label>
                    <Input
                      type="text"
                      required
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      className="h-8 text-xs mt-1 font-mono"
                      placeholder="e.g. +91 9196596975"
                    />
                  </div>
                </div>

                {/* 3. Call Type & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Call Type</label>
                    <select
                      value={newCallType}
                      onChange={(e) => setNewCallType(e.target.value as any)}
                      className="w-full h-8 text-xs mt-1 rounded-md border border-slate-300 px-2 bg-white"
                    >
                      <option value="OUTGOING">OUTGOING</option>
                      <option value="INCOMING">INCOMING</option>
                      <option value="MISSED">MISSED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Call Status</label>
                    <select
                      value={newCallStatus}
                      onChange={(e) => setNewCallStatus(e.target.value as any)}
                      className="w-full h-8 text-xs mt-1 rounded-md border border-slate-300 px-2 bg-white"
                    >
                      <option value="CONNECTED">CONNECTED</option>
                      <option value="BUSY">BUSY</option>
                      <option value="NO_ANSWER">NO_ANSWER</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                  </div>
                </div>

                {/* 4. Duration */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      Talk-Time Duration
                    </label>
                    <span className="text-[11px] font-mono text-indigo-700 font-bold">
                      Total: {Math.floor(newDurationMinutes || 0)}m {newDurationSeconds || 0}s
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div>
                      <Input
                        type="number"
                        min={0}
                        max={600}
                        value={newDurationMinutes}
                        onChange={(e) => setNewDurationMinutes(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                        placeholder="Minutes"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Minutes</span>
                    </div>
                    <div>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={newDurationSeconds}
                        onChange={(e) => setNewDurationSeconds(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                        placeholder="Seconds"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Seconds</span>
                    </div>
                  </div>
                </div>

                {/* 5. Disposition & Follow-Up */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Call Disposition</label>
                    <select
                      value={newDisposition}
                      onChange={(e) => setNewDisposition(e.target.value)}
                      className="w-full h-8 text-xs mt-1 rounded-md border border-slate-300 px-2 bg-white font-semibold"
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
                    <label className="text-xs font-bold text-slate-700">Next Follow-Up Date</label>
                    <Input
                      type="date"
                      value={newFollowUpDate}
                      onChange={(e) => setNewFollowUpDate(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                {/* 6. Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700">Remarks & Discussion Notes</label>
                  <textarea
                    rows={3}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Brief description of the conversation..."
                    className="w-full text-xs mt-1 rounded-md border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 7. Call Timestamp */}
                <div>
                  <label className="text-xs font-bold text-slate-700">Call Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={newCreatedAt}
                    onChange={(e) => setNewCreatedAt(e.target.value)}
                    className="h-8 text-xs mt-1 w-full sm:w-64"
                  />
                </div>
              </CardContent>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50/70">
                <Button type="button" size="sm" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createLogMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 shadow-sm"
                >
                  {createLogMutation.isPending ? "Creating..." : "Create Record"}
                </Button>
              </div>
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
