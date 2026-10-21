"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { api as trpc } from "@/lib/trpc/react";
import type { SkillverseAdmissionStage, SkillverseEnquiryRecord } from "@/server/services/skillverse.service";
import {
  INITIAL_SKILLVERSE_COURSES,
  INITIAL_ACADEMIC_PACKAGES,
  INITIAL_COMPETITIVE_ADDONS,
} from "@/lib/constants/skillverse-data";
import {
  Users,
  GraduationCap,
  FileText,
  CreditCard,
  Award,
  Settings,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Save,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  ArrowRight,
  Trash2,
  Edit,
  LogOut,
  Download,
  RefreshCw,
  X,
  ChevronRight,
  Clock,
  UserCheck,
  PhoneCall,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from "lucide-react";

const STAGES: SkillverseAdmissionStage[] = [
  "ENQUIRY",
  "FOLLOW_UP",
  "DEMO_BOOKING",
  "ASSESSMENT",
  "COUNSELING",
  "APPLICATION",
  "PARENT_CONSENT",
  "FEE_PAYMENT",
  "ENROLLMENT",
  "BATCH_ALLOCATION",
  "ACTIVE_STUDENT",
];

type TabId =
  | "admissions"
  | "students_teacher"
  | "finance_fees"
  | "certificates"
  | "cms_seo"
  | "analytics_audit";

export function SkillverseAdminPortal() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>("admissions");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // CRM Pipeline & Table states
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStageFilter, setSelectedStageFilter] = useState<SkillverseAdmissionStage | "ALL">("ALL");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("ALL");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>("ALL");

  // CRM Modals
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<SkillverseEnquiryRecord | null>(null);
  const [followUpNoteText, setFollowUpNoteText] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [detailStageUpdate, setDetailStageUpdate] = useState<SkillverseAdmissionStage>("FOLLOW_UP");

  // New Lead form state
  const [newStudentName, setNewStudentName] = useState("");
  const [newParentName, setNewParentName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newGrade, setNewGrade] = useState("Class 9");
  const [newBoard, setNewBoard] = useState("CBSE");
  const [newSchool, setNewSchool] = useState("");
  const [newCourseSlug, setNewCourseSlug] = useState("school-foundation-8-10");
  const [newPackageId, setNewPackageId] = useState("PKG-2-EXCELLENCE");
  const [newAddonId, setNewAddonId] = useState("");
  const [newDeliveryMode, setNewDeliveryMode] = useState<"ONLINE" | "OFFLINE" | "HYBRID">("HYBRID");
  const [newCity, setNewCity] = useState("Prayagraj");
  const [newLocality, setNewLocality] = useState("Civil Lines");
  const [newInitialStage, setNewInitialStage] = useState<SkillverseAdmissionStage>("ENQUIRY");
  const [newInitialNotes, setNewInitialNotes] = useState("");
  const [newInitialFollowUpDate, setNewInitialFollowUpDate] = useState("");
  const [newDemoDate, setNewDemoDate] = useState("");

  // Attendance form state
  const [attEnrollmentCode, setAttEnrollmentCode] = useState("");
  const [attSubject, setAttSubject] = useState("Mathematics & Science Foundation");
  const [attStatus, setAttStatus] = useState<"PRESENT" | "ABSENT" | "LATE">("PRESENT");

  // Certificate issue state
  const [certStudentId, setCertStudentId] = useState("");
  const [certStudentName, setCertStudentName] = useState("");
  const [certGrade, setCertGrade] = useState("Class 10");
  const [certCourseTitle, setCertCourseTitle] = useState("Python Programming Foundation");

  const utils = trpc.useUtils();
  const { data, isLoading, error, refetch, isFetching } = trpc.skillverse.getAdminDashboardData.useQuery();

  const updateStageMutation = trpc.skillverse.updateEnquiryStage.useMutation({
    onSuccess: (updated) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      setToastMsg(
        `Updated ${updated.referenceNumber} to ${updated.stage}${
          updated.enrolledStudentId ? ` (Enrolled: ${updated.enrolledStudentId})` : ""
        }`
      );
      if (selectedLeadForDetail && selectedLeadForDetail.referenceNumber === updated.referenceNumber) {
        setSelectedLeadForDetail(updated);
      }
      setTimeout(() => setToastMsg(null), 4000);
    },
    onError: (err) => {
      setToastMsg(`Error: ${err.message}`);
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const createDirectLeadMutation = trpc.skillverse.createDirectLead.useMutation({
    onSuccess: (created) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      setIsAddLeadOpen(false);
      setToastMsg(`Created new lead ${created.referenceNumber} for ${created.studentName}`);
      // Reset form
      setNewStudentName("");
      setNewParentName("");
      setNewPhone("");
      setNewEmail("");
      setNewSchool("");
      setNewInitialNotes("");
      setNewInitialFollowUpDate("");
      setNewDemoDate("");
      setTimeout(() => setToastMsg(null), 4000);
    },
    onError: (err) => {
      setToastMsg(`Failed to create lead: ${err.message}`);
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const deleteEnquiryMutation = trpc.skillverse.deleteEnquiry.useMutation({
    onSuccess: (res) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      if (selectedLeadForDetail && selectedLeadForDetail.referenceNumber === res.referenceNumber) {
        setSelectedLeadForDetail(null);
      }
      setToastMsg(`Deleted enquiry ${res.referenceNumber}`);
      setTimeout(() => setToastMsg(null), 4000);
    },
    onError: (err) => {
      setToastMsg(`Failed to delete enquiry: ${err.message}`);
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const addFollowUpNoteMutation = trpc.skillverse.addFollowUpNote.useMutation({
    onSuccess: (updated) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      setSelectedLeadForDetail(updated);
      setFollowUpNoteText("");
      setToastMsg(`Follow-up note logged for ${updated.referenceNumber}`);
      setTimeout(() => setToastMsg(null), 4000);
    },
    onError: (err) => {
      setToastMsg(`Failed to log note: ${err.message}`);
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const markAttendanceMutation = trpc.skillverse.markStudentAttendance.useMutation({
    onSuccess: (stu) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      setToastMsg(`Attendance marked for ${stu.studentName} (${stu.enrollmentCode}).`);
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const issueCertMutation = trpc.skillverse.issueCertificate.useMutation({
    onSuccess: (cert) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      setToastMsg(`Certificate ${cert.certificateNumber} issued.`);
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const revokeCertMutation = trpc.skillverse.revokeCertificate.useMutation({
    onSuccess: (cert) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      setToastMsg(`Certificate ${cert.certificateNumber} revoked.`);
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const saveCmsMutation = trpc.skillverse.saveCmsSettings.useMutation({
    onSuccess: () => {
      utils.skillverse.getAdminDashboardData.invalidate();
      setToastMsg("Skillverse CMS & SEO settings saved.");
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const upsertCourseMutation = trpc.skillverse.upsertCourse.useMutation({
    onSuccess: () => {
      utils.skillverse.getAdminDashboardData.invalidate();
      utils.skillverse.getPublicCatalog.invalidate();
      setToastMsg("Course configuration updated without code changes.");
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const upsertPackageMutation = trpc.skillverse.upsertPackage.useMutation({
    onSuccess: () => {
      utils.skillverse.getAdminDashboardData.invalidate();
      utils.skillverse.getPublicCatalog.invalidate();
      setToastMsg("Package pricing updated.");
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const upsertBatchMutation = trpc.skillverse.upsertBatch.useMutation({
    onSuccess: (b) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      utils.skillverse.getPublicCatalog.invalidate();
      setToastMsg(`Batch ${b.batchCode} (${b.title}) saved.`);
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const gradeQuizMutation = trpc.skillverse.gradeDescriptiveQuizAttempt.useMutation({
    onSuccess: (res) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      setToastMsg(
        `Descriptive assessment ${res.attemptId} graded (${res.totalAwardedMarks}/${res.totalMaxMarks}).`
      );
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const [cmsDraft, setCmsDraft] = useState<any | null>(null);
  const [courseSlugEdit, setCourseSlugEdit] = useState("python-programming-foundation");
  const [courseTitleEdit, setCourseTitleEdit] = useState("Python Programming Foundation");
  const [courseFeeEdit, setCourseFeeEdit] = useState(1499);
  const [courseStatusEdit, setCourseStatusEdit] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("PUBLISHED");
  const [pkgIdEdit, setPkgIdEdit] = useState("PKG-1-STARTER");
  const [pkgFeeEdit, setPkgFeeEdit] = useState(1499);

  // Batch & Descriptive Grading state
  const [batchCodeEdit, setBatchCodeEdit] = useState("SV-B26-810A");
  const [batchTitleEdit, setBatchTitleEdit] = useState("Classes 8–10 Foundation & FutureReady Batch A");
  const [batchTeacherEdit, setBatchTeacherEdit] = useState("Academic Faculty Wing");
  const [batchScheduleEdit, setBatchScheduleEdit] = useState("Mon–Sat | 4:00 PM – 6:00 PM");
  const [gradeAttemptId, setGradeAttemptId] = useState("");
  const [gradeMarks, setGradeMarks] = useState(4);
  const [gradeFeedback, setGradeFeedback] = useState("Clear conceptual explanation of Ohm's Law and circuit current limits.");

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Loading SLG SKILLVERSE Staff, Teacher & Admin Portal...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Skillverse Staff, Teacher & Admin Authentication Required
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Access to the SLG SKILLVERSE Admissions CRM, Teacher Portal, Finance Desk, and CMS
            requires an authenticated SoftLab Global staff session (Super Admin, Skillverse Admin,
            Counselor, Teacher, or Finance Officer).
          </p>
          <Link
            href="/login?callbackUrl=/skillverse/staff-login"
            className="inline-block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            Sign In with Staff Credentials →
          </Link>
        </div>
      </div>
    );
  }

  const {
    enquiries,
    students,
    invoices,
    certificates,
    assessments,
    quizAttempts,
    batches,
    notifications,
    analyticsEvents,
    auditLogs,
    metrics,
    cms,
  } = data;

  const currentCms = cmsDraft || cms;

  const filteredEnquiries = useMemo(() => {
    return (enquiries || []).filter((enq) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        enq.studentName.toLowerCase().includes(q) ||
        enq.parentName.toLowerCase().includes(q) ||
        enq.phone.includes(q) ||
        enq.email.toLowerCase().includes(q) ||
        enq.referenceNumber.toLowerCase().includes(q) ||
        (enq.schoolName && enq.schoolName.toLowerCase().includes(q));

      const matchesStage =
        selectedStageFilter === "ALL" || enq.stage === selectedStageFilter;

      const matchesGrade =
        selectedGradeFilter === "ALL" || enq.currentClass === selectedGradeFilter;

      const matchesSource =
        selectedSourceFilter === "ALL" || enq.enquirySource === selectedSourceFilter;

      return matchesSearch && matchesStage && matchesGrade && matchesSource;
    });
  }, [enquiries, searchQuery, selectedStageFilter, selectedGradeFilter, selectedSourceFilter]);

  const handleExportCsv = () => {
    const headers = [
      "Reference Number",
      "Student Name",
      "Parent Name",
      "Phone",
      "Email",
      "Class/Grade",
      "Board",
      "School",
      "Course Slug",
      "Package",
      "Competitive Add-on",
      "Stage",
      "Enrolled Student ID",
      "Created Date",
    ];
    const rows = filteredEnquiries.map((enq) => [
      enq.referenceNumber,
      `"${enq.studentName.replace(/"/g, '""')}"`,
      `"${enq.parentName.replace(/"/g, '""')}"`,
      enq.phone,
      enq.email,
      enq.currentClass,
      enq.board,
      `"${(enq.schoolName || "").replace(/"/g, '""')}"`,
      enq.preferredCourseSlug,
      enq.preferredPackageId || "NONE",
      enq.competitiveAddonId || "NONE",
      enq.stage,
      enq.enrolledStudentId || "NONE",
      enq.createdAt,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `skillverse-admissions-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header with Staff Session & Dedicated Logout Option */}
      <div className="bg-gradient-to-r from-[#071630] via-[#0B2247] to-[#15803D] rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-lime-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-lime-300" /> SLG SKILLVERSE — Unified Staff, Teacher & Admin Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Admissions CRM, Teacher LMS, Finance & CMS
          </h1>
          <p className="text-xs text-slate-200 mt-1">
            Real database-backed metrics from the isolated Skillverse PostgreSQL namespace.
          </p>
        </div>

        {/* Staff Session Profile & Actions (With Prominent Logout Button) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#0052CC] text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
              {(session?.user?.name || "S").charAt(0).toUpperCase()}
            </div>
            <div className="text-left text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="truncate max-w-[130px]">{session?.user?.name || "Staff Admin"}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-mono text-[9px] font-bold uppercase">
                  {(session?.user as any)?.roleCode || "SUPER_ADMIN"}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 truncate max-w-[160px]">
                {session?.user?.email || "staff@softlabglobal.com"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/skillverse/staff-login" })}
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-400/40 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Log Out of Staff Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/skillverse"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
            >
              Public Site
            </Link>
            <a
              href="/api/skillverse/health"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-lime-200 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
            >
              Health JSON
            </a>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {toastMsg}
        </div>
      )}

      {/* Real Database-Backed KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Enquiries</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalEnquiries}</div>
          <span className="text-[10px] text-blue-600 font-semibold">
            Conversion: {metrics.conversionRatePercent}%
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Demo Bookings</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {metrics.demoBookingsCount}
          </div>
          <span className="text-[10px] text-slate-500">Scheduled Demos</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Active Students</span>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {metrics.activeStudentsCount}
          </div>
          <span className="text-[10px] text-slate-500">Enrolled & Linked</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Paid Fee Revenue</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{metrics.paidRevenueInr.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-500">Verified Receipts</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Pending Dues</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            ₹{metrics.pendingFeeInr.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-500">Open Invoices</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Certificates</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {metrics.certificatesIssuedCount}
          </div>
          <span className="text-[10px] text-slate-500">QR Verifiable</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "admissions", label: "11-Stage Admissions CRM", icon: Users },
          { id: "students_teacher", label: "Students, Batches & Teacher Portal", icon: GraduationCap },
          { id: "finance_fees", label: "Fee Invoices & Receipts", icon: CreditCard },
          { id: "certificates", label: "Certificates & Verification", icon: Award },
          { id: "cms_seo", label: "Admin CMS & SEO", icon: Settings },
          { id: "analytics_audit", label: "Analytics, Notifications & Audit", icon: BarChart3 },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as TabId)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: FULL-FEATURED 11-STAGE ADMISSIONS CRM (MATCHING SLG CRM) */}
      {activeTab === "admissions" && (
        <div className="space-y-4">
          {/* Top Control Bar: Search, Filters, View Modes & Direct Lead Action */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="search"
                  placeholder="Search student, parent, phone, email, ref #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Action Buttons: Add Lead, Export, View Toggle, Refresh */}
              <div className="flex flex-wrap items-center gap-2">
                {/* View Mode Toggle */}
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === "table"
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <List className="w-3.5 h-3.5" /> Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("kanban")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === "kanban"
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> Kanban Board
                  </button>
                </div>

                {/* Export CSV */}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={filteredEnquiries.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50"
                  title="Export Filtered Leads to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
                </button>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
                  title="Refresh Database Records"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isFetching ? "animate-spin" : ""}`} />
                </button>

                {/* + Add Direct Lead Button */}
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#0077FF] hover:brightness-105 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add New Lead
                </button>
              </div>
            </div>

            {/* Filter Pills Row */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filters:
              </span>

              {/* Stage Filter */}
              <select
                value={selectedStageFilter}
                onChange={(e) => setSelectedStageFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 text-xs"
              >
                <option value="ALL">All Stages ({enquiries.length})</option>
                {STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st} ({enquiries.filter((e) => e.stage === st).length})
                  </option>
                ))}
              </select>

              {/* Grade Filter */}
              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 text-xs"
              >
                <option value="ALL">All Classes (8–12)</option>
                <option value="Class 8">Class 8</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>

              {/* Source Filter */}
              <select
                value={selectedSourceFilter}
                onChange={(e) => setSelectedSourceFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 text-xs"
              >
                <option value="ALL">All Sources</option>
                <option value="DIRECT_STAFF_CRM">Direct Walk-In / Staff</option>
                <option value="WEBSITE">Website Enquiries</option>
                <option value="DEMO_BOOKING">Demo Bookings</option>
                <option value="DIAGNOSTIC_ASSESSMENT">Diagnostic Assessments</option>
              </select>

              {(searchQuery || selectedStageFilter !== "ALL" || selectedGradeFilter !== "ALL" || selectedSourceFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStageFilter("ALL");
                    setSelectedGradeFilter("ALL");
                    setSelectedSourceFilter("ALL");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px]"
                >
                  Reset Filters
                </button>
              )}

              <span className="ml-auto text-slate-400 font-medium text-[11px]">
                Showing {filteredEnquiries.length} of {enquiries.length} leads
              </span>
            </div>
          </div>

          {/* VIEW MODE A: TABLE VIEW */}
          {viewMode === "table" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              {filteredEnquiries.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-800">No matching admissions leads found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your search criteria, or click &ldquo;Add New Lead&rdquo; to record a direct counseling enquiry.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddLeadOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                  >
                    <Plus className="w-4 h-4" /> Add Lead Now
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4">Ref Number</th>
                        <th className="py-3.5 px-4">Student & Grade</th>
                        <th className="py-3.5 px-4">Parent & Contact</th>
                        <th className="py-3.5 px-4">Course / Track</th>
                        <th className="py-3.5 px-4">Pipeline Stage</th>
                        <th className="py-3.5 px-4">Follow-Up / Notes</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEnquiries.map((enq) => {
                        const cleanPhone = enq.phone.replace(/\D/g, "").slice(-10);
                        const waMsg = encodeURIComponent(
                          `Hello ${enq.parentName}, greetings from SLG SKILLVERSE (SoftLab Global)! We received ${enq.studentName}'s enquiry for ${enq.preferredCourseSlug} (${enq.currentClass}). Would you like to schedule a free demo session or discuss academic details?`
                        );
                        return (
                          <tr key={enq.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Ref Number + Timestamp */}
                            <td className="py-3 px-4 align-top">
                              <span className="font-mono font-bold text-blue-700 block">
                                {enq.referenceNumber}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(enq.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              {enq.enrolledStudentId && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[9px]">
                                  🎓 {enq.enrolledStudentId}
                                </span>
                              )}
                            </td>

                            {/* Student & Grade */}
                            <td className="py-3 px-4 align-top">
                              <div className="font-extrabold text-slate-900">{enq.studentName}</div>
                              <div className="text-[11px] text-slate-500 font-semibold">
                                {enq.currentClass} • {enq.board}
                              </div>
                              {enq.schoolName && (
                                <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                  {enq.schoolName}
                                </div>
                              )}
                            </td>

                            {/* Parent & Contact + Quick Buttons */}
                            <td className="py-3 px-4 align-top">
                              <div className="font-semibold text-slate-800">{enq.parentName}</div>
                              <div className="text-[11px] text-slate-600 font-mono">{enq.phone}</div>
                              {/* Quick Contact Icons */}
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <a
                                  href={`tel:+91${cleanPhone}`}
                                  className="p-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                  title={`Call +91-${cleanPhone}`}
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`https://wa.me/91${cleanPhone}?text=${waMsg}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                  title={`WhatsApp +91-${cleanPhone}`}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`mailto:${enq.email}`}
                                  className="p-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                  title={`Email ${enq.email}`}
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </td>

                            {/* Course / Package */}
                            <td className="py-3 px-4 align-top">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold text-[10px] border border-blue-200/60 max-w-[160px] truncate">
                                {enq.preferredCourseSlug}
                              </span>
                              {enq.preferredPackageId && (
                                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                  Pkg: {enq.preferredPackageId}
                                </div>
                              )}
                              {enq.competitiveAddonId && (
                                <div className="text-[10px] text-emerald-700 font-medium">
                                  + {enq.competitiveAddonId}
                                </div>
                              )}
                            </td>

                            {/* Pipeline Stage Selector */}
                            <td className="py-3 px-4 align-top">
                              <select
                                value={enq.stage}
                                onChange={(e) =>
                                  updateStageMutation.mutate({
                                    referenceNumber: enq.referenceNumber,
                                    stage: e.target.value as SkillverseAdmissionStage,
                                  })
                                }
                                className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-bold text-xs shadow-2xs focus:border-blue-500 focus:outline-none"
                              >
                                {STAGES.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                              {enq.demoScheduledAt && (
                                <div className="text-[10px] text-emerald-700 font-bold mt-1">
                                  Demo: {enq.demoScheduledAt}
                                </div>
                              )}
                            </td>

                            {/* Follow-up Notes Excerpt */}
                            <td className="py-3 px-4 align-top max-w-[180px]">
                              {enq.followUpNotes ? (
                                <p className="text-[11px] text-slate-700 line-clamp-2">
                                  {enq.followUpNotes}
                                </p>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No notes logged yet</span>
                              )}
                              {enq.followUpDate && (
                                <div className="text-[10px] text-blue-600 font-bold mt-0.5">
                                  Due: {enq.followUpDate}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 align-top text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedLeadForDetail(enq);
                                    setDetailStageUpdate(enq.stage);
                                    setNextFollowUpDate(enq.followUpDate || "");
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors"
                                  title="Open Lead Profile & Follow-Up History"
                                >
                                  View / Notes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete lead ${enq.referenceNumber} (${enq.studentName})?`)) {
                                      deleteEnquiryMutation.mutate({ referenceNumber: enq.referenceNumber });
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                  title="Delete Lead"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE B: KANBAN PIPELINE BOARD */}
          {viewMode === "kanban" && (
            <div className="overflow-x-auto pb-4">
              <div className="flex items-start gap-4 min-w-[2200px]">
                {STAGES.map((stage) => {
                  const stageLeads = filteredEnquiries.filter((e) => e.stage === stage);
                  return (
                    <div
                      key={stage}
                      className="w-72 shrink-0 bg-slate-50/90 rounded-2xl border border-slate-200 flex flex-col max-h-[75vh]"
                    >
                      {/* Column Header */}
                      <div className="p-3 border-b border-slate-200 bg-white rounded-t-2xl flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                          {stage.replace(/_/g, " ")}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                          {stageLeads.length}
                        </span>
                      </div>

                      {/* Cards Container */}
                      <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                        {stageLeads.length === 0 ? (
                          <div className="p-4 text-center text-[11px] text-slate-400 italic">
                            No leads in this stage
                          </div>
                        ) : (
                          stageLeads.map((enq) => {
                            const cleanPhone = enq.phone.replace(/\D/g, "").slice(-10);
                            const waMsg = encodeURIComponent(
                              `Hello ${enq.parentName}, greetings from SLG SKILLVERSE (SoftLab Global)! Regarding ${enq.studentName}'s enquiry for ${enq.preferredCourseSlug}...`
                            );
                            return (
                              <div
                                key={enq.id}
                                className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs hover:shadow-md transition-shadow space-y-2 cursor-pointer"
                                onClick={() => {
                                  setSelectedLeadForDetail(enq);
                                  setDetailStageUpdate(enq.stage);
                                  setNextFollowUpDate(enq.followUpDate || "");
                                }}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-mono font-bold text-[10px] text-blue-700">
                                    {enq.referenceNumber}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[9px]">
                                    {enq.currentClass}
                                  </span>
                                </div>

                                <div>
                                  <h4 className="font-black text-slate-900 text-xs">{enq.studentName}</h4>
                                  <p className="text-[10px] text-slate-500">
                                    Parent: {enq.parentName} ({enq.phone})
                                  </p>
                                </div>

                                <div className="text-[10px] text-slate-600 line-clamp-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                  📚 {enq.preferredCourseSlug}
                                </div>

                                {enq.followUpNotes && (
                                  <p className="text-[10px] text-slate-500 italic line-clamp-2">
                                    &ldquo;{enq.followUpNotes}&rdquo;
                                  </p>
                                )}

                                {/* Action Buttons Row */}
                                <div
                                  className="flex items-center justify-between pt-1 border-t border-slate-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <a
                                      href={`tel:+91${cleanPhone}`}
                                      className="p-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                                      title="Call"
                                    >
                                      <PhoneCall className="w-3 h-3" />
                                    </a>
                                    <a
                                      href={`https://wa.me/91${cleanPhone}?text=${waMsg}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                      title="WhatsApp"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                    </a>
                                  </div>

                                  <select
                                    value={enq.stage}
                                    onChange={(e) =>
                                      updateStageMutation.mutate({
                                        referenceNumber: enq.referenceNumber,
                                        stage: e.target.value as SkillverseAdmissionStage,
                                      })
                                    }
                                    className="text-[10px] font-bold border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50"
                                  >
                                    {STAGES.map((st) => (
                                      <option key={st} value={st}>
                                        {st}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODAL 1: ADD DIRECT LEAD DIALOG */}
          {isAddLeadOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Add New Admission Lead</h3>
                    <p className="text-xs text-slate-500">Record a walk-in, phone-call, or counseling enquiry.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddLeadOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createDirectLeadMutation.mutate({
                      studentName: newStudentName,
                      parentName: newParentName,
                      phone: newPhone,
                      email: newEmail,
                      currentClass: newGrade,
                      board: newBoard,
                      schoolName: newSchool || undefined,
                      preferredCourseSlug: newCourseSlug,
                      preferredPackageId: newPackageId || undefined,
                      competitiveAddonId: newAddonId || undefined,
                      deliveryMode: newDeliveryMode,
                      city: newCity,
                      locality: newLocality,
                      stage: newInitialStage,
                      notes: newInitialNotes || undefined,
                      followUpDate: newInitialFollowUpDate || undefined,
                      demoScheduledAt: newDemoDate || undefined,
                    });
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aryan Sharma"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Parent / Guardian Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Sharma"
                        value={newParentName}
                        onChange={(e) => setNewParentName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Parent Mobile (10-Digit) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="9196596975"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="parent@example.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Class / Grade *</label>
                      <select
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="Class 8">Class 8</option>
                        <option value="Class 9">Class 9</option>
                        <option value="Class 10">Class 10</option>
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Board *</label>
                      <select
                        value={newBoard}
                        onChange={(e) => setNewBoard(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                        <option value="UP_STATE">UP / State Board</option>
                        <option value="OTHER">Other Board</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">School Name</label>
                      <input
                        type="text"
                        placeholder="e.g. St. Joseph's College"
                        value={newSchool}
                        onChange={(e) => setNewSchool(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Preferred Program / Course *</label>
                      <select
                        value={newCourseSlug}
                        onChange={(e) => setNewCourseSlug(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      >
                        {INITIAL_SKILLVERSE_COURSES.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.title} ({c.gradeCategory})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Preferred Package</label>
                      <select
                        value={newPackageId}
                        onChange={(e) => setNewPackageId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      >
                        {INITIAL_ACADEMIC_PACKAGES.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ₹{p.monthlyPriceInr}/mo
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Competitive Add-On</label>
                      <select
                        value={newAddonId}
                        onChange={(e) => setNewAddonId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="">None (Base Only)</option>
                        {INITIAL_COMPETITIVE_ADDONS.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title} (+₹{a.monthlyAddonPriceInr}/mo)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Delivery Mode</label>
                      <select
                        value={newDeliveryMode}
                        onChange={(e) => setNewDeliveryMode(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="HYBRID">Hybrid (Center + Live)</option>
                        <option value="OFFLINE">Offline (Civil Lines Center)</option>
                        <option value="ONLINE">Online Interactive Live</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Initial Stage</label>
                      <select
                        value={newInitialStage}
                        onChange={(e) => setNewInitialStage(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      >
                        {STAGES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Next Follow-Up Date</label>
                      <input
                        type="date"
                        value={newInitialFollowUpDate}
                        onChange={(e) => setNewInitialFollowUpDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Demo Scheduled Date (if applicable)</label>
                      <input
                        type="date"
                        value={newDemoDate}
                        onChange={(e) => setNewDemoDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Counselor Discussion Note</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Student interested in Maths + Science Foundation, requested weekend batch..."
                      value={newInitialNotes}
                      onChange={(e) => setNewInitialNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddLeadOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createDirectLeadMutation.isPending}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#0077FF] hover:brightness-105 text-white font-bold disabled:opacity-50 shadow-sm"
                    >
                      {createDirectLeadMutation.isPending ? "Creating Lead..." : "Save Admission Lead"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 2: LEAD DETAIL & FOLLOW-UP TIMELINE DIALOG */}
          {selectedLeadForDetail && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700 text-sm">
                        {selectedLeadForDetail.referenceNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[10px]">
                        {selectedLeadForDetail.stage}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mt-1">
                      {selectedLeadForDetail.studentName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Parent: {selectedLeadForDetail.parentName} • Enquired on{" "}
                      {new Date(selectedLeadForDetail.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLeadForDetail(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Instant Actions Bar */}
                {(() => {
                  const cleanPhone = selectedLeadForDetail.phone.replace(/\D/g, "").slice(-10);
                  const waMsg = encodeURIComponent(
                    `Hello ${selectedLeadForDetail.parentName}, greetings from SLG SKILLVERSE (SoftLab Global)! We received ${selectedLeadForDetail.studentName}'s enquiry for ${selectedLeadForDetail.preferredCourseSlug}. Would you like to schedule a free demo session or discuss curriculum details?`
                  );
                  return (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`tel:+91${cleanPhone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold shadow-xs hover:bg-blue-700"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Call +91-{cleanPhone}
                        </a>
                        <a
                          href={`https://wa.me/91${cleanPhone}?text=${waMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#16A34A] text-white font-bold shadow-xs hover:bg-[#15803D]"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Message
                        </a>
                        <a
                          href={`mailto:${selectedLeadForDetail.email}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                        >
                          <Mail className="w-3.5 h-3.5" /> Send Email
                        </a>
                      </div>

                      {/* Convert to Direct Enrolled Student Button */}
                      {!selectedLeadForDetail.enrolledStudentId && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Convert ${selectedLeadForDetail.studentName} into an Active Enrolled Student now?`)) {
                              updateStageMutation.mutate({
                                referenceNumber: selectedLeadForDetail.referenceNumber,
                                stage: "ACTIVE_STUDENT",
                              });
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Convert to Enrolled Student
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Profile Data Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Class & Board</span>
                    <span className="font-extrabold text-slate-800">
                      {selectedLeadForDetail.currentClass} • {selectedLeadForDetail.board}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">School</span>
                    <span className="font-extrabold text-slate-800 truncate block">
                      {selectedLeadForDetail.schoolName || "Not specified"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Course</span>
                    <span className="font-extrabold text-blue-700 truncate block">
                      {selectedLeadForDetail.preferredCourseSlug}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Package</span>
                    <span className="font-extrabold text-slate-800">
                      {selectedLeadForDetail.preferredPackageId || "None"}
                    </span>
                  </div>
                </div>

                {/* Log Follow-up & Change Stage */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-3 text-xs">
                  <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" /> Log Follow-Up Note & Update Stage
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Update Pipeline Stage</label>
                      <select
                        value={detailStageUpdate}
                        onChange={(e) => setDetailStageUpdate(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      >
                        {STAGES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Next Follow-Up Due Date</label>
                      <input
                        type="date"
                        value={nextFollowUpDate}
                        onChange={(e) => setNextFollowUpDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Discussion Note / Call Summary</label>
                    <textarea
                      rows={2}
                      placeholder="Type details of conversation with student or parent..."
                      value={followUpNoteText}
                      onChange={(e) => setFollowUpNoteText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!followUpNoteText.trim() || addFollowUpNoteMutation.isPending}
                      onClick={() => {
                        addFollowUpNoteMutation.mutate({
                          referenceNumber: selectedLeadForDetail.referenceNumber,
                          note: followUpNoteText.trim(),
                          nextFollowUpDate: nextFollowUpDate || undefined,
                          stage: detailStageUpdate,
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold"
                    >
                      {addFollowUpNoteMutation.isPending ? "Logging..." : "Log Note & Save Stage"}
                    </button>
                  </div>
                </div>

                {/* Follow-Up History Timeline */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> Follow-Up Timeline & Historical Notes
                  </h4>
                  {selectedLeadForDetail.followUpHistory && selectedLeadForDetail.followUpHistory.length > 0 ? (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {selectedLeadForDetail.followUpHistory.map((h, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-bold text-slate-700">{h.actorName}</span>
                            <span>
                              {new Date(h.timestamp).toLocaleString("en-IN", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                          <p className="text-slate-800 font-medium">{h.note}</p>
                          {h.stage && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-bold">
                              Stage: {h.stage}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : selectedLeadForDetail.followUpNotes ? (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <p className="text-slate-800">{selectedLeadForDetail.followUpNotes}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No previous notes logged for this enquiry.</p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Permanently delete lead ${selectedLeadForDetail.referenceNumber}?`)) {
                        deleteEnquiryMutation.mutate({
                          referenceNumber: selectedLeadForDetail.referenceNumber,
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLeadForDetail(null)}
                    className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDENTS, BATCHES & TEACHER PORTAL */}
      {activeTab === "students_teacher" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Teacher Desk: Mark Student Attendance
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Student Enrollment Code *
                </label>
                <input
                  type="text"
                  placeholder="SV-STU-2026-101"
                  value={attEnrollmentCode}
                  onChange={(e) => setAttEnrollmentCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject / Topic *</label>
                <input
                  type="text"
                  value={attSubject}
                  onChange={(e) => setAttSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Attendance Status</label>
                <select
                  value={attStatus}
                  onChange={(e) =>
                    setAttStatus(e.target.value as "PRESENT" | "ABSENT" | "LATE")
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>
              <button
                type="button"
                disabled={!attEnrollmentCode || markAttendanceMutation.isPending}
                onClick={() =>
                  markAttendanceMutation.mutate({
                    enrollmentCode: attEnrollmentCode,
                    date: new Date().toISOString().slice(0, 10),
                    subject: attSubject,
                    status: attStatus,
                  })
                }
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Record Attendance Entry
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Active Enrolled Students ({students.length})
            </h2>
            {students.length === 0 ? (
              <p className="text-xs text-slate-500">
                Move any enquiry in the Admissions tab to <strong>ENROLLMENT</strong> or{" "}
                <strong>ACTIVE_STUDENT</strong> to generate a Student Profile & Parent PIN.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-700">
                        {s.enrollmentCode}
                      </span>{" "}
                      • <strong>{s.studentName}</strong> ({s.currentClass})
                      <div className="text-slate-500 mt-0.5">
                        Parent: {s.parentName} ({s.parentPhone}) | Batch: {s.batchCode}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">
                        Attendance: {s.attendancePercent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Teacher Descriptive Quiz Evaluation & Batch Manager */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h3 className="font-extrabold text-slate-900">
                  Teacher Desk: Grade Descriptive Quiz Submissions (
                  {(quizAttempts || []).filter((q: any) => q.overallStatus === "PENDING_TEACHER_REVIEW").length}{" "}
                  Pending)
                </h3>
                {(quizAttempts || []).length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {(quizAttempts || []).map((qa: any) => (
                      <div
                        key={qa.attemptId}
                        onClick={() => setGradeAttemptId(qa.attemptId)}
                        className="p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-blue-400"
                      >
                        <div className="flex justify-between font-bold">
                          <span className="font-mono text-blue-700">{qa.attemptId}</span>
                          <span>{qa.overallStatus}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {qa.studentName || qa.enrollmentCode || "Guest"} • Score:{" "}
                          {qa.totalAwardedMarks}/{qa.totalMaxMarks}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Attempt ID (e.g. SV-QZ-...)"
                  value={gradeAttemptId}
                  onChange={(e) => setGradeAttemptId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={gradeMarks}
                    onChange={(e) => setGradeMarks(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Faculty feedback..."
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <button
                  type="button"
                  disabled={!gradeAttemptId || gradeQuizMutation.isPending}
                  onClick={() =>
                    gradeQuizMutation.mutate({
                      attemptId: gradeAttemptId,
                      descriptiveMarksAwarded: gradeMarks,
                      teacherFeedback: gradeFeedback,
                    })
                  }
                  className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Save Descriptive Marks & Feedback
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h3 className="font-extrabold text-slate-900">
                  Batch & Faculty Allocation ({(batches || []).length} Batches)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Batch Code"
                    value={batchCodeEdit}
                    onChange={(e) => setBatchCodeEdit(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Faculty Name"
                    value={batchTeacherEdit}
                    onChange={(e) => setBatchTeacherEdit(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Batch Title"
                  value={batchTitleEdit}
                  onChange={(e) => setBatchTitleEdit(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
                <input
                  type="text"
                  placeholder="Schedule"
                  value={batchScheduleEdit}
                  onChange={(e) => setBatchScheduleEdit(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
                <button
                  type="button"
                  onClick={() =>
                    upsertBatchMutation.mutate({
                      batchCode: batchCodeEdit,
                      title: batchTitleEdit,
                      teacherName: batchTeacherEdit,
                      schedule: batchScheduleEdit,
                    })
                  }
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-blue-700 text-white font-bold"
                >
                  Create / Update Batch & Faculty
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FEE INVOICES & RECEIPTS */}
      {activeTab === "finance_fees" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">
            Student Fee Invoices, Installments & Verified Receipts
          </h2>
          {invoices.length === 0 ? (
            <p className="text-xs text-slate-500">No invoices generated yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                    <th className="py-3 px-3 font-bold">Invoice No</th>
                    <th className="py-3 px-3 font-bold">Student ID & Name</th>
                    <th className="py-3 px-3 font-bold">Itemized Breakdown</th>
                    <th className="py-3 px-3 font-bold">Total Payable</th>
                    <th className="py-3 px-3 font-bold">Status & Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 px-3 font-mono font-bold">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold">{inv.studentName}</div>
                        <div className="font-mono text-slate-500">{inv.studentId}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        Pkg: ₹{inv.packageMonthlyAmountInr} | Add-On: ₹{inv.addonMonthlyAmountInr}{" "}
                        | Reg+Kit: ₹{inv.admissionFeeInr + inv.learningKitFeeInr}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-slate-900">
                        ₹{inv.totalPayableInr.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            inv.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {inv.status}
                        </span>
                        {inv.receiptNumber && (
                          <div className="font-mono text-[11px] text-emerald-700 mt-0.5">
                            {inv.receiptNumber}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CERTIFICATES & VERIFICATION */}
      {activeTab === "certificates" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Issue Completion Certificate
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student ID *</label>
                <input
                  type="text"
                  placeholder="SV-STU-2026-101"
                  value={certStudentId}
                  onChange={(e) => setCertStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  value={certStudentName}
                  onChange={(e) => setCertStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class / Grade *</label>
                <input
                  type="text"
                  value={certGrade}
                  onChange={(e) => setCertGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Course Completed *</label>
                <input
                  type="text"
                  value={certCourseTitle}
                  onChange={(e) => setCertCourseTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <button
                type="button"
                disabled={!certStudentId || !certStudentName || issueCertMutation.isPending}
                onClick={() =>
                  issueCertMutation.mutate({
                    studentId: certStudentId,
                    studentName: certStudentName,
                    classGrade: certGrade,
                    courseTitle: certCourseTitle,
                  })
                }
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                Issue Verifiable Certificate
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Issued Certificates ({certificates.length})
            </h2>
            <div className="space-y-3 text-xs">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-mono font-bold text-blue-700">
                      {cert.certificateNumber} ({cert.status})
                    </div>
                    <div className="font-bold text-slate-900">
                      {cert.studentName} — {cert.courseTitle}
                    </div>
                    <Link
                      href={`/skillverse/verify/${cert.certificateNumber}`}
                      target="_blank"
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Open Public Verification Page →
                    </Link>
                  </div>
                  {cert.status === "ISSUED" && (
                    <button
                      type="button"
                      onClick={() =>
                        revokeCertMutation.mutate({
                          certificateNumber: cert.certificateNumber,
                          reason: "Administrative revocation",
                        })
                      }
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ADMIN CMS & SEO */}
      {activeTab === "cms_seo" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Homepage Content, Contact Details & SEO Configuration
            </h2>
            <button
              type="button"
              onClick={() => saveCmsMutation.mutate(currentCms)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              <Save className="w-4 h-4" /> Save CMS & SEO
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hero Headline</label>
              <input
                type="text"
                value={currentCms.heroHeadline}
                onChange={(e) => setCmsDraft({ ...currentCms, heroHeadline: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={currentCms.contactPhone}
                onChange={(e) => setCmsDraft({ ...currentCms, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Hero Subheadline</label>
              <textarea
                rows={2}
                value={currentCms.heroSubheadline}
                onChange={(e) => setCmsDraft({ ...currentCms, heroSubheadline: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Campus Address</label>
              <input
                type="text"
                value={currentCms.contactAddress}
                onChange={(e) => setCmsDraft({ ...currentCms, contactAddress: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-extrabold text-slate-900">
                Course Catalogue Manager (No-Code Price & Status Control)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course Slug</label>
                  <input
                    type="text"
                    value={courseSlugEdit}
                    onChange={(e) => setCourseSlugEdit(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={courseStatusEdit}
                    onChange={(e) => setCourseStatusEdit(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course Title</label>
                  <input
                    type="text"
                    value={courseTitleEdit}
                    onChange={(e) => setCourseTitleEdit(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Fee (₹)</label>
                  <input
                    type="number"
                    value={courseFeeEdit}
                    onChange={(e) => setCourseFeeEdit(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  upsertCourseMutation.mutate({
                    slug: courseSlugEdit,
                    title: courseTitleEdit,
                    monthlyFeeInr: courseFeeEdit,
                    status: courseStatusEdit,
                  })
                }
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-700 text-white font-bold"
              >
                Update / Publish Course
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-extrabold text-slate-900">
                Monthly Package Fee Manager (Classes 8–12)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Package ID</label>
                  <select
                    value={pkgIdEdit}
                    onChange={(e) => setPkgIdEdit(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  >
                    <option value="PKG-1-STARTER">PKG-1-STARTER (₹1,499/mo)</option>
                    <option value="PKG-2-EXCELLENCE">PKG-2-EXCELLENCE (₹2,499/mo)</option>
                    <option value="PKG-3-FUTUREREADY">PKG-3-FUTUREREADY (₹3,499/mo)</option>
                    <option value="PKG-4-SENIOR-ACADEMIC">PKG-4-SENIOR-ACADEMIC (₹2,999/mo)</option>
                    <option value="PKG-5-SENIOR-FUTUREREADY">PKG-5-SENIOR-FUTUREREADY (₹3,999/mo)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Fee (₹)</label>
                  <input
                    type="number"
                    value={pkgFeeEdit}
                    onChange={(e) => setPkgFeeEdit(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  upsertPackageMutation.mutate({
                    id: pkgIdEdit,
                    monthlyFeeInr: pkgFeeEdit,
                  })
                }
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-700 text-white font-bold"
              >
                Update Package Monthly Fee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ANALYTICS, NOTIFICATIONS & SECURITY AUDIT LOGS */}
      {activeTab === "analytics_audit" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900">
              Privacy-Safe Conversion Events ({analyticsEvents.length})
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {analyticsEvents.map((ev: any, i: number) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-blue-700">{ev.eventType}</div>
                  <div className="text-[11px] text-slate-500">
                    {ev.courseSlug || "general"} • {new Date(ev.timestamp).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900">
              Provider Notification Queue ({notifications.length})
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {notifications.map((n: any, i: number) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">
                    {n.type} ({n.channel})
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold">{n.status}</div>
                  <div className="text-[10px] text-slate-400">
                    Ref: {n.referenceNumber} • To: {n.recipientMasked}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900">
              Security & Administrative Audit Trail ({auditLogs.length})
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {auditLogs.map((a: any, i: number) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">{a.action}</div>
                  <div className="text-slate-600">{a.details}</div>
                  <div className="text-[10px] text-slate-400">
                    Actor: {a.actor} • {new Date(a.timestamp).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
