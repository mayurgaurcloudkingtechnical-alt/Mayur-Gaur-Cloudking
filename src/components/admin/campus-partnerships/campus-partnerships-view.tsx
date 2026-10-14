"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Building2,
  GraduationCap,
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Filter,
  Eye,
  PlusCircle,
  UploadCloud,
  FileText,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  BarChart3,
  Bell,
  Sliders,
  Award,
  ChevronRight,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import { InstitutionType, InstitutionStatus } from "@prisma/client";

type TabKey =
  | "dashboard"
  | "colleges"
  | "approvals"
  | "accounts"
  | "students"
  | "bulkImport"
  | "courses"
  | "drives"
  | "jobfairs"
  | "recruiters"
  | "eligibility"
  | "interviews"
  | "results"
  | "payments"
  | "reports"
  | "notifications"
  | "audit";

export function CampusPartnershipsView() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Dialog states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedInstId, setSelectedInstId] = useState<string | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<"APPROVED" | "REJECTED" | "CORRECTION_REQUESTED">("APPROVED");
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [provisionalPassword, setProvisionalPassword] = useState("CampusPartner@2026");

  const [showNewFairModal, setShowNewFairModal] = useState(false);
  const [fairTitle, setFairTitle] = useState("");
  const [fairTheme, setFairTheme] = useState("");
  const [fairVenue, setFairVenue] = useState("SoftLab Global Mega Campus, Prayagraj");
  const [fairStartDate, setFairStartDate] = useState("2026-11-15T09:00");
  const [fairEndDate, setFairEndDate] = useState("2026-11-16T18:00");

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideNominationId, setOverrideNominationId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [paymentDecision, setPaymentDecision] = useState<"VERIFY" | "REJECT" | "WAIVE">("VERIFY");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Bulk import state
  const [importCsvText, setImportCsvText] = useState("");
  const [importFileName, setImportFileName] = useState("students_batch_2026.csv");

  // Queries
  const { data: centralMetrics, refetch: refetchMetrics } = api.institution.getCentralCampusMetrics.useQuery();
  const { data: institutionsData, refetch: refetchInstitutions } = api.institution.listInstitutions.useQuery({
    search: searchTerm,
    status: statusFilter === "ALL" ? undefined : (statusFilter as InstitutionStatus),
  });
  const { data: studentsData, refetch: refetchStudents } = api.institution.listStudents.useQuery({
    search: searchTerm,
  });
  const { data: jobFairsData, refetch: refetchJobFairs } = api.institution.listJobFairs.useQuery();
  const { data: templateData } = api.institution.getImportTemplate.useQuery();
  const { data: placementDrives } = api.placement.listAdminDrives.useQuery();

  // Mutations
  const reviewMutation = api.institution.reviewApproval.useMutation({
    onSuccess: () => {
      setShowApproveModal(false);
      setApprovalRemarks("");
      refetchInstitutions();
      refetchMetrics();
    },
  });

  const createFairMutation = api.institution.createJobFair.useMutation({
    onSuccess: () => {
      setShowNewFairModal(false);
      setFairTitle("");
      refetchJobFairs();
      refetchMetrics();
    },
  });

  const overrideMutation = api.institution.overrideEligibility.useMutation({
    onSuccess: () => {
      setShowOverrideModal(false);
      setOverrideReason("");
      refetchStudents();
    },
  });

  const verifyPaymentMutation = api.institution.verifyStudentPayment.useMutation({
    onSuccess: () => {
      setShowPaymentModal(false);
      setPaymentNotes("");
      refetchStudents();
      refetchMetrics();
    },
  });

  const bulkImportMutation = api.institution.bulkImportStudents.useMutation({
    onSuccess: (res) => {
      alert(`Import completed! Created: ${res.summary.created}, Duplicates: ${res.summary.duplicates}, Invalid: ${res.summary.invalid}`);
      setImportCsvText("");
      refetchStudents();
      refetchMetrics();
    },
    onError: (err) => {
      alert(`Import failed: ${err.message}`);
    },
  });

  const handleDownloadTemplate = () => {
    if (!templateData?.templateCsv) return;
    const blob = new Blob([templateData.templateCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", templateData.fileName || "template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs: Array<{ id: TabKey; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "colleges", label: "Colleges & Universities", icon: <Building2 className="h-4 w-4" />, badge: centralMetrics?.totalInstitutions },
    { id: "approvals", label: "Approvals Desk", icon: <ShieldCheck className="h-4 w-4" />, badge: centralMetrics?.pendingApprovals },
    { id: "accounts", label: "User Accounts", icon: <Users className="h-4 w-4" /> },
    { id: "students", label: "Student Roster", icon: <GraduationCap className="h-4 w-4" />, badge: centralMetrics?.totalStudents },
    { id: "bulkImport", label: "Bulk Student Import", icon: <UploadCloud className="h-4 w-4" /> },
    { id: "courses", label: "Courses & Cohorts", icon: <FileText className="h-4 w-4" /> },
    { id: "drives", label: "Campus Drives", icon: <Briefcase className="h-4 w-4" />, badge: centralMetrics?.activeDrives },
    { id: "jobfairs", label: "Job Fairs", icon: <Calendar className="h-4 w-4" />, badge: centralMetrics?.upcomingJobFairs },
    { id: "recruiters", label: "Recruiters & Stalls", icon: <Users className="h-4 w-4" /> },
    { id: "eligibility", label: "Eligibility & Overrides", icon: <CheckCircle2 className="h-4 w-4" /> },
    { id: "interviews", label: "Interviews & Schedules", icon: <Clock className="h-4 w-4" /> },
    { id: "results", label: "Placement Results", icon: <Award className="h-4 w-4" /> },
    { id: "payments", label: "Payment Verification", icon: <CreditCard className="h-4 w-4" />, badge: centralMetrics?.verifiedPaymentsCount },
    { id: "reports", label: "Reports & Analytics", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "notifications", label: "Communications", icon: <Bell className="h-4 w-4" /> },
    { id: "audit", label: "Audit Logs", icon: <Sliders className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              Enterprise Module
            </span>
            <span className="text-xs text-slate-500 font-medium">SoftLab Global Placement CRM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Campus Placement & Institutional Partnerships
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Unified institutional partner onboarding, college administrator provisioning, student bulk import, campus placement drives, and multi-college mega job fairs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              refetchMetrics();
              refetchInstitutions();
              refetchStudents();
              refetchJobFairs();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowNewFairModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <Calendar className="h-4 w-4" />
            <span>Host Job Fair</span>
          </button>
        </div>
      </div>

      {/* Navigation Subsections Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white text-slate-900" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Real-time KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Partner Institutions</span>
                <Building2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {centralMetrics?.totalInstitutions || 0}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span className="text-emerald-600 font-semibold">{centralMetrics?.activeColleges || 0} active</span>
                <span>•</span>
                <span className="text-amber-600 font-semibold">{centralMetrics?.pendingApprovals || 0} pending review</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Campus Students</span>
                <GraduationCap className="h-4 w-4 text-sky-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {centralMetrics?.totalStudents || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Enrolled across college cohorts</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Mega Job Fairs</span>
                <Calendar className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {centralMetrics?.upcomingJobFairs || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Multi-recruiter campus hiring events</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Active Drives</span>
                <Briefcase className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {centralMetrics?.activeDrives || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {centralMetrics?.totalNominations || 0} candidate nominations
              </p>
            </div>
          </div>

          {/* Quick Action Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold">Review Institutional Approvals</h3>
              <p className="text-xs text-slate-300 mt-1">
                {centralMetrics?.pendingApprovals || 0} colleges and universities awaiting official affiliation & credential verification.
              </p>
              <button
                onClick={() => setActiveTab("approvals")}
                className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <span>Open Approvals Desk</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 text-white p-6 rounded-2xl shadow-md">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <Calendar className="h-5 w-5 text-indigo-300" />
              </div>
              <h3 className="text-base font-bold">Host Mega Job Fair</h3>
              <p className="text-xs text-indigo-200 mt-1">
                Create hybrid/in-person hiring events, allocate corporate stalls, and invite hundreds of colleges.
              </p>
              <button
                onClick={() => setShowNewFairModal(true)}
                className="mt-4 px-4 py-2 bg-indigo-400 hover:bg-indigo-300 text-slate-950 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <span>Configure New Fair</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-emerald-950 to-teal-900 text-white p-6 rounded-2xl shadow-md">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <UploadCloud className="h-5 w-5 text-emerald-300" />
              </div>
              <h3 className="text-base font-bold">Bulk Student Import</h3>
              <p className="text-xs text-emerald-200 mt-1">
                Download standardised CSV template, validate student CGPA & backlogs, and ingest entire college batches.
              </p>
              <button
                onClick={() => setActiveTab("bulkImport")}
                className="mt-4 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <span>Open Bulk Importer</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. COLLEGES & UNIVERSITIES DIRECTORY */}
      {activeTab === "colleges" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search college, city, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved Partners</option>
                <option value="PENDING_APPROVAL">Pending Review</option>
                <option value="CORRECTION_REQUESTED">Correction Requested</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              Showing {institutionsData?.items?.length || 0} of {institutionsData?.total || 0} colleges
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Code & College Name</th>
                  <th className="p-3.5">Type & Affiliation</th>
                  <th className="p-3.5">City & State</th>
                  <th className="p-3.5">Authorized Contact</th>
                  <th className="p-3.5">Students</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {institutionsData?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No institutions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  institutionsData?.items?.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{inst.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{inst.code}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800">{inst.type}</span>
                        {inst.affiliation && <div className="text-[11px] text-slate-500">{inst.affiliation}</div>}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-slate-800">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{inst.city || "—"}, {inst.state || ""}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{inst.authorizedPersonName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Mail className="h-2.5 w-2.5" />
                          <span>{inst.officialEmail}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                          {inst._count?.students || 0}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            inst.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : inst.status === "PENDING_APPROVAL"
                              ? "bg-amber-100 text-amber-800"
                              : inst.status === "CORRECTION_REQUESTED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {inst.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedInstId(inst.id);
                            setShowApproveModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
                        >
                          Review / Actions
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. APPROVALS DESK */}
      {activeTab === "approvals" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">Institutional Verification Desk</h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Review submitted college recognition records (UGC / AICTE), sign-offs, and contact credentials. Approving an institution automatically provisions its tenant workspace and institutional administrator account.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-800">
              Pending Applications ({institutionsData?.items?.filter((i) => i.status === "PENDING_APPROVAL").length || 0})
            </div>

            <div className="divide-y divide-slate-200">
              {institutionsData?.items
                ?.filter((i) => i.status === "PENDING_APPROVAL")
                ?.map((inst) => (
                  <div key={inst.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{inst.name}</h4>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          {inst.code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-4">
                        <span><strong>Type:</strong> {inst.type}</span>
                        <span><strong>City:</strong> {inst.city || "—"}</span>
                        <span><strong>Email:</strong> {inst.officialEmail}</span>
                        <span><strong>Rep:</strong> {inst.authorizedPersonName} ({inst.authorizedPersonPhone})</span>
                      </div>
                      {inst.affiliation && (
                        <div className="text-xs text-slate-500 mt-1">
                          <strong>Affiliation:</strong> {inst.affiliation} | <strong>Recognition:</strong> {inst.recognition || "Standard State Recognized"}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedInstId(inst.id);
                          setApprovalDecision("APPROVED");
                          setShowApproveModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm"
                      >
                        Approve Institution
                      </button>

                      <button
                        onClick={() => {
                          setSelectedInstId(inst.id);
                          setApprovalDecision("CORRECTION_REQUESTED");
                          setShowApproveModal(true);
                        }}
                        className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs rounded-lg border border-amber-300"
                      >
                        Request Corrections
                      </button>

                      <button
                        onClick={() => {
                          setSelectedInstId(inst.id);
                          setApprovalDecision("REJECTED");
                          setShowApproveModal(true);
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-lg border border-red-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. STUDENT ROSTER */}
      {activeTab === "students" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search enrollment no, student name, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV Template</span>
              </button>

              <button
                onClick={() => setActiveTab("bulkImport")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Bulk Import Students</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Enrollment & Name</th>
                  <th className="p-3.5">College / Institution</th>
                  <th className="p-3.5">Program & Batch</th>
                  <th className="p-3.5">CGPA / %</th>
                  <th className="p-3.5">Backlogs</th>
                  <th className="p-3.5">Eligibility</th>
                  <th className="p-3.5">Fee Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {studentsData?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No student records found.
                    </td>
                  </tr>
                ) : (
                  studentsData?.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">
                          {item.student?.user?.firstName} {item.student?.user?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.enrollmentNumber}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {item.institution?.name}
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-900 font-semibold">{item.courseName}</div>
                        <div className="text-[11px] text-slate-500">Graduation: {item.passingYear} (Sem {item.currentSemester || "—"})</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900">
                          {item.cgpa ? `${item.cgpa} CGPA` : item.academicPercentage ? `${item.academicPercentage}%` : "—"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            item.activeBacklogs === 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.activeBacklogs} Active
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            item.placementEligibility
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.placementEligibility ? "Eligible" : "Ineligible"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            item.paymentStatus === "PAID" || item.paymentStatus === "WAIVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.paymentStatus === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {item.payments?.[0] && item.payments[0].paymentStatus === "PENDING" && (
                          <button
                            onClick={() => {
                              setSelectedPaymentId(item.payments[0].id);
                              setShowPaymentModal(true);
                            }}
                            className="px-2 py-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300"
                          >
                            Verify Fee
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. BULK IMPORT */}
      {activeTab === "bulkImport" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bulk Student Import & Batch Ingestion</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Upload or paste student records formatted as CSV. The system validates required headers, formats phone numbers, computes CGPA eligibility, and detects duplicates.
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV Template</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Institution (Optional for Global Admin)
              </label>
              <select
                className="w-full max-w-md text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
                onChange={(e) => setSelectedInstId(e.target.value)}
              >
                <option value="">Select Partner College...</option>
                {institutionsData?.items?.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Paste CSV Data or Drag & Drop File
              </label>
              <textarea
                rows={12}
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
                placeholder="Enrollment Number*,Roll Number,Full Name*,Email Address*,Mobile Number*,Gender,Course / Program*,Department,Degree Type,Academic Year*,Passing Year*,Current Semester,CGPA,Percentage,Active Backlogs,Technical Skills,Preferred Role,Preferred Location,Registration Fee..."
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                {importCsvText ? `${importCsvText.split("\n").filter(Boolean).length - 1} rows detected` : "Ready for import"}
              </span>

              <button
                disabled={!importCsvText || bulkImportMutation.isPending}
                onClick={() =>
                  bulkImportMutation.mutate({
                    institutionId: selectedInstId || undefined,
                    fileName: importFileName,
                    csvContent: importCsvText,
                  })
                }
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2"
              >
                <UploadCloud className="h-4 w-4" />
                <span>{bulkImportMutation.isPending ? "Validating & Ingesting..." : "Process Bulk Import"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 9. JOB FAIRS */}
      {activeTab === "jobfairs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Mega Job Fairs & Multi-College Hiring Events</h2>
            <button
              onClick={() => setShowNewFairModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Job Fair</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobFairsData?.items?.map((fair) => (
              <div key={fair.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                      {fair.fairCode}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">{fair.title}</h3>
                    {fair.theme && <p className="text-xs text-slate-500">{fair.theme}</p>}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    {fair.fairType}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {new Date(fair.startDate).toLocaleDateString()} — {new Date(fair.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{fair.venue || "Prayagraj"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded">
                    <div className="font-bold text-slate-900">{fair._count?.institutions || 0}</div>
                    <div className="text-[10px] text-slate-500">Colleges</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <div className="font-bold text-slate-900">{fair._count?.recruiters || 0}</div>
                    <div className="text-[10px] text-slate-500">Companies</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <div className="font-bold text-slate-900">{fair._count?.registrations || 0}</div>
                    <div className="text-[10px] text-slate-500">Registrations</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: APPROVAL REVIEW */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Review Institutional Application</h3>
              <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Decision</label>
                <select
                  value={approvalDecision}
                  onChange={(e: any) => setApprovalDecision(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                >
                  <option value="APPROVED">Approve & Provision Account</option>
                  <option value="CORRECTION_REQUESTED">Request Corrections</option>
                  <option value="REJECTED">Reject Application</option>
                </select>
              </div>

              {approvalDecision === "APPROVED" && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Provisional Admin Password
                  </label>
                  <input
                    type="text"
                    value={provisionalPassword}
                    onChange={(e) => setProvisionalPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    An institutional administrator account will be provisioned with this password.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Reviewer Remarks / Feedback</label>
                <textarea
                  rows={3}
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  placeholder="Official comments or required corrections..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={reviewMutation.isPending}
                onClick={() =>
                  reviewMutation.mutate({
                    institutionId: selectedInstId!,
                    decision: approvalDecision,
                    remarks: approvalRemarks,
                    provisionalAdminPassword: provisionalPassword,
                  })
                }
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
              >
                {reviewMutation.isPending ? "Submitting..." : "Confirm Decision"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE JOB FAIR */}
      {showNewFairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Host New Mega Job Fair</h3>
              <button onClick={() => setShowNewFairModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Event Title*</label>
                <input
                  type="text"
                  placeholder="e.g. SoftLab Mega IT & Engineering Campus Job Fair 2026"
                  value={fairTitle}
                  onChange={(e) => setFairTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Theme / Tagline</label>
                <input
                  type="text"
                  placeholder="Connecting 5,000+ Engineers with 100+ Tech Employers"
                  value={fairTheme}
                  onChange={(e) => setFairTheme(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Venue / Location</label>
                <input
                  type="text"
                  value={fairVenue}
                  onChange={(e) => setFairVenue(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={fairStartDate}
                    onChange={(e) => setFairStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={fairEndDate}
                    onChange={(e) => setFairEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewFairModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={!fairTitle || createFairMutation.isPending}
                onClick={() =>
                  createFairMutation.mutate({
                    title: fairTitle,
                    theme: fairTheme,
                    venue: fairVenue,
                    startDate: new Date(fairStartDate),
                    endDate: new Date(fairEndDate),
                  })
                }
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
              >
                {createFairMutation.isPending ? "Creating..." : "Launch Job Fair"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VERIFY PAYMENT */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Verify Student Registration Payment</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Decision</label>
                <select
                  value={paymentDecision}
                  onChange={(e: any) => setPaymentDecision(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                >
                  <option value="VERIFY">Verify & Confirm Paid</option>
                  <option value="WAIVE">Waive Fee</option>
                  <option value="REJECT">Reject Payment Record</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Accountant Notes</label>
                <input
                  type="text"
                  placeholder="Bank reference, cash receipt no..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowPaymentModal(false)} className="px-3 py-1.5 text-xs text-slate-600">
                Cancel
              </button>
              <button
                onClick={() =>
                  verifyPaymentMutation.mutate({
                    paymentId: selectedPaymentId!,
                    decision: paymentDecision,
                    notes: paymentNotes,
                  })
                }
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
