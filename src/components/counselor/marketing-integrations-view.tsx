"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Globe,
  MessageSquare,
  Building,
  Webhook,
  Copy,
  Check,
  Play,
  Loader2,
  Phone,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { LeadSource } from "@prisma/client";

export function MarketingIntegrationsView() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testSuccessMsg, setTestSuccessMsg] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data, isLoading } = api.crm.getMarketingIntegrationStatus.useQuery();

  const testMutation = api.crm.testIngestLead.useMutation({
    onSuccess: (res) => {
      setTestSuccessMsg(`Successfully ingested simulated lead (ID: ${res.leadId})! Check Live Inbound Stream below.`);
      utils.crm.getMarketingIntegrationStatus.invalidate();
      utils.crm.listLeads.invalidate();
      utils.crm.getStats.invalidate();
      utils.crm.getPipelineOverview.invalidate();
      setTimeout(() => setTestSuccessMsg(null), 6000);
    },
    onError: (err) => {
      alert(`Test ingestion failed: ${err.message}`);
    },
  });

  const getFullUrl = (path: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`;
    }
    return `https://www.softlabglobal.com${path}`;
  };

  const handleCopy = (path: string) => {
    const fullUrl = getFullUrl(path);
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(path);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const channelCounts = data?.channelCounts || {};
  const recentLeads = data?.recentLeads || [];

  const handleRunTest = (platform: "JUSTDIAL" | "META" | "GOOGLE_ADS" | "WHATSAPP" | "UNIVERSAL") => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const mockNames: Record<string, string> = {
      JUSTDIAL: `Justdial Prospect ${randomSuffix}`,
      META: `Meta FB Lead ${randomSuffix}`,
      GOOGLE_ADS: `Google Search Inquirer ${randomSuffix}`,
      WHATSAPP: `WhatsApp Prospect ${randomSuffix}`,
      UNIVERSAL: `Webhook Landing Lead ${randomSuffix}`,
    };

    testMutation.mutate({
      platform,
      fullName: mockNames[platform],
      phone: `98765${randomSuffix}0`,
      email: `${platform.toLowerCase()}.${randomSuffix}@example.com`,
      city: "Prayagraj",
      courseName: "Full Stack Web Development & Cloud DevOps",
      campaignName: `${platform} Live Ads Campaign 2026`,
      notes: `Automated test lead generated from SoftLab Global Marketing Panel.`,
    });
  };

  const channels = [
    {
      id: "justdial",
      platform: "JUSTDIAL" as const,
      name: "Justdial Local Search",
      icon: <Building className="h-5 w-5 text-orange-600" />,
      badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
      path: "/api/webhooks/justdial",
      count: channelCounts[LeadSource.JUSTDIAL] || 0,
      description: "Receives real-time local search inquiries and course requirements directly from Justdial push API.",
      configInfo: "Format: JSON / Form-Data (leadid, name, mobile, category, city)",
    },
    {
      id: "meta",
      platform: "META" as const,
      name: "Meta Lead Ads (Facebook & Instagram)",
      icon: <Share2 className="h-5 w-5 text-blue-600" />,
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      path: "/api/webhooks/meta",
      secretKey: "softlab_meta_leadgen_2026",
      count: (channelCounts[LeadSource.META_ADS_FB] || 0) + (channelCounts[LeadSource.META_ADS_IG] || 0) + (channelCounts[LeadSource.META] || 0),
      description: "Instant ingestion of candidate form submissions from Facebook Newsfeed & Instagram Story Sponsored Ads.",
      configInfo: "Verify Token: softlab_meta_leadgen_2026 • Multi-Role Alerts Active",
    },
    {
      id: "google_ads",
      platform: "GOOGLE_ADS" as const,
      name: "Google Ads Lead Forms",
      icon: <Globe className="h-5 w-5 text-red-600" />,
      badgeColor: "bg-red-100 text-red-800 border-red-200",
      path: "/api/webhooks/google-ads",
      secretKey: "slg_gads_sec_8923f7c1b4d09e",
      count: (channelCounts[LeadSource.GOOGLE_ADS] || 0) + (channelCounts[LeadSource.GOOGLE_SEARCH] || 0),
      description: "Captures prospective students clicking Google Search lead form extensions and YouTube In-Feed ads.",
      configInfo: "Multi-Role Alerts: Counselor, Director, Admin & Super Admin",
    },
    {
      id: "whatsapp",
      platform: "WHATSAPP" as const,
      name: "WhatsApp Cloud API & Chatbot",
      icon: <MessageSquare className="h-5 w-5 text-emerald-600" />,
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      path: "/api/webhooks/whatsapp",
      count: channelCounts[LeadSource.WHATSAPP] || 0,
      description: "Direct prospective student WhatsApp inbound messages routed instantly to Telecallers and Counselors.",
      configInfo: "Verify Token: softlab_whatsapp_2026",
    },
    {
      id: "universal",
      platform: "UNIVERSAL" as const,
      name: "Universal Webhook (Zapier / Make / Landing Pages)",
      icon: <Webhook className="h-5 w-5 text-purple-600" />,
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      path: "/api/webhooks/leads",
      count: channelCounts[LeadSource.WEBSITE] || 0,
      description: "Standard REST webhook for connecting Zapier, Make.com, Pabbly Connect, Unbounce, or custom landing pages.",
      configInfo: "Accepts JSON: { fullName, phone, email, course, city }",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white shadow-xl border border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Multi-Platform Marketing Integration Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white">Live Ads & Webhook Ingestion Center</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Connect external marketing platforms (Justdial, Meta Facebook/Instagram Ads, Google Ads, WhatsApp, Zapier) to stream prospective student leads live into SoftLab Global CRM.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/integrations">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>Admin Integrations Hub</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Live Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          {channels.map((ch) => (
            <div key={ch.id} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
              <span className="text-[11px] text-slate-400 block truncate">{ch.name.split(" ")[0]} Inflow</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-white font-mono">{ch.count}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Live</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Alert Banner on Test Ingestion */}
      {testSuccessMsg && (
        <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 p-4 text-emerald-900 flex items-center justify-between text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{testSuccessMsg}</span>
          </div>
          <button
            onClick={() => setTestSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid of Webhook Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {channels.map((ch) => (
          <Card key={ch.id} className="border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                  {ch.icon}
                </div>
                <Badge variant="outline" className={`text-[10px] font-semibold ${ch.badgeColor}`}>
                  {ch.count} Leads Total
                </Badge>
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                {ch.name}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 leading-snug">
                {ch.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-0 text-xs">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Webhook URL:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(ch.path)}
                    className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold"
                  >
                    {copiedUrl === ch.path ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-[10px] text-slate-800 break-all bg-white p-1.5 rounded border border-slate-200">
                  {getFullUrl(ch.path)}
                </div>
                <p className="text-[10px] text-slate-400 italic pt-0.5">{ch.configInfo}</p>
              </div>

              {ch.secretKey && (
                <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-200/70 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-amber-800 font-medium">
                    <span>{ch.platform === "META" ? "Verify Token:" : "Secret Key:"}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(ch.secretKey!)}
                      className="text-amber-800 hover:text-amber-900 flex items-center gap-1 font-semibold"
                    >
                      {copiedKey === ch.secretKey ? (
                        <>
                          <Check className="h-3 w-3 text-amber-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Key</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-amber-950 break-all bg-white p-1.5 rounded border border-amber-200">
                    {ch.secretKey}
                  </div>
                </div>
              )}

              {/* 1-Click Test Ingestion Simulator Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRunTest(ch.platform)}
                disabled={testMutation.isPending}
                className="w-full text-xs font-semibold h-8 text-slate-700 hover:text-emerald-700 hover:border-emerald-300"
              >
                {testMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Simulating Webhook...
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    Send Test {ch.name.split(" ")[0]} Lead
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Ingested Leads Stream */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Real-Time Inbound Marketing Feed</span>
              <span className="text-xs font-normal text-slate-400">({data?.totalLeads || 0} total leads captured)</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Live prospective student stream arriving from Justdial, Meta Ads, Google Ads, and Webhooks
            </CardDescription>
          </div>
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link href="/counselor/leads" className="flex items-center gap-1">
              <span>View Full Pipeline</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading incoming leads...</div>
          ) : recentLeads.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No leads currently captured. Click &quot;Send Test Lead&quot; above to simulate real-time ingestion.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                    <th className="py-2.5 px-4 font-semibold">Prospect</th>
                    <th className="py-2.5 px-3 font-semibold">Contact Details</th>
                    <th className="py-2.5 px-3 font-semibold">Channel / Campaign</th>
                    <th className="py-2.5 px-3 font-semibold">Course Interest</th>
                    <th className="py-2.5 px-3 font-semibold">Assigned Staff</th>
                    <th className="py-2.5 px-3 font-semibold">Received</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLeads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 px-4">
                        <Link
                          href={`/counselor/leads/${lead.id}`}
                          className="font-bold text-slate-900 hover:text-emerald-600 transition"
                        >
                          {lead.fullName}
                        </Link>
                        <div className="text-[10px] text-slate-400">{lead.city || "Prayagraj"}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <div className="font-mono text-xs">{lead.phone}</div>
                        <div className="text-[10px] text-slate-400">{lead.email}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="secondary"
                          className={
                            lead.source === LeadSource.JUSTDIAL
                              ? "bg-orange-100 text-orange-800 border-orange-200 text-[10px]"
                              : lead.source === LeadSource.META_ADS_FB || lead.source === LeadSource.META_ADS_IG
                              ? "bg-blue-100 text-blue-800 border-blue-200 text-[10px]"
                              : lead.source === LeadSource.GOOGLE_ADS
                              ? "bg-red-100 text-red-800 border-red-200 text-[10px]"
                              : lead.source === LeadSource.WHATSAPP
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]"
                              : "bg-slate-100 text-slate-800 border-slate-200 text-[10px]"
                          }
                        >
                          {lead.source}
                        </Badge>
                        {lead.campaignName && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5">
                            {lead.campaignName}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                        {lead.course?.title || <span className="text-slate-400 italic">General Inquiry</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : "Auto Pool"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[10px]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {new Date(lead.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`tel:${lead.phone}`}
                            title="Call Prospect"
                            className="p-1.5 rounded-md bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-700 transition"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/91${lead.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            title="WhatsApp Chat"
                            className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 transition"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </a>
                          <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-slate-700 hover:bg-slate-100">
                            <Link href={`/counselor/leads/${lead.id}`}>Review</Link>
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
    </div>
  );
}
