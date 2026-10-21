import React from "react";
import Link from "next/link";
import { SkillverseLeadForm } from "@/components/skillverse/skillverse-lead-form";
import { CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

const ADMISSION_STEPS = [
  "1. Enquiry",
  "2. Follow-Up",
  "3. Free Demo Booking",
  "4. Free Diagnostic Assessment",
  "5. Academic Counseling",
  "6. Application",
  "7. Parent Consent Verification",
  "8. Transparent Fee Payment",
  "9. Formal Enrollment",
  "10. Batch Allocation",
  "11. Active Student Portal Access",
];

export default function SkillverseAdmissionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="bg-gradient-to-r from-[#071630] via-[#0B2247] to-[#0052CC] rounded-3xl p-8 sm:p-10 text-white space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-lime-300">
          Structured 11-Stage Admissions Process
        </span>
        <h1 className="text-3xl sm:text-4xl font-black">
          Admissions & Enrollment — SLG SKILLVERSE
        </h1>
        <p className="text-sm text-slate-200 max-w-3xl">
          Transparent, parent-consented admissions for Classes 8 to 12 across School Foundation,
          Senior Secondary Streams, IIT-JEE, NEET-UG, Olympiad/CUET/NDA, and Future Technology
          courses.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {ADMISSION_STEPS.map((s) => (
            <span
              key={s}
              className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-[11px] font-bold text-cyan-200"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <SkillverseLeadForm
            mode="ADMISSION_ENQUIRY"
            title="Start Your Official SLG SKILLVERSE Admission Enquiry"
            subtitle="Complete the student and parent details below. You will receive an instant SV-ADM reference number."
          />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-3 text-xs text-slate-700">
            <h2 className="font-extrabold text-base text-slate-900">
              Admission Eligibility & Fee Rules
            </h2>
            <p>
              • <strong>Eligible Classes:</strong> Students currently studying in Classes 8, 9, 10,
              11, or 12 in CBSE, ICSE/ISC, UP Board, or State Boards.
            </p>
            <p>
              • <strong>Initial Diagnostic Assessment:</strong> Free (₹0)
            </p>
            <p>
              • <strong>Trial Demo Class:</strong> Free (₹0)
            </p>
            <p>
              • <strong>One-Time Admission & Registration:</strong> ₹500 (payable only upon formal
              enrollment)
            </p>
            <p>
              • <strong>One-Time Student ID & Learning Kit:</strong> ₹500 (payable only upon formal
              enrollment)
            </p>
            <div className="pt-2">
              <Link
                href="/skillverse/packages-and-fees"
                className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
              >
                Review Full Fee Structure <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
