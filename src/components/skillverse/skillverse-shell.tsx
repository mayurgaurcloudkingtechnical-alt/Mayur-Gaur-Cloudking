"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  MessageCircle,
  LogOut,
  User as UserIcon,
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
  const { data: session } = useSession();
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
          <div className="flex items-center gap-2 text-center sm:text-left flex-wrap justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600/30 to-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Powered by SoftLab Global
            </span>
            <span className="text-slate-200 font-medium hidden md:inline">
              {SKILLVERSE_BRAND.supportingLine}
            </span>
            <a
              href="tel:+919196596975"
              className="inline-flex items-center gap-1 text-emerald-300 hover:text-white font-bold ml-1 transition-colors"
            >
              <PhoneCall className="w-3 h-3" /> +91-9196596975
            </a>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-semibold flex-wrap justify-center sm:justify-end">
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
            {session?.user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/skillverse/staff-login"
                  className="text-emerald-300 hover:text-white transition-colors flex items-center gap-1 font-bold"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Staff: {session.user.name || "Admin"}
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/skillverse/staff-login" })}
                  className="text-rose-300 hover:text-rose-100 underline text-[10px] font-bold cursor-pointer"
                  title="Sign Out of Session"
                >
                  (Logout)
                </button>
              </div>
            ) : (
              <Link
                href="/login?callbackUrl=/skillverse/staff-login"
                className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <Lock className="w-3 h-3 text-cyan-300" />
                Staff Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo Lockup */}
          <Link href="/skillverse" className="flex items-center gap-3 group shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200/90 p-0.5 shadow-sm flex items-center justify-center overflow-hidden shrink-0 group-hover:border-emerald-400 transition-colors">
              <img
                src={SKILLVERSE_BRAND.logoPath}
                alt="SLG Skillverse — Powered by SoftLab Global"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1 leading-none">
                <span className="text-lg sm:text-xl font-black tracking-tight text-[#16A34A]">
                  SLG
                </span>
                <span className="text-lg sm:text-xl font-black tracking-tight text-[#0052CC]">
                  SKILL
                </span>
                <span className="text-lg sm:text-xl font-black tracking-tight text-[#16A34A]">
                  VERSE
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                Powered by SoftLab Global
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
            <a
              href="https://wa.me/919196596975"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100 text-[#15803D] text-xs font-bold transition-all shadow-2xs"
              title="Chat on WhatsApp +91-9196596975"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>+91 91965 96975</span>
            </a>
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
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0052CC] via-[#0077FF] to-[#16A34A] hover:opacity-95 text-white font-bold text-xs shadow-sm transition-all"
            >
              Book a Free Demo
            </Link>

            {/* SLG-Style Staff Profile & Logout / Sign-In Button */}
            {session?.user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Link
                  href="/skillverse/staff-login"
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
                  title="Open Admissions CRM & Staff Command Center"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#0052CC] text-white font-black flex items-center justify-center text-xs shadow-xs">
                    {(session.user.name || "S").charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden 2xl:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {session.user.name || "Staff"}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">
                      {(session.user as any)?.roleCode || "STAFF"}
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/skillverse/staff-login" })}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Log Out of Staff Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login?callbackUrl=/skillverse/staff-login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Staff, Teacher & Admin Login"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Staff Login</span>
              </Link>
            )}
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
            {/* Mobile Profile / Login Status Bar */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              {session?.user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#16A34A] to-[#0052CC] text-white font-bold flex items-center justify-center text-xs">
                      {(session.user.name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{session.user.name || "Staff Admin"}</div>
                      <div className="text-[10px] text-emerald-700 font-mono font-bold">{(session.user as any)?.roleCode || "STAFF"}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/skillverse/staff-login" })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Staff or Teacher?</span>
                  <Link
                    href="/login?callbackUrl=/skillverse/staff-login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
                  >
                    <Lock className="w-3.5 h-3.5" /> Staff Login
                  </Link>
                </div>
              )}
            </div>

            {/* Direct Mobile Quick Contact Buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <a
                href="tel:+919196596975"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#0077FF] text-white shadow-xs"
              >
                <PhoneCall className="w-4 h-4" /> Call +91 91965 96975
              </a>
              <a
                href="https://wa.me/919196596975"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#16A34A] to-[#22C55E] text-white shadow-xs"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>

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
                className="px-4 py-2 rounded-xl bg-[#0052CC] text-white text-xs font-bold"
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
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#16A34A] to-[#22C55E] text-white text-center text-xs font-bold shadow-xs"
              >
                Book a Free Demo Class
              </Link>
              <Link
                href="/skillverse/student-assessment"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#0077FF] text-white text-center text-xs font-bold shadow-xs"
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
                <div className="w-14 h-14 rounded-2xl bg-white p-1 flex items-center justify-center border border-white/20 shadow-sm shrink-0">
                  <img
                    src={SKILLVERSE_BRAND.logoPath}
                    alt="SLG Skillverse"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-lg font-black text-white tracking-tight flex items-center gap-1">
                    <span className="text-[#22C55E]">SLG</span>
                    <span>SKILL</span>
                    <span className="text-[#22C55E]">VERSE</span>
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
              <div className="text-xs text-slate-400 space-y-1.5">
                <p>{SKILLVERSE_BRAND.defaultContact.address}</p>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>
                    Phone:{" "}
                    <a
                      href="tel:+919196596975"
                      className="text-white hover:text-emerald-300 font-bold underline transition-colors"
                    >
                      +91 91965 96975
                    </a>
                  </span>
                  <span className="text-slate-600">|</span>
                  <span>
                    WhatsApp:{" "}
                    <a
                      href="https://wa.me/919196596975"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-white font-bold underline transition-colors"
                    >
                      +91 91965 96975
                    </a>
                  </span>
                  <span className="text-slate-600">|</span>
                  <span>
                    Email:{" "}
                    <a
                      href="mailto:admissions@softlabglobal.com"
                      className="text-white hover:underline font-bold"
                    >
                      {SKILLVERSE_BRAND.defaultContact.email}
                    </a>
                  </span>
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

      {/* Floating Quick Contact Widget (Bottom Right) */}
      <aside
        aria-label="Quick Contact and Admissions Help"
        className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2"
      >
        <a
          href="https://wa.me/919196596975"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-xs font-extrabold border border-emerald-300/40"
          title="Chat on WhatsApp (+91-9196596975)"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp (+91 91965 96975)</span>
          <span className="sm:hidden">WhatsApp</span>
        </a>
        <a
          href="tel:+919196596975"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0052CC] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all text-xs font-bold border border-blue-400/30"
          title="Call Admissions Desk (+91-9196596975)"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Call +91 91965 96975</span>
          <span className="sm:hidden">Call</span>
        </a>
      </aside>
    </div>
  );
}
