"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const integrations = [
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
