"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApplicationStage } from "@prisma/client";
import {
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Download,
  Edit,
  Archive,
  RotateCcw,
  Trash2,
  Loader2,
} from "lucide-react";
import { DirectAdmissionDialog } from "./direct-admission-dialog";
import { EditApplicationDialog } from "./edit-application-dialog";

interface ApplicationsListViewProps {
  basePath?: string;
}

export function ApplicationsListView({ basePath = "/counselor/admissions" }: ApplicationsListViewProps) {
  const [admissionOpen, setAdmissionOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<any | null>(null);
  const [stage, setStage] = useState<ApplicationStage | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const utils = api.useUtils();

  const { data, isLoading, error } = api.crm.listApplications.useQuery({
    stage: stage === "ALL" ? undefined : stage,
    search: search.trim() || undefined,
    page,
    limit: 15,
  });

  const applications = data?.applications || [];
  const pagination = data?.pagination;

  const archiveMutation = api.crm.archiveApplication.useMutation({
    onSuccess: () => {
      utils.crm.listApplications.invalidate();
    },
    onError: (err) => alert(err.message),
  });

  const restoreMutation = api.crm.restoreApplication.useMutation({
    onSuccess: () => {
      utils.crm.listApplications.invalidate();
    },
    onError: (err) => alert(err.message),
  });

  const deleteMutation = api.crm.deleteApplication.useMutation({
    onSuccess: () => {
      utils.crm.listApplications.invalidate();
    },
    onError: (err) => alert(err.message),
  });

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const res = await utils.crm.exportApplications.fetch({
        stage: stage === "ALL" ? undefined : stage,
      });
      if (res && res.csvContent) {
        const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", res.fileName || "admissions-export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      alert("Failed to export: " + (err.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by APP number, candidate name, or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isExporting}
                onClick={handleExportCsv}
                className="border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 h-8"
              >
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                <span>Export CSV</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => setAdmissionOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs h-8"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Admission Application</span>
              </Button>
            </div>
          </div>

          {/* Stage Filters */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={() => {
                setStage("ALL");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                stage === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Applications
            </button>
            {Object.values(ApplicationStage).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStage(st);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  stage === st
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            <span>Admission Applications</span>
            {pagination && (
              <span className="text-xs font-normal text-slate-400">({pagination.total} total)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading applications...</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-red-600">{error.message}</div>
          ) : applications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No admission applications found matching the selected stage filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                    <th className="py-2.5 px-4 font-semibold">Application #</th>
                    <th className="py-2.5 px-3 font-semibold">Applicant</th>
                    <th className="py-2.5 px-3 font-semibold">Target Program</th>
                    <th className="py-2.5 px-3 font-semibold">Stage</th>
                    <th className="py-2.5 px-3 font-semibold">Counselor</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {app.applicationNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{app.applicantName}</div>
                        <div className="text-[11px] text-slate-400">{app.applicantEmail}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <div>{app.course.title}</div>
                        {app.batch && (
                          <div className="text-[11px] text-slate-400">{app.batch.code}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant="secondary"
                          className={
                            app.stage === ApplicationStage.APPROVED
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : app.stage === ApplicationStage.CONVERTED
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : app.stage === ApplicationStage.REJECTED
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {app.stage}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">
                        {app.counselor
                          ? `${app.counselor.firstName} ${app.counselor.lastName}`
                          : "Direct"}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(app.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs border-slate-300">
                            <Link href={`${basePath}/${app.id}`}>Review</Link>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingApp(app)}
                            className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
                            title="Edit Application"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          {app.stage === ApplicationStage.REJECTED ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Restore application ${app.applicationNumber} back to Under Review?`)) {
                                  restoreMutation.mutate({ applicationId: app.id });
                                }
                              }}
                              disabled={restoreMutation.isPending}
                              className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-800"
                              title="Restore Application"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          ) : app.stage !== ApplicationStage.CONVERTED ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const reason = prompt("Enter reason for archiving application:");
                                if (reason !== null) {
                                  archiveMutation.mutate({ applicationId: app.id, reason });
                                }
                              }}
                              disabled={archiveMutation.isPending}
                              className="h-7 w-7 p-0 text-amber-600 hover:text-amber-800"
                              title="Archive Application"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                          {app.stage !== ApplicationStage.CONVERTED && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Permanently delete unconverted application ${app.applicationNumber}? This cannot be undone.`
                                  )
                                ) {
                                  deleteMutation.mutate({ applicationId: app.id });
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              title="Delete Application"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DirectAdmissionDialog
        open={admissionOpen}
        onOpenChange={setAdmissionOpen}
      />

      <EditApplicationDialog
        open={!!editingApp}
        onOpenChange={(open) => !open && setEditingApp(null)}
        application={editingApp}
      />
    </div>
  );
}
