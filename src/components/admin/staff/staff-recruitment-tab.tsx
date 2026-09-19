"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Briefcase,
  PlusCircle,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Star,
  ExternalLink,
  ChevronRight,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPaiseToRupees, formatDate } from "@/lib/utils";

const PIPELINE_STAGES = [
  { key: "APPLIED", label: "Applied", color: "bg-slate-100 text-slate-700" },
  { key: "SCREENING", label: "Screening", color: "bg-blue-50 text-blue-700" },
  { key: "SHORTLISTED", label: "Shortlisted", color: "bg-indigo-50 text-indigo-700" },
  { key: "INTERVIEW_ROUND_1", label: "Interview Round 1", color: "bg-amber-50 text-amber-700" },
  { key: "INTERVIEW_ROUND_2", label: "Interview Round 2", color: "bg-purple-50 text-purple-700" },
  { key: "SELECTED", label: "Selected", color: "bg-teal-50 text-teal-700" },
  { key: "OFFERED", label: "Offered", color: "bg-emerald-50 text-emerald-700" },
  { key: "HIRED", label: "Hired", color: "bg-emerald-600 text-white" },
  { key: "REJECTED", label: "Rejected", color: "bg-red-50 text-red-700" },
];

export function StaffRecruitmentTab() {
  const [activeSubTab, setActiveSubTab] = useState<"openings" | "applicants">("openings");
  const [selectedOpeningId, setSelectedOpeningId] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [showCreateOpeningModal, setShowCreateOpeningModal] = useState(false);
  const [showAddApplicantModal, setShowAddApplicantModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

  const { data: openings, isLoading: loadingOpenings, refetch: refetchOpenings } =
    api.staffErp.listJobOpenings.useQuery();

  const { data: applicants, isLoading: loadingApplicants, refetch: refetchApplicants } =
    api.staffErp.listApplicants.useQuery({
      openingId: selectedOpeningId,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      search: search.trim() || undefined,
    });

  const createOpeningMutation = api.staffErp.createJobOpening.useMutation({
    onSuccess: () => {
      setShowCreateOpeningModal(false);
      refetchOpenings();
    },
  });

  const createApplicantMutation = api.staffErp.createApplicant.useMutation({
    onSuccess: () => {
      setShowAddApplicantModal(false);
      refetchApplicants();
      refetchOpenings();
    },
  });

  const updateStatusMutation = api.staffErp.updateApplicantStatus.useMutation({
    onSuccess: () => {
      setShowStatusModal(false);
      refetchApplicants();
      refetchOpenings();
    },
  });

  const [openingForm, setOpeningForm] = useState({
    title: "",
    department: "TRAINING",
    employmentType: "FULL_TIME",
    experienceMin: 2,
    openPositions: 1,
    minSalary: 3000000,
    maxSalary: 6000000,
    location: "PRAYAGRAJ_CAMPUS",
    description: "",
    requirements: "",
  });

  const [applicantForm, setApplicantForm] = useState({
    openingId: "",
    fullName: "",
    email: "",
    phone: "",
    currentRole: "",
    currentCompany: "",
    experienceYears: 2,
    expectedCtc: 4000000,
    noticePeriodDays: 30,
    resumeUrl: "",
    linkedinUrl: "",
    notes: "",
  });

  const [nextStatus, setNextStatus] = useState("SCREENING");
  const [statusNotes, setStatusNotes] = useState("");
  const [rating, setRating] = useState(4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Recruitment & Applicant Tracking System (ATS)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Manage institutional job requisitions, candidate pipeline, interview scheduling, and hiring decisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAddApplicantModal(true)}
            variant="outline"
            className="text-xs"
          >
            <Users className="w-4 h-4 mr-1.5" /> Add Candidate
          </Button>
          <Button
            onClick={() => setShowCreateOpeningModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Create Requisition
          </Button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab("openings")}
          className={`pb-2.5 px-2 transition ${
            activeSubTab === "openings"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Job Openings ({openings?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveSubTab("applicants")}
          className={`pb-2.5 px-2 transition ${
            activeSubTab === "applicants"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Candidate Pipeline ({applicants?.length ?? 0})
        </button>
      </div>

      {/* VIEW 1: OPENINGS */}
      {activeSubTab === "openings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loadingOpenings ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-500">
              Loading institutional job requisitions...
            </div>
          ) : !openings || openings.length === 0 ? (
            <div className="col-span-full bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No Requisitions Found</p>
              <p className="text-xs text-slate-400 mt-1">
                Post new faculty, counseling, trainer, or administrative roles to start recruiting.
              </p>
              <Button
                onClick={() => setShowCreateOpeningModal(true)}
                variant="outline"
                className="mt-4 text-xs"
              >
                Post Job Opening
              </Button>
            </div>
          ) : (
            openings.map((opening) => (
              <div
                key={opening.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 hover:border-indigo-200 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{opening.title}</h4>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {opening.department} • {opening.location}
                    </span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                    {opening.status}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{opening.description}</p>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Experience</span>
                    <span className="font-semibold text-slate-800">
                      {opening.experienceMin}+ Years
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Open Positions</span>
                    <span className="font-semibold text-slate-800">{opening.openPositions}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Salary Bracket</span>
                    <span className="font-semibold text-emerald-700">
                      {opening.minSalary && opening.maxSalary
                        ? `${formatPaiseToRupees(opening.minSalary)} – ${formatPaiseToRupees(opening.maxSalary)}`
                        : "Competitive"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Applicants</span>
                    <span className="font-bold text-indigo-700 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {opening.totalApplicants}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <Button
                    size="sm"
                    className="w-full text-xs bg-slate-900 text-white hover:bg-slate-800"
                    onClick={() => {
                      setSelectedOpeningId(opening.id);
                      setActiveSubTab("applicants");
                    }}
                  >
                    View Pipeline ({opening.totalApplicants})
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: CANDIDATE PIPELINE */}
      {activeSubTab === "applicants" && (
        <div className="space-y-4">
          {/* Pipeline Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate by name, email, phone, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs"
              />
            </div>

            <select
              value={selectedOpeningId || ""}
              onChange={(e) => setSelectedOpeningId(e.target.value || undefined)}
              className="border rounded-lg px-3 py-2 text-xs bg-white"
            >
              <option value="">All Requisitions</option>
              {openings?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title} ({o.department})
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-xs bg-white"
            >
              <option value="ALL">All Stages</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Candidates Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingApplicants ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading candidate pipeline...</div>
            ) : !applicants || applicants.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No candidates in this pipeline stage yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Target Requisition</th>
                      <th className="p-3">Experience & CTC</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Stage</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.map((cand) => {
                      const stageInfo =
                        PIPELINE_STAGES.find((s) => s.key === cand.status) || PIPELINE_STAGES[0];
                      return (
                        <tr key={cand.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{cand.fullName}</div>
                            {cand.currentRole && (
                              <span className="text-[10px] text-slate-500">
                                {cand.currentRole} {cand.currentCompany ? `at ${cand.currentCompany}` : ""}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800">
                              {cand.opening.title}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {cand.opening.department}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800">
                              {cand.experienceYears} Years Exp
                            </span>
                            {cand.expectedCtc && (
                              <span className="text-[10px] text-emerald-700 block">
                                Exp: {formatPaiseToRupees(cand.expectedCtc)}
                              </span>
                            )}
                          </td>
                          <td className="p-3 space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-600 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{cand.email}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-600 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{cand.phone}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={`${stageInfo.color} text-[10px]`}>
                              {stageInfo.label}
                            </Badge>
                            {cand.interviewDate && (
                              <span className="text-[10px] text-indigo-600 block mt-0.5">
                                Int: {formatDate(cand.interviewDate)}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white"
                              onClick={() => {
                                setSelectedApplicant(cand);
                                setNextStatus(cand.status);
                                setStatusNotes(cand.notes || "");
                                setRating(cand.rating || 4);
                                setShowStatusModal(true);
                              }}
                            >
                              Manage Stage
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Opening Modal */}
      {showCreateOpeningModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">Create Job Requisition</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Job Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Full-Stack Trainer"
                  value={openingForm.title}
                  onChange={(e) => setOpeningForm({ ...openingForm, title: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department *</label>
                  <select
                    value={openingForm.department}
                    onChange={(e) => setOpeningForm({ ...openingForm, department: e.target.value })}
                    className="w-full border rounded-lg p-2 bg-white"
                  >
                    <option value="TRAINING">Training & Academics</option>
                    <option value="HR">Human Resources</option>
                    <option value="COUNSELING">Counseling</option>
                    <option value="TELECALLING">Telecalling</option>
                    <option value="PLACEMENT">Placements</option>
                    <option value="OPERATIONS">Operations</option>
                    <option value="IT">IT & Systems</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min Experience (Years)</label>
                  <input
                    type="number"
                    value={openingForm.experienceMin}
                    onChange={(e) =>
                      setOpeningForm({ ...openingForm, experienceMin: parseInt(e.target.value) || 0 })
                    }
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min Annual CTC (₹)</label>
                  <input
                    type="number"
                    value={openingForm.minSalary / 100}
                    onChange={(e) =>
                      setOpeningForm({
                        ...openingForm,
                        minSalary: (parseInt(e.target.value) || 0) * 100,
                      })
                    }
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Max Annual CTC (₹)</label>
                  <input
                    type="number"
                    value={openingForm.maxSalary / 100}
                    onChange={(e) =>
                      setOpeningForm({
                        ...openingForm,
                        maxSalary: (parseInt(e.target.value) || 0) * 100,
                      })
                    }
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Role Description *</label>
                <textarea
                  rows={3}
                  placeholder="Key responsibilities, lecture topics, mentor expectations..."
                  value={openingForm.description}
                  onChange={(e) => setOpeningForm({ ...openingForm, description: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Key Requirements & Skills</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Next.js, React, Node.js, PostgreSQL, Cloud deployment"
                  value={openingForm.requirements}
                  onChange={(e) => setOpeningForm({ ...openingForm, requirements: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowCreateOpeningModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                disabled={!openingForm.title || !openingForm.description || createOpeningMutation.isPending}
                onClick={() => createOpeningMutation.mutate(openingForm)}
              >
                {createOpeningMutation.isPending ? "Posting..." : "Publish Requisition"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddApplicantModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">Add Candidate to Pipeline</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Requisition *</label>
                <select
                  value={applicantForm.openingId}
                  onChange={(e) => setApplicantForm({ ...applicantForm, openingId: e.target.value })}
                  className="w-full border rounded-lg p-2 bg-white"
                >
                  <option value="">-- Choose Job Opening --</option>
                  {openings?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title} ({o.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="Candidate Name"
                  value={applicantForm.fullName}
                  onChange={(e) => setApplicantForm({ ...applicantForm, fullName: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    placeholder="candidate@email.com"
                    value={applicantForm.email}
                    onChange={(e) => setApplicantForm({ ...applicantForm, email: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone *</label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={applicantForm.phone}
                    onChange={(e) => setApplicantForm({ ...applicantForm, phone: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Current Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Dev"
                    value={applicantForm.currentRole}
                    onChange={(e) => setApplicantForm({ ...applicantForm, currentRole: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Current Company</label>
                  <input
                    type="text"
                    placeholder="Company name"
                    value={applicantForm.currentCompany}
                    onChange={(e) => setApplicantForm({ ...applicantForm, currentCompany: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Exp (Years)</label>
                  <input
                    type="number"
                    value={applicantForm.experienceYears}
                    onChange={(e) =>
                      setApplicantForm({
                        ...applicantForm,
                        experienceYears: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expected CTC (₹)</label>
                  <input
                    type="number"
                    value={(applicantForm.expectedCtc || 0) / 100}
                    onChange={(e) =>
                      setApplicantForm({
                        ...applicantForm,
                        expectedCtc: (parseInt(e.target.value) || 0) * 100,
                      })
                    }
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowAddApplicantModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                disabled={
                  !applicantForm.openingId ||
                  !applicantForm.fullName ||
                  !applicantForm.email ||
                  createApplicantMutation.isPending
                }
                onClick={() => createApplicantMutation.mutate(applicantForm)}
              >
                {createApplicantMutation.isPending ? "Adding..." : "Add to Pipeline"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Status Modal */}
      {showStatusModal && selectedApplicant && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Update Candidate Status — {selectedApplicant.fullName}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pipeline Stage *</label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="w-full border rounded-lg p-2 bg-white"
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assessment Rating (1-5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1 rounded ${
                        rating >= star ? "text-amber-500" : "text-slate-300"
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Interview / Evaluation Notes</label>
                <textarea
                  rows={3}
                  placeholder="Feedback from technical round, communication score, etc."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowStatusModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                disabled={updateStatusMutation.isPending}
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: selectedApplicant.id,
                    status: nextStatus,
                    notes: statusNotes,
                    rating,
                  })
                }
              >
                {updateStatusMutation.isPending ? "Updating..." : "Save Progression"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
