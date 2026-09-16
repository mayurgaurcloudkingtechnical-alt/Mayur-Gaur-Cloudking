"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  Users,
  Target,
  PhoneCall,
  DollarSign,
  Activity,
  Globe,
  Settings2,
  CheckCircle2,
  Share2,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Instagram,
  Heart,
  Eye,
  BarChart3,
  Film,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export function MarketingAnalyticsView() {
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [callingNumber, setCallingNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [dailyLeadQuota, setDailyLeadQuota] = useState(50);
  const [isLeadAccepting, setIsLeadAccepting] = useState(true);

  const utils = api.useUtils();

  const { data: analytics, isLoading: isLoadingAnalytics } =
    api.crm.getMarketingAnalytics.useQuery();

  const { data: counselors = [], isLoading: isLoadingStaff } =
    api.crm.listCounselors.useQuery();

  const { data: igData, isLoading: isLoadingIg, refetch: refetchIg } =
    api.crm.getInstagramAnalytics.useQuery(undefined, { refetchInterval: 5 * 60 * 1000 });

  const updateStaffMutation = api.crm.updateStaffCommunication.useMutation({
    onSuccess: () => {
      setEditingStaff(null);
      utils.crm.listCounselors.invalidate();
    },
  });

  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [simulatedFeedback, setSimulatedFeedback] = useState<string | null>(null);

  const simulateMutation = api.crm.simulateMetaLead.useMutation({
    onSuccess: (res: any) => {
      setSimulatedFeedback(
        `Live FB Lead Ingested (ID: ${res.leadId || "Active"}). Routed to ${res.assignedRole || "Telecaller"} & triggered 15-sec instant AI responder.`
      );
      utils.crm.getMarketingAnalytics.invalidate();
      setTimeout(() => setSimulatedFeedback(null), 7000);
    },
    onError: (err: any) => {
      setSimulatedFeedback(`Simulation failed: ${err.message}`);
      setTimeout(() => setSimulatedFeedback(null), 7000);
    },
  });

  const platforms = analytics?.platforms;
  const recentActivities = analytics?.recentActivities || [];

  const totalLeads =
    (platforms?.justdial.total ?? 0) +
    (platforms?.googleAds.total ?? 0) +
    (platforms?.metaAds.total ?? 0) +
    (platforms?.website.total ?? 0);

  const totalAdmissions =
    (platforms?.justdial.admitted ?? 0) +
    (platforms?.googleAds.admitted ?? 0) +
    (platforms?.metaAds.admitted ?? 0) +
    (platforms?.website.admitted ?? 0);

  const overallConversion = totalLeads > 0 ? ((totalAdmissions / totalLeads) * 100).toFixed(1) : "0.0";

  const handleEditClick = (staff: any) => {
    setEditingStaff(staff);
    setCallingNumber(staff.callingNumber || "");
    setWhatsappNumber(staff.whatsappNumber || "");
    setDailyLeadQuota(staff.dailyLeadQuota || 50);
    setIsLeadAccepting(staff.isLeadAccepting ?? true);
  };

  const handleSaveStaff = () => {
    if (!editingStaff) return;
    updateStaffMutation.mutate({
      userId: editingStaff.id,
      callingNumber: callingNumber.trim() || null,
      whatsappNumber: whatsappNumber.trim() || null,
      dailyLeadQuota,
      isLeadAccepting,
    });
  };

  return (
    <div className="space-y-6">
      {/* High Level KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              Total Ingested Leads
              <Target className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-slate-900">{totalLeads}</div>
            <p className="text-xs text-slate-500 mt-1">Cross-platform total (JustDial, Google, Meta, Web)</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center justify-between">
              Admissions Closed
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-700">{totalAdmissions}</div>
            <p className="text-xs text-slate-500 mt-1">Confirmed student enrollments</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-purple-600 uppercase tracking-wider flex items-center justify-between">
              Conversion Ratio
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-purple-700">{overallConversion}%</div>
            <p className="text-xs text-slate-500 mt-1">Overall lead-to-student conversion</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center justify-between">
              AI Bot Engagements
              <Sparkles className="h-4 w-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-700">100% Active</div>
            <p className="text-xs text-slate-500 mt-1">15-sec instant WhatsApp auto-responder</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance Comparison */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Marketing Platform Performance & ROI Comparison
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Real-time attribution breakdown for JustDial, Google Ads, Meta Ads (FB/IG), and Website Leads.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* JustDial Card */}
            <div className="p-4 rounded-lg border border-orange-200 bg-orange-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-orange-600 text-white text-xs font-semibold">JustDial</Badge>
                <span className="text-xs text-slate-500 font-medium">To Counselor</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {platforms?.justdial.total ?? 0}
              </div>
              <div className="text-xs text-slate-600 flex justify-between">
                <span>Admissions: <strong>{platforms?.justdial.admitted ?? 0}</strong></span>
                <span>Conv: <strong>{platforms?.justdial.conversionRate ?? "0.0"}%</strong></span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-1.5 mt-2">
                <div
                  className="bg-orange-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Number(platforms?.justdial.conversionRate ?? 0))}%` }}
                />
              </div>
            </div>

            {/* Google Ads Card */}
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-600 text-white text-xs font-semibold">Google Ads</Badge>
                <span className="text-xs text-slate-500 font-medium">To Counselor</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {platforms?.googleAds.total ?? 0}
              </div>
              <div className="text-xs text-slate-600 flex justify-between">
                <span>Admissions: <strong>{platforms?.googleAds.admitted ?? 0}</strong></span>
                <span>Conv: <strong>{platforms?.googleAds.conversionRate ?? "0.0"}%</strong></span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Number(platforms?.googleAds.conversionRate ?? 0))}%` }}
                />
              </div>
            </div>

            {/* Meta Ads (Facebook) Card */}
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-[#1877F2] text-white text-xs font-semibold">Meta (Facebook)</Badge>
                <span className="text-xs text-slate-500 font-medium">To Telecaller</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {(platforms as any)?.facebookAds?.total ?? platforms?.metaAds.total ?? 0}
              </div>
              <div className="text-xs text-slate-600 flex justify-between">
                <span>Admissions: <strong>{(platforms as any)?.facebookAds?.admitted ?? platforms?.metaAds.admitted ?? 0}</strong></span>
                <span>Conv: <strong>{(platforms as any)?.facebookAds?.conversionRate ?? platforms?.metaAds.conversionRate ?? "0.0"}%</strong></span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                <div
                  className="bg-[#1877F2] h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Number((platforms as any)?.facebookAds?.conversionRate ?? platforms?.metaAds.conversionRate ?? 0))}%` }}
                />
              </div>
            </div>

            {/* Instagram Card (@softlabglobal9) */}
            <div className="p-4 rounded-lg border border-pink-200 bg-gradient-to-b from-pink-50/60 to-purple-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-semibold flex items-center gap-1">
                  <Instagram className="h-3 w-3" />
                  Instagram
                </Badge>
                <span className="text-xs text-pink-700 font-medium">To Telecaller</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {(platforms as any)?.instagram?.total ?? 0}
              </div>
              <div className="text-xs text-slate-600 flex justify-between">
                <span>Admissions: <strong>{(platforms as any)?.instagram?.admitted ?? 0}</strong></span>
                <span>Conv: <strong>{(platforms as any)?.instagram?.conversionRate ?? "0.0"}%</strong></span>
              </div>
              <div className="w-full bg-pink-200 rounded-full h-1.5 mt-2">
                <div
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Number((platforms as any)?.instagram?.conversionRate ?? 0))}%` }}
                />
              </div>
            </div>

            {/* Website & Chatbot Card */}
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-600 text-white text-xs font-semibold">Website & Chatbot</Badge>
                <span className="text-xs text-slate-500 font-medium">To Telecaller</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {platforms?.website.total ?? 0}
              </div>
              <div className="text-xs text-slate-600 flex justify-between">
                <span>Admissions: <strong>{platforms?.website.admitted ?? 0}</strong></span>
                <span>Conv: <strong>{platforms?.website.conversionRate ?? "0.0"}%</strong></span>
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-2">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Number(platforms?.website.conversionRate ?? 0))}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meta & Facebook Live Boost Ad Inbuilt Command Center */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-900/5 via-indigo-900/5 to-purple-900/5 shadow-sm border-l-4 border-l-[#1877F2]">
        <CardHeader className="p-4 border-b border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1877F2] text-white">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </span>
              <CardTitle className="text-base font-bold text-slate-900">
                Official Meta & Facebook Boost Ad Inbuilt Hub
              </CardTitle>
              <Badge className="bg-emerald-600 text-white text-[10px] font-semibold tracking-wide">
                ● LIVE BOOST ACTIVE
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-600">
              Directly linked to SoftLab Global Facebook Page (<code>ID: 1322487780950878</code>) and Active Boost Ad (<code>ID: 1324192984113691</code>).
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined") {
                  navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/meta`);
                  setCopiedWebhook(true);
                  setTimeout(() => setCopiedWebhook(false), 2500);
                }
              }}
              className="h-8 text-xs border-blue-300 text-blue-800 hover:bg-blue-50"
            >
              {copiedWebhook ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Webhook Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy Ingestion Webhook
                </>
              )}
            </Button>

            <a
              href="https://www.facebook.com/ad_center/manage/?boost_id=1324192984113691&entry_point=www_ad_center_overview_ad_cards&page_id=1322487780950878"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                className="bg-[#1877F2] hover:bg-blue-700 text-white h-8 text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <span>Manage in Facebook Ad Center</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {simulatedFeedback && (
            <div
              className={`p-3 rounded-md text-xs font-medium ${
                simulatedFeedback.startsWith("Live")
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {simulatedFeedback}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-slate-500">Facebook Page</span>
              <div className="font-bold text-slate-900 truncate">SoftLab Global</div>
              <div className="text-[11px] font-mono text-slate-500">Page ID: 1322487780950878</div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-slate-500">Active Boost Campaign</span>
              <div className="font-bold text-blue-700 truncate">Admissions & Course Boost</div>
              <div className="text-[11px] font-mono text-slate-500">Boost ID: 1324192984113691</div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-slate-500">Boost Ingested Leads</span>
              <div className="text-xl font-extrabold text-slate-900">
                {(analytics as any)?.activeBoostCampaign?.totalLeads ?? 0}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                {(analytics as any)?.activeBoostCampaign?.admittedLeads ?? 0} Admitted (
                {(analytics as any)?.activeBoostCampaign?.conversionRate ?? "0.0"}%)
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-slate-500">Auto Ingestion & Routing</span>
              <div className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> 100% Telecaller Inbuilt
              </div>
              <div className="text-[11px] text-slate-500">15s Instant WhatsApp Bot Active</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-600 bg-white/80 p-3 rounded-lg border border-blue-100">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Live Ingestion & Telecaller Dispatch Simulator
              </div>
              <p className="text-[11px] text-slate-500">
                Generate a live prospect inquiry tied directly to Boost Ad <code>#1324192984113691</code> to test fair round-robin dispatch.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                disabled={simulateMutation.isPending}
                onClick={() => {
                  simulateMutation.mutate({
                    fullName: `FB Boost Prospect (${Math.floor(100 + Math.random() * 900)})`,
                    phone: `919408${Math.floor(1000 + Math.random() * 9000)}`,
                    city: "Prayagraj",
                    source: "META_ADS_FB",
                    notes: "Facebook Ad Center Boost #1324192984113691 - Course Inquiry Form",
                  });
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs font-semibold"
              >
                {simulateMutation.isPending ? "Ingesting..." : "Simulate Live Facebook Lead"}
              </Button>
              <Button
                size="sm"
                disabled={simulateMutation.isPending}
                onClick={() => {
                  simulateMutation.mutate({
                    fullName: `Instagram Prospect (${Math.floor(100 + Math.random() * 900)})`,
                    phone: `919408${Math.floor(1000 + Math.random() * 9000)}`,
                    city: "Prayagraj",
                    source: "META_ADS_IG",
                    notes: "Instagram DM / Reel Inquiry from @softlabglobal9 - Student Course Form",
                  });
                }}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white h-8 text-xs font-semibold flex items-center gap-1.5"
              >
                <Instagram className="h-3.5 w-3.5" />
                {simulateMutation.isPending ? "Ingesting..." : "Simulate Instagram Lead"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =====================================================================
          INSTAGRAM OFFICIAL ANALYTICS HUB — @softlabglobal9
         ===================================================================== */}
      <Card className="border-pink-200 bg-gradient-to-r from-pink-900/5 via-purple-900/5 to-orange-900/5 shadow-sm border-l-4 border-l-pink-500">
        <CardHeader className="p-4 border-b border-pink-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 text-white shadow-sm">
                <Instagram className="h-4 w-4" />
              </span>
              <CardTitle className="text-base font-bold text-slate-900">
                Instagram Official Analytics — {igData?.handle ?? "@softlabglobal9"}
              </CardTitle>
              {igData?.isConfigured ? (
                <Badge className="bg-emerald-600 text-white text-[10px] font-semibold tracking-wide">
                  ● LIVE DATA
                </Badge>
              ) : (
                <Badge className="bg-amber-500 text-white text-[10px] font-semibold tracking-wide">
                  ⚙ SETUP REQUIRED
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-slate-600">
              Real-time followers, likes, views, reach, DM messages, and post-wise performance for{" "}
              <a href={igData?.profileUrl ?? "https://www.instagram.com/softlabglobal9/"} target="_blank" rel="noopener noreferrer" className="text-pink-600 font-semibold underline underline-offset-2">
                {igData?.handle ?? "@softlabglobal9"}
              </a>
              {" "}via Instagram Graph API.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchIg()}
              disabled={isLoadingIg}
              className="h-8 text-xs border-pink-300 text-pink-800 hover:bg-pink-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoadingIg ? "animate-spin" : ""}`} />
              Refresh Analytics
            </Button>
            <a href={igData?.profileUrl ?? "https://www.instagram.com/softlabglobal9/"} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 text-white h-8 text-xs font-semibold shadow-sm flex items-center gap-1.5 hover:opacity-90">
                <span>Open Instagram Profile</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-5">
          {/* ---- NOT CONFIGURED STATE — Setup Guide ---- */}
          {!igData?.isConfigured && (
            <div className="space-y-4">
              {/* Profile Setup Block */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Instagram API Token Not Configured — Activate Live Analytics
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Complete the following steps to connect <strong>@softlabglobal9</strong> and see live followers, likes, views, and DM messages directly in this admin panel.
                </p>
                <div className="space-y-2">
                  {(igData?.setupSteps ?? [
                    "Step 1: Open Instagram App → Settings & Privacy → Account type and tools → Switch to Professional Account → Choose Education",
                    "Step 2: Link @softlabglobal9 to SoftLab Global Facebook Page (same Meta account)",
                    "Step 3: Go to developers.facebook.com → My Apps → Create App → Business → Add Instagram Graph API product",
                    "Step 4: In App Dashboard → Instagram → Generate Access Token for your linked Instagram Business Account",
                    "Step 5: Copy INSTAGRAM_BUSINESS_ACCOUNT_ID (17-digit numeric ID) and INSTAGRAM_ACCESS_TOKEN",
                    "Step 6: Add both values to .env file and restart server — Live analytics will activate automatically",
                  ]).map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-amber-900">
                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step.replace(`Step ${i + 1}: `, "")}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1 flex-wrap">
                  <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="h-7 text-xs border-amber-400 text-amber-800 hover:bg-amber-100">
                      Open Meta Developers Portal <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                  <a href="https://www.instagram.com/softlabglobal9/" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="h-7 text-xs border-pink-400 text-pink-700 hover:bg-pink-50">
                      Open @softlabglobal9 <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                </div>
              </div>

              {/* Recommended Profile Bio Box */}
              <div className="p-4 rounded-xl bg-pink-50/80 border border-pink-200 space-y-2">
                <p className="text-xs font-bold text-pink-900 flex items-center gap-1.5">
                  <Instagram className="h-3.5 w-3.5" />
                  Recommended Profile Bio for @softlabglobal9 (Copy-Paste Ready)
                </p>
                <div className="p-3 bg-white rounded-lg border border-pink-100 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {igData?.recommendedBio ?? "🚀 Master Full Stack, AI/ML & Cyber Security\n💻 Industry-Ready Coding Labs & Placement Desk\n📍 Civil Lines, Prayagraj (Opp. Rai & Co.)\n👇 Admissions Open | Apply / Syllabus"}
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p><strong>Category:</strong> {igData?.category ?? "Education / Information Technology Company"}</p>
                  <p><strong>Website Link:</strong> <a href={igData?.recommendedWebsite ?? "https://www.softlabglobal.com/courses"} target="_blank" rel="noopener noreferrer" className="text-pink-600 underline">{igData?.recommendedWebsite ?? "https://www.softlabglobal.com/courses"}</a></p>
                </div>
              </div>

              {/* Content Pillars & Posting Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
                  <p className="text-xs font-bold text-slate-700">Daily Posting Pillars (15-day calendar ready)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(igData?.contentPillars ?? ["Full Stack Dev", "Data Science & AI", "Cyber Security", "Campus Life", "Career & Placements"]).map((p) => (
                      <span key={p} className="text-[10px] font-semibold bg-pink-100 text-pink-800 border border-pink-200 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
                  <p className="text-xs font-bold text-slate-700">Optimal Posting Times</p>
                  {(igData?.optimalPostingTimes ?? ["12:30 PM IST", "7:30 PM IST"]).map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-xs text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {t} — Peak reach for Prayagraj/UP student audience
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-500">Use Meta Business Suite to auto-schedule up to 75 days in advance.</p>
                </div>
              </div>
            </div>
          )}

          {/* ---- CONFIGURED STATE — Live Analytics ---- */}
          {igData?.isConfigured && (
            <div className="space-y-4">
              {/* Error Banner */}
              {(igData as any)?.error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  {(igData as any).error}
                </div>
              )}

              {/* Profile Summary Row */}
              {igData.profile && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-pink-100 shadow-xs text-center space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Followers</div>
                    <div className="text-2xl font-extrabold text-pink-600">{igData.profile.followers.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs text-center space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Following</div>
                    <div className="text-2xl font-extrabold text-slate-700">{igData.profile.following.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs text-center space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Posts</div>
                    <div className="text-2xl font-extrabold text-slate-700">{igData.profile.totalPosts}</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-emerald-100 shadow-xs text-center space-y-1">
                    <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">DM Messages</div>
                    <div className="text-2xl font-extrabold text-emerald-700">{igData.summary?.dmCount ?? 0}</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-purple-100 shadow-xs text-center space-y-1">
                    <div className="text-[11px] font-semibold text-purple-600 uppercase tracking-wide">Engagement</div>
                    <div className="text-2xl font-extrabold text-purple-700">{igData.summary?.engagementRate ?? "0.00"}%</div>
                  </div>
                </div>
              )}

              {/* Summary Metrics */}
              {igData.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg border border-pink-100 bg-pink-50/50 space-y-1 flex items-center gap-3">
                    <Heart className="h-5 w-5 text-pink-500 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Total Likes (Last 12)</div>
                      <div className="text-lg font-bold text-pink-700">{igData.summary.totalLikes.toLocaleString("en-IN")}</div>
                      <div className="text-[10px] text-slate-400">Avg {igData.summary.avgLikesPerPost} / post</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/50 space-y-1 flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-500 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Total Comments</div>
                      <div className="text-lg font-bold text-blue-700">{igData.summary.totalComments.toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-purple-100 bg-purple-50/50 space-y-1 flex items-center gap-3">
                    <Eye className="h-5 w-5 text-purple-500 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Total Video Views</div>
                      <div className="text-lg font-bold text-purple-700">{igData.summary.totalViews.toLocaleString("en-IN")}</div>
                      <div className="text-[10px] text-slate-400">Avg {igData.summary.avgViewsPerReel} / reel</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 space-y-1 flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Total Reach</div>
                      <div className="text-lg font-bold text-emerald-700">{igData.summary.totalReach.toLocaleString("en-IN")}</div>
                      <div className="text-[10px] text-slate-400">{igData.summary.totalImpressions.toLocaleString("en-IN")} impressions</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Post Type Breakdown */}
              {igData.summary && (
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Film className="h-3.5 w-3.5 text-pink-500" /> Reels: <strong className="text-pink-700">{igData.summary.reelCount}</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Share2 className="h-3.5 w-3.5 text-purple-500" /> Carousels: <strong className="text-purple-700">{igData.summary.carouselCount}</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Instagram className="h-3.5 w-3.5 text-orange-500" /> Single Posts: <strong className="text-orange-700">{igData.summary.imageCount}</strong>
                  </span>
                </div>
              )}

              {/* Post-wise Performance Table */}
              {igData.posts.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                        <th className="py-2.5 px-3 font-semibold">Post / Reel</th>
                        <th className="py-2.5 px-3 font-semibold">Type</th>
                        <th className="py-2.5 px-3 font-semibold text-right">❤ Likes</th>
                        <th className="py-2.5 px-3 font-semibold text-right">💬 Comments</th>
                        <th className="py-2.5 px-3 font-semibold text-right">▶ Views</th>
                        <th className="py-2.5 px-3 font-semibold text-right">📢 Reach</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Open</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {igData.posts.map((post) => (
                        <tr key={post.id} className="hover:bg-pink-50/30">
                          <td className="py-2.5 px-3 max-w-[200px]">
                            <p className="truncate text-slate-800">{post.caption || "—"}</p>
                            <p className="text-[10px] text-slate-400">{new Date(post.timestamp).toLocaleDateString("en-IN")}</p>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              className={`text-[10px] font-semibold ${
                                post.type === "VIDEO" || post.type === "REEL"
                                  ? "bg-pink-100 text-pink-700 border-pink-200"
                                  : post.type === "CAROUSEL_ALBUM"
                                  ? "bg-purple-100 text-purple-700 border-purple-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                              variant="outline"
                            >
                              {post.type === "VIDEO" || post.type === "REEL" ? "Reel" : post.type === "CAROUSEL_ALBUM" ? "Carousel" : "Post"}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-pink-700">{post.likes.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-blue-700">{post.comments.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-purple-700">{post.views.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{post.reach.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 px-3 text-right">
                            {post.permalink && (
                              <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Management & Dedicated Communication Numbers */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-slate-700" />
              Dynamic Staff Communication & Quota Manager
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Assign dedicated official WhatsApp numbers, calling numbers, and daily lead capacities without modifying source code.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                  <th className="py-3 px-4 font-semibold">Staff Member</th>
                  <th className="py-3 px-3 font-semibold">Role</th>
                  <th className="py-3 px-3 font-semibold">Calling Number</th>
                  <th className="py-3 px-3 font-semibold">Official WhatsApp #</th>
                  <th className="py-3 px-3 font-semibold">Daily Quota</th>
                  <th className="py-3 px-3 font-semibold">Status / Availability</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {counselors.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {staff.firstName} {staff.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400">{staff.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant="secondary"
                        className={
                          staff.roleCode === "COUNSELOR"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : staff.roleCode === "TELECALLER"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-100 text-slate-700"
                        }
                      >
                        {staff.roleCode}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {staff.callingNumber || <span className="text-slate-400 italic">Not configured</span>}
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-700 font-medium">
                      {staff.whatsappNumber || <span className="text-slate-400 italic">Not configured</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-semibold">
                      {staff.dailyLeadQuota} leads/day
                    </td>
                    <td className="py-3 px-3">
                      {staff.isLeadAccepting ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Accepting Leads
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Paused / Leave
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(staff)}
                        className="h-7 text-xs border-slate-300"
                      >
                        Configure Lines
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Live Activity Stream */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            Live Digital Marketing Activity Feed
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Real-time feed of webhooks ingested, AI auto-replies dispatched, and counselor conversions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {recentActivities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent automated marketing activities recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act: any) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between p-3 rounded-md bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge className="text-[10px] bg-slate-900 text-white">{act.activityType}</Badge>
                      <span className="font-semibold text-slate-900">{act.lead?.fullName}</span>
                      <span className="text-slate-400">({act.lead?.phone})</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{act.notes}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    {new Date(act.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Configure {editingStaff.firstName} {editingStaff.lastName} ({editingStaff.roleCode})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Set dedicated phone lines, WhatsApp integration, and daily lead load limit.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Calling Number
                </label>
                <Input
                  placeholder="+919876543210"
                  value={callingNumber}
                  onChange={(e) => setCallingNumber(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dedicated Official WhatsApp Number
                </label>
                <Input
                  placeholder="+919876543210"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Lead Ingestion Quota
                </label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={dailyLeadQuota}
                  onChange={(e) => setDailyLeadQuota(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="leadToggle"
                  checked={isLeadAccepting}
                  onChange={(e) => setIsLeadAccepting(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="leadToggle" className="text-xs font-semibold text-slate-800">
                  Accept New Inbound Leads (Uncheck when staff is on leave)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingStaff(null)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={updateStaffMutation.isPending}
                  onClick={handleSaveStaff}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                >
                  {updateStaffMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
