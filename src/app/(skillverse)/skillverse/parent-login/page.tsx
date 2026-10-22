"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api as trpc } from "@/lib/trpc/react";
import {
  ShieldCheck,
  Users,
  Calendar,
  FileText,
  Lock,
  AlertTriangle,
  Loader2,
  LogOut,
  CheckCircle2,
  Phone,
  MessageCircle,
  Video,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Bell,
  HelpCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function SkillverseParentPortalPage() {
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [accessPin, setAccessPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [familyData, setFamilyData] = useState<any | null>(null);
  const [prefSavedMsg, setPrefSavedMsg] = useState<string | null>(null);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [emailReports, setEmailReports] = useState(true);
  const [smsAttendanceAlerts, setSmsAttendanceAlerts] = useState(true);
  const [preferredLanguage, setPreferredLanguage] = useState<"ENGLISH" | "HINDI_ENGLISH">("ENGLISH");
  const [activeTab, setActiveTab] = useState<"attendance" | "classes" | "ptm" | "finance">("attendance");

  const verifyParentMutation = trpc.skillverse.verifyParentPortalAccess.useMutation({
    onSuccess: (data) => {
      setErrorMsg(null);
      setFamilyData(data);
      if (data.student?.communicationPreferences) {
        setWhatsappAlerts(data.student.communicationPreferences.whatsappAlerts);
        setEmailReports(data.student.communicationPreferences.emailReports);
        setSmsAttendanceAlerts(data.student.communicationPreferences.smsAttendanceAlerts);
        setPreferredLanguage(data.student.communicationPreferences.preferredLanguage);
      }
    },
    onError: (err) => {
      setErrorMsg(
        err.message ||
          "Parent verification failed. Access is strictly restricted to your linked child's profile."
      );
    },
  });

  const updatePrefsMutation = trpc.skillverse.updateParentCommunicationPreferences.useMutation({
    onSuccess: () => {
      setPrefSavedMsg("Family communication preferences saved successfully.");
      setTimeout(() => setPrefSavedMsg(null), 3500);
    },
  });

  if (!familyData) {
    return (
      <div className="min-h-[85vh] bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/30 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Brand header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Family-Isolated Academic Portal
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Parent / Guardian Portal</h1>
            <p className="text-sm text-slate-400 mt-2">
              SLG SKILLVERSE — Monitor your ward’s real-time attendance, live classes, performance & fee receipts.
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-2xl p-7 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Secure Parent Sign In</h2>
                <p className="text-xs text-slate-500">Only verified linked guardians can access this profile</p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyParentMutation.mutate({ enrollmentCode, parentPhone, accessPin });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Child's Enrollment Code <span className="text-emerald-600 font-normal">(from Admission Letter)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SV-STU-2026-101"
                  value={enrollmentCode}
                  onChange={(e) => setEnrollmentCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono uppercase text-sm tracking-wide text-slate-900 placeholder:text-slate-400 outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Registered Parent Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">Family Access PIN</label>
                  <span className="text-[11px] text-slate-400">Default: Last 4 digits of phone</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    maxLength={8}
                    placeholder="••••"
                    value={accessPin}
                    onChange={(e) => setAccessPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono text-base tracking-widest text-slate-900 placeholder:text-slate-400 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifyParentMutation.isPending}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
              >
                {verifyParentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Family Authorization...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Open Student Progress Record
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> DPDP Act 2023 Compliant
              </span>
              <a
                href="https://wa.me/919196596975?text=Hello%20Skillverse%20Team%2C%20I%20am%20a%20parent%20and%20need%20help%20logging%20in"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Need Help?
              </a>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/skillverse/student-login"
              className="text-xs text-slate-400 hover:text-white transition inline-flex items-center gap-1"
            >
              Are you a student? <span className="text-emerald-400 font-bold underline">Go to Student LMS →</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { student, invoices = [], certificates = [], liveSessions = [], counselorHotline } = familyData;

  const attendancePercent = student.attendancePercent ?? 92;
  const attendanceColor =
    attendancePercent >= 85 ? "text-emerald-600" : attendancePercent >= 75 ? "text-amber-600" : "text-rose-600";
  const attendanceBg =
    attendancePercent >= 85 ? "bg-emerald-50 border-emerald-200" : attendancePercent >= 75 ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200";

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Top Banner Hero */}
      <div className="bg-gradient-to-r from-slate-950 via-[#071630] to-emerald-950 text-white border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Parent: {student.parentName || "Guardian"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-mono">
                  ID: {student.enrollmentCode}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {student.studentName}’s Academic Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-3">
                <span>Class: <strong className="text-white">{student.currentClass}</strong></span>
                <span>•</span>
                <span>Board: <strong className="text-white">{student.board}</strong></span>
                <span>•</span>
                <span>Batch: <strong className="text-white">{student.batchCode}</strong></span>
                <span>•</span>
                <span>Mode: <strong className="text-emerald-400">{student.deliveryMode || "HYBRID"}</strong></span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={counselorHotline?.whatsapp || `https://wa.me/919196596975?text=Hello%20Skillverse%20Counselor`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-700/30 transition"
              >
                <MessageCircle className="w-4 h-4" /> Academic Counselor WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setFamilyData(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition"
              >
                <LogOut className="w-4 h-4" /> Exit
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-3.5 border border-white/10">
              <div className="text-[11px] text-slate-300 font-medium">Overall Attendance</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{attendancePercent}%</div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">Satisfies 75% CBSE/ICSE mandate</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-3.5 border border-white/10">
              <div className="text-[11px] text-slate-300 font-medium">Total Live Lectures</div>
              <div className="text-2xl font-black text-white mt-1">{liveSessions.length} Sessions</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Recorded & archived</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-3.5 border border-white/10">
              <div className="text-[11px] text-slate-300 font-medium">Fee Invoices</div>
              <div className="text-2xl font-black text-amber-300 mt-1">{invoices.length} Issued</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Transparent ledger</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-3.5 border border-white/10">
              <div className="text-[11px] text-slate-300 font-medium">Helpline Support</div>
              <div className="text-sm font-bold text-white mt-2">+91-9196596975</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Dedicated parent counselor</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "attendance"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Calendar className="w-4 h-4" /> Attendance & Progress ({attendancePercent}%)
          </button>
          <button
            onClick={() => setActiveTab("classes")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "classes"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Video className="w-4 h-4" /> Live Lectures & Recordings ({liveSessions.length})
          </button>
          <button
            onClick={() => setActiveTab("ptm")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "ptm"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Users className="w-4 h-4" /> PTM & Parent Consent
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "finance"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Invoices & Receipts ({invoices.length})
          </button>
        </div>

        {/* Tab 1: Attendance & Progress */}
        {activeTab === "attendance" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Attendance Log by Lecture</h2>
                  <p className="text-xs text-slate-500">Every session is verified by faculty attendance registers</p>
                </div>
                <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${attendanceBg} ${attendanceColor}`}>
                  {attendancePercent}% Present
                </div>
              </div>

              {student.attendanceRecords && student.attendanceRecords.length > 0 ? (
                <div className="space-y-2.5">
                  {student.attendanceRecords.map((rec: any, i: number) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-white transition"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 text-xs">{rec.subject}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> {rec.date}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                          rec.status === "PRESENT"
                            ? "bg-emerald-100 text-emerald-800"
                            : rec.status === "LATE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No attendance records logged yet for this batch.
                </div>
              )}
            </div>

            {/* Attendance Analytics & Guidance */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-3xl p-6 shadow-md space-y-3">
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-200">
                  Performance Recommendation
                </span>
                <h3 className="text-lg font-black leading-snug">
                  {attendancePercent >= 85
                    ? "Excellent Consistency! 🌟"
                    : attendancePercent >= 75
                    ? "Good Attendance, Maintain Rhythm"
                    : "Attendance Alert: Action Required"}
                </h3>
                <p className="text-xs text-emerald-50/90 leading-relaxed">
                  {attendancePercent >= 85
                    ? `${student.studentName} is attending over 85% of live lectures and doubt clinics. Keep up this momentum for peak board exam results!`
                    : `We recommend regular participation in live doubt-clearing sessions to ensure concept mastery.`}
                </p>
                <div className="pt-2">
                  <a
                    href={counselorHotline?.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow hover:bg-emerald-50 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Chat with Academic Mentor
                  </a>
                </div>
              </div>

              {/* Verified Certificates */}
              {certificates.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="font-extrabold text-sm text-slate-900">Issued Certificates ({certificates.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {certificates.map((cert: any) => (
                      <div key={cert.id} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
                        <div className="font-bold text-slate-900">{cert.courseTitle}</div>
                        <div className="text-[11px] text-slate-500">
                          Cert ID: <span className="font-mono">{cert.certificateNumber}</span> • Grade: {cert.gradeAwarded}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Live Lectures & Recordings */}
        {activeTab === "classes" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Live & Scheduled Lectures</h2>
                <p className="text-xs text-slate-500">
                  Classes are broadcast in-platform via Skillverse Live Studio and archived on the official YouTube channel.
                </p>
              </div>
              <a
                href="https://www.youtube.com/channel/UCat1xHXxCdog_mWkEBA5jMQ"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition"
              >
                <Video className="w-4 h-4 text-rose-600" /> Skillverse YouTube Archive
              </a>
            </div>

            {liveSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveSessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-white transition space-y-3"
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
                      <span className="text-[11px] text-slate-500 font-medium">Batch: {session.targetBatchCode}</span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{session.topic}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {session.subject} • Faculty: <span className="font-semibold text-slate-800">{session.facultyName}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {new Date(session.scheduledStartTime).toLocaleString("en-IN")}
                      </span>
                      {session.status === "LIVE" ? (
                        <Link
                          href={`/skillverse/live-classroom?sessionId=${session.id}&role=STUDENT`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                        >
                          Join Live →
                        </Link>
                      ) : session.youtubeUrl ? (
                        <a
                          href={session.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-rose-600 font-bold hover:underline flex items-center gap-1"
                        >
                          Watch Recording <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">Scheduled</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No active live sessions at this moment. Regular timetable updates will appear here.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: PTM & Parent Preferences */}
        {activeTab === "ptm" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-extrabold text-slate-900">Parent-Teacher Meetings (PTM)</h2>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">1-on-1 Faculty Review</span>
              </div>

              {student.ptmSchedules && student.ptmSchedules.length > 0 ? (
                <div className="space-y-3">
                  {student.ptmSchedules.map((ptm: any) => (
                    <div
                      key={ptm.id}
                      className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1.5"
                    >
                      <div className="flex justify-between font-bold text-xs text-blue-900">
                        <span>{ptm.scheduledDate}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-200/80 text-[10px]">{ptm.status}</span>
                      </div>
                      <div className="font-semibold text-slate-900 text-xs">{ptm.agenda}</div>
                      <div className="text-[11px] text-slate-600">Faculty In-charge: {ptm.teacherName}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No upcoming PTM scheduled yet.
                </div>
              )}

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-black">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> DPDP Act 2023 Consent: VERIFIED
                </div>
                <p className="text-[11px] text-emerald-800">
                  Verified parent/guardian consent is on file for {student.studentName}. Educational data is kept strictly private.
                </p>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Direct Alert Preferences</h2>
              <p className="text-xs text-slate-500">
                Choose how you prefer to receive daily attendance notifications, fee alerts, and PTM reports.
              </p>

              {prefSavedMsg && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {prefSavedMsg}
                </div>
              )}

              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={whatsappAlerts}
                    onChange={(e) => setWhatsappAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">WhatsApp Academic & Fee Alerts</span>
                    <span className="text-[11px] text-slate-500">Instant test scorecard & fee confirmation on WhatsApp</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={emailReports}
                    onChange={(e) => setEmailReports(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Monthly Email Progress Reports</span>
                    <span className="text-[11px] text-slate-500">Detailed subject analysis & syllabus completion tracking</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={smsAttendanceAlerts}
                    onChange={(e) => setSmsAttendanceAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Daily Attendance SMS Alerts</span>
                    <span className="text-[11px] text-slate-500">Instant SMS if your ward is absent or late for a session</span>
                  </div>
                </label>
              </div>

              <button
                type="button"
                disabled={updatePrefsMutation.isPending}
                onClick={() =>
                  updatePrefsMutation.mutate({
                    enrollmentCode: student.enrollmentCode,
                    parentPhone,
                    accessPin,
                    whatsappAlerts,
                    emailReports,
                    smsAttendanceAlerts,
                    preferredLanguage,
                  })
                }
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                {updatePrefsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Update Preferences"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Fee Invoices & Receipts */}
        {activeTab === "finance" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Fee Invoices, Receipts & Balances</h2>
                <p className="text-xs text-slate-500">
                  Official Skillverse tax invoices with transparent itemized fee breakdowns.
                </p>
              </div>
              <div className="text-xs text-slate-500">
                Helpline for fee inquiries: <strong className="text-slate-900">+91-9196596975</strong>
              </div>
            </div>

            {invoices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {invoices.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-emerald-300 transition space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-slate-700">{inv.invoiceNumber}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          inv.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      {inv.packageTitle && (
                        <div className="text-slate-700 font-semibold">{inv.packageTitle}</div>
                      )}
                      {inv.addonTitle && (
                        <div className="text-slate-500 text-[11px]">+ {inv.addonTitle}</div>
                      )}
                      <div className="text-[11px] text-slate-400">
                        Date: {new Date(inv.createdAt || Date.now()).toLocaleDateString("en-IN")}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs text-slate-500">Total Payable:</span>
                      <span className="text-base font-mono font-black text-slate-900">
                        ₹{inv.totalPayableInr.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {inv.receiptNumber && (
                      <div className="text-[11px] text-emerald-700 font-mono bg-emerald-50 p-2 rounded-lg">
                        Receipt: {inv.receiptNumber}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No fee invoices issued yet for this student.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
