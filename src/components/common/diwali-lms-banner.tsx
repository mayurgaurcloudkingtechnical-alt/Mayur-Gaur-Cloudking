"use client";

import * as React from "react";
import { DIWALI_CAMPAIGN_2026, isDiwaliCampaignActive } from "@/lib/constants/campaign";
import { Sparkles, Calendar, X, Tag, Info, ArrowUpRight } from "lucide-react";
import { openDiwaliOfferModal } from "../public/diwali-offer-modal";

export function DiwaliLmsBanner() {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const isActive = isDiwaliCampaignActive();

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem("slg_diwali_lms_dismissed") === "1") {
        setIsDismissed(true);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem("slg_diwali_lms_dismissed", "1");
    } catch {
      // Ignore
    }
  };

  if (!isActive) return null;

  return (
    <>
      {/* Non-intrusive Collapsed Floating Badge when dismissed */}
      {isDismissed ? (
        <div className="fixed bottom-4 right-4 z-30">
          <button
            type="button"
            onClick={() => setIsDismissed(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-xs shadow-lg border border-amber-300 hover:scale-105 transition-all cursor-pointer"
            title="Re-open Diwali Offer Concession Notice"
          >
            <span>🪔</span>
            <span>Diwali Offer (45% OFF)</span>
          </button>
        </div>
      ) : (
        <aside
          role="region"
          aria-label="Staff Diwali Concession Announcement"
          className="bg-gradient-to-r from-[#200A30] via-[#160623] to-[#200A30] text-amber-100 border-b border-amber-500/40 px-3 sm:px-6 py-2 shadow-xs transition-all"
        >
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Announcement Text */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base select-none">🪔</span>
              <div className="flex flex-wrap items-center gap-1.5 font-medium">
                <span className="font-extrabold text-amber-300 uppercase tracking-wide">
                  {DIWALI_CAMPAIGN_2026.headline}:
                </span>
                <span className="text-white font-semibold">
                  Up to 45% Festive Concession Active on All Masterclasses &amp; University Programs
                </span>
                <span className="text-[11px] text-amber-300/80 bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-500/30">
                  Valid till {DIWALI_CAMPAIGN_2026.expiryDateFormatted}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-amber-300" />
                <span>Offer Slabs &amp; Guidelines</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 rounded-md text-amber-400/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Dismiss banner"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Offer Slabs & Guidelines Modal for Staff/Students */}
      {detailsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
        >
          <div
            className="fixed inset-0"
            onClick={() => setDetailsOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[#140620] text-white p-6 shadow-2xl border-2 border-amber-500/50 space-y-4 animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setDetailsOpen(false)}
              className="absolute right-3.5 top-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white border-2 border-white/60 hover:bg-zinc-800 transition-all cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4 text-white stroke-[3]" />
            </button>

            <div className="space-y-1 pr-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>SOFTLAB GLOBAL • DIWALI OFFER 2026</span>
              </div>
              <h3 className="text-xl font-black text-amber-300">
                Festive Concession Policy &amp; Slabs
              </h3>
              <p className="text-xs text-slate-300">
                Official guidelines for counselors, faculty, and student admissions.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>Full Stack AI, Data Science &amp; Cloud</span>
                  <span className="text-emerald-400 font-extrabold text-sm">UP TO 45% CONCESSION</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Applicable on upfront or 2-installment registrations confirmed prior to 10 November 2026.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>Cyber Security &amp; Python Bootcamp</span>
                  <span className="text-emerald-400 font-extrabold text-sm">UP TO 35% CONCESSION</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Includes certification vouchers, in-house live studio access, and 100% placement track.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>Dr. Preeti Global University Programs</span>
                  <span className="text-emerald-400 font-extrabold text-sm">SCHOLARSHIP MERIT SLAB</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  BCA, MCA, and B.Tech direct academic admissions with university concession vouchers.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200/90 space-y-1">
              <p className="font-bold text-amber-300">Counselor Instructions:</p>
              <p>
                All leads generated from website or WhatsApp with campaign tag <code>Diwali Offer 2026</code> must be handled within 15 minutes. Record concession codes in the application fee invoice notes.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                Acknowledge &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
