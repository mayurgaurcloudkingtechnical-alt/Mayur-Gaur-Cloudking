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
} from "lucide-react";

export default function SkillverseParentPortalPage() {
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [accessPin, setAccessPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [familyData, setFamilyData] = useState<any | null>(null);

  const verifyParentMutation = trpc.skillverse.verifyParentPortalAccess.useMutation({
    onSuccess: (data) => {
      setErrorMsg(null);
      setFamilyData(data);
    },
    onError: (err) => {
      setErrorMsg(
        err.message ||
          "Parent verification failed. Access is strictly restricted to your linked child's profile."
      );
    },
  });

  if (!familyData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Family-Isolated Parent Portal
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Parent / Guardian Login</h1>
            <p className="text-xs text-slate-500 mt-1">
              Verify your child’s Enrollment Code, registered parent mobile number, and 4-digit
              Family Access PIN (default: last 4 digits of registered mobile).
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
              verifyParentMutation.mutate({ enrollmentCode, parentPhone, accessPin });
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Linked Student Enrollment Code *
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
              <label className="block font-bold text-slate-700 mb-1">
                Registered Parent Mobile Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Family Access PIN *</label>
              <input
                type="password"
                required
                placeholder="••••"
                value={accessPin}
                onChange={(e) => setAccessPin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={verifyParentMutation.isPending}
              className="w-full py-3 rounded-xl bg-[#15803D] hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              {verifyParentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Family Authorization...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Access Linked Student Record
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            Strict Family Isolation: Server-side authorization ensures parents can never view
            another family's student data.
          </p>
        </div>
      </div>
    );
  }

  const { student, invoices } = familyData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="bg-gradient-to-r from-[#071630] to-[#15803D] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-lime-300">
            Verified Parent / Guardian Portal — Attn: {student.parentName}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Student Ward: {student.studentName} ({student.currentClass} • {student.board})
          </h1>
          <p className="text-xs text-slate-200 mt-1">
            Enrollment Code: {student.enrollmentCode} | Batch: {student.batchCode} | Overall
            Attendance: {student.attendancePercent}%
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFamilyData(null)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
        >
          <LogOut className="w-4 h-4" /> Lock Parent Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance & Academic Progress */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900">
            Attendance Log ({student.attendancePercent}%)
          </h2>
          <div className="space-y-2 text-xs">
            {student.attendanceRecords.map((rec: any, i: number) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">{rec.subject}</div>
                  <div className="text-[11px] text-slate-500">{rec.date}</div>
                </div>
                <span className="font-bold text-emerald-700">{rec.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PTM Schedules & Consent */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900">
            Parent-Teacher Meetings (PTM) & Progress
          </h2>
          <div className="space-y-2.5 text-xs">
            {student.ptmSchedules.map((ptm: any) => (
              <div
                key={ptm.id}
                className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1"
              >
                <div className="flex justify-between font-bold text-blue-900">
                  <span>{ptm.scheduledDate}</span>
                  <span>{ptm.status}</span>
                </div>
                <div className="font-semibold text-slate-900">{ptm.agenda}</div>
                <div className="text-[11px] text-slate-600">Faculty: {ptm.teacherName}</div>
              </div>
            ))}
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
            <strong className="block">DPDP Parent Consent Status: ACTIVE</strong>
            Verified parent/guardian consent is on file for {student.studentName}.
          </div>
        </div>

        {/* Fee Invoices, Receipts & Balances */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900">
            Fee Invoices, Receipts & Balances
          </h2>
          <div className="space-y-3 text-xs">
            {invoices.map((inv: any) => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
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
                {inv.packageTitle && (
                  <div className="text-slate-600">
                    Package: {inv.packageTitle} (₹{inv.packageMonthlyAmountInr})
                  </div>
                )}
                {inv.addonTitle && (
                  <div className="text-slate-600">
                    Add-On: {inv.addonTitle} (₹{inv.addonMonthlyAmountInr})
                  </div>
                )}
                <div className="text-slate-600">
                  Admission & Kit: ₹{inv.admissionFeeInr + inv.learningKitFeeInr}
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex justify-between font-black text-slate-900">
                  <span>Total Amount:</span>
                  <span className="font-mono">
                    ₹{inv.totalPayableInr.toLocaleString("en-IN")}
                  </span>
                </div>
                {inv.receiptNumber && (
                  <div className="text-[11px] text-emerald-700 font-mono">
                    Official Receipt: {inv.receiptNumber}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
