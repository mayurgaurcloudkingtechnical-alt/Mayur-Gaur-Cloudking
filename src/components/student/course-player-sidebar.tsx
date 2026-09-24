"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";

interface LessonItem {
  id: string;
  title: string;
  type: string;
  durationMin: number;
  isCompleted: boolean;
}

interface ModuleItem {
  id: string;
  title: string;
  lessons: LessonItem[];
}

interface CoursePlayerSidebarProps {
  courseTitle: string;
  batchCode?: string | null;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  modules: ModuleItem[];
  activeLessonId: string;
  onSelectLesson: (lessonId: string) => void;
}

export function CoursePlayerSidebar({
  courseTitle,
  batchCode,
  progressPercent,
  completedLessons,
  totalLessons,
  modules,
  activeLessonId,
  onSelectLesson,
}: CoursePlayerSidebarProps) {
  return (
    <aside className="w-full lg:w-80 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <Link
          href="/student/courses"
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 mb-3"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to My Courses
        </Link>
        <h2 className="text-base font-bold text-slate-900 line-clamp-2">{courseTitle}</h2>
        {batchCode && (
          <div className="mt-1">
            <Badge variant="outline" className="text-xs font-mono text-emerald-700 bg-emerald-50">
              Batch: {batchCode}
            </Badge>
          </div>
        )}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-medium">Progress</span>
            <span className="font-bold text-emerald-700">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400 text-right">
            {completedLessons} of {totalLessons} lessons completed
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {modules.map((mod, modIdx) => (
          <div key={mod.id} className="space-y-1">
            <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Module {modIdx + 1}: {mod.title.replace(/^(module|phase|month)\s*\d+[:\s–—-]*/i, "").trim()}
            </div>
            <div className="space-y-0.5">
              {mod.lessons.map((les) => {
                const isActive = les.id === activeLessonId;
                return (
                  <button
                    key={les.id}
                    onClick={() => onSelectLesson(les.id)}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors text-xs ${
                      isActive
                        ? "bg-emerald-50 text-emerald-950 font-medium border border-emerald-200"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {les.isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{les.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span>{les.durationMin}m</span>
                        <span>•</span>
                        <span className="capitalize">{les.type.toLowerCase()}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
