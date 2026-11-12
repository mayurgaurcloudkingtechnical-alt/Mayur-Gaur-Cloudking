"use client";

import * as React from "react";
import { CHHATH_PUJA_CAMPAIGN_2026, isFestiveCampaignActive } from "@/lib/constants/campaign";
import { openDiwaliOfferModal } from "./diwali-offer-modal";
import { Sparkles, Calendar, ArrowRight, X, SunMedium } from "lucide-react";

export function DiwaliSlidingBanner() {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const isActive = isFestiveCampaignActive();

  // Ensure ribbon is always visible on every page load / refresh through 20 November 2026
  React.useEffect(() => {
    setIsDismissed(false);
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
  };

  if (!isActive) return null;

  return (
    <>
      {/* 24/7 Floating Sticky Pill (Always accessible even if banner is temporarily dismissed) */}
      <div className="fixed right-4 bottom-20 z-40">
        <button
          type="button"
          onClick={() => openDiwaliOfferModal()}
          className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 text-slate-950 font-black text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-white/90 cursor-pointer animate-pulse"
          title="Open Chhath Puja Offer 2026 (Flat 35% Off)"
          aria-label="Open Chhath Puja Offer 2026"
        >
          <span className="text-sm">🌅</span>
          <span className="tracking-wide">छठ पूजा: <strong>35% OFF</strong></span>
          <Sparkles className="w-3.5 h-3.5 text-slate-900 group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Continuous Top Ribbon (Shown continuously across all public pages) */}
      {!isDismissed && (
        <aside
          role="region"
          aria-label="Chhath Puja Festive Offer Announcement"
          className="relative z-50 bg-gradient-to-r from-[#0C1A30] via-[#0E3A6E] to-[#0C1A30] text-white border-b-2 border-amber-400 shadow-xl overflow-hidden"
        >
          {/* Subtle Ambient Shimmer */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/25 via-transparent to-transparent opacity-90 animate-pulse" />

          <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-xs">
            {/* Left Tag + Headline */}
            <div
              onClick={() => openDiwaliOfferModal()}
              className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer group"
              title="Click to view official Chhath Puja 35% Discount Flyer & Enrol"
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/50 to-orange-500/50 border border-amber-300 text-amber-100 font-black text-[10.5px] uppercase tracking-wider shrink-0 shadow-sm">
                <span className="text-xs">🌅</span>
                <span>छठ पूजा SPECIAL OFFER</span>
              </div>

              <div className="truncate text-slate-100 flex items-center gap-2">
                <span className="font-extrabold text-amber-300 tracking-wide">FLAT 35% DISCOUNT:</span>
                <span className="hidden md:inline font-medium text-slate-200">
                  छठ पूजा की हार्दिक शुभकामनाएं — Flat 35% Discount on all IT &amp; Software Courses!
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-200 font-semibold bg-amber-950/90 px-2 py-0.5 rounded-md border border-amber-400/50 shrink-0">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <span>Valid till {CHHATH_PUJA_CAMPAIGN_2026.expiryDateFormatted}</span>
                </span>
              </div>
            </div>

            {/* Right Action CTAs + Dismiss */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openDiwaliOfferModal()}
                className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-[11px] sm:text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                <span>Claim 35% Concession</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Dismiss banner"
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
