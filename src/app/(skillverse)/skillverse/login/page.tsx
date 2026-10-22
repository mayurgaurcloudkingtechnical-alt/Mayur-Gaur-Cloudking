import React from "react";
import { SkillverseAuthForm } from "@/components/skillverse/skillverse-auth-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skillverse Portal Login — SoftLab Global",
  description: "Secure gateway for Skillverse Staff, Teachers, Students and Parents.",
};

export default function SkillverseLoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/60">
      <SkillverseAuthForm
        title="SLG SKILLVERSE Academic Gateway"
        subtitle="School Foundation, STEM, IIT-JEE & NEET Academic Command Center"
        onSuccessRedirectUrl="/skillverse/crm"
      />
    </div>
  );
}
