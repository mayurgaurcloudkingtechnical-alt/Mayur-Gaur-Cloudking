"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { ContentStatus, LessonType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateModuleDialog } from "./create-module-dialog";
import { EditModuleDialog } from "./edit-module-dialog";
import { LessonAuthoringDialog } from "./lesson-authoring-dialog";
import {
  ArrowLeft,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  BookOpen,
  Video,
  FileCode,
  FileText,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  ExternalLink,
  Layers,
  ChevronDown,
  ChevronRight,
  Eye,
} from "lucide-react";

interface CurriculumCmsViewProps {
  courseId: string;
  baseBackHref?: string;
}

export function CurriculumCmsView({
  courseId,
  baseBackHref = "/admin/courses",
}: CurriculumCmsViewProps) {
  const [isCreateModuleOpen, setIsCreateModuleOpen] = React.useState(false);
  const [editingModule, setEditingModule] = React.useState<any | null>(null);
  const [authoringLesson, setAuthoringLesson] = React.useState<{
    moduleId: string;
    lesson: any | null;
  } | null>(null);

  const [expandedModules, setExpandedModules] = React.useState<Record<string, boolean>>({});

  const utils = api.useUtils();
  const { data, isLoading, error } = api.curriculum.getCourseCurriculum.useQuery({
    courseId,
  });

  const reorderModulesMutation = api.curriculum.reorderModules.useMutation({
    onSuccess: () => utils.curriculum.getCourseCurriculum.invalidate({ courseId }),
  });

  const reorderLessonsMutation = api.curriculum.reorderLessons.useMutation({
    onSuccess: () => utils.curriculum.getCourseCurriculum.invalidate({ courseId }),
  });

  const setModuleStatusMutation = api.curriculum.setModuleStatus.useMutation({
    onSuccess: () => utils.curriculum.getCourseCurriculum.invalidate({ courseId }),
  });

  const setLessonStatusMutation = api.curriculum.setLessonStatus.useMutation({
    onSuccess: () => utils.curriculum.getCourseCurriculum.invalidate({ courseId }),
  });

  const deleteModuleMutation = api.curriculum.deleteModule.useMutation({
    onSuccess: () => utils.curriculum.getCourseCurriculum.invalidate({ courseId }),
  });

  const deleteLessonMutation = api.curriculum.deleteLesson.useMutation({
    onSuccess: () => utils.curriculum.getCourseCurriculum.invalidate({ courseId }),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Loading curriculum hierarchy and content...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-800">Curriculum Access Error</p>
        <p className="text-xs text-red-600 mt-1">{error?.message || "Failed to load course."}</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={baseBackHref}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Return
          </Link>
        </Button>
      </div>
    );
  }

  const { course, modules, metrics } = data;

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const moveModule = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;
    const newModuleIds = modules.map((m) => m.id);
    const temp = newModuleIds[index];
    newModuleIds[index] = newModuleIds[targetIndex];
    newModuleIds[targetIndex] = temp;
    reorderModulesMutation.mutate({ courseId, moduleIds: newModuleIds });
  };

  const moveLesson = (moduleId: string, lessonList: any[], index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessonList.length) return;
    const newLessonIds = lessonList.map((l) => l.id);
    const temp = newLessonIds[index];
    newLessonIds[index] = newLessonIds[targetIndex];
    newLessonIds[targetIndex] = temp;
    reorderLessonsMutation.mutate({ moduleId, lessonIds: newLessonIds });
  };

  const getLessonIcon = (type: LessonType) => {
    switch (type) {
      case "VIDEO": return <Video className="h-3.5 w-3.5 text-blue-600" />;
      case "DOCUMENT":
      case "PDF": return <FileCode className="h-3.5 w-3.5 text-amber-600" />;
      case "EXTERNAL_LINK": return <LinkIcon className="h-3.5 w-3.5 text-indigo-600" />;
      default: return <FileText className="h-3.5 w-3.5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <Link
          href={`${baseBackHref}/${course.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Course Overview
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
              <Badge variant="default" className="text-[10px] uppercase font-mono">CMS</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Curriculum structure, sequenced modules, and learning material authoring.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="text-xs border-slate-300">
              <Link href={`/courses/${course.slug}`} target="_blank">
                <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View Public Page
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateModuleOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Module
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Modules</span>
            <span className="text-xl font-extrabold text-slate-900">{metrics.totalModules}</span>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Lessons</span>
            <span className="text-xl font-extrabold text-slate-900">{metrics.totalLessons}</span>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Published</span>
            <span className="text-xl font-extrabold text-emerald-700">{metrics.publishedLessons}</span>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-amber-600 block">Draft</span>
            <span className="text-xl font-extrabold text-amber-700">{metrics.draftLessons}</span>
          </CardContent>
        </Card>
        <Card className="border-slate-200 col-span-2 sm:col-span-1">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Est. Duration</span>
            <span className="text-xl font-extrabold text-slate-900">
              {Math.floor(metrics.totalDurationMin / 60)}h {metrics.totalDurationMin % 60}m
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Modules List */}
      {modules.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Layers className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-800">No Curriculum Modules Yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Start building this course curriculum by creating the first thematic module.
            </p>
            <Button
              size="sm"
              onClick={() => setIsCreateModuleOpen(true)}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              <Plus className="h-4 w-4 mr-1" /> Create First Module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((mod, modIdx) => {
            const isExpanded = expandedModules[mod.id] !== false; // expanded by default

            return (
              <Card key={mod.id} className="border-slate-200 shadow-sm overflow-hidden">
                {/* Module Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/70 border-b border-slate-200 gap-3">
                  <div className="flex items-center gap-3">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveModule(modIdx, "up")}
                        disabled={modIdx === 0 || reorderModulesMutation.isPending}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move Module Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveModule(modIdx, "down")}
                        disabled={modIdx === modules.length - 1 || reorderModulesMutation.isPending}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move Module Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className="flex items-center gap-2 text-left"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{mod.title}</span>
                          <Badge
                            variant={mod.status === "PUBLISHED" ? "success" : "default"}
                            className="text-[10px]"
                          >
                            {mod.status}
                          </Badge>
                          <span className="text-[11px] text-slate-400">
                            ({mod.lessons.length} {mod.lessons.length === 1 ? "lesson" : "lessons"})
                          </span>
                        </div>
                        {mod.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{mod.description}</p>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Module Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <select
                      value={mod.status}
                      onChange={(e) =>
                        setModuleStatusMutation.mutate({
                          id: mod.id,
                          status: e.target.value as ContentStatus,
                        })
                      }
                      className="h-7 text-[11px] rounded border border-slate-200 bg-white px-2 text-slate-700"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingModule(mod)}
                      className="h-7 px-2 text-slate-600 hover:text-slate-900"
                      title="Edit Module Details"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Archive module "${mod.title}" and its lessons?`)) {
                          deleteModuleMutation.mutate({ id: mod.id });
                        }
                      }}
                      className="h-7 px-2 text-slate-400 hover:text-red-600"
                      title="Archive Module"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setAuthoringLesson({ moduleId: mod.id, lesson: null })}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Lesson
                    </Button>
                  </div>
                </div>

                {/* Lessons inside Module */}
                {isExpanded && (
                  <div className="p-3 bg-white space-y-2">
                    {mod.lessons.length === 0 ? (
                      <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg">
                        <p className="text-xs text-slate-500">No lessons in this module yet.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAuthoringLesson({ moduleId: mod.id, lesson: null })}
                          className="mt-2 text-xs h-7"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Lesson
                        </Button>
                      </div>
                    ) : (
                      mod.lessons.map((les, lesIdx) => (
                        <div
                          key={les.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/30 hover:bg-slate-50 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => moveLesson(mod.id, mod.lessons, lesIdx, "up")}
                                disabled={lesIdx === 0 || reorderLessonsMutation.isPending}
                                className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveLesson(mod.id, mod.lessons, lesIdx, "down")}
                                disabled={lesIdx === mod.lessons.length - 1 || reorderLessonsMutation.isPending}
                                className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                            </div>

                            <div className="shrink-0">{getLessonIcon(les.type)}</div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-xs text-slate-900 truncate">
                                  {les.title}
                                </span>
                                {les.isFreePreview && (
                                  <Badge variant="default" className="text-[9px] bg-emerald-100 text-emerald-800">
                                    Preview
                                  </Badge>
                                )}
                              </div>
                              {les.summary && (
                                <p className="text-[11px] text-slate-500 truncate">{les.summary}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {les.durationMin}m
                            </span>

                            <select
                              value={les.status}
                              onChange={(e) =>
                                setLessonStatusMutation.mutate({
                                  id: les.id,
                                  status: e.target.value as ContentStatus,
                                })
                              }
                              className="h-6 text-[10px] rounded border border-slate-200 bg-white px-1.5 text-slate-700"
                            >
                              <option value="DRAFT">Draft</option>
                              <option value="PUBLISHED">Published</option>
                              <option value="ARCHIVED">Archived</option>
                            </select>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAuthoringLesson({ moduleId: mod.id, lesson: les })}
                              className="h-6 w-6 p-0 text-slate-600 hover:text-slate-900"
                              title="Edit Lesson Content"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Archive lesson "${les.title}"?`)) {
                                  deleteLessonMutation.mutate({ id: les.id });
                                }
                              }}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                              title="Archive Lesson"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <CreateModuleDialog
        courseId={course.id}
        isOpen={isCreateModuleOpen}
        onClose={() => setIsCreateModuleOpen(false)}
        onSuccess={() => utils.curriculum.getCourseCurriculum.invalidate({ courseId })}
      />

      {editingModule && (
        <EditModuleDialog
          module={editingModule}
          isOpen={Boolean(editingModule)}
          onClose={() => setEditingModule(null)}
          onSuccess={() => utils.curriculum.getCourseCurriculum.invalidate({ courseId })}
        />
      )}

      {authoringLesson && (
        <LessonAuthoringDialog
          moduleId={authoringLesson.moduleId}
          lesson={authoringLesson.lesson}
          isOpen={Boolean(authoringLesson)}
          onClose={() => setAuthoringLesson(null)}
          onSuccess={() => utils.curriculum.getCourseCurriculum.invalidate({ courseId })}
        />
      )}
    </div>
  );
}
