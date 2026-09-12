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
} from "lucide-react";

export const metadata: Metadata = {
  title: "Career & Placement Support — SOFTLAB GLOBAL",
  description:
    "Honest, rigorous career preparation and technical interview coaching at SOFTLAB GLOBAL in Prayagraj. Portfolio reviews, coding drills, and industry mentorship.",
};

export default function CareerPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-emerald-50/70 to-white py-14 sm:py-20 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Professional Career Guidance
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-4">
            Engineering Competence Is Your Strongest Career Asset
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
            At SOFTLAB GLOBAL, we prepare software engineers for real engineering interviews. We focus on building deep technical fundamentals, genuine codebases, and communicative clarity.
          </p>
        </div>
      </section>

      {/* Honest Placement Policy Banner */}
      <section className="py-6 bg-amber-50/70 border-b border-amber-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3 text-xs sm:text-sm text-amber-900">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Our Transparency & Ethical Placement Commitment:</p>
              <p className="text-amber-800 leading-relaxed">
                SOFTLAB GLOBAL provides dedicated placement support, resume reviews, technical interview coaching, and employer introductions. We explicitly do <strong>not</strong> make misleading &ldquo;100% Guaranteed Placement&rdquo; claims. Hiring decisions rest solely with prospective employers based on demonstrated skill, problem-solving ability, and cultural fit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Four Pillars of Career Preparation */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              The Preparation Framework
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              How We Prepare You for Tech Roles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-slate-200 bg-white hover:border-emerald-300 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Resume Engineering</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Crafting ATS-friendly, metrics-driven technical resumes that accurately highlight your systems experience and production projects without generic buzzwords.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white hover:border-emerald-300 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <GitBranch className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">GitHub & Portfolio Curation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Structuring public repositories with clear READMEs, architecture diagrams, commit histories, and live deployed demonstrations that impress engineering managers.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white hover:border-emerald-300 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Code2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Mock Technical Drills</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Simulated live coding interviews covering data structures, algorithm optimization, database schema design, and asynchronous code explanation.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white hover:border-emerald-300 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Interview Communication</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Behavioral interview preparation, system design articulation, and professional salary negotiation guidelines for entry and mid-level engineering positions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Target Roles */}
      <section className="py-16 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Career Pathways
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Roles Our Graduates Target
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
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
                className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-slate-800">{role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Counseling Callout */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-2xl space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            Ready to Plan Your Career Transition?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Speak with an academic counselor to assess your current background, identify recommended course tracks, and discuss cohort schedules.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href="/contact" className="flex items-center gap-1.5">
                <span>Book Academic Counseling</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-slate-300">
              <Link href="/courses">View All Programs</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
