"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  History,
  Laptop,
  Check,
  X,
  Ban,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeviceManagementDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const utils = api.useUtils();

  const devicesQuery = api.slgDevices.listTenantDevices.useQuery({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: search || undefined,
  });

  const historyQuery = api.slgDevices.getDeviceHistory.useQuery(
    { deviceId: selectedDeviceId! },
    { enabled: !!selectedDeviceId }
  );

  const approveMutation = api.slgDevices.approveDevice.useMutation({
    onSuccess: () => {
      utils.slgDevices.listTenantDevices.invalidate();
    },
  });

  const rejectMutation = api.slgDevices.rejectDevice.useMutation({
    onSuccess: () => {
      utils.slgDevices.listTenantDevices.invalidate();
    },
  });

  const revokeMutation = api.slgDevices.revokeDevice.useMutation({
    onSuccess: () => {
      utils.slgDevices.listTenantDevices.invalidate();
    },
  });

  const blockMutation = api.slgDevices.blockDevice.useMutation({
    onSuccess: () => {
      utils.slgDevices.listTenantDevices.invalidate();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-600 text-white">ACTIVE</Badge>;
      case "PENDING_APPROVAL":
        return <Badge className="bg-amber-500 text-white animate-pulse">PENDING APPROVAL</Badge>;
      case "REVOKED":
        return <Badge className="bg-slate-500 text-white">REVOKED</Badge>;
      case "BLOCKED":
        return <Badge className="bg-red-600 text-white font-bold">BLOCKED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by UUID, employee or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 py-2 border rounded-md text-sm bg-white dark:bg-slate-900"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="ACTIVE">Active</option>
            <option value="REVOKED">Revoked</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => devicesQuery.refetch()}
          disabled={devicesQuery.isFetching}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${devicesQuery.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Device List Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            Registered Corporate Hardware Fleet
          </CardTitle>
          <CardDescription>
            Enforce authenticated employee-device pairing, review pending requests, and manage access tokens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devicesQuery.isLoading ? (
            <div className="py-12 text-center text-slate-500">Loading device registry...</div>
          ) : !devicesQuery.data || devicesQuery.data.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No devices found matching the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Device / Model</th>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Branch / Dept</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Sync</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {devicesQuery.data.map((dev) => (
                    <tr key={dev.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-medium">
                        <div>
                          {dev.user.firstName} {dev.user.lastName}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{dev.user.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {dev.deviceName || dev.deviceModel || "Mobile Device"}
                        </div>
                        <div className="text-xs text-slate-400 font-mono truncate max-w-xs">
                          UUID: {dev.deviceUuid}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          {dev.deviceType} {dev.appVersion ? `v${dev.appVersion}` : ""}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <div>{dev.user.tenantBranch?.name || "Unassigned Branch"}</div>
                        <div className="text-slate-400">{dev.user.tenantDepartment?.name || "General"}</div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(dev.status)}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {dev.lastSyncAt ? new Date(dev.lastSyncAt).toLocaleString() : "Never synced"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {dev.status === "PENDING_APPROVAL" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                onClick={() => approveMutation.mutate({ deviceId: dev.id })}
                                disabled={approveMutation.isPending}
                              >
                                <Check className="w-3.5 h-3.5 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-rose-600 border-rose-300 hover:bg-rose-50"
                                onClick={() => rejectMutation.mutate({ deviceId: dev.id })}
                                disabled={rejectMutation.isPending}
                              >
                                <X className="w-3.5 h-3.5 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {dev.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-amber-600 border-amber-300 hover:bg-amber-50"
                              onClick={() => revokeMutation.mutate({ deviceId: dev.id })}
                              disabled={revokeMutation.isPending}
                            >
                              Revoke
                            </Button>
                          )}
                          {dev.status !== "BLOCKED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => blockMutation.mutate({ deviceId: dev.id, reason: "Security block" })}
                              disabled={blockMutation.isPending}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-slate-600"
                            onClick={() => setSelectedDeviceId(dev.id)}
                          >
                            <History className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Modal / Drawer */}
      {selectedDeviceId && (
        <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                Device Security Audit History
              </CardTitle>
              <CardDescription>Immutable tamper-proof audit trail for device {selectedDeviceId}</CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSelectedDeviceId(null)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {historyQuery.isLoading ? (
              <div className="py-6 text-center text-slate-500 text-sm">Loading audit logs...</div>
            ) : !historyQuery.data || historyQuery.data.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-sm">No historical audit records found.</div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {historyQuery.data.map((log) => (
                  <div key={log.id} className="p-3 bg-white dark:bg-slate-900 rounded border text-xs flex justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{log.action}</div>
                      <div className="text-slate-500">
                        By: {log.actorUser ? `${log.actorUser.firstName} (${log.actorUser.email})` : "System / Self"}
                      </div>
                      {log.details && (
                        <div className="font-mono text-slate-400 mt-1">{JSON.stringify(log.details)}</div>
                      )}
                    </div>
                    <div className="text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
