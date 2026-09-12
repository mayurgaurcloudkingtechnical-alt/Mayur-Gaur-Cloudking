"use client";

import * as React from "react";
import { useState } from "react";
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
import { Loader2 } from "lucide-react";

interface CreateApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  defaultCourseId?: string | null;
  onSuccess?: (appId: string) => void;
}

export function CreateApplicationDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadEmail,
  leadPhone,
  defaultCourseId,
  onSuccess,
}: CreateApplicationDialogProps) {
  const [courseId, setCourseId] = useState(defaultCourseId || "");
  const [applicantName, setApplicantName] = useState(leadName);
  const [applicantEmail, setApplicantEmail] = useState(leadEmail);
  const [applicantPhone, setApplicantPhone] = useState(leadPhone);
  const [highestQualification, setHighestQualification] = useState("");
  const [city, setCity] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: courses = [] } = api.crm.listPublicCourses.useQuery();

  React.useEffect(() => {
    if (defaultCourseId && !courseId) {
      setCourseId(defaultCourseId);
    }
  }, [defaultCourseId, courseId]);

  const createMutation = api.crm.createApplication.useMutation({
    onSuccess: (app) => {
      setErrorMsg(null);
      onOpenChange(false);
      if (onSuccess) onSuccess(app.id);
    },
    onError: (err: { message?: string }) => {
      setErrorMsg(err.message || "Failed to submit admission application.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      setErrorMsg("Please select the target training program.");
      return;
    }

    createMutation.mutate({
      leadId,
      courseId,
      applicantName: applicantName.trim(),
      applicantEmail: applicantEmail.trim(),
      applicantPhone: applicantPhone.trim(),
      highestQualification: highestQualification.trim() || undefined,
      city: city.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-3">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Generate Admission Application
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Initiates formal student admission processing. Does not prematurely grant LMS enrollment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          {errorMsg && (
            <div className="rounded bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Enrolling Program <span className="text-red-500">*</span>
            </Label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900"
            >
              <option value="">-- Choose Program --</option>
              {courses.map((c: { id: string; title: string }) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Applicant Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Contact Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Highest Qualification
              </Label>
              <Input
                placeholder="e.g. B.Tech CS, BCA, MCA"
                value={highestQualification}
                onChange={(e) => setHighestQualification(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">City / District</Label>
              <Input
                placeholder="e.g. Prayagraj"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Generating Application...
                </>
              ) : (
                "Create Application"
              )}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
}
