"use client";

import * as React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Laptop,
  BookOpen,
  Layers,
  Users,
  GraduationCap,
  TrendingUp,
  Headphones,
  Award,
  FileCheck,
  Briefcase,
  ShieldCheck,
  Calendar,
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  PhoneCall,
  Clock,
  Target,
  FileText,
  Building2,
  Lock,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants/site";

export interface SupportPillar {
  id: number;
  numberStr: string;
  icon: React.ElementType;
  title: string;
  tagline: string;
  category: "all" | "tech" | "academics" | "growth";
  categoryLabel: string;
  timeline: string;
  shortDesc: string;
  longObjective: string;
  deliverables: string[];
  keyMetric: {
    label: string;
    value: string;
  };
  whyItMatters: string;
}

export const SUPPORT_PILLARS: SupportPillar[] = [
  {
    id: 1,
    numberStr: "01",
    icon: Laptop,
    title: "Lab Architecture & Workstation Blueprint",
    tagline: "Turnkey Hardware & Networking Setup",
    category: "tech",
    categoryLabel: "Infrastructure & Tech",
    timeline: "Days 1 – 15",
    shortDesc: "Turnkey hardware specifications, lab networking topologies, power-backup planning, and classroom ergonomics tailored for code development.",
    longObjective: "Eliminate costly trial-and-error by providing an exact physical blueprint for your center. We specify verified workstation components, network topologies, and power protection that easily handle modern dev containers, AI models, and coding labs without system lag.",
    deliverables: [
      "CAD floor plans and workstation layouts for 800 – 1,500 sq. ft. commercial spaces",
      "Exact PC hardware configurations (i5/Ryzen 5, 16GB RAM, SSD) with pre-negotiated OEM vendor discounts",
      "Enterprise dual-WAN router, gigabit switch & CAT6 structured cabling diagram",
      "Online UPS & inverter load calculator for zero downtime during power interruptions",
      "Smart 4K display / interactive projector installation and faculty audio setup",
    ],
    keyMetric: {
      value: "100% Turnkey",
      label: "Ready within 14 days of site possession",
    },
    whyItMatters: "Students judge an IT academy instantly by its lab environment. A sleek, modern workstation setup commands premium tuition fees and establishes immediate trust.",
  },
  {
    id: 2,
    numberStr: "02",
    icon: BookOpen,
    title: "21+ Production-Grade Curricula & Repositories",
    tagline: "Job-Aligned Technology Engineering Syllabus",
    category: "academics",
    categoryLabel: "Academics & Faculty",
    timeline: "Immediate / Continuous",
    shortDesc: "Complete syllabi, step-by-step lab exercises, student handbooks, and GitHub repository boilerplates for modern full stack, cloud, DevOps, AI, and cybersecurity.",
    longObjective: "Equip your center with a full academic engine from Day 1. No need to spend months preparing curriculum or slide decks. Every course is continually updated by our engineering leadership to match modern hiring standards.",
    deliverables: [
      "All 21 accredited course syllabi, day-by-day lesson plans, and classroom slides",
      "100+ structured lab assignment sheets with automated unit tests & grading rubrics",
      "Curated GitHub repositories with starter boilerplates for student coding labs",
      "Real-world enterprise case studies (Microservices, AWS Cloud, Docker, Neural Networks)",
      "Continuous central updates pushed automatically as industry technologies evolve",
    ],
    keyMetric: {
      value: "21 Programs",
      label: "Full stack, Cloud, DevOps, AI, Python & Security",
    },
    whyItMatters: "Most local coaching centers teach outdated 2010-era computer courses. Delivering 21 modern software engineering programs sets you apart as the #1 tech institute in your territory.",
  },
  {
    id: 3,
    numberStr: "03",
    icon: Layers,
    title: "Enterprise LMS & Center Management Deployment",
    tagline: "Institutional Cloud Software Infrastructure",
    category: "tech",
    categoryLabel: "Infrastructure & Tech",
    timeline: "Days 15 – 25",
    shortDesc: "Full institutional LMS access for batch scheduling, digital assignments, topic progress tracking, and attendance register automation.",
    longObjective: "Operate like a world-class technology university with zero software development expenditure. Your students, trainers, and counselors get dedicated logins to the centralized SOFTLAB GLOBAL ERP/LMS cloud suite.",
    deliverables: [
      "Dedicated Center tenant on the SOFTLAB GLOBAL cloud infrastructure",
      "Student web portal with code submissions, online quizzes, and digital marksheets",
      "Trainer portal with automated attendance registers, batch syllabus logs, and study materials",
      "Administrative dashboard to track fee collections, batch velocities, and student drop-off risks",
      "Mobile-optimized responsive access for students to study and review lectures anytime",
    ],
    keyMetric: {
      value: "99.9% Uptime",
      label: "Zero development cost, instantaneous center deployment",
    },
    whyItMatters: "Building an enterprise LMS costs ₹15-20 Lakh and years of development. We hand it to you pre-configured and fully functional from Day 1.",
  },
  {
    id: 4,
    numberStr: "04",
    icon: Users,
    title: "Central CRM & Real-Time Lead Ingestion Desk",
    tagline: "Automated Student Lead Capture & Routing",
    category: "growth",
    categoryLabel: "Marketing & Growth",
    timeline: "Days 20 – 30",
    shortDesc: "Connect your local inquiries directly into the central CRM with automated round-robin routing to telecallers, counselors, and directors.",
    longObjective: "Never lose a student inquiry. Every inquiry from your local Meta campaigns, Google Ads, website visitors, and Justdial calls lands directly in your CRM with real-time phone notifications for immediate follow-up.",
    deliverables: [
      "Real-time webhook integration for Google Ads, Facebook, Instagram, and Justdial",
      "Automated round-robin distribution to your center counselors and telecallers",
      "WhatsApp automated instant confirmation sent to inquiring students within 60 seconds",
      "Counselor follow-up scheduler with calendar reminders and conversation notes history",
      "Lead duplicate detection and status funnel (New → Contacted → Demo → Admitted)",
    ],
    keyMetric: {
      value: "< 60 Seconds",
      label: "Automated student lead notification & instant response",
    },
    whyItMatters: "Speed to lead is everything in education marketing. Contacting a student inquiry within 15 minutes increases admission conversion by over 300%.",
  },
  {
    id: 5,
    numberStr: "05",
    icon: GraduationCap,
    title: "Trainer Recruitment & Master Faculty Onboarding",
    tagline: "Led by Mr. Mayur Gaur (11+ Years Experience)",
    category: "academics",
    categoryLabel: "Academics & Faculty",
    timeline: "Days 20 – 35",
    shortDesc: "Interview frameworks to hire qualified local instructors, complemented by intensive onboarding from Mr. Mayur Gaur (11+ years of leadership & entrepreneurship) and core faculty.",
    longObjective: "Finding and vetting good technical instructors is the #1 pain point for education entrepreneurs. We conduct technical screening interviews and personally train your local faculty before they face a classroom.",
    deliverables: [
      "Standardized job descriptions, screening tests, and technical coding interview question banks",
      "1-on-1 vetting interview conducted by SOFTLAB GLOBAL technical leadership",
      "2-week intensive master trainer bootcamp led by Mr. Mayur Gaur and core faculty",
      "Pedagogical guides on live coding demonstrations, project reviews, and student doubt handling",
      "Dedicated trainer mentor hotline for instructors facing advanced architectural questions",
    ],
    keyMetric: {
      value: "11+ Years",
      label: "Master faculty vetting & continuous teaching certification",
    },
    whyItMatters: "Great trainers produce successful students and organic word-of-mouth referrals. With our master mentorship, your local instructors teach at top-tier metro standards.",
  },
  {
    id: 6,
    numberStr: "06",
    icon: TrendingUp,
    title: "Digital Marketing & Local Geo-Launch Kit",
    tagline: "Proven Student Acquisition Campaigns",
    category: "growth",
    categoryLabel: "Marketing & Growth",
    timeline: "Days 25 – 45",
    shortDesc: "High-converting ad templates, local Google Business optimization, social media banners, and flyer collateral for student inquiries.",
    longObjective: "Fill your first batch before your doors even open. We supply ready-to-run digital ad sets, local geo-targeting strategies, and local marketing collateral proven to generate high-intent student leads.",
    deliverables: [
      "Ad creatives (image banners, video reels, carousel ads) with battle-tested ad copy",
      "Optimized Google Search campaign blueprints (target keywords, negative keywords, ad extensions)",
      "Complete print collateral vector pack: hoardings, banners, newspaper inserts, flyers, standees",
      "Google My Business setup, local map pack ranking guide, and review acquisition framework",
      "College seminar presentation decks and campus ambassador outreach blueprints",
    ],
    keyMetric: {
      value: "250+ Leads",
      label: "Targeted inbound inquiries generated for inaugural cohorts",
    },
    whyItMatters: "You don't need to hire an expensive agency to experiment. You deploy the exact creative playbooks that already drive hundreds of admissions every month.",
  },
  {
    id: 7,
    numberStr: "07",
    icon: Headphones,
    title: "Admissions Counseling SOPs & Conversion Desk",
    tagline: "High-Touch Student Counseling Framework",
    category: "growth",
    categoryLabel: "Marketing & Growth",
    timeline: "Days 30 – 45",
    shortDesc: "Proven telephone scripts, program comparison matrices, walk-in presentation guides, and fee installment structuring strategies.",
    longObjective: "Turn inquiring students and parents into enrolled learners. We train your counseling staff on empathetic, value-driven counseling scripts that highlight career return on investment over raw course fees.",
    deliverables: [
      "Word-for-word telecalling scripts covering student inquiries, parent objections, and course comparisons",
      "In-person counseling flipbook with career salary progressions and alumni stories",
      "Structured installment payment frameworks and early-bird scholarship test systems",
      "Standard student admission agreements, parent orientation guides, and ID card templates",
      "Counselor daily KPI tracking sheets (calls made, demos scheduled, conversions closed)",
    ],
    keyMetric: {
      value: "35%+ Conversion",
      label: "Average walk-in to paid enrollment conversion rate",
    },
    whyItMatters: "Having high leads without trained counselors burns marketing budget. Our counseling SOPs maximize revenue from every telephone and walk-in prospect.",
  },
  {
    id: 8,
    numberStr: "08",
    icon: Award,
    title: "Examination & Dual Certification Engine",
    tagline: "Tamper-Proof QR-Verified Credentials",
    category: "academics",
    categoryLabel: "Academics & Faculty",
    timeline: "Month 2 to Month 6",
    shortDesc: "Automated exam portals, verified marksheets, and official SOFTLAB GLOBAL digital certificate issuance with QR-code verification.",
    longObjective: "Deliver recognized credentials that employers respect. Every student who passes your center's evaluations receives an official SOFTLAB GLOBAL certificate with instant online verification.",
    deliverables: [
      "Online examination engine with randomized question banks and automated grading",
      "Capstone project viva voce assessment guidelines and grading rubrics",
      "Official tamper-proof certificate generation with live verification URLs & QR codes",
      "High-grade physical certificate paper, foil embossing, and hologram seals supplied by HQ",
      "Official marksheet transcripts recognized by IT staffing agencies and recruitment partners",
    ],
    keyMetric: {
      value: "100% Verifiable",
      label: "Instant online employer certificate verification",
    },
    whyItMatters: "Students value credentials that employers can verify. SoftLab Global's centralized verification engine gives your center unmatched academic authority.",
  },
  {
    id: 9,
    numberStr: "09",
    icon: FileCheck,
    title: "Capstone Project Ecosystem & Code Reviews",
    tagline: "Real Production Software Portfolios",
    category: "academics",
    categoryLabel: "Academics & Faculty",
    timeline: "Month 2 to Month 6",
    shortDesc: "Real-world portfolio projects simulating live client briefs (e-commerce, SaaS, microservices, cloud deployments) for every student.",
    longObjective: "Ensure every student graduates with a live GitHub portfolio of deployed applications. We provide real enterprise software specifications that make your students stand out in corporate job interviews.",
    deliverables: [
      "Curated library of 50+ enterprise capstone project briefs across all 21 courses",
      "Git workflow guidelines (feature branching, PR reviews, merge requests, CI/CD)",
      "Cloud hosting deployment tutorials on AWS, Vercel, Render, and Docker",
      "Personal portfolio website templates for students to showcase projects to recruiters",
      "Quarterly network-wide hackathons and coding awards to inspire student excellence",
    ],
    keyMetric: {
      value: "3+ Projects",
      label: "Production repos deployed on GitHub for every student",
    },
    whyItMatters: "Recruiters ignore textbook theory; they hire candidates with live code on GitHub. Our capstone projects give your students an unbeatable hiring advantage.",
  },
  {
    id: 10,
    numberStr: "10",
    icon: Briefcase,
    title: "Placement Assistance & Corporate Drive Engine",
    tagline: "Career Preparation & Hiring Network Access",
    category: "growth",
    categoryLabel: "Marketing & Growth",
    timeline: "Month 3 to Month 6+",
    shortDesc: "Resume templates, mock technical interview checklists, soft-skills rubrics, and campus recruitment drive coordination.",
    longObjective: "Bridge your center's graduates directly with technology hiring managers. We provide full placement enablement, mock interview simulations, and inclusion in central hiring pool drives.",
    deliverables: [
      "ATS-compliant software engineer resume templates and LinkedIn optimization checklists",
      "Technical mock interview question banks covering DSA, System Design, and HR behavioral rounds",
      "Soft-skills, professional communication, and email etiquette modules for regional learners",
      "Participation in central SOFTLAB GLOBAL placement drives and corporate hiring notices",
      "Alumni mentorship network linking your students with working developers in tech hubs",
    ],
    keyMetric: {
      value: "Dedicated Cell",
      label: "Complete placement readiness framework for all graduates",
    },
    whyItMatters: "Placement outcomes drive the entire education business. When parents and students know you have a structured career engine, enrolling is an easy decision.",
  },
  {
    id: 11,
    numberStr: "11",
    icon: ShieldCheck,
    title: "Quality Audits & Academic Review System",
    tagline: "Sustained Operational & Academic Excellence",
    category: "tech",
    categoryLabel: "Infrastructure & Tech",
    timeline: "Monthly Audits",
    shortDesc: "Monthly classroom observation, batch completion tracking, student satisfaction surveys, and syllabus adherence reviews.",
    longObjective: "Maintain elite teaching quality and student satisfaction. We run periodic remote audits and provide actionable health reports so your center consistently achieves top student ratings.",
    deliverables: [
      "Monthly classroom audit checklists covering syllabus progress and lab mentoring quality",
      "Automated student feedback mechanism in LMS measuring Net Promoter Score (NPS)",
      "Batch completion velocity tracking to identify and assist students at risk of falling behind",
      "Benchmark scorecard comparing your center against network-wide performance metrics",
      "Quarterly operational health check with corrective action plans for any bottlenecks",
    ],
    keyMetric: {
      value: "94%+ Benchmark",
      label: "Target student satisfaction & batch completion score",
    },
    whyItMatters: "High quality prevents dropouts and turns students into your biggest brand advocates, generating free word-of-mouth admissions year after year.",
  },
  {
    id: 12,
    numberStr: "12",
    icon: Calendar,
    title: "Dedicated Corporate Account Director",
    tagline: "1-on-1 Executive Guidance & Bi-Weekly Strategy",
    category: "growth",
    categoryLabel: "Marketing & Growth",
    timeline: "Full 180 Days & Beyond",
    shortDesc: "Direct access to a senior corporate franchise manager with bi-weekly progress calls to optimize enrollment, revenue, and resolve blockers.",
    longObjective: "You are never on your own. You are paired with a designated corporate development director who actively tracks your center's growth, ad spend ROI, and operational milestones.",
    deliverables: [
      "Direct mobile hotline & WhatsApp access to your assigned Corporate Account Director",
      "Bi-weekly strategic review calls analyzing lead volume, ad budgets, and counseling pipeline",
      "On-site visit by senior leadership during center inaugural launch and milestone events",
      "Fast-track priority escalation for any technical, licensing, or marketing inquiries",
      "Exclusive first-access to newly developed programs, AI tracks, and institutional grants",
    ],
    keyMetric: {
      value: "1-on-1 Access",
      label: "Bi-weekly strategy reviews with 24-hour corporate SLA",
    },
    whyItMatters: "Starting a business is challenging. Having an experienced executive partner walking you through every enrollment cycle ensures long-term profitability.",
  },
];

export function FranchiseSupportFramework() {
  const [selectedPillar, setSelectedPillar] = useState<SupportPillar | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "tech" | "academics" | "growth">("all");
  const [viewedPillars, setViewedPillars] = useState<number[]>([1]);

  const filteredPillars = React.useMemo(() => {
    if (activeFilter === "all") return SUPPORT_PILLARS;
    return SUPPORT_PILLARS.filter((p) => p.category === activeFilter);
  }, [activeFilter]);

  const handleOpenPillar = (pillar: SupportPillar) => {
    setSelectedPillar(pillar);
    if (!viewedPillars.includes(pillar.id)) {
      setViewedPillars((prev) => [...prev, pillar.id]);
    }
  };

  const handleNextPillar = () => {
    if (!selectedPillar) return;
    const currentIndex = SUPPORT_PILLARS.findIndex((p) => p.id === selectedPillar.id);
    const nextIndex = (currentIndex + 1) % SUPPORT_PILLARS.length;
    handleOpenPillar(SUPPORT_PILLARS[nextIndex]);
  };

  const handlePrevPillar = () => {
    if (!selectedPillar) return;
    const currentIndex = SUPPORT_PILLARS.findIndex((p) => p.id === selectedPillar.id);
    const prevIndex = (currentIndex - 1 + SUPPORT_PILLARS.length) % SUPPORT_PILLARS.length;
    handleOpenPillar(SUPPORT_PILLARS[prevIndex]);
  };

  const handleInquireAboutPillar = (pillar: SupportPillar) => {
    setSelectedPillar(null);
    const element = document.getElementById("franchise-enquiry-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      const reqInput = document.getElementById("fr_requirements") as HTMLTextAreaElement | null;
      if (reqInput && !reqInput.value.includes(pillar.title)) {
        const textToSet = `Interested in details for Support Pillar ${pillar.numberStr} (${pillar.title}). ${reqInput.value}`.trim();
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(reqInput, textToSet);
        } else {
          reqInput.value = textToSet;
        }
        reqInput.dispatchEvent(new Event("input", { bubbles: true }));
        reqInput.focus();
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* Category Filter Tabs & Interactive Exploration Hook */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-emerald-500/30 p-4 sm:p-5 rounded-3xl shadow-xl text-white">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Sparkles className="h-4 w-4 animate-pulse text-emerald-400" />
            <span>Interactive Operational Blueprint</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">
            Tap Any Support Pillar to Inspect Confidential Deliverables
          </h3>
          <p className="text-xs text-slate-300">
            Explored: <strong>{viewedPillars.length} of 12 pillars</strong> • Complete turnkey institutional backing
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "all"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            All 12 Pillars
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("tech")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "tech"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            Tech & Setup
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("academics")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "academics"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            Curriculum & Faculty
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("growth")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "growth"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            Admissions & Growth
          </button>
        </div>
      </div>

      {/* Grid of 12 Interactive Support Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPillars.map((pillar) => {
          const IconComponent = pillar.icon;
          const isViewed = viewedPillars.includes(pillar.id);

          return (
            <div
              key={pillar.id}
              onClick={() => handleOpenPillar(pillar)}
              className="relative cursor-pointer group rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 hover:border-emerald-500/60 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl"
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-4">
                {/* Header Row: Pillar # + Category Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                      Pillar {pillar.numberStr}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {pillar.timeline}
                    </span>
                  </div>

                  {isViewed && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Explored</span>
                    </span>
                  )}
                </div>

                {/* Icon & Title */}
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-slate-950 group-hover:scale-110 transition-all shrink-0">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                      {pillar.title}
                    </h4>
                    <p className="text-[11px] font-medium text-emerald-400 mt-0.5">
                      {pillar.tagline}
                    </p>
                  </div>
                </div>

                {/* Short Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {pillar.shortDesc}
                </p>
              </div>

              {/* Action Hint Bar */}
              <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300 inline-flex items-center gap-1">
                  <span>Open Deliverables & Blueprint</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform" />
                </span>
                <span className="text-[10px] text-slate-500 font-medium group-hover:text-slate-400">
                  Tap to view →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Detail Modal (Clickable Deep-Dive) */}
      {selectedPillar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedPillar(null)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 text-slate-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 text-white flex items-start justify-between border-b border-slate-800 relative">
              <div className="flex items-start gap-4 pr-6">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  {React.createElement(selectedPillar.icon, { className: "h-7 w-7" })}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                      Pillar {selectedPillar.numberStr} of 12
                    </span>
                    <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px] bg-slate-800">
                      {selectedPillar.categoryLabel}
                    </Badge>
                    <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{selectedPillar.timeline}</span>
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                    {selectedPillar.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">{selectedPillar.tagline}</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedPillar(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-7 space-y-6 overflow-y-auto text-xs text-slate-300 leading-relaxed">
              {/* Strategic Objective */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Target className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Strategic Operational Objective</span>
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {selectedPillar.longObjective}
                </p>
              </div>

              {/* Turnkey Deliverables List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4 text-emerald-400" />
                    <span>Turnkey Deliverables Handed to Franchise Partner</span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
                    HQ Handled
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {selectedPillar.deliverables.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-950/70 shadow-2xs hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="text-xs text-slate-200 font-medium leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Metric & Commercial Edge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-2xl border border-emerald-800/80 bg-emerald-950/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Execution SLA / Benchmark
                  </span>
                  <div className="text-xl font-extrabold text-white">
                    {selectedPillar.keyMetric.value}
                  </div>
                  <p className="text-[11px] text-emerald-300">{selectedPillar.keyMetric.label}</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Why This Matters
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                    {selectedPillar.whyItMatters}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer with Navigation & Action CTAs */}
            <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Prev / Next controls */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrevPillar}
                  className="text-xs h-9 px-3 text-slate-300 border-slate-700 bg-slate-800 hover:bg-slate-700"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span>Previous</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNextPillar}
                  className="text-xs h-9 px-3 text-slate-300 border-slate-700 bg-slate-800 hover:bg-slate-700"
                >
                  <span>Next Pillar</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Conversion Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`https://wa.me/919196596975?text=${encodeURIComponent(
                    `Hello SOFTLAB GLOBAL, I was exploring Pillar ${selectedPillar.numberStr} (${selectedPillar.title}) on your Franchise page. I would like to discuss opening a center in my city.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-teal-800 text-teal-300 bg-teal-950/80 hover:bg-teal-900 transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Ask on WhatsApp</span>
                </a>

                <Button
                  onClick={() => handleInquireAboutPillar(selectedPillar)}
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs h-9 px-4 rounded-xl shadow-sm"
                >
                  <span>Inquire About This Pillar</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Conversion Banner */}
      <div className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center md:justify-start gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>Protected Micro-Market Exclusivity</span>
          </span>
          <h4 className="text-lg sm:text-xl font-extrabold text-white">
            Ready to Launch a SOFTLAB GLOBAL Center in Your City?
          </h4>
          <p className="text-xs text-slate-300 max-w-xl">
            All 12 pillars are pre-configured into your approved franchise package (Under ₹10 Lakh). We operate on a
            first-applicant priority per commercial territory.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-11 px-5 rounded-xl shadow-md">
            <a href="#franchise-enquiry-form">
              <span>Apply for Territory Now</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </a>
          </Button>

          <a
            href={`tel:${SITE_CONFIG.contact.phoneTel}`}
            className="inline-flex items-center gap-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 h-11 rounded-xl transition-colors"
          >
            <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
            <span>Call Expansion Desk</span>
          </a>
        </div>
      </div>
    </div>
  );
}
