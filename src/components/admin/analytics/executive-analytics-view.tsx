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
} from "lucide-react";
import { ReportExportType } from "@prisma/client";

export function ExecutiveAnalyticsView() {
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  const { data: overview, isLoading } = api.analytics.getExecutiveOverview.useQuery();
  const { data: trends } = api.analytics.getRevenueTrend.useQuery({ monthsCount: 6 });
  const { data: exportHistory, refetch: refetchExports } = api.analytics.listExportHistory.useQuery();

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

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <TrendingUp className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
        Loading Executive Institutional Intelligence...
      </div>
    );
  }

  const fin = overview?.financials;
  const adm = overview?.admissions;
  const aca = overview?.academics;
  const plc = overview?.placements;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Institutional Intelligence</h1>
          <p className="text-sm text-slate-600">
            Real-time P&L, admissions conversion funnel, academic operations, and corporate placement health.
          </p>
        </div>
      </div>

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
              Admissions Conversion Funnel
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
  );
}
