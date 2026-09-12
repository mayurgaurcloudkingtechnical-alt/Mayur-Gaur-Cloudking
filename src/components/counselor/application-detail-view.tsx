"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApplicationStage } from "@prisma/client";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { RazorpayCheckoutButton } from "@/components/payment/razorpay-checkout-button";

interface ApplicationDetailViewProps {
  applicationId: string;
  backHref?: string;
}

export function ApplicationDetailView({
  applicationId,
  backHref = "/counselor/admissions",
}: ApplicationDetailViewProps) {
  const [selectedStage, setSelectedStage] = useState<ApplicationStage>(ApplicationStage.UNDER_REVIEW);
  const [decisionReason, setDecisionReason] = useState("");
  const [stageError, setStageError] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: app, isLoading, error } = api.crm.getApplicationDetails.useQuery({ applicationId });

  const stageMutation = api.crm.updateApplicationStage.useMutation({
    onSuccess: () => {
      setStageError(null);
      setDecisionReason("");
      utils.crm.getApplicationDetails.invalidate({ applicationId });
    },
    onError: (err: { message?: string }) => {
      setStageError(err.message || "Failed to update application stage.");
    },
  });

  const convertMutation = api.crm.convertApplication.useMutation({
    onSuccess: () => {
      utils.crm.getApplicationDetails.invalidate({ applicationId });
    },
    onError: (err: { message?: string }) => {
      setStageError(err.message || "Conversion to student failed.");
    },
  });

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading application...</div>;
  }

  if (error || !app) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-sm text-red-700 border border-red-200">
        {error?.message || "Application not found or unauthorized."}
      </div>
    );
  }

  const handleStageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStageError(null);
    stageMutation.mutate({
      applicationId: app.id,
      stage: selectedStage,
      decisionReason: decisionReason.trim() || undefined,
    });
  };

  const handleConvert = () => {
    if (
      confirm(
        `Are you sure you want to officially convert ${app.applicantName} to an enrolled student? This will activate their student profile and course enrollment.`
      )
    ) {
      convertMutation.mutate({ applicationId: app.id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="text-xs text-slate-600">
          <Link href={backHref} className="flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Applications</span>
          </Link>
        </Button>
      </div>

      {/* Main Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 bg-white">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {app.applicationNumber}
                </span>
                <CardTitle className="text-xl font-bold text-slate-900 mt-2">{app.applicantName}</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Applied for <strong className="text-slate-700">{app.course.title}</strong>
                  {app.batch && <span> ({app.batch.code})</span>}
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className={
                  app.stage === ApplicationStage.APPROVED
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2.5 py-1"
                    : app.stage === ApplicationStage.CONVERTED
                    ? "bg-blue-50 text-blue-700 border-blue-200 text-xs px-2.5 py-1"
                    : app.stage === ApplicationStage.REJECTED
                    ? "bg-red-50 text-red-700 border-red-200 text-xs px-2.5 py-1"
                    : "bg-amber-50 text-amber-700 border-amber-200 text-xs px-2.5 py-1"
                }
              >
                {app.stage}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Email: <strong>{app.applicantEmail}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Phone: <strong>{app.applicantPhone}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Qualification: <strong>{app.highestQualification || "Not specified"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Location:{" "}
                  <strong>
                    {app.city ? `${app.city}, ${app.state || "UP"}` : "Not specified"}
                  </strong>
                </span>
              </div>
            </div>

            {app.decisionReason && (
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-amber-900 space-y-1">
                <p className="font-semibold">Review Decision Remarks:</p>
                <p className="whitespace-pre-wrap">{app.decisionReason}</p>
                {app.reviewer && (
                  <p className="text-[11px] text-amber-700 pt-1">
                    Evaluated by {app.reviewer.firstName} {app.reviewer.lastName}
                  </p>
                )}
              </div>
            )}

            {/* Conversion Success Card */}
            {app.convertedStudentProfile && (
              <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                  <UserCheck className="h-5 w-5 text-emerald-700" />
                  <span>Student Admission Formally Converted & Active</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Student Record ID: <strong className="font-mono text-emerald-950">{app.convertedStudentProfile.studentId}</strong>.
                  LMS access is enabled for target course: {app.course.title}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stage Review & Action Card */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">Admission Review Desk</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Audit-logged stage progression
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {stageError && (
              <div className="rounded bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                {stageError}
              </div>
            )}

            {app.stage === ApplicationStage.APPROVED && !app.convertedStudentProfile && (
              <div className="space-y-3 bg-emerald-50/50 p-3.5 rounded-lg border border-emerald-200">
                <div className="space-y-1">
                  <p className="font-bold text-emerald-950">Ready for Student Onboarding</p>
                  <p className="text-slate-600 text-[11px]">
                    Collect payment online via Razorpay or officially convert to enrolled student.
                  </p>
                </div>
                <div className="space-y-2">
                  <RazorpayCheckoutButton
                    applicationId={app.id}
                    courseTitle={app.course.title}
                    amountPaise={app.course.baseFee}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
                  />
                  <Button
                    onClick={handleConvert}
                    disabled={convertMutation.isPending}
                    variant="outline"
                    className="w-full border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-xs"
                  >
                    {convertMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      "Convert Directly (Offline/Scholarship)"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {app.stage !== ApplicationStage.CONVERTED && (
              <form onSubmit={handleStageSubmit} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Set Stage</Label>
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value as ApplicationStage)}
                    className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                  >
                    <option value={ApplicationStage.UNDER_REVIEW}>UNDER REVIEW</option>
                    <option value={ApplicationStage.APPROVED}>APPROVED</option>
                    <option value={ApplicationStage.RETURNED_FOR_INFORMATION}>
                      RETURNED FOR INFORMATION
                    </option>
                    <option value={ApplicationStage.REJECTED}>REJECTED</option>
                  </select>
                </div>

                {(selectedStage === ApplicationStage.REJECTED ||
                  selectedStage === ApplicationStage.RETURNED_FOR_INFORMATION) && (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Mandatory Reason <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      rows={3}
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      placeholder="Specify rejection or clarification requirement..."
                      required
                      className="flex w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  size="sm"
                  disabled={stageMutation.isPending}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs"
                >
                  {stageMutation.isPending ? "Updating Stage..." : "Apply Stage Change"}
                </Button>
              </form>
            )}

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <p>
                Originating Lead:{" "}
                <Link
                  href={`/counselor/leads/${app.lead.id}`}
                  className="font-bold text-emerald-700 underline"
                >
                  {app.lead.fullName}
                </Link>
              </p>
              <p>Submitted: {new Date(app.createdAt).toLocaleString("en-IN")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
