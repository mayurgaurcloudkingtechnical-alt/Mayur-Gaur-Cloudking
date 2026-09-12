"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/react";
import { ContentStatus } from "@prisma/client";

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCourseDialog({ open, onOpenChange, onSuccess }: CreateCourseDialogProps) {
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [autoSlug, setAutoSlug] = React.useState(true);
  const [summary, setSummary] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [durationWeeks, setDurationWeeks] = React.useState(12);
  const [baseFeeRupees, setBaseFeeRupees] = React.useState(50000);
  const [level, setLevel] = React.useState("Beginner to Advanced");
  const [language, setLanguage] = React.useState("English / Hindi");
  const [eligibility, setEligibility] = React.useState("Open to all graduates and learners");
  const [status, setStatus] = React.useState<ContentStatus>(ContentStatus.DRAFT);
  const [selectedTrainerIds, setSelectedTrainerIds] = React.useState<string[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const { data: trainers } = api.batch.getAvailableTrainers.useQuery(undefined, {
    enabled: open,
  });

  const utils = api.useUtils();

  const createMutation = api.course.create.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
      onOpenChange(false);
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  function resetForm() {
    setTitle("");
    setSlug("");
    setAutoSlug(true);
    setSummary("");
    setDescription("");
    setDurationWeeks(12);
    setBaseFeeRupees(50000);
    setLevel("Beginner to Advanced");
    setLanguage("English / Hindi");
    setEligibility("Open to all graduates and learners");
    setStatus(ContentStatus.DRAFT);
    setSelectedTrainerIds([]);
    setErrorMsg(null);
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitle(val);
    if (autoSlug) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    // Convert Rupees to integer Paise (₹1 = 100 Paise)
    const baseFeePaise = Math.round(Number(baseFeeRupees) * 100);

    createMutation.mutate({
      title,
      slug: slug.trim() || undefined,
      summary,
      description,
      durationWeeks: Number(durationWeeks),
      baseFee: baseFeePaise,
      level,
      language,
      eligibility,
      status,
      trainerIds: selectedTrainerIds,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Create New Course</DialogTitle>
        <DialogDescription>
          Provision a new academic course shell into the SOFTLAB GLOBAL catalog.
        </DialogDescription>
      </DialogHeader>

      {errorMsg && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <Label htmlFor="course-title">Course Title *</Label>
          <Input
            id="course-title"
            required
            placeholder="e.g. Full Stack Web Development & Cloud DevOps"
            value={title}
            onChange={handleTitleChange}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="course-slug">URL Slug *</Label>
            <Input
              id="course-slug"
              required
              placeholder="full-stack-web-dev"
              value={slug}
              onChange={(e) => {
                setAutoSlug(false);
                setSlug(e.target.value);
              }}
              className="mt-1 font-mono text-xs"
            />
          </div>
          <div>
            <Label htmlFor="course-status">Publishing Status</Label>
            <select
              id="course-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="DRAFT">DRAFT (Unpublished)</option>
              <option value="PUBLISHED">PUBLISHED (Catalog Active)</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="course-summary">Executive Summary *</Label>
          <textarea
            id="course-summary"
            required
            rows={2}
            placeholder="High-level overview visible on course cards..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <Label htmlFor="course-desc">Full Curriculum Description *</Label>
          <textarea
            id="course-desc"
            required
            rows={3}
            placeholder="Detailed syllabus outline, learning outcomes, tools covered..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="course-fee">Base Fee (INR ₹) *</Label>
            <Input
              id="course-fee"
              type="number"
              required
              min={0}
              step={100}
              value={baseFeeRupees}
              onChange={(e) => setBaseFeeRupees(Number(e.target.value))}
              className="mt-1"
            />
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
              Stored as {Math.round(baseFeeRupees * 100)} Paise
            </p>
          </div>
          <div>
            <Label htmlFor="course-duration">Duration (Weeks) *</Label>
            <Input
              id="course-duration"
              type="number"
              required
              min={1}
              max={104}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="course-level">Academic Level</Label>
            <Input
              id="course-level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="course-lang">Instruction Language</Label>
            <Input
              id="course-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="course-eligibility">Eligibility Criteria</Label>
          <Input
            id="course-eligibility"
            value={eligibility}
            onChange={(e) => setEligibility(e.target.value)}
            className="mt-1 text-xs"
          />
        </div>

        {trainers && trainers.length > 0 && (
          <div>
            <Label className="mb-1 block">Assign Faculty Instructors</Label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto rounded-md border border-slate-200 p-2 bg-slate-50">
              {trainers.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTrainerIds.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTrainerIds([...selectedTrainerIds, t.id]);
                      } else {
                        setSelectedTrainerIds(selectedTrainerIds.filter((id) => id !== t.id));
                      }
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    {t.user.firstName} {t.user.lastName} ({t.user.email})
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating Course..." : "Create Course"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
