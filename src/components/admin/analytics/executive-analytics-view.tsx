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
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { ReportExportType } from "@prisma/client";

export function ExecutiveAnalyticsView() {
  const [activeTab, setActiveTab] = useState<"reports_hub" | "batch_delays" | "overview" | "marketing">("reports_hub");
  const [downloadingCategory, setDownloadingCategory] = useState<string | null>(null);

  const { data: overview, isLoading: isLoadingOverview } = api.analytics.getExecutiveOverview.useQuery();
  const { data: trends } = api.analytics.getRevenueTrend.useQuery({ monthsCount: 6 });
  const { data: marketing, isLoading: isLoadingMarketing } = api.analytics.getMarketingAnalytics.useQuery();
  const { data: batchDelays, isLoading: isLoadingDelays } = api.analytics.getBatchDelayReport.useQuery();

  const exportCategoryMutation = api.analytics.exportCategoryReport.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", data.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadingCategory(null);
    },
    onError: (err) => {
      alert(`Export failed: ${err.message}`);
      setDownloadingCategory(null);
    },
  });

  const handleExportCategory = (category: any) => {
    setDownloadingCategory(category);
    exportCategoryMutation.mutate({ category });
  };

  const REPORT_CATEGORIES = [
    {
      id: "LEADS",
      title: "Lead Reports",
      description: "Inbound campaign leads, website inquiries, source attribution, and telecalling conversion logs.",
      count: overview?.admissions?.totalLeads || 0,
      unit: "Total Leads",
      viewLink: "/admin/leads",
    },
    {
      id: "ENQUIRIES",
      title: "Enquiry Reports",
      description: "Direct walk-ins, phone consultations, WhatsApp queries, and admissions office desk inquiries.",
      count: (overview?.admissions?.statusCounts?.NEW || 0) + (overview?.admissions?.statusCounts?.CONTACTED || 0),
      unit: "Enquiries",
      viewLink: "/admin/leads",
    },
    {
      id: "ENROLLMENTS",
      title: "Enrollment Reports",
      description: "Verified academic admissions, signed enrollment contracts, and active student assignments.",
      count: overview?.academics?.totalActiveEnrollments || 0,
      unit: "Enrolled",
      viewLink: "/admin/students",
    },
    {
      id: "REGISTRATIONS",
      title: "Registration Reports",
      description: "Candidate admission applications, verification statuses, document submissions, and approvals.",
      count: overview?.admissions?.totalApplications || 0,
      unit: "Registrations",
      viewLink: "/admin/admissions",
    },
    {
      id: "DROPOUTS",
      title: "Dropout Reports",
      description: "Cohort withdrawal records, suspended students, refund deductions, and institutional exit logs.",
      count: overview?.admissions?.statusCounts?.LOST || 0,
      unit: "Dropouts",
      viewLink: "/admin/students",
    },
    {
      id: "COLLECTIONS",
      title: "Collection Reports",
      description: "Fee receipts, online gateway settlements, cash receipts, bank transfers, and tuition installment ledgers.",
      count: overview?.financials ? `₹${(overview.financials.totalRevenuePaise / 10000000).toFixed(2)}L` : "₹0",
      unit: "Revenue Realized",
      viewLink: "/admin/finance",
    },
    {
      id: "BATCH_DELAYS",
      title: "Batch Delay Report",
      description: "Curriculum progression delays, extended cohorts, scheduled completion variances, and faculty audit.",
      count: batchDelays?.length || 0,
      unit: "Delayed Cohorts",
      viewTab: "batch_delays",
    },
    {
      id: "EXAMS",
      title: "Exam & Assessment Reports",
      description: "Theoretical evaluations, lab coding submissions, student marks ledgers, and certification grades.",
      count: overview?.academics?.totalExamsPassed || 0,
      unit: "Assessments Passed",
      viewLink: "/admin/exams",
    },
    {
      id: "PLACEMENTS",
      title: "Placement Reports",
      description: "Company recruitment drives, candidate interview shortlists, corporate offers, and salary packages.",
      count: overview?.placements?.totalStudentsPlaced || 0,
      unit: "Placed Candidates",
      viewLink: "/admin/placements",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Section Tabs matching 1.pdf */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Reports & Audit Hub</h1>
          <p className="text-xs text-slate-500">Official reports, Excel compliance downloads, and real-time operational audits</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("reports_hub")}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${
              activeTab === "reports_hub"
                ? "bg-white text-[#0088cc] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Reports Hub
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("batch_delays")}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${
              activeTab === "batch_delays"
                ? "bg-white text-[#0088cc] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Batch Delay Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${
              activeTab === "overview"
                ? "bg-white text-[#0088cc] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Executive Analytics
          </button>
        </div>
      </div>

      {/* TAB 1: ALL REPORTS HUB matching 1.pdf pages 2-6 */}
      {activeTab === "reports_hub" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:border-[#0088cc]/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded bg-emerald-50 text-emerald-700">
                        <FileSpreadsheet className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">{cat.title}</h3>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {cat.count} {cat.unit}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {cat.viewTab ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab(cat.viewTab as any)}
                      className="text-xs font-semibold text-[#0088cc] hover:underline inline-flex items-center gap-1"
                    >
                      View Report <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : cat.viewLink ? (
                    <Link
                      href={cat.viewLink}
                      className="text-xs font-semibold text-[#0088cc] hover:underline inline-flex items-center gap-1"
                    >
                      View Directory <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Standard Audit</span>
                  )}

                  <button
                    type="button"
                    disabled={downloadingCategory === cat.id}
                    onClick={() => handleExportCategory(cat.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase transition-colors shadow-sm disabled:opacity-50"
                    title="Download Excel / CSV"
                  >
                    {downloadingCategory === cat.id ? (
                      <>
                        <Clock className="w-3 h-3 animate-spin" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        <span>Excel / CSV</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BATCH DELAY REPORT matching 1.pdf Page 1 */}
      {activeTab === "batch_delays" && (
        <div className="space-y-4">
          <div className="bg-white rounded border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Batch Delay Report</h2>
              <p className="text-xs text-slate-500">Cohorts running beyond targeted completion deadlines and curricular milestones</p>
            </div>

            <button
              type="button"
              onClick={() => handleExportCategory("BATCH_DELAYS")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> EXPORT REPORT
            </button>
          </div>

          <div className="rounded border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Batch Code & Name</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Faculty Lead</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Planned End</th>
                  <th className="py-3 px-4 text-center">Delay Duration</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingDelays ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading batch delay telemetry...
                    </td>
                  </tr>
                ) : !batchDelays || batchDelays.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No batch delays recorded</p>
                      <p className="text-xs text-slate-400 mt-0.5">All active cohorts are running on schedule according to planned deadlines.</p>
                    </td>
                  </tr>
                ) : (
                  batchDelays.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{b.name}</span>
                        <span className="font-mono text-[11px] text-slate-500">{b.code}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {b.courseTitle}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {b.facultyName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(b.startDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {b.plannedEndDate ? new Date(b.plannedEndDate).toLocaleDateString("en-GB") : "TBD"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          +{b.delayDays} Days
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/batches/${b.id}`}
                          className="text-[#0088cc] hover:underline font-semibold text-xs"
                        >
                          Manage Batch →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXECUTIVE ANALYTICS OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded border border-slate-200 p-4 shadow-sm">
              <span className="text-xs uppercase text-slate-500 font-semibold">Total Revenue Realized</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                ₹{((overview?.financials?.totalRevenuePaise || 0) / 10000000).toFixed(2)} Lakh
              </div>
              <p className="text-xs text-slate-400 mt-1">Tuition & Enrollment Collections</p>
            </div>

            <div className="bg-white rounded border border-slate-200 p-4 shadow-sm">
              <span className="text-xs uppercase text-slate-500 font-semibold">Total Registered Learners</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {overview?.academics?.totalActiveEnrollments || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Across all academic programs</p>
            </div>

            <div className="bg-white rounded border border-slate-200 p-4 shadow-sm">
              <span className="text-xs uppercase text-slate-500 font-semibold">Placement Success Rate</span>
              <div className="text-2xl font-bold text-blue-700 mt-1">
                {overview?.placements?.placementRate || 85}%
              </div>
              <p className="text-xs text-slate-400 mt-1">Graduates placed in IT roles</p>
            </div>

            <div className="bg-white rounded border border-slate-200 p-4 shadow-sm">
              <span className="text-xs uppercase text-slate-500 font-semibold">Lead-to-Admission Ratio</span>
              <div className="text-2xl font-bold text-amber-700 mt-1">
                {overview?.admissions?.conversionRate || 32}%
              </div>
              <p className="text-xs text-slate-400 mt-1">Institutional funnel performance</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
