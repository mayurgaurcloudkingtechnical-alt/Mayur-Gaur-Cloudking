"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api as trpc } from "@/lib/trpc/react";
import { INITIAL_SKILLVERSE_COURSES, type SkillverseCategoryCode } from "@/lib/constants/skillverse-data";
import { Search, BookOpen, Clock, Users, ArrowRight, Filter } from "lucide-react";

const CATEGORY_TABS: { code: "ALL" | SkillverseCategoryCode; label: string }[] = [
  { code: "ALL", label: "All Programs" },
  { code: "SCHOOL_8_10", label: "School Foundation (8–10)" },
  { code: "SENIOR_11_12", label: "Senior Secondary (11–12)" },
  { code: "IIT_JEE", label: "IIT-JEE Foundation & Prep" },
  { code: "NEET_UG", label: "NEET-UG Foundation & Prep" },
  { code: "COMPETITIVE", label: "Olympiad, CUET & NDA" },
  { code: "TECH_AI_CODING", label: "AI, Coding, Robotics & Tech" },
  { code: "COMMUNICATION_CAREER", label: "English, Speaking & Career" },
];

export default function SkillverseAllCoursesPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | SkillverseCategoryCode>("ALL");
  const [selectedGrade, setSelectedGrade] = useState<string>("ALL");

  const { data } = trpc.skillverse.getPublicCatalog.useQuery();
  const courses = data?.courses || INITIAL_SKILLVERSE_COURSES;

  const filtered = courses.filter((c) => {
    if (c.status !== "PUBLISHED") return false;
    if (selectedCategory !== "ALL" && c.category !== selectedCategory) return false;
    if (selectedGrade !== "ALL" && !c.eligibleGrades.includes(selectedGrade)) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.shortSummary.toLowerCase().includes(q) ||
        c.categoryLabel.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#071630] to-[#0052CC] rounded-3xl p-8 sm:p-10 text-white space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-lime-300">
          Complete Academic & Skill Catalogue
        </span>
        <h1 className="text-3xl sm:text-4xl font-black">
          All SLG SKILLVERSE Courses & Foundations
        </h1>
        <p className="text-sm text-slate-200 max-w-3xl">
          Filter by Class (8 to 12), Academic Stream, Competitive Entrance Track (IIT-JEE, NEET-UG,
          Olympiad, CUET, NDA), or Future Technology & Communication Skills.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="search"
              placeholder="Search by subject, exam, skill (e.g. Python, JEE Main, NEET, Class 9, Excel)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm"
            />
          </div>
          <div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold"
            >
              <option value="ALL">All Classes (Classes 8 to 12)</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.code}
              type="button"
              onClick={() => setSelectedCategory(tab.code)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === tab.code
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                  {course.categoryLabel}
                </span>
                <span className="font-mono text-[11px] text-slate-400">{course.code}</span>
              </div>

              <h2 className="text-lg font-extrabold text-slate-900 leading-snug">
                {course.title}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">{course.shortSummary}</p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {course.eligibleGrades.map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Duration: {course.durationLabel}</span>
                <span>{course.teachingHours} Hrs</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-black text-blue-700">
                    ₹{course.priceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-500">
                    {course.billingCycle === "MONTHLY" ? "/month" : " total"}
                  </span>
                </div>
                <Link
                  href={`/skillverse/${course.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#071630] hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                >
                  View Curriculum <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
