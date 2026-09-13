import * as React from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Sparkles, GraduationCap, ShieldCheck } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants/site";

export function TopAnnouncementBar() {
  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 text-xs hidden md:block">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Contact Hotlines */}
          <div className="flex items-center gap-6">
            <a
              href={`tel:${SITE_CONFIG.contact.phoneTel}`}
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors font-medium"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>{SITE_CONFIG.contact.phone}</span>
            </a>
            <a
              href={`mailto:${SITE_CONFIG.contact.admissionsEmail}`}
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            >
              <Mail className="h-3.5 w-3.5 text-emerald-400" />
              <span>{SITE_CONFIG.contact.admissionsEmail}</span>
            </a>
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              <span>Civil Lines Campus, Prayagraj</span>
            </div>
          </div>

          {/* Right: Guarantee Badge & LMS Portal Link */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>100% Placement Support & Guarantee Track</span>
            </div>

            <div className="h-3 w-px bg-slate-700" />

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all hover:shadow-sm"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>LMS Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
