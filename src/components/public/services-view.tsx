"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SITE_CONFIG } from "@/lib/constants/site";
import {
  WEBSITE_PACKAGES,
  SOFTWARE_TIERS,
  SOFTWARE_MODULES_LIST,
  APP_DEV_TIERS,
  APP_DEV_TECH_STACK,
  DIGITAL_MARKETING_RETAINERS,
  GRAPHICS_RETAINERS,
  INDIVIDUAL_GRAPHICS_SERVICES,
  CORPORATE_COMBO_PACKAGES,
  WEBSITE_AMC_PACKAGES,
  SOFTWARE_APP_AMC_PACKAGES,
  CLOUD_HOSTING_SERVICES,
  CORPORATE_SLA_TIERS,
  PAYMENT_STRUCTURES,
  ServicePackageItem,
} from "@/lib/constants/services-catalog";
import { openServiceDetailModal } from "@/components/public/service-detail-modal";
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
  CreditCard,
  FileCheck,
  ExternalLink,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

export function ServicesView() {
  const [activeTab, setActiveTab] = useState<string>("ALL");

  return (
    <div className="space-y-20">
      {/* 1. Category Quick Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 pb-6 border-b border-slate-800/80 sticky top-16 z-30 bg-slate-950/90 backdrop-blur-md">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === "ALL"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          All Corporate Solutions
        </button>
        <button
          onClick={() => setActiveTab("WEB_DEV")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "WEB_DEV"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Web Development</span>
        </button>
        <button
          onClick={() => setActiveTab("SOFTWARE_DEV")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "SOFTWARE_DEV"
              ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Software & ERP</span>
        </button>
        <button
          onClick={() => setActiveTab("APP_DEV")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "APP_DEV"
              ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>App Development</span>
        </button>
        <button
          onClick={() => setActiveTab("DIGITAL_MARKETING")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "DIGITAL_MARKETING"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Digital Marketing</span>
        </button>
        <button
          onClick={() => setActiveTab("GRAPHICS_DESIGN")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "GRAPHICS_DESIGN"
              ? "bg-violet-500 text-slate-950 shadow-md shadow-violet-500/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Graphics & Branding</span>
        </button>
      </div>

      {/* 2. Primary 5 Corporate Segments (Clickable Cards with Rich Modals) */}
      <div className="space-y-16">
        {/* SEGMENT 01: WEBSITE DEVELOPMENT */}
        {(activeTab === "ALL" || activeTab === "WEB_DEV") && (
          <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 p-6 sm:p-8 shadow-xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/20 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm shrink-0">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">01</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border text-emerald-400 bg-emerald-950/80 border-emerald-800">
                        High-Performance Modern Web Engineering
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Website Development
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-semibold hidden md:inline">
                    💡 Click any package for full deliverables & payment structure
                  </span>
                  <Button
                    asChild
                    size="sm"
                    className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-4 rounded-xl shrink-0"
                  >
                    <a href="#service-enquiry-section">Request Quote</a>
                  </Button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                From high-converting startup business websites to enterprise portals and scalable e-commerce systems, we engineer web presences with sub-second speeds, robust security, and seamless mobile responsiveness.
              </p>

              {/* Clickable Web Packages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {WEBSITE_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => openServiceDetailModal(pkg)}
                    className="cursor-pointer p-5 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-emerald-500/60 hover:bg-slate-950 hover:shadow-lg hover:shadow-emerald-950/40 transition-all space-y-3 relative group/card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                          {pkg.timeline || "Fast Delivery"}
                        </span>
                        <h4 className="text-base font-black text-white group-hover/card:text-emerald-300 transition-colors">
                          {pkg.title}
                        </h4>
                      </div>
                      <span className="text-xs font-black text-white px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/80 font-mono">
                        {pkg.pricingDisplay}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {pkg.idealFor}
                    </p>

                    <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-[11px] text-slate-300">
                      {pkg.deliverables.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                      <div className="text-[10px] text-slate-500 pt-0.5">
                        + {pkg.deliverables.length - 3} more deliverables
                      </div>
                    </div>

                    {/* Milestone pill footer */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 group-hover/card:underline">
                        <span>View Scope & Payment Terms</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover/card:translate-x-0.5 transition-transform" />
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        40/30/20/10 Milestones
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SEGMENT 02: SOFTWARE DEVELOPMENT */}
        {(activeTab === "ALL" || activeTab === "SOFTWARE_DEV") && (
          <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 p-6 sm:p-8 shadow-xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-sm shrink-0">
                    <Code className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">02</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border text-cyan-400 bg-cyan-950/80 border-cyan-800">
                        Custom Business Systems & Cloud Automation
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Software Development
                    </h3>
                  </div>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-xs h-9 px-4 rounded-xl shrink-0"
                >
                  <a href="#service-enquiry-section">Request Software Architecture</a>
                </Button>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                Automate complex business processes, eliminate repetitive operational friction, and scale effortlessly with tailored software architectures built specifically for your institutional needs.
              </p>

              {/* Clickable Software Tiers */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {SOFTWARE_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => openServiceDetailModal(tier)}
                    className="cursor-pointer p-5 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-cyan-500/60 hover:bg-slate-950 hover:shadow-lg hover:shadow-cyan-950/40 transition-all space-y-3 relative group/card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                          {tier.timeline || "Agile Sprints"}
                        </span>
                        <h4 className="text-base font-black text-white group-hover/card:text-cyan-300 transition-colors">
                          {tier.title}
                        </h4>
                      </div>
                      <span className="text-xs font-black text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/80 font-mono text-right">
                        {tier.pricingDisplay}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {tier.idealFor}
                    </p>

                    <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-[11px] text-slate-300">
                      {tier.deliverables.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-cyan-400 font-semibold flex items-center gap-1 group-hover/card:underline">
                        <span>Inspect Deliverables</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover/card:translate-x-0.5 transition-transform" />
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        4-Milestone Escrow
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Available Enterprise Modules Interactive Tray */}
              <div className="mt-6 p-5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Available Ready Modules & Integrations (21 Enterprise Modules)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Mix & Match Any Architecture
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {SOFTWARE_MODULES_LIST.map((mod, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-200"
                    >
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{mod}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEGMENT 03: APPLICATION DEVELOPMENT */}
        {(activeTab === "ALL" || activeTab === "APP_DEV") && (
          <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 p-6 sm:p-8 shadow-xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-teal-500/20 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shadow-sm shrink-0">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">03</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border text-teal-400 bg-teal-950/80 border-teal-800">
                        Native & Cross-Platform Mobile Solutions
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Application Development
                    </h3>
                  </div>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="bg-teal-600/90 hover:bg-teal-500 text-white font-bold text-xs h-9 px-4 rounded-xl shrink-0"
                >
                  <a href="#service-enquiry-section">Launch Mobile App</a>
                </Button>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                Deliver fluid, responsive, 60fps mobile experiences for millions of users. We develop, test, and publish iOS and Android applications built to Apple App Store and Google Play guidelines.
              </p>

              {/* Clickable App Tiers */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {APP_DEV_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => openServiceDetailModal(tier)}
                    className="cursor-pointer p-5 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-teal-500/60 hover:bg-slate-950 hover:shadow-lg hover:shadow-teal-950/40 transition-all space-y-3 relative group/card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold">
                          {tier.timeline || "Mobile Sprints"}
                        </span>
                        <h4 className="text-base font-black text-white group-hover/card:text-teal-300 transition-colors">
                          {tier.title}
                        </h4>
                      </div>
                      <span className="text-xs font-black text-teal-300 px-2.5 py-1 rounded-lg bg-teal-950/80 border border-teal-800/80 font-mono text-right">
                        {tier.pricingDisplay}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {tier.idealFor}
                    </p>

                    <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-[11px] text-slate-300">
                      {tier.deliverables.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-teal-400 font-semibold flex items-center gap-1 group-hover/card:underline">
                        <span>View Play/App Store Scope</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover/card:translate-x-0.5 transition-transform" />
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        40/30/20/10 Milestones
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Tech Stack Bar */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800/90 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {APP_DEV_TECH_STACK.map((stack) => (
                  <div key={stack.name} className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-teal-400 block font-mono">
                      {stack.name}
                    </span>
                    <p className="text-[11px] text-slate-300">
                      {stack.items.join(" • ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SEGMENT 04: DIGITAL MARKETING RETAINERS */}
        {(activeTab === "ALL" || activeTab === "DIGITAL_MARKETING") && (
          <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 p-6 sm:p-8 shadow-xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-sm shrink-0">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">04</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border text-amber-400 bg-amber-950/80 border-amber-800">
                        Performance-Driven Acquisition & Brand Growth
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Digital Marketing Retainers
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-400 font-semibold hidden md:inline">
                    🎯 10% Savings on Upfront Annual Retainers
                  </span>
                  <Button
                    asChild
                    size="sm"
                    className="bg-amber-600/90 hover:bg-amber-500 text-white font-bold text-xs h-9 px-4 rounded-xl shrink-0"
                  >
                    <a href="#service-enquiry-section">Book Marketing Sprint</a>
                  </Button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                Transform digital touchpoints into consistent revenue drivers. Our performance squads run targeted PPC, high-intent Meta campaigns, SEO ranking sprints, and automated WhatsApp nurturing funnels.
              </p>

              {/* Clickable Marketing Retainers */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {DIGITAL_MARKETING_RETAINERS.map((ret) => (
                  <div
                    key={ret.id}
                    onClick={() => openServiceDetailModal(ret)}
                    className="cursor-pointer p-5 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-amber-500/60 hover:bg-slate-950 hover:shadow-lg hover:shadow-amber-950/40 transition-all space-y-3 relative group/card flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                          {ret.badge || "Growth Retainer"}
                        </span>
                        {ret.isPopular && (
                          <span className="text-[9px] font-black uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                            Popular
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-black text-white group-hover/card:text-amber-300 transition-colors">
                        {ret.title}
                      </h4>

                      <div className="border-b border-slate-800/80 pb-2">
                        <span className="text-lg font-black text-amber-300 block">
                          {ret.pricingDisplay}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {ret.priceNote}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1 text-[11px] text-slate-300">
                        {ret.deliverables.slice(0, 4).map((del, idx) => (
                          <div key={idx} className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{del}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-amber-400 font-semibold flex items-center gap-1 group-hover/card:underline">
                        <span>View Scope Details</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover/card:translate-x-0.5 transition-transform" />
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        100% Adv. Mo.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SEGMENT 05: GRAPHICS & CREATIVE DESIGN */}
        {(activeTab === "ALL" || activeTab === "GRAPHICS_DESIGN") && (
          <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 p-6 sm:p-8 shadow-xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 shadow-sm shrink-0">
                    <Palette className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">05</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border text-violet-400 bg-violet-950/80 border-violet-800">
                        Corporate Visual Identity & High-Impact Collateral
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Graphics & Creative Design
                    </h3>
                  </div>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="bg-violet-600/90 hover:bg-violet-500 text-white font-bold text-xs h-9 px-4 rounded-xl shrink-0"
                >
                  <a href="#service-enquiry-section">Request Design Kit</a>
                </Button>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                Create unforgettable first impressions with bespoke vector identities, luxury brand guidelines, engaging social creatives, and print-ready commercial packaging designed by senior artists.
              </p>

              {/* Monthly Retainers (3 Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {GRAPHICS_RETAINERS.map((ret) => (
                  <div
                    key={ret.id}
                    onClick={() => openServiceDetailModal(ret)}
                    className="cursor-pointer p-5 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-violet-500/60 hover:bg-slate-950 hover:shadow-lg hover:shadow-violet-950/40 transition-all space-y-3 relative group/card flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">
                          Monthly Studio Retainer
                        </span>
                        {ret.isPopular && (
                          <span className="text-[9px] font-black uppercase bg-violet-500 text-white px-2 py-0.5 rounded">
                            Best Value
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-black text-white group-hover/card:text-violet-300 transition-colors">
                        {ret.title}
                      </h4>

                      <div className="border-b border-slate-800/80 pb-2">
                        <span className="text-xl font-black text-violet-300 block font-mono">
                          {ret.pricingDisplay}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1 text-[11px] text-slate-300">
                        {ret.deliverables.map((del, idx) => (
                          <div key={idx} className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            <span className="truncate">{del}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-violet-400 font-semibold flex items-center gap-1 group-hover/card:underline">
                        <span>View Creative Terms</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover/card:translate-x-0.5 transition-transform" />
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Advance Billing
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Individual Graphics Services Price List (14 Items) */}
              <div className="mt-6 rounded-2xl bg-slate-950 border border-slate-800/90 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <span>Individual Graphics & Branding Price List (A-la-carte)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Need standalone design deliverables without a monthly retainer? Select any item below.
                    </p>
                  </div>
                  <Badge className="bg-violet-950 text-violet-300 border-violet-800 text-[10px] shrink-0">
                    GST 18% Exclusive
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {INDIVIDUAL_GRAPHICS_SERVICES.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() =>
                        openServiceDetailModal({
                          id: `gfx-item-${idx}`,
                          categoryCode: "GRAPHICS_DESIGN",
                          categoryName: "Graphics Design (A-la-carte)",
                          title: item.service,
                          tagline: `Single Project Turnaround: ${item.timeline}`,
                          pricingDisplay: `${item.price} + GST`,
                          billingType: "ONE_TIME",
                          timeline: item.timeline,
                          idealFor: "Businesses requiring direct, standalone creative collateral.",
                          deliverables: [
                            item.deliverable,
                            "High-resolution print & web files",
                            "Commercial copyright ownership transferred to client",
                            "Full color codes & font details included",
                          ],
                          paymentStructure: PAYMENT_STRUCTURES.PROJECT_WORK,
                        })
                      }
                      className="cursor-pointer p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-violet-500/60 hover:bg-slate-900 transition-all flex items-center justify-between gap-2 text-xs group/item"
                    >
                      <div className="truncate">
                        <span className="font-bold text-white block truncate group-hover/item:text-violet-300 transition-colors">
                          {item.service}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.deliverable} • Turnaround: {item.timeline}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-violet-300 text-right shrink-0 px-2 py-1 rounded bg-slate-950 border border-slate-800">
                        {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Corporate Retainer & Dedicated Partner Packages (Clickable) */}
      <div className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-3 py-1 rounded-full border border-teal-800">
            Commercial Growth Retainers
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Corporate Retainer & Dedicated Partner Packages
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Click any package below to inspect the full team allocation, scope breakdown, delivery SLAs, and monthly payment milestone structure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CORPORATE_COMBO_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => openServiceDetailModal(pkg)}
              className={`cursor-pointer rounded-3xl p-6 flex flex-col justify-between border transition-all relative group/combo ${
                pkg.isPopular
                  ? "bg-gradient-to-b from-slate-900 to-emerald-950/40 border-emerald-500/80 shadow-2xl shadow-emerald-950/50 hover:border-emerald-400"
                  : "bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-xl"
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                  Most Popular Choice
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {pkg.idealFor}
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5 group-hover/combo:text-emerald-300 transition-colors">
                    {pkg.title}
                  </h3>
                </div>

                <div className="border-b border-slate-800 pb-3">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {pkg.pricingDisplay.replace(" + GST", "")}
                  </span>
                  {pkg.priceNote && (
                    <span className="text-[11px] text-emerald-400 block mt-0.5">
                      {pkg.priceNote}
                    </span>
                  )}
                </div>

                <ul className="space-y-2 text-xs text-slate-300">
                  {pkg.deliverables.slice(0, 5).map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-5 border-t border-slate-800/80 mt-4">
                <Button
                  type="button"
                  size="sm"
                  className={`w-full text-xs font-bold h-10 rounded-xl flex items-center justify-center gap-1.5 ${
                    pkg.isPopular
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  }`}
                >
                  <span>Inspect & Select</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Infrastructure, Website AMC & Cloud Hosting (Clickable) */}
      <div className="space-y-6 pt-4">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800">
            Infrastructure & Maintenance
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Website AMC, Software Support & Cloud Hosting
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Guaranteed continuity, fast disaster recovery, and continuous security patching for critical business software.
          </p>
        </div>

        {/* Website AMC Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WEBSITE_AMC_PACKAGES.map((amc) => (
            <div
              key={amc.id}
              onClick={() => openServiceDetailModal(amc)}
              className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 shadow-lg hover:border-emerald-500/50 hover:bg-slate-900 transition-all group/amc flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    {amc.badge || "Annual AMC"}
                  </span>
                  <span className="text-xs font-bold font-mono text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {amc.pricingDisplay}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover/amc:text-emerald-300 transition-colors">
                  {amc.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {amc.idealFor}
                </p>

                <div className="space-y-1 pt-1 text-[11px] text-slate-300">
                  {amc.deliverables.slice(0, 3).map((del, idx) => (
                    <div key={idx} className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{del}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 font-semibold flex items-center justify-between">
                <span>View SLA & Scope</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Cloud, Hosting & Domain Pricing Table */}
        <div className="mt-8 rounded-3xl bg-slate-900/90 border border-slate-800/90 p-6 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-cyan-400" />
                <span>Cloud Infrastructure, Domain & Hosting Services</span>
              </h3>
              <p className="text-xs text-slate-400">
                Enterprise cloud hosting powered by AWS, DigitalOcean and high-speed NVMe servers.
              </p>
            </div>
            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-3 py-1 rounded-full shrink-0">
              99.9% Uptime Guarantee
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CLOUD_HOSTING_SERVICES.map((cloud, idx) => (
              <div
                key={idx}
                onClick={() =>
                  openServiceDetailModal({
                    id: `cloud-${idx}`,
                    categoryCode: "AMC_SUPPORT",
                    categoryName: "Cloud & Infrastructure",
                    title: cloud.service,
                    tagline: cloud.desc,
                    pricingDisplay: cloud.price,
                    billingType: cloud.period.includes("Month") ? "MONTHLY" : "ANNUAL",
                    idealFor: "Enterprises, startups, and institutions demanding zero-downtime server operations.",
                    deliverables: [
                      cloud.desc,
                      "Full DNS configuration and automated SSL lifecycle",
                      "24/7 telemetry monitoring & DDoS protection",
                      "Official GST tax invoice provided",
                    ],
                    paymentStructure: PAYMENT_STRUCTURES.DIRECT_SUBSCRIPTION,
                  })
                }
                className="cursor-pointer p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-950 transition-all space-y-1.5 group/cloud"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-cyan-400 font-mono">
                    {cloud.period}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover/cloud:text-cyan-400 transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover/cloud:text-cyan-300 transition-colors">
                  {cloud.service}
                </h4>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {cloud.desc}
                </p>
                <span className="text-xs font-black text-cyan-300 block font-mono pt-1">
                  {cloud.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. DEDICATED SECTION: Corporate Payment Milestones & SLA Structure */}
      <div className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 p-6 sm:p-10 shadow-2xl space-y-8">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-600/60 text-emerald-300 text-xs font-semibold">
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Commercial Transparency</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Corporate Payment Milestone Structure & Commercial Terms
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            SoftLab Global enforces strict, deliverable-linked payment stages. Clients never pay for incomplete work.
          </p>
        </div>

        {/* 3 Payment Frameworks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Framework 1: Project-Based Work */}
          <div className="rounded-2xl bg-slate-950/90 border border-emerald-500/30 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">
                  Web, Software & Apps
                </span>
                <h3 className="text-base font-bold text-white">
                  Project-Based Milestones
                </h3>
              </div>
              <span className="text-xs font-black font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                4-Stage Escrow
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400 font-mono">40% Advance</span>
                  <span className="text-[10px] text-slate-500">Stage 01</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Upon project confirmation, architecture lock & kickoff.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400 font-mono">30% Milestone</span>
                  <span className="text-[10px] text-slate-500">Stage 02</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Upon Figma UI/UX prototype approval & core architecture demo.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400 font-mono">20% Milestone</span>
                  <span className="text-[10px] text-slate-500">Stage 03</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Upon UAT staging deployment, functional feature testing & client demo.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400 font-mono">10% Final Go-Live</span>
                  <span className="text-[10px] text-slate-500">Stage 04</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Upon final production deployment, source code handover & go-live.
                </p>
              </div>
            </div>
          </div>

          {/* Framework 2: Monthly Retainers */}
          <div className="rounded-2xl bg-slate-950/90 border border-amber-500/30 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400">
                  Marketing & Graphics
                </span>
                <h3 className="text-base font-bold text-white">
                  Monthly Retainer Sprints
                </h3>
              </div>
              <span className="text-xs font-black font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                100% Advance
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-white text-xs block">
                  100% Advance at Beginning of Billing Month
                </span>
                <p className="text-[11px] text-slate-400">
                  Invoices raised on the 1st of each month, payable within 5 working days to ensure uninterrupted squad allocation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-300 text-xs block">
                  Annual Contract Option: 10% Direct Discount
                </span>
                <p className="text-[11px] text-slate-400">
                  Clients committing to annual retainer contracts enjoy a flat 10% direct fee reduction or staged quarterly settlements.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-white text-xs block">
                  Ad Spend Budgets (Google/Meta)
                </span>
                <p className="text-[11px] text-slate-400">
                  Paid directly by the client to Google / Meta Ads Manager or billed at actuals with zero commission markup.
                </p>
              </div>
            </div>
          </div>

          {/* Framework 3: Annual Contracts & Corporate SLAs */}
          <div className="rounded-2xl bg-slate-950/90 border border-cyan-500/30 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400">
                  AMC & Enterprise SLA
                </span>
                <h3 className="text-base font-bold text-white">
                  Annual AMC & SLAs
                </h3>
              </div>
              <span className="text-xs font-black font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                Staged / Advance
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-white text-xs block">
                  Annual Contract Payment Terms:
                </span>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4">
                  <li>50% Advance at contract signing</li>
                  <li>25% after 3 months</li>
                  <li>25% after 6 months</li>
                  <li>OR 100% upfront annual advance with maximum discount</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="font-bold text-cyan-300 text-xs block">
                  Corporate SLA Response Windows:
                </span>
                <div className="space-y-1 text-[10px] font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span>Basic SLA:</span>
                    <span className="text-white font-bold">24–48 Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Professional SLA:</span>
                    <span className="text-white font-bold">8–24 Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enterprise SLA:</span>
                    <span className="text-cyan-300 font-bold">2–8 Hours (99.9% Uptime)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Commercial Terms Bottom Banner */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>All quotes are GST exclusive (18%). Official GST Tax Invoices provided for input credit claim.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Full source code & IP ownership transferred to client upon final milestone settlement.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
