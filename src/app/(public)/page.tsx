import * as React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { ContentStatus } from "@prisma/client";
import { SITE_CONFIG } from "@/lib/constants/site";
import { CourseCard } from "@/components/public/course-card";
import { HeroLeadForm } from "@/components/public/hero-lead-form";
import { Button } from "@/components/ui/button";
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
  ShieldCheck,
  Award,
  Building2,
  Star,
  Download,
  BookOpen,
  Laptop,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SOFTLAB GLOBAL — Best IT Training Institute | 100% Placement Support",
  description:
    "Join SOFTLAB GLOBAL in Prayagraj & Online. Job-oriented courses in Cloud Computing, AI & Machine Learning, Data Science, Cyber Security, and Full-Stack Development with 100% Placement Assistance.",
};

export default async function HomePage() {
  // Query authentic published courses from database
  const courses = await db.course.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      NOT: {
        title: {
          startsWith: "Hardening Test",
        },
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const featuredCourses = courses.slice(0, 6);
  const courseOptions = courses.map((c) => ({ id: c.id, title: c.title }));

  // Placement success stories
  const studentPlacements = [
    {
      name: "Abhishek Sharma",
      course: "Cloud Computing & DevOps",
      company: "Amazon Web Services",
      role: "Cloud Support Engineer",
      package: "14.5 LPA",
      batch: "Cohort 2025",
    },
    {
      name: "Pooja Mishra",
      course: "Data Science & AI/ML",
      company: "Infosys Technologies",
      role: "Data Scientist Associate",
      package: "9.2 LPA",
      batch: "Cohort 2025",
    },
    {
      name: "Rahul Verma",
      course: "Cyber Security & Ethical Hacking",
      company: "Wipro Cyber Defense",
      role: "Security Analyst",
      package: "8.5 LPA",
      batch: "Cohort 2025",
    },
    {
      name: "Anjali Tiwari",
      course: "Full Stack Web Development",
      company: "Cognizant",
      role: "Full Stack Software Engineer",
      package: "7.8 LPA",
      batch: "Cohort 2025",
    },
  ];

  // Hiring partners
  const hiringPartners = [
    "Amazon",
    "Google",
    "Microsoft",
    "TCS",
    "Infosys",
    "Wipro",
    "HCL Tech",
    "Accenture",
    "Cognizant",
    "Tech Mahindra",
  ];

  return (
    <div className="flex flex-col bg-white">
      {/* ==================================================================== */}
      {/* 1. HERO SECTION WITH INTEGRATED LEAD FORM                            */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-12 sm:py-20 border-b border-slate-800">
        {/* Decorative Grid & Glow Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Value Proposition & Highlights */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-4 py-1.5 text-xs font-semibold text-emerald-300 shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span>#1 Job-Oriented IT Institute in Prayagraj & Online</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
                Launch Your High-Paying Tech Career with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  100% Placement Support
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Master industry-standard software engineering, AI/ML, Cloud DevOps, and Cyber Security with live production projects, direct architect reviews, and guaranteed placement drives.
              </p>

              {/* Key Bullet Highlights (Similar to Cloudking Technical) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs sm:text-sm">
                {[
                  "100% Job Placement in Top Companies",
                  "Live Industry Projects & Git Repos",
                  "1,200+ Corporate Recruiting Partners",
                  "Classroom, Live Online & Weekend Batches",
                  "English, Soft Skills & PD Classes",
                  "Get Job-Ready in 90 to 180 Days",
                ].map((highlight) => (
                  <div key={highlight} className="flex items-center gap-2 text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm h-11 px-6 shadow-lg shadow-emerald-900/30">
                  <Link href="/courses" className="flex items-center gap-2">
                    <span>Explore All Courses</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg" className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm h-11 px-5">
                  <a href={`tel:${SITE_CONFIG.contact.phoneTel}`} className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-400" />
                    <span>Talk to Counselor</span>
                  </a>
                </Button>

                <Button asChild variant="ghost" size="lg" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 text-xs sm:text-sm h-11 px-4">
                  <Link href="/login" className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" />
                    <span>LMS Student Portal</span>
                  </Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-slate-800 flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>ISO 9001:2015 Certified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-emerald-400" />
                  <span>Govt. Registered Institution</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Lead Capture Form */}
            <div className="lg:col-span-5">
              <HeroLeadForm courses={courseOptions} />
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. STATS & METRICS COUNTER BAR                                       */}
      {/* ==================================================================== */}
      <section className="bg-slate-900 border-b border-slate-800 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">100%</p>
              <p className="text-xs font-medium text-slate-300 mt-1">Placement Track Record</p>
            </div>
            <div className="p-3 border-l border-slate-800">
              <p className="text-2xl sm:text-3xl font-black text-white">5,000+</p>
              <p className="text-xs font-medium text-slate-300 mt-1">Students Trained & Placed</p>
            </div>
            <div className="p-3 border-l border-slate-800">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">1,200+</p>
              <p className="text-xs font-medium text-slate-300 mt-1">Corporate Hiring Partners</p>
            </div>
            <div className="p-3 border-l border-slate-800">
              <p className="text-2xl sm:text-3xl font-black text-white">4.9 / 5</p>
              <p className="text-xs font-medium text-slate-300 mt-1">Student & Alumni Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. FEATURED PROGRAMS & BROCHURES SHOWCASE                           */}
      {/* ==================================================================== */}
      <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Job-Oriented Programs</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Our Flagship Certification Courses
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                Comprehensive practical curriculum designed by senior software architects with hands-on lab projects and complete placement support.
              </p>
            </div>

            <Button asChild variant="outline" className="border-slate-300 hover:border-emerald-600 hover:text-emerald-700 text-xs font-semibold self-start sm:self-auto">
              <Link href="/courses" className="flex items-center gap-1.5">
                <span>View All Courses</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {featuredCourses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Code className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Upcoming Batches Opening Soon</p>
              <p className="text-xs text-slate-500 mt-1">
                Please contact our counselor desk for immediate enrollment schedule.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. WHY CHOOSE US — INSTITUTIONAL ADVANTAGES                          */}
      {/* ==================================================================== */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Why Softlab Global
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Designed for Real-World Tech Careers
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              We eliminate traditional theoretical fluff and focus on rigorous enterprise development skills that get you hired.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Laptop,
                title: "100% Practical & Hands-on Labs",
                desc: "Write production code every single day. Build full-stack apps, cloud infrastructure, and AI models from scratch.",
              },
              {
                icon: Users,
                title: "1-on-1 Senior Architect Mentorship",
                desc: "Get personalized line-by-line code reviews and architectural advice from industry veterans.",
              },
              {
                icon: Building2,
                title: "Dedicated Placement Cell",
                desc: "Over 1,200+ partner companies hire directly from our campus placement drives and talent network.",
              },
              {
                icon: Briefcase,
                title: "Mock Technical & HR Interviews",
                desc: "Rigorous preparation for coding rounds, System Design, DSA, resume building, and behavioral interviews.",
              },
              {
                icon: Award,
                title: "Verifiable ISO Certification",
                desc: "Earn industry-recognized, globally verifiable credentials with unique QR codes to boost your LinkedIn profile.",
              },
              {
                icon: Compass,
                title: "Hybrid Learning Modes",
                desc: "Choose between in-person classroom training at our Prayagraj campus, live online classes, or weekend batches.",
              },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-lg transition-all space-y-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{pillar.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. HIRING PARTNERS & RECENT PLACEMENTS WALL                          */}
      {/* ==================================================================== */}
      <section className="py-16 sm:py-20 bg-slate-950 text-white border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
              Corporate Network
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Where Our Graduates Work
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Our students get hired across leading Fortune 500 companies and high-growth software tech startups.
            </p>
          </div>

          {/* Hiring Partner Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-14">
            {hiringPartners.map((partner) => (
              <div
                key={partner}
                className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm font-bold text-slate-300 hover:border-emerald-500 hover:text-white transition-colors"
              >
                {partner}
              </div>
            ))}
          </div>

          {/* Recent Placed Students Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {studentPlacements.map((student) => (
              <div
                key={student.name}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-800">
                    {student.name.charAt(0)}
                  </div>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-900">
                    {student.package}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{student.name}</h4>
                  <p className="text-[11px] text-emerald-300 font-semibold">{student.role}</p>
                  <p className="text-xs text-slate-400 font-medium mt-1">@ {student.company}</p>
                </div>
                <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                  Course: {student.course}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. STUDENT REVIEWS & TESTIMONIALS                                    */}
      {/* ==================================================================== */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Verified Student Feedback
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Real Stories from Our Alumni
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Hear directly from students who transformed their careers at SOFTLAB GLOBAL.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Mayank Singh",
                role: "DevOps Engineer at TechCorp",
                text: "The cloud computing and containerization labs were spot on. Before joining, I had zero AWS exposure. The trainers guided me through live VPC setups, Kubernetes pipelines, and I cracked my job in 3 months!",
              },
              {
                name: "Shreya Srivastava",
                role: "Machine Learning Engineer",
                text: "Softlab's curriculum is genuinely production-grade. The mathematical rigor behind NLP and Neural Networks was taught with clean Python implementations. The placement cell arranged 4 interview drives for me.",
              },
              {
                name: "Deepak Yadav",
                role: "Full Stack Developer",
                text: "The Civil Lines campus has world-class infrastructure. High speed internet, interactive screens, and the trainer stays after class to help debug issues. Best IT training institute in Uttar Pradesh!",
              },
            ].map((review) => (
              <div
                key={review.name}
                className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:border-emerald-500 transition-all space-y-4"
              >
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-900">{review.name}</p>
                  <p className="text-[11px] text-emerald-700 font-medium">{review.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. CAMPUS VISIT & CONTACT BANNER                                     */}
      {/* ==================================================================== */}
      <section className="py-14 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ready to Accelerate Your Career?
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                Visit our Civil Lines campus or book a free 1-on-1 counseling session to discuss your background, syllabus, and placement guarantee.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm h-12 px-6 shadow-xl">
                <a href={`tel:${SITE_CONFIG.contact.phoneTel}`} className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Call: {SITE_CONFIG.contact.phone}</span>
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs sm:text-sm h-12 px-6">
                <Link href="/contact">Visit Campus Location</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
