"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadStatus, LeadSource } from "@prisma/client";
import {
  Search,
  Clock,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  LayoutGrid,
  List,
  RefreshCw,
  Share2,
  Copy,
  Check,
  Zap,
  Globe,
  Radio,
  ExternalLink,
  GraduationCap,
} from "lucide-react";
import { CreateLeadDialog } from "./create-lead-dialog";
import { PipelineBoardView } from "./pipeline-board-view";
import { DirectAdmissionDialog } from "./direct-admission-dialog";

interface CounselorLeadsViewProps {
  basePath?: string;
  defaultDueToday?: boolean;
}

export function CounselorLeadsView({
  basePath = "/counselor/leads",
  defaultDueToday = false,
}: CounselorLeadsViewProps) {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [directAdmissionOpen, setDirectAdmissionOpen] = useState(false);
  const [selectedLeadForAdmission, setSelectedLeadForAdmission] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "ALL">("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [dueTodayOnly, setDueTodayOnly] = useState(defaultDueToday);
  const [page, setPage] = useState(1);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [testLeadFeedback, setTestLeadFeedback] = useState<string | null>(null);

  const utils = api.useUtils();

  const { data, isLoading, error, refetch, isFetching } = api.crm.listLeads.useQuery(
    {
      status: selectedStatus === "ALL" ? undefined : selectedStatus,
      source: selectedSource === "ALL" ? undefined : selectedSource,
      search: search.trim() || undefined,
      dueToday: dueTodayOnly || undefined,
      page,
      limit: 20,
    },
    {
      refetchInterval: 10000, // Real-time poll every 10s so new ads leads appear automatically
      refetchOnWindowFocus: true,
    }
  );

  const leads = data?.leads || [];
  const pagination = data?.pagination;

  // Compute counts for top chips
  const totalCount = pagination?.total ?? leads.length;

  const handleCopy = (text: string, type: "url" | "key") => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const handleSimulateGoogleLead = async () => {
    setTestLeadFeedback("Sending Google Ads test lead...");
    try {
      const res = await fetch("/api/webhooks/google-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_key: "slg_gads_sec_8923f7c1b4d09e",
          is_test: true,
          fullName: "Google Ads Live Prospect",
          phone: "+919876543210",
          email: "prospect@softlabglobal.com",
          city: "Prayagraj",
          course: "Cloud Computing & Cyber Security with AI",
          campaign_id: "Search_Campaign_IT_2026",
          form_id: "Form_40001",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestLeadFeedback("Google Ads Lead successfully ingested and appeared in CRM!");
        refetch();
        utils.crm.getStats.invalidate();
      } else {
        setTestLeadFeedback(`Error: ${data.message || "Failed to ingest"}`);
      }
    } catch (err: any) {
      setTestLeadFeedback(`Failed: ${err.message}`);
    }
    setTimeout(() => setTestLeadFeedback(null), 6000);
  };

  const renderSourceBadge = (source: LeadSource | string, campaignName?: string | null) => {
    switch (source) {
      case "GOOGLE_ADS":
      case "GOOGLE":
      case "GOOGLE_SEARCH":
        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-[#0088cc] border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0088cc] animate-pulse"></span>
              Google Ads
            </span>
            {campaignName && (
              <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]" title={campaignName}>
                {campaignName}
              </span>
            )}
          </div>
        );
      case "META_ADS_FB":
      case "META_ADS_IG":
      case "META":
        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              {source === "META_ADS_IG" ? "Instagram Ad" : "Meta FB Ad"}
            </span>
            {campaignName && (
              <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]" title={campaignName}>
                {campaignName}
              </span>
            )}
          </div>
        );
      case "WEBSITE":
      case "WEBSITE_CAREER_POPUP":
      case "CONTACT_FORM":
      case "COURSE_PAGE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Website Form
          </span>
        );
      case "JUSTDIAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            JustDial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {source}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Real-time Google Ads & Webhook Live Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Live Webhooks Active • Google Ads & Meta
              </span>
            </div>
            <p className="text-xs text-slate-200">
              Inbound prospect submissions from Google Search Ads, YouTube Lead Extensions & Meta are ingested immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleCopy("https://www.softlabglobal.com/api/webhooks/google-ads", "url")}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono px-2.5 py-1 rounded border border-white/20 transition-colors"
              title="Copy Google Webhook URL"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Webhook URL</span>
            </button>

            <button
              onClick={() => handleCopy("slg_gads_sec_8923f7c1b4d09e", "key")}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono px-2.5 py-1 rounded border border-white/20 transition-colors"
              title="Copy Google Key"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Google Key</span>
            </button>

            <Button
              size="sm"
              onClick={handleSimulateGoogleLead}
              className="bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-bold h-7 px-3 flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Test Google Lead</span>
            </Button>
          </div>
        </div>

        {testLeadFeedback && (
          <div className="mt-3 p-2 bg-emerald-500/20 border border-emerald-400/40 rounded text-xs text-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{testLeadFeedback}</span>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search candidate name, email, phone, or campaign..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Action Buttons & View Mode Toggle */}
            <div className="flex items-center gap-2">
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="text-xs h-9 px-3 border-slate-300"
                title="Refresh Realtime Leads"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isFetching ? "animate-spin text-[#0088cc]" : ""}`} />
                <span>Sync</span>
              </Button>

              {/* Due Today Quick Toggle */}
              <Button
                variant={dueTodayOnly ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setDueTodayOnly(!dueTodayOnly);
                  setPage(1);
                }}
                className={`text-xs font-semibold flex items-center gap-1.5 h-9 ${
                  dueTodayOnly ? "bg-amber-600 hover:bg-amber-700 text-white" : "border-slate-300"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Calls Due Today</span>
              </Button>

              {/* View Mode Toggle: Table / Kanban */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition ${
                    viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition ${
                    viewMode === "kanban" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Pipeline</span>
                </button>
              </div>

              {/* Add Lead Action Button */}
              <Button
                type="button"
                size="sm"
                onClick={() => setCreateLeadOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 h-9 shadow-xs"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Lead</span>
              </Button>
            </div>
          </div>

          {/* Lead Source / Channel Filter Chips */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Channel:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setSelectedSource("ALL");
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    selectedSource === "ALL"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Channels ({totalCount})
                </button>

                <button
                  onClick={() => {
                    setSelectedSource("GOOGLE_ALL");
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedSource === "GOOGLE_ALL"
                      ? "bg-[#0088cc] text-white shadow-sm ring-2 ring-blue-300"
                      : "bg-blue-50 text-[#0088cc] hover:bg-blue-100 border border-blue-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Google Ads</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedSource("META_ALL");
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedSource === "META_ALL"
                      ? "bg-indigo-700 text-white shadow-sm ring-2 ring-indigo-300"
                      : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Meta Ads (FB & IG)</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedSource("WEBSITE");
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedSource === "WEBSITE"
                      ? "bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-300"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  <Globe className="w-3 h-3 text-emerald-600" />
                  <span>Website Form</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedSource("WALK_IN");
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    selectedSource === "WALK_IN"
                      ? "bg-purple-700 text-white shadow-xs"
                      : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                  }`}
                >
                  Direct / Walk-In
                </button>
              </div>
            </div>

            {/* Status Filter Badges */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setSelectedStatus("ALL");
                    setPage(1);
                  }}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-colors ${
                    selectedStatus === "ALL"
                      ? "bg-slate-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Statuses
                </button>
                {Object.values(LeadStatus).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setSelectedStatus(st);
                      setPage(1);
                    }}
                    className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-colors ${
                      selectedStatus === st
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === "kanban" ? (
        <PipelineBoardView />
      ) : (
        /* Leads Table */
        <Card className="border-slate-200 bg-white">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>Prospect Records</span>
              {pagination && (
                <span className="text-xs font-normal text-slate-400">({pagination.total} total)</span>
              )}
            </CardTitle>
            <span className="text-[11px] text-slate-400 font-mono">
              Auto-sync active (10s)
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading prospects...</div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-red-600">{error.message}</div>
            ) : leads.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No prospect records found</p>
                <p className="text-slate-400 text-xs">
                  {selectedSource !== "ALL"
                    ? `No leads found under channel ${selectedSource}. Try clearing the channel filter or clicking "Test Google Lead" above.`
                    : "No records match the active search and filter criteria."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                      <th className="py-2.5 px-4 font-semibold">Candidate</th>
                      <th className="py-2.5 px-3 font-semibold">Source / Campaign</th>
                      <th className="py-2.5 px-3 font-semibold">Contact</th>
                      <th className="py-2.5 px-3 font-semibold">Course Interest</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold">Next Follow-Up</th>
                      <th className="py-2.5 px-3 font-semibold">Counselor</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((lead: any) => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{lead.fullName}</div>
                          <div className="text-[11px] text-slate-400">
                            {lead.city ? `${lead.city} • ` : ""}
                            {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {renderSourceBadge(lead.source, lead.campaignName)}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          <div className="font-mono font-medium">{lead.phone}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{lead.email}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {lead.course?.title || <span className="text-slate-400 italic">General Inquiry</span>}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant="secondary"
                            className={
                              lead.status === LeadStatus.NEW
                                ? "bg-blue-50 text-blue-700 border-blue-200 text-[11px]"
                                : lead.status === LeadStatus.ADMITTED
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]"
                                : lead.status === LeadStatus.INTERESTED
                                ? "bg-purple-50 text-purple-700 border-purple-200 text-[11px]"
                                : "bg-slate-100 text-slate-700 border-slate-200 text-[11px]"
                            }
                          >
                            {lead.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {lead.nextFollowUp ? (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Clock className="h-3 w-3 text-amber-600" />
                              {new Date(lead.nextFollowUp).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">None scheduled</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px]">
                          {lead.assignedTo ? (
                            <span className="font-medium text-slate-800">
                              {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button asChild size="sm" variant="outline" className="h-7 text-xs border-slate-300">
                              <Link href={`${basePath}/${lead.id}`}>View & Log</Link>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedLeadForAdmission(lead);
                                setDirectAdmissionOpen(true);
                              }}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 shadow-xs"
                            >
                              <GraduationCap className="h-3 w-3" />
                              <span>{lead.status === "ADMITTED" ? "Manage" : "Admit"}</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Lead Modal */}
      <CreateLeadDialog
        open={createLeadOpen}
        onOpenChange={setCreateLeadOpen}
      />

      {/* Unified Direct Admission & Fee Collection Modal */}
      <DirectAdmissionDialog
        open={directAdmissionOpen}
        onOpenChange={setDirectAdmissionOpen}
        initialLeadId={selectedLeadForAdmission?.id}
        initialLead={selectedLeadForAdmission}
        onSuccess={() => {
          refetch();
          utils.crm.getStats.invalidate();
        }}
      />
    </div>
  );
}
