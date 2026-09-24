"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/trpc/react";
import {
  PlayCircle,
  FileText,
  FileDown,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { TopicStudyModal } from "./topic-study-modal";

interface CoursePlayerContentProps {
  enrollmentId: string;
  courseTitle?: string;
  currentLesson: {
    id: string;
    title: string;
    type: string;
    summary?: string | null;
    moduleId?: string;
    moduleTitle?: string;
    topics?: string[];
    contentDetails?: {
      id?: string;
      fileName?: string | null;
      fileSizeBytes?: number | null;
      mimeType?: string | null;
      hasResource?: boolean;
      bodyHtml?: string | null;
      bodyText?: string | null;
      bunnyVideoId?: string | null;
      videoUrl?: string | null;
      externalUrl?: string | null;
    } | null;
  };
  watermark: {
    email: string;
    timestamp: string;
  };
}

export function CoursePlayerContent({
  enrollmentId,
  courseTitle,
  currentLesson,
  watermark,
}: CoursePlayerContentProps) {
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = React.useState<string | null>(null);
  const [storageMessage, setStorageMessage] = React.useState<string | null>(null);

  // Interactive Topic Study Explorer state
  const [selectedTopic, setSelectedTopic] = React.useState<string | null>(null);
  const [completedTopics, setCompletedTopics] = React.useState<Set<string>>(new Set());

  // Restore completed topics from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(`softlab_completed_topics_${enrollmentId}`);
      if (saved) {
        setCompletedTopics(new Set(JSON.parse(saved)));
      }
    } catch {}
  }, [enrollmentId]);

  const handleMarkComplete = (topic: string) => {
    const norm = topic.toLowerCase().trim();
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(norm)) {
        next.delete(norm);
      } else {
        next.add(norm);
      }
      try {
        localStorage.setItem(
          `softlab_completed_topics_${enrollmentId}`,
          JSON.stringify(Array.from(next))
        );
      } catch {}
      return next;
    });
  };

  // Derive clean topics list
  const displayTopics = React.useMemo(() => {
    const list: string[] = [];
    if (currentLesson.topics && currentLesson.topics.length > 0) {
      for (const t of currentLesson.topics) {
        const cleaned = t
          .replace(/[\uF0B7\u2022\u25CF\uFEFF]/g, "")
          .replace(/^[-–—o•*]\s*/, "")
          .trim();
        if (cleaned && cleaned.length > 1 && !list.includes(cleaned)) {
          list.push(cleaned);
        }
      }
    }
    return list;
  }, [currentLesson.topics]);

  // Reset download link on lesson switch to ensure fresh per-lesson authorization
  React.useEffect(() => {
    setDownloadUrl(null);
    setDownloadFileName(null);
    setStorageMessage(null);
  }, [currentLesson.id]);

  const requestResourceMutation = api.learning.getLessonResourceDownloadUrl.useMutation({
    onSuccess: (res) => {
      if (res.available && res.downloadUrl) {
        setDownloadUrl(res.downloadUrl);
        setDownloadFileName(res.fileName ?? null);
        setStorageMessage(null);
      } else {
        setDownloadUrl(null);
        setStorageMessage(res.message || "Document storage is not configured in this environment.");
      }
    },
    onError: (err) => {
      setDownloadUrl(null);
      setStorageMessage(err.message || "Authorization failed.");
    },
  });

  const handleRequestDownload = () => {
    requestResourceMutation.mutate({
      enrollmentId,
      lessonId: currentLesson.id,
    });
  };

  const isSafeExternalLink = (url: string | null | undefined): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {currentLesson.summary && (
        <Card className="bg-slate-50/80 border-slate-200">
          <CardContent className="p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Overview: </span>
            {currentLesson.summary}
          </CardContent>
        </Card>
      )}

      {/* Video Lesson */}
      {currentLesson.type === "VIDEO" && (
        <div className="relative overflow-hidden rounded-xl bg-slate-950 aspect-video shadow-md flex items-center justify-center">
          {/* Security Watermark Overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 select-none opacity-25"
            aria-hidden="true"
          >
            <div className="text-[11px] font-mono text-slate-300">
              {watermark.email} • {watermark.timestamp}
            </div>
            <div className="text-[11px] font-mono text-slate-300 text-right">
              SOFTLAB GLOBAL • {watermark.email}
            </div>
          </div>

          {currentLesson.contentDetails?.bunnyVideoId ? (
            <iframe
              src={`https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID || "378415"}/${currentLesson.contentDetails.bunnyVideoId}?autoplay=false&loop=false&muted=false&preload=true`}
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0 z-10"
              allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
              allowFullScreen
            />
          ) : currentLesson.contentDetails?.videoUrl ? (
            <video
              src={currentLesson.contentDetails.videoUrl}
              controls
              controlsList="nodownload"
              className="h-full w-full object-contain z-10"
            />
          ) : (
            <div className="text-center p-6 text-slate-400 z-10">
              <PlayCircle className="mx-auto h-12 w-12 text-slate-500 mb-2" />
              <p className="text-sm font-medium text-slate-200">Video Content Stream Provisioned</p>
              <p className="text-xs text-slate-400 mt-1">
                Faculty instructor media asset will load during scheduled streaming sessions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Interactive Curriculum Topics Study Explorer */}
      {displayTopics.length > 0 && (
        <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                  <BookOpen className="h-4 w-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Key Curriculum Topics</h3>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                  Click to Study Deeply
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Select any topic below to open comprehensive study notes, architecture diagrams, practical commands, troubleshooting, and interview prep.
              </p>
            </div>
            <div className="text-xs text-emerald-800 bg-emerald-100/60 font-semibold px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
              {displayTopics.filter((t) => completedTopics.has(t.toLowerCase().trim())).length} of{" "}
              {displayTopics.length} Mastered
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {displayTopics.map((topic, tIdx) => {
              const isDone = completedTopics.has(topic.toLowerCase().trim());
              return (
                <button
                  key={tIdx}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`group text-left p-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 text-xs font-semibold cursor-pointer ${
                    isDone
                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-sm"
                      : "bg-white hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-300 text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`h-2.5 w-2.5 rounded-full flex-shrink-0 transition-colors ${
                        isDone ? "bg-emerald-600 ring-2 ring-emerald-200" : "bg-emerald-400 group-hover:bg-emerald-600"
                      }`}
                    />
                    <span className="truncate">{topic}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px] font-medium">
                    {isDone ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Done
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500 group-hover:text-emerald-700">
                        Study <ArrowRight className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rich Text Lesson */}
      {(currentLesson.type === "RICH_TEXT" || currentLesson.contentDetails?.bodyHtml || currentLesson.contentDetails?.bodyText) && (
        <div
          className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            // Support clicking any element with data-topic or class topic-item / topic-pill / border card
            const card = target.closest(".topic-card, .topic-pill, [data-topic]");
            if (card) {
              const text = card.getAttribute("data-topic") || card.textContent;
              if (text) {
                const cleaned = text
                  .replace(/[\uF0B7\u2022\u25CF\uFEFF]/g, "")
                  .replace(/^[-–—o•*]\s*/, "")
                  .trim();
                if (cleaned && cleaned.length > 2) setSelectedTopic(cleaned);
              }
            }
          }}
        >
          {currentLesson.contentDetails?.bodyHtml ? (
            <div
              className="prose prose-slate max-w-none text-slate-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentLesson.contentDetails.bodyHtml }}
            />
          ) : currentLesson.contentDetails?.bodyText ? (
            <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-800 leading-relaxed">
              {currentLesson.contentDetails.bodyText}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FileText className="mx-auto h-10 w-10 text-slate-400 mb-2" />
              <p className="text-sm">Study reading material is being prepared by your instructor.</p>
            </div>
          )}
        </div>
      )}

      {/* Document / PDF Lesson (Protected Resource Delivery) */}
      {(currentLesson.type === "DOCUMENT" || currentLesson.type === "PDF") && (
        <Card className="border-slate-200">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700">
                <FileDown className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {currentLesson.contentDetails?.fileName || `${currentLesson.title} Resource Guide`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentLesson.contentDetails?.fileSizeBytes
                    ? `${Math.round(currentLesson.contentDetails.fileSizeBytes / 1024)} KB • `
                    : ""}
                  Private Institutional Study Guide
                </p>
              </div>
            </div>

            <div>
              {downloadUrl ? (
                <div className="flex flex-col items-end gap-1">
                  <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                      <FileDown className="mr-2 h-4 w-4" /> Download {downloadFileName || "Guide"}
                    </Button>
                  </a>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                    <Clock className="h-3 w-3" /> Link active for 5 minutes
                  </span>
                </div>
              ) : storageMessage ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                  <span>{storageMessage}</span>
                </div>
              ) : (
                <Button
                  onClick={handleRequestDownload}
                  disabled={requestResourceMutation.isPending}
                  variant="outline"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {requestResourceMutation.isPending ? "Authorizing Token..." : "Request Download Link"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* External Resource Link (Protocol-Sanitized) */}
      {currentLesson.type === "EXTERNAL_LINK" && (
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h3 className="font-semibold text-slate-900">External Lab & Documentation Resource</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              This academic module requires external developer documentation or hands-on sandbox environments.
            </p>
            <div className="mt-4">
              {isSafeExternalLink(currentLesson.contentDetails?.externalUrl) ? (
                <a
                  href={currentLesson.contentDetails!.externalUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <ExternalLink className="mr-2 h-4 w-4" /> Open Resource in New Tab
                  </Button>
                </a>
              ) : (
                <Badge variant="outline" className="text-slate-500 bg-slate-50">
                  External URL provided during scheduled faculty session
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic Study Interactive Reader Modal */}
      <TopicStudyModal
        isOpen={Boolean(selectedTopic)}
        onClose={() => setSelectedTopic(null)}
        topicTitle={selectedTopic}
        courseTitle={courseTitle}
        moduleTitle={currentLesson.moduleTitle}
        allTopics={displayTopics}
        onSelectTopic={(t) => setSelectedTopic(t)}
        onMarkComplete={handleMarkComplete}
        completedTopics={completedTopics}
      />
    </div>
  );
}
