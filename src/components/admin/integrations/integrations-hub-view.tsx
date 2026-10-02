"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Share2,
  CreditCard,
  Mail,
  MessageSquare,
  Globe,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Settings,
  ShieldCheck,
  Sparkles,
  Key,
  Webhook,
  RefreshCw,
  Bot,
  PhoneCall,
  Layers,
  Radio,
  Check,
  AlertTriangle,
} from "lucide-react";
import { WhatsAppConnectionWizard } from "./whatsapp-connection-wizard";

export function IntegrationsHubView() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: settingsData } = api.admin.getSystemSettings.useQuery();
  const gatewayStatus = api.payment.getGatewayStatus.useQuery();
  const razorpayConfig = settingsData?.razorpay;

  const integrationsHealth = api.omnichannel.getIntegrationsHealth.useQuery();
  const catalogStatus = api.omnichannel.getCatalogSyncStatus.useQuery();
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const utils = api.useUtils();
  const syncCatalogMutation = api.omnichannel.syncCatalog.useMutation({
    onSuccess: (data) => {
      setSyncFeedback(data.message);
      utils.omnichannel.getCatalogSyncStatus.invalidate();
      utils.omnichannel.getIntegrationsHealth.invalidate();
      setTimeout(() => setSyncFeedback(null), 8000);
    },
    onError: (err) => {
      setSyncFeedback(`Sync failed: ${err.message}`);
      setTimeout(() => setSyncFeedback(null), 8000);
    },
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const GOOGLE_ADS_WEBHOOK_URL = "https://www.softlabglobal.com/api/webhooks/google-ads";
  const GOOGLE_ADS_WEBHOOK_KEY = "slg_gads_sec_8923f7c1b4d09e";

  const META_ADS_WEBHOOK_URL = "https://www.softlabglobal.com/api/webhooks/meta";
  const META_ADS_VERIFY_TOKEN = "softlab_meta_leadgen_2026";

  const integrations = [
    {
      id: "google-ads",
      name: "Google Ads Lead Form Webhook",
      category: "Marketing & CRM",
      description: "Real-time automated ingestion of prospective student leads from Google Search and YouTube Lead Form extensions. Multi-role alerts broadcast to Counselor, Director, Admin & Super Admin.",
      icon: <Globe className="h-6 w-6 text-rose-600" />,
      status: "ACTIVE",
      meta: "Auto-Broadcast: Counselor, Director, Admin, Super Admin",
      webhookUrl: GOOGLE_ADS_WEBHOOK_URL,
      webhookKey: GOOGLE_ADS_WEBHOOK_KEY,
      guideText: "In Google Ads → Assets → Lead Form → Lead Delivery Options → Enter Webhook URL & Key → Click 'Send test data'",
    },
    {
      id: "meta-leads",
      name: "Meta Lead Ads (Facebook & Instagram)",
      category: "Marketing & CRM",
      description: "Real-time automated ingestion of prospective learner leads from Facebook and Instagram Lead Ads and Boost Campaigns. Multi-role alerts broadcast to Counselor, Director, Admin & Super Admin.",
      icon: <Share2 className="h-6 w-6 text-sky-600" />,
      status: "ACTIVE",
      meta: "Auto-Broadcast: Counselor, Director, Admin, Super Admin",
      webhookUrl: META_ADS_WEBHOOK_URL,
      webhookKey: META_ADS_VERIFY_TOKEN,
      guideText: "In Meta for Developers / Business Suite → Webhooks → Select 'Page' → Subscribe to 'leadgen' → Enter Callback URL & Verify Token",
    },
    {
      id: "stripe",
      name: "Stripe Payment Gateway",
      category: "Payment Processing",
      description: "Global credit/debit card processing with verified webhooks and automated receipt settlement.",
      icon: <CreditCard className="h-6 w-6 text-indigo-600" />,
      status: gatewayStatus.data?.stripe.configured ? "CONFIGURED" : "CONFIG_PENDING",
      meta: gatewayStatus.data?.stripe.configured ? "Stripe Live Connected" : "Publishable & Secret Keys required",
      webhookUrl: "https://www.softlabglobal.com/api/webhooks/stripe",
      actionHref: "/admin/settings",
      actionText: "Configure Stripe",
    },
    {
      id: "razorpay",
      name: "Razorpay Payment Gateway",
      category: "Payment Processing",
      description: "Production payment processing for online student course enrollments and installments.",
      icon: <CreditCard className="h-6 w-6 text-emerald-600" />,
      status: razorpayConfig?.keyId || gatewayStatus.data?.razorpay.configured ? "CONFIGURED" : "CONFIG_PENDING",
      meta: razorpayConfig?.keyId ? `Key ID: ${razorpayConfig.keyId.slice(0, 14)}...` : "Keys not set",
      actionHref: "/admin/settings",
      actionText: "Configure Credentials",
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business Cloud Platform & AI Hub",
      category: "Communications",
      description: "Official Meta WhatsApp Business Cloud API. Automates student counseling, AI voice calling, course catalogue sharing, and direct admission routing.",
      icon: <MessageSquare className="h-6 w-6 text-emerald-600" />,
      status: integrationsHealth.data?.whatsapp.status === "CONNECTED" ? "CONNECTED" : "CONFIGURED",
      meta: `WABA ID: 1071124442294607 | Phone: ${integrationsHealth.data?.whatsapp.displayPhoneNumber || "+91 9196596975"}`,
      webhookUrl: "https://www.softlabglobal.com/api/webhooks/whatsapp",
      webhookKey: "softlab_whatsapp_2026",
      actionHref: "/admin/inbox",
      actionText: "Open Omnichannel Live Inbox",
    },
    {
      id: "email",
      name: "Transactional Email Service",
      category: "Infrastructure",
      description: "Automated email delivery for student credentials, passwords, and PDF tax invoices.",
      icon: <Mail className="h-6 w-6 text-indigo-600" />,
      status: "ACTIVE",
      meta: "SMTP: mail.softlabglobal.com",
    },
    {
      id: "database",
      name: "Neon PostgreSQL Cloud Database",
      category: "Core Database",
      description: "Serverless PostgreSQL database hosting all relational tables, audit logs, and student records.",
      icon: <Database className="h-6 w-6 text-cyan-600" />,
      status: "ONLINE",
      meta: "Status: Connected & Synchronized (Prisma v5.22.0)",
    },
    {
      id: "cdn",
      name: "Cloudflare Global CDN & Edge Security",
      category: "Security & DNS",
      description: "SSL termination, edge caching, DDoS protection for softlabglobal.com and lms subdomains.",
      icon: <Globe className="h-6 w-6 text-amber-600" />,
      status: "ONLINE",
      meta: "Nameservers: SoftLab Cloud DNS",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Platform Integrations & APIs</h3>
          <p className="text-xs text-slate-500 mt-1">
            Manage payment gateways, lead ingestion webhooks, transactional messaging, and infrastructure connectors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/ai-command">
            <Button variant="outline" className="text-xs gap-1.5 border-slate-300">
              <Bot className="h-3.5 w-3.5 text-blue-600" />
              AI Command Center
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs">
              <Settings className="h-4 w-4" />
              Security Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="font-medium">{syncFeedback}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSyncFeedback(null)}
            className="h-6 px-2 text-xs text-blue-700 hover:bg-blue-100"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Official WhatsApp Business & AI Counselor Connection Wizard */}
      <WhatsAppConnectionWizard />

      {/* Production Omnichannel & Meta WhatsApp Health Sentinel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Radio className="h-4 w-4 animate-pulse" />
              </span>
              <h4 className="text-base font-bold text-white tracking-tight">
                AI Omnichannel Admissions & Meta WhatsApp Production Sentinel
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Central Lead engine, Meta WhatsApp Cloud API, AI Voice calling, and LMS Course Master live telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => syncCatalogMutation.mutate()}
              disabled={syncCatalogMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-medium shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncCatalogMutation.isPending ? "animate-spin" : ""}`} />
              {syncCatalogMutation.isPending ? "Syncing Catalogue..." : "Sync WhatsApp Catalogue"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: WhatsApp Business Cloud API */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                  Meta WhatsApp API
                </span>
                <Badge
                  className={
                    integrationsHealth.data?.whatsapp.status === "CONNECTED"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]"
                  }
                >
                  {integrationsHealth.data?.whatsapp.status || "CODE_READY"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Webhook: <span className="font-mono text-emerald-300">/api/webhooks/whatsapp</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Verify Token: <span className="font-mono text-slate-300">{integrationsHealth.data?.whatsapp.verifyToken || "soft••••••"}</span>
              </p>
            </div>

            <div className="border-t border-slate-700 pt-2 text-[10px] text-slate-400 space-y-0.5">
              <div className="flex justify-between">
                <span>Last Inbound:</span>
                <span className="text-slate-200">
                  {integrationsHealth.data?.whatsapp.lastInboundMessageAt
                    ? new Date(integrationsHealth.data.whatsapp.lastInboundMessageAt).toLocaleTimeString("en-IN")
                    : "No inbound yet"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Outbound:</span>
                <span className="text-slate-200">
                  {integrationsHealth.data?.whatsapp.lastOutboundMessageAt
                    ? new Date(integrationsHealth.data.whatsapp.lastOutboundMessageAt).toLocaleTimeString("en-IN")
                    : "Ready to dispatch"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: WhatsApp Catalogue Sync */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-purple-400" />
                  WhatsApp Catalogue
                </span>
                <Badge
                  className={
                    catalogStatus.data?.status === "CONNECTED"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px]"
                      : "bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px]"
                  }
                >
                  {catalogStatus.data?.status || "CODE_READY"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                LMS Course Master: <span className="font-semibold text-white">{catalogStatus.data?.totalCourses ?? 46} Courses</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Catalogue Mapped: <span className="font-semibold text-emerald-400">{catalogStatus.data?.syncedCourses ?? 0}</span>
              </p>
            </div>

            <div className="border-t border-slate-700 pt-2 text-[10px] text-slate-400 flex justify-between">
              <span>Last Sync:</span>
              <span className="text-slate-200">
                {catalogStatus.data?.lastSyncAt
                  ? new Date(catalogStatus.data.lastSyncAt).toLocaleTimeString("en-IN")
                  : "Sync pending"}
              </span>
            </div>
          </div>

          {/* Card 3: AI Admissions Counselor */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Bot className="h-4 w-4 text-sky-400" />
                  AI Counselor
                </span>
                <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[10px]">
                  ACTIVE & GROUNDED
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Knowledge Base: <span className="text-white font-medium">14 Grounded Domains</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Languages: <span className="text-emerald-400 font-medium">English, Hindi, Hinglish</span>
              </p>
            </div>

            <div className="border-t border-slate-700 pt-2 text-[10px] text-slate-400 flex justify-between">
              <span>Auto-Escalation:</span>
              <span className="text-emerald-300 font-medium">Discounts & Grievances</span>
            </div>
          </div>

          {/* Card 4: AI Voice Calling Agent */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <PhoneCall className="h-4 w-4 text-amber-400" />
                  AI Voice Agent
                </span>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                  READY
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Model: <span className="text-white font-medium">SoftLab Neural Agent</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Context Handover: <span className="text-emerald-400 font-medium">WhatsApp History Synced</span>
              </p>
            </div>

            <div className="border-t border-slate-700 pt-2 text-[10px] text-slate-400 flex justify-between">
              <span>Campus Lab:</span>
              <span className="text-slate-200">Civil Lines, Prayagraj</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Lead Ads Webhook Credentials Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Google Ads Webhook Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-xl p-5 text-white shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">
              <Globe className="h-3.5 w-3.5" />
              <span>Google Ads Lead Ingestion Live</span>
            </div>
            <h4 className="text-sm font-bold text-white">Google Search & YouTube Lead Forms</h4>
            <p className="text-xs text-slate-300">
              Enter these credentials under Google Ads Lead Form extension delivery options.
            </p>
          </div>

          <div className="space-y-2">
            <div className="bg-black/40 border border-slate-700/60 rounded-lg p-2.5 flex items-center justify-between gap-2">
              <div className="text-left overflow-hidden">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Webhook URL</span>
                <span className="text-xs font-mono text-emerald-300 truncate block select-all">{GOOGLE_ADS_WEBHOOK_URL}</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(GOOGLE_ADS_WEBHOOK_URL, "gads-banner-url")}
                className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 gap-1 border border-slate-600 flex-shrink-0"
              >
                <Copy className="h-3 w-3" />
                {copiedKey === "gads-banner-url" ? "Copied!" : "Copy"}
              </Button>
            </div>

            <div className="bg-black/40 border border-slate-700/60 rounded-lg p-2.5 flex items-center justify-between gap-2">
              <div className="text-left overflow-hidden">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Google Key</span>
                <span className="text-xs font-mono text-amber-300 truncate block select-all">{GOOGLE_ADS_WEBHOOK_KEY}</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(GOOGLE_ADS_WEBHOOK_KEY, "gads-banner-key")}
                className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 gap-1 border border-slate-600 flex-shrink-0"
              >
                <Copy className="h-3 w-3" />
                {copiedKey === "gads-banner-key" ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>

        {/* Meta Business Lead Ads Webhook Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 border border-sky-800/40 rounded-xl p-5 text-white shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-500/30">
              <Share2 className="h-3.5 w-3.5" />
              <span>Meta Lead Ads Live (FB & Instagram)</span>
            </div>
            <h4 className="text-sm font-bold text-white">Facebook & Instagram Lead Generation</h4>
            <p className="text-xs text-slate-300">
              Enter these credentials in Meta for Developers or Meta Business Suite Webhooks.
            </p>
          </div>

          <div className="space-y-2">
            <div className="bg-black/40 border border-slate-700/60 rounded-lg p-2.5 flex items-center justify-between gap-2">
              <div className="text-left overflow-hidden">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Callback URL</span>
                <span className="text-xs font-mono text-cyan-300 truncate block select-all">{META_ADS_WEBHOOK_URL}</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(META_ADS_WEBHOOK_URL, "meta-banner-url")}
                className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 gap-1 border border-slate-600 flex-shrink-0"
              >
                <Copy className="h-3 w-3" />
                {copiedKey === "meta-banner-url" ? "Copied!" : "Copy"}
              </Button>
            </div>

            <div className="bg-black/40 border border-slate-700/60 rounded-lg p-2.5 flex items-center justify-between gap-2">
              <div className="text-left overflow-hidden">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Verify Token</span>
                <span className="text-xs font-mono text-emerald-300 truncate block select-all">{META_ADS_VERIFY_TOKEN}</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(META_ADS_VERIFY_TOKEN, "meta-banner-token")}
                className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 gap-1 border border-slate-600 flex-shrink-0"
              >
                <Copy className="h-3 w-3" />
                {copiedKey === "meta-banner-token" ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((item) => (
          <Card key={item.id} className="border-slate-200 shadow-sm bg-white flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                  <span className="text-[11px] text-slate-400 font-medium">{item.category}</span>
                </div>
              </div>
              <Badge
                className={`text-[10px] font-semibold ${
                  item.status === "ACTIVE" || item.status === "ONLINE" || item.status === "CONFIGURED"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {item.status}
              </Badge>
            </CardHeader>

            <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded border border-slate-100 break-all">
                  {item.meta}
                </div>

                {item.webhookUrl && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Webhook URL:</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(item.webhookUrl!, item.id)}
                      className="h-7 text-xs text-slate-600 gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedKey === item.id ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                )}

                {item.webhookKey && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      {item.id === "meta-leads" ? "Verify Token:" : "Secret Key:"}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(item.webhookKey!, `${item.id}-key`)}
                      className="h-7 text-xs text-slate-600 gap-1 font-mono text-amber-700"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedKey === `${item.id}-key` ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                )}

                {item.guideText && (
                  <div className="p-2 bg-amber-50/80 border border-amber-200/70 rounded text-[10.5px] text-amber-900 leading-snug">
                    <span className="font-semibold">Setup: </span>{item.guideText}
                  </div>
                )}

                {item.actionHref && (
                  <Link href={item.actionHref} className="block mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      {item.actionText}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
