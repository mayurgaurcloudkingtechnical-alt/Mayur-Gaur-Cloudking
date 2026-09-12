"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/react";
import { DeliveryMode } from "@prisma/client";

interface CreateClassDialogProps {
  batchId: string;
  batchStartDate: Date | string;
  batchEndDate?: Date | string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateClassDialog({
  batchId,
  batchStartDate,
  batchEndDate,
  open,
  onOpenChange,
  onSuccess,
}: CreateClassDialogProps) {
  const [title, setTitle] = React.useState("");
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [durationMin, setDurationMin] = React.useState(60);
  const [trainerId, setTrainerId] = React.useState("");
  const [mode, setMode] = React.useState<DeliveryMode>(DeliveryMode.HYBRID);
  const [location, setLocation] = React.useState("");
  const [agendaNotes, setAgendaNotes] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const { data: trainers } = api.batch.getAvailableTrainers.useQuery(undefined, {
    enabled: open,
  });

  const utils = api.useUtils();

  const createClassMutation = api.schedule.createClass.useMutation({
    onSuccess: () => {
      utils.schedule.listByBatch.invalidate({ batchId });
      utils.batch.getById.invalidate({ id: batchId });
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
    setScheduledAt("");
    setDurationMin(60);
    setTrainerId("");
    setMode(DeliveryMode.HYBRID);
    setLocation("");
    setAgendaNotes("");
    setErrorMsg(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const selectedDate = new Date(scheduledAt);
    const bStart = new Date(batchStartDate);

    if (selectedDate < bStart) {
      setErrorMsg(`Class date cannot be earlier than batch start date (${bStart.toLocaleDateString()}).`);
      return;
    }

    if (batchEndDate) {
      const bEnd = new Date(batchEndDate);
      if (selectedDate > bEnd) {
        setErrorMsg(`Class date cannot be later than batch end date (${bEnd.toLocaleDateString()}).`);
        return;
      }
    }

    createClassMutation.mutate({
      batchId,
      title,
      scheduledAt: selectedDate,
      durationMin: Number(durationMin),
      trainerId: trainerId || undefined,
      mode,
      location: location.trim() || undefined,
      agendaNotes: agendaNotes.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Schedule Academic Class Session</DialogTitle>
        <DialogDescription>
          Plan a live class session, link faculty instructor, and set room or meeting link details.
        </DialogDescription>
      </DialogHeader>

      {errorMsg && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <Label htmlFor="class-title">Session Topic / Title *</Label>
          <Input
            id="class-title"
            required
            placeholder="e.g. Next.js 14 Server Actions & Form Mutations"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="class-datetime">Date & Time *</Label>
            <Input
              id="class-datetime"
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Batch: {new Date(batchStartDate).toLocaleDateString()}
              {batchEndDate ? ` to ${new Date(batchEndDate).toLocaleDateString()}` : ""}
            </p>
          </div>
          <div>
            <Label htmlFor="class-duration">Duration (Minutes) *</Label>
            <Input
              id="class-duration"
              type="number"
              required
              min={15}
              max={480}
              step={15}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="class-trainer">Session Instructor</Label>
            <select
              id="class-trainer"
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Select Instructor --</option>
              {trainers?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.firstName} {t.user.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="class-mode">Session Mode</Label>
            <select
              id="class-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as DeliveryMode)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="HYBRID">HYBRID</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="ONLINE">ONLINE</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="class-location">Location / Classroom / Live Meeting URL</Label>
          <Input
            id="class-location"
            placeholder="e.g. Lab 101 or https://meet.google.com/xyz-abcd"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="class-agenda">Session Agenda & Preparation Notes</Label>
          <textarea
            id="class-agenda"
            rows={2}
            placeholder="Key concepts, homework prerequisites, or reference links..."
            value={agendaNotes}
            onChange={(e) => setAgendaNotes(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createClassMutation.isPending}>
            {createClassMutation.isPending ? "Scheduling..." : "Schedule Session"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
