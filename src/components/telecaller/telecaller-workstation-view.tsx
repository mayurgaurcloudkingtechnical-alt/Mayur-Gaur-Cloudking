"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadStatus } from "@prisma/client";
import {
  Phone,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  PhoneCall,
  UserCheck,
  Flame,
  AlertCircle,
  ExternalLink,
  Zap,
} from "lucide-react";

interface TelecallerWorkstationViewProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    whatsappNumber?: string | null;
    callingNumber?: string | null;
  };
}

export function TelecallerWorkstationView({ user }: TelecallerWorkstationViewProps) {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState<"META" | "WEBSITE" | "ALL">("META");
  const [escalatingLeadId, setEscalatingLeadId] = useState<string | null>(null);
  const [selectedCounselorId, setSelectedCounselorId] = useState<string>("");
  const [escalationNotes, setEscalationNotes] = useState("");

  const utils = api.useUtils();

  const { data: leadsData, isLoading: isLoadingLeads } = api.crm.listLeads.useQuery({
    status: selectedStatus === "ALL" ? undefined : selectedStatus,
    search: search.trim() || undefined,
    limit: 30,
    page: 1,
  });

  const { data: stats } = api.crm.getStats.useQuery();
  const { data: counselors = [] } = api.crm.listCounselors.useQuery();

  // Rapid Disposition Mutation
  const dispositionMutation = api.crm.logDisposition.useMutation({
    onSuccess: () => {
      utils.crm.listLeads.invalidate();
      utils.crm.getStats.invalidate();
    },
  });

  // Escalate to Counselor Mutation
  const escalateMutation = api.crm.escalateToCounselor.useMutation({
    onSuccess: () => {
      setEscalatingLeadId(null);
      setEscalationNotes("");
      utils.crm.listLeads.invalidate();
      utils.crm.getStats.invalidate();
    },
  });

  const [simulatedMessage, setSimulatedMessage] = useState<string | null>(null);

  const simulateMutation = api.crm.simulateMetaLead.useMutation({
    onSuccess: (res: any) => {
      setSimulatedMessage(`Live Lead ${res.leadId || "Active"} received from FB Boost!`);
      utils.crm.listLeads.invalidate();
      utils.crm.getStats.invalidate();
      setTimeout(() => setSimulatedMessage(null), 5000);
    },
    onError: (err: any) => {
      setSimulatedMessage(`Error: ${err.message}`);
      setTimeout(() => setSimulatedMessage(null), 5000);
    },
  });

  const leads = leadsData?.leads || [];

  // Filter based on active tab
  const filteredLeads = leads.filter((lead) => {
    if (activeTab === "META") {
      return (
        lead.source === "META_ADS_FB" ||
        lead.source === "META_ADS_IG" ||
        lead.source === "SOCIAL_MEDIA"
      );
    }
    if (activeTab === "WEBSITE") {
      return lead.source === "WEBSITE" || lead.source === "CHATBOT";
    }
    return true;
  });

  const activeCounselorList = counselors.filter(
    (c) => c.roleCode === "COUNSELOR" && c.isLeadAccepting
  );

  const handleQuickDisposition = (leadId: string, disposition: string, newStatus?: LeadStatus) => {
    dispositionMutation.mutate({
      leadId,
      disposition,
      newStatus,
      notes: `Quick disposition: ${disposition} logged by Telecaller ${user.firstName}`,
    });
  };

  const handleOpenWhatsApp = (phone: string, name: string, courseName?: string | null) => {
    const cleanNumber = phone.startsWith("91") ? phone : `91${phone}`;
    const text = encodeURIComponent(
      `Hello ${name}! 👋 This is ${user.firstName} from SoftLab Global regarding your inquiry for ${
        courseName || "our professional IT programs"
      }. When is a good time for a quick 2-minute call?`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Top Telecaller Calling Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Meta & Web Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-slate-900">{stats?.totalLeads ?? 0}</div>
            <p className="text-xs text-slate-500 mt-0.5">Assigned to your calling desk</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Follow-ups Due Today
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-600">{stats?.dueToday ?? 0}</div>
            <p className="text-xs text-slate-500 mt-0.5">Scheduled for immediate call</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Fresh Uncontacted Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-purple-700">{stats?.newLeads ?? 0}</div>
            <p className="text-xs text-slate-500 mt-0.5">Ready for first outreach</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Admissions Closed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-700">{stats?.admittedCount ?? 0}</div>
            <p className="text-xs text-slate-500 mt-0.5">Converted from your outreach</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Calling Workstation */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-purple-600" />
              Telecaller Rapid Outreach Station
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              One-click WhatsApp, instant calling, quick dispositions, and counselor escalation.
            </CardDescription>
          </div>

          {/* Platform Tab Toggles */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={activeTab === "META" ? "default" : "outline"}
              onClick={() => setActiveTab("META")}
              className={`text-xs h-8 ${
                activeTab === "META" ? "bg-purple-700 hover:bg-purple-800 text-white" : ""
              }`}
            >
              Meta Ads (FB/IG)
            </Button>
            <Button
              size="sm"
              variant={activeTab === "WEBSITE" ? "default" : "outline"}
              onClick={() => setActiveTab("WEBSITE")}
              className={`text-xs h-8 ${
                activeTab === "WEBSITE" ? "bg-emerald-700 hover:bg-emerald-800 text-white" : ""
              }`}
            >
              Website & Chatbot
            </Button>
            <Button
              size="sm"
              variant={activeTab === "ALL" ? "default" : "outline"}
              onClick={() => setActiveTab("ALL")}
              className="text-xs h-8"
            >
              All Leads
            </Button>
          </div>
        </CardHeader>

        {/* Active Facebook Boost Ad Quick Action Banner */}
        {activeTab === "META" && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-200 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-xs">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">
                    Inbuilt Facebook Boost Campaign: SoftLab Global
                  </span>
                  <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0">
                    ● ACTIVE BOOST
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-2 flex-wrap">
                  <span>
                    Boost ID: <code className="font-semibold text-blue-700">1324192984113691</code>
                  </span>
                  <span>•</span>
                  <span>
                    Page ID: <code className="font-semibold text-slate-700">1322487780950878</code>
                  </span>
                  <span>•</span>
                  <span className="text-purple-700 font-medium">Auto-dispatches to your workstation</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={simulateMutation.isPending}
                onClick={() => {
                  simulateMutation.mutate({
                    fullName: `FB Lead (Candidate ${Math.floor(100 + Math.random() * 900)})`,
                    phone: `919408${Math.floor(1000 + Math.random() * 9000)}`,
                    city: "Prayagraj",
                    notes: "Direct Facebook Boost Ad Inquiry",
                  });
                }}
                className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-100 bg-white"
              >
                <Zap className="h-3 w-3 mr-1 text-amber-500" />
                {simulateMutation.isPending ? "Simulating..." : "Test Inbound Lead"}
              </Button>

              <a
                href="https://www.facebook.com/ad_center/manage/?boost_id=1324192984113691&entry_point=www_ad_center_overview_ad_cards&page_id=1322487780950878"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="sm"
                  className="h-7 text-xs bg-[#1877F2] hover:bg-blue-700 text-white font-medium flex items-center gap-1"
                >
                  <span>Open FB Ad Center</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            </div>
          </div>
        )}

        {simulatedMessage && (
          <div className="bg-emerald-50 text-emerald-800 text-xs px-4 py-2 border-b border-emerald-200 font-medium">
            {simulatedMessage}
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search candidate name, mobile or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(["ALL", "NEW", "FOLLOW_UP", "INTERESTED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  selectedStatus === st
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {st === "ALL" ? "All Statuses" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Lead Rows Table */}
        <CardContent className="p-0">
          {isLoadingLeads ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading calling queue...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No leads currently waiting in this tab. Great job!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                    <th className="py-3 px-4 font-semibold">Lead & Source</th>
                    <th className="py-3 px-3 font-semibold">Contact & Location</th>
                    <th className="py-3 px-3 font-semibold">Course Interest</th>
                    <th className="py-3 px-3 font-semibold">Quality & Bot Status</th>
                    <th className="py-3 px-4 font-semibold text-center">Communication</th>
                    <th className="py-3 px-4 font-semibold text-right">Quick Dispositions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Candidate Name & Source */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{lead.fullName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 font-medium ${
                              lead.source.includes("META")
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : lead.source === "JUSTDIAL"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : lead.source === "GOOGLE_ADS"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {lead.source}
                          </Badge>
                          {(lead.adCreativeName?.includes("1324192984113691") ||
                            lead.campaignName?.includes("1324192984113691") ||
                            lead.notes?.includes("1324192984113691")) && (
                            <Badge className="bg-[#1877F2] hover:bg-blue-700 text-white text-[9px] px-1.5 py-0 font-semibold tracking-tight">
                              FB Boost #1324192984113691
                            </Badge>
                          )}
                          {lead.campaignName &&
                            !lead.campaignName.includes("1324192984113691") && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                {lead.campaignName}
                              </span>
                            )}
                        </div>
                      </td>

                      {/* Phone & City */}
                      <td className="py-3 px-3 text-slate-700">
                        <div className="font-mono text-xs font-semibold">{lead.phone}</div>
                        <div className="text-[11px] text-slate-400">
                          {lead.city ? lead.city : "City not specified"}
                        </div>
                      </td>

                      {/* Course Interest */}
                      <td className="py-3 px-3 text-slate-700">
                        <div className="font-medium text-slate-900">
                          {lead.course?.title || "General IT Inquiry"}
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            lead.status === LeadStatus.NEW
                              ? "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                              : lead.status === LeadStatus.INTERESTED
                              ? "bg-purple-50 text-purple-700 border-purple-200 text-[10px]"
                              : "bg-slate-100 text-slate-700 border-slate-200 text-[10px]"
                          }
                        >
                          {lead.status}
                        </Badge>
                      </td>

                      {/* Quality & Bot Qualification */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          {lead.qualityScore === "HOT" ? (
                            <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] gap-0.5 px-1.5">
                              <Flame className="h-3 w-3" /> HOT
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-600 text-[10px]">
                              {lead.qualityScore}
                            </Badge>
                          )}

                          {lead.botQualified && (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                              Bot Qualified
                            </Badge>
                          )}
                        </div>
                        {lead.botSummary && (
                          <div className="text-[10px] text-slate-500 mt-1 max-w-[180px] truncate" title={lead.botSummary}>
                            {lead.botSummary}
                          </div>
                        )}
                      </td>

                      {/* 1-Click WhatsApp & Call Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleOpenWhatsApp(lead.phone, lead.fullName, lead.course?.title)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2.5 text-[11px] gap-1 shadow-sm"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            WhatsApp
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="border-slate-300 h-7 px-2.5 text-[11px] gap-1"
                          >
                            <a href={`tel:${lead.phone}`}>
                              <Phone className="h-3.5 w-3.5 text-blue-600" />
                              Call
                            </a>
                          </Button>
                        </div>
                      </td>

                      {/* Quick Dispositions & Escalation */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuickDisposition(lead.id, "CONNECTED_CALL", LeadStatus.CONTACTED)}
                            className="h-7 px-2 text-[10px] text-emerald-700 hover:bg-emerald-50"
                          >
                            Connected
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuickDisposition(lead.id, "CALLBACK_REQUESTED", LeadStatus.FOLLOW_UP)}
                            className="h-7 px-2 text-[10px] text-amber-700 hover:bg-amber-50"
                          >
                            Callback
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuickDisposition(lead.id, "NOT_REACHABLE", LeadStatus.FOLLOW_UP)}
                            className="h-7 px-2 text-[10px] text-slate-500 hover:bg-slate-100"
                          >
                            Busy/NA
                          </Button>

                          {/* Escalate to Counselor Button */}
                          <Button
                            size="sm"
                            onClick={() => setEscalatingLeadId(lead.id)}
                            className="bg-purple-700 hover:bg-purple-800 text-white h-7 px-2 text-[10px] gap-1 shadow-sm"
                          >
                            <UserCheck className="h-3 w-3" />
                            To Counselor
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escalation Modal */}
      {escalatingLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-purple-600" />
                Escalate Lead to Senior Counselor
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Transfer qualified prospect for Demo Scheduling and Admission Closing.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Active Counselor
                </label>
                <select
                  value={selectedCounselorId}
                  onChange={(e) => setSelectedCounselorId(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 text-xs px-2.5 bg-white"
                >
                  <option value="">-- Choose Available Counselor --</option>
                  {activeCounselorList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.activeLeadsCount} active leads)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Handover Notes for Counselor
                </label>
                <textarea
                  placeholder="e.g. Student interested in CCNA offline weekend batch. Wants demo on Saturday."
                  value={escalationNotes}
                  onChange={(e) => setEscalationNotes(e.target.value)}
                  className="w-full h-20 rounded-md border border-slate-300 text-xs p-2 bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEscalatingLeadId(null)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedCounselorId || escalateMutation.isPending}
                  onClick={() => {
                    if (escalatingLeadId && selectedCounselorId) {
                      escalateMutation.mutate({
                        leadId: escalatingLeadId,
                        counselorId: selectedCounselorId,
                        notes: escalationNotes,
                      });
                    }
                  }}
                  className="bg-purple-700 hover:bg-purple-800 text-white h-8 text-xs"
                >
                  {escalateMutation.isPending ? "Transferring..." : "Confirm Escalation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
