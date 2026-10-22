"use client";

import React, { useState, useMemo, Component, type ErrorInfo, type ReactNode } from "react";
import Link from "next/link";
import { api as trpc } from "@/lib/trpc/react";
import { SkillverseAuthForm } from "@/components/skillverse/skillverse-auth-form";
import type {
  SkillverseAdmissionStage,
  SkillverseEnquiryRecord,
  SkillverseCredentialsCard,
  SkillverseStaffCredentialRecord,
  SkillverseLiveClassSessionRecord,
} from "@/server/services/skillverse.service";
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
  Video,
  Key,
  Copy,
  Check,
  Share2,
  PlayCircle,
  Radio,
  Eye,
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

export type TabId =
  | "admissions"
  | "live_studio"
  | "staff_governance"
  | "students_teacher"
  | "finance_fees"
  | "certificates"
  | "cms_seo"
  | "analytics_audit";

export interface SkillverseAdminPortalProps {
  initialTab?: TabId;
  portalMode?: "crm" | "lms" | "all";
}

export function SkillverseAdminPortal({
  initialTab,
  portalMode = "all",
}: SkillverseAdminPortalProps = {}) {
  const { data: staffUser } = trpc.skillverse.getCurrentStaffSession.useQuery(undefined, {
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const defaultTab: TabId =
    initialTab || (portalMode === "crm" ? "admissions" : portalMode === "lms" ? "live_studio" : "admissions");
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      const { signOut } = await import("next-auth/react");
      await signOut({ callbackUrl: "/skillverse/staff-login" });
    } catch {
      window.location.href = "/api/auth/signout";
    }
  };

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

  // Instant Admission Credentials Card Modal
  const [credentialsCardModal, setCredentialsCardModal] = useState<SkillverseCredentialsCard | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Higher Authority Staff Provisioning Modal & Form
  const [isProvisionStaffOpen, setIsProvisionStaffOpen] = useState(false);
  const [staffFullName, setStaffFullName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState<
    "SUPER_ADMIN" | "DIRECTOR" | "SKILLVERSE_ADMIN" | "FACULTY" | "COUNSELOR" | "ACADEMIC_COORDINATOR"
  >("FACULTY");
  const [staffDepartment, setStaffDepartment] = useState("Academics & Faculty");
  const [staffAccessKey, setStaffAccessKey] = useState("");

  // In-Platform Live Studio & YouTube Automation Form
  const [isScheduleClassOpen, setIsScheduleClassOpen] = useState(false);
  const [liveTitle, setLiveTitle] = useState("");
  const [liveSubject, setLiveSubject] = useState("Mathematics Foundation");
  const [liveGrade, setLiveGrade] = useState("Class 10");
  const [liveModuleName, setLiveModuleName] = useState("Module 1 - Quadratic Equations");
  const [liveTopic, setLiveTopic] = useState("Mastering Standard Forms & Factorization");
  const [liveBatchCode, setLiveBatchCode] = useState("SV-2026-X-A");
  const [liveTeacherName, setLiveTeacherName] = useState("Senior Math Faculty");
  const [liveStartTime, setLiveStartTime] = useState("");
  const [previewYouTubeJob, setPreviewYouTubeJob] = useState<any | null>(null);

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

  // Higher Authority Staff mutations
  const provisionStaffMutation = trpc.skillverse.provisionStaffCredential.useMutation({
    onSuccess: (res) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      setIsProvisionStaffOpen(false);
      setStaffFullName("");
      setStaffEmail("");
      setStaffAccessKey("");
      setToastMsg(`Provisioned staff access for ${res.fullName} (${res.email}) as ${res.role}.`);
      setTimeout(() => setToastMsg(null), 4000);
    },
    onError: (err) => {
      setToastMsg(`Failed to provision staff: ${err.message}`);
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const revokeStaffMutation = trpc.skillverse.revokeStaffCredential.useMutation({
    onSuccess: (res) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      setToastMsg(`Staff access for ${res.email} updated to ${res.status}.`);
      setTimeout(() => setToastMsg(null), 4000);
    },
    onError: (err) => {
      setToastMsg(`Error: ${err.message}`);
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  // Live Studio & YouTube mutations
  const scheduleLiveClassMutation = trpc.skillverse.createOrScheduleLiveClass.useMutation({
    onSuccess: (session) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      setIsScheduleClassOpen(false);
      setLiveTitle("");
      setToastMsg(`Live Classroom session ${session.sessionCode} scheduled.`);
      setTimeout(() => setToastMsg(null), 4000);
    },
    onError: (err) => {
      setToastMsg(`Error scheduling class: ${err.message}`);
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const endLiveClassMutation = trpc.skillverse.endLiveClassAndPublishToYouTube.useMutation({
    onSuccess: (res) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      setToastMsg(
        `Class session ended! YouTube publication package prepared for Channel UCat1xHXxCdog_mWkEBA5jMQ.`
      );
      setTimeout(() => setToastMsg(null), 5000);
    },
    onError: (err) => {
      setToastMsg(`Error ending class: ${err.message}`);
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

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
      if ((updated as any).credentialsCard) {
        setCredentialsCardModal((updated as any).credentialsCard);
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
      if ((updated as any).credentialsCard) {
        setCredentialsCardModal((updated as any).credentialsCard);
      }
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
      <div className="max-w-xl mx-auto px-4 py-12">
        <SkillverseAuthForm
          title="SLG SKILLVERSE Academic & Leadership Login"
          subtitle={
            portalMode === "crm"
              ? "Admissions CRM & Pipeline Desk"
              : portalMode === "lms"
              ? "Academic LMS & Live Classroom Hub"
              : "Staff, Teacher & Admin Command Center"
          }
          onSuccessCallback={() => {
            refetch();
          }}
        />
      </div>
    );
  }

  // Check if non-higher-authority staff has not yet been provisioned
  if (staffUser && staffUser.canAccessSkillverse === false) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-amber-200 p-8 shadow-xl space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            Skillverse Staff Authorization Required
          </span>
          <h1 className="text-2xl font-black text-slate-900">
            Higher Authority Access Provisioning Needed
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            You are signed in as <strong>{staffUser.name}</strong> ({staffUser.roleCode}).
            According to Skillverse governance, Higher Authorities (<strong>Manager</strong>, <strong>Admin</strong>, <strong>Director</strong>, or <strong>Super Admin</strong>)
            can log into both SoftLab Global and Skillverse using their same credentials.
            All other staff and faculty profiles must be provisioned through leadership.
          </p>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 space-y-1">
            <div className="font-bold text-slate-900">Next Steps:</div>
            <div>• Contact your Manager, Director, or Super Admin to provision your Skillverse Staff Credential.</div>
            <div>• If you hold higher authority credentials, please sign in with that account.</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              Sign Out / Switch Account
            </button>
            <Link
              href="/skillverse"
              className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs"
            >
              Back to Public Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const enquiries = data.enquiries || [];
  const students = data.students || [];
  const invoices = data.invoices || [];
  const certificates = data.certificates || [];
  const assessments = data.assessments || [];
  const quizAttempts = data.quizAttempts || [];
  const batches = data.batches || [];
  const notifications = data.notifications || [];
  const analyticsEvents = data.analyticsEvents || [];
  const auditLogs = data.auditLogs || [];
  const metrics = {
    totalEnquiries: data?.metrics?.totalEnquiries ?? 0,
    demoBookingsCount: data?.metrics?.demoBookingsCount ?? 0,
    activeStudentsCount: data?.metrics?.activeStudentsCount ?? 0,
    conversionRatePercent: data?.metrics?.conversionRatePercent ?? 0,
    paidRevenueInr: data?.metrics?.paidRevenueInr ?? 0,
    pendingFeeInr: data?.metrics?.pendingFeeInr ?? 0,
    certificatesIssuedCount: data?.metrics?.certificatesIssuedCount ?? 0,
  };
  const cms = data.cms;

  const currentCms = cmsDraft || cms;

  const filteredEnquiries = useMemo(() => {
    return (enquiries || []).filter((enq) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (enq.studentName ? enq.studentName.toLowerCase().includes(q) : false) ||
        (enq.parentName ? enq.parentName.toLowerCase().includes(q) : false) ||
        (enq.phone ? enq.phone.includes(q) : false) ||
        (enq.email ? enq.email.toLowerCase().includes(q) : false) ||
        (enq.referenceNumber ? enq.referenceNumber.toLowerCase().includes(q) : false) ||
        (enq.schoolName ? enq.schoolName.toLowerCase().includes(q) : false);

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
            <Sparkles className="w-3.5 h-3.5 text-lime-300" />
            {portalMode === "crm"
              ? "SLG SKILLVERSE — Admissions CRM & Enrolment Desk"
              : portalMode === "lms"
              ? "SLG SKILLVERSE — Academic LMS & Live Classroom Studio"
              : "SLG SKILLVERSE — Unified Staff, Teacher & Leadership Command Center"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            {portalMode === "crm"
              ? "Admissions Pipeline & Lead Intelligence"
              : portalMode === "lms"
              ? "Live Studio, YouTube Broadcasting & Batches"
              : "Admissions CRM, Teacher LMS, Finance & CMS"}
          </h1>
          <p className="text-xs text-slate-200 mt-1">
            Dedicated Skillverse database partition — 100% isolated from SoftLab Global corporate records.
          </p>
        </div>

        {/* Staff Session Profile & Actions (With Prominent Logout Button) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#0052CC] text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
              {(staffUser?.name || "S").charAt(0).toUpperCase()}
            </div>
            <div className="text-left text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="truncate max-w-[130px]">{staffUser?.name || "Staff Admin"}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-mono text-[9px] font-bold uppercase">
                  {staffUser?.isHigherAuthority ? `${staffUser?.roleCode} • Higher Authority` : staffUser?.roleCode || "SUPER_ADMIN"}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 truncate max-w-[160px]">
                {staffUser?.email || "staff@softlabglobal.com"}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
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

      {/* Top Mode Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href="/skillverse/crm"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              portalMode === "crm"
                ? "bg-[#16A34A] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Admissions CRM</span>
          </Link>
          <Link
            href="/skillverse/lms"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              portalMode === "lms"
                ? "bg-[#0052CC] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Academic LMS</span>
          </Link>
          <Link
            href="/skillverse/live-classroom"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-2"
          >
            <Video className="w-4 h-4 text-emerald-600" />
            <span>In-House Studio</span>
          </Link>
          <Link
            href="/skillverse/staff-login"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              portalMode === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Full Command Center</span>
          </Link>
        </div>

        <div className="text-[11px] font-bold text-slate-500 pr-2 hidden sm:block">
          Partition: <span className="font-mono text-emerald-700">SKILLVERSE_* Isolated Database</span>
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
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalEnquiries ?? 0}</div>
          <span className="text-[10px] text-blue-600 font-semibold">
            Conversion: {metrics.conversionRatePercent ?? 0}%
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Demo Bookings</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {metrics.demoBookingsCount ?? 0}
          </div>
          <span className="text-[10px] text-slate-500">Scheduled Demos</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Active Students</span>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {metrics.activeStudentsCount ?? 0}
          </div>
          <span className="text-[10px] text-slate-500">Enrolled & Linked</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Paid Fee Revenue</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{(metrics.paidRevenueInr ?? 0).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-500">Verified Receipts</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Pending Dues</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            ₹{(metrics.pendingFeeInr ?? 0).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-500">Open Invoices</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Certificates</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {metrics.certificatesIssuedCount ?? 0}
          </div>
          <span className="text-[10px] text-slate-500">QR Verifiable</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {(
          portalMode === "crm"
            ? [
                { id: "admissions", label: "11-Stage Admissions CRM", icon: Users },
                { id: "finance_fees", label: "Fee Invoices & Transparent Packages", icon: CreditCard },
                { id: "analytics_audit", label: "Admissions & Pipeline Analytics", icon: BarChart3 },
                { id: "staff_governance", label: "Staff Governance & Security", icon: ShieldCheck },
              ]
            : portalMode === "lms"
            ? [
                { id: "live_studio", label: "Live Classroom & YouTube Studio", icon: Video },
                { id: "students_teacher", label: "Students, Batches & Teacher Portal", icon: GraduationCap },
                { id: "certificates", label: "Certificates & Verification", icon: Award },
                { id: "analytics_audit", label: "LMS Analytics & YouTube Archives", icon: BarChart3 },
                { id: "staff_governance", label: "Faculty Allocation & Security", icon: ShieldCheck },
              ]
            : [
                { id: "admissions", label: "11-Stage Admissions CRM", icon: Users },
                { id: "live_studio", label: "Live Classroom & YouTube Studio", icon: Video },
                { id: "staff_governance", label: "Staff Governance & Security", icon: ShieldCheck },
                { id: "students_teacher", label: "Students, Batches & Teacher Portal", icon: GraduationCap },
                { id: "finance_fees", label: "Fee Invoices & Receipts", icon: CreditCard },
                { id: "certificates", label: "Certificates & Verification", icon: Award },
                { id: "analytics_audit", label: "Analytics, Notifications & Audit", icon: BarChart3 },
              ]
        ).map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as TabId)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                        const cleanPhone = (enq.phone || "").replace(/\D/g, "").slice(-10);
                        const waMsg = encodeURIComponent(
                          `Hello ${enq.parentName || "Parent"}, greetings from SLG SKILLVERSE (SoftLab Global)! We received ${enq.studentName || "Student"}'s enquiry for ${enq.preferredCourseSlug || "Foundation"} (${enq.currentClass || "Class"}). Would you like to schedule a free demo session or discuss academic details?`
                        );
                        return (
                          <tr key={enq.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Ref Number + Timestamp */}
                            <td className="py-3 px-4 align-top">
                              <span className="font-mono font-bold text-blue-700 block">
                                {enq.referenceNumber}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(enq.createdAt || Date.now()).toLocaleDateString("en-IN", {
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
                            const cleanPhone = (enq.phone || "").replace(/\D/g, "").slice(-10);
                            const waMsg = encodeURIComponent(
                              `Hello ${enq.parentName || "Parent"}, greetings from SLG SKILLVERSE (SoftLab Global)! Regarding ${enq.studentName || "Student"}'s enquiry for ${enq.preferredCourseSlug || "Foundation"}...`
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
                            {c.title} ({c.categoryLabel})
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
                            {a.name} (+₹{a.monthlyAddonPriceInr}/mo)
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

      {/* TAB: IN-PLATFORM LIVE STUDIO & YOUTUBE PIPELINE */}
      {activeTab === "live_studio" && (
        <div className="space-y-6">
          {/* Studio Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Native Live Classroom Studio
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-mono">
                  Zero 3rd-Party Dependencies
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                In-Platform Classroom & YouTube Broadcast Center
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Conduct live classes directly inside Skillverse with digital whiteboard, WebRTC camera/audio,
                screen sharing, and automated publishing to the official YouTube Channel (
                <strong className="text-white font-mono">UCat1xHXxCdog_mWkEBA5jMQ</strong>).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsScheduleClassOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Schedule Live Lecture
              </button>
              <Link
                href="/skillverse/live-classroom?role=FACULTY"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Video className="w-4 h-4" /> Open Faculty Live Studio
              </Link>
            </div>
          </div>

          {/* YouTube Channel Connected Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900">Official YouTube Channel Integration</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    Connected
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  Channel ID: UCat1xHXxCdog_mWkEBA5jMQ | Auto SEO & Playlist Generator
                </p>
              </div>
            </div>
            <a
              href="https://www.youtube.com/channel/UCat1xHXxCdog_mWkEBA5jMQ"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Visit YouTube Channel
            </a>
          </div>

          {/* Sessions List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                Live Class Sessions & YouTube Queue ({data?.liveSessions?.length || 0})
              </h3>
              <span className="text-xs text-slate-500 font-medium">Classes auto-archive with 15+ SEO tags & chapter markers</span>
            </div>

            {data?.liveSessions && data.liveSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.liveSessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          session.status === "LIVE"
                            ? "bg-rose-600 text-white animate-pulse"
                            : session.status === "SCHEDULED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {session.status === "LIVE" ? "🔴 Live Now" : session.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{session.sessionCode}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">{session.topic}</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        {session.subject} • {session.grade} • Batch: <strong className="text-slate-800">{session.targetBatchCode}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Faculty: {session.facultyName}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500 text-[11px]">
                        {new Date(session.scheduledStartTime).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {session.status === "LIVE" ? (
                          <>
                            <Link
                              href={`/skillverse/live-classroom?sessionId=${session.id}&role=FACULTY`}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                            >
                              Enter Studio
                            </Link>
                            <button
                              type="button"
                              onClick={() => endLiveClassMutation.mutate({ sessionCode: session.sessionCode })}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
                            >
                              End & Publish
                            </button>
                          </>
                        ) : session.status === "SCHEDULED" ? (
                          <Link
                            href={`/skillverse/live-classroom?sessionId=${session.id}&role=FACULTY`}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                          >
                            Launch Studio →
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const job = (data?.youtubeJobs || []).find((j: any) => j.sessionId === session.id);
                              setPreviewYouTubeJob({
                                session,
                                job: job || {
                                  videoTitle: `${session.subject}: ${session.topic} | ${session.grade} Complete Masterclass`,
                                  playlistName: `${session.subject} - ${session.moduleName}`,
                                  tags: [
                                    "Skillverse",
                                    "CBSE 2026",
                                    "ICSE Foundation",
                                    session.subject,
                                    session.topic,
                                    session.grade,
                                    "SoftLab Global",
                                    "Board Exam Prep",
                                    "Concept Lecture",
                                    "Live Classroom",
                                  ],
                                  description: `Official SLG Skillverse Lecture by ${session.facultyName}.\n\nChapter Breakdown:\n00:00 - Introduction & Key Formulas\n15:00 - Core Concept Explanation\n35:00 - Solved Exemplar Questions\n50:00 - Doubt Q&A & Summary\n\nAdmissions Helpline: +91-9196596975\nWebsite: https://skillverse.softlabglobal.com`,
                                },
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                          >
                            View YouTube Package
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No live classroom sessions recorded yet. Click "Schedule Live Lecture" above to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: HIGHER AUTHORITY STAFF GOVERNANCE & SECURITY */}
      {activeTab === "staff_governance" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white border border-emerald-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Super Admin & Director Desk
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-mono">
                  Strict Authorization Governance
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Skillverse Staff Governance & Credential Provisioning
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Strict separation from SoftLab Global: No staff, faculty, or counselor can log into Skillverse
                unless explicitly provisioned by a <strong>Super Admin</strong> or <strong>Director</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsProvisionStaffOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Provision New Staff Credential
            </button>
          </div>

          {/* Provisioned Staff Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                Authorized Staff Roster ({data?.staffCredentials?.length || 0})
              </h3>
              <span className="text-xs text-slate-500">Credentials can be instantly provisioned or revoked</span>
            </div>

            {data?.staffCredentials && data.staffCredentials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Staff Member</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Provisioned By</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Governance Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.staffCredentials.map((staff: any) => (
                      <tr key={staff.email} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900">{staff.fullName}</div>
                          <div className="text-slate-500 text-[11px] font-mono">{staff.email}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                            {staff.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-700">{staff.department}</td>
                        <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                          {staff.provisionedBy} • {new Date(staff.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              staff.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : staff.status === "SUSPENDED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {staff.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `Skillverse Staff Login Access:\nPortal: https://skillverse.softlabglobal.com/skillverse/staff-login\nEmail: ${staff.email}\nTemporary Password: ${staff.temporaryPassword || "SV-STAFF-PASS-2026"}`
                              );
                              setToastMsg(`Copied login credentials for ${staff.fullName} to clipboard.`);
                              setTimeout(() => setToastMsg(null), 3500);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                          >
                            Copy Access
                          </button>
                          {staff.status === "ACTIVE" ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Revoke staff credentials for ${staff.fullName} (${staff.email})?`)) {
                                  revokeStaffMutation.mutate({ email: staff.email, status: "REVOKED" });
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition"
                            >
                              Revoke Access
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                revokeStaffMutation.mutate({ email: staff.email, status: "ACTIVE" });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition"
                            >
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No staff credentials provisioned yet. Click "Provision New Staff Credential" to grant authorized access.
              </div>
            )}
          </div>
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

      {/* ========================================================================= */}
      {/* MODAL: INSTANT ADMISSION CREDENTIALS CARD                                */}
      {/* ========================================================================= */}
      {credentialsCardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Official Admission Credentials Card</h3>
                  <p className="text-xs text-slate-500">Generated instantly upon Skillverse admission confirmation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCredentialsCardModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Credential Box */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Student LMS Login Credentials
                </span>
                <span className="text-[11px] font-mono text-slate-400">Batch: {credentialsCardModal.batchCode}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-slate-400 text-[10px] block">Student Enrollment Code (ID)</span>
                  <span className="text-base font-mono font-black text-emerald-300 block select-all">
                    {credentialsCardModal.enrollmentCode}
                  </span>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-slate-400 text-[10px] block">Instant Student Password</span>
                  <span className="text-base font-mono font-black text-amber-300 block select-all">
                    {credentialsCardModal.studentPassword}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1">
                <span>Student Name: <strong className="text-white">{credentialsCardModal.studentName}</strong></span>
                <Link
                  href="/skillverse/student-login"
                  target="_blank"
                  className="text-emerald-400 hover:underline font-bold inline-flex items-center gap-1"
                >
                  Student Portal <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Parent Credential Box */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Parent / Guardian Portal Credentials
                </span>
                <span className="text-[10px] font-bold text-emerald-700">DPDP Consent: VERIFIED</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-emerald-200">
                  <span className="text-slate-400 text-[10px] block">Registered Parent Mobile</span>
                  <span className="text-sm font-semibold text-slate-900 block select-all">
                    {credentialsCardModal.parentPhone}
                  </span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-emerald-200">
                  <span className="text-slate-400 text-[10px] block">Family Access PIN</span>
                  <span className="text-base font-mono font-black text-emerald-700 block select-all">
                    {credentialsCardModal.parentAccessPin}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-emerald-900 flex items-center justify-between pt-1">
                <span>Guardian: <strong>{credentialsCardModal.parentName}</strong></span>
                <Link
                  href="/skillverse/parent-login"
                  target="_blank"
                  className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-1"
                >
                  Parent Portal <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <a
                href={`https://wa.me/${credentialsCardModal.parentPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `🌟 Welcome to SLG SKILLVERSE!\n\nDear ${credentialsCardModal.parentName},\nWe are pleased to confirm admission for ${credentialsCardModal.studentName} (Batch: ${credentialsCardModal.batchCode}).\n\n📚 STUDENT LMS LOGIN:\n• Portal: https://skillverse.softlabglobal.com/skillverse/student-login\n• Enrollment Code: ${credentialsCardModal.enrollmentCode}\n• Password: ${credentialsCardModal.studentPassword}\n\n👨‍👩‍👧 PARENT PROGRESS PORTAL:\n• Portal: https://skillverse.softlabglobal.com/skillverse/parent-login\n• Linked Mobile: ${credentialsCardModal.parentPhone}\n• Family PIN: ${credentialsCardModal.parentAccessPin}\n\nDedicated Helpline: +91-9196596975\nThank you for choosing Skillverse — Powered by SoftLab Global.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition"
              >
                <MessageCircle className="w-4 h-4" /> 1-Click WhatsApp Dispatch
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `SLG SKILLVERSE ADMISSION CREDENTIALS\n\nStudent: ${credentialsCardModal.studentName}\nBatch: ${credentialsCardModal.batchCode}\n\nSTUDENT LOGIN:\nEnrollment Code: ${credentialsCardModal.enrollmentCode}\nPassword: ${credentialsCardModal.studentPassword}\nURL: https://skillverse.softlabglobal.com/skillverse/student-login\n\nPARENT PORTAL:\nGuardian: ${credentialsCardModal.parentName}\nPhone: ${credentialsCardModal.parentPhone}\nAccess PIN: ${credentialsCardModal.parentAccessPin}\nURL: https://skillverse.softlabglobal.com/skillverse/parent-login\n\nHelpline: +91-9196596975`
                  );
                  setCopiedCredentials(true);
                  setTimeout(() => setCopiedCredentials(false), 3000);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center gap-2 transition"
              >
                {copiedCredentials ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copiedCredentials ? "Copied to Clipboard!" : "Copy Full Details"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROVISION NEW STAFF CREDENTIAL                                     */}
      {/* ========================================================================= */}
      {isProvisionStaffOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Provision Staff Access</h3>
                <p className="text-xs text-slate-500">Only Super Admins & Directors can authorize Skillverse staff</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProvisionStaffOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                provisionStaffMutation.mutate({
                  fullName: staffFullName,
                  email: staffEmail,
                  role: staffRole,
                  department: staffDepartment,
                  accessKey: staffAccessKey || undefined,
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={staffFullName}
                  onChange={(e) => setStaffFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rajesh.kumar@softlabglobal.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Role *</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="FACULTY">Faculty / Teacher</option>
                    <option value="COUNSELOR">Admissions Counselor</option>
                    <option value="ACADEMIC_COORDINATOR">Academic Coordinator</option>
                    <option value="SKILLVERSE_ADMIN">Skillverse Admin</option>
                    <option value="DIRECTOR">Director</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department *</label>
                  <input
                    type="text"
                    required
                    value={staffDepartment}
                    onChange={(e) => setStaffDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Custom Access Key <span className="text-slate-400 font-normal">(Optional, auto-generated if blank)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. SV-STAFF-PASS-2026"
                  value={staffAccessKey}
                  onChange={(e) => setStaffAccessKey(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProvisionStaffOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisionStaffMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold"
                >
                  {provisionStaffMutation.isPending ? "Authorizing..." : "Authorize & Issue Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SCHEDULE LIVE LECTURE                                              */}
      {/* ========================================================================= */}
      {isScheduleClassOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Schedule Live Class Lecture</h3>
                <p className="text-xs text-slate-500">In-platform live studio with automated YouTube publishing</p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleClassOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                scheduleLiveClassMutation.mutate({
                  title: liveTitle || `${liveSubject}: ${liveTopic}`,
                  subject: liveSubject,
                  grade: liveGrade,
                  moduleName: liveModuleName,
                  topic: liveTopic,
                  batchCode: liveBatchCode,
                  teacherName: liveTeacherName,
                  scheduledStartTime: liveStartTime || new Date().toISOString(),
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lecture Topic *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mastering Quadratic Equations & Factorization"
                  value={liveTopic}
                  onChange={(e) => setLiveTopic(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={liveSubject}
                    onChange={(e) => setLiveSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class / Grade *</label>
                  <select
                    value={liveGrade}
                    onChange={(e) => setLiveGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Module Name *</label>
                <input
                  type="text"
                  required
                  value={liveModuleName}
                  onChange={(e) => setLiveModuleName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batch Code *</label>
                  <input
                    type="text"
                    required
                    value={liveBatchCode}
                    onChange={(e) => setLiveBatchCode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Faculty Name *</label>
                  <input
                    type="text"
                    required
                    value={liveTeacherName}
                    onChange={(e) => setLiveTeacherName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Scheduled Start Time</label>
                <input
                  type="datetime-local"
                  value={liveStartTime}
                  onChange={(e) => setLiveStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleClassOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleLiveClassMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold"
                >
                  {scheduleLiveClassMutation.isPending ? "Scheduling..." : "Schedule Live Lecture"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW YOUTUBE JOB & SEO PACKAGE                                  */}
      {/* ========================================================================= */}
      {previewYouTubeJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">YouTube SEO & Metadata Package</h3>
                  <p className="text-xs text-slate-500 font-mono">Channel: UCat1xHXxCdog_mWkEBA5jMQ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewYouTubeJob(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Generated SEO Title
                </span>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 select-all">
                  {previewYouTubeJob.job.videoTitle}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Target Playlist
                </span>
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 font-semibold text-indigo-900 font-mono">
                  📂 {previewYouTubeJob.job.playlistName}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  15+ SEO Keyword Tags
                </span>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  {previewYouTubeJob.job.tags.map((t: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Structured Chapter Description
                </span>
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {previewYouTubeJob.job.description}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `TITLE:\n${previewYouTubeJob.job.videoTitle}\n\nPLAYLIST:\n${previewYouTubeJob.job.playlistName}\n\nTAGS:\n${previewYouTubeJob.job.tags.join(", ")}\n\nDESCRIPTION:\n${previewYouTubeJob.job.description}`
                  );
                  setToastMsg("Copied YouTube SEO package to clipboard!");
                  setTimeout(() => setToastMsg(null), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy SEO Package
              </button>
              <button
                type="button"
                onClick={() => setPreviewYouTubeJob(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SkillverseAdminPortalErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SkillverseAdminPortal caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="p-8 rounded-3xl bg-white border border-rose-200 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto font-bold text-xl">
              !
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Staff Portal Refresh Required
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              A temporary interface error occurred. Click below to reload the Staff Portal, or sign in with your SoftLab Global Higher Authority credentials (Manager, Admin, Director, or Super Admin).
            </p>
            {this.state.error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono text-left max-h-32 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex-1 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Reload Portal
              </button>
              <Link
                href="/skillverse/login"
                className="flex-1 px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center"
              >
                Sign In Again
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
