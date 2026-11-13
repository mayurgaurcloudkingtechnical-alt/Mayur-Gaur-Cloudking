"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import { DeviceManagementDashboard } from "./device-management-dashboard";
import { EmployeeAccessDashboard } from "./employee-access-dashboard";
import { PortalKpiRibbon } from "./portal/portal-kpi-ribbon";
import { PortalAnalyticsTab } from "./portal/portal-analytics-tab";
import { PortalPresenceTab } from "./portal/portal-presence-tab";
import { PortalReportsTab } from "./portal/portal-reports-tab";
import { PortalTenantTab } from "./portal/portal-tenant-tab";
import { PortalModals } from "./portal/portal-modals";
import { PortalHeader, PortalTabType } from "./portal/portal-header";

export function SlgCallIntelligencePortal() {
  const [activeTab, setActiveTab] = useState<PortalTabType>("analytics");
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);
  const [isSubmitReportModalOpen, setIsSubmitReportModalOpen] = useState(false);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Forms
  const [callForm, setCallForm] = useState({
    contactName: "",
    customerPhone: "",
    callType: "OUTGOING" as "INCOMING" | "OUTGOING",
    callStatus: "CONNECTED" as "CONNECTED" | "MISSED" | "REJECTED" | "UNANSWERED",
    talkTimeSeconds: 60,
    disposition: "INTERESTED",
    notes: "",
  });

  const [reportForm, setReportForm] = useState({
    workSummary: "",
    achievements: "",
    impediments: "",
    tomorrowActionPlan: "",
  });

  // tRPC Queries
  const tenantContextQuery = api.slgCallIntelligence.resolveTenantContext.useQuery();
  const analyticsQuery = api.slgCallIntelligence.getCallAnalytics.useQuery({
    search: search.trim() || undefined,
    departmentId: selectedDepartment === "ALL" ? undefined : selectedDepartment,
  });
  const presenceQuery = api.slgCallIntelligence.getLiveFleetPresence.useQuery();
  const dailyReportsQuery = api.slgCallIntelligence.listDailyReports.useQuery({
    date: new Date(selectedDate),
  });
  const prefillQuery = api.slgCallIntelligence.getPrefilledDailyReport.useQuery();

  // Mutations
  const logCallMutation = api.slgCallIntelligence.logManualCall.useMutation({
    onSuccess: () => {
      setIsLogCallModalOpen(false);
      analyticsQuery.refetch();
      presenceQuery.refetch();
      setCallForm({
        contactName: "",
        customerPhone: "",
        callType: "OUTGOING",
        callStatus: "CONNECTED",
        talkTimeSeconds: 60,
        disposition: "INTERESTED",
        notes: "",
      });
    },
  });

  const getPlaybackUrlMutation = api.slgCallIntelligence.getRecordingPlaybackUrl.useMutation({
    onSuccess: (data: any) => {
      setPlayingAudioUrl(data.playbackUrl);
    },
  });

  const submitReportMutation = api.slgCallIntelligence.submitDailyReport.useMutation({
    onSuccess: () => {
      setIsSubmitReportModalOpen(false);
      dailyReportsQuery.refetch();
      setReportForm({
        workSummary: "",
        achievements: "",
        impediments: "",
        tomorrowActionPlan: "",
      });
    },
  });

  const reviewReportMutation = api.slgCallIntelligence.reviewDailyReport.useMutation({
    onSuccess: () => {
      dailyReportsQuery.refetch();
    },
  });

  const exportDailyReportsMutation = api.slgCallIntelligence.exportDailyReportsCsv.useMutation();

  const handlePlayRecording = (recordingId: string) => {
    getPlaybackUrlMutation.mutate({ recordingId });
  };

  const handleReviewAction = (
    reportId: string,
    decision: "APPROVED" | "REVISION_REQUESTED" | "REJECTED"
  ) => {
    const feedback =
      window.prompt(`Optional feedback for ${decision.toLowerCase()}:`) || undefined;
    reviewReportMutation.mutate({ reportId, decision, feedback });
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await exportDailyReportsMutation.mutateAsync({
        date: new Date(selectedDate),
      });
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to export daily reports CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const tenant = tenantContextQuery.data?.tenant;
  const quota = tenantContextQuery.data?.quota;
  const summary: any =
    (analyticsQuery.data as any)?.kpis || (analyticsQuery.data as any)?.summary;
  const logs: any[] =
    (analyticsQuery.data as any)?.recentCalls || (analyticsQuery.data as any)?.logs || [];
  const fleet = presenceQuery.data || [];
  const reports = dailyReportsQuery.data || [];
  const prefilled = prefillQuery.data;

  return (
    <div className="space-y-6">
      {/* Top Organization & Nav Tabs */}
      <PortalHeader
        tenant={tenant}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isFetching={analyticsQuery.isFetching}
        onRefresh={() => {
          analyticsQuery.refetch();
          presenceQuery.refetch();
          dailyReportsQuery.refetch();
        }}
        onOpenLogCall={() => setIsLogCallModalOpen(true)}
        onOpenSubmitReport={() => setIsSubmitReportModalOpen(true)}
        fleetCount={fleet.length}
        reportsCount={reports.length}
      />

      {/* Primary KPI Ribbon */}
      <PortalKpiRibbon summary={summary} reportsCount={reports.length} />

      {/* TAB 1: CALL ANALYTICS & LOGS */}
      {activeTab === "analytics" && (
        <PortalAnalyticsTab
          search={search}
          setSearch={setSearch}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          tenant={tenant}
          logs={logs}
          onPlayRecording={handlePlayRecording}
        />
      )}

      {/* TAB 2: LIVE FLEET PRESENCE */}
      {activeTab === "presence" && <PortalPresenceTab fleet={fleet} />}

      {/* TAB 3: VERIFIED DAILY REPORTS */}
      {activeTab === "reports" && (
        <PortalReportsTab
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isExporting={isExporting}
          onExport={handleExport}
          reports={reports}
          onReviewAction={handleReviewAction}
        />
      )}

      {/* TAB 4: TENANT SAAS QUOTAS */}
      {activeTab === "tenant" && <PortalTenantTab tenant={tenant} quota={quota} />}

      {/* TAB 5: DEVICE MANAGEMENT */}
      {activeTab === "devices" && <DeviceManagementDashboard />}

      {/* TAB 6: STAFF ACCESS & HIERARCHY */}
      {activeTab === "employees" && <EmployeeAccessDashboard />}

      {/* MODALS */}
      <PortalModals
        isLogCallModalOpen={isLogCallModalOpen}
        setIsLogCallModalOpen={setIsLogCallModalOpen}
        callForm={callForm}
        setCallForm={setCallForm}
        onLogCallSubmit={() => logCallMutation.mutate(callForm)}
        isLogCallPending={logCallMutation.isPending}
        isSubmitReportModalOpen={isSubmitReportModalOpen}
        setIsSubmitReportModalOpen={setIsSubmitReportModalOpen}
        reportForm={reportForm}
        setReportForm={setReportForm}
        prefilled={prefilled}
        onSubmitReport={() =>
          submitReportMutation.mutate({
            workSummary: reportForm.workSummary,
            achievements: reportForm.achievements || undefined,
            impediments: reportForm.impediments || undefined,
            tomorrowActionPlan: reportForm.tomorrowActionPlan || undefined,
            items: [],
          })
        }
        isSubmitReportPending={submitReportMutation.isPending}
        playingAudioUrl={playingAudioUrl}
        setPlayingAudioUrl={setPlayingAudioUrl}
      />
    </div>
  );
}
