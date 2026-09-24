import * as React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Compass,
  Target,
  Shield,
  Lightbulb,
  CheckCircle2,
  MapPin,
  Building,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — SOFTLAB GLOBAL",
  description:
    "Learn about SOFTLAB GLOBAL's mission, pedagogical philosophy, practical IT curriculum, and technology campus in Civil Lines, Prayagraj.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* 1. Header Banner */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#030914] via-[#071626] to-[#040914] py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[650px] h-[350px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-10 w-[500px] h-[500px] bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-3xl z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>About Our Institution • Excellence in Tech</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Transforming Engineering Education with{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Real Production Standards
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            SOFTLAB GLOBAL is an advanced IT education institution headquartered in Prayagraj, Uttar Pradesh. We engineer career-accelerating learning environments for aspiring developers, data scientists, and cloud professionals.
          </p>
        </div>
      </section>

      {/* 2. Mission & Vision */}
      <section className="py-16 bg-slate-950 border-b border-slate-800/80 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 space-y-4 shadow-xl hover:border-emerald-500/50 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Our Mission</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                To democratize enterprise-grade software engineering education by delivering practical, industry-aligned curricula, direct mentor guidance, and rigorous code reviews that empower students to build real software systems with confidence.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 space-y-4 shadow-xl hover:border-teal-500/50 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Compass className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Our Vision</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                To establish a premier regional center for technical excellence in Uttar Pradesh that consistently produces job-ready software craftspeople recognized for strong fundamentals, architectural discipline, and problem-solving velocity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Pedagogical Methodology */}
      <section className="py-16 bg-[#040813] border-b border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
              Learning Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3">
              How We Teach: The Hands-On Approach
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              We eliminate passive video watching in favor of active system construction. Every module is structured around tangible deliverables:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Architectural Grounding",
                desc: "Understand system constraints, database schemas, and networking flow before writing lines of code.",
              },
              {
                step: "02",
                title: "Interactive Coding Labs",
                desc: "Live, guided coding sessions solving algorithmic challenges and engineering modular full-stack features.",
              },
              {
                step: "03",
                title: "Peer & Mentor Code Reviews",
                desc: "Every assignment is scrutinized for readability, testability, security, and runtime complexity.",
              },
              {
                step: "04",
                title: "Production Deployment",
                desc: "Learn to containerize with Docker, configure CI/CD pipelines, and deploy on modern cloud infrastructure.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all space-y-2.5 shadow-lg">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
                  Phase {item.step}
                </span>
                <h3 className="text-base font-bold text-white pt-1">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Core Institutional Values */}
      <section className="py-16 bg-slate-950 border-b border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
              Guiding Principles
            </span>
            <p className="text-2xl sm:text-4xl font-extrabold text-white mt-3">
              Our Core Values
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-3.5 shadow-xl hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white text-base">Academic Integrity</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We believe in transparent educational outcomes. We do not sell shortcuts, unverified promises, or rote certifications. Genuine engineering capability is built through deliberate effort.
              </p>
            </div>

            <div className="p-7 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-3.5 shadow-xl hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                <Lightbulb className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white text-base">Curricular Currency</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our syllabus evolves continuously to match the engineering stacks currently demanded by modern technology organizations, including TypeScript, Next.js, and cloud ecosystems.
              </p>
            </div>

            <div className="p-7 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-3.5 shadow-xl hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white text-base">Student-Centric Support</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Small batch sizes ensure no learner falls behind. Faculty, academic counselors, and teaching assistants maintain dedicated office hours for doubt resolution and project reviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Faculty & Mentors Callout */}
      <section className="py-16 bg-gradient-to-r from-[#030a16] via-[#061528] to-[#040c1a] border-b border-slate-800/80 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                Academic Leadership
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Mentorship by Practicing Software Engineers
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Led by Mr. Mayur Gaur (11+ years of experience in leadership, enterprise technology & entrepreneurship, covering all 21 technology programs) and Mr. Nihal Singh (specializing in Linux, Cloud, Networking & Cyber Security), our faculty guides every student from first line of code to corporate placement.
              </p>
            </div>

            <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shrink-0 h-12 px-6 rounded-xl shadow-lg shadow-emerald-500/20">
              <Link href="/trainers" className="flex items-center gap-2">
                <span>Meet Our Faculty & Staff</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 6. Campus Location Card */}
      <section className="py-16 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                <Building className="h-3.5 w-3.5" />
                <span>Prayagraj Headquarters</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Visit Our Campus in Civil Lines</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                Experience our workstation labs and consult directly with our academic faculty. Located opposite Rai and Company, Tashkent Marg, Patrika Chauraha.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold h-10 px-5 rounded-xl shadow-md">
                <Link href="/contact">Campus Details & Directions</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-800 h-10 px-5 rounded-xl">
                <Link href="/courses">View Programs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
