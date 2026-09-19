"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Building2,
  Briefcase,
  Users,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Filter,
  Eye,
  Copy,
  Archive,
  Check,
  X,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  FileText,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { JobDriveStatus, JobType, PlacementApplicationStatus, InterviewRoundType } from "@prisma/client";

export function AdminPlacementsView() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "drives" | "crm" | "talentPool" | "pipeline" | "offers" | "reports"
  >("overview");

  const [searchDrive, setSearchDrive] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobDriveStatus | "ALL">("ALL");
  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);

  // Modals
  const [showNewDriveModal, setShowNewDriveModal] = useState(false);
  const [showNewPartnerModal, setShowNewPartnerModal] = useState(false);
  const [showNewRecruiterModal, setShowNewRecruiterModal] = useState(false);
  const [showNewFollowUpModal, setShowNewFollowUpModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showJoiningModal, setShowJoiningModal] = useState(false);

  // Selected item for actions
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  // Queries
  const { data: metrics, refetch: refetchMetrics } = api.placement.getPlacementDashboardMetrics.useQuery();
  const { data: drives, refetch: refetchDrives } = api.placement.listAdminDrives.useQuery(
    statusFilter === "ALL" ? undefined : { status: statusFilter }
  );
  const { data: partners, refetch: refetchPartners } = api.placement.listPartners.useQuery();
  const { data: talentPool, refetch: refetchTalentPool } = api.placement.listTalentPool.useQuery();
  const { data: recruiters, refetch: refetchRecruiters } = api.placement.listRecruiterContacts.useQuery();
  const { data: followUps, refetch: refetchFollowUps } = api.placement.listRecruiterFollowUps.useQuery();
  const { data: offersAndJoinings, refetch: refetchOffers } = api.placement.listOffersAndJoinings.useQuery();
  const { data: driveApplications, refetch: refetchApplications } = api.placement.listDriveApplications.useQuery(
    { jobDriveId: selectedDriveId || "" },
    { enabled: !!selectedDriveId }
  );

  // Dynamic lists from DB
  const { data: coursesData } = api.course.list.useQuery({ page: 1, pageSize: 50 });
  const { data: batchesData } = api.batch.list.useQuery({ page: 1, pageSize: 50 });
  const courses = coursesData?.courses || [];
  const batches = batchesData?.batches || [];

  // Mutations
  const createDriveMutation = api.placement.createJobDrive.useMutation({
    onSuccess: () => {
      setShowNewDriveModal(false);
      refetchDrives();
      refetchMetrics();
    },
  });

  const duplicateDriveMutation = api.placement.duplicateJobDrive.useMutation({
    onSuccess: () => {
      refetchDrives();
      refetchMetrics();
    },
  });

  const activateDriveMutation = api.placement.activateJobDrive.useMutation({
    onSuccess: () => {
      refetchDrives();
      refetchMetrics();
    },
  });

  const closeDriveMutation = api.placement.closeJobDrive.useMutation({
    onSuccess: () => {
      refetchDrives();
      refetchMetrics();
    },
  });

  const archiveDriveMutation = api.placement.archiveJobDrive.useMutation({
    onSuccess: () => {
      refetchDrives();
      refetchMetrics();
    },
  });

  const createPartnerMutation = api.placement.createPartner.useMutation({
    onSuccess: () => {
      setShowNewPartnerModal(false);
      refetchPartners();
      refetchMetrics();
    },
  });

  const createRecruiterMutation = api.placement.createRecruiterContact.useMutation({
    onSuccess: () => {
      setShowNewRecruiterModal(false);
      refetchRecruiters();
    },
  });

  const createFollowUpMutation = api.placement.createRecruiterFollowUp.useMutation({
    onSuccess: () => {
      setShowNewFollowUpModal(false);
      refetchFollowUps();
    },
  });

  const updateAppStatusMutation = api.placement.updateApplicationStatus.useMutation({
    onSuccess: () => {
      refetchApplications();
      refetchMetrics();
    },
  });

  const scheduleInterviewMutation = api.placement.scheduleInterviewRound.useMutation({
    onSuccess: () => {
      setShowInterviewModal(false);
      refetchApplications();
      refetchMetrics();
    },
  });

  const createOfferMutation = api.placement.createPlacementOffer.useMutation({
    onSuccess: () => {
      setShowOfferModal(false);
      refetchOffers();
      refetchApplications();
      refetchMetrics();
    },
  });

  const createJoiningMutation = api.placement.createPlacementJoining.useMutation({
    onSuccess: () => {
      setShowJoiningModal(false);
      refetchOffers();
      refetchApplications();
      refetchTalentPool();
      refetchMetrics();
    },
  });

  const updateStatusOverrideMutation = api.placement.updateStudentPlacementStatus.useMutation({
    onSuccess: () => {
      refetchTalentPool();
      refetchMetrics();
    },
  });

  // State forms
  const [driveForm, setDriveForm] = useState({
    companyId: "",
    title: "",
    department: "",
    jobType: JobType.FULL_TIME,
    workMode: "On-site",
    description: "",
    responsibilities: "",
    requirements: "",
    salaryPackage: "",
    location: "Prayagraj / Delhi NCR",
    openingsCount: 5,
    minPassingPercentage: 60,
    minAttendancePercentage: 75,
    targetCourseId: "",
    eligibleBatchId: "",
    skills: "React, Node.js, SQL",
  });

  const [partnerForm, setPartnerForm] = useState({
    name: "",
    industry: "IT & Software Services",
    website: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    location: "Noida, UP",
  });

  const [recruiterForm, setRecruiterForm] = useState({
    companyId: "",
    name: "",
    designation: "HR Manager",
    email: "",
    phone: "",
    linkedinUrl: "",
    location: "",
    notes: "",
  });

  const [followUpForm, setFollowUpForm] = useState({
    companyId: "",
    recruiterId: "",
    type: "CALL",
    notes: "",
    nextFollowUpDate: "",
  });

  const [interviewForm, setInterviewForm] = useState({
    roundNumber: 1,
    roundType: InterviewRoundType.TECHNICAL,
    scheduledAt: "",
    meetingLink: "",
    feedback: "",
  });

  const [offerForm, setOfferForm] = useState({
    companyName: "",
    position: "",
    ctc: "4.5 LPA",
    location: "",
    joiningDate: "",
    offerLetterUrl: "",
  });

  const [joiningForm, setJoiningForm] = useState({
    companyName: "",
    position: "",
    joinedDate: "",
    employeeId: "",
    workEmail: "",
    workPhone: "",
    joiningProofUrl: "",
  });

  // Export CSV Report
  const exportPlacementCSV = () => {
    if (!talentPool || talentPool.length === 0) {
      alert("No talent pool data to export.");
      return;
    }

    const headers = [
      "Student ID",
      "Full Name",
      "Email",
      "Phone",
      "Batch",
      "Courses",
      "Attendance %",
      "Exam Pass %",
      "Highest Score",
      "Placement Status",
      "Placed Company",
      "Placed Package",
    ];

    const rows = talentPool.map((s) => [
      `"${s.enrollmentNo}"`,
      `"${s.fullName}"`,
      `"${s.email}"`,
      `"${s.phone || ""}"`,
      `"${s.batchName}"`,
      `"${s.courses.join(", ")}"`,
      s.attendancePercentage,
      s.examPassRate,
      s.highestExamScore,
      `"${s.placementStatus}"`,
      `"${s.placedCompany || ""}"`,
      `"${s.placedPackage || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SoftLab_Placement_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDrives = (drives || []).filter(
    (d) =>
      d.title.toLowerCase().includes(searchDrive.toLowerCase()) ||
      d.company.name.toLowerCase().includes(searchDrive.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Placement Management & Recruiter CRM</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Autonomous Institutional Suite
            </span>
          </div>
          <p className="text-sm text-slate-600">
            End-to-end placement engine: eligibility screening, job drives, recruiter CRM, Kanban pipeline, offers & joinings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportPlacementCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV Report
          </button>
          <button
            onClick={() => setShowNewDriveModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Create Opening / Drive
          </button>
        </div>
      </div>

      {/* KPI Command Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Placement Rate</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics?.placementRate ?? 0}%</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {metrics?.totalPlaced ?? 0} placed / {metrics?.registeredTalentPool ?? 0} pool
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Highest & Avg Package</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{metrics?.highestCTC ?? "₹6.5 LPA"}</p>
            <p className="text-xs text-slate-500 mt-0.5">Avg: {metrics?.avgCTC ?? "₹4.2 LPA"}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Job Drives</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{metrics?.activeDrives ?? 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">{metrics?.totalDrives ?? 0} total drives launched</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Corporate Partners</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{partners?.length ?? 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">{recruiters?.length ?? 0} verified recruiters</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex flex-wrap gap-4 text-sm font-medium">
        {[
          { id: "overview", label: "Analytics Overview" },
          { id: "drives", label: `Job Drives (${drives?.length ?? 0})` },
          { id: "crm", label: `Recruiter CRM (${partners?.length ?? 0})` },
          { id: "talentPool", label: `Talent Pool (${talentPool?.length ?? 0})` },
          { id: "pipeline", label: "Application Pipeline" },
          { id: "offers", label: `Offers & Joinings (${offersAndJoinings?.offers.length ?? 0})` },
          { id: "reports", label: "Placement Reports" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 transition flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Funnel breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Placement Pipeline Funnel</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs uppercase font-semibold text-slate-500">Applications</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{metrics?.totalApplications ?? 0}</p>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <p className="text-xs uppercase font-semibold text-blue-700">Shortlisted</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{metrics?.totalShortlisted ?? 0}</p>
              </div>
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <p className="text-xs uppercase font-semibold text-indigo-700">Interviewing</p>
                <p className="text-2xl font-bold text-indigo-700 mt-1">{metrics?.totalInterviewing ?? 0}</p>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                <p className="text-xs uppercase font-semibold text-amber-700">Selected</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">{metrics?.totalSelected ?? 0}</p>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <p className="text-xs uppercase font-semibold text-emerald-700">Offers Released</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{metrics?.totalOffers ?? 0}</p>
              </div>
              <div className="p-4 bg-emerald-100/60 rounded-xl border border-emerald-300">
                <p className="text-xs uppercase font-semibold text-emerald-900">Confirmed Joined</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{metrics?.totalJoined ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Hiring Partners & Active Openings summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Top Corporate Hiring Partners</h2>
                <button
                  onClick={() => setActiveTab("crm")}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All Partners &rarr;
                </button>
              </div>
              {metrics?.topPartners && metrics.topPartners.length > 0 ? (
                <div className="space-y-3">
                  {metrics.topPartners.map((partner, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{partner.name}</p>
                          <p className="text-xs text-slate-500">Verified Corporate Recruiter</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                        {partner.hires} Placements
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No confirmed hires yet recorded. Issue offers to populate top hiring partners.
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Recent Job Openings</h2>
                <button
                  onClick={() => setActiveTab("drives")}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Manage Drives &rarr;
                </button>
              </div>
              <div className="space-y-3">
                {drives && drives.slice(0, 5).map((drive) => (
                  <div
                    key={drive.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">{drive.title}</p>
                      <p className="text-xs text-slate-500">
                        {drive.company.name} • {drive.salaryPackage || "Package Undisclosed"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        drive.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : drive.status === "DRAFT"
                          ? "bg-slate-200 text-slate-700"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {drive.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: JOB DRIVES */}
      {/* ========================================================================= */}
      {activeTab === "drives" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search drives by role or company..."
                value={searchDrive}
                onChange={(e) => setSearchDrive(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value={JobDriveStatus.ACTIVE}>Active</option>
                <option value={JobDriveStatus.DRAFT}>Draft</option>
                <option value={JobDriveStatus.CLOSED}>Closed</option>
                <option value={JobDriveStatus.ARCHIVED}>Archived</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Opening / Role</th>
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">Package & Mode</th>
                  <th className="px-5 py-3.5">Eligibility Criteria</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Applicants</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDrives.length > 0 ? (
                  filteredDrives.map((drive) => (
                    <tr key={drive.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{drive.title}</div>
                        <div className="text-xs text-slate-500">{drive.location || "Remote / Unspecified"}</div>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700">{drive.company.name}</td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        <div className="text-emerald-600 font-semibold">{drive.salaryPackage || "Undisclosed"}</div>
                        <div>{drive.jobType}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        <div>Min Test: {drive.minPassingPercentage ? `${drive.minPassingPercentage}%` : "None"}</div>
                        <div>Target: {drive.targetCourse?.title || "All Courses"}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            drive.status === JobDriveStatus.ACTIVE
                              ? "bg-emerald-100 text-emerald-800"
                              : drive.status === JobDriveStatus.DRAFT
                              ? "bg-slate-100 text-slate-700"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {drive.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{drive._count.applications}</td>
                      <td className="px-5 py-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedDriveId(drive.id);
                            setActiveTab("pipeline");
                          }}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold hover:bg-blue-100"
                        >
                          Pipeline
                        </button>
                        <button
                          onClick={() => duplicateDriveMutation.mutate({ driveId: drive.id })}
                          title="Duplicate Drive"
                          className="p-1 hover:bg-slate-100 rounded text-slate-600"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {drive.status !== JobDriveStatus.ACTIVE && (
                          <button
                            onClick={() => activateDriveMutation.mutate({ driveId: drive.id })}
                            title="Activate Drive"
                            className="p-1 hover:bg-emerald-50 rounded text-emerald-600"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {drive.status === JobDriveStatus.ACTIVE && (
                          <button
                            onClick={() => closeDriveMutation.mutate({ driveId: drive.id })}
                            title="Close Drive"
                            className="p-1 hover:bg-amber-50 rounded text-amber-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => archiveDriveMutation.mutate({ driveId: drive.id })}
                          title="Archive Drive"
                          className="p-1 hover:bg-rose-50 rounded text-rose-600"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                      No job drives found. Click "Create Opening / Drive" to launch one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RECRUITER & PARTNER CRM */}
      {/* ========================================================================= */}
      {activeTab === "crm" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Corporate Partners & Recruiter Contacts</h2>
              <p className="text-xs text-slate-500">Maintain recruiter relationships, logs, and scheduled follow-ups.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewPartnerModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Company
              </button>
              <button
                onClick={() => setShowNewRecruiterModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
              >
                <Users className="w-3.5 h-3.5" /> Add Recruiter Contact
              </button>
              <button
                onClick={() => setShowNewFollowUpModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
              >
                <Phone className="w-3.5 h-3.5" /> Log Follow-up
              </button>
            </div>
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {partners && partners.map((partner) => (
              <div
                key={partner.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{partner.name}</h3>
                    <p className="text-xs text-slate-500">{partner.industry || "Technology & Services"}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                    {partner._count.jobDrives} Drives
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  {partner.contactPerson && <p>👤 {partner.contactPerson}</p>}
                  {partner.contactEmail && <p>✉️ {partner.contactEmail}</p>}
                  {partner.contactPhone && <p>📞 {partner.contactPhone}</p>}
                  {partner.location && <p>📍 {partner.location}</p>}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {partner.website ? (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Website <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">No URL</span>
                  )}
                  <button
                    onClick={() => {
                      setRecruiterForm((prev) => ({ ...prev, companyId: partner.id }));
                      setShowNewRecruiterModal(true);
                    }}
                    className="text-indigo-600 font-medium hover:underline"
                  >
                    + Add Contact
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Recruiter Contacts Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 font-bold text-slate-900 text-sm">
              All Recruiter Contacts Directory
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Recruiter Name</th>
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">Designation</th>
                  <th className="px-5 py-3.5">Email & Phone</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recruiters && recruiters.length > 0 ? (
                  recruiters.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{r.name}</td>
                      <td className="px-5 py-3.5 text-slate-700">{r.company.name}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{r.designation || "HR"}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        <div>{r.email}</div>
                        <div>{r.phone}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">
                      No recruiter contacts recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TALENT POOL & ELIGIBILITY */}
      {/* ========================================================================= */}
      {activeTab === "talentPool" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-4">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Placement Talent Pool</h2>
              <p className="text-xs text-slate-500">
                Real-time institutional eligibility engine computing live attendance and assessment pass rates.
              </p>
            </div>
            <button
              onClick={exportPlacementCSV}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100"
            >
              Export Talent Pool CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Student ID & Name</th>
                  <th className="px-5 py-3.5">Batch & Courses</th>
                  <th className="px-5 py-3.5">Attendance %</th>
                  <th className="px-5 py-3.5">Exam Pass Rate</th>
                  <th className="px-5 py-3.5">Placement Status</th>
                  <th className="px-5 py-3.5">Placed Company / Package</th>
                  <th className="px-5 py-3.5 text-right">Resume & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {talentPool && talentPool.length > 0 ? (
                  talentPool.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{s.fullName}</div>
                        <div className="text-xs font-mono text-slate-500">{s.enrollmentNo}</div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-700">
                        <div className="font-semibold text-slate-900">{s.batchName}</div>
                        <div className="text-slate-500">{s.courses.join(", ") || "No enrolled courses"}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            s.attendancePercentage >= 75
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {s.attendancePercentage}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            s.examPassRate >= 60
                              ? "bg-blue-100 text-blue-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {s.examPassRate}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={s.placementStatus}
                          onChange={(e) =>
                            updateStatusOverrideMutation.mutate({
                              studentProfileId: s.id,
                              placementStatus: e.target.value,
                              isPlaced: e.target.value === "PLACED",
                            })
                          }
                          className="border border-slate-300 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="ELIGIBLE">ELIGIBLE</option>
                          <option value="REGISTERED">REGISTERED</option>
                          <option value="SHORTLISTED">SHORTLISTED</option>
                          <option value="INTERVIEWING">INTERVIEWING</option>
                          <option value="SELECTED">SELECTED</option>
                          <option value="OFFERED">OFFERED</option>
                          <option value="PLACED">PLACED</option>
                          <option value="OPTED_OUT">OPTED_OUT</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {s.isPlaced ? (
                          <div>
                            <p className="font-bold text-emerald-700">{s.placedCompany || "External Hiring"}</p>
                            <p className="text-slate-500">{s.placedPackage || "Package Confirmed"}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Not Placed</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {s.resumeUrl ? (
                          <a
                            href={s.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Resume
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">No Resume</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                      No students currently registered in talent pool.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: APPLICATION PIPELINE & KANBAN */}
      {/* ========================================================================= */}
      {activeTab === "pipeline" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">Select Job Drive:</label>
              <select
                value={selectedDriveId || ""}
                onChange={(e) => setSelectedDriveId(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">-- Choose an opening --</option>
                {drives && drives.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.company.name})
                  </option>
                ))}
              </select>
            </div>
            {selectedDriveId && (
              <span className="text-xs text-slate-500">
                Total Candidates in Drive: {driveApplications?.length ?? 0}
              </span>
            )}
          </div>

          {!selectedDriveId ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm">
              Please select a Job Drive from the dropdown above to manage candidate pipeline stages.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { stage: PlacementApplicationStatus.APPLIED, label: "Applied Candidates", color: "border-slate-300" },
                { stage: PlacementApplicationStatus.SHORTLISTED, label: "Shortlisted", color: "border-blue-400" },
                { stage: PlacementApplicationStatus.INTERVIEW_SCHEDULED, label: "Interview Scheduled", color: "border-indigo-400" },
                { stage: PlacementApplicationStatus.SELECTED, label: "Selected / Offered", color: "border-emerald-400" },
              ].map((col) => {
                const colApps = (driveApplications || []).filter((app) => app.status === col.stage);
                return (
                  <div
                    key={col.stage}
                    className={`bg-slate-50 rounded-xl border-t-4 ${col.color} border border-slate-200 p-4 space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">{col.label}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                        {colApps.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {colApps.map((app) => (
                        <div
                          key={app.id}
                          className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm space-y-2"
                        >
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {app.student.user.firstName} {app.student.user.lastName}
                            </h4>
                            <p className="text-xs text-slate-500">{app.student.user.email}</p>
                            <p className="text-xs text-slate-400 font-mono">{app.student.user.phone}</p>
                          </div>

                          {app.coverNote && (
                            <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-1.5 rounded">
                              "{app.coverNote}"
                            </p>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1 text-xs">
                            {col.stage === PlacementApplicationStatus.APPLIED && (
                              <button
                                onClick={() =>
                                  updateAppStatusMutation.mutate({
                                    applicationId: app.id,
                                    status: PlacementApplicationStatus.SHORTLISTED,
                                  })
                                }
                                className="px-2 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                              >
                                Shortlist
                              </button>
                            )}

                            {col.stage === PlacementApplicationStatus.SHORTLISTED && (
                              <button
                                onClick={() => {
                                  setActiveApplicationId(app.id);
                                  setShowInterviewModal(true);
                                }}
                                className="px-2 py-1 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700"
                              >
                                Schedule Round
                              </button>
                            )}

                            {col.stage === PlacementApplicationStatus.INTERVIEW_SCHEDULED && (
                              <button
                                onClick={() => {
                                  setActiveApplicationId(app.id);
                                  setShowOfferModal(true);
                                }}
                                className="px-2 py-1 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700"
                              >
                                Release Offer
                              </button>
                            )}

                            <button
                              onClick={() =>
                                updateAppStatusMutation.mutate({
                                  applicationId: app.id,
                                  status: PlacementApplicationStatus.REJECTED,
                                  rejectionReason: "Interview criteria not met",
                                })
                              }
                              className="px-2 py-1 bg-rose-50 text-rose-700 rounded font-medium hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: OFFERS & JOININGS */}
      {/* ========================================================================= */}
      {activeTab === "offers" && (
        <div className="space-y-6">
          {/* Offers Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Released Placement Offers</h2>
                <p className="text-xs text-slate-500">Official candidate job offers with compensation breakdown.</p>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Company & Role</th>
                  <th className="px-5 py-3.5">CTC / Package</th>
                  <th className="px-5 py-3.5">Offer Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {offersAndJoinings?.offers && offersAndJoinings.offers.length > 0 ? (
                  offersAndJoinings.offers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">
                          {offer.application.student.user.firstName} {offer.application.student.user.lastName}
                        </div>
                        <div className="text-xs text-slate-500">{offer.application.student.user.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{offer.companyName}</div>
                        <div className="text-xs text-slate-500">{offer.position}</div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-600">
                        ₹{(offer.ctc / 100000).toFixed(2)} LPA
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        {new Date(offer.offerDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {offer.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setActiveApplicationId(offer.applicationId);
                            setJoiningForm((prev) => ({
                              ...prev,
                              companyName: offer.companyName,
                              position: offer.position,
                            }));
                            setShowJoiningModal(true);
                          }}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                        >
                          Confirm Joining
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-xs">
                      No placement offers issued yet. Release an offer from the pipeline view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Confirmed Joinings Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 font-bold text-slate-900 text-base">
              Confirmed Candidate Joinings
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Company & Role</th>
                  <th className="px-5 py-3.5">Joined Date</th>
                  <th className="px-5 py-3.5">Employee ID</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {offersAndJoinings?.joinings && offersAndJoinings.joinings.length > 0 ? (
                  offersAndJoinings.joinings.map((join) => (
                    <tr key={join.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {join.application.student.user.firstName} {join.application.student.user.lastName}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{join.companyName}</div>
                        <div className="text-xs text-slate-500">{join.position}</div>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono">
                        {new Date(join.joinedDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-700">
                        {join.employeeId || "Pending ID"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {join.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-xs">
                      No candidate joinings confirmed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: REPORTS */}
      {/* ========================================================================= */}
      {activeTab === "reports" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Institutional Placement Reports</h2>
              <p className="text-xs text-slate-500">
                Audit and export placement records across all batches and corporate partners.
              </p>
            </div>
            <button
              onClick={exportPlacementCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
            >
              <Download className="w-4 h-4" /> Download Full CSV Report
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
            <p className="font-semibold text-slate-900">Report Summary Details:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Includes complete student profiles, verified contact emails, and phone numbers.</li>
              <li>Includes computed live attendance percentage from classroom punch-in records.</li>
              <li>Includes assessment examination pass rate and highest score achieved.</li>
              <li>Includes offer details, accepted compensation (CTC in LPA), and company name.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE OPENING / DRIVE */}
      {/* ========================================================================= */}
      {showNewDriveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Launch New Job Opening / Drive</h3>
              <button onClick={() => setShowNewDriveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDriveMutation.mutate({
                  companyId: driveForm.companyId,
                  title: driveForm.title,
                  department: driveForm.department || undefined,
                  jobType: driveForm.jobType,
                  workMode: driveForm.workMode,
                  description: driveForm.description,
                  responsibilities: driveForm.responsibilities || undefined,
                  requirements: driveForm.requirements || undefined,
                  salaryPackage: driveForm.salaryPackage,
                  location: driveForm.location,
                  openingsCount: Number(driveForm.openingsCount),
                  minPassingPercentage: Number(driveForm.minPassingPercentage),
                  minAttendancePercentage: Number(driveForm.minAttendancePercentage),
                  targetCourseId: driveForm.targetCourseId || undefined,
                  eligibleBatchId: driveForm.eligibleBatchId || undefined,
                  skills: driveForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
                  status: JobDriveStatus.ACTIVE,
                });
              }}
              className="space-y-4 text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company *</label>
                  <select
                    required
                    value={driveForm.companyId}
                    onChange={(e) => setDriveForm({ ...driveForm, companyId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">-- Choose Company --</option>
                    {partners && partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Software Engineer / Full Stack"
                    value={driveForm.title}
                    onChange={(e) => setDriveForm({ ...driveForm, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Package (CTC)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹4.5 - 6.5 LPA"
                    value={driveForm.salaryPackage}
                    onChange={(e) => setDriveForm({ ...driveForm, salaryPackage: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Type</label>
                  <select
                    value={driveForm.jobType}
                    onChange={(e) => setDriveForm({ ...driveForm, jobType: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value={JobType.FULL_TIME}>Full Time</option>
                    <option value={JobType.INTERNSHIP}>Internship</option>
                    <option value={JobType.CONTRACT}>Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vacancies</label>
                  <input
                    type="number"
                    value={driveForm.openingsCount}
                    onChange={(e) => setDriveForm({ ...driveForm, openingsCount: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Passing Score %</label>
                  <input
                    type="number"
                    value={driveForm.minPassingPercentage}
                    onChange={(e) => setDriveForm({ ...driveForm, minPassingPercentage: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Attendance %</label>
                  <input
                    type="number"
                    value={driveForm.minAttendancePercentage}
                    onChange={(e) => setDriveForm({ ...driveForm, minAttendancePercentage: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description *</label>
                <textarea
                  required
                  rows={3}
                  value={driveForm.description}
                  onChange={(e) => setDriveForm({ ...driveForm, description: e.target.value })}
                  placeholder="Responsibilities, requirements, tech stack..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewDriveModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDriveMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  {createDriveMutation.isPending ? "Publishing..." : "Publish Drive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CORPORATE PARTNER */}
      {/* ========================================================================= */}
      {showNewPartnerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Add Corporate Partner</h3>
              <button onClick={() => setShowNewPartnerModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createPartnerMutation.mutate(partnerForm);
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                <input
                  required
                  type="text"
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={partnerForm.industry}
                    onChange={(e) => setPartnerForm({ ...partnerForm, industry: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={partnerForm.website}
                    onChange={(e) => setPartnerForm({ ...partnerForm, website: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={partnerForm.contactEmail}
                    onChange={(e) => setPartnerForm({ ...partnerForm, contactEmail: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={partnerForm.contactPhone}
                    onChange={(e) => setPartnerForm({ ...partnerForm, contactPhone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewPartnerModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPartnerMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD RECRUITER CONTACT */}
      {/* ========================================================================= */}
      {showNewRecruiterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Add Recruiter Contact</h3>
              <button onClick={() => setShowNewRecruiterModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRecruiterMutation.mutate({
                  companyId: recruiterForm.companyId,
                  name: recruiterForm.name,
                  designation: recruiterForm.designation,
                  email: recruiterForm.email,
                  phone: recruiterForm.phone,
                  linkedinUrl: recruiterForm.linkedinUrl,
                });
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company *</label>
                <select
                  required
                  value={recruiterForm.companyId}
                  onChange={(e) => setRecruiterForm({ ...recruiterForm, companyId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">-- Choose Company --</option>
                  {partners && partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recruiter Name *</label>
                <input
                  required
                  type="text"
                  value={recruiterForm.name}
                  onChange={(e) => setRecruiterForm({ ...recruiterForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    value={recruiterForm.email}
                    onChange={(e) => setRecruiterForm({ ...recruiterForm, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
                  <input
                    required
                    type="tel"
                    value={recruiterForm.phone}
                    onChange={(e) => setRecruiterForm({ ...recruiterForm, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewRecruiterModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRecruiterMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Save Recruiter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SCHEDULE INTERVIEW */}
      {/* ========================================================================= */}
      {showInterviewModal && activeApplicationId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Schedule Interview Round</h3>
              <button onClick={() => setShowInterviewModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                scheduleInterviewMutation.mutate({
                  applicationId: activeApplicationId,
                  roundNumber: Number(interviewForm.roundNumber),
                  roundType: interviewForm.roundType,
                  scheduledAt: interviewForm.scheduledAt ? new Date(interviewForm.scheduledAt) : undefined,
                  meetingLink: interviewForm.meetingLink || undefined,
                });
              }}
              className="space-y-3 text-sm"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Round Number</label>
                  <input
                    type="number"
                    value={interviewForm.roundNumber}
                    onChange={(e) => setInterviewForm({ ...interviewForm, roundNumber: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Round Type</label>
                  <select
                    value={interviewForm.roundType}
                    onChange={(e) => setInterviewForm({ ...interviewForm, roundType: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value={InterviewRoundType.TECHNICAL}>Technical</option>
                    <option value={InterviewRoundType.HR}>HR</option>
                    <option value={InterviewRoundType.MANAGERIAL}>Managerial</option>
                    <option value={InterviewRoundType.FINAL}>Final</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={interviewForm.scheduledAt}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Link / Venue</label>
                <input
                  type="text"
                  placeholder="https://meet.google.com/xyz or Room 102"
                  value={interviewForm.meetingLink}
                  onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowInterviewModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleInterviewMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Confirm Round
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RELEASE OFFER */}
      {/* ========================================================================= */}
      {showOfferModal && activeApplicationId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Release Placement Offer</h3>
              <button onClick={() => setShowOfferModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createOfferMutation.mutate({
                  applicationId: activeApplicationId,
                  companyName: offerForm.companyName,
                  position: offerForm.position,
                  ctc: offerForm.ctc,
                  joiningDate: offerForm.joiningDate ? new Date(offerForm.joiningDate) : undefined,
                  offerLetterUrl: offerForm.offerLetterUrl || undefined,
                });
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                <input
                  required
                  type="text"
                  value={offerForm.companyName}
                  onChange={(e) => setOfferForm({ ...offerForm, companyName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Position / Title *</label>
                <input
                  required
                  type="text"
                  value={offerForm.position}
                  onChange={(e) => setOfferForm({ ...offerForm, position: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Package (CTC) *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 5.5 LPA"
                  value={offerForm.ctc}
                  onChange={(e) => setOfferForm({ ...offerForm, ctc: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tentative Joining Date</label>
                <input
                  type="date"
                  value={offerForm.joiningDate}
                  onChange={(e) => setOfferForm({ ...offerForm, joiningDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOfferMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  Issue Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM JOINING */}
      {/* ========================================================================= */}
      {showJoiningModal && activeApplicationId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Confirm Candidate Joining</h3>
              <button onClick={() => setShowJoiningModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createJoiningMutation.mutate({
                  applicationId: activeApplicationId,
                  companyName: joiningForm.companyName,
                  position: joiningForm.position,
                  joinedDate: joiningForm.joinedDate ? new Date(joiningForm.joinedDate) : new Date(),
                  employeeId: joiningForm.employeeId || undefined,
                  workEmail: joiningForm.workEmail || undefined,
                  workPhone: joiningForm.workPhone || undefined,
                });
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                <input
                  required
                  type="text"
                  value={joiningForm.companyName}
                  onChange={(e) => setJoiningForm({ ...joiningForm, companyName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Position *</label>
                <input
                  required
                  type="text"
                  value={joiningForm.position}
                  onChange={(e) => setJoiningForm({ ...joiningForm, position: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date *</label>
                  <input
                    required
                    type="date"
                    value={joiningForm.joinedDate}
                    onChange={(e) => setJoiningForm({ ...joiningForm, joinedDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. TCS-84910"
                    value={joiningForm.employeeId}
                    onChange={(e) => setJoiningForm({ ...joiningForm, employeeId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowJoiningModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJoiningMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  Confirm Joining
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
