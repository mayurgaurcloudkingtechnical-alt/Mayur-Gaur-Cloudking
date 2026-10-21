"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api as trpc } from "@/lib/trpc/react";
import type { SkillverseAdmissionStage } from "@/server/services/skillverse.service";
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
  const [activeTab, setActiveTab] = useState<TabId>("admissions");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
  const { data, isLoading, error } = trpc.skillverse.getAdminDashboardData.useQuery();

  const updateStageMutation = trpc.skillverse.updateEnquiryStage.useMutation({
    onSuccess: (updated) => {
      utils.skillverse.getAdminDashboardData.invalidate();
      setToastMsg(
        `Updated ${updated.referenceNumber} to ${updated.stage}${
          updated.enrolledStudentId ? ` (Enrolled: ${updated.enrolledStudentId})` : ""
        }`
      );
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
      utils.skillverse.getCatalogueConfig.invalidate();
      setToastMsg("Course configuration updated without code changes.");
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  const upsertPackageMutation = trpc.skillverse.upsertPackage.useMutation({
    onSuccess: () => {
      utils.skillverse.getCatalogueConfig.invalidate();
      setToastMsg("Package pricing updated.");
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
    notifications,
    analyticsEvents,
    auditLogs,
    metrics,
    cms,
  } = data;

  const currentCms = cmsDraft || cms;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#071630] via-[#0B2247] to-[#15803D] rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-lime-300">
            SLG SKILLVERSE — Unified Staff, Teacher & Admin Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Admissions CRM, Teacher LMS, Finance & CMS
          </h1>
          <p className="text-xs text-slate-200 mt-1">
            Real database-backed metrics from the isolated Skillverse PostgreSQL namespace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/skillverse"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
          >
            Public Skillverse Site
          </Link>
          <a
            href="/api/skillverse/health"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-lime-200 text-xs font-bold"
          >
            Health & Readiness JSON
          </a>
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

      {/* TAB 1: 11-STAGE ADMISSIONS CRM */}
      {activeTab === "admissions" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">
            Skillverse Admissions Pipeline (Enquiry → Demo → Assessment → Consent → Payment →
            Enrollment → Active Student)
          </h2>
          {enquiries.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No enquiries recorded yet. Submit a test enquiry on{" "}
              <code className="text-blue-600">/skillverse/admissions</code> to see it live here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                    <th className="py-3 px-3 font-bold">Ref No</th>
                    <th className="py-3 px-3 font-bold">Student & Parent</th>
                    <th className="py-3 px-3 font-bold">Class & Course</th>
                    <th className="py-3 px-3 font-bold">DPDP Consent</th>
                    <th className="py-3 px-3 font-bold">Pipeline Stage</th>
                    <th className="py-3 px-3 font-bold">Enrolled ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {enquiries.map((enq) => (
                    <tr key={enq.id}>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        {enq.referenceNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{enq.studentName}</div>
                        <div className="text-slate-500">
                          Parent: {enq.parentName} ({enq.phone})
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold">
                          {enq.currentClass} • {enq.board}
                        </div>
                        <div className="text-slate-500">{enq.preferredCourseSlug}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          CONSENT VERIFIED
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={enq.stage}
                          onChange={(e) =>
                            updateStageMutation.mutate({
                              referenceNumber: enq.referenceNumber,
                              stage: e.target.value as SkillverseAdmissionStage,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs"
                        >
                          {STAGES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        {enq.enrolledStudentId || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
