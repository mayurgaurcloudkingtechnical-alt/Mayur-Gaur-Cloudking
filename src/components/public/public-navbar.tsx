"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/constants/site";
import { SoftlabLogo } from "@/components/common/softlab-logo";
import { Menu, X, ArrowRight, UserCheck, GraduationCap, PhoneCall, Building2, Sparkles } from "lucide-react";
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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Wordmark */}
        <Link href="/" className="group flex items-center">
          <SoftlabLogo size="md" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {SITE_CONFIG.navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "text-emerald-700 bg-emerald-50 font-bold"
                    : "text-slate-700 hover:text-emerald-700 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Portal Login / Dashboard CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            type="button"
            onClick={() => openCareerCounselingModal()}
            size="sm"
            variant="ghost"
            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 text-xs h-9 px-2.5 font-bold flex items-center gap-1.5 border border-emerald-200"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            <span>Free Counseling</span>
          </Button>

          {userRole ? (
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs h-9 px-3.5">
              <Link href={dashboardHref} className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                <span>My Dashboard</span>
              </Link>
            </Button>
          ) : (
            <>
              {/* Student Portal Login Button */}
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm text-xs h-9 px-3 font-bold">
                <Link href="/student-login" className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-emerald-200" />
                  <span>Student Portal</span>
                </Link>
              </Button>

              {/* SoftLab Staff / Admin Login Button */}
              <Button asChild variant="outline" size="sm" className="border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 text-xs h-9 px-3 font-semibold">
                <Link href="/login" className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>SoftLab Login</span>
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1">
            {SITE_CONFIG.navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? "text-emerald-700 bg-emerald-50 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openCareerCounselingModal();
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-emerald-200" />
              <span>Book Free Career Counseling</span>
            </button>
            <Link
              href={userRole ? dashboardHref : "/student-login"}
              className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-sm"
            >
              <GraduationCap className="h-4 w-4 text-white" />
              <span>Student Portal Login</span>
            </Link>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2.5 px-4 rounded-xl text-xs"
            >
              <Building2 className="h-4 w-4 text-slate-500" />
              <span>SoftLab Staff / Admin Login</span>
            </Link>
            <a
              href={`tel:${SITE_CONFIG.contact.phoneTel}`}
              className="w-full flex items-center justify-center gap-2 border border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-semibold py-2.5 px-4 rounded-xl text-xs"
            >
              <PhoneCall className="h-4 w-4 text-emerald-600" />
              <span>Call Admissions: {SITE_CONFIG.contact.phone}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
