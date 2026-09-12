"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Calendar,
  CreditCard,
  PlusCircle,
  FileText,
  UserCheck,
  Building,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { LeaveType, LeaveRequestStatus, PayrollStatus } from "@prisma/client";

export function StaffPortalView() {
  const [activeTab, setActiveTab] = useState<"leaves" | "slips">("leaves");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null);

  // Form State
  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.CASUAL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  // Queries
  const { data: profile, isLoading: profileLoading } = api.staffErp.getMyProfile.useQuery();
  const { data: myLeaves, refetch: refetchLeaves } = api.staffErp.getMyLeaves.useQuery();
  const { data: mySlips } = api.staffErp.getMySalarySlips.useQuery();
  const { data: slipDetails } = api.staffErp.getSalarySlipDetails.useQuery(
    { slipId: selectedSlipId || "" },
    { enabled: !!selectedSlipId }
  );

  // Mutation
  const applyMutation = api.staffErp.applyForLeave.useMutation({
    onSuccess: () => {
      setShowApplyModal(false);
      setReason("");
      setStartDate("");
      setEndDate("");
      setFormError("");
      refetchLeaves();
    },
    onError: (err) => {
      setFormError(err.message);
    },
  });

  const formatPaise = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return 0;
    return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setFormError("All fields are required.");
      return;
    }
    applyMutation.mutate({
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason.trim(),
    });
  };

  if (profileLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
        Loading staff career portal...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {profile?.user.firstName} {profile?.user.lastName}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-100 text-blue-800">
              {profile?.employeeId}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-2">
            <span className="flex items-center gap-1.5">
              <Building className="w-4 h-4" /> {profile?.department}
            </span>
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> {profile?.designation}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <PlusCircle className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("leaves")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "leaves"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          My Leaves ({myLeaves?.total ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("slips")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "slips"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          My Salary Slips ({mySlips?.total ?? 0})
        </button>
      </div>

      {/* Tab: My Leaves */}
      {activeTab === "leaves" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Date Range</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {myLeaves?.items.map((leave) => (
                <tr key={leave.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-900">{leave.leaveType}</td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {new Date(leave.startDate).toISOString().slice(0, 10)} to {new Date(leave.endDate).toISOString().slice(0, 10)}
                  </td>
                  <td className="py-3 px-4">{leave.daysCount}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: My Salary Slips */}
      {activeTab === "slips" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Slip Number</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Base Salary</th>
                <th className="py-3 px-4">Leave Deductions</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mySlips?.items.map((slip) => (
                <tr key={slip.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">{slip.salarySlipNumber}</td>
                  <td className="py-3 px-4 font-medium">{slip.month}/{slip.year}</td>
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
                    <button
                      onClick={() => setSelectedSlipId(slip.id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                {formError}
              </div>
            )}
            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  {Object.values(LeaveType).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500">
                Estimated Days: <span className="font-bold text-slate-800">{calculateDays()}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Specify purpose of leave..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Slip Breakdown Modal */}
      {selectedSlipId && slipDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Salary Slip {slipDetails.salarySlipNumber}</h3>
              <button
                onClick={() => setSelectedSlipId(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Period</span>
                <span className="font-medium">{slipDetails.month}/{slipDetails.year}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Base Salary</span>
                <span className="font-mono">{formatPaise(slipDetails.baseSalary)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Allowances</span>
                <span className="font-mono">{formatPaise(slipDetails.allowances)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Unpaid Leave Days ({slipDetails.unpaidLeaveDays} days)</span>
                <span className="font-mono text-rose-600">-{formatPaise(slipDetails.leaveDeductions)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Other Deductions</span>
                <span className="font-mono text-rose-600">-{formatPaise(slipDetails.deductions)}</span>
              </div>
              <div className="flex justify-between py-2 border-t font-bold text-base text-slate-900">
                <span>Net Disbursed Salary</span>
                <span className="font-mono text-blue-600">{formatPaise(slipDetails.netSalary)}</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSlipId(null)}
                className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
