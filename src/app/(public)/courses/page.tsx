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
    },
  });

  return (
    <div className="flex flex-col">
      {/* Catalog Header */}
      <section className="bg-gradient-to-b from-emerald-50/70 to-white py-12 sm:py-16 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Curriculum Directory
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Explore Our Engineering Programs
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Every course is engineered with extensive hands-on labs, architectural rigor, and live project deliverables designed for modern tech careers.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Catalog Section */}
      <section className="py-12 bg-slate-50/50 min-h-[500px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CourseCatalogClient courses={courses} />
        </div>
      </section>
    </div>
  );
}
