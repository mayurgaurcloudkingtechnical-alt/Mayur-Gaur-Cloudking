"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import {
  Briefcase,
  Building2,
  Users,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Code2,
  Cloud,
  Cpu,
  Shield,
  Layers,
  Terminal,
  Clock,
  Phone,
  Mail,
  MapPin,
  Globe,
  Award,
  ChevronDown,
  Check,
  Laptop,
  Flame,
  FileCheck2,
} from "lucide-react";

const DOMAINS_LIST = [
  { id: "FULL_STACK", label: "Full-Stack Web (MERN / Next.js)", icon: Code2, color: "text-emerald-400 bg-emerald-950/60 border-emerald-500/30" },
  { id: "CLOUD_DEVOPS", label: "Cloud & DevOps (AWS / Docker / K8s)", icon: Cloud, color: "text-sky-400 bg-sky-950/60 border-sky-500/30" },
  { id: "DATA_AI", label: "Data Science, AI & ML (Python / LLMs)", icon: Cpu, color: "text-purple-400 bg-purple-950/60 border-purple-500/30" },
  { id: "CYBER_SECURITY", label: "Cyber Security & Ethical Hacking", icon: Shield, color: "text-red-400 bg-red-950/60 border-red-500/30" },
  { id: "QA_AUTOMATION", label: "QA & Test Automation (Selenium / Cypress)", icon: Terminal, color: "text-amber-400 bg-amber-950/60 border-amber-500/30" },
  { id: "MOBILE_DEV", label: "Mobile Apps (React Native / Flutter)", icon: Laptop, color: "text-cyan-400 bg-cyan-950/60 border-cyan-500/30" },
  { id: "IMS_NETWORK", label: "IT Infrastructure & Enterprise Support", icon: Layers, color: "text-indigo-400 bg-indigo-950/60 border-indigo-500/30" },
];

const INDUSTRIES_LIST = [
  "IT Services & Consulting",
  "Product Software / SaaS",
  "Fintech & Banking",
  "E-Commerce & Retail",
  "Healthcare & Biotech",
  "EdTech",
  "Manufacturing & Automotive",
  "Telecom & Media",
  "Other Technology Industry",
];

export default function RecruitersPublicPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "IT Services & Consulting",
    website: "",
    companySize: "51-200",
    city: "Prayagraj",
    state: "Uttar Pradesh",
    contactPersonName: "",
    designation: "Talent Acquisition Lead",
    contactEmail: "",
    contactPhone: "",
    whatsappNumber: "",
    hiringType: "FULL_TIME",
    targetDomains: ["Full-Stack Web (MERN / Next.js)"],
    jobTitle: "",
    openingsCount: 5,
    salaryPackage: "₹4.5 - ₹7.5 LPA",
    workMode: "HYBRID",
    jobDescription: "",
    notes: "",
  });

  const [submittedResult, setSubmittedResult] = useState<{
    referenceCode: string;
    companyName: string;
    contactPerson: string;
  } | null>(null);

  const registerMutation = api.placement.registerPublicRecruiter.useMutation({
    onSuccess: (res: any) => {
      setSubmittedResult({
        referenceCode: res.referenceCode,
        companyName: res.companyName,
        contactPerson: res.contactPerson,
      });
      // Scroll to confirmation
      window.scrollTo({ top: 600, behavior: "smooth" });
    },
    onError: (err: any) => {
      alert(`Registration submission failed: ${err.message}`);
    },
  });

  const toggleDomain = (domainLabel: string) => {
    setFormData((prev) => {
      const exists = prev.targetDomains.includes(domainLabel);
      if (exists) {
        if (prev.targetDomains.length === 1) return prev; // keep at least one
        return { ...prev, targetDomains: prev.targetDomains.filter((d) => d !== domainLabel) };
      } else {
        return { ...prev, targetDomains: [...prev.targetDomains, domainLabel] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      companyName: formData.companyName,
      industry: formData.industry,
      website: formData.website || undefined,
      companySize: formData.companySize,
      city: formData.city,
      state: formData.state,
      contactPersonName: formData.contactPersonName,
      designation: formData.designation,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      whatsappNumber: formData.whatsappNumber || undefined,
      hiringType: formData.hiringType,
      targetDomains: formData.targetDomains,
      jobTitle: formData.jobTitle || undefined,
      openingsCount: Number(formData.openingsCount) || 5,
      salaryPackage: formData.salaryPackage || undefined,
      workMode: formData.workMode,
      jobDescription: formData.jobDescription || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen selection:bg-cyan-500 selection:text-black">
      {/* ===================================================================== */}
      {/* HERO SECTION                                                          */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden pt-20 pb-24 border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        {/* Glow ambient background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-emerald-600/20 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -top-10 right-10 w-72 h-72 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-950/40 animate-pulse">
              <Sparkles className="h-3.5 w-3.5" />
              <span>SoftLab Global Corporate Recruitment &amp; Talent Alliance</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-md">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Open for Vendor Empanelment &middot; Minimal Fee: 8.33% to 12% on CTC &middot; Zero Advance</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Hire Top 1% Pre-Vetted Tech Talent.{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Zero Sourcing Fee.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Accelerate your engineering roadmap. SoftLab Global connects enterprise recruiters, high-growth startups, and IT consultancies with battle-tested developers, cloud engineers, and data specialists ready to deploy from Day 1.
            </p>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="#post-hiring-form"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-950/50 hover:from-cyan-400 hover:to-emerald-400 transition-all flex items-center gap-2"
              >
                <span>Post Hiring Requirement</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#hiring-models"
                className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-sm hover:bg-slate-800 hover:border-slate-600 transition flex items-center gap-2"
              >
                <Briefcase className="h-4 w-4 text-cyan-400" />
                <span>Explore Hiring Models</span>
              </a>
            </div>

            {/* Top Stat Highlights Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 text-left">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <p className="text-2xl sm:text-3xl font-black text-cyan-400">500+</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Corporate Hiring Partners</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">10,000+</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Certified Tech Alumni</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <p className="text-2xl sm:text-3xl font-black text-amber-400">48 Hours</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Shortlist Turnaround</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <p className="text-2xl sm:text-3xl font-black text-purple-400">₹4.5L - ₹24L</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">CTC Range Offered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* TALENT DOMAINS                                                        */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-20 border-b border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Production-Ready Engineers</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Specialized Talent Across Every Modern Tech Stack
            </h2>
            <p className="text-sm text-slate-400">
              Our candidates are trained rigorously on production workflows, cloud architecture, and real Git pull-request review cycles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DOMAINS_LIST.map((domain) => {
              const Icon = domain.icon;
              return (
                <div
                  key={domain.id}
                  className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition group hover:shadow-xl hover:shadow-cyan-950/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${domain.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition">
                        {domain.label}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">Pre-evaluated &amp; Code-Verified</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Candidates demonstrate hands-on projects, automated test suites, responsive designs, and clean modular codebases before graduating.
                  </p>
                  <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 pt-3 border-t border-slate-800/80">
                    <span>Available Immediate Joiners</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* VENDOR EMPANELMENT & MANPOWER ALLIANCE SECTION                         */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 relative overflow-hidden">
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official Corporate Empanelment Program</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Open for Vendor Empanelment &middot;{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Minimal Market Fee: 8.33% to 12% on CTC
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              SoftLab Global partners with corporate recruiting teams, enterprises, and IT consultancies as an authorized staffing vendor. We fulfill your niche and volume manpower needs with transparent commercials, zero upfront advance, and automated GST billing upon joining.
            </p>
          </div>

          {/* Transparent Empanelment Rate Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Card 1: 8.33% */}
            <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition space-y-5 relative group shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  Standard Foundation
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono">8.33%</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Entry &amp; Mid-Level Tech Engineers</h3>
                <p className="text-xs text-slate-400 mt-1">Freshers to 3 Years Experience &middot; ~ 1 Month Gross Salary</p>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full-Stack Web (MERN / Next.js / Python)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>QA Automation &amp; Manual Testing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Mobile App Developers (Flutter / React Native)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Zero Advance</strong> &middot; Pay only upon joining</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>30 to 60 Days Free Replacement Guarantee</span>
                </li>
              </ul>
              <div className="pt-2">
                <a
                  href="#post-hiring-form"
                  className="w-full py-2.5 rounded-xl bg-slate-800 group-hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>Empanel for Entry Tech (8.33%)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Card 2: 10% - 12% */}
            <div className="p-8 rounded-3xl bg-slate-900/90 border-2 border-cyan-500/50 hover:border-cyan-400 transition space-y-5 relative group shadow-2xl shadow-cyan-950/30">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950">
                MOST POPULAR FOR ENTERPRISES
              </div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  Niche &amp; Lateral
                </span>
                <span className="text-2xl font-black text-cyan-400 font-mono">10% - 12%</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Senior Engineers &amp; Specialist Stacks</h3>
                <p className="text-xs text-slate-400 mt-1">3 to 7+ Years Experience &middot; Cloud, AI &amp; Architecture</p>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Cloud &amp; DevOps Specialists (AWS, K8s, CI/CD)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Data Science, AI / LLM &amp; ML Engineers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Cyber Security &amp; SOC Analysts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Rigorous architectural code review completed</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span><strong>90 Days Free Replacement Guarantee</strong></span>
                </li>
              </ul>
              <div className="pt-2">
                <a
                  href="#post-hiring-form"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition hover:shadow-lg shadow-cyan-950/40"
                >
                  <span>Empanel for Lateral Tech (10-12%)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Card 3: Bulk / Custom */}
            <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 transition space-y-5 relative group shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-950 text-purple-400 border border-purple-500/30">
                  Bulk Cohorts
                </span>
                <span className="text-xl font-black text-purple-400 font-mono">Volume Slabs</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Campus &amp; Large-Scale Drives</h3>
                <p className="text-xs text-slate-400 mt-1">10+ to 100+ Hires &middot; Tiered Volume Rebates</p>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Negotiable slab rates for bulk hiring cohorts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Custom online coding test platform setup</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Dedicated corporate relationship manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Automated multi-candidate consolidated invoicing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Staggered batch rollout &amp; onboarding sync</span>
                </li>
              </ul>
              <div className="pt-2">
                <a
                  href="#post-hiring-form"
                  className="w-full py-2.5 rounded-xl bg-slate-800 group-hover:bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>Request Bulk Drive Proposal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* 4 Pillars of SoftLab Vendor Empanelment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero Upfront Sourcing Cost</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                No retainer fees, registration charges, or hidden advances. You only pay after a candidate is interviewed, selected, and joins your company.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <FileCheck2 className="w-4 h-4" />
                <span>Automated GST Tax Invoicing</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Instantly upon candidate joining, our CRM generates an official GST tax invoice (SAC 998512) and dispatches it via email and WhatsApp with 30-day payment terms.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Up to 90 Days Free Replacement</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                If a placed candidate leaves or does not clear probation within 90 days, we furnish a qualified replacement candidate at zero extra charge.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Clock className="w-4 h-4" />
                <span>48-Hour Shortlist Turnaround</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Receive pre-screened resumes with live GitHub pull-request links, coding test percentiles, and interview slots within two business days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4 RECRUITMENT MODELS                                                  */}
      {/* ===================================================================== */}
      <section id="hiring-models" className="py-16 sm:py-24 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Flexible Hiring Framework</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Choose the Recruitment Model that Fits Your Scale
            </h2>
            <p className="text-sm text-slate-400">
              Whether you need to fill 2 critical senior roles or onboard a cohort of 50 associate software engineers, SoftLab Global customizes the entire drive for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Model 1 */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-cyan-500/40 transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black">
                01
              </div>
              <h3 className="text-base font-bold text-white">Direct Lateral &amp; Fresh Hire</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instant access to our verified alumni talent pool. Get curated resumes, GitHub profiles, and video project demos within 48 hours.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Immediate Joiners (0–15 Days)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>No upfront registration fee</span>
                </li>
              </ul>
            </div>

            {/* Model 2 */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/40 transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black">
                02
              </div>
              <h3 className="text-base font-bold text-white">Exclusive Campus Drives</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated virtual or physical recruitment drive. We handle all logistics, pre-screening assessments, coding tests, and interview scheduling.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Custom Online Assessment</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Single-day offer rollout</span>
                </li>
              </ul>
            </div>

            {/* Model 3 */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-purple-500/40 transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black">
                03
              </div>
              <h3 className="text-base font-bold text-white">Hire-Train-Deploy (HTD)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lock your talent early. We customize the final 6 to 12 weeks of training specifically on your internal framework, APIs, and cloud environment.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero onboarding friction</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Company-specific Capstones</span>
                </li>
              </ul>
            </div>

            {/* Model 4 */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/40 transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
                04
              </div>
              <h3 className="text-base font-bold text-white">Mega Job Fairs &amp; Hackathons</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Participate in SoftLab Global regional job fairs and hackathons across Northern India. Review 1,000+ top engineering participants under one roof.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dedicated corporate stall</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>High employer brand visibility</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5-STAGE VETTING PIPELINE                                              */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-20 border-b border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Rigorous Quality Assurance</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              How SoftLab Vets Every Tech Candidate
            </h2>
            <p className="text-sm text-slate-400">
              Only the top 10% of candidates who complete all 5 rigorous milestones are endorsed for corporate hiring partner shortlists.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <span className="text-xs font-black text-cyan-400">STEP 1</span>
              <h4 className="text-sm font-bold text-white">Core Aptitude &amp; Logic</h4>
              <p className="text-[11px] text-slate-400">Algorithmic logic, analytical reasoning, and quantitative problem solving.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <span className="text-xs font-black text-emerald-400">STEP 2</span>
              <h4 className="text-sm font-bold text-white">Live Code Execution</h4>
              <p className="text-[11px] text-slate-400">Timed hands-on coding tests under proctored automated sandbox environments.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <span className="text-xs font-black text-purple-400">STEP 3</span>
              <h4 className="text-sm font-bold text-white">Production Capstone</h4>
              <p className="text-[11px] text-slate-400">Full-stack project deployed live with database indexing, CI/CD, and JWT auth.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <span className="text-xs font-black text-amber-400">STEP 4</span>
              <h4 className="text-sm font-bold text-white">Code Review &amp; Git</h4>
              <p className="text-[11px] text-slate-400">Senior architects audit candidate commit history, modularity, and error handling.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <span className="text-xs font-black text-pink-400">STEP 5</span>
              <h4 className="text-sm font-bold text-white">Soft Skills &amp; Culture</h4>
              <p className="text-[11px] text-slate-400">Professional corporate communication, agile sprint readiness, and presentation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* INTERACTIVE REGISTRATION & REQUIREMENT FORM                           */}
      {/* ===================================================================== */}
      <section id="post-hiring-form" className="py-16 sm:py-24 border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {submittedResult ? (
            /* SUBMISSION CONFIRMATION CARD */
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-8 sm:p-12 rounded-3xl border border-emerald-500/40 text-center space-y-6 shadow-2xl shadow-emerald-950/40 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                  REF CODE: {submittedResult.referenceCode}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Hiring Requirement Received Successfully!
                </h2>
                <p className="text-sm text-slate-300 max-w-xl mx-auto">
                  Thank you, <strong>{submittedResult.contactPerson}</strong>! Your corporate profile for <strong>{submittedResult.companyName}</strong> has been registered with the SoftLab Global Placement &amp; Corporate Relations Cell.
                </p>
              </div>

              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 max-w-lg mx-auto text-xs text-slate-300 space-y-2 text-left">
                <p className="font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Next Steps for Your Hiring Drive:</span>
                </p>
                <p>1. Our Corporate Relations Head will review your role requirements and match qualified candidates.</p>
                <p>2. You will receive pre-screened candidate portfolios via email within 24 to 48 hours.</p>
                <p>3. Direct interview slots &amp; coding tests will be scheduled at your convenience.</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <a
                  href={`https://api.whatsapp.com/send?phone=919196596975&text=${encodeURIComponent(
                    `Hello SoftLab Global Team! I have registered my company ${submittedResult.companyName} (Ref: ${submittedResult.referenceCode}) for tech talent hiring. Please connect with me.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition"
                >
                  <Phone className="w-4 h-4" />
                  <span>Connect Instantly on WhatsApp (+91 9196596975)</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSubmittedResult(null)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition"
                >
                  Submit Another Requirement
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE FORM */
            <div className="bg-slate-900/90 p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative">
              <div className="max-w-2xl mx-auto text-center space-y-2 mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Post Requirement / Onboard Company</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Corporate Recruiter Onboarding &amp; Job Posting
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Fill in your hiring specifications below. Our corporate relations team will immediately curate matching candidate profiles and coordinate interview schedules.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Company Information */}
                <div>
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>Company &amp; Organization Details</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Company / Organization Name *</label>
                      <input
                        required
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="e.g. Cognizant, Infosys, Tech Startup Pvt Ltd"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Industry Sector</label>
                      <select
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                      >
                        {INDUSTRIES_LIST.map((ind) => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Company Website URL</label>
                      <input
                        type="text"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://company.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Company Size</label>
                      <select
                        value={formData.companySize}
                        onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                      >
                        <option value="1-10">1-10 Employees (Seed / Early Stage)</option>
                        <option value="11-50">11-50 Employees (Growing Startup)</option>
                        <option value="51-200">51-200 Employees (Mid-Market)</option>
                        <option value="201-500">201-500 Employees (Scaling Enterprise)</option>
                        <option value="500+">500+ Employees (Global Enterprise)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Head Office City *</label>
                      <input
                        required
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Noida, Bengaluru, Prayagraj, Pune"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">State / Province</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="e.g. Uttar Pradesh, Karnataka, Maharashtra"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. HR / Recruiter Contact Person */}
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>Recruiter / HR Contact Details</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Contact Person Name *</label>
                      <input
                        required
                        type="text"
                        value={formData.contactPersonName}
                        onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                        placeholder="e.g. Shalini Mehta"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Designation</label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="e.g. Talent Acquisition Lead / HR Manager"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Official Work Email *</label>
                      <input
                        required
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="shalini@company.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Mobile / WhatsApp Number *</label>
                      <input
                        required
                        type="text"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Hiring Requirements & Domains */}
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span>Openings &amp; Domain Requirements</span>
                  </h4>

                  <div className="space-y-4">
                    {/* Domain Selectors */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-2">
                        Select Target Tech Domains (Click all that apply) *
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DOMAINS_LIST.map((domain) => {
                          const selected = formData.targetDomains.includes(domain.label);
                          return (
                            <button
                              key={domain.id}
                              type="button"
                              onClick={() => toggleDomain(domain.label)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                                selected
                                  ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-950/40"
                                  : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                              }`}
                            >
                              <Check className={`w-3.5 h-3.5 ${selected ? "opacity-100" : "opacity-0"}`} />
                              <span>{domain.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Specific Job Title / Role</label>
                        <input
                          type="text"
                          value={formData.jobTitle}
                          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                          placeholder="e.g. Junior Full-Stack Developer"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Estimated Openings / Vacancies</label>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={formData.openingsCount}
                          onChange={(e) => setFormData({ ...formData, openingsCount: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Expected CTC Package</label>
                        <input
                          type="text"
                          value={formData.salaryPackage}
                          onChange={(e) => setFormData({ ...formData, salaryPackage: e.target.value })}
                          placeholder="e.g. ₹5.0 - 8.0 LPA"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Hiring &amp; Empanelment Model</label>
                        <select
                          value={formData.hiringType}
                          onChange={(e) => setFormData({ ...formData, hiringType: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-semibold"
                        >
                          <option value="VENDOR_EMPANELMENT">Corporate Vendor Empanelment (8.33% - 12% CTC Fee)</option>
                          <option value="FULL_TIME">Full-Time Direct Employment</option>
                          <option value="INTERNSHIP">Paid Internship to Full-Time Conversion</option>
                          <option value="BULK_HIRING">Bulk Campus Drive (10+ Hires)</option>
                          <option value="CONTRACT">Contract / Project-Based (3-6 Months)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Work Mode</label>
                        <select
                          value={formData.workMode}
                          onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                        >
                          <option value="HYBRID">Hybrid (Office + Remote)</option>
                          <option value="ON_SITE">On-Site (Office Base)</option>
                          <option value="REMOTE">100% Fully Remote</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Job Description / Must-Have Technical Skills
                      </label>
                      <textarea
                        rows={3}
                        value={formData.jobDescription}
                        onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                        placeholder="Paste job description, specific tech stack, minimum percentage, or eligibility requirements..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit CTA */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Your company data is protected. SoftLab does not charge upfront sourcing fees.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 text-slate-950 rounded-xl font-black text-sm shadow-xl shadow-cyan-950/40 hover:from-cyan-400 hover:to-emerald-400 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {registerMutation.isPending ? (
                      <span>Transmitting Requirement...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Register &amp; Request Shortlists Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* PARTNER BRANDS & TESTIMONIALS                                         */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-20 border-b border-slate-800 bg-slate-900/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Trusted by Engineering Leaders &amp; Recruiters Across India
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75">
            <span className="text-base sm:text-lg font-black tracking-widest text-slate-400">TATA MOTORS</span>
            <span className="text-base sm:text-lg font-black tracking-widest text-slate-400">INFOSYS ALLIANCE</span>
            <span className="text-base sm:text-lg font-black tracking-widest text-slate-400">WIPRO ECOSYSTEM</span>
            <span className="text-base sm:text-lg font-black tracking-widest text-slate-400">TECH MAHINDRA</span>
            <span className="text-base sm:text-lg font-black tracking-widest text-slate-400">HCL ENTERPRISE</span>
            <span className="text-base sm:text-lg font-black tracking-widest text-slate-400">ACCEL STARTUPS</span>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* RECRUITER FAQ ACCORDION                                               */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Frequently Asked Questions</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">Recruiter FAQ</h3>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>How does Corporate Vendor Empanelment and Staffing Invoicing work?</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                SoftLab Global operates as an empaneled staffing vendor with a minimal market fee of <strong>8.33% to 12% on annual CTC</strong>. There are zero upfront charges or advance retainers. When a candidate is interviewed, selected, and joins your organization, an official GST tax invoice (SAC 998512) is generated automatically by our CRM and dispatched to your HR contact via email and WhatsApp with 30-day corporate credit payment terms and up to 90 days replacement protection.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Does SoftLab Global charge recruiters for sourcing candidates?</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                No. Standard graduate placement sourcing is 100% complimentary for verified corporate partners. We do not charge upfront sourcing fees.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>How quickly can we receive candidate shortlists?</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                Within 24 to 48 hours of submitting your job requirements, our team shares pre-screened candidate portfolios with verified GitHub repositories and test scores.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Can we conduct technical interviews on campus or virtually?</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                Both! We support 100% remote virtual drives with Google Meet / Zoom coding sandboxes, as well as physical on-campus hiring drives at our Prayagraj headquarters.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>What is the replacement guarantee if a candidate does not fit?</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                We provide a 30-day candidate replacement guarantee for all full-time corporate hires, ensuring absolute peace of mind for your engineering leadership.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
