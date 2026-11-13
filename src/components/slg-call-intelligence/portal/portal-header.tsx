"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PhoneCall,
  RefreshCw,
  Plus,
  Send,
  Radio,
  FileText,
  Building,
  HardDrive,
  Users,
} from "lucide-react";

export type PortalTabType = "analytics" | "presence" | "reports" | "tenant" | "devices" | "employees";

interface PortalHeaderProps {
  tenant: any;
  activeTab: PortalTabType;
  setActiveTab: (tab: PortalTabType) => void;
  isFetching: boolean;
  onRefresh: () => void;
  onOpenLogCall: () => void;
  onOpenSubmitReport: () => void;
  fleetCount: number;
  reportsCount: number;
}

export function PortalHeader({
  tenant,
  activeTab,
  setActiveTab,
  isFetching,
  onRefresh,
  onOpenLogCall,
  onOpenSubmitReport,
  fleetCount,
  reportsCount,
}: PortalHeaderProps) {
  return (
    <>
      {/* Top Organization & Tenant Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-md">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight">
              {tenant?.name || "SOFTLAB GLOBAL"} — Call Intelligence
            </h2>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
              {tenant?.planTier || "ENTERPRISE"} SAAS
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Unified Telephony Analytics, Employee Productivity, Live Workstation Tracking &
            Verified Daily Reporting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={onOpenLogCall}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Call Event
          </Button>

          <Button
            size="sm"
            onClick={onOpenSubmitReport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 shadow"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Daily Report
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "analytics"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          Call Analytics & Stream
        </button>

        <button
          onClick={() => setActiveTab("presence")}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "presence"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Radio className="w-4 h-4" />
          Live Agent Fleet ({fleetCount})
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "reports"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          Verified Daily Reports ({reportsCount})
        </button>

        <button
          onClick={() => setActiveTab("tenant")}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "tenant"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building className="w-4 h-4" />
          Tenant SaaS Quotas
        </button>

        <button
          onClick={() => setActiveTab("devices")}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "devices"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Devices & Webhook Fleet
        </button>

        <button
          onClick={() => setActiveTab("employees")}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "employees"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Staff Access & Hierarchy
        </button>
      </div>
    </>
  );
}
