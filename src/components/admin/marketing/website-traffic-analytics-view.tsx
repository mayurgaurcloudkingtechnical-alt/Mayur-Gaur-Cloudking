"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  TrendingUp,
  Users,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Radio,
  Clock,
  Layers,
  PhoneCall,
  GraduationCap,
  RefreshCw,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { trackEvent, trackLeadSubmission } from "@/lib/analytics";

export function WebsiteTrafficAnalyticsView() {
  const [testSent, setTestSent] = useState(false);
  const { data, isLoading, refetch, isFetching } = api.crm.getWebsiteTrafficAnalytics.useQuery(undefined, {
    refetchInterval: 30000, // Auto refresh every 30s
  });

  const ga = data?.gaConfig;
  const summary = data?.summary;
  const recentLeads = data?.recentLeads || [];

  const handleSendTestPing = () => {
    trackEvent("admin_telemetry_test_ping", {
      event_category: "Diagnostics",
      event_label: "LMS Admin Traffic Check",
      timestamp: new Date().toISOString(),
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 5000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & GA4 Tag Connection Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Google Analytics 4 • Live Telemetry Stream</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Website Traffic & Lead Analytics
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time Google Analytics (GA4) stream for{" "}
              <strong className="text-white">softlabglobal.com</strong>. Track candidate visits,
              source attribution, page transitions, and instant CRM lead ingestion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs h-9 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-emerald-400" : ""}`} />
              <span>Refresh Telemetry</span>
            </Button>

            <Button
              asChild
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 gap-2 shadow-lg shadow-emerald-950/50"
            >
              <a
                href="https://analytics.google.com/analytics/web/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Open Google Analytics</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. GA4 Web Stream Configuration & Verification Diagnostics */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Stream Details & Tag Configuration</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                    Active & Listening
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Configured in Next.js layout and SPA router listener
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendTestPing}
              className="text-xs h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              <span>{testSent ? "Test Ping Sent to GA4!" : "Send Realtime Test Ping"}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Stream Name</p>
              <p className="text-sm font-bold text-slate-900">{ga?.streamName || "softlabglobal"}</p>
              <p className="text-[11px] text-slate-400 font-mono truncate">{ga?.streamUrl || "https://www.softlabglobal.com"}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Measurement ID</p>
              <p className="text-sm font-mono font-extrabold text-emerald-700">{ga?.measurementId || "G-7F6R0124G6"}</p>
              <p className="text-[11px] text-emerald-600 font-medium">● Data Stream Active</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Stream ID</p>
              <p className="text-sm font-mono font-bold text-slate-800">{ga?.streamId || "16144183114"}</p>
              <p className="text-[11px] text-slate-500">Web Data Stream</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Google Ads Tag</p>
              <p className="text-sm font-mono font-bold text-slate-800">{ga?.googleAdsId || "AW-18444757013"}</p>
              <p className="text-[11px] text-sky-600 font-medium">Linked for Lead Conversion</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Inbound Website Lead Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Website Leads</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{summary?.totalLeads ?? 0}</div>
          <p className="text-[11px] text-slate-500">Total inquiries captured on web</p>
        </Card>

        <Card className="border-slate-200 shadow-sm p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Inbound</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700">{summary?.todayLeads ?? 0}</div>
          <p className="text-[11px] text-slate-500">Captured in last 24 hours</p>
        </Card>

        <Card className="border-slate-200 shadow-sm p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">This Month's Inbound</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">{summary?.monthLeads ?? 0}</div>
          <p className="text-[11px] text-slate-500">Monthly cumulative volume</p>
        </Card>

        <Card className="border-slate-200 shadow-sm p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Confirmed Admissions</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
            <span>{summary?.admittedLeads ?? 0}</span>
            <span className="text-xs font-bold text-emerald-600">({summary?.conversionRate ?? "0.0"}%)</span>
          </div>
          <p className="text-[11px] text-slate-500">Website lead to admission conversion</p>
        </Card>
      </div>

      {/* 4. Deep-Link Quick Navigation to Official Google Analytics Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="https://analytics.google.com/analytics/web/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600">Realtime User Activity</h4>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            View live active users browsing softlabglobal.com in the last 30 minutes, their geographic cities, and current pages.
          </p>
        </a>

        <a
          href="https://analytics.google.com/analytics/web/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Traffic Acquisition</h4>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Analyze channel breakdown: Organic Google Search, Meta/Instagram Ads, Google Ads, Direct Navigation, and Referral Traffic.
          </p>
        </a>

        <a
          href="https://analytics.google.com/analytics/web/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-purple-500 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600">Key Events & Leads</h4>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Track custom conversion events: <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">generate_lead</code>, <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">contact</code>, and counselor consultation inquiries.
          </p>
        </a>
      </div>

      {/* 5. Recent Website Inquiries Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/80 border-b border-slate-200/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Recent Inbound Website Leads
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Real-time inquiries automatically captured into the CRM pipeline
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs h-8">
              <Link href="/admin/leads">View All in CRM</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentLeads.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No website leads recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Phone / City</th>
                    <th className="py-3 px-4">Target Program / Course</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Counselor</th>
                    <th className="py-3 px-4">Captured Time</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLeads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {lead.fullName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {lead.phone} • {lead.city}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {lead.courseName}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            lead.status === "ADMITTED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : lead.status === "NEW"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {lead.counselorName}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50">
                          <Link href={`/admin/leads/${lead.id}`}>View Lead →</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
