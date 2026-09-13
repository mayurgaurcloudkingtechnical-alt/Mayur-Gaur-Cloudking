"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/constants/site";
import { SoftlabLogo } from "@/components/common/softlab-logo";
import { Menu, X, ArrowRight, UserCheck, GraduationCap, PhoneCall } from "lucide-react";

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
        <div className="hidden md:flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-xs h-9 px-3">
            <a href={`tel:${SITE_CONFIG.contact.phoneTel}`} className="flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
              <span>Call Us</span>
            </a>
          </Button>

          {userRole ? (
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs h-9 px-3.5">
              <Link href={dashboardHref} className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white shadow-md text-xs h-9 px-4">
              <Link href="/login" className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-emerald-400" />
                <span>LMS Login</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </Link>
            </Button>
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
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs"
            >
              <GraduationCap className="h-4 w-4 text-emerald-400" />
              <span>LMS Student & Staff Portal</span>
            </Link>
            <a
              href={`tel:${SITE_CONFIG.contact.phoneTel}`}
              className="w-full flex items-center justify-center gap-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2.5 px-4 rounded-xl text-xs"
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
