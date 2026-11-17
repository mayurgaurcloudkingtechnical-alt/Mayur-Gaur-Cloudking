"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface CallyzerCommunicationDrawerProps {
  lead: any;
  onClose: () => void;
}

export function CallyzerCommunicationDrawer({
  lead,
  onClose,
}: CallyzerCommunicationDrawerProps) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white p-6 shadow-2xl border-l border-slate-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900">
          Communications: {lead?.fullName || "Lead"}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>
      <div className="mt-4 text-sm text-slate-600">
        <p>Phone: {lead?.phone || "N/A"}</p>
        <p className="mt-1">Status: {lead?.status || "NEW"}</p>
      </div>
    </div>
  );
}
