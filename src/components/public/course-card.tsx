import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPaiseToRupees } from "@/lib/utils";
import { Clock, BookOpen, Globe, ArrowRight } from "lucide-react";

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
}

interface CourseCardProps {
  course: PublicCourseData;
}

export function CourseCard({ course }: CourseCardProps) {
  const formattedFee = formatPaiseToRupees(course.baseFee);

  return (
    <Card className="flex flex-col justify-between border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {course.level && (
            <Badge variant="secondary" className="text-[11px] font-medium text-slate-700 bg-slate-100">
              {course.level}
            </Badge>
          )}
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {course.durationWeeks} Weeks
          </span>
        </div>

        <CardTitle className="text-lg font-bold text-slate-900 line-clamp-2 leading-snug">
          <Link href={`/courses/${course.slug}`} className="hover:text-emerald-700 transition-colors">
            {course.title}
          </Link>
        </CardTitle>

        <CardDescription className="text-xs text-slate-600 line-clamp-3 mt-1.5 leading-relaxed">
          {course.summary}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 pb-4 text-xs text-slate-500 space-y-2">
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{course.durationWeeks} Weeks Intensive</span>
          </div>
          {course.language && (
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span>{course.language}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-xl">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-500 block">
            Tuition Fee
          </span>
          <span className="text-lg font-bold text-slate-900">
            {formattedFee}
          </span>
        </div>

        <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Link href={`/courses/${course.slug}`} className="flex items-center gap-1.5">
            <span>View Syllabus</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
