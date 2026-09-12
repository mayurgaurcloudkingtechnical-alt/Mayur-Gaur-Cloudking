"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/react";
import { DeliveryMode } from "@prisma/client";

interface BatchToEdit {
  id: string;
  name: string;
  code: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  maxCapacity: number;
  deliveryMode: DeliveryMode;
  location?: string | null;
  trainers?: Array<{
    trainerId: string;
    isPrimary: boolean;
  }>;
}

interface EditBatchDialogProps {
  batch: BatchToEdit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditBatchDialog({ batch, open, onOpenChange, onSuccess }: EditBatchDialogProps) {
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [maxCapacity, setMaxCapacity] = React.useState(30);
  const [deliveryMode, setDeliveryMode] = React.useState<DeliveryMode>(DeliveryMode.HYBRID);
  const [location, setLocation] = React.useState("");
  const [primaryTrainerId, setPrimaryTrainerId] = React.useState("");
  const [secondaryTrainerIds, setSecondaryTrainerIds] = React.useState<string[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const { data: trainers } = api.batch.getAvailableTrainers.useQuery(undefined, {
    enabled: open,
  });

  const utils = api.useUtils();

  React.useEffect(() => {
    if (batch) {
      setName(batch.name);
      setCode(batch.code);
      setStartDate(
        batch.startDate
          ? new Date(batch.startDate).toISOString().split("T")[0]
          : ""
      );
      setEndDate(
        batch.endDate
          ? new Date(batch.endDate).toISOString().split("T")[0]
          : ""
      );
      setMaxCapacity(batch.maxCapacity);
      setDeliveryMode(batch.deliveryMode);
      setLocation(batch.location || "");

      const primary = batch.trainers?.find((t) => t.isPrimary);
      setPrimaryTrainerId(primary ? primary.trainerId : "");
      setSecondaryTrainerIds(
        batch.trainers
          ? batch.trainers.filter((t) => !t.isPrimary).map((t) => t.trainerId)
          : []
      );
      setErrorMsg(null);
    }
  }, [batch]);

  const updateMutation = api.batch.update.useMutation({
    onSuccess: () => {
      utils.batch.list.invalidate();
      if (batch) utils.batch.getById.invalidate({ id: batch.id });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!batch) return;
    setErrorMsg(null);

    updateMutation.mutate({
      id: batch.id,
      name,
      code,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      maxCapacity: Number(maxCapacity),
      deliveryMode,
      location: location.trim() || undefined,
      primaryTrainerId: primaryTrainerId || undefined,
      secondaryTrainerIds: secondaryTrainerIds.length > 0 ? secondaryTrainerIds : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Edit Academic Batch</DialogTitle>
        <DialogDescription>
          Update batch cohort timeline, seat capacity, delivery configuration, and faculty allocations.
        </DialogDescription>
      </DialogHeader>

      {errorMsg && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="edit-batch-name">Batch Name *</Label>
            <Input
              id="edit-batch-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="edit-batch-code">Batch Code *</Label>
            <Input
              id="edit-batch-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 font-mono text-xs uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="edit-batch-start">Start Date *</Label>
            <Input
              id="edit-batch-start"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="edit-batch-end">Estimated End Date</Label>
            <Input
              id="edit-batch-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="edit-batch-capacity">Max Capacity *</Label>
            <Input
              id="edit-batch-capacity"
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
            <Label htmlFor="edit-batch-mode">Delivery Mode</Label>
            <select
              id="edit-batch-mode"
              value={deliveryMode}
              onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="HYBRID">HYBRID</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="ONLINE">ONLINE</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="edit-batch-location">Location / Classroom / Meeting URL</Label>
          <Input
            id="edit-batch-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1"
          />
        </div>

        {trainers && trainers.length > 0 && (
          <div>
            <Label htmlFor="edit-batch-primary-trainer">Primary Faculty Lead</Label>
            <select
              id="edit-batch-primary-trainer"
              value={primaryTrainerId}
              onChange={(e) => setPrimaryTrainerId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- None assigned --</option>
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
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving Changes..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
