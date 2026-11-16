"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Database,
  Upload,
  CheckCircle2,
  XCircle,
  Send,
  Search,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type TabKey =
  | "leads"
  | "pending_approval"
  | "approved"
  | "distributed"
  | "rejected"
  | "duplicates"
  | "students"
  | "staff"
  | "authorities"
  | "vendors"
  | "partners"
  | "import_history"
  | "activity_logs";

const TABS: { key: TabKey; label: string; countKey?: string }[] = [
  { key: "leads", label: "Complete Lead DB", countKey: "leads" },
  { key: "pending_approval", label: "Pending Approval (ON HOLD)", countKey: "pendingApproval" },
  { key: "approved", label: "Approved Data", countKey: "approved" },
  { key: "distributed", label: "Distributed Data", countKey: "distributed" },
  { key: "rejected", label: "Rejected Data", countKey: "rejected" },
  { key: "duplicates", label: "Duplicates" },
  { key: "students", label: "Student DB", countKey: "students" },
  { key: "staff", label: "Staff Directory", countKey: "staff" },
  { key: "authorities", label: "Higher Authorities", countKey: "authorities" },
  { key: "vendors", label: "Vendors", countKey: "vendors" },
  { key: "partners", label: "Corporate Partners", countKey: "partners" },
  { key: "import_history", label: "Import History", countKey: "importHistory" },
  { key: "activity_logs", label: "Data Activity Logs", countKey: "activityLogs" },
];

export function EnterpriseDataHub() {
  const [tab, setTab] = useState<TabKey>("leads");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [targetRole, setTargetRole] = useState("COUNSELOR");
  const [banner, setBanner] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // AI Smart Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [recordType, setRecordType] = useState<"LEAD" | "VENDOR" | "PARTNER">("LEAD");
  const [rawText, setRawText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const parseJsonResponse = async (res: Response) => {
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const snippet = (await res.text()).slice(0, 120);
        throw new Error(`Server returned non-JSON response (${res.status}): ${snippet}`);
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
      return json;
    };

    try {
      const qs = new URLSearchParams({
        tab,
        page: String(page),
        limit: "20",
      });
      if (search.trim()) qs.set("search", search.trim());
      const res = await fetch(`/api/enterprise-data?${qs.toString()}`);
      const json = await parseJsonResponse(res);
      setData(json);
      setSelectedIds([]);
    } catch (err: any) {
      setBanner({ type: "err", msg: err.message });
    } finally {
      setLoading(false);
    }
  }, [tab, page, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSmartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile && !rawText.trim()) {
      setBanner({ type: "err", msg: "Select a file (.xlsx, .csv, .txt, .json, .vcf) or paste unstructured text." });
      return;
    }
    setUploading(true);
    setBanner(null);
    try {
      const fd = new FormData();
      fd.append("recordType", recordType);
      if (uploadFile) fd.append("file", uploadFile);
      if (rawText.trim()) fd.append("text", rawText.trim());
      const res = await fetch("/api/enterprise-data", { method: "POST", body: fd });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const snippet = (await res.text()).slice(0, 120);
        throw new Error(`Server returned non-JSON response (${res.status}): ${snippet}`);
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Import failed");
      setBanner({ type: "ok", msg: json.message });
      setUploadFile(null);
      setRawText("");
      setTab("pending_approval");
      setPage(1);
      await loadData();
    } catch (err: any) {
      setBanner({ type: "err", msg: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleWorkflowAction = async (action: "APPROVE" | "REJECT" | "DISTRIBUTE") => {
    if (selectedIds.length === 0) {
      setBanner({ type: "err", msg: "Select at least one lead row first." });
      return;
    }
    setBanner(null);
    try {
      const res = await fetch("/api/enterprise-data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          leadIds: selectedIds,
          assigneeId: assigneeId || undefined,
          targetRole: assigneeId ? undefined : targetRole,
        }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const snippet = (await res.text()).slice(0, 120);
        throw new Error(`Server returned non-JSON response (${res.status}): ${snippet}`);
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      setBanner({
        type: "ok",
        msg:
          action === "DISTRIBUTE"
            ? `Distributed ${json.distributedCount} leads to ${json.assignedTo}.`
            : `${action} completed on ${json.updatedCount} records.`,
      });
      await loadData();
    } catch (err: any) {
      setBanner({ type: "err", msg: err.message });
    }
  };

  const items: any[] = data?.items || [];
  const summary = data?.summary || {};
  const assignees: any[] = data?.assignees || [];
  const isLeadTab = ["leads", "pending_approval", "approved", "distributed", "rejected", "duplicates"].includes(tab);

  const toggleAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const exportUrl = (fmt: "csv" | "xlsx") => {
    const qs = new URLSearchParams({ tab, export: fmt });
    if (search.trim()) qs.set("search", search.trim());
    return `/api/enterprise-data?${qs.toString()}`;
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Complete Enterprise Data & AI Import Hub</h2>
            <p className="text-xs text-slate-500">
              Manager / Super Admin Directory: Upload multi-format files, stage ON_HOLD, approve & distribute leads.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUpload((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {showUpload ? "Hide AI Smart Upload" : "AI Smart Data Upload"}
          </button>
          <a
            href={exportUrl("csv")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </a>
          <a
            href={exportUrl("xlsx")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export Excel (.xlsx)
          </a>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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

      {/* Multi-Format AI Smart Upload Drawer */}
      {showUpload && (
        <form
          onSubmit={handleSmartUpload}
          className="bg-white border border-sky-200 rounded-xl p-5 shadow-sm space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-sky-600" />
                Multi-Format AI Smart Data Capture (.xlsx, .csv, .pdf, .docx, .txt, .json, .vcf, or Raw Text)
              </h3>
              <p className="text-xs text-slate-500">
                All imported Leads are automatically staged as <span className="font-semibold">ON_HOLD (Pending Approval)</span> with duplicate checking.
              </p>
            </div>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as any)}
              className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white font-semibold"
            >
              <option value="LEAD">Route to Leads (Pending Approval)</option>
              <option value="VENDOR">Route to Vendors (Pending Approval)</option>
              <option value="PARTNER">Route to Corporate Partners (Pending Approval)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Upload File (.xlsx, .csv, .pdf, .docx, .txt, .json, .vcf)</label>
              <input
                type="file"
                accept=".xlsx,.csv,.pdf,.docx,.txt,.json,.vcf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Or Paste Unstructured Text / WhatsApp / Email Dump</label>
              <textarea
                rows={3}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Example: Rahul Sharma 9876543210 rahul@gmail.com Data Science Prayagraj"
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700"
            >
              {uploading ? "Extracting & Staging..." : "Extract & Stage for Approval"}
            </button>
          </div>
        </form>
      )}

      {/* Directory Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
        {TABS.map((t) => {
          const count = t.countKey ? summary[t.countKey] : undefined;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t.label}
              {typeof count === "number" && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${active ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Bulk Approval/Distribution Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md border border-slate-300 rounded-lg px-2.5 py-1.5">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, phone, email, city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs outline-none text-slate-700"
          />
        </div>

        {isLeadTab && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">{selectedIds.length} selected</span>
            <button
              type="button"
              onClick={() => handleWorkflowAction("APPROVE")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => handleWorkflowAction("REJECT")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </button>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">Auto-Balance by Role</option>
              {assignees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.roleCode})
                </option>
              ))}
            </select>
            {!assigneeId && (
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white"
              >
                <option value="COUNSELOR">All Counselors</option>
                <option value="TELECALLER">All Telecallers</option>
              </select>
            )}
            <button
              type="button"
              onClick={() => handleWorkflowAction("DISTRIBUTE")}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700"
            >
              <Send className="h-3.5 w-3.5" />
              Distribute
            </button>
          </div>
        )}
      </div>

      {/* Data Table with Guaranteed Horizontal Scroll */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[11px] font-semibold text-slate-500">
            <tr>
              {isLeadTab && (
                <th className="py-3 px-3 w-10">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={toggleAll}
                  />
                </th>
              )}
              <th className="py-3 px-4">Name / Event</th>
              <th className="py-3 px-4">Phone / Type</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">City / Detail</th>
              <th className="py-3 px-4">Category / Role</th>
              <th className="py-3 px-4">Source / Code</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Assigned / Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={isLeadTab ? 9 : 8} className="py-8 text-center text-slate-400">
                  Loading enterprise records...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={isLeadTab ? 9 : 8} className="py-8 text-center text-slate-400">
                  No records found for this view.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  {isLeadTab && (
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() =>
                          setSelectedIds((prev) =>
                            prev.includes(row.id) ? prev.filter((x) => x !== row.id) : [...prev, row.id]
                          )
                        }
                      />
                    </td>
                  )}
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{row.name}</td>
                  <td className="py-2.5 px-4 font-mono">{row.phone}</td>
                  <td className="py-2.5 px-4 font-mono">{row.email}</td>
                  <td className="py-2.5 px-4">{row.city}</td>
                  <td className="py-2.5 px-4">{row.category}</td>
                  <td className="py-2.5 px-4 font-mono">{row.source}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">{row.assignee}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-600">
        <div>
          Showing page <span className="font-semibold">{data?.page || 1}</span> of{" "}
          <span className="font-semibold">{data?.totalPages || 1}</span> ({data?.total || 0} total records)
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <button
            type="button"
            disabled={page >= (data?.totalPages || 1)}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
