import * as React from "react";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { ContentStatus } from "@prisma/client";
import { BosseAcademicView } from "@/components/public/bosse-academic-view";
import {
  GraduationCap,
  Award,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "BOSSE Board Class 10th & 12th Admissions (Open Schooling) | SoftLab Global",
  description:
    "Official BOSSE (Board of Open Schooling and Skill Education, Sikkim) Class 10th & 12th Admissions (Science, Commerce, Arts). Transparent fee packages, Transfer of Credit (TOC), and recognized across India by COBSE, AIU, NEET & JEE.",
  keywords: [
    "BOSSE Board Admissions",
    "BOSSE 10th admission fee",
    "BOSSE 12th science fee",
    "BOSSE 12th commerce",
    "Open Schooling Prayagraj",
    "BOSSE Board Sikkim",
    "Transfer of credit open school",
    "NEET eligible open board",
  ],
};

export const revalidate = 60; // Revalidate every minute

export default async function BosseBoardPage() {
  const courses = await db.course.findMany({
    where: {
      providerName: { contains: "BOSSE" },
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
      baseFee: true,
      programCategory: true,
      specialization: true,
      specializations: true,
      summary: true,
      description: true,
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* 1. Deep Emerald & Indigo Hero Header Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#031510] via-[#041d17] to-[#040e0b] py-14 sm:py-20">
        {/* Ambient Glowing Orbs & Background Architecture Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-10 w-[500px] h-[500px] bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <div className="max-w-3xl space-y-5">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-sky-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Official Open Schooling Admissions • Session 2026-27</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              BOSSE Board <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                Class 10th & 12th Admissions
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
              Board of Open Schooling and Skill Education (BOSSE), Sikkim. Recognized by Govt. of Sikkim under Act No. 14 of 2020, COBSE, AIU, and valid across India for Higher Education, NEET, JEE, Defence, and Govt. Jobs.
            </p>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              SoftLab Global provides complete student guidance, Transfer of Credit (TOC) processing, practical lab coaching, and transparent all-inclusive fee structures with ₹0 extra charges.
            </p>

            {/* Value Point Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-400 shadow-sm backdrop-blur-md">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                10th Fee: ₹36,500 Complete
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sky-400 shadow-sm backdrop-blur-md">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                12th Science: ₹39,500 Complete (with Labs)
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-amber-300 shadow-sm backdrop-blur-md">
                <CheckCircle2 className="h-4 w-4 text-amber-400" />
                12th Commerce: ₹37,500 Complete
              </span>
            </div>

            <div className="pt-4 flex flex-wrap gap-3">
              <a href="#programs">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-5 shadow-lg shadow-emerald-950/50">
                  View Programs & Fees
                </Button>
              </a>
              <a href="#inquiry-form">
                <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs">
                  Apply Online Now
                </Button>
              </a>
              <a
                href="https://www.bosse.ac.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300 transition-colors py-2.5 px-3"
              >
                <span>Official BOSSE Board Portal</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content Section */}
      <section className="relative py-12 sm:py-16 bg-gradient-to-b from-[#040e0b] via-slate-950 to-[#020705] flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BosseAcademicView courses={courses} />
        </div>
      </section>
    </div>
  );
}
