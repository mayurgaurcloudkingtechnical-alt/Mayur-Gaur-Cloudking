"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { api } from "@/lib/trpc/react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApplicationStage } from "@prisma/client";
import { Loader2, Edit3, User, Mail, Phone, MapPin, GraduationCap } from "lucide-react";

interface EditApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: {
    id: string;
    applicationNumber: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    city?: string | null;
    state?: string | null;
    highestQualification?: string | null;
    courseId: string;
    batchId?: string | null;
    stage: ApplicationStage;
  } | null;
  onSuccess?: () => void;
}

export function EditApplicationDialog({
  open,
  onOpenChange,
  application,
  onSuccess,
}: EditApplicationDialogProps) {
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [highestQualification, setHighestQualification] = useState("");
  const [batchId, setBatchId] = useState<string>("");
  const [stage, setStage] = useState<ApplicationStage>(ApplicationStage.UNDER_REVIEW);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const utils = api.useUtils();

  const { data: batchesData } = api.batch.list.useQuery(
    { courseId: application?.courseId, pageSize: 50 },
    { enabled: !!application?.courseId && open }
  );
  const batches = batchesData?.batches || [];

  useEffect(() => {
    if (application) {
      setApplicantName(application.applicantName || "");
      setApplicantEmail(application.applicantEmail || "");
      setApplicantPhone(application.applicantPhone || "");
      setCity(application.city || "");
      setState(application.state || "");
      setHighestQualification(application.highestQualification || "");
      setBatchId(application.batchId || "");
      setStage(application.stage);
      setErrorMsg(null);
    }
  }, [application]);

  const updateMutation = api.crm.updateApplication.useMutation({
    onSuccess: () => {
      setErrorMsg(null);
      utils.crm.listApplications.invalidate();
      utils.crm.getApplicationDetails.invalidate();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to update application.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    const cleanPhone = applicantPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please provide a valid 10-digit mobile number.");
      return;
    }

    updateMutation.mutate({
      applicationId: application.id,
      applicantName: applicantName.trim(),
      applicantEmail: applicantEmail.trim(),
      applicantPhone: cleanPhone,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      highestQualification: highestQualification.trim() || undefined,
      batchId: batchId || null,
      stage,
    });
  };

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-3">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-emerald-600" />
            <span>Edit Application: {application.applicationNumber}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Update candidate contact coordinates, qualification, or allocated cohort.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <User className="h-3 w-3 text-slate-400" />
                <span>Applicant Name</span>
              </Label>
              <Input
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Mail className="h-3 w-3 text-slate-400" />
                <span>Email Address</span>
              </Label>
              <Input
                type="email"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" />
                <span>Phone Number</span>
              </Label>
              <Input
                type="tel"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <GraduationCap className="h-3 w-3 text-slate-400" />
                <span>Assigned Cohort / Batch</span>
              </Label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
              >
                <option value="">-- None / Unassigned --</option>
                {batches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.code} ({b.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Qualification</Label>
              <Input
                value={highestQualification}
                onChange={(e) => setHighestQualification(e.target.value)}
                placeholder="e.g. B.Tech CS"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span>City</span>
              </Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Admission Stage</Label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ApplicationStage)}
                className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
              >
                {Object.values(ApplicationStage).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Application"
              )}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
}