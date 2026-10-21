import React from "react";
import { SkillverseLeadForm } from "@/components/skillverse/skillverse-lead-form";

export default function SkillverseFreeDemoClassPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="bg-gradient-to-r from-[#15803D] to-[#0052CC] rounded-3xl p-8 sm:p-10 text-white space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-lime-200">
          Zero-Cost Trial Experience (₹0)
        </span>
        <h1 className="text-3xl sm:text-4xl font-black">
          Book a Free SLG SKILLVERSE Demo Class
        </h1>
        <p className="text-sm text-slate-100 max-w-2xl">
          Experience our concept-first teaching methodology, interactive doubt-solving, and AI/Tech
          labs before enrolling. Available both in Classroom (Civil Lines, Prayagraj) and Live
          Online.
        </p>
      </div>

      <SkillverseLeadForm
        mode="DEMO_BOOKING"
        title="Schedule Your Free Demo Class & Parent Counseling Session"
        subtitle="Select your preferred subject, grade, delivery mode, and preferred demo date."
      />
    </div>
  );
}
