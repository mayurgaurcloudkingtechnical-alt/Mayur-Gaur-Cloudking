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
} from "lucide-react";
import {
  StaffDepartment,
  LeaveRequestStatus,
  PayrollStatus,
  PaymentMethod,
} from "@prisma/client";

export function AdminStaffView() {
  const [activeTab, setActiveTab] = useState<"directory" | "leaves" | "payroll">("directory");
  const [deptFilter, setDeptFilter] = useState<StaffDepartment | undefined>(undefined);
  const [search, setSearch] = useState("");

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Queries
  const { data: metrics } = api.staffErp.getPayrollSummaryMetrics.useQuery({
    month: selectedMonth,
    year: selectedYear,
  });

  const { data: staffData, refetch: refetchStaff } = api.staffErp.listStaff.useQuery({
    department: deptFilter,
    search: search.trim() || undefined,
  });

  const { data: leavesData, refetch: refetchLeaves } = api.staffErp.listAllLeaves.useQuery({
    department: deptFilter,
  });

  const { data: payrollData, refetch: refetchPayroll } = api.staffErp.listPayrollRecords.useQuery({
    month: selectedMonth,
    year: selectedYear,
  });

  // Mutations
  const reviewLeaveMutation = api.staffErp.reviewLeaveRequest.useMutation({
    onSuccess: () => refetchLeaves(),
  });

  const generatePayrollMutation = api.staffErp.generateMonthlyPayroll.useMutation({
    onSuccess: () => refetchPayroll(),
  });

  const markPaidMutation = api.staffErp.markPayrollPaid.useMutation({
    onSuccess: () => refetchPayroll(),
  });

  const formatPaise = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Staff ERP & Payroll Management</h1>
        <p className="text-sm text-slate-600">
          Institutional human resources, leave approvals, and monthly salary disbursement ledger.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Active Staff</p>
            <p className="text-2xl font-bold text-slate-900">{metrics?.totalActive ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Pending Leaves</p>
            <p className="text-2xl font-bold text-slate-900">
              {leavesData?.items.filter((l) => l.status === LeaveRequestStatus.PENDING).length ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Processed Slips</p>
            <p className="text-2xl font-bold text-slate-900">{metrics?.totalProcessed ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Disbursed ({selectedMonth}/{selectedYear})</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatPaise(metrics?.totalDisbursedPaise ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("directory")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "directory"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Staff Directory ({staffData?.total ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("leaves")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "leaves"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Leave Approvals ({leavesData?.total ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("payroll")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "payroll"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Monthly Payroll Ledger
        </button>
      </div>

      {/* Tab 1: Staff Directory */}
      {activeTab === "directory" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Base Salary</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staffData?.items.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{staff.employeeId}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{staff.user.firstName} {staff.user.lastName}</p>
                      <p className="text-xs text-slate-400">{staff.user.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {staff.department}
                      </span>
                    </td>
                    <td className="py-3 px-4">{staff.designation}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{formatPaise(staff.baseSalary)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        staff.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                      }`}>
                        {staff.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Leave Approvals */}
      {activeTab === "leaves" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leavesData?.items.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">
                        {leave.staff.user.firstName} {leave.staff.user.lastName}
                      </p>
                      <p className="text-xs font-mono text-slate-400">{leave.staff.employeeId}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">
                      {new Date(leave.startDate).toISOString().slice(0, 10)} to {new Date(leave.endDate).toISOString().slice(0, 10)}
                    </td>
                    <td className="py-3 px-4 font-semibold">{leave.daysCount}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-xs">{leave.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        leave.status === LeaveRequestStatus.APPROVED
                          ? "bg-emerald-100 text-emerald-800"
                          : leave.status === LeaveRequestStatus.REJECTED
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {leave.status === LeaveRequestStatus.PENDING && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => reviewLeaveMutation.mutate({
                              leaveRequestId: leave.id,
                              status: LeaveRequestStatus.APPROVED,
                            })}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reviewLeaveMutation.mutate({
                              leaveRequestId: leave.id,
                              status: LeaveRequestStatus.REJECTED,
                              rejectionReason: "Operational conflict",
                            })}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-medium hover:bg-rose-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Monthly Payroll Ledger */}
      {activeTab === "payroll" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>Month {m}</option>
                ))}
              </select>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => generatePayrollMutation.mutate({
                month: selectedMonth,
                year: selectedYear,
              })}
              disabled={generatePayrollMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              {generatePayrollMutation.isPending ? "Generating..." : "Generate Monthly Payroll"}
            </button>
          </div>

          <div className="overflow-x-auto border-t border-slate-100 pt-2">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="py-3 px-4">Slip Number</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Base Salary</th>
                  <th className="py-3 px-4">Unpaid Leave Deductions</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payrollData?.items.map((slip) => (
                  <tr key={slip.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{slip.salarySlipNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {slip.staff.user.firstName} {slip.staff.user.lastName}
                    </td>
                    <td className="py-3 px-4 font-mono">{formatPaise(slip.baseSalary)}</td>
                    <td className="py-3 px-4 font-mono text-rose-600">
                      {slip.leaveDeductions > 0 ? `-${formatPaise(slip.leaveDeductions)}` : "₹0"}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{formatPaise(slip.netSalary)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        slip.status === PayrollStatus.PAID
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {slip.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {slip.status !== PayrollStatus.PAID && (
                        <button
                          onClick={() => markPaidMutation.mutate({
                            payrollId: slip.id,
                            paymentMethod: PaymentMethod.BANK_TRANSFER,
                            paymentReference: `TXN-${Date.now()}`,
                          })}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
                        >
                          Disburse & Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
