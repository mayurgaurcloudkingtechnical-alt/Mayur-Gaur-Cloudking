"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { ServiceEnquiryStatus, UserRoleCode } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Filter,
  Eye,
  Edit,
  UserPlus,
  Loader2,
  Calendar,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  X,
  FileText,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ServiceEnquiriesTableProps {
  userRole?: UserRoleCode;
  counselorOnly?: boolean;
}

const STATUS_LIST: ServiceEnquiryStatus[] = [
  ServiceEnquiryStatus.NEW,
  ServiceEnquiryStatus.CONTACTED,
  ServiceEnquiryStatus.REQUIREMENT_DISCUSSED,
  ServiceEnquiryStatus.QUOTE_REQUESTED,
  ServiceEnquiryStatus.QUOTATION_SENT,
  ServiceEnquiryStatus.FOLLOW_UP,
  ServiceEnquiryStatus.CONVERTED,
  ServiceEnquiryStatus.CLOSED,
  ServiceEnquiryStatus.LOST,
];

function getStatusBadge(status: ServiceEnquiryStatus) {
  switch (status) {
    case ServiceEnquiryStatus.NEW:
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px]">NEW</Badge>;
    case ServiceEnquiryStatus.CONTACTED:
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">CONTACTED</Badge>;
    case ServiceEnquiryStatus.REQUIREMENT_DISCUSSED:
      return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 text-[10px]">DISCUSSED</Badge>;
    case ServiceEnquiryStatus.QUOTE_REQUESTED:
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px]">QUOTE REQ</Badge>;
    case ServiceEnquiryStatus.QUOTATION_SENT:
      return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px]">QUOTE SENT</Badge>;
    case ServiceEnquiryStatus.FOLLOW_UP:
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-[10px]">FOLLOW UP</Badge>;
    case ServiceEnquiryStatus.CONVERTED:
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">CONVERTED</Badge>;
    case ServiceEnquiryStatus.CLOSED:
      return <Badge className="bg-slate-100 text-slate-800 border-slate-200 text-[10px]">CLOSED</Badge>;
    case ServiceEnquiryStatus.LOST:
      return <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]">LOST</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

export function ServiceEnquiriesTable({ userRole, counselorOnly }: ServiceEnquiriesTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceEnquiryStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  // Selected enquiry for inspection / editing
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ServiceEnquiryStatus | "">("");
  const [notes, setNotes] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");

  // Counselor assignment modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCounselorId, setSelectedCounselorId] = useState("");

  const utils = api.useUtils();

  const { data, isLoading } = api.services.listEnquiries.useQuery({
    search: search.trim() || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page,
    limit: 20,
  });

  const { data: enquiryDetails, isLoading: loadingDetails } = api.services.getEnquiryDetails.useQuery(
    { enquiryId: selectedEnquiryId! },
    { enabled: !!selectedEnquiryId }
  );

  const { data: counselorsList } = api.services.listCounselors.useQuery(undefined, {
    enabled: !counselorOnly,
  });

  const updateMutation = api.services.updateEnquiryStatus.useMutation({
    onSuccess: () => {
      utils.services.listEnquiries.invalidate();
      utils.services.getMetrics.invalidate();
      if (selectedEnquiryId) {
        utils.services.getEnquiryDetails.invalidate({ enquiryId: selectedEnquiryId });
      }
      setIsUpdateModalOpen(false);
    },
    onError: (err) => {
      alert("Failed to update status: " + err.message);
    },
  });

  const assignMutation = api.services.assignEnquiry.useMutation({
    onSuccess: () => {
      utils.services.listEnquiries.invalidate();
      if (selectedEnquiryId) {
        utils.services.getEnquiryDetails.invalidate({ enquiryId: selectedEnquiryId });
      }
      setIsAssignModalOpen(false);
    },
    onError: (err) => {
      alert("Failed to assign counselor: " + err.message);
    },
  });

  const handleOpenUpdate = (enquiry: any) => {
    setSelectedEnquiryId(enquiry.id);
    setNewStatus(enquiry.status);
    setNotes(enquiry.notes || "");
    setNextFollowUp(
      enquiry.nextFollowUp ? new Date(enquiry.nextFollowUp).toISOString().slice(0, 10) : ""
    );
    setEstimatedBudget(enquiry.estimatedBudget ? String(enquiry.estimatedBudget) : "");
    setIsUpdateModalOpen(true);
  };

  const handleOpenAssign = (enquiry: any) => {
    setSelectedEnquiryId(enquiry.id);
    setSelectedCounselorId(enquiry.assignedCounselorId || "");
    setIsAssignModalOpen(true);
  };

  const handleSaveUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiryId) return;

    updateMutation.mutate({
      enquiryId: selectedEnquiryId,
      status: (newStatus as ServiceEnquiryStatus) || undefined,
      notes: notes.trim() || undefined,
      nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
      estimatedBudget: estimatedBudget ? Number(estimatedBudget) : undefined,
    });
  };

  const handleSaveAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiryId || !selectedCounselorId) return;

    assignMutation.mutate({
      enquiryId: selectedEnquiryId,
      counselorId: selectedCounselorId,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by client name, company, mobile, email, or ref number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9 text-xs border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={statusFilter === "ALL" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("ALL");
              setPage(1);
            }}
            className={`text-xs h-8 px-2.5 rounded-lg ${
              statusFilter === "ALL"
                ? "bg-slate-900 text-white font-bold"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All
          </Button>
          {STATUS_LIST.map((st) => (
            <Button
              key={st}
              size="sm"
              variant={statusFilter === st ? "default" : "outline"}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`text-[11px] h-8 px-2 rounded-lg ${
                statusFilter === st
                  ? "bg-slate-900 text-white font-bold"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            <span>Loading service enquiries...</span>
          </div>
        ) : !data?.items || data.items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">No service enquiries found.</p>
            <p className="text-slate-400">
              {search || statusFilter !== "ALL"
                ? "Try clearing your search or status filters."
                : "Inbound quote requests from the public /services page will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <TableHead className="py-2.5 px-4">Ref Number</TableHead>
                  <TableHead className="py-2.5 px-4">Client / Company</TableHead>
                  <TableHead className="py-2.5 px-4">Contact</TableHead>
                  <TableHead className="py-2.5 px-4">Service Domain</TableHead>
                  <TableHead className="py-2.5 px-4">Package / Scope</TableHead>
                  <TableHead className="py-2.5 px-4">Status</TableHead>
                  {!counselorOnly && <TableHead className="py-2.5 px-4">Counselor</TableHead>}
                  <TableHead className="py-2.5 px-4">Follow-up</TableHead>
                  <TableHead className="py-2.5 px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 text-xs">
                {data.items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell className="py-3 px-4 font-mono font-bold text-slate-800">
                      {item.enquiryNumber}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {item.companyName || "Individual Client"} {item.city ? `• ${item.city}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="font-mono text-slate-700">{item.phone}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{item.email}</div>
                    </TableCell>
                    <TableCell className="py-3 px-4 font-medium text-slate-700">
                      {item.category?.name || item.serviceCategoryCode || "General Service"}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-slate-600">
                      {item.packageName || "Custom Scope"}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {getStatusBadge(item.status)}
                    </TableCell>
                    {!counselorOnly && (
                      <TableCell className="py-3 px-4 text-slate-600 text-[11px]">
                        {item.assignedCounselor ? (
                          <span className="font-medium text-slate-800">
                            {item.assignedCounselor.firstName} {item.assignedCounselor.lastName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="py-3 px-4 text-slate-600 text-[11px]">
                      {item.nextFollowUp ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(item.nextFollowUp)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Manage Status & Notes */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenUpdate(item)}
                          className="h-7 px-2 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 font-medium inline-flex items-center gap-1"
                          title="Update status, notes, or schedule follow-up"
                        >
                          <Edit className="h-3 w-3 text-slate-500" />
                          <span>Action</span>
                        </Button>

                        {/* Assign Counselor (Super Admin, Admin, Director only) */}
                        {!counselorOnly && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAssign(item)}
                            className="h-7 px-2 text-xs border-slate-300 text-blue-700 hover:bg-blue-50 font-medium inline-flex items-center gap-1"
                            title="Assign to staff counselor"
                          >
                            <UserPlus className="h-3 w-3 text-blue-600" />
                            <span className="hidden sm:inline">Assign</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Bar */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing Page {data.page} of {data.totalPages} ({data.total} total enquiries)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="h-7 text-xs"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={data.page >= data.totalPages}
                className="h-7 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* UPDATE STATUS & NOTES MODAL */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Manage Service Enquiry — {enquiryDetails?.enquiryNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Client: {enquiryDetails?.fullName} {enquiryDetails?.companyName ? `(${enquiryDetails.companyName})` : ""}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading details...</div>
          ) : (
            <form onSubmit={handleSaveUpdate} className="space-y-4 pt-1">
              {/* Client Requirements Overview */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Service:</span>
                  <span>{enquiryDetails?.category?.name || enquiryDetails?.serviceCategoryCode}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Package:</span>
                  <span>{enquiryDetails?.packageName || "Custom"}</span>
                </div>
                {enquiryDetails?.requirement && (
                  <div className="text-slate-700 pt-1 border-t border-slate-200/80">
                    <span className="font-semibold block text-[11px] text-slate-500">Requirement:</span>
                    <p className="mt-0.5 leading-relaxed">{enquiryDetails.requirement}</p>
                  </div>
                )}
                {enquiryDetails?.message && (
                  <div className="text-slate-700 pt-1 border-t border-slate-200/80">
                    <span className="font-semibold block text-[11px] text-slate-500">Message / Scope:</span>
                    <p className="mt-0.5 leading-relaxed">{enquiryDetails.message}</p>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Enquiry Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ServiceEnquiryStatus)}
                  className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {STATUS_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule Follow-up Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Next Follow-up Date</label>
                <Input
                  type="date"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              {/* Counselor / Discussion Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Discussion Notes / Progress</label>
                <textarea
                  rows={3}
                  placeholder="Record summary of client call, requirement details, quote discussed..."
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Activity Timeline Preview */}
              {enquiryDetails?.activities && enquiryDetails.activities.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Activity History</span>
                  <div className="space-y-1">
                    {enquiryDetails.activities.slice(0, 4).map((act: any) => (
                      <div key={act.id} className="text-[11px] text-slate-500 p-2 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                        <span>{act.details || act.action}</span>
                        <span className="text-slate-400 shrink-0 font-mono text-[10px] ml-2">
                          {formatDate(act.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-4"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Updates"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ASSIGN COUNSELOR MODAL */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Assign Service Enquiry
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign this corporate client inquiry to a staff counselor or sales lead.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAssign} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Select Counselor / Assignee</label>
              <select
                value={selectedCounselorId}
                onChange={(e) => setSelectedCounselorId(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="">-- Choose Staff Member --</option>
                {counselorsList?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.roleCode} • {c.email})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={assignMutation.isPending || !selectedCounselorId}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-8 px-4"
              >
                {assignMutation.isPending ? "Assigning..." : "Assign Counselor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
