"use client";

import React from "react";
import { api } from "@/lib/trpc/react";
import {
  ShieldAlert,
  UserCheck,
  Building2,
  ChevronRight,
  Phone,
  Mail,
  Award,
  ArrowRight,
  Users,
  Briefcase,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ReportingHierarchyBanner() {
  const { data: hierarchy, isLoading } = api.crm.getMyReportingHierarchy.useQuery(undefined, {
    staleTime: 60000,
  });

  if (isLoading || !hierarchy) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const { user, manager, hierarchySteps } = hierarchy;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Top Bar: Staff Identity & Immediate Reporting Manager */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80">
        {/* Left: Current Active Staff */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">{user.name}</h2>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                {user.roleCode} • ACTIVE
              </Badge>
            </div>
            <p className="text-xs text-blue-200 font-medium">{user.designation}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>Dept: <strong className="text-slate-300">{user.department}</strong></span>
              <span>•</span>
              <span>Branch: <strong className="text-slate-300">Prayagraj Main Campus</strong></span>
            </p>
          </div>
        </div>

        {/* Right: Direct Reporting Manager Card */}
        <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-4 sm:min-w-[320px]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
              <UserCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <span>Immediate Reporting Manager</span>
              </div>
              <h3 className="text-xs font-bold text-white">{manager.name}</h3>
              <p className="text-[11px] text-slate-300">{manager.designation}</p>
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-400 border-l border-slate-700/60 pl-3 space-y-0.5 shrink-0 hidden sm:block">
            <p className="text-slate-300 flex items-center justify-end gap-1">
              <Phone className="w-2.5 h-2.5 text-emerald-400" />
              <span>{manager.phone}</span>
            </p>
            <p className="text-slate-300 flex items-center justify-end gap-1 truncate max-w-[140px]">
              <Mail className="w-2.5 h-2.5 text-sky-400" />
              <span>{manager.email}</span>
            </p>
            <span className="inline-block text-[9px] text-emerald-400 font-semibold mt-0.5">
              Escalation Desk
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Full Chain of Command (Starting to End Hierarchy) */}
      <div className="bg-slate-950/70 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official Chain of Command & Hierarchy (Level 1 to Level 5)</span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Direct Governance • Transparent Reporting
          </span>
        </div>

        {/* Hierarchy Progress Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
          {hierarchySteps.map((step, idx) => {
            const isUserLevel = step.isCurrent;
            const isNext = idx === hierarchySteps.findIndex((s) => s.isCurrent) + 1;

            return (
              <div
                key={step.level}
                className={`relative rounded-xl p-2.5 border transition-all ${
                  isUserLevel
                    ? "bg-emerald-950/50 border-emerald-500 shadow-md ring-1 ring-emerald-500/50"
                    : isNext
                    ? "bg-blue-950/40 border-blue-500/60"
                    : "bg-slate-900/60 border-slate-800 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[9px] font-mono font-bold text-slate-400">
                    L-{step.level}
                  </span>
                  {isUserLevel && (
                    <span className="bg-emerald-500 text-slate-950 text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full tracking-wider animate-pulse">
                      YOU
                    </span>
                  )}
                  {isNext && (
                    <span className="bg-blue-500 text-white text-[8px] font-bold uppercase px-1.5 py-0.2 rounded-full tracking-wider">
                      REPORTS TO
                    </span>
                  )}
                </div>

                <h4
                  className={`text-xs font-bold leading-tight ${
                    isUserLevel ? "text-emerald-300" : isNext ? "text-blue-200" : "text-slate-200"
                  }`}
                >
                  {step.title}
                </h4>

                <p className="text-[9.5px] text-slate-400 mt-1 leading-snug line-clamp-2">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
