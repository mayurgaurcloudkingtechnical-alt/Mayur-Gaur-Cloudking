"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import { ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, X, KeyRound } from "lucide-react";

interface WhatsAppProviderModalProps {
  open: boolean;
  onClose: () => void;
}

export function WhatsAppProviderModal({ open, onClose }: WhatsAppProviderModalProps) {
  const { data: details, isLoading, refetch } = api.omnichannel.getWhatsAppConnectionDetails.useQuery(
    undefined,
    { enabled: open }
  );

  const [form, setForm] = useState({
    appId: "",
    businessId: "",
    wabaId: "",
    phoneNumberId: "",
    catalogId: "",
    displayPhoneNumber: "",
    accessToken: "",
  });
  const [testPhone, setTestPhone] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const saveMutation = api.omnichannel.saveWhatsAppCredentials.useMutation({
    onSuccess: () => {
      setFeedback({ type: "ok", msg: "Credentials saved securely on server. Click 'Test Live Connection' to verify with Meta." });
      setForm((prev) => ({ ...prev, accessToken: "" }));
      refetch();
    },
    onError: (err) => {
      setFeedback({ type: "err", msg: err.message });
    },
  });

  const verifyMutation = api.omnichannel.verifyWhatsAppConnection.useMutation({
    onSuccess: (res: any) => {
      if (res?.connected || res?.success) {
        setFeedback({ type: "ok", msg: `Verified live connection: ${res.verifiedName || res.displayPhoneNumber || "Connected"}` });
      } else {
        setFeedback({ type: "err", msg: res?.error || "Provider verification failed. Check credentials." });
      }
      refetch();
    },
    onError: (err) => {
      setFeedback({ type: "err", msg: err.message });
    },
  });

  const subscribeMutation = api.omnichannel.subscribeWhatsAppWebhook.useMutation({
    onSuccess: (res: any) => {
      if (res?.success) {
        setFeedback({ type: "ok", msg: "Subscribed Meta App to WABA webhook events successfully." });
      } else {
        setFeedback({ type: "err", msg: res?.error || "Webhook subscription failed." });
      }
      refetch();
    },
    onError: (err) => setFeedback({ type: "err", msg: err.message }),
  });

  const disconnectMutation = api.omnichannel.disconnectWhatsApp.useMutation({
    onSuccess: () => {
      setFeedback({ type: "ok", msg: "WhatsApp Cloud API disconnected." });
      refetch();
    },
    onError: (err) => setFeedback({ type: "err", msg: err.message }),
  });

  const sendTestMutation = api.notifications.sendTestNotification.useMutation({
    onSuccess: (res: any) => {
      if (res?.success) {
        setFeedback({ type: "ok", msg: `Test message accepted by provider (Message ID: ${res.messageId || "sent"}).` });
      } else {
        setFeedback({ type: "err", msg: res?.error || `Test message status: ${res?.status || "FAILED"}` });
      }
    },
    onError: (err) => setFeedback({ type: "err", msg: err.message }),
  });

  if (!open) return null;

  const isConnected = details?.status === "CONNECTED";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-start justify-between border-b pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Official WhatsApp Cloud API Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Credentials are stored server-side. Access tokens are never returned to the browser.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live Provider Status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
          <div>
            <div className="text-slate-400 font-medium">Provider Status</div>
            <div className={`font-bold mt-0.5 flex items-center gap-1 ${isConnected ? "text-emerald-700" : "text-amber-700"}`}>
              {isConnected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              {isLoading ? "Checking..." : details?.status || "NOT_CONNECTED"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Phone Number ID</div>
            <div className="font-mono text-slate-800 mt-0.5 truncate">{details?.phoneNumberId || "Not Configured"}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">WABA ID</div>
            <div className="font-mono text-slate-800 mt-0.5 truncate">{details?.wabaId || "Not Configured"}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Webhook</div>
            <div className="font-mono text-slate-800 mt-0.5 truncate">{details?.webhookStatus || "UNKNOWN"}</div>
          </div>
        </div>

        {details?.webhookUrl && (
          <div className="text-xs bg-sky-50 border border-sky-200 rounded-lg p-3 space-y-1">
            <div className="font-semibold text-sky-900">Webhook Callback & Verify Token</div>
            <div className="font-mono text-sky-800 break-all">URL: {details.webhookUrl}</div>
            <div className="font-mono text-sky-800">Verify Token: {details.verifyToken || "softlab_whatsapp_2026"}</div>
          </div>
        )}

        {feedback && (
          <div
            className={`text-xs px-3 py-2.5 rounded-lg border ${
              feedback.type === "ok"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Meta App ID</label>
            <input
              type="text"
              placeholder={details?.appId || "1572356260711362"}
              value={form.appId}
              onChange={(e) => setForm({ ...form, appId: e.target.value })}
              className="w-full border border-slate-300 rounded px-2.5 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Meta Business Portfolio ID</label>
            <input
              type="text"
              placeholder={details?.businessId || "2161320211099371"}
              value={form.businessId}
              onChange={(e) => setForm({ ...form, businessId: e.target.value })}
              className="w-full border border-slate-300 rounded px-2.5 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">WhatsApp Business Account (WABA) ID</label>
            <input
              type="text"
              placeholder={details?.wabaId || "Enter WABA ID"}
              value={form.wabaId}
              onChange={(e) => setForm({ ...form, wabaId: e.target.value })}
              className="w-full border border-slate-300 rounded px-2.5 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number ID</label>
            <input
              type="text"
              placeholder={details?.phoneNumberId || "Enter Phone Number ID"}
              value={form.phoneNumberId}
              onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
              className="w-full border border-slate-300 rounded px-2.5 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Display Phone Number</label>
            <input
              type="text"
              placeholder={details?.displayPhoneNumber || "+919196596975"}
              value={form.displayPhoneNumber}
              onChange={(e) => setForm({ ...form, displayPhoneNumber: e.target.value })}
              className="w-full border border-slate-300 rounded px-2.5 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catalogue ID</label>
            <input
              type="text"
              placeholder="Optional Meta Catalogue ID"
              value={form.catalogId}
              onChange={(e) => setForm({ ...form, catalogId: e.target.value })}
              className="w-full border border-slate-300 rounded px-2.5 py-2 font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <KeyRound className="h-3.5 w-3.5 text-slate-500" />
              System User Permanent Access Token (write-only)
            </label>
            <input
              type="password"
              placeholder="Paste new Meta System User Token to update (leave blank to keep existing)"
              value={form.accessToken}
              onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
              className="w-full border border-slate-300 rounded px-2.5 py-2 font-mono"
            />
          </div>
        </div>

        {/* Inline Send Test Message */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Test WhatsApp number (e.g. 919876543210)"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            className="flex-1 min-w-[200px] border border-slate-300 rounded px-2.5 py-1.5 font-mono bg-white"
          />
          <button
            type="button"
            disabled={!testPhone.trim() || sendTestMutation.isPending}
            onClick={() => sendTestMutation.mutate({ channel: "WHATSAPP", address: testPhone.trim() })}
            className="px-3 py-1.5 rounded bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-50"
          >
            {sendTestMutation.isPending ? "Sending..." : "Send Test Message"}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => verifyMutation.mutate()}
              disabled={verifyMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${verifyMutation.isPending ? "animate-spin" : ""}`} />
              {verifyMutation.isPending ? "Verifying..." : "Test Live Connection"}
            </button>
            <button
              type="button"
              onClick={() => subscribeMutation.mutate()}
              disabled={subscribeMutation.isPending}
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100"
            >
              {subscribeMutation.isPending ? "Subscribing..." : "Subscribe Webhook"}
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
            >
              {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                const payload: Record<string, string> = {};
                if (form.appId.trim()) payload.appId = form.appId.trim();
                if (form.businessId.trim()) payload.businessId = form.businessId.trim();
                if (form.wabaId.trim()) payload.wabaId = form.wabaId.trim();
                if (form.phoneNumberId.trim()) payload.phoneNumberId = form.phoneNumberId.trim();
                if (form.catalogId.trim()) payload.catalogId = form.catalogId.trim();
                if (form.displayPhoneNumber.trim()) payload.displayPhoneNumber = form.displayPhoneNumber.trim();
                if (form.accessToken.trim()) payload.accessToken = form.accessToken.trim();
                saveMutation.mutate(payload);
              }}
              disabled={saveMutation.isPending}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
            >
              {saveMutation.isPending ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
