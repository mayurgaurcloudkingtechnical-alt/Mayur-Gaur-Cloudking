"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  UserCheck,
  UserX,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  ShieldAlert,
  Search,
  ChevronRight,
  Printer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export function StaffOnboardingTab() {
  const [activeView, setActiveView] = useState<"onboarding" | "offboarding">("onboarding");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const { data: staffList } = api.staffErp.listStaff.useQuery();

  // Auto-select first staff member if none selected
  React.useEffect(() => {
    if (!selectedStaffId && staffList?.items && staffList.items.length > 0) {
      setSelectedStaffId(staffList.items[0].id);
    }
  }, [staffList, selectedStaffId]);

  const { data: onboardingChecklist, refetch: refetchOnboarding } =
    api.staffErp.getOnboardingChecklist.useQuery(
      { staffId: selectedStaffId },
      { enabled: Boolean(selectedStaffId) && activeView === "onboarding" }
    );

  const { data: offboardingRecord, refetch: refetchOffboarding } =
    api.staffErp.getOffboardingRecord.useQuery(
      { staffId: selectedStaffId },
      { enabled: Boolean(selectedStaffId) && activeView === "offboarding" }
    );

  const updateOnboardingMutation = api.staffErp.updateOnboardingChecklist.useMutation({
    onSuccess: () => refetchOnboarding(),
  });

  const updateOffboardingMutation = api.staffErp.updateOffboardingRecord.useMutation({
    onSuccess: () => refetchOffboarding(),
  });

  const selectedStaff = staffList?.items.find((s) => s.id === selectedStaffId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            Employee Onboarding & Offboarding Lifecycle
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Institutional verification workflows: KYC, credentials, assets, and departmental clearances.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveView("onboarding")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeView === "onboarding"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            New Hire Onboarding
          </button>
          <button
            onClick={() => setActiveView("offboarding")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeView === "offboarding"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Exit Clearances (Offboarding)
          </button>
        </div>
      </div>

      {/* Main Layout: Left Staff List, Right Lifecycle Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Staff Selector */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase text-slate-500">Select Employee</h4>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {staffList?.items.map((s) => {
              const isSelected = s.id === selectedStaffId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStaffId(s.id)}
                  className={`w-full text-left p-3 rounded-lg border transition text-xs flex items-center justify-between ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                      : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {s.user.firstName} {s.user.lastName}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {s.employeeId} • {s.designation}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-300"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Workflow Details */}
        <div className="md:col-span-2">
          {activeView === "onboarding" ? (
            /* ONBOARDING CHECKLIST */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Onboarding Verification: {selectedStaff?.user?.firstName} {selectedStaff?.user?.lastName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Department: {selectedStaff?.department} • Joined:{" "}
                    {selectedStaff?.joiningDate ? formatDate(selectedStaff.joiningDate) : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-indigo-700">
                    {onboardingChecklist?.completionPercent ?? 0}% Completed
                  </div>
                  <Badge
                    className={`mt-1 text-[10px] ${
                      onboardingChecklist?.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {onboardingChecklist?.status || "IN_PROGRESS"}
                  </Badge>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${onboardingChecklist?.completionPercent ?? 0}%` }}
                />
              </div>

              {/* Checklist Items */}
              <div className="space-y-3">
                {[
                  { key: "personalDetailsDone", label: "Personal Information & Emergency Contacts Recorded" },
                  { key: "documentsUploaded", label: "Identity & Academic KYC Documents Uploaded & Verified" },
                  { key: "bankDetailsVerified", label: "Bank Account & PAN Details Configured for Payroll" },
                  { key: "workstationAssigned", label: "Physical Workstation & Seating Assigned at Campus" },
                  { key: "idCardIssued", label: "Institutional Employee Smart ID Card Issued" },
                  { key: "emailAccountCreated", label: "Official Institutional Email Account Created" },
                  { key: "slackOrPortalInvited", label: "Portal Credentials & Work Tools Access Provisioned" },
                  { key: "orientationCompleted", label: "Institutional Induction & Orientation Completed" },
                ].map((item) => {
                  const isChecked = Boolean((onboardingChecklist as any)?.[item.key]);
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition ${
                        isChecked ? "bg-emerald-50/40 border-emerald-200" : "bg-white border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          updateOnboardingMutation.mutate({
                            staffId: selectedStaffId,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={`flex-1 font-medium ${isChecked ? "text-emerald-900" : "text-slate-700"}`}>
                        {item.label}
                      </span>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            /* OFFBOARDING / EXIT CLEARANCE */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Exit Clearance: {selectedStaff?.user?.firstName} {selectedStaff?.user?.lastName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Emp ID: {selectedStaff?.employeeId} • Base: {selectedStaff?.workLocation}
                  </p>
                </div>
                <Badge
                  className={`text-[10px] ${
                    offboardingRecord?.status === "CLEARED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {offboardingRecord?.status || "INITIATED"}
                </Badge>
              </div>

              {/* Exit Clearance Items */}
              <div className="space-y-3">
                {[
                  { key: "assetsReturned", label: "All Institutional Hardware & Devices Returned & Inspected" },
                  { key: "emailDeactivated", label: "Official Institutional Email & Accounts Suspended" },
                  { key: "idCardReturned", label: "Employee ID Card & Campus Access Keys Surrendered" },
                  { key: "accountsDuesCleared", label: "Final Salary Settlement & Accounts Dues Cleared" },
                  { key: "relievingLetterIssued", label: "Official Relieving Letter Issued to Employee" },
                  { key: "experienceLetterIssued", label: "Formal Experience Certificate Dispatched" },
                ].map((item) => {
                  const isChecked = Boolean((offboardingRecord as any)?.[item.key]);
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition ${
                        isChecked ? "bg-emerald-50/40 border-emerald-200" : "bg-white border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          updateOffboardingMutation.mutate({
                            staffId: selectedStaffId,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={`flex-1 font-medium ${isChecked ? "text-emerald-900" : "text-slate-700"}`}>
                        {item.label}
                      </span>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </label>
                  );
                })}
              </div>

              {/* Exit Notes */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <label className="font-semibold text-slate-700 block">Exit Interview Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Record handover feedback, reason for leaving, or special clearance notes..."
                  defaultValue={offboardingRecord?.exitInterviewNotes || ""}
                  onBlur={(e) =>
                    updateOffboardingMutation.mutate({
                      staffId: selectedStaffId,
                      exitInterviewNotes: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
