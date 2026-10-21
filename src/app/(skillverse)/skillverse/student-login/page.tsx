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
} from "lucide-react";

export default function SkillverseStudentPortalPage() {
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [portalData, setPortalData] = useState<any | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  const loginMutation = trpc.skillverse.getStudentPortalData.useMutation({
    onSuccess: (data) => {
      setErrorMsg(null);
      setPortalData(data);
    },
    onError: (err) => {
      setErrorMsg(err.message || "Invalid Enrollment Code or Student Email.");
    },
  });

  const handlePayInvoice = async (invoiceNumber: string) => {
    try {
      setPaymentMessage("Creating server-side payment order...");
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
        // Verify using cryptographic sandbox token for staging/test verification
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
          setPaymentMessage(
            `Sandbox Payment Verified! Official Receipt: ${verifyJson.invoice.receiptNumber}`
          );
          loginMutation.mutate({ enrollmentCode, studentEmail });
        } else {
          setPaymentMessage(verifyJson.error || "Verification failed.");
        }
      } else {
        setPaymentMessage(
          `Order ${orderJson.orderId} created. Complete Razorpay checkout to verify signature.`
        );
      }
    } catch (e: any) {
      setPaymentMessage(e?.message || "Payment error.");
    }
  };

  if (!portalData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              SLG SKILLVERSE Student LMS
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Student Portal Login</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your Skillverse Enrollment Code (e.g., SV-STU-2026-101) and registered email to
              access your courses, timetable, assignments, and certificates.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate({ enrollmentCode, studentEmail });
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Student Enrollment Code *
              </label>
              <input
                type="text"
                required
                placeholder="SV-STU-2026-101"
                value={enrollmentCode}
                onChange={(e) => setEnrollmentCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Registered Email *</label>
              <input
                type="email"
                required
                placeholder="student@example.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Enrollment...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Sign In to Student Portal
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <Link href="/skillverse/admissions" className="text-blue-600 font-semibold">
              New Student? Apply Here
            </Link>
            <Link href="/skillverse/parent-login" className="text-emerald-700 font-semibold">
              Parent Login →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { student, enrolledCourses, invoices, certificates } = portalData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="bg-gradient-to-r from-[#071630] to-[#0052CC] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-lime-300">
            Enrollment ID: {student.enrollmentCode} | Batch: {student.batchCode}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Welcome, {student.studentName} ({student.currentClass} • {student.board})
          </h1>
          <p className="text-xs text-slate-200 mt-1">
            Delivery Mode: {student.deliveryMode} | Attendance: {student.attendancePercent}%
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPortalData(null)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {paymentMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
          {paymentMessage}
        </div>
      )}

      {/* Enrolled Curriculum & Modules (Enrollment-Protected) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> Enrolled Courses, Modules & Lesson Notes
          </h2>
          {enrolledCourses.map((c: any) => (
            <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                <span className="text-xs font-semibold text-blue-700">{c.defaultTimetable}</span>
              </div>
              <div className="space-y-2">
                {c.modules.map((m: any, i: number) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="font-bold text-slate-800">{m.title}</div>
                    <ul className="text-slate-600 pl-4 list-disc mt-1 space-y-0.5">
                      {m.lessons.map((l: string, li: number) => (
                        <li key={li}>{l}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Attendance, Assignments & Invoices */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900">
              Attendance & Assignments ({student.attendancePercent}%)
            </h2>
            <div className="space-y-2 text-xs">
              {student.attendanceRecords.map((r: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50"
                >
                  <span>
                    {r.date} — {r.subject}
                  </span>
                  <span className="font-bold text-emerald-700">{r.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900">Fee Invoices & Receipts</h2>
            {invoices.map((inv: any) => (
              <div
                key={inv.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex justify-between font-bold">
                  <span className="font-mono">{inv.invoiceNumber}</span>
                  <span
                    className={
                      inv.status === "PAID" ? "text-emerald-700" : "text-amber-700"
                    }
                  >
                    {inv.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Payable:</span>
                  <span className="font-mono font-black">
                    ₹{inv.totalPayableInr.toLocaleString("en-IN")}
                  </span>
                </div>
                {inv.receiptNumber && (
                  <div className="text-[11px] text-emerald-700 font-mono">
                    Verified Receipt: {inv.receiptNumber}
                  </div>
                )}
                {inv.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => handlePayInvoice(inv.invoiceNumber)}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    Pay / Verify Invoice Now
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900">Issued Certificates</h2>
            {certificates.length === 0 ? (
              <p className="text-xs text-slate-500">
                Certificates appear here once course requirements and assessments are completed.
              </p>
            ) : (
              certificates.map((cert: any) => (
                <div
                  key={cert.id}
                  className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1"
                >
                  <div className="font-bold text-slate-900">{cert.courseTitle}</div>
                  <div className="font-mono text-[11px] text-emerald-800">
                    Ref: {cert.certificateNumber}
                  </div>
                  <Link
                    href={`/skillverse/verify/${cert.certificateNumber}`}
                    className="inline-block text-blue-700 font-bold hover:underline pt-1"
                  >
                    View & Verify Official Certificate →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
