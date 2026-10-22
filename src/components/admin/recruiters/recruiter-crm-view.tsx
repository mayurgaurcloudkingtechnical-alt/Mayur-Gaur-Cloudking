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
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Code2,
  Cloud,
  Cpu,
  Layers,
  Laptop,
  CreditCard,
  MapPin,
  Globe,
  Sliders,
} from "lucide-react";
import { JobDriveStatus, JobType, PlacementApplicationStatus } from "@prisma/client";
import { SoftlabVisitingCardModal } from "@/components/common/softlab-visiting-card-modal";

type RecruiterTabKey = "overview" | "companies" | "openings" | "candidates" | "bulkDrives";

const TECH_DOMAINS = [
  "ALL",
  "Full-Stack Web (MERN / Next.js)",
  "Cloud & DevOps (AWS / Docker / K8s)",
  "Data Science, AI & ML",
  "Cyber Security & Ethical Hacking",
  "QA & Test Automation",
  "Mobile Apps (Flutter / React Native)",
  "IT Infrastructure & Support",
];

export function RecruiterCrmView() {
  const [activeTab, setActiveTab] = useState<RecruiterTabKey>("overview");
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [showCreateRecruiterLoginModal, setShowCreateRecruiterLoginModal] = useState(false);
  const [selectedCompanyForJob, setSelectedCompanyForJob] = useState<any>(null);
  const [selectedCompanyForLogin, setSelectedCompanyForLogin] = useState<any>(null);
  const [selectedContactForCard, setSelectedContactForCard] = useState<any>(null);
  const [loginCredsCreated, setLoginCredsCreated] = useState<any>(null);

  // Form states for new company
  const [companyForm, setCompanyForm] = useState({
    name: "",
    industry: "IT Services & Consulting",
    website: "",
    companySize: "51-200",
    city: "Prayagraj",
    state: "Uttar Pradesh",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    gstNumber: "",
    notes: "",
  });

  // Form states for new job drive / opening
  const [jobForm, setJobForm] = useState({
    companyId: "",
    title: "",
    department: "Full-Stack Web (MERN / Next.js)",
    jobType: "FULL_TIME" as JobType,
    workMode: "HYBRID",
    description: "",
    salaryPackage: "₹5.0 - ₹8.0 LPA",
    location: "Prayagraj, UP (or Remote)",
    openingsCount: 5,
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
    deadline: "",
    driveDate: "",
  });

  // Form states for creating recruiter login
  const [recruiterLoginForm, setRecruiterLoginForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "Recruiter@2026!",
  });

  const utils = api.useUtils();

  // Queries
  const { data: metrics, refetch: refetchMetrics } = api.placement.getPlacementDashboardMetrics.useQuery();
  const { data: partnersDetailed = [], refetch: refetchPartners } =
    api.placement.listCorporatePartnersDetailed.useQuery();
  const { data: drives = [], refetch: refetchDrives } = api.placement.listAdminDrives.useQuery();
  const { data: talentPool = [] } = api.placement.listTalentPool.useQuery();

  // Mutations
  const createPartnerMutation = api.placement.createPartner.useMutation({
    onSuccess: () => {
      setShowAddCompanyModal(false);
      setCompanyForm({
        name: "",
        industry: "IT Services & Consulting",
        website: "",
        companySize: "51-200",
        city: "Prayagraj",
        state: "Uttar Pradesh",
        contactPerson: "",
        contactEmail: "",
        contactPhone: "",
        gstNumber: "",
        notes: "",
      });
      refetchPartners();
      refetchMetrics();
    },
    onError: (err) => alert(`Failed to add company: ${err.message}`),
  });

  const createJobDriveMutation = api.placement.createJobDrive.useMutation({
    onSuccess: () => {
      setShowPostJobModal(false);
      setJobForm({
        companyId: "",
        title: "",
        department: "Full-Stack Web (MERN / Next.js)",
        jobType: "FULL_TIME",
        workMode: "HYBRID",
        description: "",
        salaryPackage: "₹5.0 - ₹8.0 LPA",
        location: "Prayagraj, UP (or Remote)",
        openingsCount: 5,
        skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
        deadline: "",
        driveDate: "",
      });
      refetchDrives();
      refetchPartners();
      refetchMetrics();
    },
    onError: (err) => alert(`Failed to create job drive: ${err.message}`),
  });

  const createRecruiterUserMutation = api.placement.createRecruiterUser.useMutation({
    onSuccess: (res) => {
      setLoginCredsCreated(res);
      refetchPartners();
    },
    onError: (err) => alert(`Failed to create recruiter login: ${err.message}`),
  });

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPartnerMutation.mutate({
      name: companyForm.name,
      industry: companyForm.industry,
      website: companyForm.website || undefined,
      contactPerson: companyForm.contactPerson || undefined,
      contactEmail: companyForm.contactEmail || undefined,
      contactPhone: companyForm.contactPhone || undefined,
      location: `${companyForm.city}, ${companyForm.state}`,
    });
  };

  const handleJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.companyId) {
      alert("Please select a hiring company.");
      return;
    }
    createJobDriveMutation.mutate({
      companyId: jobForm.companyId,
      title: jobForm.title,
      department: jobForm.department,
      jobType: jobForm.jobType,
      workMode: jobForm.workMode,
      description: jobForm.description || `Hiring for ${jobForm.title} across ${jobForm.department}.`,
      salaryPackage: jobForm.salaryPackage,
      location: jobForm.location,
      openingsCount: Number(jobForm.openingsCount) || 1,
      skills: jobForm.skills,
      deadline: jobForm.deadline ? new Date(jobForm.deadline) : undefined,
      driveDate: jobForm.driveDate ? new Date(jobForm.driveDate) : undefined,
    });
  };

  const handleRecruiterLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyForLogin) return;
    createRecruiterUserMutation.mutate({
      companyId: selectedCompanyForLogin.id,
      email: recruiterLoginForm.email,
      firstName: recruiterLoginForm.firstName,
      lastName: recruiterLoginForm.lastName,
      phone: recruiterLoginForm.phone || undefined,
      password: recruiterLoginForm.password,
    });
  };

  // Filtered partners
  const filteredPartners = partnersDetailed.filter((p: any) => {
    const matchSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.contactPerson && p.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? p.isActive : !p.isActive);
    return matchSearch && matchStatus;
  });

  // Filtered drives
  const filteredDrives = drives.filter((d: any) => {
    const matchDomain = selectedDomain === "ALL" || (d.department && d.department.includes(selectedDomain));
    const matchSearch =
      !searchQuery.trim() ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.company.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDomain && matchSearch;
  });

  // Aggregate total vacancies
  const totalOpeningsCount = drives.reduce((acc: number, cur: any) => acc + (cur.openingsCount || 1), 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen text-slate-900">
      {/* ===================================================================== */}
      {/* HEADER BANNER                                                         */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-300">
              Corporate CRM
            </span>
            <span className="text-xs text-slate-500 font-medium">SoftLab Global Placement &amp; Talent Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Corporate Recruiters &amp; Openings Hub
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Live corporate company onboarding, multi-domain job postings, bulk hiring drives, recruiter credential management, and candidate matchmaker.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              refetchMetrics();
              refetchPartners();
              refetchDrives();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setShowAddCompanyModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
          >
            <Building2 className="h-4 w-4 text-cyan-400" />
            <span>Onboard Company</span>
          </button>

          <button
            onClick={() => setShowPostJobModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 rounded-xl shadow-md transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Post New Opening</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* KPI METRIC CARDS                                                      */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Corporate Partners</span>
            <Building2 className="w-5 h-5 text-cyan-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{partnersDetailed.length}</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active hiring accounts</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Live Openings</span>
            <Briefcase className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalOpeningsCount}</p>
          <p className="text-[11px] text-slate-500 font-semibold">
            Across {drives.length} active job drives
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Candidates in Pipeline</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{talentPool.length}</p>
          <p className="text-[11px] text-purple-600 font-semibold">Verified alumni talent pool</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Placements &amp; Offers</span>
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {metrics?.totalPlaced || 24}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold">Avg Package: ₹5.8 LPA</p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TABS NAVIGATION                                                       */}
      {/* ===================================================================== */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === "overview"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span>Overview &amp; Drives</span>
        </button>

        <button
          onClick={() => setActiveTab("companies")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === "companies"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Companies &amp; Accounts ({partnersDetailed.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("openings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === "openings"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-purple-400" />
          <span>Domain Openings ({drives.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("candidates")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === "candidates"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>Candidate Matchmaker ({talentPool.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("bulkDrives")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === "bulkDrives"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-pink-400" />
          <span>Bulk Campus Drives</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB CONTENT 1: OVERVIEW & ACTIVE DRIVES                               */}
      {/* ===================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Domain Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter by Domain:</span>
            </span>
            {TECH_DOMAINS.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedDomain === domain
                    ? "bg-cyan-600 text-white shadow-xs font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {domain === "ALL" ? "All Domains" : domain.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Drives Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrives.length === 0 ? (
              <div className="col-span-full py-16 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-base font-bold text-slate-700">No job openings found in this filter</p>
                <button
                  onClick={() => setShowPostJobModal(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold"
                >
                  Post First Opening
                </button>
              </div>
            ) : (
              filteredDrives.map((drive: any) => (
                <div
                  key={drive.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                        {drive.department || "Engineering"}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          drive.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : drive.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {drive.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{drive.title}</h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{drive.company.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Package</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {drive.salaryPackage || "Market Standard"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Openings</span>
                        <span className="font-bold text-emerald-700 font-mono">
                          {drive.openingsCount || 1} Vacancies
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Work Mode</span>
                        <span>{drive.workMode || "Hybrid"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Applicants</span>
                        <span className="font-bold text-blue-700">
                          {drive._count?.applications || 0} Applied
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {drive.deadline ? `Closes ${new Date(drive.deadline).toLocaleDateString()}` : "Ongoing"}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedCompanyForJob(drive.company);
                        setShowPostJobModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Clone / Add</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 2: COMPANIES & CORPORATE PARTNERS                          */}
      {/* ===================================================================== */}
      {activeTab === "companies" && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search company, contact person, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Partners</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <button
                onClick={() => setShowAddCompanyModal(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition whitespace-nowrap"
              >
                <Building2 className="w-4 h-4" />
                <span>+ Add Company</span>
              </button>
            </div>
          </div>

          {/* Companies Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">Industry &amp; Size</th>
                    <th className="py-3 px-4">Primary HR / Recruiter</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-center">Openings</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        No corporate partners found.
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((partner: any) => (
                      <tr key={partner.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-slate-900 text-sm">{partner.name}</p>
                          {partner.website && (
                            <a
                              href={partner.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-cyan-600 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Globe className="w-3 h-3" />
                              <span>{partner.website.replace(/^https?:\/\//, "")}</span>
                            </a>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <p className="font-semibold text-slate-800">{partner.industry || "IT Services"}</p>
                          <span className="text-[11px] text-slate-400">{partner.companySize || "50-200 Employees"}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{partner.contactPerson || "HR Desk"}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{partner.contactEmail || partner.contactPhone || "—"}</p>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{partner.location || partner.city || "Prayagraj"}</span>
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono">
                            {partner._count?.jobDrives || 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              partner.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {partner.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                            {/* Post Job for this company */}
                            <button
                              onClick={() => {
                                setSelectedCompanyForJob(partner);
                                setJobForm((p) => ({ ...p, companyId: partner.id }));
                                setShowPostJobModal(true);
                              }}
                              className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-md text-[11px] font-bold flex items-center gap-1 border border-cyan-200 transition"
                              title="Post Job Opening for this Company"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Job</span>
                            </button>

                            {/* Create Recruiter Portal Login Account */}
                            <button
                              onClick={() => {
                                setSelectedCompanyForLogin(partner);
                                setRecruiterLoginForm({
                                  firstName: partner.contactPerson?.split(" ")[0] || "HR",
                                  lastName: partner.contactPerson?.split(" ").slice(1).join(" ") || "Lead",
                                  email: partner.contactEmail || `recruiter.${partner.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@softlabglobal.com`,
                                  phone: partner.contactPhone || "",
                                  password: "Recruiter@2026!",
                                });
                                setShowCreateRecruiterLoginModal(true);
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-[11px] font-bold flex items-center gap-1 border border-indigo-200 transition"
                              title="Create Recruiter Portal Login Account"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Login</span>
                            </button>

                            {/* Corporate Visiting Card */}
                            <button
                              onClick={() =>
                                setSelectedContactForCard({
                                  fullName: partner.contactPerson || `${partner.name} HR`,
                                  designation: "Corporate Talent Partner",
                                  phone: partner.contactPhone || "+91 9196596975",
                                  email: partner.contactEmail || "info@softlabglobal.com",
                                  roleCode: "RECRUITER",
                                })
                              }
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-bold flex items-center gap-1 border border-emerald-200 transition"
                              title="Generate Visiting Card for HR Contact"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Card</span>
                            </button>
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

      {/* ===================================================================== */}
      {/* TAB CONTENT 3: DOMAIN-WISE JOB OPENINGS                                */}
      {/* ===================================================================== */}
      {activeTab === "openings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">All Published Job Openings</h3>
              <p className="text-xs text-slate-500">Manage vacancies, application deadlines, and candidate pipelines.</p>
            </div>
            <button
              onClick={() => setShowPostJobModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Opening</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Role Title</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Work Mode</th>
                  <th className="py-3 px-4">Openings</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drives.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No job drives created yet.
                    </td>
                  </tr>
                ) : (
                  drives.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{d.title}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{d.company.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 font-semibold text-[10px]">
                          {d.department || "Engineering"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{d.workMode}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700 font-mono">{d.openingsCount}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{d.salaryPackage || "—"}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 4: CANDIDATE MATCHMAKER                                    */}
      {/* ===================================================================== */}
      {activeTab === "candidates" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Pre-Vetted Student Talent Pool</h3>
            <p className="text-xs text-slate-500">Graduating students with verified capstone projects ready for corporate referral.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {talentPool.map((candidate: any) => (
              <div key={candidate.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {candidate.studentId}
                  </span>
                  <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
                    {candidate.placementStatus}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{candidate.fullName}</h4>
                <p className="text-xs text-slate-500">{candidate.courseTitle}</p>
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                  <span>Batch: {candidate.batchCode || "Standard"}</span>
                  <span className="font-mono text-emerald-600 font-bold">{candidate.center?.split(",")[0] || "Prayagraj"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 5: BULK HIRING DRIVES                                      */}
      {/* ===================================================================== */}
      {activeTab === "bulkDrives" && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Bulk Campus &amp; Virtual Hiring Drives</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Schedule a dedicated full-day recruitment drive for 10+ openings with automated online coding rounds and single-day offer release.
          </p>
          <button
            onClick={() => setShowPostJobModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-cyan-500 hover:to-emerald-500 transition"
          >
            Schedule Bulk Drive Now
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: ADD CORPORATE PARTNER COMPANY                                */}
      {/* ===================================================================== */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base">Onboard New Corporate Partner</h3>
              </div>
              <button onClick={() => setShowAddCompanyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompanySubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Company Name *</label>
                  <input
                    required
                    type="text"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    placeholder="e.g. Tata Consultancy Services"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Industry Sector</label>
                  <input
                    type="text"
                    value={companyForm.industry}
                    onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Company Website</label>
                  <input
                    type="text"
                    value={companyForm.website}
                    onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                    placeholder="https://company.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">HR / Contact Person Name</label>
                  <input
                    type="text"
                    value={companyForm.contactPerson}
                    onChange={(e) => setCompanyForm({ ...companyForm, contactPerson: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    value={companyForm.contactEmail}
                    onChange={(e) => setCompanyForm({ ...companyForm, contactEmail: e.target.value })}
                    placeholder="priya@company.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={companyForm.contactPhone}
                    onChange={(e) => setCompanyForm({ ...companyForm, contactPhone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPartnerMutation.isPending}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  {createPartnerMutation.isPending ? "Creating..." : "Save Corporate Partner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: POST NEW JOB OPENING                                         */}
      {/* ===================================================================== */}
      {showPostJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-cyan-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base">Post Tech Job Opening / Bulk Drive</h3>
              </div>
              <button onClick={() => setShowPostJobModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJobSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Hiring Company *</label>
                  <select
                    required
                    value={jobForm.companyId}
                    onChange={(e) => setJobForm({ ...jobForm, companyId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-bold"
                  >
                    <option value="">-- Choose Corporate Partner --</option>
                    {partnersDetailed.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city || "Prayagraj"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Job Title *</label>
                  <input
                    required
                    type="text"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    placeholder="e.g. Associate Full-Stack Engineer"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Domain Department</label>
                  <select
                    value={jobForm.department}
                    onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  >
                    {TECH_DOMAINS.filter((d) => d !== "ALL").map((domain) => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Openings Count</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={jobForm.openingsCount}
                    onChange={(e) => setJobForm({ ...jobForm, openingsCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">CTC Package Offered</label>
                  <input
                    type="text"
                    value={jobForm.salaryPackage}
                    onChange={(e) => setJobForm({ ...jobForm, salaryPackage: e.target.value })}
                    placeholder="e.g. ₹5.0 - ₹8.0 LPA"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Work Mode</label>
                  <select
                    value={jobForm.workMode}
                    onChange={(e) => setJobForm({ ...jobForm, workMode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="HYBRID">Hybrid</option>
                    <option value="ON_SITE">On-Site</option>
                    <option value="REMOTE">Fully Remote</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Job Description &amp; Tech Stack</label>
                  <textarea
                    rows={3}
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    placeholder="Key responsibilities, skills, and qualifications..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPostJobModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJobDriveMutation.isPending}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  {createJobDriveMutation.isPending ? "Publishing..." : "Publish Job Opening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: CREATE RECRUITER LOGIN CREDENTIALS                           */}
      {/* ===================================================================== */}
      {showCreateRecruiterLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-indigo-950 text-white flex items-center justify-between border-b border-indigo-900">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Provision Recruiter Portal Account</h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateRecruiterLoginModal(false);
                  setLoginCredsCreated(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loginCredsCreated ? (
              <div className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Recruiter Account Created!</h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left space-y-1">
                  <p><strong>Username:</strong> {loginCredsCreated.email}</p>
                  <p><strong>Temporary Password:</strong> {loginCredsCreated.temporaryPassword}</p>
                  <p><strong>Portal:</strong> https://lms.softlabglobal.com</p>
                </div>
                <button
                  onClick={() => {
                    const msg = `🌟 *SOFTLAB GLOBAL RECRUITER PORTAL* 🌟\n\nDear Partner,\nYour recruiter portal account has been activated!\n\n🔑 *LOGIN CREDENTIALS*:\n• Portal: https://lms.softlabglobal.com\n• Username: \`${loginCredsCreated.email}\`\n• Password: \`${loginCredsCreated.temporaryPassword}\`\n\nYou can now post openings and review applicant portfolios.`;
                    navigator.clipboard.writeText(msg);
                    alert("Credentials copied to clipboard!");
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy WhatsApp Access Note</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecruiterLoginSubmit} className="p-6 space-y-4">
                <p className="text-xs text-slate-600">
                  Provision an official login for <strong>{selectedCompanyForLogin?.name}</strong> to view candidate resumes and test scores.
                </p>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">First Name *</label>
                      <input
                        required
                        type="text"
                        value={recruiterLoginForm.firstName}
                        onChange={(e) => setRecruiterLoginForm({ ...recruiterLoginForm, firstName: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Last Name *</label>
                      <input
                        required
                        type="text"
                        value={recruiterLoginForm.lastName}
                        onChange={(e) => setRecruiterLoginForm({ ...recruiterLoginForm, lastName: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Login Email *</label>
                    <input
                      required
                      type="email"
                      value={recruiterLoginForm.email}
                      onChange={(e) => setRecruiterLoginForm({ ...recruiterLoginForm, email: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Temporary Password</label>
                    <input
                      required
                      type="text"
                      value={recruiterLoginForm.password}
                      onChange={(e) => setRecruiterLoginForm({ ...recruiterLoginForm, password: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateRecruiterLoginModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createRecruiterUserMutation.isPending}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    {createRecruiterUserMutation.isPending ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CORPORATE VISITING CARD MODAL                                         */}
      {/* ===================================================================== */}
      {selectedContactForCard && (
        <SoftlabVisitingCardModal
          isOpen={!!selectedContactForCard}
          onClose={() => setSelectedContactForCard(null)}
          initialData={selectedContactForCard}
        />
      )}
    </div>
  );
}
