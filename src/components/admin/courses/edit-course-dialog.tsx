"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/react";

interface CourseToEdit {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  durationWeeks: number;
  baseFee: number; // in integer Paise
  level?: string | null;
  language?: string | null;
  eligibility?: string | null;
  trainers?: Array<{ trainerId: string }>;
}

interface EditCourseDialogProps {
  course: CourseToEdit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditCourseDialog({ course, open, onOpenChange, onSuccess }: EditCourseDialogProps) {
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [durationWeeks, setDurationWeeks] = React.useState(12);
  const [baseFeeRupees, setBaseFeeRupees] = React.useState(50000);
  const [level, setLevel] = React.useState("");
  const [language, setLanguage] = React.useState("");
  const [eligibility, setEligibility] = React.useState("");
  const [selectedTrainerIds, setSelectedTrainerIds] = React.useState<string[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const { data: trainers } = api.batch.getAvailableTrainers.useQuery(undefined, {
    enabled: open,
  });

  const utils = api.useUtils();

  React.useEffect(() => {
    if (course) {
      setTitle(course.title);
      setSlug(course.slug);
      setSummary(course.summary);
      setDescription(course.description);
      setDurationWeeks(course.durationWeeks);
      setBaseFeeRupees(Math.round(course.baseFee / 100));
      setLevel(course.level || "Beginner to Advanced");
      setLanguage(course.language || "English / Hindi");
      setEligibility(course.eligibility || "Open to all graduates");
      setSelectedTrainerIds(course.trainers ? course.trainers.map((t) => t.trainerId) : []);
      setErrorMsg(null);
    }
  }, [course]);

  const updateMutation = api.course.update.useMutation({
    onSuccess: () => {
      utils.course.list.invalidate();
      if (course) utils.course.getById.invalidate({ id: course.id });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    setErrorMsg(null);

    const baseFeePaise = Math.round(Number(baseFeeRupees) * 100);

    updateMutation.mutate({
      id: course.id,
      title,
      slug,
      summary,
      description,
      durationWeeks: Number(durationWeeks),
      baseFee: baseFeePaise,
      level,
      language,
      eligibility,
      trainerIds: selectedTrainerIds,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Edit Course Details</DialogTitle>
        <DialogDescription>
          Update catalog metadata and faculty assignments. All pricing is strictly integer Paise.
        </DialogDescription>
      </DialogHeader>

      {errorMsg && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <Label htmlFor="edit-course-title">Course Title *</Label>
          <Input
            id="edit-course-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="edit-course-slug">URL Slug *</Label>
          <Input
            id="edit-course-slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 font-mono text-xs"
          />
        </div>

        <div>
          <Label htmlFor="edit-course-summary">Executive Summary *</Label>
          <textarea
            id="edit-course-summary"
            required
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <Label htmlFor="edit-course-desc">Full Curriculum Description *</Label>
          <textarea
            id="edit-course-desc"
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="edit-course-fee">Base Fee (INR ₹) *</Label>
            <Input
              id="edit-course-fee"
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
            <Label htmlFor="edit-course-duration">Duration (Weeks) *</Label>
            <Input
              id="edit-course-duration"
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
            <Label htmlFor="edit-course-level">Academic Level</Label>
            <Input
              id="edit-course-level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="edit-course-lang">Instruction Language</Label>
            <Input
              id="edit-course-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="edit-course-eligibility">Eligibility Criteria</Label>
          <Input
            id="edit-course-eligibility"
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
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving Changes..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
