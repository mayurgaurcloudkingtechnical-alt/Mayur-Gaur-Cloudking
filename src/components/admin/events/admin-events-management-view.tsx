"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit,
  Copy,
  Archive,
  Eye,
  FileSpreadsheet,
  Search,
  Filter,
  IndianRupee,
  Users,
  ShieldCheck,
  Award,
  Loader2,
  ExternalLink,
  Sparkles,
  BarChart3,
  Layers,
} from "lucide-react";

export function AdminEventsManagementView() {
  const [activeTab, setActiveTab] = useState<"EVENTS" | "REGISTRATIONS" | "ANALYTICS">("EVENTS");
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState<number | "ALL">("ALL");

  // Dialog State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    programType: "SHORT_TERM_COURSE",
    category: "Programming",
    summary: "",
    description: "",
    bannerUrl: "",
    posterUrl: "",
    videoUrl: "",
    feeInr: 4999,
    originalFeeInr: 9999,
    duration: "30–45 Days",
    mode: "HYBRID",
    venue: "SoftLab Global Tech Center, Civil Lines, Prayagraj / Online Hybrid",
    seatCapacity: 100,
    status: "UPCOMING",
    isFeatured: false,
    sortOrder: 0,
    year: 2026,
    month: 11,
    eligibility: "Open to all learners and graduates",
    certificateTitle: "Course Completion Certificate",
    certificateType: "COMPLETION",
  });

  const utils = api.useUtils();

  // Queries
  const { data: events = [], isLoading: isLoadingEvents } = api.events.listAdminEvents.useQuery({
    search,
    programType: programFilter,
    status: statusFilter,
    year: yearFilter === "ALL" ? undefined : yearFilter,
  });

  const { data: analytics } = api.events.getEventAnalytics.useQuery();

  const { data: registrationsData, isLoading: isLoadingRegs } = api.events.listRegistrations.useQuery({
    search,
    page: 1,
    limit: 100,
  });

  // Mutations
  const createMutation = api.events.createEvent.useMutation({
    onSuccess: () => {
      utils.events.listAdminEvents.invalidate();
      utils.events.getEventAnalytics.invalidate();
      setIsEditorOpen(false);
      resetForm();
    },
  });

  const updateMutation = api.events.updateEvent.useMutation({
    onSuccess: () => {
      utils.events.listAdminEvents.invalidate();
      utils.events.getEventAnalytics.invalidate();
      setIsEditorOpen(false);
      resetForm();
    },
  });

  const duplicateMutation = api.events.duplicateEvent.useMutation({
    onSuccess: () => {
      utils.events.listAdminEvents.invalidate();
      utils.events.getEventAnalytics.invalidate();
    },
  });

  const archiveMutation = api.events.deleteEvent.useMutation({
    onSuccess: () => {
      utils.events.listAdminEvents.invalidate();
      utils.events.getEventAnalytics.invalidate();
    },
  });

  const updateRegMutation = api.events.updateRegistration.useMutation({
    onSuccess: () => {
      utils.events.listRegistrations.invalidate();
      utils.events.getEventAnalytics.invalidate();
    },
  });

  const resetForm = () => {
    setEditingEventId(null);
    setFormData({
      title: "",
      slug: "",
      programType: "SHORT_TERM_COURSE",
      category: "Programming",
      summary: "",
      description: "",
      bannerUrl: "",
      posterUrl: "",
      videoUrl: "",
      feeInr: 4999,
      originalFeeInr: 9999,
      duration: "30–45 Days",
      mode: "HYBRID",
      venue: "SoftLab Global Tech Center, Civil Lines, Prayagraj / Online Hybrid",
      seatCapacity: 100,
      status: "UPCOMING",
      isFeatured: false,
      sortOrder: 0,
      year: 2026,
      month: 11,
      eligibility: "Open to all learners and graduates",
      certificateTitle: "Course Completion Certificate",
      certificateType: "COMPLETION",
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (evt: any) => {
    setEditingEventId(evt.id);
    setFormData({
      title: evt.title,
      slug: evt.slug,
      programType: evt.programType,
      category: evt.category,
      summary: evt.summary,
      description: evt.description,
      bannerUrl: evt.bannerUrl || "",
      posterUrl: evt.posterUrl || "",
      videoUrl: evt.videoUrl || "",
      feeInr: Math.round(evt.fee / 100),
      originalFeeInr: evt.originalFee ? Math.round(evt.originalFee / 100) : 0,
      duration: evt.duration,
      mode: evt.mode,
      venue: evt.venue,
      seatCapacity: evt.seatCapacity,
      status: evt.status,
      isFeatured: evt.isFeatured,
      sortOrder: evt.sortOrder,
      year: evt.year,
      month: evt.month,
      eligibility: evt.eligibility || "",
      certificateTitle: evt.certificateTitle || "",
      certificateType: evt.certificateType || "COMPLETION",
    });
    setIsEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      programType: formData.programType,
      category: formData.category,
      summary: formData.summary,
      description: formData.description,
      bannerUrl: formData.bannerUrl || null,
      posterUrl: formData.posterUrl || null,
      videoUrl: formData.videoUrl || null,
      fee: Math.round(formData.feeInr * 100),
      originalFee: formData.originalFeeInr ? Math.round(formData.originalFeeInr * 100) : null,
      duration: formData.duration,
      mode: formData.mode,
      venue: formData.venue,
      seatCapacity: formData.seatCapacity,
      status: formData.status,
      isFeatured: formData.isFeatured,
      sortOrder: formData.sortOrder,
      year: formData.year,
      month: formData.month,
      eligibility: formData.eligibility || null,
      certificateTitle: formData.certificateTitle || null,
      certificateType: formData.certificateType,
    };

    if (editingEventId) {
      await updateMutation.mutateAsync({
        id: editingEventId,
        ...payload,
      });
    } else {
      await createMutation.mutateAsync(payload as any);
    }
  };

  const handleExportCSV = () => {
    if (!registrationsData?.items || registrationsData.items.length === 0) return;
    const headers = ["Reg Number", "Event", "Type", "Student Name", "Phone", "Email", "City", "Amount (INR)", "Payment Status", "Attendance", "Date"];
    const rows = registrationsData.items.map((r: any) => [
      r.registrationNumber,
      `"${r.event?.title || "N/A"}"`,
      r.event?.programType || "N/A",
      `"${r.fullName}"`,
      r.phone,
      r.email,
      `"${r.city || ""}"`,
      Math.round(r.amount / 100),
      r.paymentStatus,
      r.attendanceStatus,
      new Date(r.createdAt).toLocaleDateString("en-IN"),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SoftLab-Event-Registrations-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. TOP METRICS STRIP                                                 */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Programs</div>
          <div className="text-2xl font-black text-white">{analytics?.totalEvents ?? events.length}</div>
          <div className="text-[11px] text-emerald-400 font-medium">
            {analytics?.upcomingEvents ?? 0} Upcoming / Active
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Registrations</div>
          <div className="text-2xl font-black text-cyan-400">{analytics?.totalRegistrations ?? 0}</div>
          <div className="text-[11px] text-slate-400">
            {analytics?.paidCount ?? 0} Confirmed & Paid
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Collections</div>
          <div className="text-2xl font-black text-emerald-400">
            ₹{(analytics?.totalRevenueInr ?? 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-500 font-medium">Reconciled via Razorpay</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Pending Collections</div>
          <div className="text-2xl font-black text-amber-400">
            ₹{(analytics?.pendingRevenueInr ?? 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400">
            {analytics?.pendingCount ?? 0} Pending Follow-ups
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. SUB-NAVIGATION TABS & ACTION BUTTONS                              */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("EVENTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "EVENTS"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Programs & Events Catalog ({events.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("REGISTRATIONS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "REGISTRATIONS"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Registrations & Attendance ({registrationsData?.total ?? 0})
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === "REGISTRATIONS" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs h-9 px-3 font-semibold"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
              <span>Export CSV</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-4 shadow-lg shadow-emerald-950/60"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Create New Program / Event</span>
          </Button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: EVENTS CATALOG LIST & MANAGEMENT                             */}
      {/* ==================================================================== */}
      {activeTab === "EVENTS" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events by title or slug..."
                className="pl-9 h-9 bg-slate-900 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full h-9 bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 rounded-lg"
              >
                <option value="ALL">All Program Types</option>
                <option value="SHORT_TERM_COURSE">Short-Term Courses</option>
                <option value="WORKSHOP">Workshops</option>
                <option value="WINTER_INTERNSHIP">Winter Internship</option>
                <option value="SUMMER_INTERNSHIP">Summer Internship</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 rounded-lg"
              >
                <option value="ALL">All Statuses</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="REGISTRATION_OPEN">Registration Open</option>
                <option value="DRAFT">Draft</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
                className="w-full h-9 bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 rounded-lg"
              >
                <option value="ALL">All Years</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>

          {/* Events Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Program Details</th>
                    <th className="py-3 px-3">Type & Category</th>
                    <th className="py-3 px-3">Approved Fee</th>
                    <th className="py-3 px-3">Duration & Mode</th>
                    <th className="py-3 px-3">Seats</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        No events found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    events.map((evt: any) => {
                      const feeInr = Math.round(evt.fee / 100);
                      return (
                        <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {evt.posterUrl || evt.bannerUrl ? (
                                <div className="h-10 w-16 relative rounded overflow-hidden shrink-0 bg-slate-950 border border-slate-800">
                                  <Image
                                    src={evt.posterUrl || evt.bannerUrl}
                                    alt={evt.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : null}
                              <div>
                                <div className="font-bold text-white hover:text-emerald-400">
                                  <Link href={`/events/${evt.slug}`} target="_blank">
                                    {evt.title}
                                  </Link>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  slug: /{evt.slug}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-medium text-slate-200">
                              {evt.programType.replace(/_/g, " ")}
                            </div>
                            <div className="text-[11px] text-slate-400">{evt.category}</div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-black text-emerald-400">
                              ₹{feeInr.toLocaleString("en-IN")}
                            </div>
                            {evt.originalFee && (
                              <div className="text-[11px] text-slate-500 line-through">
                                ₹{(evt.originalFee / 100).toLocaleString("en-IN")}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            <div>{evt.duration}</div>
                            <div className="text-[11px] text-cyan-400">{evt.mode}</div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-slate-200">
                              {evt.registeredCount} / {evt.seatCapacity}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {evt.seatCapacity - evt.registeredCount} left
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <Badge
                              className={`text-[10px] font-bold ${
                                evt.status === "REGISTRATION_OPEN"
                                  ? "bg-emerald-500 text-slate-950"
                                  : evt.status === "DRAFT"
                                  ? "bg-amber-500 text-slate-950"
                                  : evt.status === "COMPLETED"
                                  ? "bg-slate-700 text-slate-300"
                                  : "bg-cyan-500 text-slate-950"
                              }`}
                            >
                              {evt.status.replace(/_/g, " ")}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                title="View Public Page"
                              >
                                <Link href={`/events/${evt.slug}`} target="_blank">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEdit(evt)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-400"
                                title="Edit Event"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => duplicateMutation.mutate({ id: evt.id })}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-cyan-400"
                                title="Duplicate as Draft"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => archiveMutation.mutate({ id: evt.id })}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
                                title="Archive / Delete"
                              >
                                <Archive className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: REGISTRATIONS & ATTENDANCE TABLE                              */}
      {/* ==================================================================== */}
      {activeTab === "REGISTRATIONS" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Reg Number</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Contact Details</th>
                    <th className="py-3 px-3">Enrolled Event</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Payment Status</th>
                    <th className="py-3 px-3">Attendance</th>
                    <th className="py-3 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {registrationsData?.items?.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No registrations recorded yet.
                      </td>
                    </tr>
                  ) : (
                    registrationsData?.items?.map((reg: any) => (
                      <tr key={reg.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {reg.registrationNumber}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{reg.fullName}</div>
                          <div className="text-[11px] text-slate-400">{reg.city || "Not provided"}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div>{reg.phone}</div>
                          <div className="text-[11px] text-slate-400">{reg.email}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-200 line-clamp-1">
                            {reg.event?.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {reg.event?.programType}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-semibold text-emerald-400">
                          ₹{Math.round(reg.amount / 100).toLocaleString("en-IN")}
                        </td>

                        <td className="py-3 px-3">
                          <Badge
                            className={`text-[10px] font-bold ${
                              reg.paymentStatus === "PAID"
                                ? "bg-emerald-500 text-slate-950"
                                : reg.paymentStatus === "FAILED"
                                ? "bg-red-500 text-white"
                                : "bg-amber-500 text-slate-950"
                            }`}
                          >
                            {reg.paymentStatus}
                          </Badge>
                        </td>

                        <td className="py-3 px-3">
                          <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-700">
                            {reg.attendanceStatus}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {reg.paymentStatus !== "PAID" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateRegMutation.mutate({
                                    id: reg.id,
                                    paymentStatus: "PAID",
                                    paymentMethod: "OFFLINE_CASH",
                                  })
                                }
                                className="h-7 text-[10px] border-emerald-500/50 text-emerald-400"
                              >
                                Mark Paid
                              </Button>
                            )}

                            {reg.attendanceStatus !== "ATTENDED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateRegMutation.mutate({
                                    id: reg.id,
                                    attendanceStatus: "ATTENDED",
                                  })
                                }
                                className="h-7 text-[10px] border-cyan-500/50 text-cyan-400"
                              >
                                Mark Present
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. EVENT CREATION / EDITING MODAL DIALOG                             */}
      {/* ==================================================================== */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100 p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {editingEventId ? "Edit Event / Program" : "Create New Event / Program"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Configure curriculum, dates, fees, and publishing status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-medium">Event Title *</Label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Winter Internship 2026"
                  className="h-9 bg-slate-950 border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-medium">URL Slug *</Label>
                <Input
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. winter-internship-2026"
                  className="h-9 bg-slate-950 border-slate-700 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-medium">Program Type</Label>
                <select
                  value={formData.programType}
                  onChange={(e) => setFormData({ ...formData, programType: e.target.value })}
                  className="w-full h-9 bg-slate-950 border border-slate-700 text-xs text-white px-2.5 rounded-md"
                >
                  <option value="SHORT_TERM_COURSE">Short-Term Course</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="WINTER_INTERNSHIP">Winter Internship</option>
                  <option value="SUMMER_INTERNSHIP">Summer Internship</option>
                  <option value="BOOTCAMP">Bootcamp</option>
                  <option value="SEMINAR">Seminar</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-medium">Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Programming, AI"
                  className="h-9 bg-slate-950 border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-medium">Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-9 bg-slate-950 border border-slate-700 text-xs text-white px-2.5 rounded-md"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="REGISTRATION_OPEN">Registration Open</option>
                  <option value="REGISTRATION_CLOSED">Registration Closed</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-medium">Fee in ₹ (INR)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.feeInr}
                  onChange={(e) => setFormData({ ...formData, feeInr: parseInt(e.target.value) || 0 })}
                  className="h-9 bg-slate-950 border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-medium">Original Fee (Strike)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.originalFeeInr}
                  onChange={(e) => setFormData({ ...formData, originalFeeInr: parseInt(e.target.value) || 0 })}
                  className="h-9 bg-slate-950 border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-medium">Seat Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.seatCapacity}
                  onChange={(e) => setFormData({ ...formData, seatCapacity: parseInt(e.target.value) || 100 })}
                  className="h-9 bg-slate-950 border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-medium">Duration</Label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 1 Month / 30–45 Days"
                  className="h-9 bg-slate-950 border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-medium">Delivery Mode</Label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="w-full h-9 bg-slate-950 border border-slate-700 text-xs text-white px-2.5 rounded-md"
                >
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline / Campus</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-medium">Year & Month</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2026 })}
                    className="h-9 bg-slate-950 border-slate-700 text-xs text-white"
                  />
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) || 11 })}
                    className="h-9 bg-slate-950 border-slate-700 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300 font-medium">Banner Image URL</Label>
              <Input
                value={formData.bannerUrl}
                onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                placeholder="/images/events/..."
                className="h-9 bg-slate-950 border-slate-700 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300 font-medium">Short Summary</Label>
              <Input
                required
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Brief 1-2 sentence highlight for event cards"
                className="h-9 bg-slate-950 border-slate-700 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300 font-medium">Full Description</Label>
              <Textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Comprehensive overview of topics, hands-on labs, and objectives"
                className="bg-slate-950 border-slate-700 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditorOpen(false)}
                className="border-slate-700 text-slate-300 h-9 text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 text-xs px-5"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingEventId ? "Update Program" : "Create Program"}</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
