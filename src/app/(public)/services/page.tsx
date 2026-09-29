import * as React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ServiceEnquiryForm } from "@/components/public/service-enquiry-form";
import {
  Globe,
  Code,
  Smartphone,
  TrendingUp,
  Palette,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Phone,
  ArrowRight,
  Sparkles,
  Server,
  Cloud,
  Headphones,
  Check,
  Clock,
  Layers,
  Award,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SoftLab Global Services | IT, Software, Applications & Digital Solutions",
  description:
    "Corporate IT, software, application development, digital marketing and creative solutions by SoftLab Global. Your complete technology and creative partner in Prayagraj and NCR.",
};

const SERVICE_CATEGORIES = [
  {
    number: "01",
    code: "WEB_DEV",
    title: "Website Development",
    tagline: "High-Performance Modern Web Engineering",
    description:
      "From high-converting startup business websites to enterprise portals and scalable e-commerce systems, we engineer web presences with sub-second speeds, robust security, and seamless mobile responsiveness.",
    icon: Globe,
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    borderGlow: "group-hover:border-emerald-500/60",
    badgeColor: "text-emerald-400 bg-emerald-950/80 border-emerald-800",
    items: [
      { name: "Starter Website", desc: "Clean 5-page responsive site for new ventures & professionals." },
      { name: "Business Website", desc: "Dynamic corporate site with CMS, lead capture & Google Search Console." },
      { name: "Professional Corporate Website", desc: "Custom Figma-crafted enterprise portal with multi-page CMS." },
      { name: "E-Commerce Website", desc: "Complete online store with Razorpay/UPI, cart & order management." },
      { name: "Custom Web Platform", desc: "Bespoke SaaS frontends, portals & client dashboards in Next.js." },
      { name: "Website AMC", desc: "Year-round security patches, weekly cloud backups & guaranteed uptime." },
    ],
  },
  {
    number: "02",
    code: "SOFTWARE_DEV",
    title: "Software Development",
    tagline: "Custom Business Systems & Cloud Automation",
    description:
      "Automate complex business processes, eliminate repetitive operational friction, and scale effortlessly with tailored software architectures built specifically for your institutional needs.",
    icon: Code,
    gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
    borderGlow: "group-hover:border-cyan-500/60",
    badgeColor: "text-cyan-400 bg-cyan-950/80 border-cyan-800",
    items: [
      { name: "Business Software", desc: "Automated billing, invoicing, GST generation & inventory controls." },
      { name: "Custom Software", desc: "Tailored algorithms & custom logic built ground-up for unique workflows." },
      { name: "ERP Systems", desc: "Comprehensive resource planning for manufacturing, institutions & supply chain." },
      { name: "CRM Platforms", desc: "Multi-channel lead tracking, telecaller queues & deal pipelines." },
      { name: "HRMS & Payroll", desc: "Biometric attendance, leave hierarchies & automated salary slips." },
      { name: "LMS Platforms", desc: "Secure video streaming, student portals, online tests & certificates." },
      { name: "SaaS Platforms", desc: "Multi-tenant cloud architectures with recurring subscription billing." },
      { name: "API Integration", desc: "REST/GraphQL bridges connecting payment gateways, WhatsApp & Tally." },
    ],
  },
  {
    number: "03",
    code: "APP_DEV",
    title: "Application Development",
    tagline: "Native & Cross-Platform Mobile Solutions",
    description:
      "Deliver fluid, responsive, 60fps mobile experiences for millions of users. We develop, test, and publish iOS and Android applications built to Apple App Store and Google Play guidelines.",
    icon: Smartphone,
    gradient: "from-teal-500/20 via-emerald-500/10 to-transparent",
    borderGlow: "group-hover:border-teal-500/60",
    badgeColor: "text-teal-400 bg-teal-950/80 border-teal-800",
    items: [
      { name: "Android Apps", desc: "Native Kotlin / Jetpack Compose apps published on Google Play." },
      { name: "iOS Apps", desc: "SwiftUI native applications optimized for iPhones, iPads & Apple Pay." },
      { name: "Android + iOS Combo", desc: "Simultaneous dual-store deployment with synchronized features." },
      { name: "Flutter Applications", desc: "High-speed single codebase delivering native-feel UI on both stores." },
      { name: "React Native Applications", desc: "Clean React Native architecture sharing business logic with web." },
      { name: "Enterprise Applications", desc: "Offline database sync, barcode scanner integration & MDM readiness." },
    ],
  },
  {
    number: "04",
    code: "DIGITAL_MARKETING",
    title: "Digital Marketing",
    tagline: "Performance-Driven Acquisition & Brand Growth",
    description:
      "Transform digital touchpoints into consistent revenue drivers. Our performance squads run targeted PPC, high-intent Meta campaigns, SEO ranking sprints, and automated WhatsApp nurturing funnels.",
    icon: TrendingUp,
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    borderGlow: "group-hover:border-amber-500/60",
    badgeColor: "text-amber-400 bg-amber-950/80 border-amber-800",
    items: [
      { name: "SEO (Search Engine Optimization)", desc: "Technical audits, on-page optimization & high-authority backlinks." },
      { name: "Social Media Marketing", desc: "Custom visual content, community engagement & brand storytelling." },
      { name: "Google Ads (PPC)", desc: "High-intent search, call & display ads capturing active buyers." },
      { name: "Meta Ads (FB & Instagram)", desc: "Hyper-targeted visual lead campaigns with automated CRM sync." },
      { name: "LinkedIn Marketing", desc: "C-suite B2B executive targeting & thought-leadership campaigns." },
      { name: "Lead Generation", desc: "High-converting landing pages & multi-step inquiry capture funnels." },
      { name: "Content Marketing", desc: "SEO-rich authoritative articles, whitepapers & case studies." },
      { name: "WhatsApp & Email Marketing", desc: "Automated broadcast sequences, flow bots & drip nurturing." },
    ],
  },
  {
    number: "05",
    code: "GRAPHICS_DESIGN",
    title: "Graphics & Creative Design",
    tagline: "Corporate Visual Identity & High-Impact Collateral",
    description:
      "Create unforgettable first impressions with bespoke vector identities, luxury brand guidelines, engaging social creatives, and print-ready commercial packaging designed by senior artists.",
    icon: Palette,
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    borderGlow: "group-hover:border-violet-500/60",
    badgeColor: "text-violet-400 bg-violet-950/80 border-violet-800",
    items: [
      { name: "Logo Design", desc: "3 unique vector concepts with complete copyright & source files." },
      { name: "Corporate Branding", desc: "Complete stationery, business cards, letterheads & brand manuals." },
      { name: "Social Media Creatives", desc: "Engaging post packs, carousel graphics & story banners." },
      { name: "Banner & Display Ads", desc: "High-CTR display banners for Google Ads & social promotion." },
      { name: "Flyer & Leaflet Design", desc: "Eye-catching print-ready flyers for marketing distributions." },
      { name: "Brochures & Catalogues", desc: "Multi-page luxury prospectuses with clickable digital PDFs." },
      { name: "Presentations & Pitch Decks", desc: "Investor pitch decks & executive slide decks in PowerPoint/Figma." },
      { name: "Video Editing & Reels", desc: "Engaging short-form videos with motion graphics & subtitles." },
    ],
  },
];

const CORPORATE_PACKAGES = [
  {
    name: "Corporate Starter",
    price: "₹35,000",
    period: "/ month",
    idealFor: "Startups & Emerging Businesses",
    features: [
      "Website Hosting & Security AMC",
      "15 Custom Social Media Creatives",
      "SEO for 10 Priority Keywords",
      "Google Business Profile Management",
      "Monthly Traffic & Analytics Report",
      "Email & WhatsApp Technical Support",
    ],
    highlight: false,
  },
  {
    name: "Corporate Growth",
    price: "₹60,000",
    period: "/ month",
    idealFor: "Scaling Regional Enterprises",
    features: [
      "Website AMC + Minor CMS Updates",
      "Google & Meta Paid Ads Management",
      "25 Visual Creatives + 4 Polished Reels",
      "SEO Ranking Sprint for 25 Keywords",
      "WhatsApp Lead Broadcast Assistance",
      "Dedicated Senior Account Lead",
    ],
    highlight: true,
  },
  {
    name: "Corporate Pro",
    price: "₹1,00,000",
    period: "/ month",
    idealFor: "Established Brands & Market Leaders",
    features: [
      "Continuous Web & App Engineering Support",
      "Multi-Channel Paid Ads (Google, Meta, LinkedIn)",
      "Daily Social Content (40 Creatives + 8 Reels)",
      "Aggressive Technical SEO & Backlink Building",
      "Custom CRM Pipeline Automation",
      "Weekly Strategic Growth Review",
    ],
    highlight: false,
  },
  {
    name: "Enterprise Digital Partner",
    price: "₹1,50,000",
    period: "/ month onwards",
    idealFor: "Large Institutions & Corporate Groups",
    features: [
      "Dedicated Full-Stack Developer & UI/UX Designer",
      "Dedicated Performance Marketing Strategist",
      "Full Cloud VPS & Disaster Recovery Hosting",
      "Custom Internal Tooling & Automation Sprints",
      "99.9% Uptime Guarantee with Custom Corporate SLA",
      "Direct Executive Director Escalation Access",
    ],
    highlight: false,
  },
];

const AMC_SERVICES = [
  {
    title: "Website AMC",
    badge: "Essential Security",
    desc: "24/7 uptime monitoring, weekly offsite backups, core engine updates, malware sweeps, and emergency bug fixing.",
    icon: Globe,
  },
  {
    title: "Cloud & Infrastructure",
    badge: "Cloud DevOps",
    desc: "Managed AWS & DigitalOcean cloud setups, domain DNS administration, automated SSL lifecycle, and server monitoring.",
    icon: Cloud,
  },
  {
    title: "Software & Mobile App AMC",
    badge: "System Longevity",
    desc: "Android & iOS store policy compliance, database indexing, third-party API break fixes, and version migrations.",
    icon: Server,
  },
  {
    title: "Corporate SLA",
    badge: "Guaranteed SLA",
    desc: "Formal enterprise service level agreement with 15-minute critical incident response and dedicated account engineers.",
    icon: Headphones,
  },
];

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#030914] via-[#071626] to-[#040914] py-16 sm:py-24">
        {/* Ambient Glowing Orbs & Tech Circuit Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-10 w-[500px] h-[500px] bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[350px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10 text-center max-w-4xl space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SOFTLAB GLOBAL • Corporate IT, Digital & Creative Solutions</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Your Complete{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Technology, Digital & Creative
            </span>{" "}
            Partner
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
            From modern web and mobile applications to enterprise ERPs, performance marketing funnels, and corporate branding — we engineer high-impact solutions for businesses and institutions.
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm h-11 px-7 rounded-xl shadow-lg shadow-emerald-950/60"
            >
              <a href="#service-enquiry-section" className="flex items-center gap-2">
                <span>Get a Quote</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white text-sm h-11 px-6 rounded-xl"
            >
              <a href={`tel:${SITE_CONFIG.contact.phoneTel}`} className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400" />
                <span>Talk to Our Team</span>
              </a>
            </Button>
          </div>

          {/* Quick Pillars */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>ISO 9001:2015 Certified Squad</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-teal-300">
              <Clock className="h-3.5 w-3.5 text-teal-400" />
              <span>Guaranteed Delivery Timelines</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-cyan-300">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>24/7 Dedicated Support SLA</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Five Primary Service Categories */}
      <section className="py-16 sm:py-20 bg-slate-950 relative border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 z-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Enterprise Services Engineered to Deliver Results
            </h2>
            <p className="text-sm text-slate-400">
              Select any capability below or combine multiple services under our corporate retainer packages.
            </p>
          </div>

          <div className="space-y-8">
            {SERVICE_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.code}
                  className="rounded-3xl border border-slate-800/90 bg-slate-900/90 hover:border-slate-700 p-6 sm:p-8 shadow-xl backdrop-blur-sm transition-all relative overflow-hidden group"
                >
                  <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl ${cat.gradient} rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity`} />

                  <div className="relative z-10 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm shrink-0">
                          <IconComp className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-500">
                              {cat.number}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${cat.badgeColor}`}>
                              {cat.tagline}
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                            {cat.title}
                          </h3>
                        </div>
                      </div>

                      <Button
                        asChild
                        size="sm"
                        className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-4 rounded-xl shrink-0"
                      >
                        <a href="#service-enquiry-section">Request Quote</a>
                      </Button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                      {cat.description}
                    </p>

                    {/* Offerings Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      {cat.items.map((item) => (
                        <div
                          key={item.name}
                          className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500/40 hover:bg-slate-950 transition-all space-y-1 shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <h4 className="text-xs font-bold text-white truncate">
                              {item.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed pl-5.5">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Corporate Combo Retainers Section */}
      <section className="py-16 sm:py-20 bg-slate-950 border-b border-slate-800/80 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-3 py-1 rounded-full border border-teal-800">
              Commercial Growth Retainers
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Corporate Retainer & Dedicated Partner Packages
            </h2>
            <p className="text-sm text-slate-400">
              Comprehensive monthly squads covering development, ongoing maintenance, performance marketing, and creative collateral under a single transparent contract.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORPORATE_PACKAGES.map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-3xl p-6 flex flex-col justify-between border transition-all relative ${
                  pkg.highlight
                    ? "bg-gradient-to-b from-slate-900 to-emerald-950/40 border-emerald-500/80 shadow-2xl shadow-emerald-950/50"
                    : "bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-xl"
                }`}
              >
                {pkg.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                    Most Popular Choice
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {pkg.idealFor}
                    </span>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      {pkg.name}
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-1 border-b border-slate-800 pb-4">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {pkg.price}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {pkg.period}
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {pkg.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Button
                    asChild
                    size="sm"
                    className={`w-full text-xs font-bold h-10 rounded-xl ${
                      pkg.highlight
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    }`}
                  >
                    <a href="#service-enquiry-section">
                      Choose {pkg.name}
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. AMC, Cloud & SLA Section */}
      <section className="py-14 sm:py-18 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800">
              Infrastructure & Maintenance
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Website AMC, Cloud Hosting & Corporate SLAs
            </h2>
            <p className="text-sm text-slate-400">
              Guaranteed continuity, fast disaster recovery, and continuous security patching for critical business software.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AMC_SERVICES.map((amc) => {
              const Icon = amc.icon;
              return (
                <div
                  key={amc.title}
                  className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-3 shadow-lg hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      {amc.badge}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {amc.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {amc.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Consultation CTA Banner */}
      <section className="py-12 bg-slate-950 border-b border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Direct Technical Leadership
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Need a Custom Architectural Consultation?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Speak directly with senior software architects and directors at SoftLab Global to evaluate timelines, technology stacks, and feasibility.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button
                asChild
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-11 px-6 rounded-xl shadow-lg"
              >
                <a href={`tel:${SITE_CONFIG.contact.phoneTel}`} className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>Call {SITE_CONFIG.contact.phone}</span>
                </a>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white text-xs h-11 px-6 rounded-xl"
              >
                <a href="#service-enquiry-section">Get Written Quote</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Service Enquiry Form Section */}
      <section className="py-16 sm:py-24 bg-slate-950 relative">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ServiceEnquiryForm />
        </div>
      </section>
    </div>
  );
}
