import * as React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { SITE_CONFIG } from "@/lib/constants/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FranchiseEnquiryForm } from "@/components/public/franchise-enquiry-form";
import {
  Building2,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Award,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  Layers,
  ArrowRight,
  Headphones,
  Laptop,
  Compass,
  FileCheck,
  CheckSquare,
  Sparkles,
  MapPin,
  Clock,
  PhoneCall,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { formatPaiseToRupees } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Franchise Opportunities | SOFTLAB GLOBAL — Launch an IT Training Center",
  description:
    "Partner with SOFTLAB GLOBAL to build an IT education center. Deliver 21+ industry-grade courses with end-to-end LMS, real-time CRM, trainer enablement, and 6 months complete support. Approved investment under ₹10 Lakh.",
  openGraph: {
    title: "SOFTLAB GLOBAL Franchise Opportunity — IT Education Center (Under ₹10L)",
    description:
      "Start a high-growth technology education franchise in your city with SOFTLAB GLOBAL. Comprehensive 6-month support, complete LMS/CRM, and certified curricula.",
    url: `${SITE_CONFIG.domain}/franchise`,
  },
};

export default async function FranchisePage() {
  // Query actual live published courses from PostgreSQL
  const publishedCourses = await db.course.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      durationWeeks: true,
      level: true,
      baseFee: true,
      summary: true,
    },
    orderBy: {
      title: "asc",
    },
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_CONFIG.name,
    url: `${SITE_CONFIG.domain}/franchise`,
    logo: `${SITE_CONFIG.domain}/logo.png`,
    description:
      "SOFTLAB GLOBAL offers franchise opportunities for enterprise IT education, coding bootcamps, and technical skills training under an approved ₹10 Lakh investment model.",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONFIG.address.line1,
      addressLocality: SITE_CONFIG.address.city,
      addressRegion: SITE_CONFIG.address.state,
      postalCode: SITE_CONFIG.address.pincode,
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE_CONFIG.contact.phone,
      contactType: "franchise inquiries",
      email: SITE_CONFIG.contact.email,
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white pt-16 pb-20 md:pt-24 md:pb-28 border-b border-emerald-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>EXPANSION PARTNERSHIP 2026</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Build Your Own <span className="text-emerald-400">IT Education Business</span> with SOFTLAB GLOBAL
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Launch a premier technology education center in your city. Deliver <strong>21+ job-ready courses</strong> in
                Full Stack, Cloud Computing, DevOps, Python, AI, and Cybersecurity backed by our enterprise LMS, CRM lead
                routing, and <strong>6 months of complete hands-on operational enablement</strong>.
              </p>

              {/* Trust Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                  <div className="text-xs text-slate-400">Investment Model</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">Under ₹10 Lakh</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                  <div className="text-xs text-slate-400">Course Portfolio</div>
                  <div className="text-sm sm:text-base font-bold text-white mt-0.5">21+ Programs</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                  <div className="text-xs text-slate-400">Operational Support</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">6 Months Full</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                  <div className="text-xs text-slate-400">Tech Platform</div>
                  <div className="text-sm sm:text-base font-bold text-white mt-0.5">LMS + CRM Inc.</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 h-12 rounded-xl shadow-lg shadow-emerald-900/30">
                  <a href="#franchise-enquiry-form">
                    <span>Apply for Franchise</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-sm h-12 rounded-xl">
                  <a href="#support-framework">
                    <span>Explore 6-Month Support</span>
                  </a>
                </Button>
              </div>
            </div>

            {/* Quick Summary Card / Form Teaser */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-emerald-500/20 bg-slate-800/70 p-6 sm:p-8 backdrop-blur shadow-2xl space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Direct Expansion Desk</h3>
                    <p className="text-xs text-slate-400">Verified institutional onboarding</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Exclusive territorial licensing opportunities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Turnkey lab architecture, syllabus & lesson plans</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Trainer recruitment assistance & faculty workshops</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>National certification brand credibility</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Headquarters:</span>
                  <span className="font-semibold text-white">{SITE_CONFIG.address.city}, UP</span>
                </div>

                <Button asChild className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs h-11 rounded-xl">
                  <a href="#franchise-enquiry-form">
                    <span>Submit Territory Application</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FRANCHISE BUSINESS MODEL (APPROVED UNDER ₹10 LAKH) */}
      <section className="py-16 md:py-20 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-300">
              Transparent Financial Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              The SOFTLAB GLOBAL Franchise Model
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              Designed for high sustainability, low overhead, and fast execution. We do not burden franchise partners with
              exorbitant brand royalties or unnecessary software retainers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Investment positioning */}
            <Card className="border-2 border-emerald-500/40 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 sm:p-7 space-y-4">
                <div className="p-3 w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  ₹10L
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Approved Positioning</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">Investment: Under ₹10 Lakh</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Total capital commitment typically remains <strong>Under ₹10 Lakh</strong>, covering center branding,
                  lab setup guidance, curriculum licenses, trainer development, and local marketing enablement.
                </p>
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>No hidden franchise surcharges</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Operating Margin & Returns */}
            <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 sm:p-7 space-y-4">
                <div className="p-3 w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Revenue Potential</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">Diversified Course Revenue</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Earn through short-term certifications (6-8 weeks), career-track diplomas (3-6 months), corporate
                  workshops, and campus recruitment drives with average student fees ranging from ₹5,000 to ₹35,000+.
                </p>
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>21+ active courses across multiple streams</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Technology & LMS Included */}
            <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 sm:p-7 space-y-4">
                <div className="p-3 w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Turnkey Technology</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">Central LMS & CRM Included</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No need to build your own software. Every partner receives complete access to the SOFTLAB GLOBAL ERP/LMS
                  suite, student portal, marksheet engine, and automated CRM lead pipeline.
                </p>
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Instant student & counselor logins</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Realistic Disclaimer Banner */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 flex items-start gap-3">
            <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Statutory Disclosure & Market Disclaimer:</strong> Projected revenue, enrollment metrics, and return
              on investment vary by geographic market, city demographics, partner leadership, local student intake, and
              operational discipline. SOFTLAB GLOBAL provides established institutional frameworks, verified curricula,
              software infrastructure, and training, but does not offer speculative guarantees.
            </p>
          </div>
        </div>
      </section>

      {/* 3. 6 MONTHS COMPLETE SUPPORT FRAMEWORK */}
      <section id="support-framework" className="py-16 md:py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Comprehensive Enablement
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              6 Months Complete Operational Support
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              We stand side-by-side with every franchise partner through the critical first 180 days. From initial lab
              blueprints to filling your first cohort and delivering final graduation ceremonies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Laptop,
                title: "1. Lab Architecture & Workstation Blueprint",
                desc: "Turnkey hardware specifications, lab networking topologies, power-backup planning, and classroom ergonomics tailored for code development.",
              },
              {
                icon: BookOpen,
                title: "2. 21+ Production-Grade Curricula",
                desc: "Complete syllabi, step-by-step lab exercises, student handbooks, and GitHub repository boilerplates for modern full stack and cloud stacks.",
              },
              {
                icon: Layers,
                title: "3. Enterprise LMS Deployment",
                desc: "Full institutional LMS access for batch scheduling, digital assignments, topic progress tracking, and attendance register automation.",
              },
              {
                icon: Users,
                title: "4. CRM & Lead Pipeline Integration",
                desc: "Connect your local inquiries directly into the central CRM with automated round-robin routing to telecallers, counselors, and directors.",
              },
              {
                icon: GraduationCap,
                title: "5. Trainer Recruitment & Master Onboarding",
                desc: "Interview frameworks to hire qualified local instructors, complemented by intensive onboarding from Mr. Mayur Gaur (11+ years of leadership & entrepreneurship) and core faculty.",
              },
              {
                icon: TrendingUp,
                title: "6. Digital Marketing & Local Geo-Launch",
                desc: "High-converting ad templates, local Google Business optimization, social media banners, and flyer collateral for student inquiries.",
              },
              {
                icon: Headphones,
                title: "7. Admissions Counseling SOPs",
                desc: "Proven telephone scripts, program comparison matrices, walk-in presentation guides, and fee installment structuring strategies.",
              },
              {
                icon: Award,
                title: "8. Examination & Dual Certification Engine",
                desc: "Automated exam portals, verified marksheets, and official SOFTLAB GLOBAL digital certificate issuance with QR-code verification.",
              },
              {
                icon: FileCheck,
                title: "9. Capstone Project Ecosystem",
                desc: "Real-world portfolio projects simulating live client briefs (e-commerce, SaaS, microservices, cloud deployments) for every student.",
              },
              {
                icon: Briefcase,
                title: "10. Placement Preparation Desk",
                desc: "Resume templates, mock technical interview checklists, soft-skills rubrics, and campus recruitment drive coordination.",
              },
              {
                icon: ShieldCheck,
                title: "11. Quality Audits & Academic Reviews",
                desc: "Monthly classroom observation, batch completion tracking, student satisfaction surveys, and syllabus adherence reviews.",
              },
              {
                icon: Calendar,
                title: "12. Dedicated Account Director",
                desc: "Direct access to a senior corporate franchise manager with bi-weekly progress calls to optimize enrollment and resolve blockers.",
              },
            ].map((pillar, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 hover:bg-emerald-50/20 hover:border-emerald-300 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-emerald-700 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <pillar.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                    {pillar.title}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY PARTNER WITH SOFTLAB GLOBAL (8 STRATEGIC ADVANTAGES) */}
      <section className="py-16 md:py-20 bg-slate-900 text-white border-b border-emerald-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
              Institutional Strength
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
              Why Partner With SOFTLAB GLOBAL?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
              We operate on authentic engineering standards, not superficial hype. When you open a SOFTLAB GLOBAL center,
              your students learn real software development.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Job-Aligned Tech Stacks",
                desc: "No outdated 2010 syllabus. We teach modern React, Next.js, Node.js, Python, AWS, Docker, DevOps, and Data Science.",
              },
              {
                title: "Ready-to-Use Software",
                desc: "Save months and lakhs of rupees. Your center immediately gets a live student LMS, attendance system, and CRM pipeline.",
              },
              {
                title: "Direct Marketing Routing",
                desc: "Connect Google Ads, Meta Ads, and regional campaigns directly to your counselor phones with automated logging.",
              },
              {
                title: "Master Faculty Mentorship",
                desc: "Your trainers are personally guided and upskilled by veteran engineering leadership to maintain quality standards.",
              },
              {
                title: "Verifiable Certifications",
                desc: "Every certificate features tamper-proof verification, giving students immense confidence when applying for jobs.",
              },
              {
                title: "Cap on Initial Investment",
                desc: "Positioned strictly under ₹10 Lakh to ensure partners break even smoothly and preserve operational liquidity.",
              },
              {
                title: "Corporate Recruitment Ties",
                desc: "Tap into multi-city hiring drives, technology placement partners, and remote apprenticeship opportunities.",
              },
              {
                title: "Territorial Protection",
                desc: "Protected micro-markets and city zones to prevent internal partner cannibalization and ensure sustained market share.",
              },
            ].map((adv, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-emerald-500/50 hover:bg-white/[0.08] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold mb-4">
                  0{idx + 1}
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{adv.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. DYNAMIC COURSE PORTFOLIO (FROM DATABASE) */}
      <section className="py-16 md:py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Live Academic Offering
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
                Dynamic Course Portfolio
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                As a franchise partner, your institute is licensed to offer our entire suite of published programs,
                including curricula, project guidelines, and certification tracks.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{publishedCourses.length} Certified Courses Available</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedCourses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-400 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                      {course.level || "Enterprise IT"}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {course.durationWeeks ? `${course.durationWeeks} Weeks` : "Structured"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {course.title}
                  </h3>
                  <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Level: <strong className="text-slate-700">{course.level || "Industry"}</strong></span>
                    <span>•</span>
                    <span>Fee: <strong className="text-emerald-700">{formatPaiseToRupees(course.baseFee)}</strong></span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">COURSE-{course.id.slice(-4).toUpperCase()}</span>
                  <Link
                    href={`/courses/${course.slug}`}
                    target="_blank"
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                  >
                    <span>View Syllabus</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. WHAT YOU GET (DELIVERABLES CHECKLIST) */}
      <section className="py-16 md:py-20 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-300">
                Institutional Deliverables
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Everything You Need to Run an Education Academy
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When you partner with SOFTLAB GLOBAL, you receive a full-spectrum business-in-a-box. We eliminate guesswork
                so you can focus on student counseling, teaching excellence, and local market leadership.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "Official SOFTLAB GLOBAL Authorized Learning Center plaque & certificate",
                  "Turnkey rights to offer 21+ industry-grade technology diplomas & bootcamps",
                  "Complete master trainer curriculum deck, coding repositories, and video references",
                  "Dedicated Center LMS instance with automated student logins & marksheets",
                  "Integrated CRM with WhatsApp, Telecaller desk, and automated lead ingestion",
                  "High-resolution branding collateral (signage, interior posters, certificates)",
                  "Verified student project portfolio templates for corporate hiring",
                  "Placement cell support with multi-city recruitment tie-ups",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Box */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-slate-100 pb-5">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                    Package Inclusions
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">Franchise Asset Matrix</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-900">Academic Assets</div>
                    <div className="text-slate-500">21+ Curricula & Labs</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-900">Digital Portal</div>
                    <div className="text-slate-500">Full Cloud LMS / CRM</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-900">Faculty Enablement</div>
                    <div className="text-slate-500">Master Trainer Training</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-900">Certification</div>
                    <div className="text-slate-500">QR-Verified Credentials</div>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900 space-y-1">
                  <span className="font-bold">Zero Re-Engineering Requirement</span>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    You do not need to build portals, record syllabi, or prepare assignments. All course material is updated
                    centrally by our core engineering team in Prayagraj.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. WHO CAN PARTNER (IDEAL PARTNER PROFILES) */}
      <section className="py-16 md:py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Target Partner Archetypes
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Who is an Ideal SOFTLAB GLOBAL Franchise Partner?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              We look for individuals and institutions committed to educational rigor, high student outcomes, and
              long-term community reputation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Existing Institute Owners",
                desc: "Upgrade your basic computer or hardware coaching center into an enterprise software engineering academy with high-ticket programs.",
              },
              {
                title: "IT Engineers & Trainers",
                desc: "Experienced developers and technical mentors ready to establish their own academy backed by institutional accreditation.",
              },
              {
                title: "Education Entrepreneurs",
                desc: "Business leaders seeking a high-margin, purpose-driven enterprise in Tier 1, Tier 2, or Tier 3 education hubs.",
              },
              {
                title: "Commercial Space Owners",
                desc: "Property owners with 800 - 1500 sq ft spaces in prime educational/coaching localities seeking high-yield utilization.",
              },
            ].map((prof, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 hover:border-emerald-400 hover:bg-white transition-all shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm mb-4">
                  0{idx + 1}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{prof.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{prof.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PHYSICAL & OPERATIONAL REQUIREMENTS */}
      <section className="py-16 md:py-20 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-300">
              Infrastructure Blueprint
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Infrastructure & Operational Setup
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              Realistic physical parameters designed to keep capital expenditure lean while ensuring comfortable,
              high-performance lab learning for students.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="p-2.5 w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Carpet Area</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>800 to 1,500 sq. ft.</strong> in a visible, accessible commercial coaching or educational zone with
                student transit access.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="p-2.5 w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Laptop className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Computer Lab</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>15 to 30 workstations</strong> (i5/Ryzen 5, 16GB RAM, SSD) capable of running Docker, Node, VS Code,
                and modern dev environments.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="p-2.5 w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Connectivity & Power</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>100+ Mbps lease or optical broadband</strong> with inverter/UPS backup to guarantee uninterrupted coding sessions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="p-2.5 w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Reception & Staff</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Professional front-office counseling area, 1 academic counselor, and 1-2 core technical instructors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. 5-STEP ONBOARDING ROADMAP */}
      <section className="py-16 md:py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Clear Onboarding Path
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              5-Step Franchise Onboarding Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              From application to opening day within 30 to 45 days.
            </p>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                {
                  step: "01",
                  title: "Enquiry Submission",
                  desc: "Submit your city, background, and investment scope via the form below.",
                },
                {
                  step: "02",
                  title: "Territory Feasibility",
                  desc: "Corporate assessment of local market demand, competition, and student potential.",
                },
                {
                  step: "03",
                  title: "Leadership Conference",
                  desc: "Detailed video or in-person discussion at our Prayagraj headquarters.",
                },
                {
                  step: "04",
                  title: "Agreement & Lab Setup",
                  desc: "Formal licensing signoff, hardware procurement, and LMS deployment.",
                },
                {
                  step: "05",
                  title: "Marketing & Launch",
                  desc: "Faculty orientation, digital ad campaigns, and inaugural batch commencement.",
                },
              ].map((st, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-3 relative group hover:border-emerald-400 hover:bg-emerald-50/20 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-sm group-hover:bg-emerald-600 transition-colors">
                    {st.step}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">{st.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 10. FRANCHISE ENQUIRY FORM */}
      <section id="franchise-enquiry-form" className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-emerald-50/30 border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FranchiseEnquiryForm defaultCity="" defaultState="Uttar Pradesh" />
        </div>
      </section>

      {/* 11. FAQ & CORPORATE CONTACT */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Direct Expansion Office
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Connect Directly With Corporate Development
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Prefer to discuss territory expansion over a telephone conference or campus visit? Our corporate
                partnership team is available Monday through Saturday.
              </p>

              <div className="space-y-3 pt-3 text-xs text-slate-700">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Headquarters Campus:</strong>
                    <p className="text-slate-600 mt-0.5">{SITE_CONFIG.address.full}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PhoneCall className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Franchise Inquiry Desk:</strong>
                    <p className="text-slate-600 mt-0.5">
                      <a href={`tel:${SITE_CONFIG.contact.phoneTel}`} className="hover:text-emerald-700 font-semibold">
                        {SITE_CONFIG.contact.phone}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Office Hours:</strong>
                    <p className="text-slate-600 mt-0.5">
                      {SITE_CONFIG.businessHours.days} ({SITE_CONFIG.businessHours.hours})
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Frequently Asked Questions</h3>
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1.5">
                  <div className="font-bold text-slate-900">Can I convert my existing computer institute to SOFTLAB GLOBAL?</div>
                  <p className="text-slate-600 leading-relaxed">
                    Yes. We actively support established computer centers and coaching institutes in upgrading to our modern IT
                    curriculum, LMS platform, and placement ecosystem.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1.5">
                  <div className="font-bold text-slate-900">How are trainers trained and vetted?</div>
                  <p className="text-slate-600 leading-relaxed">
                    We provide comprehensive instructor guides, lecture notes, and conduct master-trainer evaluation sessions
                    led by veteran technology leader & entrepreneur Mr. Mayur Gaur (11+ years experience) before batch kickoff.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1.5">
                  <div className="font-bold text-slate-900">Do you offer territorial exclusivity?</div>
                  <p className="text-slate-600 leading-relaxed">
                    Yes. We provide designated micro-market exclusivity per center based on geographic radius and population
                    density to ensure healthy enrollment without self-competition.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
