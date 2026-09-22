import * as React from "react";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { ContentStatus } from "@prisma/client";
import { UniversityProgramCatalog } from "@/components/public/university-program-catalog";
import { GraduationCap, Award, ShieldCheck, CheckCircle2 } from "lucide-react";
import { DPGU_CONFIG } from "@/config/university.config";

export const metadata: Metadata = {
  title: "Dr. Preeti Global University Programs | SoftLab Global",
  description:
    "Explore undergraduate, postgraduate, diploma, professional, and doctoral programs through Dr. Preeti Global University. Admissions guidance, fee structures, and career counseling by SoftLab Global.",
};

export const revalidate = 60; // ISR cache revalidation every minute

export default async function DrPreetiGlobalUniversityPage() {
  // Query all published university partner programs from central database
  const programs = await db.course.findMany({
    where: {
      providerType: "UNIVERSITY",
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      durationYears: true,
      durationWeeks: true,
      programCategory: true,
      specialization: true,
      specializations: true,
      registrationFee: true,
      examinationFee: true,
      universityFeeYear: true,
      lateralEntryFee: true,
      isLateralEligible: true,
      admissionSession: true,
      summary: true,
      description: true,
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/40">
      {/* Hero Header Section */}
      <section className="bg-gradient-to-b from-sky-50/80 via-white to-slate-50/50 py-12 sm:py-16 border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/70 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>University Degree & Diploma Directory</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Dr. Preeti Global University Programs
            </h1>

            <p className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed">
              University Degree, Diploma, Professional & Research Programs through SoftLab Global
            </p>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
              SoftLab Global provides and advises students for Dr. Preeti Global University academic programs. Learn about branch specializations, official fee schedules, lateral entry options, and admission sessions.
            </p>

            {/* Value Points */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Transparent Fee Schedules
              </span>
              <span className="flex items-center gap-1.5 text-sky-700">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                Direct Admission Desk
              </span>
              <span className="flex items-center gap-1.5 text-indigo-700">
                <Award className="h-4 w-4 text-indigo-600" />
                Session 2026 Admissions
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <UniversityProgramCatalog programs={programs} />
        </div>
      </section>
    </div>
  );
}
