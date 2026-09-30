"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { formatPaiseToRupees } from "@/lib/utils";
import { openCourseBuyModal, CourseBuyTarget } from "@/components/public/course-buy-modal";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Award,
} from "lucide-react";

interface CourseBuySidebarCardProps {
  course: CourseBuyTarget;
}

export function CourseBuySidebarCard({ course }: CourseBuySidebarCardProps) {
  const originalFeePaise = course.baseFee && course.baseFee > 0 ? course.baseFee : 2500000;
  const tokenFeePaise = Math.min(500000, originalFeePaise);

  return (
    <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 p-6 rounded-3xl border-2 border-emerald-500/50 shadow-2xl shadow-emerald-950/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/60 border border-emerald-600/60 text-emerald-300 text-[11px] font-semibold">
          <Zap className="h-3.5 w-3.5 text-emerald-400" />
          <span>Direct Online Admission</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
          Razorpay Verified
        </span>
      </div>

      <div>
        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
          Institutional Tuition Fee
        </span>
        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl font-black text-white tracking-tight">
            {formatPaiseToRupees(originalFeePaise)}
          </span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-900/80 border border-emerald-700/60 px-2 py-0.5 rounded-md">
            All-Inclusive
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Or reserve your seat for just <strong>{formatPaiseToRupees(tokenFeePaise)}</strong> with flexible EMIs.
        </p>
      </div>

      {/* Primary Buy CTA */}
      <Button
        onClick={() => openCourseBuyModal(course)}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm h-12 rounded-xl shadow-xl shadow-emerald-950/60 border border-emerald-400/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
      >
        <CreditCard className="h-4 w-4 text-emerald-200" />
        <span>⚡ Enroll & Pay Online (Razorpay)</span>
      </Button>

      {/* Assurance Bullet points */}
      <div className="pt-2 border-t border-slate-800 space-y-2 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Instant seat allotment & batch placement</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Official Fee Receipt & GST invoice provided</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>100% Money-back guarantee before batch start</span>
        </div>
      </div>

      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>PCI-DSS Level 1 Secure</span>
        </span>
        <span>Credit / Debit / UPI / EMI</span>
      </div>
    </div>
  );
}

export function CourseBuyButton({
  course,
  label = "⚡ Enroll & Buy Online (Razorpay)",
  className,
}: {
  course: CourseBuyTarget;
  label?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      onClick={() => openCourseBuyModal(course)}
      className={
        className ||
        "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 shadow-lg shadow-emerald-950/40 rounded-xl flex items-center justify-center gap-2 border border-emerald-400/50 transition-all hover:scale-[1.01]"
      }
    >
      <CreditCard className="h-4 w-4 text-emerald-200" />
      <span>{label}</span>
    </Button>
  );
}

