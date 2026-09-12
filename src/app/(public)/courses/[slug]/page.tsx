import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { ContentStatus } from "@prisma/client";
import { SITE_CONFIG } from "@/lib/constants/site";
import { formatPaiseToRupees } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Globe,
  Award,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Phone,
  Mail,
  UserCheck,
  Calendar,
  Layers,
} from "lucide-react";

interface CourseDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const course = await db.course.findFirst({
    where: {
      slug: params.slug,
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
  });

  if (!course) {
    return {
      title: "Course Not Found — SOFTLAB GLOBAL",
      description: "The requested academic program is not available.",
    };
  }

  return {
    title: `${course.title} — SOFTLAB GLOBAL`,
    description: course.summary,
    openGraph: {
      title: `${course.title} | SOFTLAB GLOBAL`,
      description: course.summary,
      url: `${SITE_CONFIG.domain}/courses/${course.slug}`,
      type: "article",
    },
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const course = await db.course.findFirst({
    where: {
      slug: params.slug,
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
    include: {
      trainers: {
        include: {
          trainer: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const formattedFee = formatPaiseToRupees(course.baseFee);

  // Structured Data (JSON-LD) for Course Schema
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary,
    provider: {
      "@type": "EducationalOrganization",
      name: SITE_CONFIG.name,
      sameAs: SITE_CONFIG.domain,
    },
    offers: {
      "@type": "Offer",
      category: "Tuition",
      price: course.baseFee / 100,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: ["onsite", "online", "blended"],
      duration: `P${course.durationWeeks}W`,
      inLanguage: course.language || "en",
    },
  };

  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-emerald-50/80 via-white to-white py-12 sm:py-16 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/courses"
                  className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>All Courses</span>
                  <span className="text-slate-400">/</span>
                </Link>
                {course.level && (
                  <Badge variant="secondary" className="text-xs font-medium text-slate-700">
                    {course.level}
                  </Badge>
                )}
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  {course.durationWeeks} Weeks
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                {course.summary}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span><strong>{course.durationWeeks} Weeks</strong> Intensive</span>
                </div>
                {course.language && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-emerald-600" />
                    <span>Language: <strong>{course.language}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-600" />
                  <span>Verifiable Course Certificate</span>
                </div>
              </div>
            </div>

            {/* Sticky/Card Enrollment Box */}
            <Card className="w-full lg:w-80 border-slate-200 shadow-md shrink-0 bg-white">
              <CardContent className="p-6 space-y-4">
                <div>
                  <span className="text-xs uppercase font-semibold text-slate-500 block">
                    Tuition Fee
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {formattedFee}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">inclusive</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Delivery Format:</span>
                    <span className="font-semibold text-slate-900">Classroom & Hybrid</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Batch Capacity:</span>
                    <span className="font-semibold text-slate-900">Limited (30 learners)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Campus Location:</span>
                    <span className="font-semibold text-slate-900">Civil Lines, Prayagraj</span>
                  </div>
                </div>

                {/* Enquiry Action Button */}
                <div className="space-y-2 pt-2">
                  <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    <a href={`tel:${SITE_CONFIG.contact.phoneTel}`} className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>Call Admissions Desk</span>
                    </a>
                  </Button>

                  <Button asChild variant="outline" className="w-full border-slate-300 text-xs">
                    <Link href={`/contact?course=${encodeURIComponent(course.title)}`} className="flex items-center justify-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      <span>Contact / Visit Campus</span>
                    </Link>
                  </Button>
                </div>

                <p className="text-[11px] text-slate-500 text-center leading-tight">
                  Direct counseling & campus tours available Mon–Sat.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content Details */}
      <section className="py-14 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Description & Eligibility */}
            <div className="lg:col-span-2 space-y-8">
              {/* Program Description */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Curriculum Overview</h2>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-4">
                  {course.description}
                </div>
              </div>

              {/* Eligibility & Prerequisites */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Eligibility & Recommended Prerequisites</h2>
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Target Learners:</p>
                    <p className="text-slate-600 mt-0.5">{course.eligibility || "Open to graduates and technology enthusiasts"}</p>
                  </div>
                </div>
              </div>

              {/* Faculty Instructors */}
              {course.trainers.length > 0 && (
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">Assigned Faculty Team</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {course.trainers.map(({ trainer }) => (
                      <div key={trainer.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                            {trainer.user.firstName[0]}
                            {trainer.user.lastName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {trainer.user.firstName} {trainer.user.lastName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {trainer.experienceYears}+ years enterprise experience
                            </p>
                          </div>
                        </div>
                        {trainer.bio && (
                          <p className="text-xs text-slate-600 line-clamp-3 mt-2 leading-relaxed">
                            {trainer.bio}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Admissions & Learning Support */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-base font-bold text-slate-900">What You Receive</h3>
                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Complete hands-on curriculum with guided repository codebases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Personalized feedback & architectural code reviews on assignments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Cryptographically verifiable certificate on completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Structured technical interview & resume preparation</span>
                  </li>
                </ul>
              </div>

              <div className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-200 space-y-3">
                <h3 className="text-base font-bold text-emerald-950">Have Questions?</h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Visit our campus in Civil Lines or speak directly with an academic counselor to review course syllabus and schedules.
                </p>
                <div className="pt-1">
                  <a
                    href={`tel:${SITE_CONFIG.contact.phoneTel}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-emerald-900 hover:text-emerald-700 underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call {SITE_CONFIG.contact.phone}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
