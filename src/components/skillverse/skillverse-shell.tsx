"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api as trpc } from "@/lib/trpc/react";
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
  ChevronLeft,
  ChevronRight,
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
  { href: "/skillverse/crm", label: "Admissions CRM", badge: "CRM" },
  { href: "/skillverse/lms", label: "Academic LMS & Live Studio", badge: "LMS" },
  { href: "/skillverse/student-login", label: "Student Login", badge: "Student" },
  { href: "/skillverse/parent-login", label: "Parent Login", badge: "Family" },
  { href: "/skillverse/staff-login", label: "Staff & Higher Authority Login", badge: "Command" },
];

export function SkillverseShell({ children }: { children: React.ReactNode }) {
  const { data: staffUser } = trpc.skillverse.getCurrentStaffSession.useQuery(undefined, {
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Horizontal navigation scroll management
  const navRef = React.useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkScroll = React.useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 4;
    setIsOverflowing(hasOverflow);
    setCanScrollLeft(hasOverflow && el.scrollLeft > 4);
    setCanScrollRight(
      hasOverflow && Math.ceil(el.scrollLeft) < el.scrollWidth - el.clientWidth - 4
    );
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = navRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll, { passive: true });

    // Center active link into view automatically
    const activeEl = el.querySelector<HTMLElement>("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, pathname]);

  // Close mobile drawer on route transition
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const scrollByAmount = (offset: number) => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLElement>) => {
    const el = navRef.current;
    if (el && el.scrollWidth > el.clientWidth) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
      }
    }
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import("next-auth/react");
      await signOut({ callbackUrl: "/skillverse/staff-login" });
    } catch {
      window.location.href = "/api/auth/signout";
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/skillverse/courses?q=${encodeURIComponent(searchTerm.trim())}`);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* ==================================================================== */}
      {/* TIER 0: SLEEK TOP ANNOUNCEMENT & QUICK PORTALS STRIP                 */}
      {/* ==================================================================== */}
      <div className="bg-[#071630] text-white text-xs border-b border-blue-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4 overflow-hidden">
          {/* Left: Brand Badge & Helpline */}
          <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600/30 to-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Powered by SoftLab Global
            </span>
            <span className="text-slate-300 font-medium hidden md:inline text-[11px]">
              {SKILLVERSE_BRAND.supportingLine}
            </span>
            <a
              href="tel:+919196596975"
              className="inline-flex items-center gap-1 text-emerald-300 hover:text-white font-bold ml-1 transition-colors text-[11px]"
            >
              <PhoneCall className="w-3 h-3 text-emerald-400" /> +91-9196596975
            </a>
          </div>

          {/* Right: Quick Portals Strip */}
          <div className="hidden sm:flex items-center gap-2.5 text-[11px] font-semibold shrink-0 whitespace-nowrap">
            <Link
              href="/skillverse/crm"
              className="text-emerald-300 hover:text-white transition-colors font-bold flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Admissions CRM
            </Link>
            <span className="text-slate-600">|</span>
            <Link
              href="/skillverse/lms"
              className="text-cyan-300 hover:text-white transition-colors font-bold"
            >
              Academic LMS
            </Link>
            <span className="text-slate-600">|</span>
            <Link
              href="/skillverse/student-login"
              className="text-slate-200 hover:text-white transition-colors"
            >
              Student Portal
            </Link>
            <span className="text-slate-600">|</span>
            <Link
              href="/skillverse/parent-login"
              className="text-lime-300 hover:text-white transition-colors"
            >
              Parent Desk
            </Link>
            <span className="text-slate-600">|</span>
            {staffUser ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/skillverse/staff-login"
                  className="text-emerald-300 hover:text-white transition-colors flex items-center gap-1 font-bold"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Staff: {staffUser.name || "Admin"}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-rose-300 hover:text-rose-100 underline text-[10px] font-bold cursor-pointer"
                  title="Sign Out of Session"
                >
                  (Logout)
                </button>
              </div>
            ) : (
              <Link
                href="/skillverse/login"
                className="text-slate-200 hover:text-white transition-colors flex items-center gap-1 font-bold"
              >
                <Lock className="w-3 h-3 text-cyan-300" />
                Staff Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TIER 1 & TIER 2: STICKY BRAND & NAVIGATION WRAPPER                   */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 bg-white shadow-xs">
        {/* TIER 1: BRAND IDENTITY & ACTIONS ROW */}
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
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#16A34A]">
                  SLG
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0052CC]">
                  SKILL
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#16A34A]">
                  VERSE
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                Powered by SoftLab Global
              </p>
            </div>
          </Link>

          {/* Search Bar (Centered / Flexible) */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="search"
                placeholder="Search Class 8–12, JEE, AI, Coding, Robotics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-xs focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none placeholder:text-slate-400 shadow-2xs"
              />
            </form>
          </div>

          {/* Primary Action Cluster */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {/* WhatsApp Direct Chat Pill - Always single-line */}
            <a
              href="https://wa.me/919196596975"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100 text-[#15803D] text-xs font-bold transition-all shadow-2xs"
              title="Chat on WhatsApp +91-9196596975"
            >
              <MessageCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span className="whitespace-nowrap font-bold tracking-tight">+91 91965 96975</span>
            </a>

            {/* Book a Free Demo Vibrant CTA */}
            <Link
              href="/skillverse/free-demo-class"
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0052CC] via-[#0077FF] to-[#16A34A] hover:opacity-95 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse shrink-0" />
              <span>Book Free Demo</span>
            </Link>

            {/* SLG-Style Staff Profile & Logout / Sign-In Button */}
            {staffUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 shrink-0">
                <Link
                  href="/skillverse/staff-login"
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
                  title="Open Admissions CRM & Staff Command Center"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#0052CC] text-white font-black flex items-center justify-center text-xs shadow-xs">
                    {(staffUser.name || "S").charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {staffUser.name || "Staff"}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">
                      {staffUser.roleCode || "STAFF"}
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Log Out of Staff Session"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/skillverse/login"
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Staff, Teacher & Admin Login"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Staff Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            aria-label="Toggle Skillverse Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TIER 2: HIGH-GRAPHICAL ACADEMIC NAVIGATION BAR (DESKTOP)             */}
        {/* ==================================================================== */}
        <div className="hidden md:block w-full border-t border-slate-800/80 bg-gradient-to-r from-[#071630] via-[#0B2247] to-[#071630] text-white shadow-md">
          <div className="relative mx-auto max-w-7xl px-2 sm:px-4 lg:px-6">
            {/* Left Scroll Navigation Button */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-2 pr-6 bg-gradient-to-r from-[#071630] via-[#071630]/95 to-transparent pointer-events-auto">
                <button
                  type="button"
                  onClick={() => scrollByAmount(-240)}
                  className="h-7 w-7 rounded-full bg-slate-800/95 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500 flex items-center justify-center shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  aria-label="Scroll left navigation"
                  title="Scroll left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            )}

            <nav
              ref={navRef}
              onWheel={handleWheel}
              className={`w-full flex items-center gap-1.5 lg:gap-2 py-2 overflow-x-auto scroll-smooth nav-scrollbar ${
                isOverflowing ? "justify-start px-9" : "justify-center px-1"
              }`}
              aria-label="Skillverse Main Navigation"
            >
              {/* Home */}
              <Link
                href="/skillverse"
                data-active={pathname === "/skillverse" ? "true" : "false"}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  pathname === "/skillverse"
                    ? "text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 font-bold shadow-sm"
                    : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
              >
                Home
              </Link>

              {/* About */}
              <Link
                href="/skillverse/about"
                data-active={pathname === "/skillverse/about" ? "true" : "false"}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  pathname === "/skillverse/about"
                    ? "text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 font-bold shadow-sm"
                    : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
              >
                About
              </Link>

              {/* All Courses */}
              <Link
                href="/skillverse/courses"
                data-active={pathname === "/skillverse/courses" ? "true" : "false"}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  pathname === "/skillverse/courses"
                    ? "text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 font-bold shadow-sm"
                    : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
              >
                All Courses
              </Link>

              {/* Dropdown: Academics & Exams */}
              <div className="relative group shrink-0">
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                    pathname.includes("foundation") || pathname.includes("jee") || pathname.includes("neet") || pathname.includes("olympiad") || pathname.includes("cuet") || pathname.includes("secondary")
                      ? "text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 font-bold shadow-xs"
                      : "text-slate-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Academics & Exams</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform" />
                </button>
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-0 top-full pt-1.5 w-80 z-50">
                  <div className="bg-[#0B2247] border border-blue-700/80 rounded-2xl shadow-2xl p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 border-b border-blue-800/80 mb-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3 h-3 text-emerald-400" /> K-12 & Competitive Prep
                    </div>
                    {ACADEMIC_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 hover:text-emerald-300 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dropdown: AI, Tech & Career */}
              <div className="relative group shrink-0">
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                    pathname.includes("ai") || pathname.includes("coding") || pathname.includes("robotics") || pathname.includes("digital") || pathname.includes("career")
                      ? "text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 font-bold shadow-xs"
                      : "text-slate-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI, Tech & Career</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform" />
                </button>
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-0 top-full pt-1.5 w-80 z-50">
                  <div className="bg-[#0B2247] border border-blue-700/80 rounded-2xl shadow-2xl p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-400 border-b border-blue-800/80 mb-1 flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-cyan-400" /> Future Skills & Digital Labs
                    </div>
                    {FUTURE_SKILLS_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 hover:text-cyan-300 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Packages & Fees */}
              <Link
                href="/skillverse/packages-and-fees"
                data-active={pathname === "/skillverse/packages-and-fees" ? "true" : "false"}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  pathname === "/skillverse/packages-and-fees"
                    ? "text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 font-bold shadow-sm"
                    : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
              >
                Packages & Fees
              </Link>

              {/* Admissions */}
              <Link
                href="/skillverse/admissions"
                data-active={pathname === "/skillverse/admissions" ? "true" : "false"}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  pathname === "/skillverse/admissions"
                    ? "text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 font-bold shadow-sm"
                    : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
              >
                Admissions
              </Link>

              {/* In-House Live Studio - High-Graphic Pulsing Live Beacon */}
              <Link
                href="/skillverse/live-classroom"
                data-active={pathname === "/skillverse/live-classroom" ? "true" : "false"}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 shadow-xs ${
                  pathname === "/skillverse/live-classroom"
                    ? "ring-2 ring-emerald-400 bg-emerald-900/80 text-white"
                    : ""
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>In-House Live Studio</span>
              </Link>

              {/* Dropdown: Dedicated Portals */}
              <div className="relative group shrink-0">
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                    pathname.includes("crm") || pathname.includes("lms") || pathname.includes("student-login") || pathname.includes("parent-login")
                      ? "text-amber-300 bg-amber-950/80 border border-amber-500/40 font-bold shadow-xs"
                      : "text-slate-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>Portals & LMS</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform" />
                </button>
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute right-0 top-full pt-1.5 w-72 z-50">
                  <div className="bg-[#0B2247] border border-blue-700/80 rounded-2xl shadow-2xl p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 border-b border-blue-800/80 mb-1">
                      Skillverse Portals
                    </div>
                    <Link
                      href="/skillverse/crm"
                      className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-emerald-900/40 hover:text-emerald-300 transition-colors"
                    >
                      💼 Admissions CRM Pipeline
                    </Link>
                    <Link
                      href="/skillverse/lms"
                      className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-blue-900/40 hover:text-cyan-300 transition-colors"
                    >
                      🎓 Academic LMS & Classes
                    </Link>
                    <Link
                      href="/skillverse/live-classroom"
                      className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-emerald-900/40 hover:text-emerald-300 transition-colors"
                    >
                      🎥 In-House Live Studio
                    </Link>
                    <Link
                      href="/skillverse/student-login"
                      className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-blue-900/40 hover:text-cyan-300 transition-colors"
                    >
                      🧑‍🎓 Student Portal & Quizzes
                    </Link>
                    <Link
                      href="/skillverse/parent-login"
                      className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-purple-900/40 hover:text-purple-300 transition-colors"
                    >
                      👨‍👩‍👧 Parent Progress Desk
                    </Link>
                    <Link
                      href="/skillverse/staff-login"
                      className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-amber-900/40 hover:text-amber-300 transition-colors"
                    >
                      🔐 Staff Command Center
                    </Link>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <Link
                href="/skillverse/contact"
                data-active={pathname === "/skillverse/contact" ? "true" : "false"}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  pathname === "/skillverse/contact"
                    ? "text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 font-bold shadow-sm"
                    : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
              >
                Contact
              </Link>
            </nav>

            {/* Right Scroll Navigation Button */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pr-2 pl-6 bg-gradient-to-l from-[#071630] via-[#071630]/95 to-transparent pointer-events-auto">
                <button
                  type="button"
                  onClick={() => scrollByAmount(240)}
                  className="h-7 w-7 rounded-full bg-slate-800/95 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500 flex items-center justify-center shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  aria-label="Scroll right navigation"
                  title="Scroll right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-4 py-5 space-y-5 max-h-[82vh] overflow-y-auto">
            {/* Mobile Profile / Login Status Bar */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              {staffUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#16A34A] to-[#0052CC] text-white font-bold flex items-center justify-center text-xs">
                      {(staffUser.name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{staffUser.name || "Staff Admin"}</div>
                      <div className="text-[10px] text-emerald-700 font-mono font-bold">{staffUser.roleCode || "STAFF"}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
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
