import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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
  ShieldCheck,
  Code,
  Terminal,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { PublicEnquiryForm } from "@/components/public/public-enquiry-form";
import { CourseBrochureModal } from "@/components/public/course-brochure-modal";

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

function getBrochureUrl(course: { thumbnailUrl: string | null; slug: string; title: string }) {
  if (course.thumbnailUrl) return course.thumbnailUrl;
  const lower = (course.slug + " " + course.title).toLowerCase();

  // 1. Networking
  if (lower.includes("networking") || course.slug === "certificate-in-advance-networking") {
    return "/courses/networking-brochure.jpg";
  }
  // 2. Linux Administration
  if (lower.includes("linux")) {
    return "/courses/linux-admin-brochure.jpg";
  }
  // 3. Server Administration
  if (lower.includes("server") && !lower.includes("sql")) {
    return "/courses/server-admin-brochure.jpg";
  }
  // 4. Office 365
  if (lower.includes("office 365") || lower.includes("365")) {
    return "/courses/office-365-brochure.jpg";
  }
  // 5. Cloud Computing & Cyber Security with AI
  if (lower.includes("cloud computing & cyber") || lower.includes("cloud-computing-and-cyber")) {
    return "/courses/cloud-cyber-ai-brochure.jpg";
  }
  // 6. DevOps & Cloud
  if (lower.includes("devops")) {
    return "/courses/devops-brochure.jpg";
  }
  // 7. Cloud Administration
  if (lower.includes("cloud-administration") || lower.includes("cloud administration")) {
    return "/courses/cloud-admin-brochure.jpg";
  }
  // 8. C++ Programming
  if (lower.includes("c++") || lower.includes("cpp")) {
    return "/courses/cpp-programming-brochure.jpg";
  }
  // 9. C Language
  if (lower.includes("c language") || lower.includes("c programming") || course.slug === "certificate-in-c-language") {
    return "/courses/c-programming-brochure.jpg";
  }
  // 10. Java Full Stack
  if (lower.includes("java")) {
    return "/courses/java-full-stack-brochure.jpg";
  }
  // 11. Python Full Stack
  if (lower.includes("python")) {
    return "/courses/python-full-stack-brochure.jpg";
  }
  // 12. MERN Full Stack
  if (lower.includes("mern")) {
    return "/courses/mern-full-stack-brochure.jpg";
  }
  // 13. MySQL
  if (lower.includes("mysql")) {
    return "/courses/mysql-brochure.jpg";
  }
  // 14. Oracle DBA
  if (lower.includes("oracle")) {
    return "/courses/oracle-dba-brochure.jpg";
  }
  // 15. Graphics Designing
  if (lower.includes("graphics")) {
    return "/courses/graphics-designing-brochure.jpg";
  }
  // 16. Web Development / Website Designing
  if (lower.includes("web development") || lower.includes("website")) {
    return "/courses/web-development-brochure.jpg";
  }
  // 17. Digital Marketing
  if (lower.includes("marketing") || lower.includes("seo")) {
    return "/courses/digital-marketing-brochure.jpg";
  }
  // 18. Technical Support Engineer
  if (lower.includes("technical support")) {
    return "/courses/technical-support-brochure.jpg";
  }
  // 19. Cyber Security
  if (lower.includes("cyber") || lower.includes("security")) {
    return "/courses/cyber-security-brochure.jpg";
  }
  // 20. Data Science
  if (lower.includes("data science")) {
    return "/courses/data-science-brochure.jpg";
  }
  // 21. AI & Machine Learning
  if (lower.includes("ai") || lower.includes("artificial intelligence") || lower.includes("machine learning")) {
    return "/courses/ai-ml-brochure.jpg";
  }

  return "/courses/softlab-global-poster.jpg";
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
      modules: {
        where: {
          status: ContentStatus.PUBLISHED,
          deletedAt: null,
        },
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          lessons: {
            where: {
              status: ContentStatus.PUBLISHED,
              deletedAt: null,
            },
            orderBy: {
              sortOrder: "asc",
            },
            select: {
              id: true,
              title: true,
              summary: true,
              type: true,
              durationMin: true,
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
  const brochureUrl = getBrochureUrl(course);

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
      category: "Paid",
      price: course.baseFee / 100,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
    educationalCredentialAwarded: "SOFTLAB GLOBAL Certification of Completion",
    timeRequired: `P${course.durationWeeks}W`,
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />

      {/* Header Banner - Deep Cyber Emerald & Slate */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#030914] via-[#071626] to-[#040914] text-white py-12 sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/courses"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                >
                  <span>All Courses</span>
                  <span className="text-slate-500">/</span>
                </Link>
                {course.level && (
                  <Badge variant="secondary" className="text-xs font-medium bg-slate-800/90 text-slate-200 border-slate-700">
                    {course.level}
                  </Badge>
                )}
                <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
                  {course.durationWeeks} Weeks Cohort
                </span>
                <span className="text-xs font-bold text-teal-300 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800/80">
                  {course.modules.length} Detailed Modules
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium">
                {course.summary}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-300 font-semibold">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span><strong>{course.durationWeeks} Weeks</strong> Intensive</span>
                </div>
                {course.language && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-emerald-400" />
                    <span>Language: <strong>{course.language}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400" />
                  <span>Verifiable Course Certificate</span>
                </div>
              </div>
            </div>

            {/* Quick Enrollment Card */}
            <Card className="w-full lg:w-80 border-slate-800 bg-slate-900/95 shadow-2xl shrink-0 text-white rounded-3xl backdrop-blur-md">
              <CardContent className="p-6 space-y-4">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                    Total Tuition Fee
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-white">
                      {formattedFee}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">inclusive</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Delivery Format:</span>
                    <span className="font-semibold text-slate-200">Classroom & Hybrid</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Batch Capacity:</span>
                    <span className="font-semibold text-slate-200">Limited (30 learners)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Campus Location:</span>
                    <span className="font-semibold text-slate-200">Civil Lines, Prayagraj</span>
                  </div>
                </div>

                {/* Enquiry Action Button */}
                <div className="space-y-2 pt-2">
                  <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 shadow-lg shadow-emerald-950/40 rounded-xl">
                    <a href={`tel:${SITE_CONFIG.contact.phoneTel}`} className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>Call Admissions Desk</span>
                    </a>
                  </Button>

                  <Button asChild variant="outline" className="w-full border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-semibold h-9 rounded-xl">
                    <Link href={`/contact?course=${encodeURIComponent(course.title)}&action=apply`} className="flex items-center justify-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      <span>Apply for Admission</span>
                    </Link>
                  </Button>
                </div>

                <p className="text-[11px] text-slate-400 text-center leading-tight">
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
            {/* Left 2 Cols: Description, Complete Modules Syllabus & Eligibility */}
            <div className="lg:col-span-2 space-y-8">
              {/* Program Overview */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-xl font-bold text-slate-900">Course Overview & Objectives</h2>
                </div>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-4">
                  {course.description}
                </div>
              </div>

              {/* Complete Authoritative Syllabus & Curriculum Breakdown */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-emerald-600" />
                      <h2 className="text-xl font-bold text-slate-900">Complete Course Curriculum</h2>
                    </div>
                    <p className="text-xs text-slate-500">
                      {course.modules.length} Comprehensive Modules • Step-by-Step Hands-on Labs & Projects
                    </p>
                  </div>

                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Job-Ready 2026
                  </span>
                </div>

                <div className="space-y-4">
                  {course.modules.map((mod, idx) => (
                    <div
                      key={mod.id}
                      className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition-colors bg-slate-50/40 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                            Module {idx + 1}
                          </span>
                          <h3 className="text-base font-bold text-slate-900">
                            {mod.title}
                          </h3>
                        </div>

                        <Badge variant="outline" className="text-[11px] bg-white text-slate-700 border-slate-200 shrink-0">
                          {mod.lessons.length} Learning Units
                        </Badge>
                      </div>

                      {mod.description && (
                        <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                          {mod.description}
                        </p>
                      )}

                      {/* Sub-lessons */}
                      {mod.lessons.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {mod.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-2 text-xs text-slate-700 p-2 rounded-xl bg-white border border-slate-100 font-medium"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate">{lesson.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Eligibility & Prerequisites */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
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
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Faculty & Mentors</h2>
                  <Link
                    href="/trainers"
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <span>View All Faculty</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mr. Mayur Gaur (Covers All 21 Programs) */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        MG
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 text-sm truncate">
                            Mr. Mayur Gaur
                          </p>
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        </div>
                        <p className="text-xs font-bold text-emerald-800">
                          Faculty / Trainer • 11+ Years Experience
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      Technology Leader & Entrepreneur with 11+ years leading hands-on technical curriculum across SOFTLAB GLOBAL programs.
                    </p>
                  </div>

                  {/* Mr. Nihal Singh */}
                  {(course.slug.includes("linux") ||
                    course.slug.includes("network") ||
                    course.slug.includes("365") ||
                    course.slug.includes("office") ||
                    course.slug.includes("server") ||
                    course.slug.includes("cloud") ||
                    course.slug.includes("cyber") ||
                    course.slug.includes("security") ||
                    course.title.toLowerCase().includes("linux") ||
                    course.title.toLowerCase().includes("network") ||
                    course.title.toLowerCase().includes("365") ||
                    course.title.toLowerCase().includes("server") ||
                    course.title.toLowerCase().includes("cloud") ||
                    course.title.toLowerCase().includes("cyber") ||
                    course.title.toLowerCase().includes("security")) && (
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 hover:border-emerald-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                          NS
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 text-sm truncate">
                              Mr. Nihal Singh
                            </p>
                            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          </div>
                          <p className="text-xs font-medium text-teal-700">
                            Faculty / Trainer • 8+ Years Experience
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        Senior Infrastructure, Systems & Cyber Defense Faculty specializing in Enterprise Linux, Cloud Administration, and Network Security.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Official Course Flyer, Admissions Form & Support */}
            <div className="space-y-6">
              {/* Official Course Flyer / Brochure with Interactive Modal */}
              <CourseBrochureModal courseTitle={course.title} brochureUrl={brochureUrl} />

              {/* Direct Enquiry Form */}
              <PublicEnquiryForm preselectedCourseId={course.id} preselectedCourseSlug={course.slug} />

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
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

              <div className="bg-emerald-50/60 p-6 rounded-3xl border border-emerald-200 space-y-3">
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
