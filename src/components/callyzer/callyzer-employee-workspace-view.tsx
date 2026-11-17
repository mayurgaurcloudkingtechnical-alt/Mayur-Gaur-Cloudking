"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  PhoneCall,
  Phone,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  CreditCard,
  UserCheck,
  Search,
  Filter,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CallyzerDispositionModal } from "./callyzer-disposition-modal";
import { CallyzerCommunicationDrawer } from "./callyzer-communication-drawer";
import { CallyzerPrivateDialer } from "./callyzer-private-dialer";

export function CallyzerEmployeeWorkspaceView() {
  const [filter, setFilter] = useState<"ALL" | "PENDING_CALL" | "CALLED_TODAY" | "FOLLOW_UP">("PENDING_CALL");
  const [search, setSearch] = useState("");
  const [activeCallLead, setActiveCallLead] = useState<any | null>(null);
  const [activeCommLead, setActiveCommLead] = useState<any | null>(null);
  const [showDialer, setShowDialer] = useState(false);
  const [dialerTarget, setDialerTarget] = useState("");
  const [dialerLead, setDialerLead] = useState<any | null>(null);

  const { data: wsState, refetch: refetchWs } = api.callyzer.getMyWorkspaceState.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const { data: leadData, isLoading, refetch: refetchLeads } = api.callyzer.getMyAssignedLeads.useQuery({
    filter,
    search: search || undefined,
    page: 1,
    pageSize: 25,
  });

  const startCallingMutation = api.callyzer.startTodaysCalling.useMutation({
    onSuccess: () => {
      refetchWs();
      refetchLeads();
    },
  });

  const handleStartCall = (lead: any) => {
    setDialerTarget(lead.phone);
    setDialerLead(lead);
    setShowDialer(true);
  };

  const progressPct = wsState?.dailyTarget
    ? Math.min(100, Math.round((wsState.totalCalls / wsState.dailyTarget) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Session & KPI Header */}
      <Card className="border-indigo-900/50 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  className={
                    wsState?.status === "AVAILABLE"
                      ? "bg-emerald-600 text-white animate-pulse"
                      : "bg-slate-700 text-slate-300"
                  }
                >
                  {wsState?.status || "OFFLINE"}
                </Badge>
                <span className="text-xs text-slate-400 font-mono">
                  Caller ID: {wsState?.businessPhoneNumber} (Ext: {wsState?.extension})
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                Sales Calling Desk — {wsState?.name || "Agent Workspace"}
              </h2>
              <p className="text-xs text-slate-400">
                Assigned Today: <strong className="text-indigo-300">{wsState?.totalAssignedToday} leads</strong> |
                Daily Target: <strong className="text-white">{wsState?.dailyTarget} calls</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="lg"
                onClick={() => startCallingMutation.mutate()}
                disabled={startCallingMutation.isPending || wsState?.isSessionActive}
                className={
                  wsState?.isSessionActive
                    ? "bg-emerald-700 text-white font-bold cursor-default shadow-md"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black shadow-lg"
                }
              >
                <Play className="w-4 h-4 mr-1.5 fill-current" />
                {wsState?.isSessionActive ? "CALLING SESSION ACTIVE" : "START TODAY'S CALLING"}
              </Button>
            </div>
          </div>

          {/* Progress Bar & Counter Cards */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block uppercase">Calls Completed</span>
              <span className="text-xl font-black text-white">{wsState?.totalCalls ?? 0}</span>
              <span className="text-[10px] text-slate-500 block">Target: {wsState?.dailyTarget}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block uppercase">Connected</span>
              <span className="text-xl font-black text-emerald-400">{wsState?.connectedCalls ?? 0}</span>
              <span className="text-[10px] text-emerald-500/80 block">
                {wsState?.totalCalls ? Math.round(((wsState?.connectedCalls || 0) / wsState.totalCalls) * 100) : 0}% Ratio
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block uppercase">Talk Time</span>
              <span className="text-xl font-black text-indigo-400">
                {Math.floor((wsState?.totalTalkTimeSecs || 0) / 60)}m
              </span>
              <span className="text-[10px] text-indigo-300 block">Total Duration</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block uppercase">Admissions</span>
              <span className="text-xl font-black text-amber-400">{wsState?.conversions ?? 0}</span>
              <span className="text-[10px] text-amber-400/80 block">Conversions</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Today's Target Progress</span>
              <span className="font-bold text-white">{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in assigned leads..."
              className="pl-9 bg-slate-950 border-slate-800 text-xs h-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end overflow-x-auto">
          {[
            { id: "PENDING_CALL", label: "Pending Call" },
            { id: "CALLED_TODAY", label: "Called Today" },
            { id: "FOLLOW_UP", label: "Follow-Ups" },
            { id: "ALL", label: "All Assigned" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filter === tab.id
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assigned Leads Table */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">City / Course</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Next Follow-Up</th>
                  <th className="py-3 px-4 text-right">Calling & Action Desk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading your assigned leads...
                    </td>
                  </tr>
                ) : leadData?.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No leads found in this queue. Great job!
                    </td>
                  </tr>
                ) : (
                  leadData?.items.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {lead.fullName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {lead.phone}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {lead.city || "-"} / {lead.campaignName || "General"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={
                            lead.status === "ADMITTED"
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                              : lead.status === "FOLLOW_UP"
                              ? "bg-amber-950/40 text-amber-400 border-amber-800"
                              : "bg-slate-800 text-slate-300"
                          }
                        >
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleStartCall(lead)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 px-2.5 text-xs flex items-center gap-1 shadow"
                          >
                            <PhoneCall className="w-3 h-3" /> Call
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveCommLead(lead)}
                            className="border-slate-700 text-indigo-400 hover:bg-slate-800 h-7 px-2 text-xs"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveCallLead(lead)}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800 h-7 px-2 text-xs"
                          >
                            Log
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Disposition Modal */}
      {activeCallLead && (
        <CallyzerDispositionModal
          lead={activeCallLead}
          callDurationSeconds={45}
          onClose={() => setActiveCallLead(null)}
          onSuccess={() => {
            refetchWs();
            refetchLeads();
          }}
        />
      )}

      {/* Communication Drawer */}
      {activeCommLead && (
        <CallyzerCommunicationDrawer
          lead={activeCommLead}
          onClose={() => setActiveCommLead(null)}
        />
      )}

      {/* Self-Hosted PBX Dialer Modal */}
      {showDialer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative">
            <button
              onClick={() => setShowDialer(false)}
              className="absolute -top-3 -right-3 z-10 w-7 h-7 bg-slate-800 text-slate-300 rounded-full flex items-center justify-center text-xs font-bold border border-slate-700 hover:bg-slate-700 hover:text-white"
            >
              ✕
            </button>
            <CallyzerPrivateDialer
              initialDestination={dialerTarget}
              leadId={dialerLead?.id}
              onCallEnded={(_call) => {
                setShowDialer(false);
                setActiveCallLead(dialerLead);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
