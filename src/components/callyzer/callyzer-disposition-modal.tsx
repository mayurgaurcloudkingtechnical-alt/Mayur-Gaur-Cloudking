"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface CallyzerDispositionModalProps {
  lead: any;
  callDurationSeconds?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function CallyzerDispositionModal({
  lead,
  callDurationSeconds = 0,
  onClose,
  onSuccess,
}: CallyzerDispositionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">
          Call Disposition: {lead?.fullName || "Lead"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Duration: {callDurationSeconds}s
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSuccess}>
            Save Disposition
          </Button>
        </div>
      </div>
    </div>
  );
}
