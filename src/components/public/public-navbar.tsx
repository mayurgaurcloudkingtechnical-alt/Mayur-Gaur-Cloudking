"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/constants/site";
import { Menu, X, ArrowRight, UserCheck } from "lucide-react";

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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Wordmark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
            SL
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
              {SITE_CONFIG.name}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 tracking-wider uppercase mt-0.5">
              IT Education & Research
            </span>
          </div>
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
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "text-emerald-700 bg-emerald-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Portal Login / Dashboard CTA */}
        <div className="hidden md:flex items-center gap-3">
          {userRole ? (
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Link href={dashboardHref} className="flex items-center gap-1.5">
                <UserCheck className="h-4 w-4" />
                <span>Go to Dashboard</span>
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:border-emerald-600 hover:text-emerald-700">
              <Link href="/login" className="flex items-center gap-1.5">
                <span>Portal Login</span>
                <ArrowRight className="h-3.5 w-3.5" />
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
                  className={`px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "text-emerald-700 bg-emerald-50 font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {userRole ? (
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href={dashboardHref} className="justify-center">
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full border-slate-300 justify-center">
                <Link href="/login">Portal Login</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
