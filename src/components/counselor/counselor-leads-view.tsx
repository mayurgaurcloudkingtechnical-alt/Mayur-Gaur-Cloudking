"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadStatus } from "@prisma/client";
import { Search, Clock, Users, AlertCircle, ChevronLeft, ChevronRight, PlusCircle, LayoutGrid, List } from "lucide-react";
import { CreateLeadDialog } from "./create-lead-dialog";
import { PipelineBoardView } from "./pipeline-board-view";

interface CounselorLeadsViewProps {
  basePath?: string;
  defaultDueToday?: boolean;
}

export function CounselorLeadsView({
  basePath = "/counselor/leads",
  defaultDueToday = false,
}: CounselorLeadsViewProps) {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [dueTodayOnly, setDueTodayOnly] = useState(defaultDueToday);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = api.crm.listLeads.useQuery({
    status: selectedStatus === "ALL" ? undefined : selectedStatus,
    search: search.trim() || undefined,
    dueToday: dueTodayOnly || undefined,
    page,
    limit: 15,
  });

  const leads = data?.leads || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search candidate name, email, or mobile..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Action Buttons & View Mode Toggle */}
            <div className="flex items-center gap-2">
              {/* Due Today Quick Toggle */}
              <Button
                variant={dueTodayOnly ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setDueTodayOnly(!dueTodayOnly);
                  setPage(1);
                }}
                className={`text-xs font-semibold flex items-center gap-1.5 ${
                  dueTodayOnly ? "bg-amber-600 hover:bg-amber-700 text-white" : "border-slate-300"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Calls Due Today</span>
              </Button>

              {/* View Mode Toggle: Table / Kanban */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                    viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                    viewMode === "kanban" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Pipeline</span>
                </button>
              </div>

              {/* Add Lead Action Button */}
              <Button
                type="button"
                size="sm"
                onClick={() => setCreateLeadOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Lead</span>
              </Button>
            </div>
          </div>

          {/* Status Filter Badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={() => {
                setSelectedStatus("ALL");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                selectedStatus === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Inquiries
            </button>
            {Object.values(LeadStatus).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setSelectedStatus(st);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  selectedStatus === st
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

      {viewMode === "kanban" ? (
        <PipelineBoardView />
      ) : (
        /* Leads Table */
        <Card className="border-slate-200 bg-white">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>Candidate Records</span>
              {pagination && (
                <span className="text-xs font-normal text-slate-400">({pagination.total} total)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading prospects...</div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-red-600">{error.message}</div>
            ) : leads.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No prospect records match the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                      <th className="py-2.5 px-4 font-semibold">Candidate</th>
                      <th className="py-2.5 px-3 font-semibold">Contact</th>
                      <th className="py-2.5 px-3 font-semibold">Course Interest</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold">Next Follow-Up</th>
                      <th className="py-2.5 px-3 font-semibold">Counselor</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{lead.fullName}</div>
                          <div className="text-[11px] text-slate-400">
                            {lead.city ? `${lead.city} • ` : ""}
                            Source: {lead.source}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          <div>{lead.phone}</div>
                          <div className="text-[11px] text-slate-400">{lead.email}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {lead.course?.title || <span className="text-slate-400 italic">General</span>}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant="secondary"
                            className={
                              lead.status === LeadStatus.NEW
                                ? "bg-blue-50 text-blue-700 border-blue-200 text-[11px]"
                                : lead.status === LeadStatus.ADMITTED
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]"
                                : lead.status === LeadStatus.INTERESTED
                                ? "bg-purple-50 text-purple-700 border-purple-200 text-[11px]"
                                : "bg-slate-100 text-slate-700 border-slate-200 text-[11px]"
                            }
                          >
                            {lead.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {lead.nextFollowUp ? (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Clock className="h-3 w-3 text-amber-600" />
                              {new Date(lead.nextFollowUp).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">None</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px]">
                          {lead.assignedTo
                            ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                            : "Unassigned"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button asChild size="sm" variant="outline" className="h-7 text-xs border-slate-300">
                            <Link href={`${basePath}/${lead.id}`}>View & Log</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
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
      )}

      {/* Create Lead Modal */}
      <CreateLeadDialog
        open={createLeadOpen}
        onOpenChange={setCreateLeadOpen}
      />
    </div>
  );
}
