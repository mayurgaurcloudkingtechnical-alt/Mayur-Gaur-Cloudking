"use client";

import * as React from "react";
import { api } from "@/lib/trpc/react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateModuleDialogProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateModuleDialog({
  courseId,
  isOpen,
  onClose,
  onSuccess,
}: CreateModuleDialogProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  const createMutation = api.curriculum.createModule.useMutation({
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setErrorMsg("");
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to create curriculum module.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Module title is required.");
      return;
    }

    createMutation.mutate({
      courseId,
      title: title.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div>
        <DialogHeader>
          <DialogTitle>Add Curriculum Module</DialogTitle>
          <DialogDescription>
            Create a major thematic section (e.g. &ldquo;Core TypeScript Architecture&rdquo;) to group related lessons.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="module-title" className="text-xs font-semibold text-slate-700">
              Module Title *
            </Label>
            <Input
              id="module-title"
              placeholder="e.g. Module 1: Production System Architecture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="module-desc" className="text-xs font-semibold text-slate-700">
              Description (Optional)
            </Label>
            <textarea
              id="module-desc"
              rows={3}
              placeholder="Brief pedagogical summary of concepts covered in this module..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Module"}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
}
