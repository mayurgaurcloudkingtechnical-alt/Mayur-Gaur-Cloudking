"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Calendar, Clock, FilePlus, MessageSquare, History, ShieldAlert } from "lucide-react";
import { LeadStatus, FollowUpType } from "@prisma/client";
import { LogFollowUpDialog } from "./log-follow-up-dialog";
import { CreateApplicationDialog } from "./create-application-dialog";

interface LeadDetailViewProps {
  leadId: string;
  canAssign?: boolean;
}

export function LeadDetailView({ leadId, canAssign = false }: LeadDetailViewProps) {
  const [logOpen, setLogOpen] = useState(false);
  const [appOpen, setAppOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const utils = api.useUtils();
  const { data, isLoading, error } = api.crm.getLeadDetails.useQuery({ leadId });
  const { data: staffList = [] } = api.crm.listCounselors.useQuery(undefined, {
    enabled: canAssign,
  });

  const assignMutation = api.crm.assignLead.useMutation({
    onSuccess: () => {
      utils.crm.getLeadDetails.invalidate({ leadId });
    },
  });

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading lead profile...</div>;
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-sm text-red-700 border border-red-200">
        {error?.message || "Lead record could not be loaded or access was denied."}
      </div>
    );
  }

  const { lead, potentialDuplicates } = data;

  const handleAssign = (newStaffId: string) => {
    assignMutation.mutate({
      leadId: lead.id,
      assignedToId: newStaffId === "UNASSIGNED" ? null : newStaffId,
    });
  };

  const followUpLabels: Record<FollowUpType, string> = {
    [FollowUpType.CALL]: "Phone Conversation",
    [FollowUpType.MESSAGE]: "Message Exchange",
    [FollowUpType.COUNSELLING_SESSION]: "In-person / Video Counseling",
    [FollowUpType.STATUS_CHANGE]: "Status Change",
    [FollowUpType.NOTE]: "Counseling Note",
  };

  return (
    <div className="space-y-6">
      {/* Duplicate Warning Alert */}
      {potentialDuplicates.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-amber-950">
                Potential Duplicate Inquiries Detected ({potentialDuplicates.length})
              </p>
              <p className="text-amber-800">
                Other leads exist in the database with matching telephone or email address:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-900">
                {potentialDuplicates.map((dup) => (
                  <li key={dup.id}>
                    <Link href={`/counselor/leads/${dup.id}`} className="font-semibold underline hover:text-amber-950">
                      {dup.fullName}
                    </Link>{" "}
                    ({dup.phone} • {dup.email}) — Status: <strong>{dup.status}</strong> • Assigned to:{" "}
                    {dup.assignedTo ? `${dup.assignedTo.firstName} ${dup.assignedTo.lastName}` : "Unassigned"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Primary Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 bg-white">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">{lead.fullName}</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Inquiry Source: <strong className="text-slate-700">{lead.source}</strong> • Captured on{" "}
                  {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </CardDescription>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 font-bold uppercase">
                {lead.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{lead.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{lead.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{lead.city || "City not specified"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Interested:{" "}
                  <strong className="text-slate-900">
                    {lead.course ? lead.course.title : "Not specified"}
                  </strong>
                </span>
              </div>
            </div>

            {lead.notes && (
              <div className="rounded-md bg-slate-50 p-3.5 border border-slate-200">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Applicant Initial Note / Inquiry Message:
                </p>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="sm"
                onClick={() => setLogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Log Interaction / Call</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAppOpen(true)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
              >
                <FilePlus className="h-3.5 w-3.5 text-emerald-600" />
                <span>Generate Admission Application</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ownership & Schedule Card */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">Counseling Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <p className="text-slate-500">Assigned Counselor / Staff:</p>
              <p className="font-bold text-slate-900 text-sm">
                {lead.assignedTo
                  ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                  : "Unassigned Queue"}
              </p>
              {lead.assignedTo?.email && (
                <p className="text-[11px] text-slate-400">{lead.assignedTo.email}</p>
              )}
            </div>

            {canAssign && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  Reassign Lead:
                </label>
                <select
                  value={selectedStaffId || lead.assignedToId || "UNASSIGNED"}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value);
                    handleAssign(e.target.value);
                  }}
                  disabled={assignMutation.isPending}
                  className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                >
                  <option value="UNASSIGNED">-- Unassign --</option>
                  {staffList.map((s: { id: string; firstName: string; lastName: string; roleCode: string }) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.roleCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <p className="text-slate-500">Next Follow-Up Schedule:</p>
              {lead.nextFollowUp ? (
                <div className="flex items-center gap-1.5 font-bold text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>
                    {new Date(lead.nextFollowUp).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ) : (
                <p className="text-slate-400 italic">No scheduled follow-up</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interaction Timeline Card */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base font-bold text-slate-900">
                Counselling & Outreach History ({lead.followUps.length})
              </CardTitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLogOpen(true)}
              className="text-xs h-7 border-slate-200"
            >
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lead.followUps.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">
              No follow-up interaction has been logged yet for this applicant.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {lead.followUps.map((fu) => (
                <div key={fu.id} className="py-3.5 space-y-1 text-xs first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      {followUpLabels[fu.type] || fu.type}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(fu.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{fu.notes}</p>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Logged by {fu.performedBy.firstName} {fu.performedBy.lastName} ({fu.performedBy.roleCode})
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Associated Applications */}
      {lead.applications.length > 0 && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900">
              Admission Applications ({lead.applications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {lead.applications.map((app) => (
                <div key={app.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{app.applicationNumber}</span>
                    <span className="text-slate-500 ml-2">— {app.course.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-[11px]">
                      {app.stage}
                    </Badge>
                    <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-emerald-700">
                      <Link href={`/counselor/admissions/${app.id}`}>View Application</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <LogFollowUpDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        leadId={lead.id}
        leadName={lead.fullName}
        currentStatus={lead.status}
        onSuccess={() => utils.crm.getLeadDetails.invalidate({ leadId })}
      />

      <CreateApplicationDialog
        open={appOpen}
        onOpenChange={setAppOpen}
        leadId={lead.id}
        leadName={lead.fullName}
        leadEmail={lead.email}
        leadPhone={lead.phone}
        defaultCourseId={lead.interestedCourseId}
        onSuccess={() => utils.crm.getLeadDetails.invalidate({ leadId })}
      />
    </div>
  );
}
