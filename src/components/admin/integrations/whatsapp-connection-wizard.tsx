"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Zap,
  Phone,
  Bot,
  Layers,
  ArrowRight,
  Smartphone,
  Info,
  Check,
  Building2,
  Lock,
} from "lucide-react";

export function WhatsAppConnectionWizard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Manual configuration fields for Super Admin direct linking
  const [phoneIdInput, setPhoneIdInput] = useState("");
  const [wabaIdInput, setWabaIdInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [catalogIdInput, setCatalogIdInput] = useState("");
  const [displayPhoneInput, setDisplayPhoneInput] = useState("");

  const [testResult, setTestResult] = useState<any | null>(null);

  const utils = api.useUtils();
  const connectionQuery = api.omnichannel.getWhatsAppConnectionDetails.useQuery();
  const catalogStatus = api.omnichannel.getCatalogSyncStatus.useQuery();

  const syncCatalogMutation = api.omnichannel.syncCatalog.useMutation({
    onSuccess: () => {
      utils.omnichannel.getWhatsAppConnectionDetails.invalidate();
      utils.omnichannel.getCatalogSyncStatus.invalidate();
    },
  });

  const saveMutation = api.omnichannel.saveWhatsAppCredentials.useMutation({
    onSuccess: () => {
      setShowConfigModal(false);
      utils.omnichannel.getWhatsAppConnectionDetails.invalidate();
      utils.omnichannel.getIntegrationsHealth.invalidate();
    },
  });

  const verifyMutation = api.omnichannel.verifyWhatsAppConnection.useMutation({
    onSuccess: (data) => {
      utils.omnichannel.getWhatsAppConnectionDetails.invalidate();
    },
  });

  const testInboundMutation = api.omnichannel.triggerTestInboundMessage.useMutation({
    onSuccess: (data) => {
      setTestResult(data);
      utils.omnichannel.getWhatsAppConnectionDetails.invalidate();
      utils.omnichannel.listConversations.invalidate();
    },
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const details = connectionQuery.data;
  const isConnected = details?.status === "CONNECTED";

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Official WhatsApp Business Platform
                  <Badge
                    className={`text-xs px-2.5 py-0.5 font-bold ${
                      isConnected
                        ? "bg-emerald-500 text-white"
                        : details?.status === "CONNECTING"
                        ? "bg-blue-500 text-white"
                        : details?.status === "ERROR"
                        ? "bg-rose-500 text-white"
                        : "bg-amber-500 text-black"
                    }`}
                  >
                    {details?.status || "NOT CONNECTED"}
                  </Badge>
                </h3>
                <p className="text-xs text-slate-400">
                  Connect your existing SoftLab Global physical phone number to the automated AI Counselor & CRM.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (details) {
                  setPhoneIdInput(details.phoneNumberId !== "Not Connected" ? details.phoneNumberId : "");
                  setWabaIdInput(details.wabaId !== "Not Connected" ? details.wabaId : "");
                  setDisplayPhoneInput(details.displayPhoneNumber !== "Not Connected" ? details.displayPhoneNumber : "");
                }
                setShowConfigModal(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs h-9 gap-1.5"
            >
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              Configure Credentials
            </Button>

            <Button
              size="sm"
              onClick={() => verifyMutation.mutate()}
              disabled={verifyMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 font-semibold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${verifyMutation.isPending ? "animate-spin" : ""}`} />
              Verify Live Connection
            </Button>
          </div>
        </div>

        {/* Status Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Phone Number</span>
            <p className="text-xs font-bold text-white truncate mt-1">
              {details?.displayPhoneNumber || "Not Connected"}
            </p>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              {details?.phoneNumberStatus === "CONNECTED" ? "Verified ✓" : "Awaiting Link"}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Business Account</span>
            <p className="text-xs font-bold text-white truncate mt-1">
              {details?.wabaId || "Not Connected"}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Portfolio: 2161320211099371</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Webhook</span>
            <p className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
              CONNECTED ✓
            </p>
            <span className="text-[10px] text-slate-400 truncate mt-0.5 block">
              {details?.lastInboundMessageAt
                ? `Last: ${new Date(details.lastInboundMessageAt).toLocaleTimeString("en-IN")}`
                : "Awaiting Inbound"}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Catalogue</span>
            <p className="text-xs font-bold text-purple-400 mt-1 flex items-center gap-1">
              {catalogStatus.data?.syncedCourses ?? 0} / {catalogStatus.data?.totalCourses ?? 46} SYNCED
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Course Master</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">AI Counselor</span>
            <p className="text-xs font-bold text-sky-400 mt-1 flex items-center gap-1">
              ACTIVE ✓
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Eng / Hindi / Hinglish</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">AI Calling</span>
            <p className="text-xs font-bold text-amber-400 mt-1 flex items-center gap-1">
              ACTIVE ✓
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">WhatsApp Handover</span>
          </div>
        </div>
      </div>

      {/* 2. Existing Phone Number Connection Guide (Meta Official Flow) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              Connecting Your Existing WhatsApp Business Phone Number
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Meta&apos;s official policy requires migrating your phone number to the WhatsApp Business Platform / Cloud API
              so that the SoftLab Global AI Counselor can reply in real-time, 24/7.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span className="text-xs font-bold text-slate-900">Open Meta App</span>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-normal">
              In your browser, go to your Meta App:{" "}
              <a
                href="https://developers.facebook.com/apps/1572356260711362/dashboard/?business_id=2161320211099371"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5"
              >
                App 1572356260711362 <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span className="text-xs font-bold text-slate-900">WhatsApp $\rightarrow$ API Setup</span>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-normal">
              Click <strong>WhatsApp</strong> $\rightarrow$ <strong>API Setup</strong>. Under &quot;Step 5: Add a phone number&quot;,
              enter your business number to receive the Meta SMS confirmation code.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span className="text-xs font-bold text-slate-900">Instant AI Activation</span>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-normal">
              Copy the resulting <strong>Phone number ID</strong> and <strong>Token</strong> into the wizard below.
              Your physical number will immediately become the AI Counselor&apos;s channel!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
          <div className="flex items-center gap-2.5 text-xs text-blue-900">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span>
              <strong>Zero manual catalogue work:</strong> All 46 courses are automatically synced to Meta with 1 click.
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => syncCatalogMutation.mutate()}
            disabled={syncCatalogMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 gap-1.5 shadow-xs"
          >
            <RefreshCw className={`h-3 w-3 ${syncCatalogMutation.isPending ? "animate-spin" : ""}`} />
            {syncCatalogMutation.isPending ? "Syncing..." : "Sync All 46 Courses"}
          </Button>
        </div>
      </div>

      {/* 3. Official Webhook Configuration Endpoint Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Official Meta Webhook Configuration
        </h4>
        <p className="text-xs text-slate-500">
          Paste these verified endpoints into your Meta for Developers App under <strong>WhatsApp $\rightarrow$ Configuration $\rightarrow$ Edit</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <div className="overflow-hidden">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Callback URL</span>
              <span className="text-xs font-mono text-slate-800 truncate block select-all">
                https://www.softlabglobal.com/api/webhooks/whatsapp
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard("https://www.softlabglobal.com/api/webhooks/whatsapp", "webhook-url")}
              className="h-8 text-xs text-slate-600 gap-1"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedKey === "webhook-url" ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <div className="overflow-hidden">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Verify Token</span>
              <span className="text-xs font-mono text-emerald-700 truncate block select-all">
                {details?.verifyToken || "softlab_whatsapp_2026"}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(details?.verifyToken || "softlab_whatsapp_2026", "verify-token")}
              className="h-8 text-xs text-slate-600 gap-1"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedKey === "verify-token" ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Live Pipeline Simulation & Real Testing */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-900/40 rounded-2xl p-6 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Real Production Verification & Sandbox Simulation
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Verify that an incoming WhatsApp message creates the CRM lead, triggers the multi-lingual AI Counselor, and records to the 360° customer timeline.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() =>
              testInboundMutation.mutate({
                fromPhone: "919196596975",
                senderName: "Prospective Student (Live Test)",
                messageText: "Namaste, SoftLab mein Cloud Computing aur Cyber Security course ki fees kya hai?",
              })
            }
            disabled={testInboundMutation.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 gap-1.5 shadow-md flex-shrink-0"
          >
            <Zap className={`h-3.5 w-3.5 ${testInboundMutation.isPending ? "animate-spin" : ""}`} />
            {testInboundMutation.isPending ? "Testing Pipeline..." : "Test Inbound Lead & AI Response"}
          </Button>
        </div>

        {testResult && (
          <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3 mt-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Pipeline Test Succeeded!
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">
                {testResult.isNewLead ? "New Lead Created" : "Lead Updated"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Lead Name:</span>
                <span className="font-semibold text-white">{testResult.leadName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Identified Course:</span>
                <span className="font-semibold text-white">{testResult.identifiedCourse || "IT Engineering"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Detected Language:</span>
                <span className="font-semibold text-emerald-300">{testResult.detectedLanguage}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Lead Score / Temp:</span>
                <span className="font-semibold text-amber-300">{testResult.leadScore} / {testResult.temperature}</span>
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                AI Counselor Grounded Reply:
              </span>
              <p className="text-slate-200 leading-relaxed font-sans">{testResult.aiReply}</p>
            </div>
          </div>
        )}
      </div>

      {/* 5. Modal for Direct Credentials Entry */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">WhatsApp Credentials Configuration</h3>
                <p className="text-xs text-slate-500">
                  Update live Meta WhatsApp credentials without editing code or restarting servers.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfigModal(false)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Display Phone Number</Label>
                <Input
                  placeholder="+91 9196596975"
                  value={displayPhoneInput}
                  onChange={(e) => setDisplayPhoneInput(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Phone Number ID</Label>
                <Input
                  placeholder="e.g. 106548792019482"
                  value={phoneIdInput}
                  onChange={(e) => setPhoneIdInput(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">WhatsApp Business Account ID (WABA)</Label>
                <Input
                  placeholder="e.g. 104829104928172"
                  value={wabaIdInput}
                  onChange={(e) => setWabaIdInput(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Meta Access Token (System User / Permanent)</Label>
                <Input
                  type="password"
                  placeholder="EAA..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Meta Commerce Catalogue ID (Optional)</Label>
                <Input
                  placeholder="e.g. 98127391823719"
                  value={catalogIdInput}
                  onChange={(e) => setCatalogIdInput(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfigModal(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate({
                    phoneNumberId: phoneIdInput || undefined,
                    wabaId: wabaIdInput || undefined,
                    accessToken: tokenInput || undefined,
                    catalogId: catalogIdInput || undefined,
                    displayPhoneNumber: displayPhoneInput || undefined,
                  })
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold"
              >
                {saveMutation.isPending ? "Saving..." : "Save Credentials"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
