"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Users,
  Calendar,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertCircle,
  PlusCircle,
  FileText,
  Briefcase,
  Layers,
  Award,
  ShieldCheck,
  Check,
  X,
  Printer,
  ChevronRight,
  TrendingUp,
  Download,
  Copy,
  KeyRound,
} from "lucide-react";
import {
  StaffDepartment,
  UserRoleCode,
  LeaveRequestStatus,
  PayrollStatus,
  PaymentMethod,
  AttendanceStatus,
} from "@prisma/client";
import { StaffShiftsTab } from "./staff-shifts-tab";
import { StaffAssetsTab } from "./staff-assets-tab";
import { StaffRecruitmentTab } from "./staff-recruitment-tab";
import { StaffOnboardingTab } from "./staff-onboarding-tab";
import { StaffLettersTab } from "./staff-letters-tab";

export function AdminStaffView() {
  const [activeTab, setActiveTab] = useState<
    | "directory"
    | "attendance"
    | "leaves"
    | "payroll"
    | "shifts"
    | "assets"
    | "recruitment"
    | "onboarding"
    | "letters"
    | "departments"
    | "tasks"
    | "performance"
    | "documents"
  >("directory");

  const [deptFilter, setDeptFilter] = useState<StaffDepartment | undefined>(undefined);
  const [search, setSearch] = useState("");

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddDesigModal, setShowAddDesigModal] = useState(false);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [activePayrollRecord, setActivePayrollRecord] = useState<any>(null);
  const [activeSlipDetails, setActiveSlipDetails] = useState<any>(null);

  // Queries
  const { data: metrics, refetch: refetchMetrics } = api.staffErp.getPayrollSummaryMetrics.useQuery({
    month: selectedMonth,
    year: selectedYear,
  });

  const { data: staffData, refetch: refetchStaff } = api.staffErp.listStaff.useQuery({
    department: deptFilter,
    search: search.trim() || undefined,
  });

  const { data: attendanceData, refetch: refetchAttendance } = api.staffErp.listStaffAttendance.useQuery({
    month: selectedMonth,
    year: selectedYear,
    date: selectedDate ? new Date(selectedDate) : undefined,
  });

  const { data: attendanceSummary } = api.staffErp.getStaffAttendanceSummary.useQuery({
    month: selectedMonth,
    year: selectedYear,
  });

  const { data: leavesData, refetch: refetchLeaves } = api.staffErp.listAllLeaves.useQuery({
    department: deptFilter,
  });

  const { data: payrollData, refetch: refetchPayroll } = api.staffErp.listPayrollRecords.useQuery({
    month: selectedMonth,
    year: selectedYear,
  });

  const { data: departments, refetch: refetchDepartments } = api.staffErp.listDepartments.useQuery();
  const { data: designations, refetch: refetchDesignations } = api.staffErp.listDesignations.useQuery();
  const { data: tasks, refetch: refetchTasks } = api.staffErp.listStaffTasks.useQuery();
  const { data: reviews, refetch: refetchReviews } = api.staffErp.listPerformanceReviews.useQuery();

  // Credentials state
  const [createdStaffCredentials, setCreatedStaffCredentials] = useState<any>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [copiedStaffCreds, setCopiedStaffCreds] = useState(false);

  // Mutations
  const createStaffAccountMutation = api.staffErp.createStaffMemberWithAccount.useMutation({
    onSuccess: (data) => {
      setShowAddStaffModal(false);
      setCreatedStaffCredentials(data.credentials);
      setShowCredentialsModal(true);
      refetchStaff();
      refetchMetrics();
    },
    onError: (err) => {
      alert(err.message || "Failed to create staff member.");
    },
  });

  const resetPasswordMutation = api.staffErp.resetStaffPassword.useMutation({
    onSuccess: (data) => {
      setCreatedStaffCredentials({
        fullName: "Staff Member",
        email: data.email,
        temporaryPassword: data.temporaryPassword,
        employeeId: data.employeeId,
      });
      setShowCredentialsModal(true);
    },
    onError: (err) => {
      alert(err.message || "Failed to reset password.");
    },
  });

  const createStaffMutation = api.staffErp.createStaffProfile.useMutation({
    onSuccess: () => {
      setShowAddStaffModal(false);
      refetchStaff();
      refetchMetrics();
    },
  });

  const markAttendanceMutation = api.staffErp.markStaffAttendance.useMutation({
    onSuccess: () => {
      setShowMarkAttendanceModal(false);
      refetchAttendance();
    },
  });

  const reviewLeaveMutation = api.staffErp.reviewLeaveRequest.useMutation({
    onSuccess: () => refetchLeaves(),
  });

  const generatePayrollMutation = api.staffErp.generateMonthlyPayroll.useMutation({
    onSuccess: () => {
      refetchPayroll();
      refetchMetrics();
    },
  });

  const markPaidMutation = api.staffErp.markPayrollPaid.useMutation({
    onSuccess: () => {
      setShowMarkPaidModal(false);
      refetchPayroll();
      refetchMetrics();
    },
  });

  const createDeptMutation = api.staffErp.createDepartment.useMutation({
    onSuccess: () => {
      setShowAddDeptModal(false);
      refetchDepartments();
    },
  });

  const createDesigMutation = api.staffErp.createDesignation.useMutation({
    onSuccess: () => {
      setShowAddDesigModal(false);
      refetchDesignations();
    },
  });

  const createTaskMutation = api.staffErp.createStaffTask.useMutation({
    onSuccess: () => {
      setShowAssignTaskModal(false);
      refetchTasks();
    },
  });

  const updateTaskStatusMutation = api.staffErp.updateStaffTaskStatus.useMutation({
    onSuccess: () => refetchTasks(),
  });

  const createReviewMutation = api.staffErp.createPerformanceReview.useMutation({
    onSuccess: () => {
      setShowAddReviewModal(false);
      refetchReviews();
    },
  });

  const verifyDocMutation = api.staffErp.verifyStaffDocument.useMutation({
    onSuccess: () => refetchStaff(),
  });

  // State forms
  const [staffForm, setStaffForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roleCode: UserRoleCode.TRAINER,
    department: StaffDepartment.ACADEMICS,
    designation: "Senior Faculty & Trainer",
    baseSalaryRupees: 45000,
    employeeId: "",
    password: "",
    bankAccountNumber: "",
    bankIfsc: "",
    panNumber: "",
  });

  const [attForm, setAttForm] = useState({
    staffId: "",
    date: new Date().toISOString().slice(0, 10),
    status: AttendanceStatus.PRESENT,
    checkInTime: "09:30",
    checkOutTime: "18:00",
    workingHours: 8.5,
    remarks: "Regular shift",
  });

  const [deptForm, setDeptForm] = useState({
    code: "",
    name: "",
    description: "",
  });

  const [desigForm, setDesigForm] = useState({
    departmentId: "",
    title: "",
    level: 1,
    description: "",
  });

  const [taskForm, setTaskForm] = useState({
    staffId: "",
    title: "",
    description: "",
    priority: "HIGH",
    dueDate: "",
  });

  const [reviewForm, setReviewForm] = useState({
    staffId: "",
    reviewPeriod: "Q1 2026",
    rating: 4.5,
    kpisScore: 92,
    strengths: "Excellent student engagement & timely task delivery",
    improvements: "Increase research publications",
    goals: "Deliver advanced syllabus modules",
  });

  const [paidForm, setPaidForm] = useState({
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    paymentReference: "TRF-SLG-" + Date.now().toString().slice(-6),
    remarks: "Monthly salary direct bank disbursement",
  });

  const formatPaise = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const exportStaffCSV = () => {
    const items = staffData?.items || [];
    if (items.length === 0) {
      alert("No staff data to export.");
      return;
    }
    const headers = [
      "Employee ID",
      "Full Name",
      "Email",
      "Phone",
      "Department",
      "Designation",
      "Joining Date",
      "Employment Type",
      "Monthly Salary (INR)",
      "Status",
    ];
    const rows = items.map((s: any) => [
      `"${s.employeeId}"`,
      `"${s.user.firstName} ${s.user.lastName}"`,
      `"${s.user.email}"`,
      `"${s.personalPhone || s.user.phone || ""}"`,
      `"${s.department}"`,
      `"${s.designation}"`,
      `"${new Date(s.joiningDate).toISOString().slice(0, 10)}"`,
      `"${s.employmentType}"`,
      (s.baseSalary / 100).toFixed(2),
      `"${s.user.status}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SoftLab_Staff_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPayrollCSV = () => {
    const items = payrollData?.items || [];
    if (items.length === 0) {
      alert("No payroll records to export for this month.");
      return;
    }
    const headers = [
      "Slip Number",
      "Employee ID",
      "Employee Name",
      "Month/Year",
      "Basic Salary (INR)",
      "Allowances (INR)",
      "Deductions (INR)",
      "Net Salary (INR)",
      "Status",
      "Payment Date",
    ];
    const rows = items.map((p: any) => [
      `"${p.salarySlipNumber}"`,
      `"${p.staff.employeeId}"`,
      `"${p.staff.user.firstName} ${p.staff.user.lastName}"`,
      `"${p.month}/${p.year}"`,
      (p.basicSalary / 100).toFixed(2),
      (p.totalAllowances / 100).toFixed(2),
      (p.totalDeductions / 100).toFixed(2),
      (p.netSalary / 100).toFixed(2),
      `"${p.status}"`,
      `"${p.paymentDate ? new Date(p.paymentDate).toISOString().slice(0, 10) : ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SoftLab_Payroll_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Staff Management & HRMS</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              Enterprise Institutional Hub
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Staff directory, daily punch attendance, leave approvals, monthly payroll & printable payslips.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={activeTab === "payroll" ? exportPayrollCSV : exportStaffCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm"
            title="Export CSV report"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={() => setShowMarkAttendanceModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm"
          >
            <Clock className="w-4 h-4 text-slate-500" /> Mark Attendance
          </button>
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Onboard Staff
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Active Staff Members</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{metrics?.totalActive ?? 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">{departments?.length ?? 0} active departments</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Pending Leave Requests</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {leavesData?.items.filter((l) => l.status === LeaveRequestStatus.PENDING).length ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Requires administrative review</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Payroll Processed</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics?.totalProcessed ?? 0} Slips</p>
            <p className="text-xs text-slate-500 mt-0.5">Period: {selectedMonth}/{selectedYear}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Disbursed This Month</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {formatPaise(metrics?.totalDisbursedPaise ?? 0)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Direct institutional ledger</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex flex-wrap gap-3 text-sm font-medium">
        {[
          { id: "directory", label: `Staff Directory (${staffData?.total ?? 0})` },
          { id: "attendance", label: "Daily & Monthly Attendance" },
          { id: "leaves", label: `Leave Approvals (${leavesData?.total ?? 0})` },
          { id: "payroll", label: "Monthly Payroll & Payslips" },
          { id: "shifts", label: "Shifts & Schedule" },
          { id: "assets", label: "Assets & Inventory" },
          { id: "recruitment", label: "Recruitment (ATS)" },
          { id: "onboarding", label: "Onboarding & Offboarding" },
          { id: "letters", label: "Letter Generator" },
          { id: "departments", label: `Departments & Designations (${departments?.length ?? 0})` },
          { id: "tasks", label: `Staff Tasks (${tasks?.length ?? 0})` },
          { id: "performance", label: `Appraisals (${reviews?.length ?? 0})` },
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
      {/* TAB 1: STAFF DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === "directory" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by ID, name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={deptFilter || ""}
                onChange={(e) => setDeptFilter((e.target.value as StaffDepartment) || undefined)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {Object.values(StaffDepartment).map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Base Monthly Salary</th>
                  <th className="py-3.5 px-4">Monthly Attendance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staffData?.items && staffData.items.length > 0 ? (
                  staffData.items.map((staff) => {
                    const att = attendanceSummary?.[staff.id];
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{staff.employeeId}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{staff.user.firstName} {staff.user.lastName}</p>
                          <p className="text-xs text-slate-400">{staff.user.email}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                            {staff.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{staff.designation}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {formatPaise(staff.baseSalary)}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {att ? (
                            <span className="text-emerald-700 font-semibold">
                              {att.present} Present / {att.absent} Absent
                            </span>
                          ) : (
                            <span className="text-slate-400">No punch yet</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              staff.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {staff.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => resetPasswordMutation.mutate({ staffId: staff.id })}
                            disabled={resetPasswordMutation.isPending}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition inline-flex items-center gap-1"
                            title="Reset password and generate new credentials"
                          >
                            <KeyRound className="w-3 h-3" /> Reset Login
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                      No staff records found. Click "Onboard Staff" to add members.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATTENDANCE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">Date View:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              />
            </div>
            <button
              onClick={() => setShowMarkAttendanceModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Punch Daily Attendance
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Punch In</th>
                  <th className="py-3.5 px-4">Punch Out</th>
                  <th className="py-3.5 px-4">Working Hours</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attendanceData && attendanceData.length > 0 ? (
                  attendanceData.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">
                          {record.staff.user.firstName} {record.staff.user.lastName}
                        </p>
                        <p className="text-xs font-mono text-slate-400">{record.staff.employeeId}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono">
                        {new Date(record.date).toISOString().slice(0, 10)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono">
                        {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "09:30 AM"}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono">
                        {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "06:00 PM"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {record.workingHours ? `${record.workingHours} hrs` : "8.5 hrs"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            record.status === "PRESENT"
                              ? "bg-emerald-100 text-emerald-800"
                              : record.status === "ABSENT"
                              ? "bg-rose-100 text-rose-800"
                              : record.status === "HALF_DAY"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">{record.remarks || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                      No attendance punch records found for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LEAVE APPROVALS */}
      {/* ========================================================================= */}
      {activeTab === "leaves" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Days</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leavesData?.items && leavesData.items.length > 0 ? (
                  leavesData.items.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">
                          {leave.staff.user.firstName} {leave.staff.user.lastName}
                        </p>
                        <p className="text-xs font-mono text-slate-400">{leave.staff.employeeId}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">
                          {leave.leaveType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono">
                        {new Date(leave.startDate).toISOString().slice(0, 10)} to {new Date(leave.endDate).toISOString().slice(0, 10)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{leave.daysCount}</td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-xs">{leave.reason}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            leave.status === LeaveRequestStatus.APPROVED
                              ? "bg-emerald-100 text-emerald-800"
                              : leave.status === LeaveRequestStatus.REJECTED
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {leave.status === LeaveRequestStatus.PENDING && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                reviewLeaveMutation.mutate({
                                  leaveRequestId: leave.id,
                                  status: LeaveRequestStatus.APPROVED,
                                })
                              }
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                reviewLeaveMutation.mutate({
                                  leaveRequestId: leave.id,
                                  status: LeaveRequestStatus.REJECTED,
                                  rejectionReason: "Operational workload conflict",
                                })
                              }
                              className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                      No leave requests pending.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MONTHLY PAYROLL & PAYSLIPS */}
      {/* ========================================================================= */}
      {activeTab === "payroll" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">Month & Year:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>Month {m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() =>
                generatePayrollMutation.mutate({
                  month: selectedMonth,
                  year: selectedYear,
                  workingDays: 30,
                })
              }
              disabled={generatePayrollMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
            >
              <CreditCard className="w-3.5 h-3.5" />
              {generatePayrollMutation.isPending ? "Generating..." : "Generate Monthly Payroll Batch"}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Base Salary</th>
                  <th className="py-3.5 px-4">Allowances</th>
                  <th className="py-3.5 px-4">Deductions</th>
                  <th className="py-3.5 px-4">Net Payable</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payrollData?.items && payrollData.items.length > 0 ? (
                  payrollData.items.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">
                          {record.staff.user.firstName} {record.staff.user.lastName}
                        </p>
                        <p className="text-xs font-mono text-slate-400">{record.staff.employeeId}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">{record.staff.department}</td>
                      <td className="py-3.5 px-4 font-mono text-xs">{formatPaise(record.baseSalary)}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-emerald-600">+{formatPaise(record.allowances)}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-rose-600">-{formatPaise(record.deductions)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{formatPaise(record.netSalary)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            record.status === PayrollStatus.PAID
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {record.status !== PayrollStatus.PAID && (
                          <button
                            onClick={() => {
                              setActivePayrollRecord(record);
                              setShowMarkPaidModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => setActiveSlipDetails(record)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold hover:bg-slate-200"
                        >
                          View Payslip
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                      No payroll records generated for {selectedMonth}/{selectedYear}. Click "Generate Monthly Payroll Batch" above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DEPARTMENTS & DESIGNATIONS */}
      {/* ========================================================================= */}
      {activeTab === "departments" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Departments */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Institutional Departments</h3>
                  <p className="text-xs text-slate-500">Dynamic operational divisions</p>
                </div>
                <button
                  onClick={() => setShowAddDeptModal(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                >
                  + Add Dept
                </button>
              </div>
              <div className="space-y-2">
                {departments && departments.map((dept) => (
                  <div key={dept.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{dept.name} ({dept.code})</p>
                      <p className="text-xs text-slate-500">{dept.description || "No description"}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                      {dept._count.designations} Roles
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Designations */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Hierarchical Designations</h3>
                  <p className="text-xs text-slate-500">Job roles and seniority levels</p>
                </div>
                <button
                  onClick={() => setShowAddDesigModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                >
                  + Add Designation
                </button>
              </div>
              <div className="space-y-2">
                {designations && designations.map((desig) => (
                  <div key={desig.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{desig.title}</p>
                      <p className="text-xs text-slate-500">{desig.department?.name || "General"} • Level {desig.level}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-200 text-slate-700">
                      {desig.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: STAFF TASKS */}
      {/* ========================================================================= */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Delegated Operational Tasks</h3>
            <button
              onClick={() => setShowAssignTaskModal(true)}
              className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
            >
              + Assign New Task
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Task Title</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tasks && tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500">{task.description || "—"}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {task.assignedStaff.user.firstName} {task.assignedStaff.user.lastName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No deadline"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {task.status !== "COMPLETED" && (
                          <button
                            onClick={() =>
                              updateTaskStatusMutation.mutate({
                                taskId: task.id,
                                status: "COMPLETED",
                                completionPercentage: 100,
                              })
                            }
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No operational tasks currently assigned.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PERFORMANCE APPRAISALS */}
      {/* ========================================================================= */}
      {activeTab === "performance" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Performance Appraisals & Reviews</h3>
            <button
              onClick={() => setShowAddReviewModal(true)}
              className="px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
            >
              + Record Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews && reviews.map((rev) => (
              <div key={rev.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {rev.staff.user.firstName} {rev.staff.user.lastName}
                    </h4>
                    <p className="text-xs text-slate-500">Period: {rev.reviewPeriod}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg font-bold text-sm">
                    ⭐ {rev.rating} / 5.0
                  </span>
                </div>
                {rev.selfAssessment && (
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded">
                    Key Strengths: {rev.selfAssessment}
                  </p>
                )}
                {rev.managerFeedback && (
                  <p className="text-xs text-slate-600 italic bg-blue-50/50 p-2 rounded">
                    Manager Feedback: {rev.managerFeedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: SHIFTS & WORKING HOURS */}
      {/* ========================================================================= */}
      {activeTab === "shifts" && <StaffShiftsTab />}

      {/* ========================================================================= */}
      {/* TAB 9: ASSETS & INVENTORY */}
      {/* ========================================================================= */}
      {activeTab === "assets" && <StaffAssetsTab />}

      {/* ========================================================================= */}
      {/* TAB 10: RECRUITMENT (ATS PIPELINE) */}
      {/* ========================================================================= */}
      {activeTab === "recruitment" && <StaffRecruitmentTab />}

      {/* ========================================================================= */}
      {/* TAB 11: ONBOARDING & OFFBOARDING */}
      {/* ========================================================================= */}
      {activeTab === "onboarding" && <StaffOnboardingTab />}

      {/* ========================================================================= */}
      {/* TAB 12: DOCUMENT & LETTER GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === "letters" && <StaffLettersTab />}

      {/* ========================================================================= */}
      {/* MODAL: ONBOARD STAFF MEMBER */}
      {/* ========================================================================= */}
      {/* MODAL: ONBOARD STAFF MEMBER (PHASE 6 INSTANT LMS LOGIN) */}
      {/* ========================================================================= */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Onboard New Staff Member</h3>
                <p className="text-xs text-slate-500">Automatically creates staff record, User account, and LMS credentials.</p>
              </div>
              <button onClick={() => setShowAddStaffModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createStaffAccountMutation.mutate({
                  firstName: staffForm.firstName.trim(),
                  lastName: staffForm.lastName.trim(),
                  email: staffForm.email.trim().toLowerCase(),
                  phone: staffForm.phone.trim() || undefined,
                  roleCode: staffForm.roleCode,
                  department: staffForm.department,
                  designation: staffForm.designation.trim(),
                  baseSalary: Math.round(Number(staffForm.baseSalaryRupees) * 100), // convert to paise
                  password: staffForm.password.trim() || undefined,
                  bankAccountNumber: staffForm.bankAccountNumber || undefined,
                  bankIfsc: staffForm.bankIfsc || undefined,
                  panNumber: staffForm.panNumber || undefined,
                });
              }}
              className="space-y-3 text-sm"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Mayur"
                    value={staffForm.firstName}
                    onChange={(e) => setStaffForm({ ...staffForm, firstName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Gaur"
                    value={staffForm.lastName}
                    onChange={(e) => setStaffForm({ ...staffForm, lastName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official / Login Email *</label>
                  <input
                    required
                    type="email"
                    placeholder="staff@softlabglobal.com"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="10-digit number"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">System Role *</label>
                  <select
                    value={staffForm.roleCode}
                    onChange={(e) => setStaffForm({ ...staffForm, roleCode: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value={UserRoleCode.TRAINER}>TRAINER / FACULTY</option>
                    <option value={UserRoleCode.COUNSELOR}>COUNSELOR</option>
                    <option value={UserRoleCode.TELECALLER}>TELECALLER</option>
                    <option value={UserRoleCode.HR}>HR MANAGER</option>
                    <option value={UserRoleCode.ACCOUNTANT}>ACCOUNTANT</option>
                    <option value={UserRoleCode.PLACEMENT_OFFICER}>PLACEMENT OFFICER</option>
                    <option value={UserRoleCode.ADMIN}>ADMINISTRATOR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {Object.values(StaffDepartment).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Senior Faculty & Trainer"
                    value={staffForm.designation}
                    onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Base Salary (₹) *</label>
                  <input
                    required
                    type="number"
                    value={staffForm.baseSalaryRupees}
                    onChange={(e) => setStaffForm({ ...staffForm, baseSalaryRupees: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Password (Optional - leave blank to auto-generate secure temporary password)
                </label>
                <input
                  type="password"
                  placeholder="Leave empty for auto-generated password"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStaffAccountMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-sm"
                >
                  {createStaffAccountMutation.isPending ? "Creating Account..." : "Create Staff & Generate LMS Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STAFF CREDENTIALS DISPLAY (PHASE 6) */}
      {/* ========================================================================= */}
      {showCredentialsModal && createdStaffCredentials && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Staff LMS Credentials</h3>
                <p className="text-xs text-slate-500">Staff account is active and can log in immediately.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Employee ID:</span>
                <span className="font-mono font-bold text-blue-800 text-sm">
                  {createdStaffCredentials.employeeId}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Login Email:</span>
                <span className="font-mono font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border">
                  {createdStaffCredentials.email}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Temporary Password:</span>
                <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {createdStaffCredentials.temporaryPassword}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Portal: <a href="/login" className="text-blue-600 underline font-medium">https://softlabglobal.com/login</a>
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const text = `SOFTLAB GLOBAL — STAFF ERP LOGIN CREDENTIALS
Employee ID: ${createdStaffCredentials.employeeId}
Portal URL: https://softlabglobal.com/login
Login Email: ${createdStaffCredentials.email}
Temporary Password: ${createdStaffCredentials.temporaryPassword}`;
                  navigator.clipboard.writeText(text);
                  setCopiedStaffCreds(true);
                  setTimeout(() => setCopiedStaffCreds(false), 3000);
                }}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedStaffCreds ? "Copied Credentials!" : "Copy Full Credentials"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCredentialsModal(false)}
                className="w-full py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MARK ATTENDANCE */}
      {/* ========================================================================= */}
      {showMarkAttendanceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Mark Staff Attendance</h3>
              <button onClick={() => setShowMarkAttendanceModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                markAttendanceMutation.mutate({
                  staffId: attForm.staffId,
                  date: new Date(attForm.date),
                  status: attForm.status,
                  checkInTime: attForm.checkInTime,
                  checkOutTime: attForm.checkOutTime,
                  workHours: Number(attForm.workingHours),
                  remarks: attForm.remarks,
                });
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Member *</label>
                <select
                  required
                  value={attForm.staffId}
                  onChange={(e) => setAttForm({ ...attForm, staffId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">-- Choose Employee --</option>
                  {staffData?.items.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.firstName} {s.user.lastName} ({s.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    required
                    type="date"
                    value={attForm.date}
                    onChange={(e) => setAttForm({ ...attForm, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
                  <select
                    value={attForm.status}
                    onChange={(e) => setAttForm({ ...attForm, status: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value={AttendanceStatus.PRESENT}>PRESENT</option>
                    <option value={AttendanceStatus.ABSENT}>ABSENT</option>
                    <option value={AttendanceStatus.LATE}>LATE</option>
                    <option value={AttendanceStatus.EXCUSED}>EXCUSED</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowMarkAttendanceModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markAttendanceMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Save Punch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MARK PAYROLL PAID */}
      {/* ========================================================================= */}
      {showMarkPaidModal && activePayrollRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Mark Salary Disbursed</h3>
              <button onClick={() => setShowMarkPaidModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                markPaidMutation.mutate({
                  payrollId: activePayrollRecord.id,
                  paymentMethod: paidForm.paymentMethod,
                  paymentReference: paidForm.paymentReference,
                  remarks: paidForm.remarks,
                });
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <p className="text-xs text-slate-500">Employee:</p>
                <p className="font-bold text-slate-900">
                  {activePayrollRecord.staff.user.firstName} {activePayrollRecord.staff.user.lastName} (
                  {activePayrollRecord.staff.employeeId})
                </p>
                <p className="font-mono text-emerald-600 font-bold mt-1">
                  Net Amount: {formatPaise(activePayrollRecord.netSalary)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Mode *</label>
                <select
                  value={paidForm.paymentMethod}
                  onChange={(e) => setPaidForm({ ...paidForm, paymentMethod: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer (NEFT/RTGS)</option>
                  <option value={PaymentMethod.UPI}>UPI Transfer</option>
                  <option value={PaymentMethod.CHEQUE}>Cheque</option>
                  <option value={PaymentMethod.CASH}>Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Reference Number *</label>
                <input
                  required
                  type="text"
                  value={paidForm.paymentReference}
                  onChange={(e) => setPaidForm({ ...paidForm, paymentReference: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowMarkPaidModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markPaidMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW / PRINT PAYSLIP BREAKDOWN */}
      {/* ========================================================================= */}
      {activeSlipDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-xl">SOFTLAB GLOBAL</h3>
                <p className="text-xs text-slate-500">Official Monthly Salary Disbursement Slip</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Slip
                </button>
                <button onClick={() => setActiveSlipDetails(null)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400">Employee Name</p>
                <p className="font-bold text-slate-900 text-sm">
                  {activeSlipDetails.staff.user.firstName} {activeSlipDetails.staff.user.lastName}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Employee ID</p>
                <p className="font-mono font-bold text-slate-900 text-sm">{activeSlipDetails.staff.employeeId}</p>
              </div>
              <div>
                <p className="text-slate-400">Department & Role</p>
                <p className="font-medium text-slate-900">
                  {activeSlipDetails.staff.department} • {activeSlipDetails.staff.designation}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Payroll Cycle</p>
                <p className="font-medium text-slate-900">
                  Month {activeSlipDetails.month} / {activeSlipDetails.year}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 font-semibold text-slate-500 border-b">
                  <tr>
                    <th className="p-3">Salary Component</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3">Base Monthly Salary</td>
                    <td className="p-3 text-right font-mono">{formatPaise(activeSlipDetails.baseSalary)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-emerald-700">Allowances & Bonuses</td>
                    <td className="p-3 text-right font-mono text-emerald-700">
                      +{formatPaise(activeSlipDetails.allowances)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 text-rose-700">Deductions (Unpaid Leaves / Taxes)</td>
                    <td className="p-3 text-right font-mono text-rose-700">
                      -{formatPaise(activeSlipDetails.deductions)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold text-sm text-slate-900">
                    <td className="p-3">Net Disbursed Take-Home</td>
                    <td className="p-3 text-right font-mono text-emerald-700">
                      {formatPaise(activeSlipDetails.netSalary)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-xs text-slate-400 pt-2 flex items-center justify-between">
              <span>Status: {activeSlipDetails.status}</span>
              <span>Authorized Signature: SoftLab Global HR</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD DEPARTMENT */}
      {/* ========================================================================= */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Create Department</h3>
              <button onClick={() => setShowAddDeptModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDeptMutation.mutate(deptForm);
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dept Code *</label>
                <input
                  required
                  placeholder="e.g. ENG, ACAD, HR"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dept Name *</label>
                <input
                  required
                  placeholder="e.g. Engineering & Technology"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDeptMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD DESIGNATION */}
      {/* ========================================================================= */}
      {showAddDesigModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Create Designation</h3>
              <button onClick={() => setShowAddDesigModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDesigMutation.mutate({
                  departmentId: desigForm.departmentId,
                  title: desigForm.title,
                  level: Number(desigForm.level),
                });
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                <select
                  required
                  value={desigForm.departmentId}
                  onChange={(e) => setDesigForm({ ...desigForm, departmentId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">-- Choose Department --</option>
                  {departments && departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  required
                  placeholder="e.g. Senior Tech Lead"
                  value={desigForm.title}
                  onChange={(e) => setDesigForm({ ...desigForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Level (1 to 5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={desigForm.level}
                  onChange={(e) => setDesigForm({ ...desigForm, level: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddDesigModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDesigMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Save Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN TASK */}
      {/* ========================================================================= */}
      {showAssignTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Assign Staff Task</h3>
              <button onClick={() => setShowAssignTaskModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTaskMutation.mutate({
                  staffId: taskForm.staffId,
                  title: taskForm.title,
                  description: taskForm.description || undefined,
                  priority: taskForm.priority,
                  dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : undefined,
                });
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee Staff *</label>
                <select
                  required
                  value={taskForm.staffId}
                  onChange={(e) => setTaskForm({ ...taskForm, staffId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">-- Choose Staff --</option>
                  {staffData?.items.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.firstName} {s.user.lastName} ({s.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssignTaskModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD PERFORMANCE REVIEW */}
      {/* ========================================================================= */}
      {showAddReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Record Staff Performance Review</h3>
              <button onClick={() => setShowAddReviewModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createReviewMutation.mutate({
                  staffId: reviewForm.staffId,
                  reviewPeriod: reviewForm.reviewPeriod,
                  rating: Number(reviewForm.rating),
                  kpisScore: Number(reviewForm.kpisScore),
                  strengths: reviewForm.strengths,
                  improvements: reviewForm.improvements,
                  goals: reviewForm.goals,
                });
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Member *</label>
                <select
                  required
                  value={reviewForm.staffId}
                  onChange={(e) => setReviewForm({ ...reviewForm, staffId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">-- Choose Staff --</option>
                  {staffData?.items.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.firstName} {s.user.lastName} ({s.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rating (1 to 5) *</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    min={1}
                    max={5}
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">KPI Score (%)</label>
                  <input
                    type="number"
                    value={reviewForm.kpisScore}
                    onChange={(e) => setReviewForm({ ...reviewForm, kpisScore: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Manager Feedback</label>
                <textarea
                  rows={2}
                  value={reviewForm.improvements}
                  onChange={(e) => setReviewForm({ ...reviewForm, improvements: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddReviewModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createReviewMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
