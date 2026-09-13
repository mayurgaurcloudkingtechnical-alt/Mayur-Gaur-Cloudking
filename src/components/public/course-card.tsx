import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPaiseToRupees } from "@/lib/utils";
import { Clock, Globe, ArrowRight, ShieldCheck, Download, Award } from "lucide-react";

export interface PublicCourseData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  durationWeeks: number;
  baseFee: number;
  level: string | null;
  language: string | null;
  eligibility?: string | null;
  thumbnailUrl?: string | null;
}

interface CourseCardProps {
  course: PublicCourseData;
}

function getCourseBrochureImage(slug: string, title: string): string {
  const lower = (slug + " " + title).toLowerCase();
  if (lower.includes("ai") || lower.includes("machine learning")) {
    return "/courses/ai-ml-brochure.jpg";
  }
  if (lower.includes("data science") || lower.includes("analytics")) {
    return "/courses/data-science-brochure.jpg";
  }
  if (lower.includes("cyber") || lower.includes("security") || lower.includes("hacking")) {
    return "/courses/cyber-security-brochure.jpg";
  }
  if (lower.includes("c++") || lower.includes("cpp")) {
    return "/courses/cpp-programming-brochure.jpg";
  }
  if (lower.includes("c language") || lower.includes("c programming")) {
    return "/courses/c-programming-brochure.jpg";
  }
  return "/courses/ai-ml-brochure.jpg";
}

export function CourseCard({ course }: CourseCardProps) {
  const formattedFee = formatPaiseToRupees(course.baseFee);
  const brochureImg = course.thumbnailUrl || getCourseBrochureImage(course.slug, course.title);

  return (
    <Card className="flex flex-col justify-between border-slate-200 bg-white hover:border-emerald-500 hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
      {/* Course Image Header with Overlay Badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        <Image
          src={brochureImg}
          alt={course.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
            <ShieldCheck className="w-3 h-3" />
            <span>100% Placement</span>
          </span>
          {course.level && (
            <span className="bg-slate-900/90 text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-700">
              {course.level}
            </span>
          )}
        </div>

        {/* Bottom Duration Badge */}
        <div className="absolute bottom-3 left-3 text-white">
          <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{course.durationWeeks} Weeks Cohort</span>
          </span>
        </div>
      </div>

      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
          <Link href={`/courses/${course.slug}`}>
            {course.title}
          </Link>
        </CardTitle>

        <CardDescription className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
          {course.summary}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-5 pt-0 pb-3 text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Award className="h-3.5 w-3.5 text-emerald-600" />
            <span>Govt / ISO Certified</span>
          </div>
          {course.language && (
            <div className="flex items-center gap-1 text-slate-600">
              <Globe className="h-3.5 w-3.5 text-emerald-600" />
              <span>{course.language}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 px-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
            Program Fee
          </span>
          <span className="text-base font-extrabold text-slate-900">
            {formattedFee}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:border-emerald-600 hover:text-emerald-700 text-xs h-8 px-2.5" title="Download Brochure">
            <a href={brochureImg} download={`brochure-${course.slug}.jpg`} target="_blank" rel="noopener noreferrer">
              <Download className="h-3.5 w-3.5" />
            </a>
          </Button>

          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-3 shadow-sm">
            <Link href={`/courses/${course.slug}`} className="flex items-center gap-1">
              <span>Enroll</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
