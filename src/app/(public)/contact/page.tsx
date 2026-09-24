import * as React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants/site";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building,
  GraduationCap,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { PublicEnquiryForm } from "@/components/public/public-enquiry-form";

export const metadata: Metadata = {
  title: "Contact & Campus Location — SOFTLAB GLOBAL",
  description:
    "Get in touch with the SOFTLAB GLOBAL admissions and counseling desk in Civil Lines, Prayagraj. Call, email, or visit our technology training campus.",
};

export default function ContactPage({
  searchParams,
}: {
  searchParams?: { course?: string };
}) {
  const prefilledCourse = searchParams?.course;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* 1. Header Banner */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#030914] via-[#071626] to-[#040914] py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[650px] h-[350px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-10 w-[500px] h-[500px] bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-3xl z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Admissions & Counseling Wing • Prayagraj Campus</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Connect with Our{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Academic Desk
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Have questions regarding upcoming batches, course syllabi, eligibility, or campus workstation facilities? Reach out directly to our academic team.
          </p>

          {prefilledCourse && (
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-700 text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold shadow-md">
              <span>Selected Course Inquiry:</span>
              <span className="underline text-white">{prefilledCourse}</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Contact Channels Grid */}
      <section className="py-16 bg-slate-950 border-b border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
            {/* Phone Contact */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-7 space-y-4 shadow-xl hover:border-emerald-500/50 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Telephone / Mobile</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Call our admissions counselor directly for immediate cohort information:
              </p>
              <div>
                <a
                  href={`tel:${SITE_CONFIG.contact.phoneTel}`}
                  className="text-base font-mono font-extrabold text-emerald-400 hover:text-emerald-300 hover:underline block"
                >
                  {SITE_CONFIG.contact.phone}
                </a>
                <span className="text-[11px] text-slate-500">Lines open Monday to Saturday</span>
              </div>
              <div className="pt-2">
                <Button asChild size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold h-10 rounded-xl shadow-md">
                  <a href={`tel:${SITE_CONFIG.contact.phoneTel}`}>Call Now</a>
                </Button>
              </div>
            </div>

            {/* Email Contact */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-7 space-y-4 shadow-xl hover:border-teal-500/50 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Email Admissions</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Send your academic query, previous transcripts, or corporate training inquiry:
              </p>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">General Inquiries:</span>
                  <a
                    href={`mailto:${SITE_CONFIG.contact.email}`}
                    className="font-bold text-white hover:text-emerald-400 underline block"
                  >
                    {SITE_CONFIG.contact.email}
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Admissions Desk:</span>
                  <a
                    href={`mailto:${SITE_CONFIG.contact.admissionsEmail}`}
                    className="font-bold text-white hover:text-emerald-400 underline block"
                  >
                    {SITE_CONFIG.contact.admissionsEmail}
                  </a>
                </div>
              </div>
              <div className="pt-2">
                <Button asChild variant="outline" size="sm" className="w-full border-slate-700 bg-slate-800/80 text-white hover:bg-slate-800 h-10 rounded-xl">
                  <a href={`mailto:${SITE_CONFIG.contact.admissionsEmail}`}>Compose Email</a>
                </Button>
              </div>
            </div>

            {/* Campus Working Hours */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-7 space-y-4 shadow-xl hover:border-cyan-500/50 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Visiting Hours</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Campus admissions office hours for personal consultations:
              </p>
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <p className="font-bold text-white text-xs">{SITE_CONFIG.businessHours.days}</p>
                <p className="text-emerald-400 font-semibold text-xs">{SITE_CONFIG.businessHours.hours}</p>
                <p className="text-[11px] text-slate-500">{SITE_CONFIG.businessHours.sunday}</p>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs pt-1">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>GSTIN: <strong className="font-mono text-slate-300">{SITE_CONFIG.gstin}</strong></span>
              </div>
            </div>
          </div>

          {/* Direct Online Admissions Enquiry */}
          <div className="mb-14">
            <PublicEnquiryForm preselectedCourseSlug={prefilledCourse} />
          </div>

          {/* Campus Location Map & Directions Section */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-8 sm:p-10 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                  <Building className="h-4 w-4" />
                  <span>Physical Training Campus</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Visit Us in Civil Lines, Prayagraj
                </h2>
                <address className="not-italic text-xs sm:text-sm text-slate-300 leading-relaxed space-y-1">
                  <p className="font-bold text-white">{SITE_CONFIG.name}</p>
                  <p>{SITE_CONFIG.address.line1}</p>
                  <p>{SITE_CONFIG.address.line2}</p>
                  <p>{SITE_CONFIG.address.city}, {SITE_CONFIG.address.state} — {SITE_CONFIG.address.pincode}</p>
                  <p className="text-slate-500 pt-1">Landmark: Opposite Rai and Company, near Patrika Chauraha</p>
                </address>

                <div className="pt-2 flex flex-wrap gap-3">
                  <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold h-11 px-5 rounded-xl shadow-md">
                    <a
                      href={SITE_CONFIG.address.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>Get Directions on Google Maps</span>
                      <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </a>
                  </Button>

                  <Button asChild variant="outline" className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-800 h-11 px-5 rounded-xl">
                    <Link href="/courses">Browse Courses First</Link>
                  </Button>
                </div>
              </div>

              {/* Campus Info Box */}
              <div className="bg-slate-950/80 p-7 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-emerald-400">Campus Tour Information</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Visitors can inspect our high-speed computer labs, review curriculum syllabus with faculty members, and attend open demo sessions by prior arrangement.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-200 block">
                    Campus Facilities:
                  </span>
                  <ul className="text-xs text-slate-400 space-y-1.5 mt-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Dedicated high-performance workstation lab</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>High-speed enterprise fiber network</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Air-conditioned interactive lecture rooms</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Direct parking available</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
