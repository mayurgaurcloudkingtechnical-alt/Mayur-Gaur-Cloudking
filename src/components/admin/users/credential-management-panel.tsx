"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Shield, KeyRound, Eye, RefreshCw, Ban, Wrench, Mail, Search } from "lucide-react";

export function CredentialManagementPanel() {
  const [type, setType] = useState<"ALL" | "STAFF" | "STUDENT">("ALL");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<{ userId: string; tempPassword: string; expiresAt: string } | null>(null);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ type });
      if (search.trim()) qs.set("search", search.trim());
      const res = await fetch(`/api/admin/credentials?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load credential directory");
      setData(json);
    } catch (e: any) {
      setBanner({ type: "err", msg: e.message });
    } finally {
      setLoading(false);
    }
  }, [type, search]);

  useEffect(() => {
    load();
  }, [load]);

  const callAction = async (payload: Record<string, any>, successMsg?: string) => {
    setBanner(null);
    const res = await fetch("/api/admin/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      setBanner({ type: "err", msg: json.error || "Operation failed" });
      return null;
    }
    if (successMsg) setBanner({ type: "ok", msg: successMsg });
    await load();
    return json;
  };

  const accounts: any[] = data?.accounts || [];
  const admissionEmails: any[] = data?.monitoring?.admissionEmailLogs || [];
  const auditLogs: any[] = data?.monitoring?.auditLogs || [];

  return (
    <div className="space-y-6 mt-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-sky-600" />
            Hierarchical Credential Management &amp; Operational Monitoring
          </h2>
          <p className="text-xs text-slate-500">
            Your Authority: <span className="font-semibold">{data?.actor?.roleCode || "..."}</span> (Rank{" "}
            {data?.actor?.authorityRank ?? "-"}). Permanent passwords are never viewable; only lower-authority accounts appear below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", "STAFF", "STUDENT"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                type === t ? "bg-slate-900 text-white" : "bg-white border border-slate-300 text-slate-700"
              }`}
            >
              {t}
            </button>
          ))}
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-medium ${
            banner.type === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {banner.msg}
        </div>
      )}

      {revealed && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
          <div>
            <strong>Audited Temporary Credential:</strong>{" "}
            <code className="bg-white px-2 py-0.5 rounded border font-mono">{revealed.tempPassword}</code>{" "}
            (Expires: {new Date(revealed.expiresAt).toLocaleString()})
          </div>
          <button
            type="button"
            onClick={() => setRevealed(null)}
            className="px-2.5 py-1 rounded bg-amber-900 text-white font-semibold"
          >
            Hide
          </button>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 max-w-md bg-white border border-slate-300 rounded-lg px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search Employee ID, Student ID, name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs outline-none"
        />
      </div>

      {/* Accounts Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b text-[11px] uppercase font-semibold text-slate-500">
            <tr>
              <th className="py-3 px-4">ID &amp; Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role (Rank)</th>
              <th className="py-3 px-4">Dept / Branch</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Credential Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.map((acc) => (
              <tr key={acc.id} className="hover:bg-slate-50/70">
                <td className="py-2.5 px-4">
                  <div className="font-semibold text-slate-900">{acc.name}</div>
                  <div className="font-mono text-[11px] text-slate-400">{acc.identifier}</div>
                </td>
                <td className="py-2.5 px-4 font-mono">{acc.email}</td>
                <td className="py-2.5 px-4">
                  {acc.roleCode} ({acc.authorityRank})
                </td>
                <td className="py-2.5 px-4">
                  {acc.department} / {acc.branch}
                </td>
                <td className="py-2.5 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${acc.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {acc.status}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                    {acc.hasActiveTempCredential && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await callAction({ action: "REVEAL_TEMP_CREDENTIAL", targetUserId: acc.id });
                          if (res?.tempPassword) {
                            setRevealed({ userId: acc.id, tempPassword: res.tempPassword, expiresAt: res.expiresAt });
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold"
                      >
                        <Eye className="h-3 w-3" />
                        Reveal Temp
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await callAction(
                          { action: "RESET_CREDENTIAL", targetUserId: acc.id, sendEmail: true },
                          `New temporary credential issued & emailed to ${acc.email}.`
                        );
                        if (res?.tempPassword) {
                          setRevealed({ userId: acc.id, tempPassword: res.tempPassword, expiresAt: new Date(Date.now() + 72 * 3600000).toISOString() });
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-600 text-white text-[11px] font-semibold"
                    >
                      <KeyRound className="h-3 w-3" />
                      Reset &amp; Email
                    </button>
                    <button
                      type="button"
                      onClick={() => callAction({ action: "REVOKE_CREDENTIAL", targetUserId: acc.id }, `Credentials revoked for ${acc.email}.`)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold"
                    >
                      <Ban className="h-3 w-3" />
                      Revoke
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student 3-Email Delivery Monitoring & Credential Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-sky-600" />
            Student Admission 3-Email Delivery Log ({admissionEmails.length})
          </h3>
          <table className="w-full text-left text-xs">
            <thead className="border-b text-[11px] text-slate-500 uppercase">
              <tr>
                <th className="py-2 pr-2">Student / Email</th>
                <th className="py-2 pr-2">Email Type</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Provider Msg ID</th>
                <th className="py-2 pr-2">Timestamp / Error</th>
                <th className="py-2 text-right">Retry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admissionEmails.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-slate-400">No 3-email admission logs recorded yet.</td></tr>
              ) : (
                admissionEmails.map((em) => (
                  <tr key={em.id}>
                    <td className="py-2 pr-2">
                      <div className="font-mono text-[11px]">{em.studentId}</div>
                      <div className="text-[11px] text-slate-500">{em.recipientEmail}</div>
                    </td>
                    <td className="py-2 pr-2 font-semibold">{em.emailType}</td>
                    <td className="py-2 pr-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${em.status === "SENT" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {em.status} ({em.retryCount + 1})
                      </span>
                    </td>
                    <td className="py-2 pr-2 font-mono text-[10px] text-slate-600">{em.providerMessage || "-"}</td>
                    <td className="py-2 pr-2 text-[10px] text-slate-500">
                      {em.sentAt ? new Date(em.sentAt).toLocaleString() : new Date(em.createdAt).toLocaleString()}
                      {em.errorMessage && <div className="text-rose-600">{em.errorMessage}</div>}
                    </td>
                    <td className="py-2 text-right">
                      {em.status !== "SENT" && (
                        <button
                          type="button"
                          onClick={() => callAction({ action: "RETRY_ADMISSION_EMAIL", logId: em.id }, "Retried admission email.")}
                          className="px-2 py-0.5 rounded bg-sky-600 text-white text-[10px] font-semibold"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
            <Wrench className="h-4 w-4 text-slate-600" />
            Credential &amp; Onboarding Security Audit Trail ({auditLogs.length})
          </h3>
          <table className="w-full text-left text-xs">
            <thead className="border-b text-[11px] text-slate-500 uppercase">
              <tr>
                <th className="py-2 pr-2">Action</th>
                <th className="py-2 pr-2">Resource</th>
                <th className="py-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((al) => (
                <tr key={al.id}>
                  <td className="py-2 pr-2 font-semibold">{al.action}</td>
                  <td className="py-2 pr-2 font-mono text-[11px]">{al.resourceType} / {al.resourceId}</td>
                  <td className="py-2 text-[11px] text-slate-500">{new Date(al.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
