"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { api as trpc } from "@/lib/trpc/react";
import {
  SKILLVERSE_DIWALI_CAMPAIGN_2026,
  isDiwaliCampaignActive,
} from "@/lib/constants/campaign";
import {
  Sparkles,
  CheckCircle2,
  PhoneCall,
  Calendar,
  X,
  ArrowRight,
  ShieldCheck,
  Loader2,
  MessageCircle,
  GraduationCap,
  BookOpen,
  Award,
} from "lucide-react";

export function openSkillverseDiwaliModal(detail?: { courseSlug?: string; grade?: string }) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("skillverse:open-diwali-modal", { detail })
    );
  }
}

export function SkillverseDiwaliModal() {
  const pathname = usePathname();
  const isActive = isDiwaliCampaignActive();

  // Open by default on initial load / refresh during the campaign period
  const [isOpen, setIsOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"FLYER" | "FORM">("FLYER");
  const [ctaType, setCtaType] = useState<"APPLY_NOW" | "ENQUIRE_NOW">("APPLY_NOW");

  // Form state
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentClass, setCurrentClass] = useState("Class 9");
  const [board, setBoard] = useState("CBSE");
  const [preferredProgram, setPreferredProgram] = useState("school-foundation-8-10");
  const [deliveryMode, setDeliveryMode] = useState<"ONLINE" | "OFFLINE" | "HYBRID">("HYBRID");
  const [city, setCity] = useState("Prayagraj");
  const [parentConsent, setParentConsent] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [submittedData, setSubmittedData] = useState<{
    referenceNumber: string;
    studentName: string;
    phone: string;
  } | null>(null);

  // Manage visibility on route change
  useEffect(() => {
    const path = pathname || "";
    const isStaffPortal =
      path.includes("/crm") ||
      path.includes("/staff-login") ||
      path.includes("/live-classroom");

    if (isStaffPortal) {
      setIsOpen(false);
    } else if (isActive) {
      // Re-show on public pages
      setIsOpen(true);
    }
  }, [pathname, isActive]);

  // Listen for manual trigger events from header banner or 24/7 floating pill
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ courseSlug?: string; grade?: string }>;
      if (customEvent.detail?.courseSlug) {
        setPreferredProgram(customEvent.detail.courseSlug);
      }
      if (customEvent.detail?.grade) {
        setCurrentClass(customEvent.detail.grade);
      }
      setViewMode("FLYER");
      setSubmittedData(null);
      setErrorMsg(null);
      setIsOpen(true);
    };

    window.addEventListener("skillverse:open-diwali-modal", handleOpen);
    return () => {
      window.removeEventListener("skillverse:open-diwali-modal", handleOpen);
    };
  }, []);

  const submitMutation = trpc.skillverse.submitAdmissionEnquiry.useMutation({
    onSuccess: (res) => {
      setErrorMsg(null);
      setSubmittedData({
        referenceNumber: res.record.referenceNumber,
        studentName: res.record.studentName,
        phone,
      });
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to submit application. Please check your contact details.");
    },
  });

  const handleApplyNow = () => {
    setCtaType("APPLY_NOW");
    setViewMode("FORM");
  };

  const handleEnquireNow = () => {
    setCtaType("ENQUIRE_NOW");
    setViewMode("FORM");
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setViewMode("FLYER");
      setSubmittedData(null);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile/WhatsApp number.");
      return;
    }

    if (!parentConsent) {
      setErrorMsg("Please confirm parent/guardian consent to proceed.");
      return;
    }

    submitMutation.mutate({
      studentName: studentName.trim(),
      parentName: parentName.trim(),
      phone: cleanPhone,
      email: email.trim(),
      currentClass,
      board,
      preferredCourseSlug: preferredProgram,
      preferredBatchTiming: "Evening (4:00 PM – 6:00 PM)",
      deliveryMode,
      city: city.trim() || "Prayagraj",
      locality: "Civil Lines",
      enquirySource: "SKILLVERSE_DIWALI_OFFER_2026",
      parentConsentAccepted: true,
      initialStage: ctaType === "APPLY_NOW" ? "APPLICATION" : "ENQUIRY",
    });
  };

  if (!isActive) return null;

  return (
    <>
      {/* 24/7 Floating Sticky Festive Entry Pill */}
      {!isOpen && (
        <aside
          aria-label="Diwali Festive Offer 2026"
          className="fixed left-4 bottom-5 z-[9990] flex items-center"
        >
          <button
            type="button"
            onClick={() => {
              setViewMode("FLYER");
              setIsOpen(true);
            }}
            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 text-xs font-black shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-white/80 cursor-pointer animate-pulse"
            title="Open Skillverse Diwali Festive Offer 2026 (Up to 45% Off)"
          >
            <span className="text-sm">🪔</span>
            <span>Diwali Offer: <strong>45% OFF</strong></span>
            <Sparkles className="w-3.5 h-3.5 text-slate-900 group-hover:rotate-12 transition-transform" />
          </button>
        </aside>
      )}

      {/* Main Festive Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="SLG Skillverse Diwali Offer 2026"
          className="fixed inset-0 z-[100000] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
        >
          {/* Backdrop Click Dismiss */}
          <div
            className="fixed inset-0"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <div className="relative z-[100001] w-full max-w-4xl bg-gradient-to-b from-[#071630] via-[#0B2247] to-[#071630] text-white rounded-3xl shadow-2xl border-2 border-amber-500/50 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Top Festive Header Bar */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 px-4 sm:px-6 py-2.5 flex items-center justify-between font-black text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🪔</span>
                <span className="tracking-wide uppercase font-extrabold text-[11px] sm:text-xs">
                  SLG SKILLVERSE — DIWALI FESTIVE OFFER 2026
                </span>
                <span className="hidden md:inline bg-black/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Valid till {SKILLVERSE_DIWALI_CAMPAIGN_2026.expiryDateFormatted}
                </span>
              </div>

              {/* Bold Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-full bg-black/20 hover:bg-black/35 text-slate-950 transition-colors cursor-pointer"
                aria-label="Close Diwali Offer"
                title="Close"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Modal Content Body */}
            {viewMode === "FLYER" ? (
              /* VIEW 1: ULTRA-HIGH-RESOLUTION FLYER PRESENTATION */
              <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[85vh] overflow-y-auto">
                {/* Left/Main Column: Ultra-HD Flyer Image */}
                <div className="lg:col-span-7 bg-slate-950 flex items-center justify-center p-2 sm:p-4 border-b lg:border-b-0 lg:border-r border-amber-500/30">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-500/40 w-full group">
                    <img
                      src={SKILLVERSE_DIWALI_CAMPAIGN_2026.flyerPath}
                      alt="SLG Skillverse Diwali Festive Offer 2026 - Up to 45% Off On Courses"
                      className="w-full h-auto object-contain max-h-[68vh] mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 border border-white/40">
                      <Sparkles className="w-3 h-3" />
                      <span>OFFICIAL FESTIVE FLYER</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Interactive Festive Offer Details & Action Panel */}
                <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Admissions Open 2026–27</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                      LIGHT UP YOUR CAREER THIS DIWALI
                    </h2>

                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/40 space-y-1">
                      <div className="text-amber-400 font-extrabold text-xs tracking-wider uppercase">
                        Festive Concession
                      </div>
                      <div className="text-3xl font-black text-amber-300 tracking-tight">
                        UP TO 45% OFF
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Applicable on Full-Year School Foundation (Classes 8–12), IIT-JEE, NEET, Coding &amp; AI Tracks.
                      </p>
                    </div>

                    <div className="space-y-2 text-xs text-slate-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Free Trial Class</strong> &amp; Diagnostic Skill Assessment</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>In-House Live Studio</strong> + 1-on-1 Faculty Mentorship</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>₹500 Registration Waiver</strong> with early Diwali claim</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-[11px] text-amber-200 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Offer Valid till <strong>{SKILLVERSE_DIWALI_CAMPAIGN_2026.expiryDateFormatted}</strong> (23:59 IST)
                      </span>
                    </div>
                  </div>

                  {/* Primary & Secondary Action CTAs */}
                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleApplyNow}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:opacity-95 text-slate-950 font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <span>APPLY NOW (Claim 45% Concession)</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      onClick={handleEnquireNow}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600/80 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>ENQUIRE NOW &amp; BOOK FREE DEMO</span>
                    </button>

                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-300">
                      <a
                        href={`https://wa.me/919196596975?text=${encodeURIComponent(
                          "Hello Skillverse Team, I want to claim the Diwali 45% OFF festive concession on academic and tech courses."
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp Counselor</span>
                      </a>
                      <a
                        href="tel:+919196596975"
                        className="text-slate-300 hover:text-white font-semibold inline-flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3 text-cyan-400" />
                        <span>+91 91965 96975</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW 2: FAST-TRACK FESTIVE ADMISSION APPLICATION FORM */
              <div className="p-5 sm:p-7 max-h-[82vh] overflow-y-auto">
                {submittedData ? (
                  /* Success Confirmation State */
                  <div className="text-center py-8 space-y-4 max-w-lg mx-auto">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">
                        Diwali Festive Concession Registered!
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Congratulations <strong>{submittedData.studentName}</strong>! Your Diwali scholarship application is officially logged in our Admissions CRM.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-left space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Application Reference:</span>
                        <span className="font-mono font-black text-amber-300 text-sm">
                          {submittedData.referenceNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Campaign Tag:</span>
                        <span className="font-bold text-amber-400">Skillverse Diwali Offer 2026</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Concession Applied:</span>
                        <span className="font-bold text-emerald-400">Up to 45% Festive Discount + Free Trial</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">
                      Our Academic Counselor will call you at <strong>+91 {submittedData.phone}</strong> to confirm your batch allocation and share your Diwali concession voucher.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                      <a
                        href={`https://wa.me/919196596975?text=${encodeURIComponent(
                          `Hello Skillverse Team, I submitted my Diwali Offer 2026 application for ${submittedData.studentName} (Ref: ${submittedData.referenceNumber}). Please confirm our 45% discount and Free Demo Class.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#16A34A] to-[#22C55E] text-white text-xs font-bold shadow-md hover:opacity-95 transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Connect on WhatsApp Now</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        Browse Website →
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form Input Fields */
                  <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                      <div>
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{ctaType === "APPLY_NOW" ? "Diwali Admission Application" : "Festive Demo & Enquiry"}</span>
                        </div>
                        <h3 className="text-lg font-black text-white">
                          Claim Up to 45% Festive Fee Concession
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewMode("FLYER")}
                        className="text-xs text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
                      >
                        ← Back to Flyer
                      </button>
                    </div>

                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs font-semibold">
                        {errorMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Student Full Name <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Aryan Sharma"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Parent / Guardian Name <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rajesh Sharma"
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Mobile / WhatsApp Number <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          placeholder="student@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Class / Standard <span className="text-amber-400">*</span>
                        </label>
                        <select
                          value={currentClass}
                          onChange={(e) => setCurrentClass(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        >
                          <option value="Class 8">Class 8</option>
                          <option value="Class 9">Class 9</option>
                          <option value="Class 10">Class 10</option>
                          <option value="Class 11">Class 11</option>
                          <option value="Class 12">Class 12</option>
                          <option value="Dropper / 12th Pass">Dropper / 12th Pass</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Board of Education <span className="text-amber-400">*</span>
                        </label>
                        <select
                          value={board}
                          onChange={(e) => setBoard(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        >
                          <option value="CBSE">CBSE Board</option>
                          <option value="ICSE / ISC">ICSE / ISC Board</option>
                          <option value="UP Board">UP Board (State)</option>
                          <option value="Other Board">Other State Board</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Preferred Learning Pathway / Course <span className="text-amber-400">*</span>
                        </label>
                        <select
                          value={preferredProgram}
                          onChange={(e) => setPreferredProgram(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        >
                          <option value="school-foundation-8-10">🏫 School Foundation (Classes 8, 9 & 10)</option>
                          <option value="senior-science-pcm-11-12">🔬 Senior Science PCM / PCB (Classes 11 & 12)</option>
                          <option value="jee-main-preparation">⚙️ IIT-JEE Main & Advanced Foundation Track</option>
                          <option value="neet-ug-preparation">🩺 NEET-UG Medical Entrance Track</option>
                          <option value="coding-python-ai-foundations">💻 FutureSkills: Python, AI & Robotics Lab</option>
                          <option value="cyber-security-fundamentals">🛡️ Cyber Security & Digital Defense</option>
                          <option value="english-communication-personality">🗣️ Personality Development & Communication</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Learning Mode
                        </label>
                        <select
                          value={deliveryMode}
                          onChange={(e) => setDeliveryMode(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        >
                          <option value="HYBRID">Hybrid (Classroom + In-House Studio)</option>
                          <option value="OFFLINE">Offline Campus (Civil Lines, Prayagraj)</option>
                          <option value="ONLINE">100% Online Interactive Live</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={parentConsent}
                          onChange={(e) => setParentConsent(e.target.checked)}
                          className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                        />
                        <span>
                          I confirm parent/guardian consent to receive Diwali concession vouchers, admission counseling, and trial class schedule on WhatsApp/Call.
                        </span>
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitMutation.isPending}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:opacity-95 text-slate-950 font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {submitMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Confirming Festive Concession...</span>
                          </>
                        ) : (
                          <>
                            <span>CLAIM UP TO 45% OFF &amp; FREE DEMO</span>
                            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
