import * as React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { ContentStatus } from "@prisma/client";
import { SITE_CONFIG } from "@/lib/constants/site";
import { CourseCard } from "@/components/public/course-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Code,
  Terminal,
  Cpu,
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  Compass,
  Briefcase,
  MapPin,
  Phone,
  GraduationCap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SOFTLAB GLOBAL — Enterprise IT Education & Technology Training",
  description:
    "Master high-demand software engineering, cloud computing, and advanced computing stacks with production-grade curriculum in Prayagraj.",
};

export default async function HomePage() {
  // Query real published courses from PostgreSQL
  const featuredCourses = await db.course.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
    orderBy: {
      sortOrder: "asc",
    },
    take: 3,
  });

  return (
    <div className="flex flex-col">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-white py-16 sm:py-24 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Civil Lines, Prayagraj Campus • Admissions Open</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15]">
              Master Modern Software Engineering & Cloud Stacks
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Production-grade curriculum, deep architectural rigor, and hands-on coding labs designed to transform learners into proficient software engineers.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-sm h-12 px-6">
                <Link href="/courses" className="flex items-center gap-2">
                  <span>Explore Courses</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:border-emerald-600 hover:text-emerald-700 text-sm h-12 px-6">
                <Link href="/contact">Visit Campus / Contact</Link>
              </Button>

              <Button asChild variant="ghost" size="lg" className="text-slate-600 hover:text-slate-900 text-sm h-12 px-4">
                <Link href="/login" className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  <span>Student Portal</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST & VALUE PILLARS */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              The SOFTLAB Advantage
            </h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Engineered for Practical Software Mastery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SITE_CONFIG.trustPillars.map((pillar, index) => {
              const icons = [Terminal, Cpu, Users, Compass];
              const Icon = icons[index % icons.length];

              return (
                <Card key={pillar.title} className="border-slate-200 bg-white hover:border-emerald-300 transition-colors">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{pillar.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{pillar.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. FEATURED PUBLISHED COURSES */}
      <section className="py-16 bg-slate-50/60 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Curriculum Offerings
              </h2>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Featured Programs
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Verified institutional courses open for upcoming cohort enrollment.
              </p>
            </div>

            <Button asChild variant="outline" size="sm" className="border-slate-300 self-start sm:self-auto">
              <Link href="/courses" className="flex items-center gap-1.5">
                <span>View All Courses</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {featuredCourses.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <Code className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">New Cohorts Under Final Review</p>
                <p className="text-xs text-slate-500 mt-1">
                  Contact our counseling desk for immediate upcoming admissions schedule.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. WHY SOFTLAB GLOBAL */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Pedagogical Standard
                </span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                Bridging Academic Learning with Enterprise Software Standards
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Conventional IT degrees often teach outdated frameworks and theoretical paradigms. At SOFTLAB GLOBAL, curriculum is aligned directly with how modern high-growth tech companies build:
              </p>

              <div className="space-y-3 pt-2 text-xs">
                {[
                  "Clean Architecture, modular design patterns, and strict TypeScript invariance",
                  "Relational database modeling with PostgreSQL and type-safe ORMs",
                  "Containerization with Docker, CI/CD automation, and cloud deployment",
                  "Direct code reviews and architectural critiques from senior practitioners",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button asChild variant="outline" size="sm" className="border-slate-300">
                  <Link href="/about">Learn More About Our Methodology</Link>
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <Layers className="h-6 w-6 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Campus & Infrastructure</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Located centrally in Civil Lines, Prayagraj, our campus provides high-speed enterprise networking, dedicated workstation labs, and hybrid lecture halls equipped for both in-person and interactive digital instruction.
              </p>

              <div className="space-y-3 text-xs border-t border-slate-200 pt-4">
                <div className="flex items-start gap-2.5 text-slate-700">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{SITE_CONFIG.address.full}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{SITE_CONFIG.contact.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CAREER & PREPARATION FOCUS */}
      <section className="py-16 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Briefcase className="h-4 w-4" />
              <span>Career Transition & Mentorship</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Rigorous Preparation for Engineering Interviews
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We focus on cultivating true engineering competence. Our career support program equips learners with technical interview readiness, algorithmic problem-solving skills, and verifiable GitHub projects that speak for themselves.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/career">Explore Career Preparation</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-slate-300">
                <Link href="/contact">Schedule Counseling Consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
