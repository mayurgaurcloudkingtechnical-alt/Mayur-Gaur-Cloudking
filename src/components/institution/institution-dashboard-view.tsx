"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Building2,
  GraduationCap,
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Download,
  PlusCircle,
  UploadCloud,
  FileText,
  AlertTriangle,
  Award,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  RefreshCw,
  X,
} from "lucide-react";

export function InstitutionDashboardView() {
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "add-student" | "import" | "drives" | "jobfairs" | "reports">("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);

  // New Student Form state
  const [studentForm, setStudentForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    gender: "Male",
    enrollmentNumber: "",
    rollNumber: "",
    courseName: "B.Tech Computer Science",
    department: "Computer Science & Engineering",
    academicYear: "2022-2026",
    passingYear: 2026,
    currentSemester: 7,
    cgpa: 8.0,
    academicPercentage: 80,
    activeBacklogs: 0,
    technicalSkills: "Python, Java, React, SQL",
    preferredRole: "Software Engineer",
    preferredLocation: "Noida / Remote",
  });

  // Bulk Import state
  const [importCsvText, setImportCsvText] = useState("");

  // Queries
  const { data: dashboardData, refetch: refetchDashboard, isLoading: isDashboardLoading } =
    api.institution.getInstitutionDashboard.useQuery();
  const { data: studentsData, refetch: refetchStudents } = api.institution.listStudents.useQuery({
    search: searchTerm,
  });
  const { data: jobFairsData } = api.institution.listJobFairs.useQuery();
  const { data: templateData } = api.institution.getImportTemplate.useQuery();

  // Mutations
  const registerStudentMutation = api.institution.registerStudent.useMutation({
    onSuccess: () => {
      alert("Student successfully registered!");
      setShowAddStudentModal(false);
      refetchStudents();
      refetchDashboard();
    },
    onError: (err) => {
      alert(`Registration failed: ${err.message}`);
    },
  });

  const bulkImportMutation = api.institution.bulkImportStudents.useMutation({
    onSuccess: (res) => {
      alert(`Bulk import processed! Created: ${res.summary.created}, Duplicates: ${res.summary.duplicates}, Invalid: ${res.summary.invalid}`);
      setImportCsvText("");
      refetchStudents();
      refetchDashboard();
    },
    onError: (err) => {
      alert(`Import failed: ${err.message}`);
    },
  });

  const nominateMutation = api.institution.nominateStudentForDrive.useMutation({
    onSuccess: (res) => {
      if (res.isEligible) {
        alert("Student successfully nominated! Application forwarded to recruiter.");
      } else {
        alert(`Student is ineligible: ${res.ineligibilityReason}`);
      }
      setShowNominateModal(false);
      refetchDashboard();
    },
    onError: (err) => {
      alert(`Nomination failed: ${err.message}`);
    },
  });

  const handleDownloadTemplate = () => {
    if (!templateData?.templateCsv) return;
    const blob = new Blob([templateData.templateCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", templateData.fileName || "template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStudents = () => {
    if (!studentsData?.items || studentsData.items.length === 0) {
      alert("No student records available to export.");
      return;
    }
    const headers = ["Enrollment Number", "Name", "Email", "Phone", "Course", "Passing Year", "CGPA", "Eligibility"];
    const rows = studentsData.items.map((s) => [
      s.enrollmentNumber,
      `"${s.student?.user?.firstName || ""} ${s.student?.user?.lastName || ""}"`,
      s.student?.user?.email || "",
      s.student?.user?.phone || "",
      `"${s.courseName}"`,
      s.passingYear,
      s.cgpa || "",
      s.placementEligibility ? "Eligible" : "Ineligible",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${dashboardData?.institution?.code || "college"}_students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isDashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading institutional portal...</p>
        </div>
      </div>
    );
  }

  const inst = dashboardData?.institution;
  const metrics = dashboardData?.metrics;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* College Identity Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              Institutional Account
            </span>
            <span className="text-xs font-mono text-slate-500 font-semibold">{inst?.code || "INST-ACTIVE"}</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                inst?.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {inst?.status === "APPROVED" ? "Verified Partner" : inst?.status}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {inst?.name || "Partner College Portal"}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
            <div className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span>{inst?.type || "College"}</span>
            </div>
            {inst?.city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{inst.city}, {inst.state}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>{inst?.officialEmail}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setActiveTab("import")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 shadow-sm transition-colors"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Import Students</span>
          </button>

          <button
            onClick={handleExportStudents}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 shadow-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Registered</span>
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{metrics?.totalStudents || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Students in college cohort</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Drive Eligible</span>
            <CheckCircle2 className="h-4 w-4 text-sky-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{metrics?.eligibleStudents || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Clear CGPA & 0 active backlogs</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Placement Offers</span>
            <Award className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{metrics?.studentsPlaced || 0}</p>
          <p className="text-xs text-slate-500 mt-1">{metrics?.placementRate || 0}% overall placement</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Incomplete Profiles</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{metrics?.incompleteProfiles || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Require resume / info update</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg ${
            activeTab === "overview" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Overview & Drives
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg ${
            activeTab === "students" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Student Roster ({metrics?.totalStudents || 0})
        </button>
        <button
          onClick={() => setActiveTab("import")}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg ${
            activeTab === "import" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Bulk Import CSV
        </button>
      </div>

      {/* OVERVIEW SECTION: ACTIVE DRIVES & UPCOMING JOB FAIRS */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Campus Drives */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                <span>Active Campus Placement Drives</span>
              </h3>
              <span className="text-xs text-slate-500">Live opportunities</span>
            </div>

            <div className="divide-y divide-slate-100">
              {dashboardData?.upcomingDrives?.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No active placement drives currently published.</p>
              ) : (
                dashboardData?.upcomingDrives?.map((drive) => (
                  <div key={drive.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{drive.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        {drive.company.name} • {drive.salaryPackage || "Market Standard CTC"}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDriveId(drive.id);
                        setShowNominateModal(true);
                      }}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded border border-emerald-300"
                    >
                      Nominate Candidate
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Mega Job Fairs */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span>Upcoming Mega Job Fairs</span>
              </h3>
              <span className="text-xs text-slate-500">Multi-recruiter events</span>
            </div>

            <div className="divide-y divide-slate-100">
              {dashboardData?.upcomingJobFairs?.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No upcoming job fairs scheduled.</p>
              ) : (
                dashboardData?.upcomingJobFairs?.map((fair) => (
                  <div key={fair.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {fair.fairCode}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">{fair.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        {new Date(fair.startDate).toLocaleDateString()} • {fair.venue || "Prayagraj"}
                      </p>
                    </div>

                    <span className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded border border-emerald-200">
                      College Invited
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* STUDENT ROSTER TAB */}
      {activeTab === "students" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, enrollment number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 w-64 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={() => setShowAddStudentModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add Student</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Enrollment & Name</th>
                  <th className="p-3.5">Course & Specialization</th>
                  <th className="p-3.5">Batch / Passing</th>
                  <th className="p-3.5">CGPA</th>
                  <th className="p-3.5">Backlogs</th>
                  <th className="p-3.5">Eligibility</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {studentsData?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No students enrolled yet. Add student or upload CSV.
                    </td>
                  </tr>
                ) : (
                  studentsData?.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">
                          {item.student?.user?.firstName} {item.student?.user?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.enrollmentNumber}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">{item.courseName}</td>
                      <td className="p-3.5">{item.passingYear} (Sem {item.currentSemester || "—"})</td>
                      <td className="p-3.5 font-bold text-slate-900">{item.cgpa ? `${item.cgpa} CGPA` : "—"}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            item.activeBacklogs === 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.activeBacklogs}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.placementEligibility ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.placementEligibility ? "Eligible" : "Ineligible"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedEnrollmentId(item.id);
                            setShowNominateModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300"
                        >
                          Nominate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BULK IMPORT TAB */}
      {activeTab === "import" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Institutional Bulk Student Import</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Upload student records in bulk. The system automatically performs validation and checks for duplicates.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          <textarea
            rows={10}
            value={importCsvText}
            onChange={(e) => setImportCsvText(e.target.value)}
            placeholder="Paste CSV rows here..."
            className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />

          <div className="flex justify-end">
            <button
              disabled={!importCsvText || bulkImportMutation.isPending}
              onClick={() =>
                bulkImportMutation.mutate({
                  fileName: "college_batch.csv",
                  csvContent: importCsvText,
                })
              }
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              {bulkImportMutation.isPending ? "Importing Records..." : "Process Bulk Import"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL SINGLE STUDENT REGISTRATION */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Register Student</h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-bold text-slate-700 mb-1">Full Name*</label>
                <input
                  type="text"
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-bold text-slate-700 mb-1">Enrollment Number*</label>
                <input
                  type="text"
                  value={studentForm.enrollmentNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, enrollmentNumber: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 font-mono"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-bold text-slate-700 mb-1">Email Address*</label>
                <input
                  type="email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-bold text-slate-700 mb-1">Mobile Number*</label>
                <input
                  type="text"
                  value={studentForm.mobile}
                  onChange={(e) => setStudentForm({ ...studentForm, mobile: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Course / Program*</label>
                <input
                  type="text"
                  value={studentForm.courseName}
                  onChange={(e) => setStudentForm({ ...studentForm, courseName: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Passing Year*</label>
                <input
                  type="number"
                  value={studentForm.passingYear}
                  onChange={(e) => setStudentForm({ ...studentForm, passingYear: parseInt(e.target.value) || 2026 })}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CGPA</label>
                <input
                  type="number"
                  step="0.1"
                  value={studentForm.cgpa}
                  onChange={(e) => setStudentForm({ ...studentForm, cgpa: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Active Backlogs</label>
                <input
                  type="number"
                  value={studentForm.activeBacklogs}
                  onChange={(e) => setStudentForm({ ...studentForm, activeBacklogs: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Preferred Location</label>
                <input
                  type="text"
                  value={studentForm.preferredLocation}
                  onChange={(e) => setStudentForm({ ...studentForm, preferredLocation: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowAddStudentModal(false)} className="px-3 py-1.5 text-xs text-slate-600">
                Cancel
              </button>
              <button
                disabled={!studentForm.fullName || !studentForm.email || !studentForm.enrollmentNumber}
                onClick={() =>
                  registerStudentMutation.mutate({
                    ...studentForm,
                    technicalSkills: studentForm.technicalSkills
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
              >
                Register Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOMINATE FOR DRIVE */}
      {showNominateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Nominate Candidate for Drive</h3>
            <p className="text-xs text-slate-600">
              Select student and placement drive. The eligibility engine will verify CGPA, graduation year, and backlog criteria.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Active Campus Drive</label>
                <select
                  value={selectedDriveId || ""}
                  onChange={(e) => setSelectedDriveId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                >
                  <option value="">Choose a drive...</option>
                  {dashboardData?.upcomingDrives?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.company.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Enrolled Student</label>
                <select
                  value={selectedEnrollmentId || ""}
                  onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                >
                  <option value="">Choose a student...</option>
                  {studentsData?.items?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.enrollmentNumber} — {s.student?.user?.firstName} {s.student?.user?.lastName} ({s.cgpa || "—"} CGPA)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowNominateModal(false)} className="px-3 py-1.5 text-xs text-slate-600">
                Cancel
              </button>
              <button
                disabled={!selectedDriveId || !selectedEnrollmentId || nominateMutation.isPending}
                onClick={() =>
                  nominateMutation.mutate({
                    jobDriveId: selectedDriveId!,
                    institutionEnrollmentId: selectedEnrollmentId!,
                  })
                }
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
              >
                {nominateMutation.isPending ? "Validating..." : "Submit Nomination"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
