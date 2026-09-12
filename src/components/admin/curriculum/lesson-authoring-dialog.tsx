"use client";

import * as React from "react";
import { api } from "@/lib/trpc/react";
import { LessonType } from "@prisma/client";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Video, FileCode, Link as LinkIcon } from "lucide-react";

interface LessonAuthoringDialogProps {
  moduleId: string;
  lesson?: {
    id: string;
    title: string;
    summary: string | null;
    type: LessonType;
    durationMin: number;
    isFreePreview: boolean;
    contentDetails?: {
      videoProvider?: string | null;
      bunnyVideoId?: string | null;
      videoUrl?: string | null;
      fileName?: string | null;
      documentUrl?: string | null;
      bodyHtml?: string | null;
      externalUrl?: string | null;
    } | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LessonAuthoringDialog({
  moduleId,
  lesson,
  isOpen,
  onClose,
  onSuccess,
}: LessonAuthoringDialogProps) {
  const isEditing = Boolean(lesson);

  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [type, setType] = React.useState<LessonType>(LessonType.RICH_TEXT);
  const [durationMin, setDurationMin] = React.useState(30);
  const [isFreePreview, setIsFreePreview] = React.useState(false);

  // Content specific states
  const [videoProvider, setVideoProvider] = React.useState("BUNNY");
  const [bunnyVideoId, setBunnyVideoId] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [documentUrl, setDocumentUrl] = React.useState("");
  const [bodyHtml, setBodyHtml] = React.useState("");
  const [externalUrl, setExternalUrl] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setSummary(lesson.summary || "");
      setType(lesson.type);
      setDurationMin(lesson.durationMin);
      setIsFreePreview(lesson.isFreePreview);
      setVideoProvider(lesson.contentDetails?.videoProvider || "BUNNY");
      setBunnyVideoId(lesson.contentDetails?.bunnyVideoId || "");
      setVideoUrl(lesson.contentDetails?.videoUrl || "");
      setFileName(lesson.contentDetails?.fileName || "");
      setDocumentUrl(lesson.contentDetails?.documentUrl || "");
      setBodyHtml(lesson.contentDetails?.bodyHtml || "");
      setExternalUrl(lesson.contentDetails?.externalUrl || "");
    } else {
      setTitle("");
      setSummary("");
      setType(LessonType.RICH_TEXT);
      setDurationMin(30);
      setIsFreePreview(false);
      setVideoProvider("BUNNY");
      setBunnyVideoId("");
      setVideoUrl("");
      setFileName("");
      setDocumentUrl("");
      setBodyHtml("");
      setExternalUrl("");
    }
    setErrorMsg("");
  }, [lesson, isOpen]);

  const updateMutation = api.curriculum.updateLesson.useMutation({
    onSuccess: () => {
      setErrorMsg("");
      onSuccess();
      onClose();
    },
    onError: (err) => setErrorMsg(err.message || "Failed to update lesson."),
  });

  const createMutation = api.curriculum.createLesson.useMutation({
    onSuccess: (newLesson) => {
      const hasContent = bodyHtml || bunnyVideoId || videoUrl || fileName || documentUrl || externalUrl;
      if (hasContent) {
        updateMutation.mutate({
          id: newLesson.id,
          content: {
            videoProvider: type === "VIDEO" ? videoProvider : undefined,
            bunnyVideoId: type === "VIDEO" ? bunnyVideoId : undefined,
            videoUrl: type === "VIDEO" ? videoUrl : undefined,
            fileName: type === "DOCUMENT" || type === "PDF" ? fileName : undefined,
            documentUrl: type === "DOCUMENT" || type === "PDF" ? documentUrl : undefined,
            bodyHtml: type === "RICH_TEXT" ? bodyHtml : undefined,
            externalUrl: type === "EXTERNAL_LINK" ? externalUrl : undefined,
          },
        });
      } else {
        onSuccess();
        onClose();
      }
    },
    onError: (err) => setErrorMsg(err.message || "Failed to create lesson."),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Lesson title is required.");
      return;
    }

    const payload = {
      title: title.trim(),
      summary: summary.trim() || undefined,
      type,
      durationMin,
      isFreePreview,
      content: {
        videoProvider: type === "VIDEO" ? videoProvider : undefined,
        bunnyVideoId: type === "VIDEO" ? bunnyVideoId : undefined,
        videoUrl: type === "VIDEO" ? videoUrl : undefined,
        fileName: type === "DOCUMENT" || type === "PDF" ? fileName : undefined,
        documentUrl: type === "DOCUMENT" || type === "PDF" ? documentUrl : undefined,
        bodyHtml: type === "RICH_TEXT" ? bodyHtml : undefined,
        externalUrl: type === "EXTERNAL_LINK" ? externalUrl : undefined,
      },
    };

    if (isEditing && lesson) {
      updateMutation.mutate({ id: lesson.id, ...payload });
    } else {
      createMutation.mutate({
        moduleId,
        title: payload.title,
        summary: payload.summary,
        type: payload.type,
        durationMin: payload.durationMin,
        isFreePreview: payload.isFreePreview,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="max-h-[82vh] overflow-y-auto pr-1">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Lesson Content" : "Add New Lesson"}</DialogTitle>
          <DialogDescription>
            Configure lesson specifications, duration, and instructional references.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1">
          {errorMsg && (
            <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Lesson Title *</Label>
              <Input
                placeholder="e.g. Next.js App Router Architecture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Content Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LessonType)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="RICH_TEXT">Rich Text / Notes</option>
                <option value="VIDEO">Video Reference</option>
                <option value="DOCUMENT">Document / PDF</option>
                <option value="EXTERNAL_LINK">External Link</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Duration (Minutes)</Label>
              <Input
                type="number"
                min={1}
                max={600}
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="text-sm h-9"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="is-free-preview"
                checked={isFreePreview}
                onChange={(e) => setIsFreePreview(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="is-free-preview" className="text-xs font-medium text-slate-700 cursor-pointer">
                Free Preview (Public)
              </Label>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Summary / Objectives</Label>
            <Input
              placeholder="Brief overview of concepts covered..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          {/* Dynamic Content Specifications */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              {type === "RICH_TEXT" && <FileText className="h-3.5 w-3.5 text-emerald-600" />}
              {type === "VIDEO" && <Video className="h-3.5 w-3.5 text-blue-600" />}
              {type === "DOCUMENT" && <FileCode className="h-3.5 w-3.5 text-amber-600" />}
              {type === "EXTERNAL_LINK" && <LinkIcon className="h-3.5 w-3.5 text-indigo-600" />}
              <span>{type.replace("_", " ")} Details</span>
            </div>

            {type === "RICH_TEXT" && (
              <textarea
                rows={4}
                placeholder="Technical lecture notes, code snippets, or markdown..."
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            )}

            {type === "VIDEO" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={videoProvider}
                    onChange={(e) => setVideoProvider(e.target.value)}
                    className="h-8 rounded border border-slate-200 bg-white px-2 text-xs"
                  >
                    <option value="BUNNY">Bunny.net Stream</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="CUSTOM">Custom HLS / Direct URL</option>
                  </select>
                  <Input
                    placeholder="Video GUID / ID"
                    value={bunnyVideoId}
                    onChange={(e) => setBunnyVideoId(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <Input
                  placeholder="Video URL (https://...)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            )}

            {(type === "DOCUMENT" || type === "PDF") && (
              <div className="space-y-2">
                <Input
                  placeholder="Document Name (e.g. Lecture-Slides.pdf)"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="Document URL (https://...)"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            )}

            {type === "EXTERNAL_LINK" && (
              <Input
                placeholder="External Link (https://...)"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="h-8 text-xs"
              />
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isPending}
            >
              {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Lesson"}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
}
