import * as React from "react";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { ContentStatus } from "@prisma/client";
import { UniversityProgramCatalog } from "@/components/public/university-program-catalog";
import {
  GraduationCap,
  Award,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Building2,
  BookOpen,
  Users,
  Compass,
  FileCheck2,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  Landmark,
  BadgeCheck,
} from "lucide-react";
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* 1. Deep Royal Navy Hero Header Section with Luminous Accents */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#040914] via-[#091426] to-[#060e1d] py-14 sm:py-18 lg:py-22">
        {/* Ambient Glowing Orbs & Background Architecture Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[350px] bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-10 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[350px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: 7 Cols Header Content */}
            <div className="lg:col-span-7 space-y-5">
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-emerald-500/20 border border-sky-400/40 text-sky-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Official Academic Partnership • Session {DPGU_CONFIG.sessionFull}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Dr. Preeti Global <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  University Programs
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed max-w-2xl">
                Recognized University Degrees, Polytechnic Diplomas, Professional Programs & Doctoral Research powered by SoftLab Global admissions counseling and industry training.
              </p>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
                SoftLab Global provides complete student guidance, branch allocations, official university fee schedules, lateral entry options, and session onboarding.
              </p>

              {/* Value Point Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-400 shadow-sm backdrop-blur-md">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Transparent Government Fee Schedules
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sky-400 shadow-sm backdrop-blur-md">
                  <ShieldCheck className="h-4 w-4 text-sky-400" />
                  Direct University Admissions Desk
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-amber-300 shadow-sm backdrop-blur-md">
                  <Award className="h-4 w-4 text-amber-400" />
                  UGC & Statutory Council Recognized
                </span>
              </div>
            </div>

            {/* Right Column: 5 Cols Graphic Showcase Banner */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl border border-sky-500/30 bg-gradient-to-br from-slate-900/95 via-[#0b172d]/95 to-slate-950/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl overflow-hidden group">
                {/* Visual Glow Accents */}
                <div className="absolute -top-16 -right-16 w-44 h-44 bg-sky-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400/5 via-transparent to-transparent pointer-events-none" />

                {/* University Emblem Crest Header */}
                <div className="relative z-10 flex items-center justify-between pb-5 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="h-13 w-13 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-400 p-0.5 shadow-lg shadow-sky-500/20">
                      <div className="h-full w-full rounded-2xl bg-slate-950 flex items-center justify-center">
                        <Landmark className="h-6 w-6 text-sky-300" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                          Verified Academic Institution
                        </span>
                      </div>
                      <h3 className="text-base font-black text-white tracking-tight">
                        Dr. Preeti Global University
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Shivpuri, Madhya Pradesh, India
                      </p>
                    </div>
                  </div>

                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Award className="h-5 w-5" />
                  </div>
                </div>

                {/* Academic Highlights Badges */}
                <div className="relative z-10 py-5 space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-200">Programs Offered</span>
                    </div>
                    <span className="text-xs font-black text-sky-400 font-mono">25 Accredited Degrees</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <BadgeCheck className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-200">Recognition & Approval</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono">UGC 2(f) Recognized</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <FileCheck2 className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-200">Admission Mode</span>
                    </div>
                    <span className="text-xs font-bold text-amber-300 font-mono">Direct & Lateral Entry</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-200">Facilitation Center</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-300 font-mono">SoftLab Global Prayagraj</span>
                  </div>
                </div>

                {/* Direct Action Bar */}
                <div className="relative z-10 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Session Admissions:</span>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                      2026 Batch Active
                    </span>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href="tel:9194085890"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all"
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      <span>Direct Desk: 91940 85890</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metric Highlights Bar */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-800/80">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sky-400 mb-1">
                <GraduationCap className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Programs</span>
              </div>
              <p className="text-2xl font-black text-white">25 Courses</p>
              <p className="text-[11px] text-slate-400 mt-0.5">UG, PG, Diploma & Ph.D</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Building2 className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">University</span>
              </div>
              <p className="text-2xl font-black text-white">DPGU</p>
              <p className="text-[11px] text-slate-400 mt-0.5">State Private University</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <BookOpen className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Eligibility</span>
              </div>
              <p className="text-2xl font-black text-white">Direct / Lateral</p>
              <p className="text-[11px] text-slate-400 mt-0.5">10th, 12th & Degree Holders</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Admissions</span>
              </div>
              <p className="text-2xl font-black text-white">Open 2026</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Counselor Desk Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Catalog Section with Rich Dark Gradient Background */}
      <section className="relative py-12 sm:py-16 bg-gradient-to-b from-[#060e1d] via-slate-950 to-[#040811] flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <UniversityProgramCatalog programs={programs} />
        </div>
      </section>
    </div>
  );
}
