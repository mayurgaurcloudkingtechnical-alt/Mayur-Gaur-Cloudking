"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  Users,
  AlertCircle,
  CheckCircle2,
  Phone,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { LeadStatus } from "@prisma/client";

interface TransferLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  leadPhone?: string;
  currentCounselorName?: string | null;
  onSuccess?: () => void;
}

export function TransferLeadDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadPhone,
  currentCounselorName,
  onSuccess,
}: TransferLeadDialogProps) {
  const [selectedCounselorId, setSelectedCounselorId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: staffList = [], isLoading: isLoadingStaff } = api.crm.listCounselors.useQuery(undefined, {
    enabled: open,
  });

  // Filter to active COUNSELOR role users
  const eligibleCounselors = staffList.filter(
    (s) => s.roleCode === "COUNSELOR"
  );

  const transferMutation = api.crm.transferLeadToCounselor.useMutation({
    onSuccess: (res) => {
      setErrorMsg(null);
      setSuccessMsg(res.message);
      utils.crm.listLeads.invalidate();
      utils.crm.getLeadDetails.invalidate({ leadId });
      utils.crm.getStats.invalidate();
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccessMsg(null);
        setTransferReason("");
        setSelectedCounselorId("");
        onOpenChange(false);
      }, 1500);
    },
    onError: (err) => {
      setSuccessMsg(null);
      setErrorMsg(err.message || "Failed to transfer lead.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCounselorId) {
      setErrorMsg("Please select an active Academic Counselor from the directory.");
      return;
    }

    if (!transferReason.trim() || transferReason.trim().length < 3) {
      setErrorMsg("Please enter a valid transfer/handover reason (at least 3 characters).");
      return;
    }

    transferMutation.mutate({
      leadId,
      counselorId: selectedCounselorId,
      transferReason: transferReason.trim(),
    });
  };

  const handleClose = () => {
    if (!transferMutation.isPending) {
      setErrorMsg(null);
      setSuccessMsg(null);
      onOpenChange(false);
    }
  };

  const selectedCounselor = eligibleCounselors.find((c) => c.id === selectedCounselorId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-6 bg-white border border-slate-200 shadow-xl rounded-xl">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Transfer Lead to Counselor
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Hand over qualified candidate to an assigned Academic Counselor.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Lead Summary Header */}
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Candidate:</span>
            <span className="font-bold text-slate-900">{leadName}</span>
          </div>
          {leadPhone && (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Mobile:</span>
              <span className="font-mono text-slate-700">{leadPhone}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Current Assignee:</span>
            <span className="text-slate-700">
              {currentCounselorName || "Unassigned / Telecaller Queue"}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Select Active Counselor *</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {eligibleCounselors.length} active in directory
              </span>
            </label>

            {isLoadingStaff ? (
              <div className="h-9 w-full bg-slate-100 animate-pulse rounded-md" />
            ) : eligibleCounselors.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                No active counselors found in staff directory.
              </div>
            ) : (
              <select
                value={selectedCounselorId}
                onChange={(e) => setSelectedCounselorId(e.target.value)}
                disabled={transferMutation.isPending}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">-- Choose Academic Counselor --</option>
                {eligibleCounselors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} • ({c.activeLeadsCount ?? 0} active leads)
                  </option>
                ))}
              </select>
            )}

            {selectedCounselor && (
              <div className="mt-2 p-2 bg-indigo-50/60 rounded border border-indigo-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-indigo-900">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                  <span>
                    Counselor: <strong>{selectedCounselor.firstName} {selectedCounselor.lastName}</strong>
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-white border-indigo-200 text-indigo-700">
                  {selectedCounselor.activeLeadsCount ?? 0} Active Leads
                </Badge>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Handover Notes / Transfer Reason *
            </label>
            <textarea
              placeholder="e.g. Candidate qualified during discovery call. Interested in Python Full Stack offline weekend batch. Demo scheduling required."
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              disabled={transferMutation.isPending}
              className="w-full h-24 rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">
              This note will be permanently recorded in the lead activity history and notified to the counselor.
            </p>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={transferMutation.isPending}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={transferMutation.isPending || !selectedCounselorId || !transferReason.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 font-semibold flex items-center gap-1.5"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{transferMutation.isPending ? "Transferring..." : "Confirm Transfer"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
