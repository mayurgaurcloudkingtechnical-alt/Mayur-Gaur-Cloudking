"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/trpc/react";
import { PlayCircle, FileText, FileDown, ExternalLink, ShieldCheck, AlertCircle, Clock } from "lucide-react";

interface CoursePlayerContentProps {
  enrollmentId: string;
  currentLesson: {
    id: string;
    title: string;
    type: string;
    summary?: string | null;
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
  currentLesson,
  watermark,
}: CoursePlayerContentProps) {
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = React.useState<string | null>(null);
  const [storageMessage, setStorageMessage] = React.useState<string | null>(null);

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

      {/* Rich Text Lesson */}
      {(currentLesson.type === "RICH_TEXT" || currentLesson.contentDetails?.bodyHtml || currentLesson.contentDetails?.bodyText) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
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
    </div>
  );
}
