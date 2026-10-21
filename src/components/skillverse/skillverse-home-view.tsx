"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  SKILLVERSE_BRAND,
  type SkillverseCourseItem,
  type SkillverseAcademicPackage,
  type SkillverseCompetitiveAddon,
  type SkillverseFeeRuleConfig,
} from "@/lib/constants/skillverse-data";
import type { SkillverseCmsSettings } from "@/server/services/skillverse.service";
import { SkillverseLeadForm } from "./skillverse-lead-form";
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Cpu,
  Calculator,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Users,
  Award,
  Clock,
  Layers,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  BarChart3,
  BrainCircuit,
} from "lucide-react";

const GRADES = ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"] as const;

interface SkillverseHomeViewProps {
  courses: SkillverseCourseItem[];
  packages: SkillverseAcademicPackage[];
  addons: SkillverseCompetitiveAddon[];
  feeRules: SkillverseFeeRuleConfig;
  cms: SkillverseCmsSettings;
  faqs: { category: string; question: string; answer: string }[];
  verifiedFaculty: {
    id: string;
    name: string;
    specializations: string[];
    experienceYears: number;
    bio: string | null;
  }[];
}

export function SkillverseHomeView({
  courses,
  packages,
  addons,
  feeRules,
  cms,
  faqs,
  verifiedFaculty,
}: SkillverseHomeViewProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>("Class 9");
  const [calcPackageId, setCalcPackageId] = useState<string>(packages[1]?.id || "PKG-2-EXCELLENCE");
  const [calcAddonId, setCalcAddonId] = useState<string>("");

  const gradeCourses = courses.filter((c) => c.eligibleGrades.includes(selectedGrade));
  const gradePackages = packages.filter((p) => p.gradeList.includes(selectedGrade));

  const selectedPkg = packages.find((p) => p.id === calcPackageId);
  const selectedAddon = addons.find((a) => a.id === calcAddonId);

  const monthlyRecurringInr =
    (selectedPkg?.monthlyPriceInr || 0) + (selectedAddon?.monthlyAddonPriceInr || 0);
  const firstMonthTotalPayableInr =
    monthlyRecurringInr +
    feeRules.admissionAndRegistrationFeeInr +
    feeRules.studentIdAndLearningKitFeeInr;

  return (
    <div className="space-y-20 pb-20">
      {/* 1. PREMIUM HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071630] via-[#0B2247] to-[#0E336B] text-white pt-14 pb-20 border-b border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-cyan-400/30 text-xs font-bold">
                <span className="text-lime-400 uppercase tracking-wider">SLG SKILLVERSE</span>
                <span className="text-slate-400">•</span>
                <span className="text-cyan-300">{SKILLVERSE_BRAND.tagline}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                Build Strong Foundations.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-lime-300 to-emerald-300">
                  Become Future Ready.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
                {cms.heroSubheadline}
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/skillverse/courses"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-[#0066FF] to-[#00B4D8] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all"
                >
                  Explore Courses <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/skillverse/free-demo-class"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-[#15803D] to-[#65A30D] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-emerald-700/30 transition-all"
                >
                  Book a Free Demo
                </Link>
                <Link
                  href="/skillverse/student-assessment"
                  className="inline-flex items-center gap-2 px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs sm:text-sm transition-all"
                >
                  Free Diagnostic Assessment
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <span className="text-lime-400 font-black text-base block">Classes 8–12</span>
                  <span className="text-slate-300">CBSE, ICSE/ISC & State</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <span className="text-cyan-300 font-black text-base block">IIT-JEE & NEET</span>
                  <span className="text-slate-300">Foundation & Prep Tracks</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <span className="text-emerald-300 font-black text-base block">AI & Coding</span>
                  <span className="text-slate-300">Python, Web, Robotics</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <span className="text-amber-300 font-black text-base block">₹0 Free Demo</span>
                  <span className="text-slate-300">+ Free Skill Assessment</span>
                </div>
              </div>
            </div>

            {/* Right Hero Brand Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl border-2 border-cyan-400/40 space-y-5">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <img
                    src={SKILLVERSE_BRAND.logoPath}
                    alt="SoftLab Global SLG Skillverse"
                    className="w-16 h-16 object-contain rounded-2xl border border-slate-200 p-1"
                  />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 block">
                      Powered by SoftLab Global
                    </span>
                    <h2 className="text-2xl font-black text-[#071630]">SLG SKILLVERSE</h2>
                    <p className="text-xs font-semibold text-blue-700">
                      {SKILLVERSE_BRAND.supportingLine}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">
                        School Foundation (Classes 8–10 & 11–12)
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        Maths, Science, Physics, Chemistry, Biology, Commerce, English & Board
                        Mastery starting at ₹1,499/month.
                      </p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-start gap-3">
                    <Cpu className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">
                        AI Literacy, Coding, Robotics & STEM
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        Prompt Engineering, Python, Web Dev, Data Analytics, Cyber Safety & Spoken
                        English.
                      </p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">
                        Dedicated Student & Parent Portals
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        Live attendance, timetable, assessment reports, transparent fee receipts &
                        PTM scheduling.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <Link
                    href="/skillverse/packages-and-fees"
                    className="text-xs font-bold text-blue-700 hover:underline"
                  >
                    View Complete Fee Table →
                  </Link>
                  <Link
                    href="/skillverse/admissions"
                    className="px-4 py-2.5 rounded-xl bg-[#071630] hover:bg-slate-800 text-white text-xs font-bold"
                  >
                    Apply for Admission
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE GRADE SELECTOR (CLASSES 8, 9, 10, 11, 12) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
                Personalized Learning Path by Class
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Select Your Student’s Grade (Classes 8 to 12)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Explore age-appropriate academic packages, competitive foundations, and technology
                courses for your class.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {GRADES.map((grade) => {
                const active = selectedGrade === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setSelectedGrade(grade)}
                    className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
                      active
                        ? "bg-gradient-to-r from-[#0052CC] to-[#15803D] text-white shadow-md"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recommended Monthly Packages for Selected Grade */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
              Eligible Monthly Academic Packages for {selectedGrade}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {gradePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mb-2">
                      {pkg.badge}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base">{pkg.name}</h4>
                    <p className="text-xs text-slate-600 mt-1.5">{pkg.summary}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-black text-blue-700">
                        ₹{pkg.monthlyPriceInr.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-slate-500">/month</span>
                      <span className="block text-[10px] text-slate-400">
                        12-mo undiscounted: ₹
                        {pkg.twelveMonthUndiscountedTotalInr.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <Link
                      href="/skillverse/packages-and-fees"
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Courses Available for Selected Grade */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Available Courses & Tracks for {selectedGrade} ({gradeCourses.length} Programs)
              </h3>
              <Link
                href="/skillverse/courses"
                className="text-xs font-bold text-blue-700 hover:underline"
              >
                View Full Catalogue →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {gradeCourses.slice(0, 8).map((course) => (
                <Link
                  key={course.id}
                  href={`/skillverse/${course.slug}`}
                  className="group bg-white rounded-2xl border border-slate-200 p-4 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      {course.categoryLabel}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1 group-hover:text-blue-700">
                      {course.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                      {course.shortSummary}
                    </p>
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      ₹{course.priceInr.toLocaleString("en-IN")}
                      {course.billingCycle === "MONTHLY" ? "/mo" : ""}
                    </span>
                    <span className="text-blue-600 font-semibold inline-flex items-center gap-1">
                      Syllabus <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. IIT-JEE, NEET-UG & COMPETITIVE EXAM FOUNDATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Clear Academic Distinction • Official Syllabus Aligned
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
            IIT-JEE, NEET-UG & Competitive Exam Foundations
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            We clearly separate early conceptual foundation programs (Classes 8–10) from senior
            secondary full entrance-examination preparation (Classes 11–12).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: "IIT-JEE Foundation (Classes 8–10)",
              href: "/skillverse/iit-jee-foundation",
              price: "+₹1,500/month add-on",
              desc: "Early engineering-entrance foundation building mathematical thinking, scientific reasoning, and Olympiad-grade problem solving.",
              badge: "Early Foundation",
            },
            {
              title: "JEE Main & Advanced Extension (11–12)",
              href: "/skillverse/jee-main-preparation",
              price: "+₹3,000/mo Main | +₹2,000/mo Adv",
              desc: "Complete NTA JEE Main PCM syllabus, authorized PYQ drills, timed CBT mock tests, and JEE Advanced Extension for eligible scholars.",
              badge: "Full Entrance Prep",
            },
            {
              title: "NEET-UG Foundation & Prep (9–12)",
              href: "/skillverse/neet-ug-foundation",
              price: "+₹1,500/mo (9–10) | +₹3,000/mo (11–12)",
              desc: "Line-by-line NCERT Botany, Zoology, Physics, and Chemistry mastery with assertion-reason practice and 720-mark mock tests.",
              badge: "Pre-Medical Track",
            },
            {
              title: "Olympiad, CUET & NDA Foundations",
              href: "/skillverse/olympiad-scholarship",
              price: "₹800 – ₹1,500/month add-on",
              desc: "Targeted preparation for Science/Maths Olympiads, CUET (Language, Domain & General Test), NDA (Maths & GAT), and MAT/SAT aptitude.",
              badge: "Scholarship & Entrance",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold mb-3">
                  {card.badge}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">{card.title}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{card.desc}</p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-emerald-700 mb-3">{card.price}</div>
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline"
                >
                  Explore Program & Syllabus <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. ACADEMIC & TECHNOLOGY LEARNING PATHWAYS */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Dual-Engine Education Model
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              Academic Mastery + Future Technology Pathways
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Students can enroll in standalone short-term skill courses (1 to 3 months) or combine
              them with monthly school academic packages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                AI Literacy, Coding & Data Skills
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• AI Literacy & Prompt Engineering (1 Mo — ₹1,999)</li>
                <li>• Scratch Coding & Logic (2 Mo — ₹2,999)</li>
                <li>• Python Programming Foundation (3 Mo — ₹4,999)</li>
                <li>• Web Development Basics: HTML, CSS, JS (3 Mo — ₹4,999)</li>
                <li>• Introductory Data Analytics & Power BI (2 Mo — ₹3,499)</li>
              </ul>
              <Link
                href="/skillverse/ai-and-coding"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 pt-2"
              >
                Explore AI & Coding Courses →
              </Link>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Robotics, Digital Productivity & Cyber Safety
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• Robotics & STEM Projects (2 Mo — ₹3,999)</li>
                <li>• Computer Fundamentals (2 Mo — ₹2,499)</li>
                <li>• MS Office & Advanced Excel (2 Mo — ₹2,999)</li>
                <li>• Cyber Safety, Networking & Digital Citizenship (1 Mo — ₹1,499)</li>
                <li>• Financial Literacy & Entrepreneurship for Teens</li>
              </ul>
              <Link
                href="/skillverse/robotics-and-stem"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 pt-2"
              >
                Explore Robotics & Digital Courses →
              </Link>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Spoken English, Personality & Career Guidance
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• Spoken English Mastery (3 Mo — ₹3,999)</li>
                <li>• Public Speaking & Personality Development (1 Mo — ₹1,499)</li>
                <li>• Logical Reasoning & Quantitative Aptitude (2 Mo — ₹2,499)</li>
                <li>• Stream Selection (After Class 10) & Career Roadmaps</li>
                <li>• Student Portfolio & Scholarship Interview Readiness</li>
              </ul>
              <Link
                href="/skillverse/spoken-english-personality"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 pt-2"
              >
                Explore Communication & Career →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRANSPARENT PACKAGES & INTERACTIVE FEE CALCULATOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Zero Hidden Charges • No Silent Bundling
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
            Transparent Packages & Complete Payable Fee Calculator
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            All monthly academic packages, optional competitive-exam add-ons, and one-time admission
            fees are disclosed item-by-item before checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Package Cards */}
          <div className="lg:col-span-7 space-y-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setCalcPackageId(pkg.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  calcPackageId === pkg.id
                    ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase">
                      {pkg.eligibleGrades}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{pkg.name}</h3>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xl font-black text-blue-700">
                      ₹{pkg.monthlyPriceInr.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-500">/month</span>
                    <span className="block text-[10px] text-slate-500">
                      12-Month Undiscounted Total: ₹
                      {pkg.twelveMonthUndiscountedTotalInr.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2">{pkg.summary}</p>
              </div>
            ))}
          </div>

          {/* Interactive Transparent Payable Breakdown */}
          <div className="lg:col-span-5 bg-[#071630] text-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 text-lime-400 text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-4 h-4" /> Pre-Checkout Fee Breakdown
            </div>
            <h3 className="text-xl font-extrabold">Calculate Exact Payable Amount</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  1. Selected Academic Package
                </label>
                <select
                  value={calcPackageId}
                  onChange={(e) => setCalcPackageId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id} className="text-slate-900">
                      {p.name} — ₹{p.monthlyPriceInr.toLocaleString("en-IN")}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  2. Optional Competitive-Exam Add-On (Never Silently Bundled)
                </label>
                <select
                  value={calcAddonId}
                  onChange={(e) => setCalcAddonId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white"
                >
                  <option value="" className="text-slate-900">
                    None (Academic Package Only)
                  </option>
                  {addons.map((a) => (
                    <option key={a.id} value={a.id} className="text-slate-900">
                      {a.name} (+₹{a.monthlyAddonPriceInr.toLocaleString("en-IN")}/mo)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Base Academic Package (Monthly):</span>
                <span className="font-mono font-bold">
                  ₹{(selectedPkg?.monthlyPriceInr || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Selected Competitive Add-On:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {selectedAddon
                    ? `+ ₹${selectedAddon.monthlyAddonPriceInr.toLocaleString("en-IN")}`
                    : "₹0 (Not Selected)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Admission & Registration (One-Time):</span>
                <span className="font-mono font-bold">
                  ₹{feeRules.admissionAndRegistrationFeeInr.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Student ID & Learning Kit (One-Time):</span>
                <span className="font-mono font-bold">
                  ₹{feeRules.studentIdAndLearningKitFeeInr.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-lime-300">
                <span>Initial Academic Assessment & Demo Class:</span>
                <span className="font-mono font-bold">FREE (₹0)</span>
              </div>
              <div className="pt-3 border-t border-white/15 flex justify-between text-sm font-black">
                <span>Total First-Month Payable at Enrollment:</span>
                <span className="font-mono text-amber-300 text-base">
                  ₹{firstMonthTotalPayableInr.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Subsequent Monthly Fee (Month 2–12):</span>
                <span className="font-mono">
                  ₹{monthlyRecurringInr.toLocaleString("en-IN")}/month
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {feeRules.additionalMaterialsDisclosure}
            </p>

            <Link
              href="/skillverse/packages-and-fees"
              className="block w-full py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-center text-xs transition-colors"
            >
              View All Packages, Standalone Courses & Fee Rules
            </Link>
          </div>
        </div>
      </section>

      {/* 6. LEARNING METHODOLOGY, ASSESSMENT PROCESS & VERIFIED FACULTY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            {
              step: "Step 01",
              title: "Free Diagnostic Assessment",
              desc: "Identify conceptual strengths and learning gaps across Maths, Science, Reasoning, and Digital Literacy before choosing a batch.",
            },
            {
              step: "Step 02",
              title: "Concept-First Classroom & Live Teaching",
              desc: "Structured NCERT + application lessons with interactive visual models, hands-on coding labs, and dedicated doubt-solving.",
            },
            {
              step: "Step 03",
              title: "Timed Quizzes & Error Analytics",
              desc: "Weekly objective & descriptive evaluations with topic-wise improvement plans visible on the Student Portal.",
            },
            {
              step: "Step 04",
              title: "Parent Transparency & PTM Reviews",
              desc: "Verified Parent Portal access showing real-time attendance, test scores, fee receipts, and scheduled Parent-Teacher Meetings.",
            },
          ].map((m) => (
            <div
              key={m.step}
              className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2"
            >
              <span className="text-xs font-black text-blue-600 uppercase">{m.step}</span>
              <h3 className="font-bold text-slate-900 text-sm">{m.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>

        {/* Verified Faculty Section (Never Fabricated) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Database-Verified Academic & Technical Mentors
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                Faculty & Subject Mentors
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Sourced directly from verified SoftLab Global trainer records
            </span>
          </div>

          {verifiedFaculty.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {verifiedFaculty.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="font-bold text-slate-900 text-sm">{f.name}</div>
                  <div className="text-xs text-blue-700 font-semibold">
                    {f.specializations.length > 0
                      ? f.specializations.join(" • ")
                      : "Subject & Skill Mentor"}
                  </div>
                  {f.experienceYears > 0 && (
                    <div className="text-[11px] text-slate-500">
                      Experience: {f.experienceYears}+ Years
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              Subject-wise faculty allocations for the current academic session are assigned per
              batch and visible inside the Student & Parent Portals upon batch allocation. We never
              display fabricated faculty profiles.
            </div>
          )}
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Clear answers on curriculum, transparent fees, child safety, and parent portal access.
          </p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                {faq.category}
              </span>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-0.5">
                {faq.question}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. ADMISSION ENQUIRY FORM & ADMIN-CONTROLLED CONTACT DETAILS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <SkillverseLeadForm mode="ADMISSION_ENQUIRY" defaultGrade={selectedGrade} />
          </div>
          <div className="lg:col-span-4 bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900">
              Skillverse Campus & Admissions Desk
            </h3>
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Campus Address:</strong>
                  {cms.contactAddress}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Admissions Helpline & WhatsApp:</strong>
                  {cms.contactPhone}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Official Email:</strong>
                  {cms.contactEmail}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Counseling Hours:</strong>
                  {cms.supportHours}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <Link
                href="/skillverse/student-login"
                className="block w-full py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:border-blue-500 text-xs font-bold text-slate-800 text-center"
              >
                Access Student LMS Portal →
              </Link>
              <Link
                href="/skillverse/parent-login"
                className="block w-full py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:border-emerald-600 text-xs font-bold text-slate-800 text-center"
              >
                Access Family / Parent Portal →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
