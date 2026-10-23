"use client";

import * as React from "react";
import Image from "next/image";
import { DIWALI_CAMPAIGN_2026 } from "@/lib/constants/campaign";
import { Sparkles, Calendar, ArrowRight, PhoneCall, ShieldCheck, Tag } from "lucide-react";

interface DiwaliFlyerCardProps {
  onApplyNow?: () => void;
  onEnquireNow?: () => void;
  compact?: boolean;
}

export function DiwaliFlyerCard({
  onApplyNow,
  onEnquireNow,
  compact = false,
}: DiwaliFlyerCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A0926] via-[#0E0417] to-[#250D35] text-white border-2 border-amber-500/40 shadow-2xl">
      {/* Ambient Radial Golden Glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl" />

      {/* Decorative Corner Mandala Accents */}
      <div className="pointer-events-none absolute top-2 left-2 text-amber-400/20 text-xs select-none">
        ❖ ═══ ❖
      </div>
      <div className="pointer-events-none absolute top-2 right-2 text-amber-400/20 text-xs select-none">
        ❖ ═══ ❖
      </div>

      {/* Main Authentic Flyer Graphic */}
      <div className="relative w-full aspect-square max-h-[380px] sm:max-h-[460px] overflow-hidden bg-slate-950 flex items-center justify-center">
        <img
          src="/images/diwali-dhamaka-2026-flyer.jpg"
          alt="SoftLab Global Diwali Festive Offer - Up to 45% Off On Every Course Admissions"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Campaign Details & Content Section */}
      <div className="p-5 sm:p-7 space-y-4">
        {/* Header Ribbon Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>FESTIVE ACADEMIC CONCESSION 2026</span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs text-amber-200/90 font-medium">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Valid till <strong>{DIWALI_CAMPAIGN_2026.expiryDateFormatted}</strong></span>
          </div>
        </div>

        {/* Headlines */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 tracking-tight">
            {DIWALI_CAMPAIGN_2026.headline}
          </h2>
          <p className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
            <span className="text-emerald-400">{DIWALI_CAMPAIGN_2026.discountBadge}</span>
            <span className="text-slate-300 font-semibold text-sm sm:text-base">
              {DIWALI_CAMPAIGN_2026.discountSubtext}
            </span>
          </p>
        </div>

        {/* Supporting Copy Points */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
          {DIWALI_CAMPAIGN_2026.supportingCopy.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">🪔</span>
              <span className="leading-snug">{point}</span>
            </li>
          ))}
        </ul>

        {/* Course Coverage Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-300">
          <span className="font-semibold text-amber-300">Applicable on:</span>
          {["AI & ML", "Data Science", "Cloud & DevOps", "Full Stack Web", "Cyber Security", "University Degrees"].map((item) => (
            <span
              key={item}
              className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-slate-200"
            >
              {item}
            </span>
          ))}
        </div>

        {/* CTAs Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
          <button
            type="button"
            onClick={onApplyNow}
            className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{DIWALI_CAMPAIGN_2026.primaryCtaText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onEnquireNow}
            className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 hover:text-white font-bold text-sm border border-amber-400/40 hover:border-amber-400 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-amber-400" />
            <span>{DIWALI_CAMPAIGN_2026.secondaryCtaText}</span>
          </button>
        </div>

        {/* Trust Badges & Terms */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-white/10 text-[10.5px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Placement Support • ISO Certified • Civil Lines Prayagraj</span>
          </div>
          <span className="text-[9.5px] text-slate-400">
            *Terms apply. Maximum 45% concession.
          </span>
        </div>
      </div>
    </div>
  );
}
