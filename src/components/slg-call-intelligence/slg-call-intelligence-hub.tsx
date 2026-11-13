"use client";

import React, { useState } from "react";
import { SlgCallIntelligencePortal } from "./slg-call-intelligence-portal";
import { TelephonyFleetView } from "./telephony-fleet-view";
import { PhoneCall, Radio } from "lucide-react";

export function SlgCallIntelligenceHub() {
  const [activeView, setActiveView] = useState<"portal" | "telephony">("portal");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveView("portal")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeView === "portal"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          Analytics & Workstation Portal
        </button>
        <button
          onClick={() => setActiveView("telephony")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeView === "telephony"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Radio className="w-4 h-4" />
          Telephony Ingestion & Fleet Health
        </button>
      </div>

      {activeView === "portal" ? <SlgCallIntelligencePortal /> : <TelephonyFleetView />}
    </div>
  );
}
