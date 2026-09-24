import * as React from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants/site";
import { SoftlabLogo } from "@/components/common/softlab-logo";
import { MapPin, Phone, Mail, Clock, ShieldCheck, ArrowUpRight, Building2 } from "lucide-react";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand & Identity */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <SoftlabLogo size="md" />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              {SITE_CONFIG.shortDescription}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>GSTIN: <span className="font-mono font-semibold text-slate-200">{SITE_CONFIG.gstin}</span></span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Academic Navigation
            </h3>
            <ul className="space-y-2.5 text-xs">
              {SITE_CONFIG.navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/franchise"
                  className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Franchise Opportunity</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  <span>Student & Faculty Portal</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
              <li className="pt-1 border-t border-slate-800">
                <a
                  href="https://cons.dpguindia.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 font-semibold hover:text-sky-300 transition-colors flex items-center gap-1"
                >
                  <span>DPGU Partner Portal</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="http://student.dpguindia.com/Default.aspx?ReturnUrl=%2f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 font-semibold hover:text-sky-300 transition-colors flex items-center gap-1"
                >
                  <span>DPGU Student Portal</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Hours & Support */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Counseling & Support
            </h3>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">{SITE_CONFIG.businessHours.days}</p>
                  <p className="text-slate-400">{SITE_CONFIG.businessHours.hours}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{SITE_CONFIG.businessHours.sunday}</p>
                </div>
              </li>
              <li className="pt-1">
                <p className="text-slate-400 mb-1">General Inquiries:</p>
                <a
                  href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="font-medium text-slate-200 hover:text-emerald-300 underline underline-offset-2"
                >
                  {SITE_CONFIG.contact.email}
                </a>
              </li>
              <li>
                <p className="text-slate-400 mb-1">Admissions Desk:</p>
                <a
                  href={`mailto:${SITE_CONFIG.contact.admissionsEmail}`}
                  className="font-medium text-slate-200 hover:text-emerald-300 underline underline-offset-2"
                >
                  {SITE_CONFIG.contact.admissionsEmail}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Campus Location & Direct Contact */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Campus Address
            </h3>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <address className="not-italic leading-relaxed">
                  <p className="font-semibold text-slate-200">{SITE_CONFIG.address.line1}</p>
                  <p>{SITE_CONFIG.address.line2}</p>
                  <p>{SITE_CONFIG.address.city}, {SITE_CONFIG.address.state} — {SITE_CONFIG.address.pincode}</p>
                </address>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <a
                  href={`tel:${SITE_CONFIG.contact.phoneTel}`}
                  className="font-bold text-slate-200 hover:text-emerald-300 transition-colors"
                >
                  {SITE_CONFIG.contact.phone}
                </a>
              </div>

              <div className="pt-2">
                <a
                  href={SITE_CONFIG.address.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <span>View on Google Maps</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="mt-12 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} {SITE_CONFIG.name}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Enterprise IT Education Platform</span>
            <span>•</span>
            <span>Prayagraj, Uttar Pradesh</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
