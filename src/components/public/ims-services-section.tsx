"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IMS_SERVICES_LIST, ImsServiceDefinition } from "@/lib/constants/ims-catalog";
import {
  Camera,
  Server,
  Network,
  Monitor,
  Wrench,
  HardDrive,
  Fingerprint,
  Building2,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  FileText,
  Sparkles,
} from "lucide-react";

function getServiceIcon(iconName: ImsServiceDefinition["iconName"]) {
  switch (iconName) {
    case "Camera":
      return Camera;
    case "Server":
      return Server;
    case "Network":
      return Network;
    case "Monitor":
      return Monitor;
    case "Wrench":
      return Wrench;
    case "HardDrive":
      return HardDrive;
    case "Fingerprint":
      return Fingerprint;
    case "Building2":
      return Building2;
    default:
      return Server;
  }
}

function getAccentClasses(accent: ImsServiceDefinition["accentColor"]) {
  switch (accent) {
    case "emerald":
      return {
        iconBox: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        badge: "text-emerald-400 bg-emerald-950/80 border-emerald-800",
        hoverCard: "hover:border-emerald-500/60 hover:shadow-emerald-950/40",
        titleHover: "group-hover/imscard:text-emerald-300",
        checkIcon: "text-emerald-400",
        linkText: "text-emerald-400",
        glow: "from-emerald-500/20 via-teal-500/10",
      };
    case "cyan":
      return {
        iconBox: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
        badge: "text-cyan-400 bg-cyan-950/80 border-cyan-800",
        hoverCard: "hover:border-cyan-500/60 hover:shadow-cyan-950/40",
        titleHover: "group-hover/imscard:text-cyan-300",
        checkIcon: "text-cyan-400",
        linkText: "text-cyan-400",
        glow: "from-cyan-500/20 via-blue-500/10",
      };
    case "teal":
      return {
        iconBox: "bg-teal-500/10 border-teal-500/20 text-teal-400",
        badge: "text-teal-400 bg-teal-950/80 border-teal-800",
        hoverCard: "hover:border-teal-500/60 hover:shadow-teal-950/40",
        titleHover: "group-hover/imscard:text-teal-300",
        checkIcon: "text-teal-400",
        linkText: "text-teal-400",
        glow: "from-teal-500/20 via-emerald-500/10",
      };
    case "amber":
      return {
        iconBox: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        badge: "text-amber-400 bg-amber-950/80 border-amber-800",
        hoverCard: "hover:border-amber-500/60 hover:shadow-amber-950/40",
        titleHover: "group-hover/imscard:text-amber-300",
        checkIcon: "text-amber-400",
        linkText: "text-amber-400",
        glow: "from-amber-500/20 via-orange-500/10",
      };
    case "violet":
      return {
        iconBox: "bg-violet-500/10 border-violet-500/20 text-violet-400",
        badge: "text-violet-400 bg-violet-950/80 border-violet-800",
        hoverCard: "hover:border-violet-500/60 hover:shadow-violet-950/40",
        titleHover: "group-hover/imscard:text-violet-300",
        checkIcon: "text-violet-400",
        linkText: "text-violet-400",
        glow: "from-violet-500/20 via-purple-500/10",
      };
    case "sky":
      return {
        iconBox: "bg-sky-500/10 border-sky-500/20 text-sky-400",
        badge: "text-sky-400 bg-sky-950/80 border-sky-800",
        hoverCard: "hover:border-sky-500/60 hover:shadow-sky-950/40",
        titleHover: "group-hover/imscard:text-sky-300",
        checkIcon: "text-sky-400",
        linkText: "text-sky-400",
        glow: "from-sky-500/20 via-cyan-500/10",
      };
    case "rose":
      return {
        iconBox: "bg-rose-500/10 border-rose-500/20 text-rose-400",
        badge: "text-rose-400 bg-rose-950/80 border-rose-800",
        hoverCard: "hover:border-rose-500/60 hover:shadow-rose-950/40",
        titleHover: "group-hover/imscard:text-rose-300",
        checkIcon: "text-rose-400",
        linkText: "text-rose-400",
        glow: "from-rose-500/20 via-pink-500/10",
      };
    default:
      return {
        iconBox: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
        badge: "text-indigo-400 bg-indigo-950/80 border-indigo-800",
        hoverCard: "hover:border-indigo-500/60 hover:shadow-indigo-950/40",
        titleHover: "group-hover/imscard:text-indigo-300",
        checkIcon: "text-indigo-400",
        linkText: "text-indigo-400",
        glow: "from-indigo-500/20 via-blue-500/10",
      };
  }
}

export function ImsServicesSection() {
  return (
    <section
      id="ims-infrastructure-section"
      className="py-16 sm:py-20 bg-slate-950 relative border-b border-slate-800/80"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10 space-y-10">
        {/* Section Header */}
        <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 p-6 sm:p-10 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/20 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none opacity-50" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Physical IT Turnkey Division • Hardware, Cabling, Surveillance & AMC</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                IT INFRASTRUCTURE &amp; MANAGED SERVICES
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Complete on-site hardware, networking, server room, CCTV surveillance, computer lab, and Annual Maintenance Contract (AMC) solutions delivered by SoftLab Global&apos;s infrastructure engineering squad and verified supply partners.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                asChild
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm h-11 px-6 rounded-xl shadow-lg shadow-emerald-950/60"
              >
                <Link href="/services/request-quote" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Request Itemized BOQ Quote</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* 8 IMS Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-8">
            {IMS_SERVICES_LIST.map((service) => {
              const Icon = getServiceIcon(service.iconName);
              const styles = getAccentClasses(service.accentColor);

              return (
                <div
                  key={service.id}
                  className={`p-5 rounded-2xl border border-slate-800 bg-slate-950/80 hover:bg-slate-950 hover:shadow-xl transition-all flex flex-col justify-between space-y-4 relative group/imscard overflow-hidden ${styles.hoverCard}`}
                >
                  <div
                    className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-bl ${styles.glow} to-transparent rounded-full blur-2xl pointer-events-none opacity-30 group-hover/imscard:opacity-70 transition-opacity`}
                  />

                  <div className="space-y-3 relative z-10">
                    {/* Card Top Icon & Number */}
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm shrink-0 ${styles.iconBox}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border font-mono ${styles.badge}`}
                      >
                        IMS • {service.number}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                        {service.badge}
                      </span>
                      <h3
                        className={`text-base font-black text-white mt-0.5 transition-colors ${styles.titleHover}`}
                      >
                        <Link href={`/services/${service.slug}`} className="hover:underline">
                          {service.title}
                        </Link>
                      </h3>
                    </div>

                    {/* Bullet List (Exact items required) */}
                    <ul className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                      {service.cardBullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${styles.checkIcon}`}
                          />
                          <span className="leading-snug">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
                    <Link
                      href={`/services/${service.slug}`}
                      className={`text-xs font-bold flex items-center gap-1 group-hover/imscard:underline ${styles.linkText}`}
                    >
                      <span>Explore Scope</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover/imscard:translate-x-0.5 transition-transform" />
                    </Link>

                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 rounded-lg border-slate-700 bg-slate-900 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 text-slate-200 text-[11px] font-bold"
                    >
                      <Link href={`/services/request-quote?service=${service.slug}`}>
                        Get Quote
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Trust & BOQ Highlight Bar */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Every IMS deployment includes an itemized Bill of Quantities (BOQ), on-site cable/point verification, and official GST tax invoicing.
              </span>
            </div>
            <Link
              href="/services/request-quote"
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 shrink-0"
            >
              <span>Open Multi-Service Requirement &amp; BOQ Calculator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
