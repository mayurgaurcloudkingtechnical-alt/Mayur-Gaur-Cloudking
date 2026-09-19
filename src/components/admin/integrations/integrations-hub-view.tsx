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
} from "lucide-react";

export function IntegrationsHubView() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: settingsData } = api.admin.getSystemSettings.useQuery();
  const gatewayStatus = api.payment.getGatewayStatus.useQuery();
  const razorpayConfig = settingsData?.razorpay;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const GOOGLE_ADS_WEBHOOK_URL = "https://www.softlabglobal.com/api/webhooks/google-ads";
  const GOOGLE_ADS_WEBHOOK_KEY = "slg_gads_sec_8923f7c1b4d09e";

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
      name: "Meta / Facebook Ads Leads Webhook",
      category: "Marketing & CRM",
      description: "Real-time ingestion of prospective learner leads from Facebook and Instagram lead gen forms.",
      icon: <Share2 className="h-6 w-6 text-sky-600" />,
      status: "ACTIVE",
      meta: "Webhook Endpoint: /api/webhooks/meta-leads",
      webhookUrl: "https://www.softlabglobal.com/api/webhooks/meta-leads",
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
      name: "WhatsApp & SMS Gateway",
      category: "Communications",
      description: "Automated admission confirmations, attendance alerts, and payment receipt notifications.",
      icon: <MessageSquare className="h-6 w-6 text-emerald-600" />,
      status: "CONFIGURED",
      meta: "Provider: Interakt / Gupshup Enterprise",
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
        <Link href="/admin/settings">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs">
            <Settings className="h-4 w-4" />
            Security & Authority Settings
          </Button>
        </Link>
      </div>

      {/* Google Ads Lead Ingestion Quick Setup Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-xl p-5 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">
              <Globe className="h-3.5 w-3.5" />
              <span>Google Ads Lead Form Integration Live</span>
            </div>
            <h4 className="text-base font-bold text-white">Direct Webhook Connection for Google Search & YouTube Ads</h4>
            <p className="text-xs text-slate-300 max-w-2xl">
              Paste this Webhook URL and Key into your Google Ads Lead Form extension delivery options. All captured leads are instantly delivered and broadcast to Counselor, Director, Admin, and Super Admin dashboards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-black/40 border border-slate-700/60 rounded-lg p-2.5 flex items-center gap-2">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Webhook URL</span>
                <span className="text-xs font-mono text-emerald-300 select-all">{GOOGLE_ADS_WEBHOOK_URL}</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(GOOGLE_ADS_WEBHOOK_URL, "banner-url")}
                className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 gap-1 border border-slate-600"
              >
                <Copy className="h-3 w-3" />
                {copiedKey === "banner-url" ? "Copied!" : "Copy URL"}
              </Button>
            </div>

            <div className="bg-black/40 border border-slate-700/60 rounded-lg p-2.5 flex items-center gap-2">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Google Key</span>
                <span className="text-xs font-mono text-amber-300 select-all">{GOOGLE_ADS_WEBHOOK_KEY}</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(GOOGLE_ADS_WEBHOOK_KEY, "banner-key")}
                className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 gap-1 border border-slate-600"
              >
                <Copy className="h-3 w-3" />
                {copiedKey === "banner-key" ? "Copied!" : "Copy Key"}
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
                    <span className="text-[11px] text-slate-400">Webhook Key:</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(item.webhookKey!, `${item.id}-key`)}
                      className="h-7 text-xs text-slate-600 gap-1 font-mono text-amber-700"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedKey === `${item.id}-key` ? "Copied!" : "Copy Key"}
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
