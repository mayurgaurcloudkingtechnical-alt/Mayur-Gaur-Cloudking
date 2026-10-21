import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants/site";
import { Button } from "@/components/ui/button";
import { IMS_SERVICES_LIST } from "@/lib/constants/ims-catalog";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Phone,
  ShieldCheck,
  FileText,
  HelpCircle,
  Sparkles,
  Building2,
  Award,
  Layers,
} from "lucide-react";

interface ServiceDetailPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return IMS_SERVICES_LIST.map((service) => ({
    slug: service.slug,
  }));
}

export function generateMetadata({ params }: ServiceDetailPageProps): Metadata {
  const service = IMS_SERVICES_LIST.find((s) => s.slug === params.slug);
  if (!service) {
    return {
      title: "IT Infrastructure & Managed Services | SoftLab Global",
    };
  }

  return {
    title: `${service.title} — SoftLab Global IMS Division`,
    description: service.shortDescription,
  };
}

export default function ImsServiceDetailPage({ params }: ServiceDetailPageProps) {
  const service = IMS_SERVICES_LIST.find((s) => s.slug === params.slug);

  if (!service) {
    notFound();
  }

  const otherServices = IMS_SERVICES_LIST.filter((s) => s.slug !== service.slug);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#030914] via-[#071626] to-[#040914] py-14 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[650px] h-[320px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/services#ims-infrastructure-section"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-emerald-400 transition-colors bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Services</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>IMS Division • Service #{service.number} • {service.badge}</span>
            </div>
          </div>

          <div className="max-w-4xl space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {service.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {service.overview}
            </p>
          </div>

          {/* Primary CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm h-11 px-7 rounded-xl shadow-lg shadow-emerald-950/60"
            >
              <Link
                href={`/services/request-quote?service=${service.slug}`}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span>Request a Quote</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white text-xs sm:text-sm h-11 px-6 rounded-xl"
            >
              <a href={`tel:${SITE_CONFIG.contact.phoneTel}`} className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400" />
                <span>Speak to Infrastructure Engineer</span>
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Core Inclusions, Deliverables & Benefits */}
      <section className="py-14 sm:py-20 bg-slate-950 border-b border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 Cols: Detailed Scope & Inclusions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="border-b border-slate-800 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Complete Technical Scope
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    What&apos;s Included in {service.title}
                  </h2>
                </div>

                <ul className="space-y-3.5 text-xs sm:text-sm text-slate-200">
                  {service.inclusions.map((inc, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{inc}</span>
                    </li>
                  ))}
                </ul>

                {/* Key Service Highlights */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Core Service Pillars
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {service.cardBullets.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-emerald-300 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Key Benefits, Ideal For & Deliverables */}
            <div className="lg:col-span-5 space-y-6">
              {/* Benefits Card */}
              <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-black text-white">
                    Key Operational Benefits
                  </h3>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {service.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ideal For Card */}
              <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-black text-white">
                    Industries &amp; Institutions Served
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {service.idealFor.map((sector, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{sector}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deliverables Card */}
              <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-emerald-950/30 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-black text-white">
                    Project Handover Deliverables
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-slate-200">
                  {service.deliverables.map((del, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{del}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2">
                  <Button
                    asChild
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 rounded-xl"
                  >
                    <Link href={`/services/request-quote?service=${service.slug}`}>
                      Configure Requirement &amp; Get Itemized BOQ
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Frequently Asked Questions (FAQs) */}
      <section className="py-14 sm:py-18 bg-slate-950 border-b border-slate-800/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Technical &amp; Commercial FAQs</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Frequently Asked Questions — {service.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2"
              >
                <h3 className="text-sm font-bold text-white flex items-start gap-2">
                  <span className="text-emerald-400 font-mono">Q{idx + 1}.</span>
                  <span>{faq.question}</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed pl-6">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Explore Other IMS Services */}
      <section className="py-14 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Other IT Infrastructure &amp; Managed Services
              </h2>
              <p className="text-xs text-slate-400">
                Combine multiple services in a single requirement quote for unified project execution.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs font-bold h-9 rounded-xl"
            >
              <Link href="/services/request-quote">Request Multi-Service Quote</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherServices.slice(0, 4).map((other) => (
              <Link
                key={other.id}
                href={`/services/${other.slug}`}
                className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-emerald-500/50 hover:bg-slate-900 transition-all space-y-2 group"
              >
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  IMS • {other.number}
                </span>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {other.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {other.shortDescription}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
