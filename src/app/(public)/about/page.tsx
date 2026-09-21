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
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — SOFTLAB GLOBAL",
  description:
    "Learn about SOFTLAB GLOBAL's mission, pedagogical philosophy, practical IT curriculum, and technology campus in Civil Lines, Prayagraj.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-emerald-50/70 to-white py-14 sm:py-20 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            About Our Institution
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-4">
            Transforming Engineering Education with Real Production Standards
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
            SOFTLAB GLOBAL is an advanced IT education institution headquartered in Prayagraj, Uttar Pradesh. We engineer career-accelerating learning environments for aspiring developers, data scientists, and cloud professionals.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-slate-200 bg-emerald-50/30">
              <CardContent className="p-8 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Target className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  To democratize enterprise-grade software engineering education by delivering practical, industry-aligned curricula, direct mentor guidance, and rigorous code reviews that empower students to build real software systems with confidence.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50/50">
              <CardContent className="p-8 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Compass className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Our Vision</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  To establish a premier regional center for technical excellence in Uttar Pradesh that consistently produces job-ready software craftspeople recognized for strong fundamentals, architectural discipline, and problem-solving velocity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pedagogical Methodology */}
      <section className="py-16 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Learning Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              How We Teach: The Hands-On Approach
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
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
              <div key={item.step} className="bg-white p-6 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Phase {item.step}
                </span>
                <h3 className="text-base font-bold text-slate-900 pt-1">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Institutional Values */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Guiding Principles
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Our Core Values
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-3">
              <Shield className="h-6 w-6 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Academic Integrity</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We believe in transparent educational outcomes. We do not sell shortcuts, unverified promises, or rote certifications. Genuine engineering capability is built through deliberate effort.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-3">
              <Lightbulb className="h-6 w-6 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Curricular Currency</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our syllabus evolves continuously to match the engineering stacks currently demanded by modern technology organizations, including TypeScript, Next.js, and cloud ecosystems.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-3">
              <GraduationCap className="h-6 w-6 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Student-Centric Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Small batch sizes ensure no learner falls behind. Faculty, academic counselors, and teaching assistants maintain dedicated office hours for doubt resolution and project reviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Faculty & Mentors Callout */}
      <section className="py-14 bg-gradient-to-r from-slate-900 to-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Academic Leadership
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Mentorship by Practicing Software Engineers
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Meet our full-time technical faculty, certified cloud instructors, and admissions counselors who guide every student from first line of code to corporate placement.
              </p>
            </div>

            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 h-11 px-6 rounded-xl shadow-lg shadow-emerald-950">
              <Link href="/trainers" className="flex items-center gap-2">
                <span>Meet Our Faculty & Staff</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Campus Location Card */}
      <section className="py-16 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Building className="h-4 w-4" />
                <span>Prayagraj Headquarters</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Visit Our Campus in Civil Lines</h3>
              <p className="text-xs text-slate-600 max-w-xl">
                Experience our workstation labs and consult directly with our academic faculty. Located opposite Rai and Company, Tashkent Marg, Patrika Chauraha.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/contact">Campus Details & Directions</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-slate-300">
                <Link href="/courses">View Programs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
