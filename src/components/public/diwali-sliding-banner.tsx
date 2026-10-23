"use client";

import * as React from "react";
import { DIWALI_CAMPAIGN_2026, isDiwaliCampaignActive } from "@/lib/constants/campaign";
import { openDiwaliOfferModal } from "./diwali-offer-modal";
import { Sparkles, Calendar, ArrowRight, X, Flame } from "lucide-react";

export function DiwaliSlidingBanner() {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const isActive = isDiwaliCampaignActive();

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem("slg_diwali_banner_dismissed") === "1") {
        setIsDismissed(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem("slg_diwali_banner_dismissed", "1");
    } catch {
      // Ignore
    }
  };

  if (!isActive) return null;

  return (
    <>
      {/* 24/7 Floating Sticky Pill (Always accessible even if banner is dismissed) */}
      <div className="fixed right-4 bottom-20 z-40">
        <button
          type="button"
          onClick={() => openDiwaliOfferModal()}
          className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 font-black text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-white/80 cursor-pointer animate-pulse"
          title="Open Diwali Offer 2026 (Up to 45% Off)"
          aria-label="Open Diwali Offer 2026"
        >
          <span className="text-sm">🪔</span>
          <span className="tracking-wide">Diwali Offer: <strong>45% OFF</strong></span>
          <Sparkles className="w-3.5 h-3.5 text-slate-900 group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Main Sliding / Persistent Offer Ribbon (Shown unless dismissed in session) */}
      {!isDismissed && (
        <aside
          role="region"
          aria-label="Diwali Festive Offer Announcement"
          className="relative z-40 bg-gradient-to-r from-[#1E082B] via-[#35104B] to-[#1E082B] text-white border-b-2 border-amber-500/60 shadow-xl overflow-hidden"
        >
          {/* Subtle Ambient Shimmer */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent opacity-80" />

          <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-xs">
            {/* Left Tag + Headline */}
            <div
              onClick={() => openDiwaliOfferModal()}
              className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer group"
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/50 text-amber-200 font-black text-[10.5px] uppercase tracking-wider shrink-0">
                <span className="text-xs">🪔</span>
                <span>Diwali 2026</span>
              </div>

              <div className="truncate text-slate-100 flex items-center gap-2">
                <span className="font-extrabold text-amber-300">UP TO 45% OFF:</span>
                <span className="hidden md:inline font-medium text-slate-200">
                  Celebrate Diwali with a brighter future &amp; career-ready skills on every course.
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-200 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30 shrink-0">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <span>Till {DIWALI_CAMPAIGN_2026.expiryDateFormatted}</span>
                </span>
              </div>
            </div>

            {/* Right Action CTAs + Dismiss */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openDiwaliOfferModal()}
                className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[11px] sm:text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer hover:scale-105"
              >
                <span>Claim 45% Concession</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Dismiss banner for this session"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
