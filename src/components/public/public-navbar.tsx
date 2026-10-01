"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/constants/site";
import { SoftlabLogo } from "@/components/common/softlab-logo";
import { Menu, X, UserCheck, GraduationCap, Building2, Sparkles, PhoneCall, Globe, Award } from "lucide-react";
import { openCareerCounselingModal } from "@/components/public/career-counseling-modal";

interface PublicNavbarProps {
  userRole?: string | null;
}

export function PublicNavbar({ userRole }: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route transition
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const dashboardHref = React.useMemo(() => {
    if (!userRole) return "/login";
    if (userRole === "STUDENT") return "/student/dashboard";
    if (userRole === "TRAINER") return "/trainer/dashboard";
    if (userRole === "COUNSELOR" || userRole === "TELECALLER") return "/counselor/dashboard";
    return "/admin/dashboard";
  }, [userRole]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/90 shadow-xl overflow-x-clip">
      {/* ==================================================================== */}
      {/* TIER 1: BRAND IDENTITY & ACTIONS ROW                                 */}
      {/* ==================================================================== */}
      <div className="mx-auto flex h-16 sm:h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Brand Wordmark (Logo Emblem + SOFTLAB GLOBAL + Tagline) */}
        <Link href="/" className="group flex items-center shrink-0">
          <SoftlabLogo size="md" variant="dark" showSubTagline={false} />
        </Link>

        {/* Desktop Portal & Counseling CTAs */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Free Counseling CTA */}
          <Button
            type="button"
            onClick={() => openCareerCounselingModal()}
            size="sm"
            variant="ghost"
            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 text-xs h-9 px-3 font-bold flex items-center gap-1.5 border border-emerald-500/40 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Free Counseling</span>
          </Button>

          {userRole ? (
            <Button
              asChild
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 text-xs h-9 px-3.5 font-bold"
            >
              <Link href={dashboardHref} className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                <span>My Dashboard</span>
              </Link>
            </Button>
          ) : (
            <>
              {/* Student Portal Login Button */}
              <Button
                asChild
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 text-xs h-9 px-3.5 font-bold"
              >
                <Link href="/student-login" className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-emerald-200" />
                  <span>Student Portal</span>
                </Link>
              </Button>

              {/* SoftLab Staff / Admin Login Button */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-slate-700 hover:border-slate-600 bg-slate-900/80 text-slate-200 hover:bg-slate-800 text-xs h-9 px-3 font-semibold"
              >
                <Link href="/login" className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>SoftLab Login</span>
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Action & Menu Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            type="button"
            onClick={() => openCareerCounselingModal()}
            size="sm"
            variant="ghost"
            className="text-emerald-400 border border-emerald-500/40 text-[11px] h-8 px-2 font-bold flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>Counseling</span>
          </Button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TIER 2: ACADEMIC & INSTITUTIONAL NAVIGATION BAR (DESKTOP)             */}
      {/* ==================================================================== */}
      <div className="hidden md:block w-full border-t border-b border-slate-800/80 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            className="flex items-center justify-center gap-1.5 lg:gap-2.5 py-2 overflow-x-auto no-scrollbar"
            aria-label="Main Navigation"
          >
            {SITE_CONFIG.navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              const isUniversity = link.href === "/dr-preeti-global-university";
              const isGlobalCert = link.href === "/delaware-digital-university";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 font-bold shadow-sm shadow-emerald-950/60"
                      : isUniversity
                      ? "text-amber-300 hover:text-amber-200 hover:bg-amber-950/30 border border-amber-500/20"
                      : isGlobalCert
                      ? "text-sky-300 hover:text-sky-200 hover:bg-sky-950/30 border border-sky-500/20"
                      : "text-slate-300 hover:text-emerald-300 hover:bg-slate-900/80"
                  }`}
                >
                  {isUniversity && <Award className="h-3 w-3 text-amber-400 shrink-0" />}
                  {isGlobalCert && <Globe className="h-3 w-3 text-sky-400 shrink-0" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MOBILE MENU DRAWER                                                   */}
      {/* ==================================================================== */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-3 shadow-2xl">
          <nav className="flex flex-col space-y-1">
            {SITE_CONFIG.navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              const isUniversity = link.href === "/dr-preeti-global-university";
              const isGlobalCert = link.href === "/delaware-digital-university";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                    isActive
                      ? "text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 font-semibold"
                      : isUniversity
                      ? "text-amber-300 bg-amber-950/20 border border-amber-500/20"
                      : isGlobalCert
                      ? "text-sky-300 bg-sky-950/20 border border-sky-500/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <span>{link.label}</span>
                  {isUniversity && (
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                      UGC
                    </span>
                  )}
                  {isGlobalCert && (
                    <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-500/40">
                      USA
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openCareerCounselingModal();
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-emerald-950/50"
            >
              <Sparkles className="h-4 w-4 text-emerald-200" />
              <span>Book Free Career Counseling</span>
            </button>
            <Link
              href={userRole ? dashboardHref : "/student-login"}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-emerald-950/50"
            >
              <GraduationCap className="h-4 w-4 text-white" />
              <span>Student Portal Login</span>
            </Link>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 font-semibold py-2.5 px-4 rounded-xl text-xs"
            >
              <Building2 className="h-4 w-4 text-slate-400" />
              <span>SoftLab Staff / Admin Login</span>
            </Link>
            <a
              href={`tel:${SITE_CONFIG.contact.phoneTel}`}
              className="w-full flex items-center justify-center gap-2 border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50 font-semibold py-2.5 px-4 rounded-xl text-xs"
            >
              <PhoneCall className="h-4 w-4 text-emerald-400" />
              <span>Call Admissions: {SITE_CONFIG.contact.phone}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
