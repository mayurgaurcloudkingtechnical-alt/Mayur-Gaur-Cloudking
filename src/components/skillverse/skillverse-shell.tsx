"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SKILLVERSE_BRAND } from "@/lib/constants/skillverse-data";
import {
  BookOpen,
  GraduationCap,
  Cpu,
  Calculator,
  Sparkles,
  PhoneCall,
  Menu,
  X,
  Search,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Users,
  Lock,
  ArrowRight,
  Globe,
} from "lucide-react";

const ACADEMIC_LINKS = [
  { href: "/skillverse/school-foundation-8-10", label: "School Foundation (Classes 8–10)" },
  { href: "/skillverse/senior-secondary-11-12", label: "Senior Secondary (Classes 11–12)" },
  { href: "/skillverse/iit-jee-foundation", label: "IIT-JEE Foundation (8–10)" },
  { href: "/skillverse/jee-main-preparation", label: "JEE Main Preparation (11–12)" },
  { href: "/skillverse/jee-advanced-extension", label: "JEE Advanced Extension (11–12)" },
  { href: "/skillverse/neet-ug-foundation", label: "NEET-UG Foundation & Prep" },
  { href: "/skillverse/olympiad-scholarship", label: "Olympiad & Scholarship Foundation" },
  { href: "/skillverse/cuet-foundation", label: "CUET Foundation" },
  { href: "/skillverse/nda-foundation", label: "NDA Foundation" },
];

const FUTURE_SKILLS_LINKS = [
  { href: "/skillverse/computer-digital-skills", label: "Computer & Digital Skills" },
  { href: "/skillverse/ai-and-coding", label: "AI Literacy & Coding (Python/Web)" },
  { href: "/skillverse/robotics-and-stem", label: "Robotics & STEM Projects" },
  {
    href: "/skillverse/spoken-english-personality",
    label: "Spoken English & Personality Development",
  },
  { href: "/skillverse/career-guidance", label: "Career Guidance & Stream Selection" },
];

const ADMISSIONS_LINKS = [
  { href: "/skillverse/packages-and-fees", label: "Packages & Transparent Fees" },
  { href: "/skillverse/admissions", label: "Admissions & Enrolment" },
  { href: "/skillverse/free-demo-class", label: "Book Free Demo Class" },
  { href: "/skillverse/student-assessment", label: "Free Student Diagnostic Assessment" },
  { href: "/skillverse/faqs", label: "Frequently Asked Questions" },
  { href: "/skillverse/blog", label: "Blog & Learning Resources" },
];

const PORTAL_LINKS = [
  { href: "/skillverse/student-login", label: "Student Login", badge: "LMS" },
  { href: "/skillverse/parent-login", label: "Parent Login", badge: "Family" },
  { href: "/skillverse/staff-login", label: "Staff / Teacher / Admin Login", badge: "Staff" },
];

export function SkillverseShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/skillverse/courses?q=${encodeURIComponent(searchTerm.trim())}`);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Announcement & Trust Bar */}
      <div className="bg-[#071630] text-white text-xs border-b border-blue-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lime-500/20 border border-lime-400/40 text-lime-300 font-bold text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Powered by SoftLab Global
            </span>
            <span className="text-slate-200 font-medium">
              {SKILLVERSE_BRAND.supportingLine}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <Link
              href="/skillverse/student-login"
              className="text-cyan-300 hover:text-white transition-colors"
            >
              Student Portal
            </Link>
            <span className="text-slate-600">|</span>
            <Link
              href="/skillverse/parent-login"
              className="text-lime-300 hover:text-white transition-colors"
            >
              Parent Portal
            </Link>
            <span className="text-slate-600">|</span>
            <Link
              href="/skillverse/staff-login"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Teacher & Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo Lockup */}
          <Link href="/skillverse" className="flex items-center gap-3 group shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-1 shadow-xs flex items-center justify-center overflow-hidden">
              <img
                src={SKILLVERSE_BRAND.logoPath}
                alt="SoftLab Global Crest"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight text-[#15803D]">
                  SLG
                </span>
                <span className="text-lg sm:text-xl font-black tracking-tight text-[#0052CC]">
                  SKILLVERSE
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Your World of Future Skills
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/skillverse"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                pathname === "/skillverse"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Home
            </Link>
            <Link
              href="/skillverse/about"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                pathname === "/skillverse/about"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              About
            </Link>
            <Link
              href="/skillverse/courses"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                pathname === "/skillverse/courses"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              All Courses
            </Link>

            {/* Dropdown: Academics & Competitive */}
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Academics & Exams <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-0 top-full pt-2 w-72 z-50">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-2 space-y-1">
                  {ACADEMIC_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Dropdown: AI, Coding & Future Skills */}
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                AI, Tech & Career <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-0 top-full pt-2 w-72 z-50">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-2 space-y-1">
                  {FUTURE_SKILLS_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/skillverse/packages-and-fees"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                pathname === "/skillverse/packages-and-fees"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Packages & Fees
            </Link>
            <Link
              href="/skillverse/admissions"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                pathname === "/skillverse/admissions"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Admissions
            </Link>
            <Link
              href="/skillverse/contact"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                pathname === "/skillverse/contact"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Search & Primary CTAs */}
          <div className="hidden xl:flex items-center gap-2.5">
            <form onSubmit={handleSearch} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="search"
                placeholder="Search Class 8–12, JEE, AI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </form>
            <Link
              href="/skillverse/free-demo-class"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#15803D] to-[#65A30D] hover:opacity-95 text-white font-bold text-xs shadow-sm transition-all"
            >
              Book a Free Demo
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2.5 rounded-xl border border-slate-200 text-slate-700"
            aria-label="Toggle Skillverse Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-5 space-y-5 max-h-[82vh] overflow-y-auto">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="search"
                placeholder="Search courses (Class 8–12, JEE, NEET, Python...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Search
              </button>
            </form>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/skillverse"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 font-bold text-xs text-slate-800"
              >
                Home
              </Link>
              <Link
                href="/skillverse/about"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 font-bold text-xs text-slate-800"
              >
                About Skillverse
              </Link>
              <Link
                href="/skillverse/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 font-bold text-xs text-slate-800"
              >
                All Courses
              </Link>
              <Link
                href="/skillverse/packages-and-fees"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-blue-50 font-bold text-xs text-blue-700"
              >
                Packages & Fees
              </Link>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Academic & Competitive Foundations
              </p>
              <div className="space-y-1">
                {ACADEMIC_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Technology, AI & Career Readiness
              </p>
              <div className="space-y-1">
                {FUTURE_SKILLS_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
              <Link
                href="/skillverse/free-demo-class"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#15803D] text-white text-center text-xs font-bold"
              >
                Book a Free Demo Class
              </Link>
              <Link
                href="/skillverse/student-assessment"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#0052CC] text-white text-center text-xs font-bold"
              >
                Take Free Diagnostic Assessment
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Comprehensive Footer with All 31 Public Routes */}
      <footer className="bg-[#071630] text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-white/10">
            {/* Column 1: Brand Identity */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white p-1 flex items-center justify-center">
                  <img
                    src={SKILLVERSE_BRAND.logoPath}
                    alt="SLG Skillverse"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-lg font-black text-white tracking-tight">
                    <span className="text-lime-400">SLG</span> SKILLVERSE
                  </div>
                  <div className="text-[11px] font-semibold text-cyan-300">
                    Powered by SoftLab Global
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                <strong className="text-white">{SKILLVERSE_BRAND.tagline}</strong>{" "}
                {SKILLVERSE_BRAND.supportingLine}. Delivering structured school academic
                excellence, competitive entrance foundations, and hands-on AI, Coding, and
                Future-Ready skills.
              </p>
              <div className="text-xs text-slate-400 space-y-1">
                <p>{SKILLVERSE_BRAND.defaultContact.address}</p>
                <p>
                  Phone:{" "}
                  <strong className="text-white">{SKILLVERSE_BRAND.defaultContact.phone}</strong> |
                  Email:{" "}
                  <strong className="text-white">{SKILLVERSE_BRAND.defaultContact.email}</strong>
                </p>
              </div>
            </div>

            {/* Column 2: School & Exam Foundations */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                School & Competitive
              </h3>
              <ul className="space-y-2 text-xs">
                {ACADEMIC_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-lime-300 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Future Skills & Admissions */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Tech, AI & Admissions
              </h3>
              <ul className="space-y-2 text-xs">
                {FUTURE_SKILLS_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-cyan-300 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
                {ADMISSIONS_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Portals, Legal & Parent Policies */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Portals & Policies
              </h3>
              <ul className="space-y-2 text-xs">
                {PORTAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1.5 text-lime-300 hover:text-white font-semibold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li className="pt-2 border-t border-white/10">
                  <Link href="/skillverse/privacy-policy" className="hover:text-white">
                    Privacy Policy (DPDP)
                  </Link>
                </li>
                <li>
                  <Link href="/skillverse/terms-and-conditions" className="hover:text-white">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/skillverse/refund-policy" className="hover:text-white">
                    Refund & Cancellation Policy
                  </Link>
                </li>
                <li>
                  <Link href="/skillverse/child-safety-consent" className="hover:text-white">
                    Child Safety & Parent Consent
                  </Link>
                </li>
                <li className="pt-2">
                  <a
                    href={SKILLVERSE_BRAND.mainWebsiteUrl}
                    className="text-cyan-300 hover:underline font-semibold"
                  >
                    Visit Main SoftLab Global Website →
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>
              © {new Date().getFullYear()} SLG SKILLVERSE — Powered by SoftLab Global. All rights
              reserved.
            </p>
            <p>
              Independent Academic & Skill Education Platform | Transparent Fee Disclosure | Child
              Safety & Parent Consent Compliant
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
