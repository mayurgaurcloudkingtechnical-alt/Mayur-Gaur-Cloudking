"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Database,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  Phone,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CallyzerMasterLeadDesk() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [allocationFilter, setAllocationFilter] = useState<boolean | undefined>(undefined);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const { data: metrics, refetch: refetchMetrics } = api.callyzer.getPoolMetrics.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: leadData, isLoading, refetch: refetchLeads } = api.callyzer.listCentralLeads.useQuery({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    isAllocated: allocationFilter,
    page: 1,
    pageSize: 20,
  });

  const importMutation = api.callyzer.importLeadsBulk.useMutation({
    onSuccess: (res) => {
      setUploadStatus(`Success! Imported: ${res.imported}, Duplicates: ${res.duplicates}, Failed: ${res.errors}`);
      refetchMetrics();
      refetchLeads();
      setCsvText("");
    },
    onError: (err) => {
      setUploadStatus(`Error: ${err.message}`);
    },
  });

  const handleParseAndUpload = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split("\n");
    const rows = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        fullName: parts[0] || "Student Lead",
        phone: parts[1] || "",
        email: parts[2] || undefined,
        city: parts[3] || undefined,
        qualification: parts[4] || undefined,
        campaign: parts[5] || "Bulk Import",
      };
    }).filter((r) => r.phone.length >= 10);

    if (rows.length === 0) {
      setUploadStatus("No valid rows with at least 10-digit phone found.");
      return;
    }

    importMutation.mutate({
      fileName: "manual_lead_entry.csv",
      rows,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Pool Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider text-slate-400">
              Total Master Leads
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-white flex items-center justify-between">
              {metrics?.totalLeads ?? 0}
              <Database className="w-6 h-6 text-indigo-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-400">Total Leads in SoftLab Central DB</CardContent>
        </Card>

        <Card className="border-amber-900/50 bg-amber-950/20 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider text-amber-400">
              Unallocated Pool Balance
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-amber-400 flex items-center justify-between">
              {metrics?.unallocatedLeads ?? 0}
              <Layers className="w-6 h-6 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-300">Ready for Daily Smart Distribution</CardContent>
        </Card>

        <Card className="border-blue-900/50 bg-blue-950/20 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider text-blue-400">
              Allocated Today
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-blue-400 flex items-center justify-between">
              {metrics?.activeAllocationsToday ?? 0}
              <Calendar className="w-6 h-6 text-blue-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-blue-300">Distributed to Calling Desks Today</CardContent>
        </Card>

        <Card className="border-emerald-900/50 bg-emerald-950/20 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider text-emerald-400">
              Converted Admissions
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-emerald-400 flex items-center justify-between">
              {metrics?.convertedLeads ?? 0}
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-emerald-300">Total Successful Admissions</CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/70 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, city..."
              className="pl-9 bg-slate-950 border-slate-800 text-sm h-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="FOLLOW_UP">Follow Up</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>

          <select
            value={allocationFilter === undefined ? "ALL" : allocationFilter ? "ALLOCATED" : "UNALLOCATED"}
            onChange={(e) => {
              const val = e.target.value;
              setAllocationFilter(val === "ALL" ? undefined : val === "ALLOCATED");
            }}
            className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-200"
          >
            <option value="ALL">All Allocation States</option>
            <option value="UNALLOCATED">Unallocated Only</option>
            <option value="ALLOCATED">Allocated</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { refetchMetrics(); refetchLeads(); }}
            className="border-slate-800 text-slate-300 hover:bg-slate-800 h-9"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowUploadModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-9"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Bulk Lead Ingestion
          </Button>
        </div>
      </div>

      {/* Leads Table */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Lead Full Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">City / Location</th>
                  <th className="py-3 px-4">Campaign / Course</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Ingestion Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading central leads...
                    </td>
                  </tr>
                ) : leadData?.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No leads match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  leadData?.items.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {lead.fullName}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {lead.phone}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{lead.city || "-"}</td>
                      <td className="py-3 px-4 text-slate-400">{lead.campaignName || "General"}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={
                            lead.status === "ADMITTED"
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                              : lead.status === "QUALIFIED"
                              ? "bg-blue-950/40 text-blue-400 border-blue-800"
                              : lead.status === "FOLLOW_UP"
                              ? "bg-amber-950/40 text-amber-400 border-amber-800"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }
                        >
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {lead.assignedTo ? (
                          <span className="flex items-center gap-1 text-indigo-400 font-medium">
                            <UserCheck className="w-3 h-3" />
                            {lead.assignedTo.name} ({lead.assignedTo.roleCode})
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Unallocated</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl border-slate-700 bg-slate-900 text-white shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                Bulk Lead Ingestion (CSV / Raw Data)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Paste comma-separated rows: Full Name, Phone, Email, City, Qualification, Campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Rahul Sharma, 9876543210, rahul@example.com, Mumbai, B.Tech, Google Ads&#10;Priya Singh, 9811223344, priya@example.com, Delhi, BCA, FullStack Webinar"
                className="w-full h-44 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />

              {uploadStatus && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium ${
                    uploadStatus.startsWith("Success")
                      ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                      : "bg-rose-950/60 text-rose-300 border border-rose-800"
                  }`}
                >
                  {uploadStatus}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowUploadModal(false); setUploadStatus(null); }}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={handleParseAndUpload}
                  disabled={importMutation.isPending || !csvText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {importMutation.isPending ? "Ingesting..." : "Validate & Ingest Leads"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
