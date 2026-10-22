"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { api as trpc } from "@/lib/trpc/react";
import { SKILLVERSE_BRAND } from "@/lib/constants/skillverse-data";
import {
  X,
  Sparkles,
  PhoneCall,
  MessageCircle,
  User,
  UserCheck,
  Mail,
  GraduationCap,
  MapPin,
  Video,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building,
  ArrowRight,
} from "lucide-react";

export function openSkillverseEnquiryModal(detail?: { courseSlug?: string; grade?: string }) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("skillverse:open-enquiry-modal", { detail })
    );
  }
}

export function SkillverseEnquiryModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    referenceNumber: string;
    studentName: string;
    phone: string;
  } | null>(null);

  // Form State
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

  // Auto-trigger on page load / refresh for all public website visitors
  useEffect(() => {
    // Avoid interrupting staff working inside the admissions CRM or staff login
    const isStaffPortal =
      pathname.includes("/skillverse/crm") ||
      pathname.includes("/skillverse/staff-login") ||
      pathname.includes("/skillverse/lms");

    if (isStaffPortal) {
      return;
    }

    // Popup immediately on refresh / initial open with a smooth 350ms delay
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 350);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Listen for manual trigger events from "Book Demo" or "Enquire Now" buttons
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ courseSlug?: string; grade?: string }>;
      if (customEvent.detail?.courseSlug) {
        setPreferredProgram(customEvent.detail.courseSlug);
      }
      if (customEvent.detail?.grade) {
        setCurrentClass(customEvent.detail.grade);
      }
      setSubmittedData(null);
      setErrorMsg(null);
      setIsOpen(true);
    };

    window.addEventListener("skillverse:open-enquiry-modal", handleOpen);
    return () => {
      window.removeEventListener("skillverse:open-enquiry-modal", handleOpen);
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
      setErrorMsg(err.message || "Failed to submit enquiry. Please check your contact details.");
    },
  });

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
      enquirySource: "WEBSITE_REFRESH_POPUP",
      parentConsentAccepted: true,
      initialStage: "ENQUIRY",
    });
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      /* Floating Pill to manually reopen anytime */
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 bottom-5 z-40 hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-[#0052CC] via-[#0077FF] to-[#16A34A] text-white text-xs font-bold shadow-xl hover:scale-105 transition-all border border-white/20 cursor-pointer animate-bounce"
        title="Open Skillverse Admission & Demo Enquiry Form"
      >
        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
        <span>Enquire Now (Free Demo)</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Backdrop click to dismiss */}
      <div
        className="fixed inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-50 w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#071630] via-[#0B2247] to-[#0D3823] text-white p-5 sm:p-6 relative border-b border-white/10">
          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer focus:outline-none"
            aria-label="Close Enquiry Form"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1 flex items-center justify-center border border-white/20 shadow-md shrink-0">
              <img
                src={SKILLVERSE_BRAND.logoPath}
                alt="SLG Skillverse"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-[10px] uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-emerald-400" /> Admissions 2026-27 Open • Free Demo Class
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                SLG SKILLVERSE — Academic & Future Skills Desk
              </h2>
              <p className="text-xs text-slate-300">
                School Foundation (Classes 8–12) • IIT-JEE • NEET • AI Coding • In-House Live Studio
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 max-h-[75vh] overflow-y-auto">
          {submittedData ? (
            /* Success Confirmation State */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-[#16A34A] mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  Enquiry Successfully Registered!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Thank you, <strong>{submittedData.studentName}</strong>. Your academic counseling request is confirmed.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-2 max-w-md mx-auto">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Application Reference:</span>
                  <span className="font-mono font-black text-emerald-800 text-sm">
                    {submittedData.referenceNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Assigned Counselor Wing:</span>
                  <span className="font-bold text-slate-800">Prayagraj Academic Cell</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Free Benefit Unlocked:</span>
                  <span className="font-bold text-emerald-700">₹500 Registration Waiver + Free Trial Class</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Our Senior Academic Mentor will connect with you on WhatsApp / Phone (
                <strong>+91 {submittedData.phone}</strong>) within support hours to schedule your free demo class.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={`https://wa.me/919196596975?text=${encodeURIComponent(
                    `Hello Skillverse Team, I submitted an admission enquiry for ${submittedData.studentName} (Ref: ${submittedData.referenceNumber}). Please confirm our Free Demo Class schedule.`
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
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Continue to Website →
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Enquiry Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Limited-Time Welcome Offer:</strong> Submit this enquiry now to receive a{" "}
                  <strong>Free In-House Studio Demo Class</strong> & complete syllabus blueprint!
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Student Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Student Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Aryan Sharma"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                    />
                  </div>
                </div>

                {/* Parent Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parent / Guardian Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Rajesh Sharma"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                    />
                  </div>
                </div>

                {/* Mobile / WhatsApp Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp / Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="e.g., parent@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                    />
                  </div>
                </div>

                {/* Target Class / Grade */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current Class / Level <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={currentClass}
                      onChange={(e) => setCurrentClass(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-slate-800"
                    >
                      <option value="Class 8">Class 8 (Foundation)</option>
                      <option value="Class 9">Class 9 (Foundation & Olympiads)</option>
                      <option value="Class 10">Class 10 (Board Exam Mastery)</option>
                      <option value="Class 11">Class 11 (Science / Commerce)</option>
                      <option value="Class 12">Class 12 (Boards + CUET)</option>
                      <option value="IIT-JEE Prep">IIT-JEE Main & Advanced</option>
                      <option value="NEET Prep">NEET-UG Medical</option>
                      <option value="AI & Coding">AI & Coding Lab (Classes 8–12)</option>
                    </select>
                  </div>
                </div>

                {/* School Board */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    School Board <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-slate-800"
                    >
                      <option value="CBSE">CBSE Board</option>
                      <option value="ICSE">ICSE / ISC Board</option>
                      <option value="UP Board">UP Board (State Board)</option>
                      <option value="Other">Other State Board</option>
                    </select>
                  </div>
                </div>

                {/* Preferred Course Track */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred Program Track
                  </label>
                  <select
                    value={preferredProgram}
                    onChange={(e) => setPreferredProgram(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-slate-800"
                  >
                    <option value="school-foundation-8-10">School Foundation (Classes 8–10)</option>
                    <option value="senior-secondary-11-12">Senior Secondary (Classes 11–12)</option>
                    <option value="iit-jee-foundation">IIT-JEE Foundation & Extension</option>
                    <option value="neet-ug-foundation">NEET-UG Foundation & Prep</option>
                    <option value="ai-and-coding">AI Literacy & Python Coding</option>
                    <option value="robotics-and-stem">Robotics & STEM Project Lab</option>
                    <option value="spoken-english-personality">Spoken English & Communication</option>
                  </select>
                </div>

                {/* Learning Mode */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred Learning Mode
                  </label>
                  <div className="relative">
                    <Video className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={deliveryMode}
                      onChange={(e) => setDeliveryMode(e.target.value as any)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-slate-800"
                    >
                      <option value="HYBRID">Hybrid (Online Live + Weekend Offline)</option>
                      <option value="ONLINE">Live Studio (100% Online Interactive)</option>
                      <option value="OFFLINE">Classroom (Prayagraj Campus)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* City / Locality */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City / Location
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g., Prayagraj, Lucknow, Varanasi, Delhi..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                </div>
              </div>

              {/* Parent Consent Checkbox */}
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={parentConsent}
                  onChange={(e) => setParentConsent(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-[11px] text-slate-600 leading-tight">
                  I confirm that I am a parent/guardian and agree to receive academic counseling updates, demo class confirmations, and fee scholarship information via Call / WhatsApp.
                </span>
              </label>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0052CC] via-[#0077FF] to-[#16A34A] hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Academic Enquiry...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>Submit Enquiry & Claim Free Demo Class</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Footer Trust Bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> DPDP & Child Safety Protected
                </span>
                <a
                  href="tel:+919196596975"
                  className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <PhoneCall className="w-3 h-3" /> Helpline: +91 91965 96975
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
