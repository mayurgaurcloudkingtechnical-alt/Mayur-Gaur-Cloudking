"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadStatus, FollowUpType } from "@prisma/client";
import {
  Building2,
  Search,
  RefreshCw,
  PhoneCall,
  MessageSquare,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
  Layers,
  X,
  ChevronRight,
  UserCheck,
  Send,
  Loader2,
  Eye,
  FileText,
  ShieldAlert,
} from "lucide-react";

const PIPELINE_STATUSES: Array<{ key: LeadStatus; label: string; color: string }> = [
  { key: LeadStatus.NEW, label: "New Application", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: LeadStatus.CONTACTED, label: "Contacted", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { key: LeadStatus.DISCUSSION, label: "In Discussion", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { key: LeadStatus.LOCATION_EVALUATION, label: "Site Evaluation", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: LeadStatus.PROPOSAL_SENT, label: "Proposal Sent", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { key: LeadStatus.APPROVED, label: "Approved", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: LeadStatus.AGREEMENT, label: "Agreement Signed", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { key: LeadStatus.SETUP, label: "Center Setup", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { key: LeadStatus.LAUNCHED, label: "Launched & Active", color: "bg-green-100 text-green-800 border-green-200" },
  { key: LeadStatus.ON_HOLD, label: "On Hold", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { key: LeadStatus.LOST, label: "Closed / Lost", color: "bg-red-100 text-red-800 border-red-200" },
];

export function AdminFranchiseView() {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "ALL">("ALL");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  // Follow-up form state
  const [followUpType, setFollowUpType] = useState<FollowUpType>(FollowUpType.CALL);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpNextDate, setFollowUpNextDate] = useState("");
  const [followUpNewStatus, setFollowUpNewStatus] = useState<LeadStatus | "">("");

  // Status update form state
  const [quickStatus, setQuickStatus] = useState<LeadStatus | "">("");
  const [statusNotes, setStatusNotes] = useState("");

  const utils = api.useUtils();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } =
    api.crm.getFranchiseStats.useQuery();

  const { data: leadsData, isLoading: leadsLoading, refetch: refetchLeads, isFetching } =
    api.crm.listFranchiseLeads.useQuery({
      status: selectedStatus === "ALL" ? undefined : selectedStatus,
      state: selectedState === "ALL" ? undefined : selectedState,
      search: search.trim() || undefined,
      page,
      limit: 25,
    });

  const updateStatusMutation = api.crm.updateFranchiseStatus.useMutation({
    onSuccess: () => {
      utils.crm.listFranchiseLeads.invalidate();
      utils.crm.getFranchiseStats.invalidate();
      setStatusNotes("");
      if (selectedLead && quickStatus) {
        setSelectedLead((prev: any) => (prev ? { ...prev, status: quickStatus } : null));
      }
    },
  });

  const addFollowUpMutation = api.crm.addFranchiseFollowUp.useMutation({
    onSuccess: () => {
      utils.crm.listFranchiseLeads.invalidate();
      utils.crm.getFranchiseStats.invalidate();
      setFollowUpNotes("");
      setFollowUpNextDate("");
      setFollowUpNewStatus("");
      refetchLeads();
    },
  });

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !quickStatus) return;
    updateStatusMutation.mutate({
      leadId: selectedLead.id,
      status: quickStatus as LeadStatus,
      notes: statusNotes.trim() || undefined,
    });
  };

  const handleAddFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !followUpNotes.trim()) return;
    addFollowUpMutation.mutate({
      leadId: selectedLead.id,
      type: followUpType,
      notes: followUpNotes.trim(),
      nextFollowUpDate: followUpNextDate ? new Date(followUpNextDate) : undefined,
      newStatus: followUpNewStatus ? (followUpNewStatus as LeadStatus) : undefined,
    });
  };

  const getStatusBadge = (status: LeadStatus) => {
    const config = PIPELINE_STATUSES.find((p: any) => p.key === status);
    if (!config) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
          {status}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP STATS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Enquiries
            </span>
            <div className="text-2xl font-extrabold text-slate-900">
              {statsLoading ? "..." : stats?.total || 0}
            </div>
            <span className="text-[10px] text-slate-400">All franchise records</span>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              New Leads
            </span>
            <div className="text-2xl font-extrabold text-blue-900">
              {statsLoading ? "..." : stats?.pipeline?.NEW || 0}
            </div>
            <span className="text-[10px] text-blue-600">Pending review</span>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700">
              Discussion
            </span>
            <div className="text-2xl font-extrabold text-purple-900">
              {statsLoading ? "..." : stats?.pipeline?.DISCUSSION || 0}
            </div>
            <span className="text-[10px] text-purple-600">Active dialogue</span>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
              Site Evaluation
            </span>
            <div className="text-2xl font-extrabold text-amber-900">
              {statsLoading ? "..." : stats?.pipeline?.LOCATION_EVALUATION || 0}
            </div>
            <span className="text-[10px] text-amber-600">Territory review</span>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Approved
            </span>
            <div className="text-2xl font-extrabold text-emerald-900">
              {statsLoading
                ? "..."
                : (stats?.pipeline?.APPROVED || 0) + (stats?.pipeline?.AGREEMENT || 0)}
            </div>
            <span className="text-[10px] text-emerald-600">Agreement stage</span>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-green-700">
              Setup & Active
            </span>
            <div className="text-2xl font-extrabold text-green-900">
              {statsLoading
                ? "..."
                : (stats?.pipeline?.SETUP || 0) + (stats?.pipeline?.LAUNCHED || 0)}
            </div>
            <span className="text-[10px] text-green-600">Operational centers</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. ANALYTICS & BREAKDOWN PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State Breakdown */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Applications by State</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            {stats?.stateBreakdown && stats.stateBreakdown.length > 0 ? (
              stats.stateBreakdown.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                  <span className="text-slate-700 font-medium">{item.state}</span>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {item.count}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">No state metrics recorded yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Profile Distribution */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <span>Applicant Profile Mix</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            {stats?.profileBreakdown && stats.profileBreakdown.length > 0 ? (
              stats.profileBreakdown.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                  <span className="text-slate-700 font-medium truncate max-w-[200px]">
                    {item.profile}
                  </span>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {item.count}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">No profile metrics recorded yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Investment Capacity */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span>Investment Capacity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            {stats?.investmentBreakdown && stats.investmentBreakdown.length > 0 ? (
              stats.investmentBreakdown.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                  <span className="text-slate-700 font-medium truncate max-w-[200px]">
                    {item.capacity}
                  </span>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {item.count}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">No capacity metrics recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. FILTERS & SEARCH */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search applicant name, phone, email, city, or territory..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as any);
                  setPage(1);
                }}
                className="h-9 text-xs rounded-md border border-input bg-background px-3 py-1 font-medium"
              >
                <option value="ALL">All Pipeline Stages</option>
                {PIPELINE_STATUSES.map((st: any) => (
                  <option key={st.key} value={st.key}>
                    {st.label}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchLeads();
                  refetchStats();
                }}
                disabled={isFetching}
                className="h-9 px-2.5 text-xs text-slate-600"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. LEADS DATA TABLE */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 font-bold">Reference / Applicant</th>
                <th className="p-3.5 font-bold">Target Location</th>
                <th className="p-3.5 font-bold">Profile & Investment</th>
                <th className="p-3.5 font-bold">Pipeline Stage</th>
                <th className="p-3.5 font-bold">Applied On</th>
                <th className="p-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leadsLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading franchise applications...</span>
                  </td>
                </tr>
              ) : leadsData?.leads && leadsData.leads.length > 0 ? (
                leadsData.leads.map((lead) => {
                  const refNo = `SLG-FRN-2026-${lead.id.slice(-4).toUpperCase()}`;
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedLead(lead);
                        setQuickStatus(lead.status);
                      }}
                    >
                      <td className="p-3.5">
                        <div className="font-mono text-[11px] font-bold text-emerald-800">
                          {refNo}
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">{lead.fullName}</div>
                        <div className="text-[11px] text-slate-500">{lead.phone} • {lead.email}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-medium text-slate-900">
                          {lead.city || "N/A"}{lead.franchiseState ? `, ${lead.franchiseState}` : ""}
                        </div>
                        {lead.franchisePreferredLocation && (
                          <div className="text-[11px] text-slate-500">
                            Locality: {lead.franchisePreferredLocation}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="text-slate-800 font-medium">{lead.franchiseProfile || "General"}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          {lead.franchiseInvestmentCapacity || "Under ₹10 Lakh"}
                        </div>
                      </td>

                      <td className="p-3.5">
                        {getStatusBadge(lead.status)}
                      </td>

                      <td className="p-3.5 text-slate-500 text-[11px]">
                        <div>{new Date(lead.createdAt).toLocaleDateString("en-IN")}</div>
                        <div className="text-[10px] text-slate-400">
                          {lead._count?.followUps || 0} follow-up(s)
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                            setQuickStatus(lead.status);
                          }}
                          className="text-xs h-8 px-3 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span>Review</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No franchise applications found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Applications submitted via the public /franchise page will appear here instantly.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {leadsData && leadsData.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing page {leadsData.page} of {leadsData.totalPages} ({leadsData.total} total enquiries)
            </span>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5 text-xs"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= leadsData.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 5. DETAIL & MANAGEMENT MODAL / DRAWER */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold">
                    SLG-FRN-2026-{selectedLead.id.slice(-4).toUpperCase()}
                  </div>
                  <h3 className="text-base font-bold text-white">{selectedLead.fullName}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Applicant Contact & Location Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Contact Number</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedLead.phone}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium"
                    >
                      <PhoneCall className="h-3 w-3" />
                      <span>Call</span>
                    </a>
                    <span>•</span>
                    <a
                      href={`https://wa.me/91${selectedLead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-medium"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Official Email</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedLead.email}</div>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="mt-1 inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 font-medium"
                  >
                    <Mail className="h-3 w-3" />
                    <span>Send Mail</span>
                  </a>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Market</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedLead.city || "N/A"}{selectedLead.franchiseState ? `, ${selectedLead.franchiseState}` : ""}
                  </div>
                  {selectedLead.franchisePreferredLocation && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {selectedLead.franchisePreferredLocation}
                    </div>
                  )}
                </div>
              </div>

              {/* Franchise Profile Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Profile</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {selectedLead.franchiseProfile || "General"}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Investment Tier</span>
                  <div className="font-bold text-emerald-800 mt-0.5">
                    {selectedLead.franchiseInvestmentCapacity || "Under ₹10 Lakh"}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Launch Timeline</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {selectedLead.franchiseLaunchTimeline || "Immediate"}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Existing Institute</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {selectedLead.franchiseExistingInstitute ? "Yes (Active)" : "No (New)"}
                  </div>
                </div>
              </div>

              {/* Notes & Requirements */}
              {(selectedLead.franchiseExperience || selectedLead.franchiseRequirements || selectedLead.notes) && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Application Details & Background
                  </span>
                  {selectedLead.franchiseExperience && (
                    <p className="text-slate-700">
                      <strong>Experience:</strong> {selectedLead.franchiseExperience}
                    </p>
                  )}
                  {selectedLead.franchiseRequirements && (
                    <p className="text-slate-700">
                      <strong>Requirements/Questions:</strong> {selectedLead.franchiseRequirements}
                    </p>
                  )}
                  {selectedLead.notes && (
                    <div className="pt-2 border-t border-slate-200/60 whitespace-pre-line text-slate-600 font-mono text-[11px]">
                      {selectedLead.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Status Update Section */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-emerald-700" />
                  <span>Update Franchise Pipeline Stage</span>
                </span>
                <form onSubmit={handleUpdateStatus} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Pipeline Stage</Label>
                      <select
                        value={quickStatus}
                        onChange={(e) => setQuickStatus(e.target.value as LeadStatus)}
                        className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs"
                      >
                        {PIPELINE_STATUSES.map((st: any) => (
                          <option key={st.key} value={st.key}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Change Note (Optional)</Label>
                      <Input
                        placeholder="e.g. Conducted introductory call; sent prospectus."
                        value={statusNotes}
                        onChange={(e) => setStatusNotes(e.target.value)}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateStatusMutation.isPending || quickStatus === selectedLead.status}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 px-4"
                  >
                    {updateStatusMutation.isPending ? "Updating..." : "Save Pipeline Stage"}
                  </Button>
                </form>
              </div>

              {/* Follow-up Logging Section */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <PhoneCall className="h-4 w-4 text-slate-600" />
                  <span>Log Follow-Up & Next Scheduled Action</span>
                </span>
                <form onSubmit={handleAddFollowUp} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Action Type</Label>
                      <select
                        value={followUpType}
                        onChange={(e) => setFollowUpType(e.target.value as FollowUpType)}
                        className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs"
                      >
                        <option value={FollowUpType.CALL}>Phone Call</option>
                        <option value={FollowUpType.MESSAGE}>WhatsApp / Message</option>
                        <option value={FollowUpType.COUNSELLING_SESSION}>Video / In-person Meeting</option>
                        <option value={FollowUpType.NOTE}>Internal Review Note</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Next Follow-Up Date</Label>
                      <Input
                        type="datetime-local"
                        value={followUpNextDate}
                        onChange={(e) => setFollowUpNextDate(e.target.value)}
                        className="h-9 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Advance Stage (Optional)</Label>
                      <select
                        value={followUpNewStatus}
                        onChange={(e) => setFollowUpNewStatus(e.target.value as LeadStatus)}
                        className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs"
                      >
                        <option value="">Keep Current Stage</option>
                        {PIPELINE_STATUSES.map((st: any) => (
                          <option key={st.key} value={st.key}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Discussion Notes *</Label>
                    <textarea
                      rows={2}
                      placeholder="Enter specific points discussed, commercial queries, territory boundaries..."
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={addFollowUpMutation.isPending}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-4"
                  >
                    {addFollowUpMutation.isPending ? "Saving..." : "Log Follow-Up History"}
                  </Button>
                </form>
              </div>

              {/* Follow-up Timeline */}
              {selectedLead.followUps && selectedLead.followUps.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Recent Follow-Up Activity
                  </span>
                  <div className="space-y-2">
                    {selectedLead.followUps.map((fu: any) => (
                      <div key={fu.id} className="p-3 rounded-xl border border-slate-100 bg-white text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold text-slate-700">
                            {fu.type} by {fu.performedBy?.firstName || "Team"}
                          </span>
                          <span>{new Date(fu.createdAt).toLocaleString("en-IN")}</span>
                        </div>
                        <p className="text-slate-700 text-xs">{fu.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
