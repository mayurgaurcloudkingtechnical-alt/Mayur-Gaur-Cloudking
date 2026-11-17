"use client";

import React, { useState } from "react";
import { api as trpc } from "@/lib/trpc/react";
import {
  Server,
  Radio,
  Users,
  PhoneCall,
  GitFork,
  ShieldCheck,
  ShieldAlert,
  Settings,
  PhoneOff,
  RefreshCw,
  Plus,
  Key,
} from "lucide-react";

export function CallyzerPbxDesk() {
  const [activeTab, setActiveTab] = useState<"FLEET" | "EXTENSIONS" | "IVR" | "TRUNK">("FLEET");

  const { data: health, refetch: refetchHealth } = trpc.callyzer.getServerHealth.useQuery();
  const { data: fleet, refetch: refetchFleet } = trpc.callyzer.getFleetOverview.useQuery();
  const { data: extensions, refetch: refetchExts } = trpc.callyzer.listExtensions.useQuery();
  const { data: ivrMenu, refetch: refetchIvr } = trpc.callyzer.getIvrMenu.useQuery();
  const { data: trunkStatus, refetch: refetchTrunk } = trpc.callyzer.getTrunkStatus.useQuery();

  const terminateMut = trpc.callyzer.terminateCall.useMutation();
  const resetPassMut = trpc.callyzer.resetExtensionPassword.useMutation();
  const changeStatusMut = trpc.callyzer.supervisorChangeAgentStatus.useMutation();

  const handleTerminate = async (callId: string) => {
    if (!confirm(`Hang up active call ${callId}?`)) return;
    await terminateMut.mutateAsync({ callId, reason: "SUPERVISOR_TERMINATE" });
    refetchFleet();
  };

  const handleResetPass = async (extensionNumber: string) => {
    const res = await resetPassMut.mutateAsync({ extensionNumber });
    if (res.success) {
      alert(`Extension ${extensionNumber} password reset!\nNew Password: ${res.newPassword}`);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: "AVAILABLE" | "ON_BREAK" | "OFFLINE") => {
    await changeStatusMut.mutateAsync({ userId, newStatus });
    refetchFleet();
  };

  return (
    <div className="space-y-6">
      {/* PBX Telephony Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                SoftLab Global Private Telephony Server
                <span className="text-xs bg-emerald-950 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded font-mono">
                  v2.4-PBX
                </span>
              </h2>
              <p className="text-sm text-slate-400">
                Self-Hosted SIP Engine, Extension Routing, Real-Time Fleet & Carrier Gateway
              </p>
            </div>
          </div>
        </div>

        {/* Health & Engine Quick State */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">SIP Core Status</div>
            <div className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {health?.status || "HEALTHY"}
            </div>
          </div>
          <button
            onClick={() => { refetchHealth(); refetchFleet(); refetchExts(); }}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        {[
          { key: "FLEET", label: "Supervisor Fleet & Live Calls", icon: Radio },
          { key: "EXTENSIONS", label: "SIP Extensions Directory", icon: Users },
          { key: "IVR", label: "Visual IVR Engine", icon: GitFork },
          { key: "TRUNK", label: "Telecom Trunk & Carrier", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition ${
                isActive
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: FLEET & LIVE CALLS */}
      {activeTab === "FLEET" && (
        <div className="space-y-6">
          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs text-slate-400 font-medium uppercase">Active Calls</div>
              <div className="text-2xl font-bold text-white mt-1">
                {fleet?.metrics.activeCallsCount || 0}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs text-slate-400 font-medium uppercase">Available Agents</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {fleet?.metrics.availableAgents || 0}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs text-slate-400 font-medium uppercase">Today Calls</div>
              <div className="text-2xl font-bold text-sky-400 mt-1">
                {fleet?.metrics.todayCallsCount || 0}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs text-slate-400 font-medium uppercase">Talk Time (Mins)</div>
              <div className="text-2xl font-bold text-indigo-400 mt-1">
                {fleet?.metrics.todayTalkTimeMinutes || 0}m
              </div>
            </div>
          </div>

          {/* Active Call Sessions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Active Live Call Sessions</h3>
              <span className="text-xs text-slate-400 font-mono">
                {fleet?.activeCalls.length || 0} In Progress
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="px-5 py-3">Call ID</th>
                    <th className="px-5 py-3">Caller Ext</th>
                    <th className="px-5 py-3">Destination</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Live Duration</th>
                    <th className="px-5 py-3">State</th>
                    <th className="px-5 py-3 text-right">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {(!fleet?.activeCalls || fleet.activeCalls.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500 font-sans">
                        No active call sessions currently in progress.
                      </td>
                    </tr>
                  ) : (
                    fleet.activeCalls.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40">
                        <td className="px-5 py-3 text-slate-400 font-mono">{c.callId.slice(0, 18)}...</td>
                        <td className="px-5 py-3 text-emerald-400 font-bold">Ext {c.callerExtension}</td>
                        <td className="px-5 py-3 text-white font-bold">{c.calleeDestination}</td>
                        <td className="px-5 py-3 text-slate-400">{c.callType}</td>
                        <td className="px-5 py-3 text-emerald-300 font-bold">{c.liveDurationSeconds}s</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleTerminate(c.callId)}
                            className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 rounded font-sans text-xs"
                          >
                            Terminate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXTENSIONS DIRECTORY */}
      {activeTab === "EXTENSIONS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">SIP Extensions & Agent Roster</h3>
            <span className="text-xs text-slate-400 font-mono">{extensions?.length || 0} Registered</span>
          </div>
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono">
              <tr>
                <th className="px-5 py-3">Extension</th>
                <th className="px-5 py-3">Staff Name</th>
                <th className="px-5 py-3">SIP User</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Presence</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {extensions?.map((ext) => (
                <tr key={ext.id} className="hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-emerald-400 font-bold">Ext {ext.extensionNumber}</td>
                  <td className="px-5 py-3 text-white font-sans font-medium">{ext.displayName}</td>
                  <td className="px-5 py-3 text-slate-400">{ext.sipUsername}</td>
                  <td className="px-5 py-3 text-slate-300">{ext.department}</td>
                  <td className="px-5 py-3 text-slate-400">{ext.roleCode}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      ext.status === "AVAILABLE" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                      ext.status === "ON_CALL" ? "bg-indigo-950 text-indigo-400 border border-indigo-800" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      {ext.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleResetPass(ext.extensionNumber)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-sans text-xs"
                    >
                      Reset Pass
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: VISUAL IVR ENGINE */}
      {activeTab === "IVR" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-semibold text-white text-base">{ivrMenu?.name}</h3>
              <p className="text-xs text-slate-400">Hours: {ivrMenu?.businessHoursStart} - {ivrMenu?.businessHoursEnd} IST</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-xs">
              Language: {ivrMenu?.defaultLanguage}
            </span>
          </div>
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs italic">
            "{ivrMenu?.welcomePrompt}"
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(ivrMenu?.keyOptions || {}).map(([key, opt]: any) => (
              <div key={key} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 flex items-center justify-center bg-emerald-600 text-white font-bold rounded">
                    {key}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-white">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">{opt.targetType} → {opt.targetValue}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TELECOM TRUNK & CARRIER CONNECTIVITY */}
      {activeTab === "TRUNK" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-200">Public PSTN Connectivity Readiness</h4>
              <p className="text-xs text-amber-300/90 mt-1">
                Internal calling, extensions, WebRTC & IVR operate 100% self-hosted on your server. Public cellular and landline calls require authorized telecom connectivity via a licensed SIP trunk or compliant hardware SIM gateway.
              </p>
              <div className="mt-3 p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
                <div className="text-emerald-400 font-semibold">Minimum Authorized Requirements:</div>
                <div className="text-slate-300">• Option A: Licensed SIP Trunk (Airtel / Jio / Tata / VI) with Host & Credentials</div>
                <div className="text-slate-300">• Option B: On-Premises GSM/VoIP Gateway hardware (Dinstar, Yeastar) with SIM cards</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
