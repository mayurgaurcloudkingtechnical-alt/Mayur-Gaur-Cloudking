import * as React from "react";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { ContentStatus } from "@prisma/client";
import { CourseCatalogClient } from "@/components/public/course-catalog-client";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Course Catalog — SOFTLAB GLOBAL",
  description:
    "Explore our industry-aligned technology programs in Full Stack Software Engineering, Cloud DevOps, and Data Science. Production-grade curriculum in Prayagraj.",
};

export default async function CoursesPage() {
  // Query strictly PUBLISHED courses from PostgreSQL
  const courses = await db.course.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      providerType: { not: "UNIVERSITY" },
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      durationWeeks: true,
      baseFee: true,
      level: true,
      language: true,
      eligibility: true,
      thumbnailUrl: true,
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* 1. Deep Cyber Emerald & Slate Hero Header Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#030914] via-[#071626] to-[#040914] py-14 sm:py-20">
        {/* Ambient Glowing Orbs & Tech Circuit Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[650px] h-[350px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-10 w-[500px] h-[500px] bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[350px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <div className="max-w-3xl space-y-4">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SoftLab Global Tech Academy • 21 Flagship Cohorts</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Explore Our{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Engineering Programs
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
              Every course is engineered with extensive hands-on labs, architectural rigor, and live project deliverables designed for modern tech careers.
            </p>

            {/* Quick Value Metrics */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-400 shadow-sm backdrop-blur-md">
                100% Practical Labs & Placement Support
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-teal-300 shadow-sm backdrop-blur-md">
                ISO 9001:2015 Certified Curriculum
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-cyan-300 shadow-sm backdrop-blur-md">
                Live Cloud, DevOps & AI Deployments
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Catalog Section */}
      <section className="py-12 sm:py-16 bg-slate-950 min-h-[600px] relative">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-30 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <CourseCatalogClient courses={courses} />
        </div>
      </section>
    </div>
  );
}
