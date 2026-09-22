"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadStatus, LeadSource } from "@prisma/client";
import {
  Phone,
  MessageSquare,
  Clock,
  User,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { DirectAdmissionDialog } from "./direct-admission-dialog";

interface PipelineBoardViewProps {
  courseId?: string;
  onSelectLead?: (leadId: string) => void;
}

const STAGE_CONFIG: Array<{
  status: LeadStatus;
  label: string;
  color: string;
  borderColor: string;
  headerBg: string;
}> = [
  { status: LeadStatus.NEW, label: "New Leads", color: "text-blue-700", borderColor: "border-blue-300", headerBg: "bg-blue-50" },
  { status: LeadStatus.CONTACTED, label: "Contacted", color: "text-cyan-700", borderColor: "border-cyan-300", headerBg: "bg-cyan-50" },
  { status: LeadStatus.FOLLOW_UP, label: "Follow-Up Queue", color: "text-amber-700", borderColor: "border-amber-300", headerBg: "bg-amber-50" },
  { status: LeadStatus.INTERESTED, label: "High Interest", color: "text-purple-700", borderColor: "border-purple-300", headerBg: "bg-purple-50" },
  { status: LeadStatus.DEMO, label: "Demo Attended", color: "text-indigo-700", borderColor: "border-indigo-300", headerBg: "bg-indigo-50" },
  { status: LeadStatus.NEGOTIATION, label: "Fee / Closing", color: "text-rose-700", borderColor: "border-rose-300", headerBg: "bg-rose-50" },
  { status: LeadStatus.ADMITTED, label: "Admitted & Converted", color: "text-emerald-700", borderColor: "border-emerald-300", headerBg: "bg-emerald-50" },
  { status: LeadStatus.LOST, label: "Lost / Closed", color: "text-slate-600", borderColor: "border-slate-300", headerBg: "bg-slate-100" },
];

export function PipelineBoardView({ courseId }: PipelineBoardViewProps) {
  const [targetLeadForAdmission, setTargetLeadForAdmission] = useState<any | null>(null);
  const [admissionOpen, setAdmissionOpen] = useState(false);

  const utils = api.useUtils();
  const { data, isLoading, error } = api.crm.getPipelineOverview.useQuery({ courseId });

  const updateStageMutation = api.crm.updateLeadStage.useMutation({
    onSuccess: () => {
      utils.crm.getPipelineOverview.invalidate();
      utils.crm.listLeads.invalidate();
      utils.crm.getStats.invalidate();
    },
  });

  const stages = data?.stages;
  const counts = data?.counts;

  const handleStageChange = (leadId: string, newStage: LeadStatus) => {
    updateStageMutation.mutate({ leadId, stage: newStage });
  };

  const getSourceBadge = (source: LeadSource) => {
    switch (source) {
      case LeadSource.JUSTDIAL:
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-[10px] py-0 px-1.5">Justdial</Badge>;
      case LeadSource.META_ADS_FB:
      case LeadSource.META_ADS_IG:
      case LeadSource.META:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] py-0 px-1.5">Meta Ads</Badge>;
      case LeadSource.GOOGLE_ADS:
      case LeadSource.GOOGLE_SEARCH:
      case LeadSource.GOOGLE:
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px] py-0 px-1.5">Google Ads</Badge>;
      case LeadSource.WHATSAPP:
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] py-0 px-1.5">WhatsApp</Badge>;
      case LeadSource.WALK_IN:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] py-0 px-1.5">Walk-in</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] py-0 px-1.5">Website</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        <Sparkles className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
        <span>Loading Admissions & Lead Pipeline Board...</span>
      </div>
    );
  }

  if (error || !stages) {
    return (
      <div className="p-6 text-center text-xs text-red-600 bg-red-50 rounded-lg border border-red-200">
        {error?.message || "Failed to load pipeline stages."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Horizontal Scrolling Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x">
        {STAGE_CONFIG.map((col) => {
          const columnLeads = stages[col.status] || [];
          const count = counts?.[col.status] || 0;

          return (
            <div
              key={col.status}
              className="flex-shrink-0 w-80 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col max-h-[750px] snap-start shadow-sm"
            >
              {/* Column Header */}
              <div className={`p-3 border-b ${col.borderColor} ${col.headerBg} rounded-t-xl flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${col.color}`}>{col.label}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-slate-700 shadow-xs">
                    {count}
                  </span>
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                {columnLeads.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400 italic">
                    No leads in this stage
                  </div>
                ) : (
                  columnLeads.map((lead: any) => {
                    const isOverdue =
                      lead.nextFollowUp && new Date(lead.nextFollowUp) <= new Date();

                    return (
                      <Card
                        key={lead.id}
                        className="p-3 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all rounded-lg space-y-2"
                      >
                        {/* Header: Name & Source */}
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <Link
                              href={`/counselor/leads/${lead.id}`}
                              className="text-xs font-bold text-slate-900 hover:text-emerald-600 transition"
                            >
                              {lead.fullName}
                            </Link>
                            <div className="text-[11px] text-slate-500">{lead.city || "Prayagraj"}</div>
                          </div>
                          {getSourceBadge(lead.source)}
                        </div>

                        {/* Course Interest */}
                        <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center justify-between">
                          <span className="truncate">{lead.course?.title || "General Prospect"}</span>
                        </div>

                        {/* Follow-up / Overdue Indicator */}
                        {lead.nextFollowUp && (
                          <div
                            className={`flex items-center gap-1 text-[10px] font-medium ${
                              isOverdue ? "text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded" : "text-slate-500"
                            }`}
                          >
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>
                              Follow-up:{" "}
                              {new Date(lead.nextFollowUp).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        )}

                        {/* Quick Contact & Action Buttons */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            {/* Click to Call */}
                            <a
                              href={`tel:${lead.phone}`}
                              title={`Call ${lead.phone}`}
                              className="p-1.5 rounded-md bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-700 transition"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>

                            {/* WhatsApp Direct */}
                            <a
                              href={`https://wa.me/91${lead.phone.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(
                                lead.fullName
                              )},%20greetings%20from%20SOFTLAB%20GLOBAL.`}
                              target="_blank"
                              rel="noreferrer"
                              title="Message on WhatsApp"
                              className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 transition"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </a>

                            {/* Direct Admission Button */}
                            {col.status !== LeadStatus.ADMITTED && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetLeadForAdmission(lead);
                                  setAdmissionOpen(true);
                                }}
                                title="Create Admission Application"
                                className="p-1.5 rounded-md bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 transition"
                              >
                                <GraduationCap className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Stage Transition Selector */}
                          <select
                            value={lead.status}
                            onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStatus)}
                            disabled={updateStageMutation.isPending}
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {STAGE_CONFIG.map((s) => (
                              <option key={s.status} value={s.status}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Direct Admission Modal Triggered from Card */}
      {targetLeadForAdmission && (
        <DirectAdmissionDialog
          open={admissionOpen}
          onOpenChange={(open) => {
            setAdmissionOpen(open);
            if (!open) setTargetLeadForAdmission(null);
          }}
          initialLeadId={targetLeadForAdmission?.id}
          initialLead={targetLeadForAdmission}
          onSuccess={() => {
            utils.crm.getPipelineOverview.invalidate();
          }}
        />
      )}
    </div>
  );
}
