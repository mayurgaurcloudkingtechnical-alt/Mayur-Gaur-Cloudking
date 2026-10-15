"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Copy,
  ExternalLink,
  PlusCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Layers,
  PhoneCall,
  RotateCcw,
  Zap,
  Sliders,
  Filter,
} from "lucide-react";

export function MetaLeadsDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "routing" | "logs" | "forms">("overview");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const utils = api.useUtils();
  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } =
    api.metaAds.getConnectionStatus.useQuery();

  const { data: routingRules, isLoading: isRulesLoading, refetch: refetchRules } =
    api.metaAds.getRoutingRules.useQuery();

  const [logsFilter, setLogsFilter] = useState<"ALL" | "SUCCESS" | "DUPLICATE" | "FAILED">("ALL");
  const { data: logsData, isLoading: isLogsLoading, refetch: refetchLogs } =
    api.metaAds.getWebhookLogs.useQuery({
      status: logsFilter,
      page: 1,
      limit: 20,
    });

  // Credentials Form State
  const [appId, setAppId] = useState(statusData?.appId || "1572356260711362");
  const [appSecret, setAppSecret] = useState("");
  const [pageId, setPageId] = useState(statusData?.pageId || "61594488322411");
  const [pageName, setPageName] = useState(statusData?.pageName || "SoftLab Global");
  const [businessId, setBusinessId] = useState(statusData?.businessId || "2161320211099371");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState(statusData?.verifyToken || "softlab_meta_leadgen_2026");

  // Sync state when data loads
  React.useEffect(() => {
    if (statusData) {
      setAppId(statusData.appId);
      setPageId(statusData.pageId);
      setPageName(statusData.pageName);
      setBusinessId(statusData.businessId);
      setVerifyToken(statusData.verifyToken);
    }
  }, [statusData]);

  // Mutations
  const saveMutation = api.metaAds.saveCredentials.useMutation({
    onSuccess: () => {
      setFeedback({ type: "success", text: "Meta credentials saved securely." });
      setIsConnectModalOpen(false);
      refetchStatus();
    },
    onError: (err) => {
      setFeedback({ type: "error", text: err.message || "Failed to save credentials." });
    },
  });

  const verifyMutation = api.metaAds.verifyConnection.useMutation({
    onSuccess: (res) => {
      if (res.success) {
        setFeedback({ type: "success", text: `Connection verified! Page: "${res.pageName}" (ID: ${res.pageId}).` });
      } else {
        setFeedback({ type: "error", text: res.error || "Connection failed." });
      }
      refetchStatus();
    },
    onError: (err) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const retryMutation = api.metaAds.retryFailedWebhook.useMutation({
    onSuccess: (res) => {
      setFeedback({ type: "success", text: res.message });
      refetchLogs();
      refetchStatus();
    },
    onError: (err) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const testLeadMutation = api.metaAds.triggerTestLead.useMutation({
    onSuccess: (res) => {
      setFeedback({
        type: "success",
        text: `Test lead ingested! Pipeline: ${res.routing.pipeline} (${res.routing.assignedTeam}). Lead ID: ${res.leadId}`,
      });
      setIsTestModalOpen(false);
      refetchLogs();
      refetchStatus();
      utils.crm.listLeads.invalidate();
    },
    onError: (err) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const disconnectMutation = api.metaAds.disconnect.useMutation({
    onSuccess: () => {
      setFeedback({ type: "success", text: "Meta credentials safely cleared and disconnected." });
      refetchStatus();
    },
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isConnected = statusData?.connectionStatus === "CONNECTED";

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="text-xs font-semibold">{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Connection
            </span>
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
          </div>
          <p className="text-base font-extrabold text-slate-900 mt-2 flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-sky-600" />
            <span>{isConnected ? "Meta Live" : "Action Needed"}</span>
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {statusData?.pageName || "SoftLab Global"}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Leads
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {isStatusLoading ? "..." : statusData?.stats.totalReceived ?? 0}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Webhook Deliveries</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Ingested Leads
          </span>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {isStatusLoading ? "..." : statusData?.stats.totalSuccess ?? 0}
          </p>
          <span className="text-[10px] text-emerald-600/80 block mt-0.5">Active In Pipeline</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
            Duplicates Merged
          </span>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {isStatusLoading ? "..." : statusData?.stats.totalDuplicates ?? 0}
          </p>
          <span className="text-[10px] text-amber-600/80 block mt-0.5">Safely Deduplicated</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
            Failed / Pending
          </span>
          <p className="text-2xl font-black text-rose-700 mt-1">
            {isStatusLoading ? "..." : statusData?.stats.totalFailed ?? 0}
          </p>
          <span className="text-[10px] text-rose-600/80 block mt-0.5">Available for Retry</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "overview"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Overview & Webhook Setup
          </button>
          <button
            onClick={() => setActiveTab("routing")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "routing"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3 Campaign Routing Rules</span>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "logs"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Live Webhook Audit Log</span>
            {statusData && statusData.stats.totalFailed > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsTestModalOpen(true)}
            className="text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Simulate Test Lead</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsConnectModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold gap-1.5 shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Configure Credentials</span>
          </Button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & WEBHOOK SETUP */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Live Webhook Endpoint Card */}
            <Card className="border border-slate-200 shadow-xs">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Official Meta Webhook Handshake Details</span>
                  <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                    Graph API v21.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Callback URL (Enter in Meta App Dashboard ➔ Webhooks ➔ Page):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={statusData?.webhookUrl || "https://www.softlabglobal.com/api/webhooks/meta"}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 flex-1 select-all"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(
                          statusData?.webhookUrl || "https://www.softlabglobal.com/api/webhooks/meta",
                          "webhookUrl"
                        )
                      }
                      className="text-xs gap-1"
                    >
                      {copiedKey === "webhookUrl" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Verify Token (Configured in Meta App Webhook):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={statusData?.verifyToken || "softlab_meta_leadgen_2026"}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 flex-1 select-all"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(statusData?.verifyToken || "softlab_meta_leadgen_2026", "verifyToken")
                      }
                      className="text-xs gap-1"
                    >
                      {copiedKey === "verifyToken" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy</span>
                    </Button>
                  </div>
                </div>

                <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-lg text-xs text-sky-950 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>How to Subscribe in Meta Developer Portal:</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                    <li>Go to Meta for Developers ➔ App: <strong>SoftLab Global ({statusData?.appId})</strong></li>
                    <li>Select <strong>Webhooks</strong> in left sidebar ➔ Select <strong>Page</strong> from dropdown</li>
                    <li>Paste the Callback URL and Verify Token above ➔ Click <strong>Verify and Save</strong></li>
                    <li>Subscribe to the <strong>leadgen</strong> field</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Categories Card */}
            <Card className="border border-slate-200 shadow-xs">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Configured Campaign Categories & Pipelines
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-xs">
                <div className="p-3 border border-indigo-100 bg-indigo-50/50 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-indigo-950 block">1. SLG_META_COURSES_LEADS_OCT26</span>
                    <span className="text-[11px] text-slate-500">
                      CRM Pipeline: <strong>Course Admissions</strong> • Handled by: <strong>Admissions Team</strong>
                    </span>
                  </div>
                  <Badge className="bg-indigo-600 text-white">Active Rule</Badge>
                </div>

                <div className="p-3 border border-emerald-100 bg-emerald-50/50 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-950 block">2. SLG_META_BOSSE_DPGU_LEADS_OCT26</span>
                    <span className="text-[11px] text-slate-500">
                      CRM Pipelines: <strong>BOSSE Enquiries & University Admissions</strong> • Handled by: <strong>Education Counselling Team</strong>
                    </span>
                  </div>
                  <Badge className="bg-emerald-600 text-white">Active Rule</Badge>
                </div>

                <div className="p-3 border border-purple-100 bg-purple-50/50 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-purple-950 block">3. SLG_META_SERVICES_LEADS_OCT26</span>
                    <span className="text-[11px] text-slate-500">
                      CRM Pipeline: <strong>Business Services & Partnerships</strong> • Handled by: <strong>Business Development Team</strong>
                    </span>
                  </div>
                  <Badge className="bg-purple-600 text-white">Active Rule</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Connection Status Side Panel */}
          <div className="space-y-6">
            <Card className="border border-slate-200 shadow-xs">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Connection Health
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Business Portfolio</span>
                    <span className="font-bold text-slate-800">{statusData?.businessId || "2161320211099371"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Facebook Page</span>
                    <span className="font-bold text-slate-800">{statusData?.pageName || "SoftLab Global"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Page ID</span>
                    <span className="font-mono text-slate-800">{statusData?.pageId || "61594488322411"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Page Access Token</span>
                    <Badge variant={statusData?.hasAccessToken ? "default" : "destructive"} className="text-[10px]">
                      {statusData?.hasAccessToken ? "Configured & Active" : "Missing Token"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">App Secret (HMAC)</span>
                    <Badge variant={statusData?.hasAppSecret ? "default" : "outline"} className="text-[10px]">
                      {statusData?.hasAppSecret ? "Enforced" : "Optional in Staging"}
                    </Badge>
                  </div>
                  {statusData?.lastVerifiedAt && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400">Last Verified</span>
                      <span className="text-slate-600 font-mono">
                        {new Date(statusData.lastVerifiedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => verifyMutation.mutate()}
                    disabled={verifyMutation.isPending}
                    className="w-full text-xs font-bold gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${verifyMutation.isPending ? "animate-spin" : ""}`} />
                    <span>{verifyMutation.isPending ? "Pinging Graph API..." : "Verify Connection"}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Are you sure you want to disconnect Meta Lead Ads? Incoming leads will stop syncing.")) {
                        disconnectMutation.mutate();
                      }
                    }}
                    disabled={disconnectMutation.isPending}
                    className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    Disconnect Integration
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Testing Card */}
            <Card className="border border-slate-200 shadow-xs bg-gradient-to-br from-indigo-50/50 via-white to-slate-50">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span>Meta Official Testing Tool</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Use the Meta Lead Ads Testing Tool to generate verified test leads for your forms:
                </p>
                <a
                  href="https://developers.facebook.com/tools/lead-ads-testing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <span>Open Lead Ads Testing Tool</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: 3 CAMPAIGN ROUTING RULES */}
      {activeTab === "routing" && (
        <Card className="border border-slate-200 shadow-xs">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Configurable Routing Rules Engine
            </CardTitle>
            <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
              Evaluated in Order of Priority
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {isRulesLoading ? (
                <div className="p-8 text-center">
                  <LoadingSpinner size="md" text="Loading routing rules..." />
                </div>
              ) : routingRules?.length ? (
                routingRules.map((rule) => (
                  <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        {rule.priority}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{rule.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                            {rule.campaignPattern}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                          <span>Pipeline: <strong>{rule.targetPipeline}</strong></span>
                          <span>•</span>
                          <span>Assigned Team: <strong>{rule.assignedTeam}</strong></span>
                          <span>•</span>
                          <span>Default Role: <strong>{rule.defaultOwnerRole}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white text-[10px]">Active</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No custom routing rules defined. Using official default 3-tier campaign rules.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: LIVE WEBHOOK AUDIT LOG */}
      {activeTab === "logs" && (
        <Card className="border border-slate-200 shadow-xs">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Incoming Webhook Audit Trail & Reconciliation
              </CardTitle>
              <div className="flex items-center gap-1">
                {(["ALL", "SUCCESS", "DUPLICATE", "FAILED"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLogsFilter(filter)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      logsFilter === filter
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchLogs()}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLogsLoading ? (
              <div className="p-8 text-center">
                <LoadingSpinner size="md" text="Loading webhook logs..." />
              </div>
            ) : logsData?.logs?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Timestamp</th>
                      <th className="py-2.5 px-4 font-bold">Meta Lead ID</th>
                      <th className="py-2.5 px-4 font-bold">Campaign</th>
                      <th className="py-2.5 px-4 font-bold">Lead Contact</th>
                      <th className="py-2.5 px-4 font-bold">Target Pipeline</th>
                      <th className="py-2.5 px-4 font-bold">Status</th>
                      <th className="py-2.5 px-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logsData.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {new Date(log.receivedAt).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-900 text-xs">
                          {log.metaLeadId}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {log.campaignName || "Meta Ads"}
                        </td>
                        <td className="py-3 px-4">
                          {log.lead ? (
                            <div>
                              <span className="font-semibold text-slate-900 block">{log.lead.fullName}</span>
                              <span className="text-[11px] text-slate-500 font-mono">{log.lead.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Unlinked</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {log.pipeline || "COURSE_ADMISSIONS"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              log.status === "SUCCESS"
                                ? "default"
                                : log.status === "DUPLICATE"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-[10px]"
                          >
                            {log.status}
                          </Badge>
                          {log.errorMessage && (
                            <span className="block text-[10px] text-rose-600 mt-0.5 max-w-xs truncate" title={log.errorMessage}>
                              {log.errorMessage}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {log.status === "FAILED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryMutation.mutate({ logId: log.id })}
                              disabled={retryMutation.isPending}
                              className="text-[11px] h-7 gap-1"
                            >
                              <RotateCcw className="w-3 h-3 text-rose-600" />
                              <span>Retry</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No webhook logs found for this filter.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL: CREDENTIALS CONFIGURATION */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Share2 className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">Meta Lead Ads Credentials & Page Connection</h3>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <Label className="text-xs font-bold text-slate-700">Meta App ID</Label>
                <Input
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1572356260711362"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Meta App Secret (Used for HMAC SHA-256 Webhook Verification)</Label>
                <Input
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="Enter Meta App Secret (kept secret and encrypted)"
                  className="mt-1 text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Found in Meta App Dashboard ➔ App Settings ➔ Basic ➔ App Secret.
                </span>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Page ID (Facebook Page ID)</Label>
                <Input
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  placeholder="61594488322411"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Page Name</Label>
                <Input
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  placeholder="SoftLab Global"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Meta Business Portfolio ID</Label>
                <Input
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  placeholder="2161320211099371"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Page Access Token (System User Long-Lived Token)</Label>
                <Input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAAY... (Paste Long-lived token with leads_retrieval & pages_manage_ads)"
                  className="mt-1 text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Generated in Meta Business Suite ➔ System Users with &apos;leads_retrieval&apos; permission.
                </span>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Webhook Verify Token</Label>
                <Input
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  placeholder="softlab_meta_leadgen_2026"
                  className="mt-1 text-xs font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={() =>
                    saveMutation.mutate({
                      appId,
                      appSecret: appSecret || undefined,
                      pageId,
                      pageName,
                      businessId,
                      accessToken: accessToken || undefined,
                      verifyToken,
                    })
                  }
                  disabled={saveMutation.isPending}
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold gap-1.5"
                >
                  {saveMutation.isPending ? "Saving Credentials..." : "Save & Connect"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SIMULATE META TEST LEAD */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Simulate Meta Lead Ads Submission</h3>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Select one of the 3 campaign categories to verify automatic pipeline routing into CRM:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    testLeadMutation.mutate({
                      category: "COURSES",
                      fullName: "Rahul Verma (Meta Test)",
                      phone: "919988776655",
                      email: "rahul.verma@meta-test.com",
                      city: "Prayagraj",
                      courseOrService: "Full Stack Web Development & AI",
                    })
                  }
                  disabled={testLeadMutation.isPending}
                  className="p-3 text-left border rounded-lg hover:border-indigo-600 hover:bg-indigo-50/50 transition"
                >
                  <strong className="block text-indigo-950 font-bold">1. SLG_META_COURSES_LEADS_OCT26</strong>
                  <span className="text-[11px] text-slate-500">
                    Tests Course Admissions Pipeline ➔ Admissions Team
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    testLeadMutation.mutate({
                      category: "BOSSE_DPGU",
                      fullName: "Ananya Singh (Meta Test)",
                      phone: "919988776656",
                      email: "ananya.singh@meta-test.com",
                      city: "Varanasi",
                      courseOrService: "Dr. Preeti Global University - BCA Degree",
                    })
                  }
                  disabled={testLeadMutation.isPending}
                  className="p-3 text-left border rounded-lg hover:border-emerald-600 hover:bg-emerald-50/50 transition"
                >
                  <strong className="block text-emerald-950 font-bold">2. SLG_META_BOSSE_DPGU_LEADS_OCT26</strong>
                  <span className="text-[11px] text-slate-500">
                    Tests University & BOSSE Pipeline ➔ Education Counselling Team
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    testLeadMutation.mutate({
                      category: "SERVICES",
                      fullName: "TechCorp HR (Meta Test)",
                      phone: "919988776657",
                      email: "hr@techcorp-meta.com",
                      city: "Lucknow",
                      courseOrService: "Campus Placement Drive & Corporate Training",
                    })
                  }
                  disabled={testLeadMutation.isPending}
                  className="p-3 text-left border rounded-lg hover:border-purple-600 hover:bg-purple-50/50 transition"
                >
                  <strong className="block text-purple-950 font-bold">3. SLG_META_SERVICES_LEADS_OCT26</strong>
                  <span className="text-[11px] text-slate-500">
                    Tests Business Services Pipeline ➔ Business Development Team
                  </span>
                </button>
              </div>

              {testLeadMutation.isPending && (
                <div className="p-3 text-center">
                  <LoadingSpinner size="sm" text="Simulating Meta lead ingestion & CRM broadcast..." />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
