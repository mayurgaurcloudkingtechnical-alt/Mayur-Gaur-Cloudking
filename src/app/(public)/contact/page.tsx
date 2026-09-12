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
    <div className="flex flex-col">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-emerald-50/70 to-white py-14 sm:py-20 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Admissions & Inquiries
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-4">
            Connect with Our Academic Desk
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
            Have questions regarding upcoming batches, course syllabi, eligibility, or campus workstation facilities? Reach out directly to our academic team.
          </p>

          {prefilledCourse && (
            <div className="mt-6 inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-4 py-2 rounded-lg text-xs font-semibold">
              <span>Selected Course Inquiry:</span>
              <span className="underline">{prefilledCourse}</span>
            </div>
          )}
        </div>
      </section>

      {/* Contact Channels Grid */}
      <section className="py-16 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Phone Contact */}
            <Card className="border-slate-200 bg-white">
              <CardHeader className="pb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-2">
                  <Phone className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">Telephone / Mobile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Call our admissions counselor directly for immediate cohort information:
                </p>
                <div>
                  <a
                    href={`tel:${SITE_CONFIG.contact.phoneTel}`}
                    className="text-base font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline block"
                  >
                    {SITE_CONFIG.contact.phone}
                  </a>
                  <span className="text-[11px] text-slate-400">Lines open Monday to Saturday</span>
                </div>
                <div className="pt-2">
                  <Button asChild size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <a href={`tel:${SITE_CONFIG.contact.phoneTel}`}>Call Now</a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email Contact */}
            <Card className="border-slate-200 bg-white">
              <CardHeader className="pb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-2">
                  <Mail className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">Email Admissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Send your academic query, previous transcripts, or corporate training inquiry:
                </p>
                <div className="space-y-1">
                  <p className="text-slate-500">General Inquiries:</p>
                  <a
                    href={`mailto:${SITE_CONFIG.contact.email}`}
                    className="font-bold text-slate-900 hover:text-emerald-700 underline block"
                  >
                    {SITE_CONFIG.contact.email}
                  </a>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Admissions Desk:</p>
                  <a
                    href={`mailto:${SITE_CONFIG.contact.admissionsEmail}`}
                    className="font-bold text-slate-900 hover:text-emerald-700 underline block"
                  >
                    {SITE_CONFIG.contact.admissionsEmail}
                  </a>
                </div>
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm" className="w-full border-slate-300">
                    <a href={`mailto:${SITE_CONFIG.contact.admissionsEmail}`}>Compose Email</a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Campus Working Hours */}
            <Card className="border-slate-200 bg-white">
              <CardHeader className="pb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-2">
                  <Clock className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">Visiting Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Campus admissions office hours for personal consultations:
                </p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                  <p className="font-bold text-slate-800">{SITE_CONFIG.businessHours.days}</p>
                  <p className="text-emerald-700 font-semibold">{SITE_CONFIG.businessHours.hours}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{SITE_CONFIG.businessHours.sunday}</p>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 pt-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>GSTIN: <strong className="font-mono text-slate-700">{SITE_CONFIG.gstin}</strong></span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Direct Online Admissions Enquiry */}
          <div className="mb-12">
            <PublicEnquiryForm preselectedCourseSlug={prefilledCourse} />
          </div>

          {/* Campus Location Map & Directions Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <Building className="h-4 w-4" />
                  <span>Physical Training Campus</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Visit Us in Civil Lines, Prayagraj
                </h2>
                <address className="not-italic text-xs sm:text-sm text-slate-700 leading-relaxed space-y-1">
                  <p className="font-bold text-slate-900">{SITE_CONFIG.name}</p>
                  <p>{SITE_CONFIG.address.line1}</p>
                  <p>{SITE_CONFIG.address.line2}</p>
                  <p>{SITE_CONFIG.address.city}, {SITE_CONFIG.address.state} — {SITE_CONFIG.address.pincode}</p>
                  <p className="text-slate-500 pt-1">Landmark: Opposite Rai and Company, near Patrika Chauraha</p>
                </address>

                <div className="pt-2 flex flex-wrap gap-3">
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
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

                  <Button asChild variant="outline" className="border-slate-300">
                    <Link href="/courses">Browse Courses First</Link>
                  </Button>
                </div>
              </div>

              {/* Campus Info Box */}
              <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-200 space-y-3">
                <h3 className="text-sm font-bold text-emerald-950">Campus Tour Information</h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Visitors can inspect our high-speed computer labs, review curriculum syllabus with faculty members, and attend open demo sessions by prior arrangement.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-emerald-900 block">
                    Campus Facilities:
                  </span>
                  <ul className="text-xs text-emerald-800 space-y-1 mt-1">
                    <li>• Dedicated high-performance workstation lab</li>
                    <li>• High-speed enterprise fiber network</li>
                    <li>• Air-conditioned interactive lecture rooms</li>
                    <li>• Direct parking available</li>
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
