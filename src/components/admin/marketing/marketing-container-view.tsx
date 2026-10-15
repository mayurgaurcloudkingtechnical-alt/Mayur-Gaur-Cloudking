"use client";

import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MarketingAnalyticsView } from "@/components/admin/marketing-analytics-view";
import { MetaLeadsDashboard } from "@/components/admin/marketing/meta-leads-dashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BarChart3, Share2, Sparkles, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function MarketingContainerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<"analytics" | "meta-leads">(
    tabParam === "meta-leads" ? "meta-leads" : "analytics"
  );

  useEffect(() => {
    if (tabParam === "meta-leads") {
      setActiveTab("meta-leads");
    } else if (tabParam === "analytics") {
      setActiveTab("analytics");
    }
  }, [tabParam]);

  const handleTabChange = (tab: "analytics" | "meta-leads") => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    router.replace(url.pathname + url.search, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Navigation Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("analytics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "analytics"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Ad Intelligence & Analytics</span>
            <Badge variant="outline" className={`text-[10px] ml-1 ${activeTab === "analytics" ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-500"}`}>
              Multi-Channel
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("meta-leads")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "meta-leads"
                ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sm"
                : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Share2 className="h-4 w-4" />
            <span>Meta Lead Ads Engine</span>
            <Badge className={`text-[10px] ml-1 ${activeTab === "meta-leads" ? "bg-white/20 text-white border-0" : "bg-sky-50 text-sky-700 border border-sky-200"}`}>
              Graph API v21.0
            </Badge>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-semibold text-slate-600">
            {activeTab === "meta-leads" ? "Webhook Ingestion Active" : "Campaign Telemetry Live"}
          </span>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "analytics" && <MarketingAnalyticsView />}
      {activeTab === "meta-leads" && <MetaLeadsDashboard />}
    </div>
  );
}

export function MarketingContainerView() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading Marketing Command Center..." />
        </div>
      }
    >
      <MarketingContainerInner />
    </Suspense>
  );
}
