"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CoursePlayerSidebar } from "./course-player-sidebar";
import { CoursePlayerContent } from "./course-player-content";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock,
} from "lucide-react";

interface CoursePlayerViewProps {
  enrollmentId: string;
}

export function CoursePlayerView({ enrollmentId }: CoursePlayerViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonIdParam = searchParams.get("lessonId") ?? undefined;

  const [activeLessonId, setActiveLessonId] = React.useState<string | undefined>(lessonIdParam);

  React.useEffect(() => {
    if (lessonIdParam) {
      setActiveLessonId(lessonIdParam);
    }
  }, [lessonIdParam]);

  const { data, isLoading, error, refetch } = api.learning.getCoursePlayer.useQuery(
    { enrollmentId, lessonId: activeLessonId },
    { refetchOnWindowFocus: false }
  );

  const toggleMutation = api.learning.toggleLessonComplete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingSpinner className="h-8 w-8 text-emerald-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">Unable to load course player</h2>
        <p className="mt-2 text-sm text-slate-600">
          {error?.message ?? "An error occurred while loading this course."}
        </p>
        <div className="mt-6">
          <Link href="/student/courses">
            <Button variant="outline">Back to My Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { course, modules, currentLesson, prevLesson, nextLesson, stats, watermark } = data;

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    router.push(`/student/learning/${enrollmentId}?lessonId=${lessonId}`);
  };

  const handleToggleComplete = () => {
    toggleMutation.mutate({
      enrollmentId,
      lessonId: currentLesson.id,
      isCompleted: !currentLesson.isCompleted,
    });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      <CoursePlayerSidebar
        courseTitle={course.title}
        batchCode={data.enrollment.batchCode}
        progressPercent={stats.progressPercent}
        completedLessons={stats.completedLessons}
        totalLessons={stats.totalLessons}
        modules={modules}
        activeLessonId={currentLesson.id}
        onSelectLesson={handleSelectLesson}
      />

      <main className="flex-1 flex flex-col overflow-y-auto p-4 lg:p-8">
        <div className="mx-auto max-w-4xl w-full space-y-6">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs font-semibold text-emerald-700 tracking-wide uppercase">
                {currentLesson.moduleTitle.replace(/^(module|phase|month)\s*\d+[:\s–—-]*/i, "").trim()}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">{currentLesson.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {currentLesson.durationMin} minutes
                </span>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {currentLesson.type}
                </Badge>
              </div>
            </div>

            <Button
              onClick={handleToggleComplete}
              disabled={toggleMutation.isPending}
              variant={currentLesson.isCompleted ? "outline" : "default"}
              className={
                currentLesson.isCompleted
                  ? "border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              <CheckCircle2 className={`mr-2 h-4 w-4 ${currentLesson.isCompleted ? "text-emerald-600" : ""}`} />
              {currentLesson.isCompleted ? "Completed (Click to Undo)" : "Mark as Completed"}
            </Button>
          </div>

          <CoursePlayerContent
            enrollmentId={enrollmentId}
            courseTitle={course.title}
            currentLesson={currentLesson}
            watermark={watermark}
          />

          {/* Bottom Navigation Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-8">
            {prevLesson ? (
              <Button
                variant="outline"
                onClick={() => handleSelectLesson(prevLesson.id)}
                className="text-xs"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous: {prevLesson.title}
              </Button>
            ) : (
              <div />
            )}

            {nextLesson ? (
              <Button
                onClick={() => handleSelectLesson(nextLesson.id)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs"
              >
                Next: {nextLesson.title} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                🎉 End of Current Curriculum
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
