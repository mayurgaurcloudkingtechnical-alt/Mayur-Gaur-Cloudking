import * as React from "react";
import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants/site";
import { Button } from "@/components/ui/button";
import { ServiceEnquiryForm } from "@/components/public/service-enquiry-form";
import { ServicesView } from "@/components/public/services-view";
import {
  ShieldCheck,
  Clock,
  Zap,
  Phone,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SoftLab Global Services | IT, Software, Applications & Digital Solutions",
  description:
    "Corporate IT, software, application development, digital marketing and creative solutions by SoftLab Global. Your complete technology and creative partner in Prayagraj and NCR.",
};

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

      {/* 2. Interactive Corporate Services Catalog & Milestone Breakdown */}
      <section className="py-14 sm:py-20 bg-slate-950 relative border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <ServicesView />
        </div>
      </section>

      {/* 3. Consultation CTA Banner */}
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

      {/* 4. Service Enquiry Form Section */}
      <section className="py-16 sm:py-24 bg-slate-950 relative">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ServiceEnquiryForm />
        </div>
      </section>
    </div>
  );
}
