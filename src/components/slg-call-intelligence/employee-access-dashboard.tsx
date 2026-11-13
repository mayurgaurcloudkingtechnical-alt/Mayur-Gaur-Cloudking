"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  User,
  Building,
  Shield,
  Smartphone,
  CheckCircle,
  Clock,
  Calendar,
  AlertCircle,
  UserCheck,
  ChevronRight,
  Layers,
  KeyRound,
  FileText,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function EmployeeAccessDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

  const profileQuery = api.slgIdentity.getEmployeeProfile.useQuery(
    { userId: selectedUserId },
    { refetchOnWindowFocus: false }
  );

  const employeesQuery = api.slgIdentity.listEmployees.useQuery({});
  const availableUsersQuery = api.slgIdentity.listAvailableUsers.useQuery(undefined, {
    enabled: isOnboardModalOpen,
  });

  const utils = api.useUtils();

  const onboardMutation = api.slgIdentity.onboardEmployee.useMutation({
    onSuccess: () => {
      setIsOnboardModalOpen(false);
      utils.slgIdentity.listEmployees.invalidate();
    },
  });

  const profile = profileQuery.data;

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Employee Access & Hierarchy Control</h2>
          <p className="text-sm text-slate-500">
            Inspect organizational placement, supervisor hierarchy, active hardware, and daily productivity status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsOnboardModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Onboard Staff
          </Button>
        </div>
      </div>

      {/* Main Grid: Employee Selector & Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Employee Directory List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Staff Directory ({employeesQuery.data?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {employeesQuery.isLoading ? (
              <div className="p-6 text-center text-sm text-slate-500">Loading directory...</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                {employeesQuery.data?.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedUserId(emp.id)}
                    className={`w-full text-left p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${
                      (selectedUserId === emp.id || (!selectedUserId && profile?.id === emp.id))
                        ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-l-4 border-indigo-600"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm text-slate-800 dark:text-slate-200">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{emp.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {emp.roleCode}
                        </Badge>
                        <span className="text-[11px] text-slate-500">
                          {emp.tenantDepartment?.name || "General"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Detailed Employee Profile Card */}
        <Card className="lg:col-span-2">
          {profileQuery.isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading employee context...</div>
          ) : !profile ? (
            <div className="p-12 text-center text-slate-500">Select an employee from the directory.</div>
          ) : (
            <>
              <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                      {profile.firstName.charAt(0)}
                      {profile.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-lg font-bold">
                        {profile.firstName} {profile.lastName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {profile.email} • {profile.phone || "No phone registered"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-600 text-white">{profile.roleCode}</Badge>
                    <Badge
                      className={
                        profile.status === "ACTIVE"
                          ? "bg-emerald-600 text-white"
                          : "bg-red-600 text-white"
                      }
                    >
                      {profile.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Organization & Hierarchy Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <Building className="w-3.5 h-3.5 text-indigo-500" /> Branch Campus
                    </div>
                    <div className="font-semibold text-sm">
                      {profile.tenantBranch?.name || "Unassigned Campus"}
                    </div>
                    <div className="text-xs text-slate-400">{profile.tenantBranch?.city || "—"}</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" /> Department Unit
                    </div>
                    <div className="font-semibold text-sm">
                      {profile.tenantDepartment?.name || "General Department"}
                    </div>
                    <div className="text-xs text-slate-400">{profile.tenantDepartment?.code || "—"}</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Direct Supervisor
                    </div>
                    <div className="font-semibold text-sm">
                      {profile.reportingManager
                        ? `${profile.reportingManager.firstName} ${profile.reportingManager.lastName}`
                        : "Executive Level (No direct manager)"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {profile.reportingManager?.email || "Self-directed"}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" /> Today's Daily Report
                    </div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {profile.todayReportStatus}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {profile.todayCallsCount} calls recorded
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hardware & Application Access */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-600" /> Authorized Hardware Devices
                  </h4>
                  {!profile.slgDeviceRegistrations || profile.slgDeviceRegistrations.length === 0 ? (
                    <div className="p-4 border border-dashed rounded-lg text-center text-xs text-slate-400">
                      No mobile or desktop devices registered for this employee yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {profile.slgDeviceRegistrations.map((dev) => (
                        <div
                          key={dev.id}
                          className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {dev.deviceName || dev.deviceType} ({dev.deviceUuid})
                            </div>
                            <div className="text-slate-400">
                              Last active: {new Date(dev.lastSeenAt).toLocaleString()}
                            </div>
                          </div>
                          <Badge
                            className={
                              dev.status === "ACTIVE"
                                ? "bg-emerald-600 text-white"
                                : "bg-amber-500 text-white"
                            }
                          >
                            {dev.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Granular Permissions */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" /> Assigned Security Permissions (
                    {profile.role.permissions.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900 rounded border">
                    {profile.role.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-[11px] font-mono">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* Onboard Employee Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                Onboard Existing SoftLab Global Staff
              </CardTitle>
              <CardDescription>
                Select an existing employee account to configure Call Intelligence entitlements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableUsersQuery.isLoading ? (
                <div className="py-6 text-center text-sm text-slate-500">Loading candidate staff...</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableUsersQuery.data?.map((u) => (
                    <div
                      key={u.id}
                      className="p-3 border rounded flex items-center justify-between hover:bg-slate-50 text-xs"
                    >
                      <div>
                        <div className="font-medium text-slate-800">
                          {u.firstName} {u.lastName} ({u.roleCode})
                        </div>
                        <div className="text-slate-400 font-mono">{u.email}</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onboardMutation.mutate({ targetUserId: u.id })}
                        disabled={onboardMutation.isPending}
                        className="h-8"
                      >
                        Select & Onboard
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end pt-3">
                <Button variant="outline" size="sm" onClick={() => setIsOnboardModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
