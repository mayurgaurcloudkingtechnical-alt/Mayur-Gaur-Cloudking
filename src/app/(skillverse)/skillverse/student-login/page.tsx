"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api as trpc } from "@/lib/trpc/react";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  Award,
  CreditCard,
  Lock,
  AlertTriangle,
  Loader2,
  LogOut,
  Video,
  Radio,
  Sparkles,
  Download,
  ExternalLink,
  Clock,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  PlayCircle,
  Youtube,
  KeyRound,
  Mail,
  User,
} from "lucide-react";
import { SKILLVERSE_YOUTUBE_CHANNEL } from "@/server/services/skillverse.service";

export default function SkillverseStudentPortalPage() {
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [loginMethod, setLoginMethod] = useState<"PASSWORD" | "EMAIL">("PASSWORD");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [portalData, setPortalData] = useState<any | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  // Active student tab
  const [activeTab, setActiveTab] = useState<"live" | "curriculum" | "quiz" | "youtube" | "attendance" | "fees">("live");

  // Interactive Multi-Type Quiz Runner (MCQ + MSQ + Descriptive)
  const [mcqChoice, setMcqChoice] = useState<number>(1);
  const [msqChoices, setMsqChoices] = useState<number[]>([0, 2]);
  const [descriptiveAnswer, setDescriptiveAnswer] = useState<string>("");
  const [quizResult, setQuizResult] = useState<any | null>(null);

  const quizMutation = trpc.skillverse.evaluateQuizAttempt.useMutation({
    onSuccess: (res) => {
      setQuizResult(res);
    },
  });

  const loginMutation = trpc.skillverse.getStudentPortalData.useMutation({
    onSuccess: (data) => {
      setErrorMsg(null);
      setPortalData(data);
    },
    onError: (err) => {
      setErrorMsg(err.message || "Invalid Enrollment Code or Student Password / Email.");
    },
  });

  const handlePayInvoice = async (invoiceNumber: string) => {
    try {
      setPaymentMessage("Initiating verified payment session...");
      const orderResp = await fetch("/api/skillverse/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNumber }),
      });
      const orderJson = await orderResp.json();
      if (!orderResp.ok) {
        setPaymentMessage(orderJson.error || "Could not create order.");
        return;
      }

      if (orderJson.mode === "SANDBOX_PENDING_CREDENTIALS") {
        const verifyResp = await fetch("/api/skillverse/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceNumber,
            sandboxTestToken: `SBX_VERIFY_${orderJson.orderId}`,
          }),
        });
        const verifyJson = await verifyResp.json();
        if (verifyResp.ok && verifyJson.verified) {
          setPaymentMessage(`Payment Verified! Official Receipt: ${verifyJson.invoice.receiptNumber}`);
          loginMutation.mutate({
            enrollmentCode,
            studentEmail: loginMethod === "EMAIL" ? studentEmail : undefined,
            studentPassword: loginMethod === "PASSWORD" ? studentPassword : undefined,
          });
        } else {
          setPaymentMessage(verifyJson.error || "Verification failed.");
        }
      } else {
        setPaymentMessage(`Order ${orderJson.orderId} created. Complete Razorpay checkout to confirm receipt.`);
      }
    } catch (e: any) {
      setPaymentMessage(e?.message || "Payment error.");
    }
  };

  // =========================================================================
  // LOGIN SCREEN
  // =========================================================================
  if (!portalData) {
    return (
      <div className="min-h-[82vh] flex items-center justify-center px-4 py-16 bg-slate-50/50">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#16A34A] to-[#0052CC] text-white flex items-center justify-center shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono uppercase tracking-wider">
              Student Isolated LMS
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900">Student Portal Login</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your Skillverse Student ID (e.g. <span className="font-mono text-blue-600 font-bold">SV-STU-2026-101</span>) and your instant password or registered email.
            </p>
          </div>

          {/* Login Method Toggle */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 text-xs font-bold">
            <button
              type="button"
              onClick={() => setLoginMethod("PASSWORD")}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                loginMethod === "PASSWORD"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> Instant Password
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod("EMAIL")}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                loginMethod === "EMAIL"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Registered Email
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate({
                enrollmentCode,
                studentEmail: loginMethod === "EMAIL" ? studentEmail : undefined,
                studentPassword: loginMethod === "PASSWORD" ? studentPassword : undefined,
              });
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Student Enrollment Code (Student ID) *
              </label>
              <input
                type="text"
                required
                placeholder="SV-STU-2026-101"
                value={enrollmentCode}
                onChange={(e) => setEnrollmentCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono uppercase font-bold focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            {loginMethod === "PASSWORD" ? (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Student LMS Password / Secret Key *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:border-blue-600 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Found on your Skillverse Admission Credentials Letter.
                </span>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Registered Student Email *</label>
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#16A34A] to-[#0052CC] hover:opacity-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Student Profile...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Sign In to Skillverse LMS →
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <Link href="/skillverse/admissions" className="text-blue-600 font-semibold hover:underline">
              New Student? Apply Here
            </Link>
            <Link href="/skillverse/parent-login" className="text-emerald-700 font-semibold hover:underline">
              Family &amp; Parent Portal →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED STUDENT LMS DASHBOARD
  // =========================================================================
  const { student, enrolledCourses, invoices, certificates, liveSessions } = portalData;

  const currentBatchSession = liveSessions?.find(
    (s: any) => s.status === "LIVE" || s.status === "SCHEDULED"
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Hero Student Banner */}
      <div className="bg-gradient-to-r from-[#071630] via-[#0B2247] to-[#15803D] rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#16A34A] to-[#0052CC] border-2 border-white/20 text-white font-black flex items-center justify-center text-2xl shadow-lg shrink-0">
            {student.studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-lime-400/20 text-lime-300 font-mono text-[11px] font-bold">
                ID: {student.enrollmentCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-mono text-[11px] font-bold">
                Batch: {student.batchCode}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-200 text-[11px]">
                {student.deliveryMode}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              Welcome, {student.studentName}
            </h1>
            <p className="text-xs text-slate-200 mt-1">
              {student.currentClass} • {student.board} • {student.schoolName}
            </p>
          </div>
        </div>

        {/* Attendance & Sign Out Action */}
        <div className="flex items-center gap-4">
          <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">
              Attendance
            </span>
            <span className="text-xl font-black text-lime-300 font-mono">
              {student.attendancePercent}%
            </span>
          </div>

          <button
            type="button"
            onClick={() => setPortalData(null)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {paymentMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{paymentMessage}</span>
        </div>
      )}

      {/* Prominent Live Classroom In-Platform Studio Banner */}
      {currentBatchSession && (
        <div className="rounded-3xl p-6 bg-gradient-to-r from-red-950 via-slate-900 to-emerald-950 border-2 border-red-500/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg">
              <Radio className="w-6 h-6 animate-ping" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white font-mono text-[10px] font-black uppercase tracking-wider">
                ⚡ LIVE LECTURE IN PROGRESS
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                {currentBatchSession.subject}: {currentBatchSession.topic}
              </h3>
              <p className="text-xs text-slate-300">
                Faculty: <span className="text-emerald-400 font-bold">{currentBatchSession.teacherName}</span> • Session Code: <span className="font-mono text-cyan-300">{currentBatchSession.sessionCode}</span>
              </p>
            </div>
          </div>

          <Link
            href={`/skillverse/live-classroom?sessionCode=${encodeURIComponent(
              currentBatchSession.sessionCode
            )}&role=STUDENT&name=${encodeURIComponent(student.studentName)}&enrollmentCode=${encodeURIComponent(
              student.enrollmentCode
            )}`}
            className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
          >
            <Video className="w-4 h-4" /> Join Live Classroom Studio →
          </Link>
        </div>
      )}

      {/* Portal Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1 text-xs font-extrabold">
        <button
          type="button"
          onClick={() => setActiveTab("live")}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "live"
              ? "bg-[#071630] text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400" /> Live Classroom Studio
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("curriculum")}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "curriculum"
              ? "bg-[#071630] text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="w-4 h-4 text-blue-400" /> Syllabus &amp; Modules ({enrolledCourses.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("quiz")}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "quiz"
              ? "bg-[#071630] text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-4 h-4 text-cyan-400" /> Multi-Type Quizzes
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("youtube")}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "youtube"
              ? "bg-[#071630] text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Youtube className="w-4 h-4 text-red-500" /> Recorded Lectures &amp; YouTube
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "attendance"
              ? "bg-[#071630] text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-4 h-4 text-lime-400" /> Attendance Log
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("fees")}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "fees"
              ? "bg-[#071630] text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-400" /> Fee Invoices &amp; Receipts
        </button>
      </div>

      {/* Tab 1: Live Classroom Studio Overview */}
      {activeTab === "live" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-600" /> In-Platform Live Classroom Studio
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Skillverse delivers all live lectures directly on this platform using in-browser WebRTC, screen sharing, and an interactive digital whiteboard. No Zoom, Google Meet, or third-party app installations required.
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800">Assigned Cohort Batch</span>
                  <span className="font-mono text-xs font-bold text-blue-700">{student.batchCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800">Interactive Studio URL</span>
                  <Link
                    href={`/skillverse/live-classroom?sessionCode=${encodeURIComponent(
                      currentBatchSession?.sessionCode || "SV-LIVE-FOUNDATION"
                    )}&role=STUDENT&name=${encodeURIComponent(student.studentName)}&enrollmentCode=${encodeURIComponent(
                      student.enrollmentCode
                    )}`}
                    className="font-mono text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    Open Live Studio <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800">Auto Attendance Logging</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ Verified Active
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming Batch Schedule */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Upcoming Academic Class Sessions
              </h3>
              <div className="space-y-3 text-xs">
                {(liveSessions || []).map((sess: any) => (
                  <div
                    key={sess.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {sess.subject}: {sess.topic}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Educator: {sess.teacherName} • Batch: {sess.batchCode}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold text-[10px]">
                        {sess.status}
                      </span>
                      <Link
                        href={`/skillverse/live-classroom?sessionCode=${encodeURIComponent(
                          sess.sessionCode
                        )}&role=STUDENT&name=${encodeURIComponent(
                          student.studentName
                        )}&enrollmentCode=${encodeURIComponent(student.enrollmentCode)}`}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                      >
                        Enter Studio →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Learning Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Academic Standing</h3>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Class Rank / Percentile</span>
                  <span className="text-emerald-700 font-extrabold">Top 5%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="w-[95%] h-full bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full" />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Based on objective quiz scores, descriptive teacher assessments &amp; attendance.
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900">Issued Certificates ({certificates.length})</h3>
              {certificates.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Certificates appear here as you complete each course milestone.
                </p>
              ) : (
                certificates.map((cert: any) => (
                  <div key={cert.id} className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                    <div className="font-bold text-slate-900">{cert.courseTitle}</div>
                    <div className="font-mono text-[10px] text-emerald-700">Ref: {cert.certificateNumber}</div>
                    <Link
                      href={`/skillverse/verify/${cert.certificateNumber}`}
                      className="inline-block text-blue-700 font-bold hover:underline text-[11px] pt-1"
                    >
                      View &amp; Verify Official Certificate →
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Curriculum, Modules & Lesson Notes */}
      {activeTab === "curriculum" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Course Syllabus, Lessons &amp; Revision Worksheets</h2>
              <p className="text-xs text-slate-500">Enrollment-restricted access to official curriculum study materials.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              {enrolledCourses.length} Active Courses
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrolledCourses.map((c: any) => (
              <div key={c.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-600 font-mono tracking-wider">
                      {c.gradeBand}
                    </span>
                    <h3 className="font-black text-slate-900 text-base">{c.title}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                    {c.defaultTimetable}
                  </span>
                </div>

                <div className="space-y-3">
                  {c.modules.map((m: any, i: number) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                      <div className="font-extrabold text-slate-800 flex items-center justify-between">
                        <span>Module {i + 1}: {m.title}</span>
                        <span className="text-[10px] text-emerald-700 font-bold">Syllabus Active</span>
                      </div>
                      <ul className="text-slate-600 pl-4 list-disc space-y-1">
                        {m.lessons.map((l: string, li: number) => (
                          <li key={li}>{l}</li>
                        ))}
                      </ul>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">PDF Study Notes Included</span>
                        <span className="text-blue-600 font-bold hover:underline cursor-pointer">
                          Download Worksheet (PDF) ↓
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Multi-Type Quizzes */}
      {activeTab === "quiz" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Academic &amp; Foundation Unit Assessment</h2>
              <p className="text-xs text-slate-500">Single-Choice MCQ + Multi-Select MSQ + Teacher-Graded Descriptive Responses.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
              Total Max: 15 Marks
            </span>
          </div>

          <div className="space-y-5 text-xs">
            {/* Q1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                Q1: Single-Choice MCQ (5 Marks)
              </span>
              <p className="font-extrabold text-slate-900 text-sm">
                If 3x − 7 = 11, what is the value of 2x + 5?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {["11", "17", "19", "23"].map((opt, idx) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setMcqChoice(idx)}
                    className={`py-2 px-3 rounded-xl border font-bold transition-all cursor-pointer ${
                      mcqChoice === idx
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Q2: Multi-Select MSQ (5 Marks — Choose All Correct)
              </span>
              <p className="font-extrabold text-slate-900 text-sm">
                Select ALL statements that are true about Python data types and sequences:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {[
                  "Lists in Python are mutable sequences",
                  "Tuples can be modified in-place using append()",
                  "Indexing in Python starts at 0",
                  "Dictionaries only allow integer keys",
                ].map((opt, idx) => {
                  const active = msqChoices.includes(idx);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setMsqChoices((prev) =>
                          prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
                        )
                      }
                      className={`p-3 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                        active
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {active ? "✓ " : "○ "} {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q3 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                Q3: Descriptive Response (5 Marks — Faculty Evaluated)
              </span>
              <p className="font-extrabold text-slate-900 text-sm">
                Explain Ohm&apos;s Law with its mathematical formula, and give one real-world application in robotics circuit design:
              </p>
              <textarea
                rows={3}
                value={descriptiveAnswer}
                onChange={(e) => setDescriptiveAnswer(e.target.value)}
                placeholder="Write your step-by-step conceptual answer here for teacher evaluation..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden text-xs"
              />
            </div>

            <button
              type="button"
              disabled={quizMutation.isPending}
              onClick={() =>
                quizMutation.mutate({
                  enrollmentCode: student.enrollmentCode,
                  quizTitle: "Unit 1 Integrated STEM & Coding Quiz",
                  questions: [
                    {
                      id: "q1",
                      type: "MCQ",
                      prompt: "If 3x - 7 = 11, what is 2x + 5?",
                      correctOptionIndex: 1,
                      marks: 5,
                    },
                    {
                      id: "q2",
                      type: "MSQ",
                      prompt: "Select all true Python statements",
                      correctOptionIndices: [0, 2],
                      marks: 5,
                    },
                    {
                      id: "q3",
                      type: "DESCRIPTIVE",
                      prompt: "Explain Ohm's Law and robotics application",
                      marks: 5,
                    },
                  ],
                  responses: [
                    { questionId: "q1", selectedOptionIndex: mcqChoice },
                    { questionId: "q2", selectedOptionIndices: msqChoices },
                    { questionId: "q3", descriptiveAnswer },
                  ],
                })
              }
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {quizMutation.isPending ? "Submitting to Evaluation Engine..." : "Submit Unit Quiz for Evaluation"}
            </button>

            {quizResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                <div className="font-black text-sm">
                  Auto-Graded Objective Score: {quizResult.autoAwardedMarks} / 10 Marks (Total Max: {quizResult.totalMaxMarks})
                </div>
                <div className="text-xs text-slate-700">
                  Status: <span className="font-mono font-bold text-emerald-800">{quizResult.overallStatus}</span>
                  {quizResult.hasDescriptivePending && " • Descriptive Answer forwarded to Academic Faculty for evaluation."}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Recorded Lectures & YouTube Channel Integration */}
      {activeTab === "youtube" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 border border-red-800/40 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                <Youtube className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  Official Skillverse Channel
                </span>
                <h3 className="text-xl font-black mt-0.5">SLG SKILLVERSE YouTube Lecture Hub</h3>
                <p className="text-xs text-slate-300">
                  All live lectures are automatically published here with topic timestamps, chapter markers &amp; subject playlists.
                </p>
              </div>
            </div>

            <a
              href={SKILLVERSE_YOUTUBE_CHANNEL.url}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shrink-0 transition-all cursor-pointer"
            >
              <Youtube className="w-4 h-4" /> Open Official Channel <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="aspect-video rounded-2xl bg-slate-900 flex items-center justify-center relative overflow-hidden border border-slate-800">
                <PlayCircle className="w-10 h-10 text-red-500" />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                  55:20
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                Class 10 Physics
              </span>
              <h4 className="font-black text-slate-900 text-sm">
                Electricity &amp; Ohm&apos;s Law — Complete Concept &amp; Numericals
              </h4>
              <p className="text-[11px] text-slate-500">
                Playlist: Class 10 Foundation • Chapter Markers included
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="aspect-video rounded-2xl bg-slate-900 flex items-center justify-center relative overflow-hidden border border-slate-800">
                <PlayCircle className="w-10 h-10 text-red-500" />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                  48:15
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Coding &amp; AI
              </span>
              <h4 className="font-black text-slate-900 text-sm">
                Python Programming Foundation — Lists, Loops &amp; Functions
              </h4>
              <p className="text-[11px] text-slate-500">
                Playlist: Python Coding &amp; AI Literacy • Chapter Markers included
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="aspect-video rounded-2xl bg-slate-900 flex items-center justify-center relative overflow-hidden border border-slate-800">
                <PlayCircle className="w-10 h-10 text-red-500" />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                  52:40
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                Maths Foundation
              </span>
              <h4 className="font-black text-slate-900 text-sm">
                Quadratic Equations &amp; Graph Analysis — Exam Masterclass
              </h4>
              <p className="text-[11px] text-slate-500">
                Playlist: Classes 8–10 Maths • Chapter Markers included
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Attendance Log */}
      {activeTab === "attendance" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Attendance Log &amp; Lecture Radar</h2>
              <p className="text-xs text-slate-500">Auto-recorded when attending in-platform live classes and physical campus sessions.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-xs">
              Overall: {student.attendancePercent}%
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {student.attendanceRecords.map((r: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">{r.subject}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Date: {r.date} • Verified by: {r.markedBy}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-bold text-xs font-mono ${
                    r.status === "PRESENT"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Fee Invoices & Receipts */}
      {activeTab === "fees" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Itemized Fee Invoices &amp; Receipts</h2>
            <p className="text-xs text-slate-500">Transparent fees breakdown with online Razorpay verification.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {invoices.map((inv: any) => (
              <div key={inv.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-800 text-sm">{inv.invoiceNumber}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-xs ${
                      inv.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>

                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Package:</span>
                    <span className="font-bold text-slate-800">{inv.packageTitle || "Skillverse Academic Excellence"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Date:</span>
                    <span>{inv.dueDate}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Payable:</span>
                    <span className="font-mono text-blue-600">₹{inv.totalPayableInr.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {inv.receiptNumber && (
                  <div className="p-2.5 rounded-xl bg-emerald-100/70 text-emerald-900 font-mono text-[11px] font-bold">
                    Official Receipt: {inv.receiptNumber} (Verified)
                  </div>
                )}

                {inv.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => handlePayInvoice(inv.invoiceNumber)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Pay / Verify Online Now →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
