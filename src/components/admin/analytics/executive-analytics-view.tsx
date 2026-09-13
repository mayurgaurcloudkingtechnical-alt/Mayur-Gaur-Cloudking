"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  TrendingUp,
  DollarSign,
  Users,
  GraduationCap,
  Briefcase,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Megaphone,
  Globe,
  Share2,
  PhoneCall,
  MessageSquare,
  Building,
  Target,
  ArrowRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { ReportExportType } from "@prisma/client";

export function ExecutiveAnalyticsView() {
  const [activeTab, setActiveTab] = useState<"overview" | "marketing">("overview");
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  const { data: overview, isLoading: isLoadingOverview } = api.analytics.getExecutiveOverview.useQuery();
  const { data: trends } = api.analytics.getRevenueTrend.useQuery({ monthsCount: 6 });
  const { data: exportHistory, refetch: refetchExports } = api.analytics.listExportHistory.useQuery();
  const { data: marketing, isLoading: isLoadingMarketing } = api.analytics.getMarketingAnalytics.useQuery();

  const exportMutation = api.analytics.exportAuditReport.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", data.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadingReport(null);
      refetchExports();
    },
    onError: (err) => {
      alert(`Export failed: ${err.message}`);
      setDownloadingReport(null);
    },
  });

  const handleExport = (reportType: ReportExportType) => {
    setDownloadingReport(reportType);
    exportMutation.mutate({ reportType });
  };

  const formatPaise = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  if (isLoadingOverview || isLoadingMarketing) {
    return (
      <div className="p-16 text-center text-slate-500">
        <TrendingUp className="w-10 h-10 animate-spin mx-auto mb-3 text-emerald-600" />
        <p className="text-base font-semibold text-slate-700">Loading Executive Institutional Intelligence...</p>
        <p className="text-xs text-slate-400 mt-1">SOFTLAB GLOBAL Business Intelligence & Marketing Analytics</p>
      </div>
    );
  }

  const fin = overview?.financials;
  const adm = overview?.admissions;
  const aca = overview?.academics;
  const plc = overview?.placements;
  const mkt = marketing;

  const getChannelIcon = (id: string) => {
    switch (id) {
      case "meta":
        return <Share2 className="w-5 h-5 text-blue-600" />;
      case "google":
        return <Globe className="w-5 h-5 text-red-500" />;
      case "justdial":
        return <Building className="w-5 h-5 text-orange-500" />;
      case "website":
        return <Globe className="w-5 h-5 text-emerald-600" />;
      case "whatsapp":
        return <MessageSquare className="w-5 h-5 text-emerald-500" />;
      case "referral":
        return <Users className="w-5 h-5 text-purple-600" />;
      case "walk_in":
        return <Target className="w-5 h-5 text-amber-600" />;
      default:
        return <Megaphone className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Executive Institutional Intelligence</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              SOFTLAB GLOBAL BI
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Real-time P&L, marketing attribution, conversion funnels, academic operations, and corporate placements.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "overview"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            Institutional Overview (P&L)
          </button>
          <button
            onClick={() => setActiveTab("marketing")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "marketing"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Megaphone className="w-4 h-4 text-blue-600" />
            Marketing & Channels
            {mkt && mkt.summary.totalLeads > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                {mkt.summary.totalLeads}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-8">
          {/* 1. Executive Financials Summary */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Institutional Financial Health (P&L)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">Tuition Revenue Realized</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{formatPaise(fin?.totalRevenuePaise ?? 0)}</p>
                <p className="text-xs text-emerald-600 mt-1">Verified offline & online collections</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">Total Payroll Disbursed</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{formatPaise(fin?.totalPayrollDisbursedPaise ?? 0)}</p>
                <p className="text-xs text-rose-600 mt-1">Institutional staff compensation</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">Net Operational Surplus</p>
                <p className={`text-2xl font-bold mt-1 font-mono ${
                  (fin?.netOperationalBalancePaise ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}>
                  {formatPaise(fin?.netOperationalBalancePaise ?? 0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Operating Cash Margin</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">Outstanding Student Dues</p>
                <p className="text-2xl font-bold text-amber-600 mt-1 font-mono">{formatPaise(fin?.totalOutstandingDuesPaise ?? 0)}</p>
                <p className="text-xs text-amber-700 mt-1">Active installments pending</p>
              </div>
            </div>
          </div>

          {/* 2. Admissions Funnel & Academic Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Admissions Funnel */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Admissions Conversion Pipeline
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {adm?.conversionRate ?? 0}% Conversion
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Total Enquiries Captured</span>
                  <span className="font-bold text-slate-900">{adm?.totalLeads ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Total Applications Submitted</span>
                  <span className="font-bold text-slate-900">{adm?.totalApplications ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Converted & Enrolled Students</span>
                  <span className="font-bold text-emerald-600">{adm?.admittedCount ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Academic & Operations Health */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  Academic Operations
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {aca?.averageAttendanceRate ?? 100}% Attendance
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Active Student Enrollments</span>
                  <span className="font-bold text-slate-900">{aca?.totalActiveEnrollments ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Batches in Session</span>
                  <span className="font-bold text-slate-900">{aca?.totalBatchesInSession ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Digital Certificates Issued</span>
                  <span className="font-bold text-slate-900">{aca?.totalCertificatesIssued ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Placement Success */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                Corporate Relations & Placement Outcomes
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {plc?.placementRate ?? 0}% Placement Rate
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <p className="text-xs text-slate-500">Eligible Candidates</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{plc?.totalEligibleStudents ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Students Placed</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">{plc?.totalStudentsPlaced ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Highest Package</p>
                <p className="text-xl font-bold text-blue-600 mt-0.5">{plc?.highestPackage}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Average Package</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{plc?.averagePackage}</p>
              </div>
            </div>
          </div>

          {/* 4. Audit Reporting & CSV Export Center */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                Institutional Audit Reports & CSV Export Center
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Generate and download sanitized, audit-ready CSV datasets for compliance and institutional reporting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <button
                onClick={() => handleExport(ReportExportType.FEE_DEFAULTERS)}
                disabled={downloadingReport !== null}
                className="p-4 rounded-lg border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">Fee Defaulters Ledger</span>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Overdue student installments, pending balances, and contact details.</p>
              </button>

              <button
                onClick={() => handleExport(ReportExportType.FINANCIAL_LEDGER)}
                disabled={downloadingReport !== null}
                className="p-4 rounded-lg border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">Financial Cashflow Report</span>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Realized tuition revenues vs staff payroll disbursements.</p>
              </button>

              <button
                onClick={() => handleExport(ReportExportType.PLACEMENT_RECORD)}
                disabled={downloadingReport !== null}
                className="p-4 rounded-lg border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">Placement Records</span>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Placed candidate lists, corporate recruiters, and offered compensation.</p>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* =======================================================
           MARKETING & CHANNEL ATTRIBUTION TAB
           ======================================================= */
        <div className="space-y-8">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Total Inbound Leads</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{mkt?.summary.totalLeads ?? 0}</p>
              <p className="text-xs text-blue-600 mt-1">Across all 8 channels</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Contacted & Qualified</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{mkt?.summary.totalContacted ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">Under active counselling</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Applications Filed</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{mkt?.summary.totalApplications ?? 0}</p>
              <p className="text-xs text-indigo-700 mt-1">Verified prospects</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Admitted / Enrolled</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{mkt?.summary.totalAdmissions ?? 0}</p>
              <p className="text-xs text-emerald-700 mt-1">
                {mkt?.summary.overallConversionRate ?? 0}% overall conversion
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Attributed Revenue</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {formatPaise(mkt?.summary.totalMarketingRevenuePaise ?? 0)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">Successful admissions fee</p>
            </div>
          </div>

          {/* 1. Marketing Channels & Attribution Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-emerald-600" />
                  Marketing Channel Attribution & Acquisition Breakdown
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time database counts per source channel with live external API integration adapters.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mkt?.channels.map((ch) => (
                <div
                  key={ch.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          {getChannelIcon(ch.id)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 leading-snug">{ch.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">{ch.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Integration Status Badge */}
                    <div className="pt-1">
                      {ch.integration.status === "CONNECTED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Live Synced
                        </span>
                      ) : ch.integration.status === "NOT_CONNECTED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Integration not connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Globe className="w-3 h-3 text-blue-600" />
                          Native Capture
                        </span>
                      )}
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">{ch.integration.message}</p>
                    </div>
                  </div>

                  {/* Channel Metrics */}
                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Leads Captured</span>
                      <span className="font-bold text-slate-900">{ch.leadsCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Applications</span>
                      <span className="font-bold text-indigo-600">{ch.applicationsCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Admitted Students</span>
                      <span className="font-bold text-emerald-600">{ch.admissionsCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Conversion Rate</span>
                      <span className="font-bold text-slate-900">{ch.conversionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-100">
                      <span className="text-slate-500 font-medium">Realized Revenue</span>
                      <span className="font-bold text-slate-900 font-mono">{formatPaise(ch.revenuePaise)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. End-to-End Conversion Funnel Stages */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Institutional Conversion Funnel Stages
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lead → Contacted → Follow-up → Interested → Application → Admission → Converted → Lost
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {mkt?.summary.overallConversionRate ?? 0}% Net Conversion
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
              {mkt?.funnelStages.map((f) => (
                <div key={f.stage} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center relative">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {f.stage}
                  </div>
                  <div className="text-xl font-bold text-slate-900">{f.count}</div>
                  <div className="text-xs font-semibold text-blue-600 mt-1">{f.percentage}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        f.stage === "Lost"
                          ? "bg-rose-500"
                          : f.stage === "Converted" || f.stage === "Admission"
                          ? "bg-emerald-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, f.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Counselor & Course Attribution Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Counselor Performance */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Counselor & Telecaller Velocity
                </h3>
                <span className="text-xs text-slate-500 font-medium">Ranked by volume</span>
              </div>

              {mkt?.counselors && mkt.counselors.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-400 border-b pb-2">
                        <th className="pb-2 font-semibold">Staff Member</th>
                        <th className="pb-2 font-semibold text-center">Assigned</th>
                        <th className="pb-2 font-semibold text-center">Admitted</th>
                        <th className="pb-2 font-semibold text-center">Rate</th>
                        <th className="pb-2 font-semibold text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mkt.counselors.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5">
                            <p className="font-semibold text-slate-900">{c.name}</p>
                            <span className="text-[10px] text-slate-400">{c.role}</span>
                          </td>
                          <td className="py-2.5 text-center font-bold text-slate-700">{c.assignedLeads}</td>
                          <td className="py-2.5 text-center font-bold text-emerald-600">{c.admittedCount}</td>
                          <td className="py-2.5 text-center font-semibold text-blue-600">{c.conversionRate}%</td>
                          <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                            {formatPaise(c.revenuePaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No counselor activity records logged yet.</p>
              )}
            </div>

            {/* Course Performance */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  Top Course Conversion & Revenue
                </h3>
                <span className="text-xs text-slate-500 font-medium">14 Core Programs</span>
              </div>

              {mkt?.courses && mkt.courses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-400 border-b pb-2">
                        <th className="pb-2 font-semibold">Course Title</th>
                        <th className="pb-2 font-semibold text-center">Leads</th>
                        <th className="pb-2 font-semibold text-center">Admitted</th>
                        <th className="pb-2 font-semibold text-center">Rate</th>
                        <th className="pb-2 font-semibold text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mkt.courses.slice(0, 7).map((cr) => (
                        <tr key={cr.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-medium text-slate-900 max-w-[200px] truncate" title={cr.title}>
                            {cr.title}
                          </td>
                          <td className="py-2.5 text-center font-bold text-slate-700">{cr.leadsCount}</td>
                          <td className="py-2.5 text-center font-bold text-emerald-600">{cr.admissionsCount}</td>
                          <td className="py-2.5 text-center font-semibold text-blue-600">{cr.conversionRate}%</td>
                          <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                            {formatPaise(cr.revenuePaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No course conversion metrics available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
