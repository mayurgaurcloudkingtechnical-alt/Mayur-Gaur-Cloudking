"use client";

import React, { useState, useEffect } from "react";
import {
  SKILLVERSE_DIWALI_CAMPAIGN_2026,
  isDiwaliCampaignActive,
} from "@/lib/constants/campaign";
import { openSkillverseDiwaliModal } from "./skillverse-diwali-modal";
import { Sparkles, Calendar, ArrowRight, X } from "lucide-react";

export function SkillverseDiwaliBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const isActive = isDiwaliCampaignActive();

  useEffect(() => {
    try {
      if (sessionStorage.getItem("skillverse_diwali_banner_dismissed") === "1") {
        setIsDismissed(true);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem("skillverse_diwali_banner_dismissed", "1");
    } catch {
      // Ignore
    }
  };

  if (!isActive || isDismissed) return null;

  return (
    <aside
      role="region"
      aria-label="SLG Skillverse Diwali Festive Offer 2026"
      className="relative z-50 bg-gradient-to-r from-[#071630] via-[#2A0E3D] to-[#071630] text-white border-b-2 border-amber-500/70 shadow-lg overflow-hidden"
    >
      {/* Subtle festive shimmer */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent opacity-70" />

      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2.5 text-xs">
        {/* Left: Festive Headline & Tagline */}
        <div
          onClick={() => openSkillverseDiwaliModal()}
          className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer group"
          title="Click to view Skillverse Diwali 45% OFF Flyer & Concession Details"
        >
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/60 text-amber-200 font-black text-[10.5px] uppercase tracking-wider shrink-0 shadow-xs">
            <span className="text-xs">🪔</span>
            <span>Diwali Dhamaka 2026</span>
          </div>

          <div className="truncate text-slate-100 flex items-center gap-2">
            <span className="font-black text-amber-300 tracking-tight">
              UP TO 45% OFF:
            </span>
            <span className="hidden md:inline font-medium text-slate-200">
              Light Up Your Career This Diwali with Future-Ready Academic &amp; Tech Skills.
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-200 font-semibold bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-500/30 shrink-0">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>Till {SKILLVERSE_DIWALI_CAMPAIGN_2026.expiryDateFormatted}</span>
            </span>
          </div>
        </div>

        {/* Right: Claim Button + Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openSkillverseDiwaliModal()}
            className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-[11px] sm:text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-900" />
            <span>Claim 45% Concession</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Dismiss Diwali banner for this session"
            title="Dismiss banner"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
