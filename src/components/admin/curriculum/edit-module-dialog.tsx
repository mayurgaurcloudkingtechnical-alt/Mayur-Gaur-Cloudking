"use client";

import * as React from "react";
import { api } from "@/lib/trpc/react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditModuleDialogProps {
  module: {
    id: string;
    title: string;
    description: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditModuleDialog({
  module,
  isOpen,
  onClose,
  onSuccess,
}: EditModuleDialogProps) {
  const [title, setTitle] = React.useState(module.title);
  const [description, setDescription] = React.useState(module.description || "");
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    setTitle(module.title);
    setDescription(module.description || "");
  }, [module]);

  const updateMutation = api.curriculum.updateModule.useMutation({
    onSuccess: () => {
      setErrorMsg("");
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to update module.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Module title is required.");
      return;
    }

    updateMutation.mutate({
      id: module.id,
      title: title.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div>
        <DialogHeader>
          <DialogTitle>Edit Curriculum Module</DialogTitle>
          <DialogDescription>
            Update the title or description for this module.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-module-title" className="text-xs font-semibold text-slate-700">
              Module Title *
            </Label>
            <Input
              id="edit-module-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-module-desc" className="text-xs font-semibold text-slate-700">
              Description (Optional)
            </Label>
            <textarea
              id="edit-module-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
}
