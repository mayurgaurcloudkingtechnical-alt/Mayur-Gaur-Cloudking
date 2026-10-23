"use client";

import * as React from "react";
import Image from "next/image";
import { DIWALI_CAMPAIGN_2026, isDiwaliCampaignActive } from "@/lib/constants/campaign";
import { submitEnquiryAction, EnquiryState } from "@/app/actions/enquiry";
import { trackLeadSubmission } from "@/lib/analytics";
import {
  Sparkles,
  CheckCircle2,
  PhoneCall,
  Calendar,
  X,
  ArrowRight,
  ShieldCheck,
  Loader2,
  GraduationCap,
} from "lucide-react";

export function openDiwaliOfferModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-diwali-offer-modal"));
  }
}

export function DiwaliOfferModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"FLYER" | "FORM">("FLYER");
  const [ctaType, setCtaType] = React.useState<"APPLY_NOW" | "ENQUIRE_NOW">("APPLY_NOW");
  const [selectedCourse, setSelectedCourse] = React.useState("Artificial Intelligence & Machine Learning");
  const [state, setState] = React.useState<EnquiryState>({ success: false });
  const [isPending, setIsPending] = React.useState(false);

  // Check campaign schedule validity
  const isActive = isDiwaliCampaignActive();

  // Automatic open on initial load / refresh if campaign active & not dismissed in current session
  React.useEffect(() => {
    if (!isActive) return;

    // Check session dismissal to prevent disruptive loops
    try {
      const dismissed = sessionStorage.getItem("slg_diwali_dismissed_session");
      if (!dismissed) {
        setIsOpen(true);
      }
    } catch {
      setIsOpen(true);
    }
  }, [isActive]);

  // Listen for manual trigger events from banners or pills
  React.useEffect(() => {
    const handleOpen = () => {
      setViewMode("FLYER");
      setIsOpen(true);
    };

    window.addEventListener("open-diwali-offer-modal", handleOpen);
    return () => window.removeEventListener("open-diwali-offer-modal", handleOpen);
  }, []);

  const handleClose = () => {
    try {
      sessionStorage.setItem("slg_diwali_dismissed_session", "1");
    } catch {
      // Ignore storage errors
    }
    setIsOpen(false);
    setTimeout(() => {
      setViewMode("FLYER");
      setState({ success: false });
    }, 300);
  };

  const handleApplyNow = () => {
    setCtaType("APPLY_NOW");
    setViewMode("FORM");
  };

  const handleEnquireNow = () => {
    setCtaType("ENQUIRE_NOW");
    setViewMode("FORM");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    formData.set("source", DIWALI_CAMPAIGN_2026.leadSourceWebsite);
    formData.set("campaignName", DIWALI_CAMPAIGN_2026.campaignKey);
    formData.set("trainingMode", (formData.get("trainingMode") as string) || "HYBRID");
    formData.set(
      "notes",
      `Festive Offer 2026 (Up to 45% Off) | CTA: ${ctaType} | Selected Course: ${selectedCourse}`
    );

    try {
      const res = await submitEnquiryAction(state, formData);
      setState(res);
      if (res.success) {
        trackLeadSubmission({
          source: DIWALI_CAMPAIGN_2026.leadSourceWebsite,
          courseOrInterest: selectedCourse,
        });
      }
    } catch (err: any) {
      setState({
        success: false,
        message: err?.message || "Failed to submit. Please call admissions desk directly.",
      });
    } finally {
      setIsPending(false);
    }
  };

  if (!isActive || !isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto"
    >
      {/* Backdrop click to dismiss */}
      <div
        className="fixed inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#170924] via-[#0D0414] to-[#12051E] text-white border-2 border-amber-500/50 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Bold Black Close Button - High contrast, always clearly visible */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3.5 top-3.5 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-black hover:bg-zinc-800 text-white border-2 border-white shadow-xl transition-all cursor-pointer focus:outline-none hover:scale-105"
          aria-label="Close Diwali Offer Dialog"
          title="Close Dialog"
        >
          <X className="h-5 w-5 text-white stroke-[3]" />
        </button>

        {viewMode === "FLYER" ? (
          /* ==================================================================== */
          /* VIEW 1: FESTIVE FLYER PRESENTATION                                   */
          /* ==================================================================== */
          <div>
            {/* Visual Authentic Diwali Flyer Image */}
            <div className="relative w-full aspect-square max-h-[420px] sm:max-h-[500px] overflow-hidden bg-slate-950 flex items-center justify-center">
              <img
                src="/images/diwali-dhamaka-2026-flyer.jpg"
                alt="SoftLab Global Diwali Festive Offer - Up to 45% Off On Every Course Admissions"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Content Details */}
            <div className="p-5 sm:p-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>DIWALI DHAMAKA 2026 • LIMITED PERIOD OFFER</span>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs text-amber-200/90 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Valid till <strong>{DIWALI_CAMPAIGN_2026.expiryDateFormatted}</strong></span>
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 tracking-tight">
                  {DIWALI_CAMPAIGN_2026.headline}
                </h2>
                <p className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <span className="text-emerald-400 font-black">{DIWALI_CAMPAIGN_2026.discountBadge}</span>
                  <span className="text-slate-300 font-semibold text-sm sm:text-base">
                    {DIWALI_CAMPAIGN_2026.discountSubtext}
                  </span>
                </p>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                {DIWALI_CAMPAIGN_2026.supportingCopy.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">🪔</span>
                    <span className="leading-snug">{point}</span>
                  </li>
                ))}
              </ul>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleApplyNow}
                  className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{DIWALI_CAMPAIGN_2026.primaryCtaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleEnquireNow}
                  className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 hover:text-white font-bold text-sm border border-amber-400/40 hover:border-amber-400 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-amber-400" />
                  <span>{DIWALI_CAMPAIGN_2026.secondaryCtaText}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10.5px] text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Placement Support • In-House Live Studio</span>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="hover:text-white underline cursor-pointer"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ==================================================================== */
          /* VIEW 2: FAST FESTIVE ADMISSION / ENQUIRY FORM                        */
          /* ==================================================================== */
          <div className="p-6 sm:p-8 space-y-5">
            {state.success ? (
              <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-400/40 shadow-lg">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-black text-amber-300">
                  Diwali Concession Claim Registered!
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {state.message ||
                    "Thank you! Our senior academic counselor will call you within 15 minutes to lock in your Diwali concession and provide course syllabus details."}
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Close &amp; Return to Website
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Form Header */}
                <div className="space-y-1 mb-4 pr-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 font-bold text-[11px]">
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                    <span>CLAIM UP TO 45% DIWALI CONCESSION</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {ctaType === "APPLY_NOW" ? "Fast-Track Course Application" : "Diwali Offer Course Enquiry"}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Lock in your festive fee concession before <strong>{DIWALI_CAMPAIGN_2026.expiryDateFormatted}</strong>.
                  </p>
                </div>

                {state.message && !state.success && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-400 text-xs text-rose-200">
                    {state.message}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                  <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Full Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        WhatsApp / Mobile No. <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="10-digit mobile number"
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="name@example.com"
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        City / Location
                      </label>
                      <input
                        type="text"
                        name="city"
                        placeholder="e.g. Prayagraj / Lucknow / Delhi"
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs"
                      />
                    </div>
                  </div>

                  {/* Course Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Select Interested Course for 45% Festive Concession
                    </label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A0A2A] border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs"
                    >
                      <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence &amp; Machine Learning Masterclass</option>
                      <option value="Full Stack Web Development (MERN / Next.js)">Full Stack Web Development (MERN / Next.js)</option>
                      <option value="Cloud Computing & DevOps Masterclass">Cloud Computing &amp; DevOps Masterclass</option>
                      <option value="Cyber Security & Ethical Hacking">Cyber Security &amp; Ethical Hacking Complete Program</option>
                      <option value="Data Science & Business Analytics">Data Science &amp; Business Analytics</option>
                      <option value="Python & AI Deep Learning Bootcamp">Python &amp; AI Deep Learning Bootcamp</option>
                      <option value="Java Full Stack Enterprise Engineering">Java Full Stack Enterprise Engineering</option>
                      <option value="Dr. Preeti Global University BCA / MCA / B.Tech">Dr. Preeti Global University Programs (BCA/MCA/B.Tech)</option>
                    </select>
                  </div>

                  {/* Learning Mode */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Preferred Learning Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["OFFLINE_CAMPUS", "ONLINE_LIVE", "HYBRID"].map((mode) => (
                        <label
                          key={mode}
                          className="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 cursor-pointer text-[10.5px]"
                        >
                          <input
                            type="radio"
                            name="trainingMode"
                            value={mode}
                            defaultChecked={mode === "HYBRID"}
                            className="text-amber-500 focus:ring-amber-400"
                          />
                          <span>{mode.replace("_", " ")}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Locking Your Concession...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>{ctaType === "APPLY_NOW" ? "Submit Application & Lock Concession" : "Lock Diwali Concession & Enquire"}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode("FLYER")}
                      className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Back to Flyer
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
