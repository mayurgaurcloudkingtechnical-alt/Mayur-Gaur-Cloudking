"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  VerificationType,
  VerificationStatus,
} from "@prisma/client";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Building2,
  CreditCard,
  Fingerprint,
  FileText,
  UserCheck,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";

export function VerificationHubView() {
  const [selectedType, setSelectedType] = useState<VerificationType | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<VerificationStatus | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeReviewRecord, setActiveReviewRecord] = useState<any | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Queries
  const { data: metrics, isLoading: loadingMetrics, refetch: refetchMetrics } =
    api.verification.getMetrics.useQuery();

  const { data: recordData, isLoading: loadingRecords, refetch: refetchRecords } =
    api.verification.listRecords.useQuery({
      verificationType: selectedType,
      status: selectedStatus,
      search: search.trim() || undefined,
      page,
      limit: 15,
    });

  // Mutation
  const manualReviewMutation = api.verification.manualReview.useMutation({
    onSuccess: () => {
      setActiveReviewRecord(null);
      setReviewReason("");
      setReviewError(null);
      refetchRecords();
      refetchMetrics();
    },
    onError: (err) => {
      setReviewError(err.message);
    },
  });

  const handleReviewSubmit = (decision: "APPROVE" | "REJECT") => {
    if (!reviewReason.trim() || reviewReason.trim().length < 10) {
      setReviewError("Detailed statutory justification is required (minimum 10 characters).");
      return;
    }
    if (!activeReviewRecord) return;

    manualReviewMutation.mutate({
      recordId: activeReviewRecord.id,
      decision,
      reason: reviewReason.trim(),
    });
  };

  const getTypeBadge = (type: VerificationType) => {
    switch (type) {
      case "PAN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <FileText className="w-3 h-3" /> PAN
          </span>
        );
      case "AADHAAR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Fingerprint className="w-3 h-3" /> Aadhaar (UIDAI)
          </span>
        );
      case "BANK_ACCOUNT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            <CreditCard className="w-3 h-3" /> Bank Account
          </span>
        );
      case "GSTIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
            <Building2 className="w-3 h-3" /> GSTIN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {type}
          </span>
        );
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
          </span>
        );
      case "MANUALLY_REVIEWED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
            <UserCheck className="w-3.5 h-3.5" /> MANUALLY REVIEWED
          </span>
        );
      case "MANUAL_REVIEW_REQUIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" /> REVIEW REQUIRED
          </span>
        );
      case "PENDING_VERIFICATION":
      case "PENDING_CONSENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <Clock className="w-3.5 h-3.5" /> {status.replace("_", " ")}
          </span>
        );
      case "PENDING_CONFIGURATION":
      case "PROVIDER_UNAVAILABLE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
            <Clock className="w-3.5 h-3.5" /> PENDING CONFIG
          </span>
        );
      case "FAILED":
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <XCircle className="w-3.5 h-3.5" /> {status}
          </span>
        );
      case "NOT_APPLICABLE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            EXEMPT / N/A
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Statutory Verification & Identity Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centrally governed KYC, PAN, Aadhaar (UIDAI-compliant), RBI Bank validation, and GSTIN compliance engine.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchMetrics();
              refetchRecords();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Hub
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Managed Identities
            </span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">
            {loadingMetrics ? "..." : metrics?.totalRecords ?? 0}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            PAN, Aadhaar, Bank & GSTIN combined
          </div>
        </div>

        {/* Verified */}
        <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Statutory Verified
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-900 dark:text-emerald-200">
            {loadingMetrics ? "..." : metrics?.verified ?? 0}
          </div>
          <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
            Eligible for immediate automated payouts & payroll
          </div>
        </div>

        {/* Action Required / Manual Review */}
        <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              Manual Review Required
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-900 dark:text-amber-200">
            {loadingMetrics ? "..." : metrics?.manualReview ?? 0}
          </div>
          <div className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            Requires compliance officer / admin sign-off
          </div>
        </div>

        {/* Pending & Config Required */}
        <div className="p-5 rounded-xl border border-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              Pending / Gateway Config
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-blue-900 dark:text-blue-200">
            {loadingMetrics ? "..." : metrics?.pending ?? 0}
          </div>
          <div className="mt-2 text-xs text-blue-700 dark:text-blue-400">
            Awaiting provider sync or statutory consent
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by legal name, masked target (XXXX-XXXX-1234), or reference ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Verification Type Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedType || ""}
              onChange={(e) => {
                setSelectedType(e.target.value ? (e.target.value as VerificationType) : undefined);
                setPage(1);
              }}
              className="w-full md:w-44 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">All Identity Types</option>
              <option value="PAN">PAN (Income Tax)</option>
              <option value="AADHAAR">Aadhaar (UIDAI)</option>
              <option value="BANK_ACCOUNT">Bank Account (RBI)</option>
              <option value="GSTIN">GSTIN (GSTN)</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus || ""}
              onChange={(e) => {
                setSelectedStatus(e.target.value ? (e.target.value as VerificationStatus) : undefined);
                setPage(1);
              }}
              className="w-full md:w-48 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">All Verification Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="MANUALLY_REVIEWED">Manually Reviewed</option>
              <option value="MANUAL_REVIEW_REQUIRED">Review Required</option>
              <option value="PENDING_CONFIGURATION">Pending Config</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="FAILED">Failed</option>
              <option value="NOT_APPLICABLE">Exempt / N/A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verification Records Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                <th className="py-3 px-4">Entity & ID</th>
                <th className="py-3 px-4">Statutory Type</th>
                <th className="py-3 px-4">Masked Target</th>
                <th className="py-3 px-4">Declared Name</th>
                <th className="py-3 px-4">Verified Match</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Provider / Ref</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingRecords ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading verified records...
                  </td>
                </tr>
              ) : !recordData?.items || recordData.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
                    No verification records found matching current criteria.
                  </td>
                </tr>
              ) : (
                recordData.items.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{record.entityType}</div>
                      <div className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                        {record.entityId}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getTypeBadge(record.verificationType)}</td>
                    <td className="py-3 px-4 font-mono font-medium text-foreground">
                      {record.maskedTarget}
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">
                      {record.declaredName || <span className="text-muted-foreground italic">N/A</span>}
                    </td>
                    <td className="py-3 px-4">
                      {record.verifiedName ? (
                        <div>
                          <div className="text-foreground font-medium">{record.verifiedName}</div>
                          {record.nameMatchScore !== null && (
                            <div className="text-xs text-muted-foreground">
                              Match:{" "}
                              <span
                                className={`font-semibold ${
                                  record.nameMatchScore >= 80
                                    ? "text-green-600 dark:text-green-400"
                                    : record.nameMatchScore >= 60
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {record.nameMatchScore}%
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Unresolved</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-foreground">{record.provider}</div>
                      <div className="text-xs font-mono text-muted-foreground truncate max-w-[140px]">
                        {record.referenceId}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setActiveReviewRecord(record);
                          setReviewReason(record.manualReviewNotes || "");
                          setReviewError(null);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Review / Audit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {recordData && recordData.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing page <span className="font-semibold text-foreground">{recordData.page}</span> of{" "}
              <span className="font-semibold text-foreground">{recordData.totalPages}</span> (
              {recordData.total} records)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-border bg-background disabled:opacity-50 hover:bg-muted transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= recordData.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-border bg-background disabled:opacity-50 hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Review Modal */}
      {activeReviewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  Statutory KYC & Manual Compliance Review
                </h3>
              </div>
              <button
                onClick={() => setActiveReviewRecord(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Record Overview */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-3.5 rounded-lg border border-border">
              <div>
                <span className="text-muted-foreground">Entity:</span>{" "}
                <span className="font-semibold text-foreground">
                  {activeReviewRecord.entityType} ({activeReviewRecord.entityId})
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>{" "}
                <span className="font-semibold text-foreground">
                  {activeReviewRecord.verificationType}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Masked Target:</span>{" "}
                <span className="font-mono font-semibold text-foreground">
                  {activeReviewRecord.maskedTarget}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Current Status:</span>{" "}
                {getStatusBadge(activeReviewRecord.status)}
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Declared Name:</span>{" "}
                <span className="font-semibold text-foreground">
                  {activeReviewRecord.declaredName || "None"}
                </span>
              </div>
              {activeReviewRecord.verifiedName && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Provider Verified Name:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {activeReviewRecord.verifiedName}
                  </span>{" "}
                  ({activeReviewRecord.nameMatchScore}% match score)
                </div>
              )}
            </div>

            {/* Audit Justification Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Compliance Justification & Audit Rationale (Mandatory)</span>
                <span className="text-[11px] text-muted-foreground">Min 10 characters</span>
              </label>
              <textarea
                rows={3}
                value={reviewReason}
                onChange={(e) => {
                  setReviewReason(e.target.value);
                  setReviewError(null);
                }}
                placeholder="Enter regulatory reasoning, manual offline physical document review notes, or verification exception justification..."
                className="w-full p-2.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
              {reviewError && (
                <p className="text-xs text-destructive font-medium">{reviewError}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                disabled={manualReviewMutation.isPending}
                onClick={() => setActiveReviewRecord(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={manualReviewMutation.isPending}
                onClick={() => handleReviewSubmit("REJECT")}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm disabled:opacity-50"
              >
                Reject / Fail Record
              </button>
              <button
                type="button"
                disabled={manualReviewMutation.isPending}
                onClick={() => handleReviewSubmit("APPROVE")}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {manualReviewMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Approve (Mark Manually Reviewed)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
