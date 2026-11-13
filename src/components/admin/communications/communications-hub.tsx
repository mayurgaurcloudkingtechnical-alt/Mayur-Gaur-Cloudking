"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Shield,
  UserCheck,
  UserX,
  Plus,
  Edit,
  ExternalLink,
} from "lucide-react";
import { UserRoleCode } from "@prisma/client";

export function CommunicationsHub() {
  const [activeTab, setActiveTab] = useState<"logs" | "authorities" | "test">("logs");
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [authSearch, setAuthSearch] = useState("");

  // Test notification state
  const [testChannel, setTestChannel] = useState<"OFFICIAL_EMAIL" | "PERSONAL_EMAIL" | "WHATSAPP">("OFFICIAL_EMAIL");
  const [testAddress, setTestAddress] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testResult, setTestResult] = useState<any>(null);

  // Add/Edit authority modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAuth, setEditingAuth] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    department: "EXECUTIVE_MANAGEMENT",
    roleCode: UserRoleCode.DIRECTOR,
    officialEmail: "",
    personalEmail: "",
    whatsappNumber: "",
    notifyEmail: true,
    notifyPersonalEmail: false,
    notifyWhatsApp: true,
    receiveDailyReports: true,
    receiveEscalations: true,
    receiveOnboarding: false,
    priority: 1,
  });

  const utils = api.useUtils();

  const { data: stats, isLoading: statsLoading } = api.notifications.getDeliveryStats.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = api.notifications.listDeliveryLogs.useQuery(
    {
      page,
      limit: 15,
      channel: channelFilter || undefined,
      status: statusFilter || undefined,
      search: searchQuery || undefined,
    },
    { refetchInterval: 15000 }
  );

  const { data: authorities, isLoading: authLoading, refetch: refetchAuth } = api.notifications.listHigherAuthorities.useQuery(
    { search: authSearch || undefined }
  );

  const retryMutation = api.notifications.retryNotification.useMutation({
    onSuccess: () => {
      utils.notifications.listDeliveryLogs.invalidate();
      utils.notifications.getDeliveryStats.invalidate();
    },
  });

  const toggleAuthMutation = api.notifications.toggleHigherAuthorityStatus.useMutation({
    onSuccess: () => {
      refetchAuth();
    },
  });

  const createAuthMutation = api.notifications.createHigherAuthority.useMutation({
    onSuccess: () => {
      setShowAddModal(false);
      resetForm();
      refetchAuth();
    },
  });

  const updateAuthMutation = api.notifications.updateHigherAuthority.useMutation({
    onSuccess: () => {
      setEditingAuth(null);
      resetForm();
      refetchAuth();
    },
  });

  const testMutation = api.notifications.sendTestNotification.useMutation({
    onSuccess: (data) => {
      setTestResult(data);
      utils.notifications.listDeliveryLogs.invalidate();
      utils.notifications.getDeliveryStats.invalidate();
    },
    onError: (err) => {
      setTestResult({ success: false, error: err.message });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      designation: "",
      department: "EXECUTIVE_MANAGEMENT",
      roleCode: UserRoleCode.DIRECTOR,
      officialEmail: "",
      personalEmail: "",
      whatsappNumber: "",
      notifyEmail: true,
      notifyPersonalEmail: false,
      notifyWhatsApp: true,
      receiveDailyReports: true,
      receiveEscalations: true,
      receiveOnboarding: false,
      priority: 1,
    });
  };

  const handleEditClick = (auth: any) => {
    setEditingAuth(auth);
    setFormData({
      name: auth.name,
      designation: auth.designation,
      department: auth.department,
      roleCode: auth.roleCode,
      officialEmail: auth.officialEmail,
      personalEmail: auth.personalEmail || "",
      whatsappNumber: auth.whatsappNumber || "",
      notifyEmail: auth.notifyEmail,
      notifyPersonalEmail: auth.notifyPersonalEmail,
      notifyWhatsApp: auth.notifyWhatsApp,
      receiveDailyReports: auth.receiveDailyReports,
      receiveEscalations: auth.receiveEscalations,
      receiveOnboarding: auth.receiveOnboarding,
      priority: auth.priority,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Mail className="h-6 w-6 text-sky-600" />
            Enterprise Communication & Notification Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated Daily Reports, Higher Authority Escalations, Staff & Vendor Dual-Channel Dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchLogs();
              refetchAuth();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setActiveTab("test")}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 transition"
          >
            <Send className="h-4 w-4" />
            Send Test Alert
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Dispatches</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats?.total ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1">All Channels</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Emails Delivered</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats?.emailsSent ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1">Mailcow SMTP</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider">WhatsApp Sent</div>
          <div className="text-2xl font-bold text-sky-600 mt-1">{stats?.whatsappSent ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1">Cloud / Official</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Failures</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{stats?.failed ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1">Needs Attention</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Simulated / Staged</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats?.simulated ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1">No Meta Token</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Delivery</div>
          <div className="text-xs font-bold text-slate-800 mt-2 truncate">
            {stats?.lastSuccessfulDelivery ? new Date(stats.lastSuccessfulDelivery).toLocaleTimeString("en-IN") : "Active"}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> System Live
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "logs"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Clock className="h-4 w-4" />
          Live Delivery Logs & Idempotency
        </button>

        <button
          onClick={() => setActiveTab("authorities")}
          className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "authorities"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Shield className="h-4 w-4" />
          Higher Authority Directory ({authorities?.length ?? 0})
        </button>

        <button
          onClick={() => setActiveTab("test")}
          className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === "test"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Send className="h-4 w-4" />
          Test Real-Time Dispatch
        </button>
      </div>

      {/* TAB 1: DELIVERY LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search recipient, address or subject..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full text-sm border-0 focus:ring-0 p-1 outline-none text-slate-700"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={channelFilter}
                onChange={(e) => {
                  setChannelFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700"
              >
                <option value="">All Channels</option>
                <option value="OFFICIAL_EMAIL">Official Work Email</option>
                <option value="PERSONAL_EMAIL">Personal Email</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="SENT">Delivered / Sent</option>
                <option value="FAILED">Failed</option>
                <option value="SIMULATED">Simulated / Staged</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Event & Recipient</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Address / Target</th>
                  <th className="py-3 px-4">Subject / Summary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logsLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Loading notification delivery logs...
                    </td>
                  </tr>
                ) : logsData?.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No delivery logs match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  logsData?.items.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{log.recipientName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <span className="font-mono">{log.eventType}</span>
                          {log.recipientRole && (
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px]">
                              {log.recipientRole}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {log.channel === "OFFICIAL_EMAIL" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <Mail className="h-3 w-3" /> Work Email
                          </span>
                        )}
                        {log.channel === "PERSONAL_EMAIL" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <Mail className="h-3 w-3" /> Personal Email
                          </span>
                        )}
                        {log.channel === "WHATSAPP" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <MessageSquare className="h-3 w-3" /> WhatsApp
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {log.recipientAddress}
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-xs text-slate-600" title={log.subject || log.contentSummary}>
                        {log.subject || log.contentSummary || "N/A"}
                      </td>

                      <td className="py-3 px-4">
                        {log.status === "SENT" && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Delivered
                          </span>
                        )}
                        {log.status === "FAILED" && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full" title={log.errorMessage || "Failed"}>
                            <AlertCircle className="h-3 w-3" /> Failed
                          </span>
                        )}
                        {log.status === "SIMULATED" && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full" title="Logged in staging without active Meta token">
                            <Clock className="h-3 w-3" /> Staged
                          </span>
                        )}
                        {log.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {(log.status === "FAILED" || log.status === "SIMULATED") && (
                          <button
                            onClick={() => retryMutation.mutate({ logId: log.id })}
                            disabled={retryMutation.isPending}
                            className="text-xs text-sky-600 hover:text-sky-800 font-medium inline-flex items-center gap-1 bg-sky-50 px-2.5 py-1 rounded border border-sky-200 transition"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {logsData && logsData.totalPages > 1 && (
              <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Page {logsData.page} of {logsData.totalPages} ({logsData.total} records)
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= logsData.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HIGHER AUTHORITY DIRECTORY */}
      {activeTab === "authorities" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search authorities by name, email or designation..."
                value={authSearch}
                onChange={(e) => setAuthSearch(e.target.value)}
                className="w-full text-sm pl-9 pr-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition"
            >
              <Plus className="h-4 w-4" />
              Add Higher Authority
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Authority & Designation</th>
                  <th className="py-3 px-4">Official Work Email</th>
                  <th className="py-3 px-4">Personal Email</th>
                  <th className="py-3 px-4">WhatsApp Contact</th>
                  <th className="py-3 px-4">Subscriptions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {authLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Loading Higher Authority directory...
                    </td>
                  </tr>
                ) : authorities?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No higher authorities found. Click "Add Higher Authority" to configure.
                    </td>
                  </tr>
                ) : (
                  authorities?.map((auth: any) => (
                    <tr key={auth.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{auth.name}</div>
                        <div className="text-xs text-slate-500">{auth.designation}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {auth.department} • Priority: P{auth.priority}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-sky-700 font-medium">
                        {auth.officialEmail}
                        {auth.notifyEmail && (
                          <span className="ml-1.5 text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {auth.personalEmail || <span className="text-slate-300 italic">Not set</span>}
                        {auth.notifyPersonalEmail && auth.personalEmail && (
                          <span className="ml-1.5 text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {auth.whatsappNumber || <span className="text-slate-300 italic">Not set</span>}
                        {auth.notifyWhatsApp && auth.whatsappNumber && (
                          <span className="ml-1.5 text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {auth.receiveDailyReports && (
                            <span className="bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded text-[10px] font-medium border border-sky-200">
                              Daily Reports
                            </span>
                          )}
                          {auth.receiveEscalations && (
                            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-medium border border-amber-200">
                              Escalations
                            </span>
                          )}
                          {auth.receiveOnboarding && (
                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-medium border border-indigo-200">
                              Onboarding
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {auth.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditClick(auth)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition"
                          title="Edit Authority"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => toggleAuthMutation.mutate({ id: auth.id })}
                          className={`p-1 rounded transition ${
                            auth.isActive
                              ? "text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                          }`}
                          title={auth.isActive ? "Deactivate Authority" : "Activate Authority"}
                        >
                          {auth.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TEST REAL-TIME DISPATCH */}
      {activeTab === "test" && (
        <div className="max-w-2xl bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Real-Time Notification Verification</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Transmit an isolated live test alert to verify Mailcow SMTP or WhatsApp Cloud API routing.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Channel</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTestChannel("OFFICIAL_EMAIL")}
                  className={`p-3 border rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    testChannel === "OFFICIAL_EMAIL"
                      ? "border-sky-600 bg-sky-50 text-sky-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Official Work Email
                </button>

                <button
                  type="button"
                  onClick={() => setTestChannel("PERSONAL_EMAIL")}
                  className={`p-3 border rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    testChannel === "PERSONAL_EMAIL"
                      ? "border-purple-600 bg-purple-50 text-purple-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Personal Email
                </button>

                <button
                  type="button"
                  onClick={() => setTestChannel("WHATSAPP")}
                  className={`p-3 border rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    testChannel === "WHATSAPP"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp Contact
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {testChannel === "WHATSAPP" ? "Recipient Phone Number (with Country Code e.g. 9196596975)" : "Recipient Email Address"}
              </label>
              <input
                type="text"
                placeholder={testChannel === "WHATSAPP" ? "9196596975" : "director@softlabglobal.com"}
                value={testAddress}
                onChange={(e) => setTestAddress(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Custom Test Message (Optional)</label>
              <textarea
                rows={3}
                placeholder="Diagnostic verification of enterprise communication channel."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                if (!testAddress.trim()) return alert("Please enter a valid target email or phone number.");
                testMutation.mutate({
                  channel: testChannel,
                  address: testAddress.trim(),
                  message: testMessage.trim() || undefined,
                });
              }}
              disabled={testMutation.isPending}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-md transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {testMutation.isPending ? "Transmitting..." : "Send Live Diagnostic Dispatch"}
            </button>

            {testResult && (
              <div
                className={`p-4 rounded-md border text-xs font-mono whitespace-pre-wrap ${
                  testResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {JSON.stringify(testResult, null, 2)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT HIGHER AUTHORITY */}
      {(showAddModal || editingAuth) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
              {editingAuth ? "Edit Higher Authority Recipient" : "Add Higher Authority Recipient"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded p-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Work Email *</label>
                <input
                  type="email"
                  value={formData.officialEmail}
                  onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded p-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Personal Email</label>
                  <input
                    type="email"
                    value={formData.personalEmail}
                    onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="9196596975"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase">Notification Routing Preferences</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.notifyEmail}
                      onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.checked })}
                    />
                    Official Work Email
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.notifyPersonalEmail}
                      onChange={(e) => setFormData({ ...formData, notifyPersonalEmail: e.target.checked })}
                    />
                    Authorized Personal Email
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.notifyWhatsApp}
                      onChange={(e) => setFormData({ ...formData, notifyWhatsApp: e.target.checked })}
                    />
                    WhatsApp Alerts
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.receiveDailyReports}
                      onChange={(e) => setFormData({ ...formData, receiveDailyReports: e.target.checked })}
                    />
                    Daily Work Reports
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.receiveEscalations}
                      onChange={(e) => setFormData({ ...formData, receiveEscalations: e.target.checked })}
                    />
                    Executive Escalations
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.receiveOnboarding}
                      onChange={(e) => setFormData({ ...formData, receiveOnboarding: e.target.checked })}
                    />
                    Staff Onboarding Alerts
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAuth(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (editingAuth) {
                    updateAuthMutation.mutate({
                      id: editingAuth.id,
                      ...formData,
                    });
                  } else {
                    createAuthMutation.mutate(formData);
                  }
                }}
                disabled={createAuthMutation.isPending || updateAuthMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded transition"
              >
                {editingAuth ? "Update Authority" : "Save Authority"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
