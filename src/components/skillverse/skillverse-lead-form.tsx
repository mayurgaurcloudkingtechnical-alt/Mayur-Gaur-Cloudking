"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api as trpc } from "@/lib/trpc/react";
import {
  INITIAL_SKILLVERSE_COURSES,
  INITIAL_ACADEMIC_PACKAGES,
  INITIAL_COMPETITIVE_ADDONS,
} from "@/lib/constants/skillverse-data";
import {
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";

interface SkillverseLeadFormProps {
  mode?: "ADMISSION_ENQUIRY" | "DEMO_BOOKING";
  defaultCourseSlug?: string;
  defaultGrade?: string;
  title?: string;
  subtitle?: string;
}

export function SkillverseLeadForm({
  mode = "ADMISSION_ENQUIRY",
  defaultCourseSlug = "school-foundation-8-10",
  defaultGrade = "Class 9",
  title,
  subtitle,
}: SkillverseLeadFormProps) {
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentClass, setCurrentClass] = useState(defaultGrade);
  const [board, setBoard] = useState("CBSE");
  const [schoolName, setSchoolName] = useState("");
  const [preferredCourseSlug, setPreferredCourseSlug] = useState(defaultCourseSlug);
  const [preferredPackageId, setPreferredPackageId] = useState("PKG-2-EXCELLENCE");
  const [competitiveAddonId, setCompetitiveAddonId] = useState("");
  const [preferredBatchTiming, setPreferredBatchTiming] = useState("Evening (4:00 PM – 6:00 PM)");
  const [deliveryMode, setDeliveryMode] = useState<"ONLINE" | "OFFLINE" | "HYBRID">("HYBRID");
  const [city, setCity] = useState("Prayagraj");
  const [locality, setLocality] = useState("Civil Lines");
  const [demoDate, setDemoDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  );
  const [parentConsentAccepted, setParentConsentAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<{
    referenceNumber: string;
    studentName: string;
    stage: string;
    duplicate: boolean;
  } | null>(null);

  const submitMutation = trpc.skillverse.submitAdmissionEnquiry.useMutation({
    onSuccess: (res) => {
      setErrorMsg(null);
      setSubmittedRecord({
        referenceNumber: res.record.referenceNumber,
        studentName: res.record.studentName,
        stage: res.record.stage,
        duplicate: res.duplicate,
      });
    },
    onError: (err) => {
      setErrorMsg(err.message || "Could not submit your request. Please verify all fields.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!parentConsentAccepted) {
      setErrorMsg(
        "Parent/Guardian consent and Child Safety Policy acknowledgement is required before submitting student details."
      );
      return;
    }

    submitMutation.mutate({
      studentName,
      parentName,
      phone,
      email,
      currentClass,
      board,
      schoolName: schoolName || undefined,
      preferredCourseSlug,
      preferredPackageId: preferredPackageId || undefined,
      competitiveAddonId: competitiveAddonId || undefined,
      preferredBatchTiming,
      deliveryMode,
      city,
      locality,
      enquirySource: mode === "DEMO_BOOKING" ? "DEMO_CLASS_PAGE" : "SKILLVERSE_ADMISSIONS_FORM",
      parentConsentAccepted,
      initialStage: mode === "DEMO_BOOKING" ? "DEMO_BOOKING" : "ENQUIRY",
      demoScheduledAt: mode === "DEMO_BOOKING" ? demoDate : undefined,
      honeypot: honeypot || undefined,
    });
  };

  if (submittedRecord) {
    return (
      <div className="bg-white rounded-3xl border-2 border-emerald-200 p-8 shadow-lg text-slate-900 space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4" />
          {submittedRecord.duplicate
            ? "Existing Active Request Found"
            : mode === "DEMO_BOOKING"
            ? "Free Demo Class Reserved"
            : "Admission Enquiry Registered"}
        </div>
        <h3 className="text-2xl font-extrabold text-slate-900">
          Thank You! Request Reference:{" "}
          <span className="font-mono text-blue-700">{submittedRecord.referenceNumber}</span>
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          We have registered the academic profile for <strong>{submittedRecord.studentName}</strong>{" "}
          with verified parent/guardian consent. Our Skillverse Academic Counselor will connect with
          you during support hours to confirm batch timings and next steps.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/skillverse/student-assessment"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
          >
            Take Free Diagnostic Assessment Now →
          </Link>
          <button
            type="button"
            onClick={() => setSubmittedRecord(null)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
          >
            Submit Another Student Enquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-md">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          {mode === "DEMO_BOOKING" ? "Zero-Fee Trial Session" : "SLG Skillverse Admissions Desk"}
        </span>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          {title ||
            (mode === "DEMO_BOOKING"
              ? "Book Your Free Live Demo Class & Counseling Session"
              : "Submit Student Admission & Counseling Enquiry")}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {subtitle ||
            "Free initial academic assessment and free demo class. Complete fee transparency with parent/guardian consent protection."}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Student Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="Student's full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Parent / Guardian Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="Father / Mother / Legal Guardian name"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Parent Mobile / WhatsApp Number *
            </label>
            <input
              type="tel"
              required
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Parent / Family Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Current Class *</label>
            <select
              value={currentClass}
              onChange={(e) => setCurrentClass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">School Board *</label>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="CBSE">CBSE</option>
              <option value="ICSE / ISC">ICSE / ISC</option>
              <option value="UP Board">UP Board</option>
              <option value="Other State Board">Other State Board</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Current School Name
            </label>
            <input
              type="text"
              placeholder="School name (optional)"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Primary Course Interest *
            </label>
            <select
              value={preferredCourseSlug}
              onChange={(e) => setPreferredCourseSlug(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              {INITIAL_SKILLVERSE_COURSES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Preferred Academic Package
            </label>
            <select
              value={preferredPackageId}
              onChange={(e) => setPreferredPackageId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="">Standalone Course Only</option>
              {INITIAL_ACADEMIC_PACKAGES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₹{p.monthlyPriceInr.toLocaleString("en-IN")}/mo)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Competitive-Exam Add-On (Optional)
            </label>
            <select
              value={competitiveAddonId}
              onChange={(e) => setCompetitiveAddonId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="">No Competitive Add-On Selected</option>
              {INITIAL_COMPETITIVE_ADDONS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (+₹{a.monthlyAddonPriceInr.toLocaleString("en-IN")}/mo)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Mode *</label>
            <select
              value={deliveryMode}
              onChange={(e) =>
                setDeliveryMode(e.target.value as "ONLINE" | "OFFLINE" | "HYBRID")
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="HYBRID">Hybrid (Classroom + Live Online)</option>
              <option value="OFFLINE">Classroom (Civil Lines, Prayagraj)</option>
              <option value="ONLINE">Live Interactive Online</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Preferred Batch Timing
            </label>
            <select
              value={preferredBatchTiming}
              onChange={(e) => setPreferredBatchTiming(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="Afternoon (3:30 PM – 5:30 PM)">Afternoon (3:30 PM – 5:30 PM)</option>
              <option value="Evening (4:00 PM – 6:00 PM)">Evening (4:00 PM – 6:00 PM)</option>
              <option value="Late Evening (6:00 PM – 8:00 PM)">
                Late Evening (6:00 PM – 8:00 PM)
              </option>
              <option value="Weekend Batch (Sat & Sun)">Weekend Batch (Sat & Sun)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Locality *</label>
            <input
              type="text"
              required
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>
        </div>

        {mode === "DEMO_BOOKING" && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Preferred Demo Class Date
            </label>
            <input
              type="date"
              value={demoDate}
              onChange={(e) => setDemoDate(e.target.value)}
              className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>
        )}

        {/* Mandatory Parent/Guardian DPDP Consent */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 leading-relaxed">
            <input
              type="checkbox"
              checked={parentConsentAccepted}
              onChange={(e) => setParentConsentAccepted(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-blue-600 shrink-0"
            />
            <span>
              <strong>Verifiable Parent / Legal Guardian Consent (Required):</strong> As the parent
              or legal guardian of the student named above, I consent to the collection and
              processing of this academic enquiry in accordance with the{" "}
              <Link
                href="/skillverse/child-safety-consent"
                className="text-blue-700 font-bold underline"
              >
                Child Safety & Parent Consent Policy
              </Link>{" "}
              and{" "}
              <Link href="/skillverse/privacy-policy" className="text-blue-700 font-bold underline">
                Privacy Policy (DPDP Framework)
              </Link>
              .
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#0077FF] hover:opacity-95 disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting securely...
            </>
          ) : mode === "DEMO_BOOKING" ? (
            <>
              Confirm Free Demo Class Booking <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Submit Admission & Counseling Enquiry <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
