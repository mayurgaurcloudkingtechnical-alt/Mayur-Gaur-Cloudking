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
import { University3DAcademicVisual } from "@/components/public/university-3d-academic-visual";

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

            {/* Right Column: 5 Cols 3D Holographic Academic Animation Visual */}
            <div className="lg:col-span-5 relative w-full">
              <University3DAcademicVisual />
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
