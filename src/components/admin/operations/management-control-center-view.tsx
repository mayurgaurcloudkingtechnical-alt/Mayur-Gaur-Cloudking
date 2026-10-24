"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Radio,
  Video,
  Users,
  Award,
  Briefcase,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  PhoneCall,
  Youtube,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  ExternalLink,
  ChevronRight,
  Eye,
} from "lucide-react";
import { ParticipantRosterModal } from "./participant-roster-modal";
import { RecordEditModal, RecordEditTarget } from "./record-edit-modal";
import { ClassSessionStatus, AlertSeverity, AlertStatus } from "@prisma/client";

interface ManagementControlCenterViewProps {
  user: {
    id: string;
    email: string;
    roleCode: string;
    firstName: string;
    lastName: string;
  };
}

export function ManagementControlCenterView({ user }: ManagementControlCenterViewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedClassIdForRoster, setSelectedClassIdForRoster] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<RecordEditTarget | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filters for classes
  const [classStatusFilter, setClassStatusFilter] = useState<ClassSessionStatus | "">("");
  const [classSearch, setClassSearch] = useState("");

  // Filters for interviews
  const [interviewCategory, setInterviewCategory] = useState<"MOCK" | "RECRUITER" | "">("");
  const [interviewSearch, setInterviewSearch] = useState("");

  // Resolution modal state for alerts
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Real-time SSE Connection State
  const [isSseConnected, setIsSseConnected] = useState(false);
  const [liveStreamData, setLiveStreamData] = useState<any>(null);

  const utils = api.useUtils();

  // Primary live overview query (with 10-second polling fallback)
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    refetch: refetchOverview,
  } = api.management.getLiveOperationsOverview.useQuery(undefined, {
    refetchInterval: 10000,
  });

  // Class oversight query
  const { data: classroomData, isLoading: isClassroomLoading } =
    api.management.getLiveClassroomOversight.useQuery(
      {
        status: classStatusFilter || undefined,
        search: classSearch || undefined,
        limit: 25,
      },
      { enabled: activeTab === "classes" || activeTab === "overview" }
    );

  // Interviews oversight query
  const { data: interviewsData, isLoading: isInterviewsLoading } =
    api.management.getInterviewsOversight.useQuery(
      {
        category: (interviewCategory as any) || undefined,
        search: interviewSearch || undefined,
      },
      { enabled: activeTab === "interviews" }
    );

  // Communications oversight query
  const { data: commsData, isLoading: isCommsLoading } =
    api.management.getCommunicationsOversight.useQuery(
      {},
      { enabled: activeTab === "communications" }
    );

  // YouTube publishing oversight query
  const { data: ytData, isLoading: isYtLoading } =
    api.management.getYouTubePublishingOversight.useQuery(
      {},
      { enabled: activeTab === "youtube" }
    );

  // Activity timeline query
  const { data: timelineData, isLoading: isTimelineLoading } =
    api.management.getActivityTimeline.useQuery(
      { limit: 50 },
      { enabled: activeTab === "timeline" }
    );

  // Alerts query
  const { data: alertsData, isLoading: isAlertsLoading } = api.management.getAlerts.useQuery(
    {},
    { enabled: activeTab === "alerts" || activeTab === "overview" }
  );

  // Scan alerts mutation
  const triggerScanMutation = api.management.triggerAlertsScan.useMutation({
    onSuccess: (res) => {
      alert(`Operational scan complete. Discovered ${res.newAlertsCount} discrepancy alerts.`);
      utils.management.getAlerts.invalidate();
      utils.management.getLiveOperationsOverview.invalidate();
    },
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = api.management.acknowledgeAlert.useMutation({
    onSuccess: () => {
      utils.management.getAlerts.invalidate();
      utils.management.getLiveOperationsOverview.invalidate();
    },
  });

  // Resolve alert mutation
  const resolveAlertMutation = api.management.resolveAlert.useMutation({
    onSuccess: () => {
      setResolvingAlertId(null);
      setResolutionNotes("");
      utils.management.getAlerts.invalidate();
      utils.management.getLiveOperationsOverview.invalidate();
    },
  });

  // Export report mutation
  const exportMutation = api.management.generateOperationalReport.useMutation({
    onSuccess: (data) => {
      // Trigger CSV download
      if (!data.rows || !data.rows.length) {
        alert("No records found for the selected export scope.");
        return;
      }
      const headers = Object.keys(data.rows[0]);
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [
          headers.join(","),
          ...data.rows.map((row: any) =>
            headers.map((h) => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(",")
          ),
        ].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `SOFTLAB_OPERATIONS_${data.reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  });

  // Setup Server-Sent Events (SSE) stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/management/live-stream");

      eventSource.onopen = () => {
        setIsSseConnected(true);
      };

      eventSource.addEventListener("initial-snapshot", (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          setLiveStreamData(parsed);
        } catch {}
      });

      eventSource.addEventListener("live-update", (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          setLiveStreamData(parsed);
        } catch {}
      });

      eventSource.onerror = () => {
        setIsSseConnected(false);
      };
    } catch {
      setIsSseConnected(false);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const displayOverview = liveStreamData || overviewData;

  const handleOpenEdit = (target: RecordEditTarget) => {
    setEditTarget(target);
    setIsEditModalOpen(true);
  };

  const handleRefreshAll = () => {
    refetchOverview();
    utils.management.getLiveClassroomOversight.invalidate();
    utils.management.getInterviewsOversight.invalidate();
    utils.management.getAlerts.invalidate();
    utils.management.getActivityTimeline.invalidate();
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header & Operational Live Telemetry Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/70 text-indigo-400 border border-indigo-800/80">
            <Radio className="w-6 h-6 animate-pulse text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Central Operations & Control Center</h1>
              <Badge
                variant="outline"
                className={
                  isSseConnected
                    ? "border-emerald-600 bg-emerald-950/40 text-emerald-400 text-[11px]"
                    : "border-sky-600 bg-sky-950/40 text-sky-400 text-[11px]"
                }
              >
                {isSseConnected ? "LIVE STREAM ACTIVE (SSE)" : "POLLING ACTIVE (10s)"}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live operational monitoring, real-time telemetry, immutable audit trails, and management corrections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerScanMutation.mutate()}
            disabled={triggerScanMutation.isPending}
            className="border-amber-700/60 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 text-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            {triggerScanMutation.isPending ? "Scanning..." : "Scan Discrepancies"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900/90 border border-slate-800 p-1 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600 text-xs">
            <Activity className="w-3.5 h-3.5 mr-1.5" />
            Live Overview
          </TabsTrigger>
          <TabsTrigger value="classes" className="data-[state=active]:bg-indigo-600 text-xs">
            <Video className="w-3.5 h-3.5 mr-1.5" />
            Classes & Attendance ({displayOverview?.classes?.runningCount || 0} Live)
          </TabsTrigger>
          <TabsTrigger value="interviews" className="data-[state=active]:bg-indigo-600 text-xs">
            <Award className="w-3.5 h-3.5 mr-1.5" />
            Mock & Recruiter Interviews
          </TabsTrigger>
          <TabsTrigger value="communications" className="data-[state=active]:bg-indigo-600 text-xs">
            <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
            WhatsApp & Calls
          </TabsTrigger>
          <TabsTrigger value="youtube" className="data-[state=active]:bg-indigo-600 text-xs">
            <Youtube className="w-3.5 h-3.5 mr-1.5" />
            YouTube Pipeline ({displayOverview?.youtube?.queued || 0} Queued)
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-indigo-600 text-xs">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Activity Timeline & Audit
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-indigo-600 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            Alerts & Incidents ({displayOverview?.alerts?.openCount || 0})
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-indigo-600 text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Reports & Exports
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: LIVE OPERATIONS OVERVIEW */}
        {/* ========================================================================= */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key KPI Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/80 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Live Running Lectures
                </CardDescription>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-extrabold text-emerald-400">
                    {displayOverview?.classes?.runningCount || 0}
                  </div>
                  <Badge variant="outline" className="border-emerald-600 text-emerald-400 text-[10px]">
                    IN PROGRESS
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                {displayOverview?.classes?.activeTrainers || 0} faculty active •{" "}
                {displayOverview?.classes?.activeStudentParticipants || 0} joined students
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Today's Class Schedule
                </CardDescription>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-extrabold text-indigo-400">
                    {(displayOverview?.classes?.todayScheduled || 0) +
                      (displayOverview?.classes?.todayCompleted || 0) +
                      (displayOverview?.classes?.runningCount || 0)}
                  </div>
                  <Badge variant="outline" className="border-indigo-600 text-indigo-400 text-[10px]">
                    TODAY
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                {displayOverview?.classes?.todayCompleted || 0} completed •{" "}
                {displayOverview?.classes?.todayCancelled || 0} cancelled
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Placement Interviews Today
                </CardDescription>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-extrabold text-amber-400">
                    {(displayOverview?.interviews?.mockTotalToday || 0) +
                      (displayOverview?.interviews?.recruiterTotalToday || 0)}
                  </div>
                  <Badge variant="outline" className="border-amber-600 text-amber-400 text-[10px]">
                    INTERVIEWS
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                {displayOverview?.interviews?.mockTotalToday || 0} mocks •{" "}
                {displayOverview?.interviews?.recruiterTotalToday || 0} recruiter drives
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Open Operational Alerts
                </CardDescription>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-extrabold text-rose-400">
                    {displayOverview?.alerts?.openCount || 0}
                  </div>
                  {displayOverview?.alerts?.criticalCount > 0 ? (
                    <Badge className="bg-rose-950 border border-rose-700 text-rose-400 text-[10px]">
                      {displayOverview.alerts.criticalCount} CRITICAL
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                      NOMINAL
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                {displayOverview?.corrections?.last24hCount || 0} management corrections in 24h
              </CardContent>
            </Card>
          </div>

          {/* Currently Running Live Classes Section */}
          <Card className="bg-slate-900/80 border-slate-800 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <CardTitle className="text-base font-bold text-white">
                    Live Lectures in Session Right Now
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("classes")}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  View Full Schedule <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!displayOverview?.classes?.runningList?.length ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  No live class sessions are actively broadcasting at this moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {displayOverview.classes.runningList.map((cls: any) => (
                    <div
                      key={cls.id}
                      className="p-4 rounded-lg bg-slate-800/60 border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{cls.title}</span>
                          <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                            LIVE
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Cohort: <span className="text-slate-200">{cls.batchCode} ({cls.batchName})</span> • Course:{" "}
                          <span className="text-slate-200">{cls.courseTitle}</span> • Faculty:{" "}
                          <span className="text-indigo-300">{cls.trainerName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs">
                          <div className="text-slate-300 font-semibold">{cls.participantsCount} Students In Room</div>
                          <div className="text-slate-400 text-[11px]">Room Code: {cls.roomCode}</div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => setSelectedClassIdForRoster(cls.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8"
                        >
                          <Users className="w-3.5 h-3.5 mr-1" />
                          Roster
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: CLASSES & ATTENDANCE OVERSIGHT */}
        {/* ========================================================================= */}
        <TabsContent value="classes" className="space-y-4">
          <Card className="bg-slate-900/80 border-slate-800 text-white">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold">Class Sessions & Live Attendance Directory</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Inspect schedules, verify live participant ratios, view attendance durations, and apply corrections.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <Input
                      placeholder="Search title, cohort, course..."
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      className="pl-8 bg-slate-800 border-slate-700 text-xs text-white h-9"
                    />
                  </div>

                  <select
                    value={classStatusFilter}
                    onChange={(e) => setClassStatusFilter(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 text-white text-xs rounded-md px-3 py-2 h-9"
                  >
                    <option value="">All Statuses</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (LIVE)</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isClassroomLoading ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading classroom directory...</div>
              ) : !classroomData?.classes?.length ? (
                <div className="py-12 text-center text-slate-500 text-sm">No scheduled classes found.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-800/60">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-300">Class & Course</TableHead>
                      <TableHead className="text-slate-300">Batch Cohort</TableHead>
                      <TableHead className="text-slate-300">Faculty</TableHead>
                      <TableHead className="text-slate-300">Scheduled Time (IST)</TableHead>
                      <TableHead className="text-slate-300">Attendance Ratio</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-right text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classroomData.classes.map((cls) => (
                      <TableRow key={cls.id} className="border-slate-800/80 hover:bg-slate-800/30">
                        <TableCell>
                          <div className="font-semibold text-white text-sm">{cls.title}</div>
                          <div className="text-xs text-slate-400">{cls.courseTitle}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs text-indigo-300">{cls.batchCode}</div>
                          <div className="text-[11px] text-slate-400">{cls.batchName}</div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-200">{cls.trainerName}</TableCell>
                        <TableCell className="text-xs text-slate-300">
                          <div>{cls.scheduledAtIst}</div>
                          <div className="text-slate-500 text-[11px]">{cls.durationMin} mins</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-emerald-400">{cls.actualJoinedCount}</span>
                          <span className="text-slate-500"> / {cls.eligibleEnrollmentsCount} enrolled</span>
                        </TableCell>
                        <TableCell>
                          {cls.status === "IN_PROGRESS" && (
                            <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800">LIVE</Badge>
                          )}
                          {cls.status === "SCHEDULED" && (
                            <Badge className="bg-sky-950 text-sky-400 border border-sky-800">SCHEDULED</Badge>
                          )}
                          {cls.status === "COMPLETED" && (
                            <Badge className="bg-slate-800 text-slate-300 border border-slate-700">COMPLETED</Badge>
                          )}
                          {cls.status === "CANCELLED" && (
                            <Badge className="bg-rose-950 text-rose-400 border border-rose-800">CANCELLED</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedClassIdForRoster(cls.id)}
                              className="h-8 text-xs text-indigo-400 hover:text-indigo-300"
                            >
                              <Users className="w-3.5 h-3.5 mr-1" />
                              Roster
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleOpenEdit({
                                  recordType: "SCHEDULED_CLASS",
                                  recordId: cls.id,
                                  title: cls.title,
                                  currentValues: {
                                    title: cls.title,
                                    durationMin: cls.durationMin,
                                    status: cls.status,
                                    agendaNotes: cls.statusReason,
                                  },
                                })
                              }
                              className="h-8 text-xs text-slate-300 hover:text-white"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: MOCK & RECRUITER INTERVIEWS */}
        {/* ========================================================================= */}
        <TabsContent value="interviews" className="space-y-4">
          <Card className="bg-slate-900/80 border-slate-800 text-white">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold">Virtual Placement & Mock Interview Center</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Monthly student placement mock interviews and corporate campus drives with competency scorecards.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={interviewCategory}
                    onChange={(e) => setInterviewCategory(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 text-white text-xs rounded-md px-3 py-2 h-9"
                  >
                    <option value="">All Categories</option>
                    <option value="MOCK">Mock Interviews Only</option>
                    <option value="RECRUITER">Recruiter Drives Only</option>
                  </select>

                  <Input
                    placeholder="Search candidate, role..."
                    value={interviewSearch}
                    onChange={(e) => setInterviewSearch(e.target.value)}
                    className="w-48 bg-slate-800 border-slate-700 text-xs text-white h-9"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isInterviewsLoading ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading interviews directory...</div>
              ) : !interviewsData ? (
                <div className="py-12 text-center text-slate-500 text-sm">No interviews found.</div>
              ) : (
                <div className="space-y-4">
                  {/* If category is ALL, show combined sections */}
                  {interviewsData.category === "ALL" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Mocks summary */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-indigo-300">
                          Recent Mock Interviews ({interviewsData.totalMocks})
                        </h3>
                        {interviewsData.recentMocks?.map((m: any) => (
                          <div
                            key={m.id}
                            className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-medium text-white">{m.title}</div>
                              <div className="text-slate-400">
                                Student: <span className="text-slate-200">{m.studentName}</span> • Evaluator:{" "}
                                <span className="text-slate-200">{m.interviewerName}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              {m.overallScore !== null ? (
                                <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800">
                                  {m.overallScore}/100
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-slate-400 border-slate-700">
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Recruiter summary */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-amber-300">
                          Recruiter Drives ({interviewsData.totalRecruiters})
                        </h3>
                        {interviewsData.recentRecruiters?.map((r: any) => (
                          <div
                            key={r.id}
                            className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-medium text-white">{r.title}</div>
                              <div className="text-slate-400">
                                Candidate: <span className="text-slate-200">{r.studentName}</span> • Company:{" "}
                                <span className="text-slate-200">{r.companyName}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              {r.selectionDecision === "SELECTED" ? (
                                <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800">
                                  SELECTED
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-slate-400 border-slate-700">
                                  {r.stage}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filtered view table */}
                  {interviewsData.category !== "ALL" && interviewsData.items && (
                    <Table>
                      <TableHeader className="bg-slate-800/60">
                        <TableRow className="border-slate-800">
                          <TableHead className="text-slate-300">Interview Title</TableHead>
                          <TableHead className="text-slate-300">Candidate</TableHead>
                          <TableHead className="text-slate-300">Interviewer / Company</TableHead>
                          <TableHead className="text-slate-300">Scheduled (IST)</TableHead>
                          <TableHead className="text-slate-300">Score / Decision</TableHead>
                          <TableHead className="text-right text-slate-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {interviewsData.items.map((item: any) => (
                          <TableRow key={item.id} className="border-slate-800/80 hover:bg-slate-800/30">
                            <TableCell>
                              <div className="font-semibold text-white text-sm">{item.title}</div>
                              <div className="text-[11px] text-slate-400">Room: {item.roomCode}</div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-200">{item.studentName}</TableCell>
                            <TableCell className="text-xs text-slate-300">
                              {item.category === "MOCK" ? item.interviewerName : item.companyName}
                            </TableCell>
                            <TableCell className="text-xs text-slate-300">{item.scheduledAtIst}</TableCell>
                            <TableCell>
                              {item.category === "MOCK" && item.overallScore !== null && (
                                <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800">
                                  {item.overallScore} / 100
                                </Badge>
                              )}
                              {item.category === "RECRUITER" && item.selectionDecision && (
                                <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-800">
                                  {item.selectionDecision}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleOpenEdit({
                                    recordType: item.category === "MOCK" ? "MOCK_INTERVIEW" : "RECRUITER_INTERVIEW",
                                    recordId: item.id,
                                    title: item.title,
                                    currentValues: {
                                      status: item.status,
                                      selectionDecision: item.selectionDecision,
                                    },
                                  })
                                }
                                className="h-8 text-xs text-slate-300 hover:text-white"
                              >
                                <Edit3 className="w-3.5 h-3.5 mr-1" />
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: COMMUNICATIONS & CALLS */}
        {/* ========================================================================= */}
        <TabsContent value="communications" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* In-App Notifications */}
            <Card className="bg-slate-900/80 border-slate-800 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Dispatched Notifications Log</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Targeted batch announcements and classroom notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isCommsLoading ? (
                  <div className="py-8 text-center text-slate-400 text-xs">Loading notifications...</div>
                ) : !commsData?.notifications.items.length ? (
                  <div className="py-8 text-center text-slate-500 text-xs">No notifications recorded.</div>
                ) : (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {commsData.notifications.items.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/80 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{n.title}</span>
                          <span className="text-[10px] text-slate-400">{n.createdAtIst}</span>
                        </div>
                        <div className="text-slate-300 mt-1">{n.message}</div>
                        <div className="text-[11px] text-indigo-400 mt-1.5">
                          Recipient: {n.recipientName} ({n.recipientPhone || n.recipientEmail})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Staff Telecalling Activity */}
            <Card className="bg-slate-900/80 border-slate-800 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Staff Call Records (Callyzer & Telephony)</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Real provider-verified phone calls and student admissions discussions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isCommsLoading ? (
                  <div className="py-8 text-center text-slate-400 text-xs">Loading calls...</div>
                ) : !commsData?.calls.items.length ? (
                  <div className="py-8 text-center text-slate-500 text-xs">No phone calls logged today.</div>
                ) : (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {commsData.calls.items.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/80 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-white">
                            {c.contactName} ({c.contactPhone})
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            Staff: {c.staffName} • Status: {c.callStatus} • Disposition: {c.disposition}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="border-indigo-600 text-indigo-300 text-[11px]">
                            {Math.round(c.durationSeconds / 60)} mins
                          </Badge>
                          <div className="text-[10px] text-slate-500 mt-1">{c.startedAtIst}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 5: YOUTUBE PUBLISHING PIPELINE */}
        {/* ========================================================================= */}
        <TabsContent value="youtube" className="space-y-4">
          <Card className="bg-slate-900/80 border-slate-800 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">YouTube Automated Publishing Pipeline</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Queue status, privacy audit filters, metadata inspection, and retry execution.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isYtLoading ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading YouTube queue...</div>
              ) : !ytData?.items.length ? (
                <div className="py-12 text-center text-slate-500 text-sm">No items in the publication queue.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-800/60">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-300">Video Title & Course</TableHead>
                      <TableHead className="text-slate-300">Faculty</TableHead>
                      <TableHead className="text-slate-300">Privacy</TableHead>
                      <TableHead className="text-slate-300">Queue Status</TableHead>
                      <TableHead className="text-slate-300">Attempts</TableHead>
                      <TableHead className="text-right text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ytData.items.map((item) => (
                      <TableRow key={item.id} className="border-slate-800/80 hover:bg-slate-800/30">
                        <TableCell>
                          <div className="font-semibold text-white text-sm">{item.videoTitle}</div>
                          <div className="text-xs text-slate-400">
                            {item.courseTitle} • {item.lectureTopic}
                          </div>
                          {item.errorMessage && (
                            <div className="text-[11px] text-rose-400 mt-1">Error: {item.errorMessage}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-300">{item.trainerName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-600 text-slate-300 text-[10px]">
                            {item.targetPrivacy}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.status === "PUBLISHED" && (
                            <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800">
                              PUBLISHED
                            </Badge>
                          )}
                          {item.status === "QUEUED" && (
                            <Badge className="bg-sky-950 text-sky-400 border border-sky-800">QUEUED</Badge>
                          )}
                          {item.status === "FAILED" && (
                            <Badge className="bg-rose-950 text-rose-400 border border-rose-800">FAILED</Badge>
                          )}
                          {item.status === "BLOCKED_PRIVACY" && (
                            <Badge className="bg-amber-950 text-amber-400 border border-amber-800">BLOCKED</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">{item.attemptCount} tries</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.youTubeUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(item.youTubeUrl!, "_blank")}
                                className="h-8 text-xs border-slate-700 text-slate-300"
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                View
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleOpenEdit({
                                  recordType: "YOUTUBE_QUEUE",
                                  recordId: item.id,
                                  title: item.videoTitle || item.lectureTopic || "YouTube Video",
                                  currentValues: {
                                    videoTitle: item.videoTitle,
                                    videoDescription: item.videoDescription,
                                    targetPrivacy: item.targetPrivacy,
                                    status: item.status,
                                  },
                                })
                              }
                              className="h-8 text-xs text-slate-300 hover:text-white"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 6: ACTIVITY TIMELINE & AUDIT TRAIL */}
        {/* ========================================================================= */}
        <TabsContent value="timeline" className="space-y-4">
          <Card className="bg-slate-900/80 border-slate-800 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Chronological Platform Audit Trail</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Real immutable event stream of management corrections, session triggers, and security operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isTimelineLoading ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading activity stream...</div>
              ) : !timelineData?.length ? (
                <div className="py-12 text-center text-slate-500 text-sm">No activity events recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {timelineData.map((event) => (
                    <div
                      key={event.id}
                      className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/80 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              event.source === "CORRECTION"
                                ? "bg-amber-950 text-amber-300 border border-amber-700"
                                : "bg-indigo-950 text-indigo-300 border border-indigo-700"
                            }
                          >
                            {event.action}
                          </Badge>
                          <span className="font-semibold text-white">
                            {event.resourceType}: {event.resourceId}
                          </span>
                        </div>
                        <div className="text-slate-400">
                          Actor: <span className="text-slate-200">{event.actorName}</span> (
                          <span className="text-indigo-400">{event.actorRole}</span>)
                          {event.actorEmail && <span> • {event.actorEmail}</span>}
                        </div>
                      </div>

                      <div className="text-right text-slate-400 shrink-0">
                        <div className="font-medium text-slate-300">{event.createdAtIst}</div>
                        <div className="text-[10px] text-slate-500">UTC: {event.createdAt}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 7: OPERATIONAL ALERTS & INCIDENT RESOLUTION */}
        {/* ========================================================================= */}
        <TabsContent value="alerts" className="space-y-4">
          <Card className="bg-slate-900/80 border-slate-800 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Operational Incidents & Discrepancies</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Automated anomaly detection for overdue lecture starts, unmirrored attendance, and failed uploads.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => triggerScanMutation.mutate()}
                  disabled={triggerScanMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                >
                  {triggerScanMutation.isPending ? "Scanning..." : "Run Anomaly Detector"}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {isAlertsLoading ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading active alerts...</div>
              ) : !alertsData?.alerts?.length ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No active operational alerts. All services operating normally.
                </div>
              ) : (
                <div className="space-y-3">
                  {alertsData.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {alert.severity === "CRITICAL" && (
                            <Badge className="bg-rose-950 text-rose-400 border border-rose-800">CRITICAL</Badge>
                          )}
                          {alert.severity === "HIGH" && (
                            <Badge className="bg-amber-950 text-amber-400 border border-amber-800">HIGH</Badge>
                          )}
                          {alert.severity === "MEDIUM" && (
                            <Badge className="bg-sky-950 text-sky-400 border border-sky-800">MEDIUM</Badge>
                          )}
                          <span className="font-semibold text-white text-sm">{alert.title}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                            {alert.status}
                          </Badge>
                          <span className="text-xs text-slate-400">{alert.createdAtIst}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300">{alert.description}</p>

                      {alert.resolutionNotes && (
                        <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs text-emerald-300">
                          <span className="font-semibold">Resolution Notes:</span> {alert.resolutionNotes} (by{" "}
                          {alert.resolvedBy})
                        </div>
                      )}

                      {/* Action buttons */}
                      {alert.status !== "RESOLVED" && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/50">
                          {alert.status === "OPEN" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => acknowledgeAlertMutation.mutate({ alertId: alert.id })}
                              disabled={acknowledgeAlertMutation.isPending}
                              className="h-8 text-xs border-slate-700 text-slate-300"
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => setResolvingAlertId(alert.id)}
                            className="h-8 text-xs bg-emerald-700 hover:bg-emerald-600 text-white"
                          >
                            Resolve Incident
                          </Button>
                        </div>
                      )}

                      {/* Inline resolution form */}
                      {resolvingAlertId === alert.id && (
                        <div className="pt-3 border-t border-slate-700 space-y-2">
                          <Input
                            placeholder="Enter resolution notes and remedial actions taken..."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-xs text-white"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setResolvingAlertId(null)}
                              className="text-xs text-slate-400"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                resolveAlertMutation.mutate({
                                  alertId: alert.id,
                                  resolutionNotes,
                                })
                              }
                              disabled={resolveAlertMutation.isPending || resolutionNotes.length < 3}
                              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              {resolveAlertMutation.isPending ? "Submitting..." : "Confirm Resolution"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 8: REPORTS & EXPORTS */}
        {/* ========================================================================= */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="bg-slate-900/80 border-slate-800 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Management Operational Export Center</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Export verified CSV datasets for institutional leadership, executive reviews, and regulatory reporting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-white">Daily Operations Log</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      All scheduled and completed classes with assigned faculty, duration, and attendance counts.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => exportMutation.mutate({ reportType: "DAILY_OPERATIONS" })}
                    disabled={exportMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Export Classes CSV
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-white">Attendance Summary</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Individual student participation logs, duration seconds, percentages, and correction notes.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => exportMutation.mutate({ reportType: "ATTENDANCE_SUMMARY" })}
                    disabled={exportMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Export Attendance CSV
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-white">Placement Interviews</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Mock interview competency scorecards (40-point rubric) and recruiter hiring decisions.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => exportMutation.mutate({ reportType: "INTERVIEW_OUTCOMES" })}
                    disabled={exportMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Export Interviews CSV
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-white">Full Security Audit Trail</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Complete chronological history of user actions, administrative overrides, and system events.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => exportMutation.mutate({ reportType: "AUDIT_TRAIL" })}
                    disabled={exportMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Export Audit CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Participant Roster Modal */}
      <ParticipantRosterModal
        isOpen={!!selectedClassIdForRoster}
        onClose={() => setSelectedClassIdForRoster(null)}
        classId={selectedClassIdForRoster}
        onEditAttendance={(studentId, studentName, status, duration) => {
          handleOpenEdit({
            recordType: "LIVE_ATTENDANCE",
            recordId: selectedClassIdForRoster!, // or attendance ID
            title: `Attendance for ${studentName}`,
            currentValues: { status, totalDurationSeconds: duration },
          });
        }}
      />

      {/* Audited Record Edit Modal */}
      <RecordEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditTarget(null);
        }}
        target={editTarget}
        onSuccess={() => {
          handleRefreshAll();
        }}
      />
    </div>
  );
}
