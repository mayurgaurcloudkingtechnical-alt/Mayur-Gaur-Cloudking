"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/react";
import { DeliveryMode, BatchStatus } from "@prisma/client";

interface CreateBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCourseId?: string;
  onSuccess?: () => void;
}

export function CreateBatchDialog({
  open,
  onOpenChange,
  defaultCourseId,
  onSuccess,
}: CreateBatchDialogProps) {
  const [courseId, setCourseId] = React.useState(defaultCourseId || "");
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [autoCode, setAutoCode] = React.useState(true);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [maxCapacity, setMaxCapacity] = React.useState(30);
  const [deliveryMode, setDeliveryMode] = React.useState<DeliveryMode>(DeliveryMode.HYBRID);
  const [location, setLocation] = React.useState("");
  const [status, setStatus] = React.useState<BatchStatus>(BatchStatus.OPEN_FOR_ENROLLMENT);
  const [primaryTrainerId, setPrimaryTrainerId] = React.useState<string>("");
  const [secondaryTrainerIds, setSecondaryTrainerIds] = React.useState<string[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const { data: coursesData } = api.course.list.useQuery(
    { pageSize: 50 },
    { enabled: open }
  );
  const { data: trainers } = api.batch.getAvailableTrainers.useQuery(undefined, {
    enabled: open,
  });

  const utils = api.useUtils();

  React.useEffect(() => {
    if (defaultCourseId) setCourseId(defaultCourseId);
  }, [defaultCourseId]);

  React.useEffect(() => {
    if (autoCode && courseId && startDate && coursesData?.courses) {
      const course = coursesData.courses.find((c) => c.id === courseId);
      if (course) {
        const prefix = course.slug.split("-")[0].toUpperCase();
        const year = new Date(startDate).getFullYear() || new Date().getFullYear();
        setCode(`${prefix}-${year}-B1`);
      }
    }
  }, [courseId, startDate, autoCode, coursesData]);

  const createMutation = api.batch.create.useMutation({
    onSuccess: () => {
      utils.batch.list.invalidate();
      onOpenChange(false);
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  function resetForm() {
    setName("");
    setCode("");
    setAutoCode(true);
    setStartDate("");
    setEndDate("");
    setMaxCapacity(30);
    setDeliveryMode(DeliveryMode.HYBRID);
    setLocation("");
    setStatus(BatchStatus.OPEN_FOR_ENROLLMENT);
    setPrimaryTrainerId("");
    setSecondaryTrainerIds([]);
    setErrorMsg(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!courseId) {
      setErrorMsg("Please select an academic course.");
      return;
    }

    if (!startDate) {
      setErrorMsg("Please select a batch start date.");
      return;
    }

    createMutation.mutate({
      courseId,
      code: code.trim() || undefined,
      name,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      maxCapacity: Number(maxCapacity),
      deliveryMode,
      location: location.trim() || undefined,
      status,
      primaryTrainerId: primaryTrainerId || undefined,
      secondaryTrainerIds: secondaryTrainerIds.length > 0 ? secondaryTrainerIds : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Create Academic Batch</DialogTitle>
        <DialogDescription>
          Launch a new cohort linked to a course catalog offering with trainer assignment.
        </DialogDescription>
      </DialogHeader>

      {errorMsg && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <Label htmlFor="batch-course">Select Course *</Label>
          <select
            id="batch-course"
            required
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">-- Choose an academic course --</option>
            {coursesData?.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.durationWeeks} wks • ₹{(c.baseFee / 100).toLocaleString("en-IN")})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="batch-name">Batch Name *</Label>
            <Input
              id="batch-name"
              required
              placeholder="e.g. Cohort Alpha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="batch-code">Batch Code *</Label>
            <Input
              id="batch-code"
              required
              placeholder="FSWD-2026-B1"
              value={code}
              onChange={(e) => {
                setAutoCode(false);
                setCode(e.target.value);
              }}
              className="mt-1 font-mono text-xs uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="batch-start">Start Date *</Label>
            <Input
              id="batch-start"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="batch-end">Estimated End Date</Label>
            <Input
              id="batch-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="batch-capacity">Max Capacity *</Label>
            <Input
              id="batch-capacity"
              type="number"
              required
              min={1}
              max={500}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="batch-mode">Delivery Mode</Label>
            <select
              id="batch-mode"
              value={deliveryMode}
              onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="HYBRID">HYBRID</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="ONLINE">ONLINE</option>
            </select>
          </div>
          <div>
            <Label htmlFor="batch-status">Lifecycle Status</Label>
            <select
              id="batch-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as BatchStatus)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="OPEN_FOR_ENROLLMENT">OPEN FOR ENROLLMENT</option>
              <option value="ONGOING">ONGOING</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="batch-location">Location / Classroom / Meeting URL</Label>
          <Input
            id="batch-location"
            placeholder="e.g. Campus Lab 101 or https://meet.google.com/xyz"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1"
          />
        </div>

        {trainers && trainers.length > 0 && (
          <div>
            <Label htmlFor="batch-primary-trainer">Primary Faculty Lead</Label>
            <select
              id="batch-primary-trainer"
              value={primaryTrainerId}
              onChange={(e) => setPrimaryTrainerId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Select primary instructor --</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.firstName} {t.user.lastName} ({t.user.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating Batch..." : "Create Batch"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
