"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SKILLVERSE_BRAND } from "@/lib/constants/skillverse-data";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  Users,
  Sparkles,
  ArrowRight,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface SkillverseAuthFormProps {
  initialRole?: "staff" | "student" | "parent";
  onSuccessRedirectUrl?: string;
  onSuccessCallback?: () => void;
  title?: string;
  subtitle?: string;
}

export function SkillverseAuthForm({
  initialRole = "staff",
  onSuccessRedirectUrl = "/skillverse/staff-login",
  onSuccessCallback,
  title,
  subtitle,
}: SkillverseAuthFormProps) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<"staff" | "student" | "parent">(initialRole);

  // Staff Login Form state
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Student Quick Login Form state
  const [studentId, setStudentId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");

  // Parent Quick Login Form state
  const [parentPhone, setParentPhone] = useState("");
  const [parentPin, setParentPin] = useState("");

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        identifier: staffEmail.trim(),
        email: staffEmail.trim(),
        password: staffPassword,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.includes("Too many failed attempts")) {
          setErrorMsg("Account locked due to excessive failed attempts. Please retry in 15 minutes.");
        } else if (res.error.includes("not active")) {
          setErrorMsg("Your account is not active. Please contact administration.");
        } else {
          setErrorMsg("Invalid credentials. Please verify your email and password.");
        }
        setIsLoading(false);
        return;
      }

      if (onSuccessCallback) {
        onSuccessCallback();
      } else {
        router.push(onSuccessRedirectUrl);
        router.refresh();
      }
    } catch {
      setErrorMsg("An unexpected authentication error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleStudentRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) {
      setErrorMsg("Please enter your Student Enrollment Code (e.g., SV-STU-2026-001).");
      return;
    }
    router.push(`/skillverse/student-login?code=${encodeURIComponent(studentId.trim())}`);
  };

  const handleParentRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentPhone.trim()) {
      setErrorMsg("Please enter your registered 10-digit mobile number.");
      return;
    }
    router.push(`/skillverse/parent-login?phone=${encodeURIComponent(parentPhone.trim())}`);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
        {/* Brand Header Banner */}
        <div className="bg-gradient-to-r from-[#071630] via-[#0B2247] to-[#15803D] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md mx-auto mb-3 flex items-center justify-center border border-white/20">
            <img
              src={SKILLVERSE_BRAND.logoPath}
              alt="SLG SKILLVERSE"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-1 leading-none text-xl font-black tracking-tight mb-1">
            <span className="text-[#22C55E]">SLG</span>
            <span className="text-[#38BDF8]">SKILL</span>
            <span className="text-[#4ADE80]">VERSE</span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-lime-300">
            {subtitle || "Academic & Leadership Portal • Powered by SoftLab Global"}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => {
              setActiveRole("staff");
              setErrorMsg(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center gap-0.5 ${
              activeRole === "staff"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Staff & Higher</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRole("student");
              setErrorMsg(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center gap-0.5 ${
              activeRole === "student"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Student LMS</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRole("parent");
              setErrorMsg(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center gap-0.5 ${
              activeRole === "parent"
                ? "bg-white text-purple-700 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>Parent Desk</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: STAFF & HIGHER AUTHORITIES */}
          {activeRole === "staff" && (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-left text-[11px] text-blue-900 leading-relaxed">
                <span className="font-bold flex items-center gap-1 mb-0.5 text-blue-800">
                  <Sparkles className="w-3 h-3 text-blue-600" /> Higher Authorities Shared Login
                </span>
                SoftLab Global <strong>Manager</strong>, <strong>Admin</strong>, <strong>Director</strong>, and <strong>Super Admin</strong> can log in directly using their existing credentials. Other staff and faculty log in with their provisioned access keys.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Staff Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="e.g. director@softlabglobal.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password / Access Key
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Access...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Sign In to Skillverse Command Center
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: STUDENT LMS */}
          {activeRole === "student" && (
            <form onSubmit={handleStudentRedirect} className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-left text-[11px] text-emerald-900 leading-relaxed">
                <span className="font-bold flex items-center gap-1 mb-0.5 text-emerald-800">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" /> Student LMS & Live Classroom
                </span>
                Enter the Enrollment ID or registered email provided during your Skillverse admission.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Enrollment ID or Registered Email
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. SV-STU-2026-001 or student@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Continue to Student LMS & Live Classes <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <Link
                  href="/skillverse/student-login"
                  className="text-emerald-700 hover:underline text-xs font-semibold"
                >
                  Open Full Student Portal & Quiz Runner →
                </Link>
              </div>
            </form>
          )}

          {/* TAB 3: PARENT DESK */}
          {activeRole === "parent" && (
            <form onSubmit={handleParentRedirect} className="space-y-4">
              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/60 text-left text-[11px] text-purple-900 leading-relaxed">
                <span className="font-bold flex items-center gap-1 mb-0.5 text-purple-800">
                  <Users className="w-3.5 h-3.5 text-purple-600" /> Parent Communication Desk
                </span>
                Access your child&apos;s real-time attendance, test scorecards, homework, and fee receipts.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Parent Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Access Child&apos;s Academic Record <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <Link
                  href="/skillverse/parent-login"
                  className="text-purple-700 hover:underline text-xs font-semibold"
                >
                  Open Dedicated Parent Verification Page →
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Need assistance? Call Admissions Support at{" "}
          <a href="tel:+919196596975" className="text-blue-600 font-bold hover:underline">
            +91-9196596975
          </a>
        </div>
      </div>
    </div>
  );
}
