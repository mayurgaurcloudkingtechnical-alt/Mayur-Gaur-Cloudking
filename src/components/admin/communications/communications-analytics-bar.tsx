"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Download,
  FileSpreadsheet,
  Printer,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Send,
  Mail,
  MessageSquare,
  RefreshCw,
  Clock,
} from "lucide-react";
import { WhatsAppProviderModal } from "./whatsapp-provider-modal";

export function CommunicationsAnalyticsBar() {
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [eventType, setEventType] = useState("");

  const { data: stats } = api.notifications.getDeliveryStats.useQuery();
  const { data: waDetails } = api.omnichannel.getWhatsAppConnectionDetails.useQuery();

  const buildExportUrl = (format: "csv" | "xlsx") => {
    const params = new URLSearchParams({ format });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (channel) params.set("channel", channel);
    if (status) params.set("status", status);
    if (eventType) params.set("eventType", eventType);
    return `/api/communications/export?${params.toString()}`;
  };

  const isWaConnected = waDetails?.status === "CONNECTED";

  const kpis = [
    { label: "Total Notifications", value: stats?.total ?? 0, icon: Send, tone: "text-slate-900 bg-white border-slate-200" },
    { label: "Total Recipients", value: stats?.totalRecipients ?? 0, icon: Users, tone: "text-sky-800 bg-sky-50 border-sky-200" },
    { label: "WhatsApp Submitted", value: stats?.whatsappSubmitted ?? 0, icon: MessageSquare, tone: "text-emerald-800 bg-emerald-50 border-emerald-200" },
    { label: "WhatsApp Delivered", value: stats?.whatsappDelivered ?? 0, icon: CheckCircle2, tone: "text-emerald-900 bg-emerald-50 border-emerald-200" },
    { label: "WhatsApp Read", value: stats?.whatsappRead ?? 0, icon: CheckCircle2, tone: "text-teal-800 bg-teal-50 border-teal-200" },
    { label: "WhatsApp Failed", value: stats?.whatsappFailed ?? 0, icon: AlertTriangle, tone: "text-rose-800 bg-rose-50 border-rose-200" },
    { label: "Emails Sent", value: stats?.emailsSent ?? 0, icon: Mail, tone: "text-blue-800 bg-blue-50 border-blue-200" },
    { label: "Emails Delivered", value: stats?.emailsDelivered ?? 0, icon: CheckCircle2, tone: "text-indigo-800 bg-indigo-50 border-indigo-200" },
    { label: "Emails Bounced", value: stats?.emailsBounced ?? 0, icon: AlertTriangle, tone: "text-rose-800 bg-rose-50 border-rose-200" },
    { label: "Pending", value: stats?.pending ?? 0, icon: Clock, tone: "text-amber-800 bg-amber-50 border-amber-200" },
    { label: "Retried", value: stats?.retried ?? 0, icon: RefreshCw, tone: "text-purple-800 bg-purple-50 border-purple-200" },
    { label: "Staged / Simulated", value: stats?.simulated ?? 0, icon: AlertTriangle, tone: "text-slate-700 bg-slate-50 border-slate-200" },
  ];

  return (
    <div className="space-y-4">
      {/* Provider Status & Official WhatsApp Cloud API Config Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isWaConnected
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {isWaConnected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            WhatsApp Cloud API: {waDetails?.status || "CHECKING"}
          </div>
          <span className="text-xs text-slate-600 font-mono">
            Phone ID: {waDetails?.phoneNumberId || "Not Configured"}
          </span>
          <span className="text-xs text-slate-600 font-mono">
            Display: {waDetails?.displayPhoneNumber || "Not Configured"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setProviderModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Configure WhatsApp Provider
          </button>
          <a
            href={buildExportUrl("csv")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </a>
          <a
            href={buildExportUrl("xlsx")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export Excel (.xlsx)
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Export Filter Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold text-slate-700">Export / Analytics Filters:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-slate-700"
          title="Date From"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-slate-700"
          title="Date To"
        />
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-700"
        >
          <option value="">All Channels</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="OFFICIAL_EMAIL">Official Email</option>
          <option value="PERSONAL_EMAIL">Personal Email</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="SENT">Sent</option>
          <option value="DELIVERED">Delivered</option>
          <option value="READ">Read</option>
          <option value="FAILED">Failed</option>
          <option value="SIMULATED">Staged / Simulated</option>
          <option value="PENDING">Pending</option>
        </select>
        <input
          type="text"
          placeholder="Event type (e.g. DAILY_REPORT_SUBMITTED)"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-slate-700 min-w-[220px]"
        />
      </div>

      {/* 12 Recipient-Wise Analytics KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`rounded-xl border p-3 ${k.tone}`}>
              <div className="flex items-center justify-between text-[11px] font-semibold opacity-80">
                <span>{k.label}</span>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="text-xl font-bold mt-1">{k.value}</div>
            </div>
          );
        })}
      </div>

      <WhatsAppProviderModal open={providerModalOpen} onClose={() => setProviderModalOpen(false)} />
    </div>
  );
}
