import * as React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  Code2,
  FileText,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Phone,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Career & Placement Support — SOFTLAB GLOBAL",
  description:
    "Honest, rigorous career preparation and technical interview coaching at SOFTLAB GLOBAL in Prayagraj. Portfolio reviews, coding drills, and industry mentorship.",
};

export default function CareerPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* 1. Hero Banner */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#030914] via-[#071626] to-[#040914] py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[650px] h-[350px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-10 w-[500px] h-[500px] bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-3xl z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Professional Career Guidance • Placement Wing</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Engineering Competence Is Your{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Strongest Career Asset
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            At SOFTLAB GLOBAL, we prepare software engineers for real engineering interviews. We focus on building deep technical fundamentals, genuine codebases, and communicative clarity.
          </p>
        </div>
      </section>

      {/* 2. Honest Placement Policy Banner */}
      <section className="py-6 bg-amber-950/40 border-b border-amber-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3.5 text-xs sm:text-sm text-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-300">Our Transparency & Ethical Placement Commitment:</p>
              <p className="text-amber-200/90 leading-relaxed">
                SOFTLAB GLOBAL provides dedicated placement support, resume reviews, technical interview coaching, and employer introductions. We explicitly do <strong>not</strong> make misleading &ldquo;100% Guaranteed Placement&rdquo; claims. Hiring decisions rest solely with prospective employers based on demonstrated skill, problem-solving ability, and cultural fit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Four Pillars of Career Preparation */}
      <section className="py-16 bg-slate-950 border-b border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3.5 py-1.5 rounded-full border border-emerald-800">
              The Preparation Framework
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3">
              How We Prepare You for Tech Roles
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 space-y-3.5 hover:border-emerald-500/50 transition-all shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Resume Engineering</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Crafting ATS-friendly, metrics-driven technical resumes that accurately highlight your systems experience and production projects without generic buzzwords.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 space-y-3.5 hover:border-teal-500/50 transition-all shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <GitBranch className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">GitHub & Portfolio Curation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Structuring public repositories with clear READMEs, architecture diagrams, commit histories, and live deployed demonstrations that impress engineering managers.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 space-y-3.5 hover:border-cyan-500/50 transition-all shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Code2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Mock Technical Drills</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simulated live coding interviews covering data structures, algorithm optimization, database schema design, and asynchronous code explanation.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 space-y-3.5 hover:border-emerald-500/50 transition-all shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Interview Communication</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Behavioral interview preparation, system design articulation, and professional salary negotiation guidelines for entry and mid-level engineering positions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Target Roles */}
      <section className="py-16 bg-[#040813] border-b border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
              Career Pathways
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3">
              Roles Our Graduates Target
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Curriculum is focused on high-demand modern technology roles across startups, IT consulting firms, and product engineering teams:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "Full Stack Software Engineer",
              "Frontend Engineer (React / Next.js)",
              "Backend Developer (Node.js / PostgreSQL)",
              "Junior Cloud & DevOps Associate",
              "Data Analyst & Machine Learning Associate",
              "QA & Automation Engineer",
            ].map((role) => (
              <div
                key={role}
                className="bg-slate-900/80 p-4.5 rounded-2xl border border-slate-800 flex items-center gap-3.5 hover:border-emerald-500/50 hover:bg-slate-900 transition-all shadow-md"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-200">{role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Counseling Callout */}
      <section className="py-18 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-2xl space-y-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Plan Your Career Transition?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Speak with an academic counselor to assess your current background, identify recommended course tracks, and discuss cohort schedules.
          </p>
          <div className="pt-3 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20">
              <Link href="/contact" className="flex items-center gap-2">
                <span>Book Academic Counseling</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-800 text-xs h-11 px-6 rounded-xl">
              <Link href="/courses">View All Programs</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
