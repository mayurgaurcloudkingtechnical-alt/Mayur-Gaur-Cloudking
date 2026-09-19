"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Laptop,
  PlusCircle,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRightLeft,
  RotateCcw,
  Shield,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export function StaffAssetsTab() {
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const { data: assets, isLoading, refetch } = api.staffErp.listAssets.useQuery({
    category: categoryFilter !== "ALL" ? categoryFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    search: search.trim() || undefined,
  });

  const { data: staffList } = api.staffErp.listStaff.useQuery();

  const createAssetMutation = api.staffErp.createAsset.useMutation({
    onSuccess: () => {
      setShowAddModal(false);
      setAssetForm({
        assetTag: "",
        name: "",
        category: "LAPTOP",
        serialNumber: "",
        brand: "",
        model: "",
        condition: "GOOD",
        notes: "",
      });
      refetch();
    },
  });

  const assignAssetMutation = api.staffErp.assignAsset.useMutation({
    onSuccess: () => {
      setShowAssignModal(false);
      refetch();
    },
  });

  const returnAssetMutation = api.staffErp.returnAsset.useMutation({
    onSuccess: () => {
      setShowReturnModal(false);
      refetch();
    },
  });

  const [assetForm, setAssetForm] = useState({
    assetTag: "",
    name: "",
    category: "LAPTOP",
    serialNumber: "",
    brand: "",
    model: "",
    condition: "GOOD",
    notes: "",
  });

  const [assignStaffId, setAssignStaffId] = useState("");
  const [returnCondition, setReturnCondition] = useState("GOOD");

  // Summary counts
  const totalAssets = assets?.length ?? 0;
  const assignedAssets = assets?.filter((a) => a.status === "ASSIGNED").length ?? 0;
  const availableAssets = assets?.filter((a) => a.status === "AVAILABLE").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Laptop className="w-5 h-5 text-indigo-600" />
            Staff Asset & Device Inventory Management
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Track laptops, workstations, peripherals, corporate SIMs, and institutional equipment assignments.
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" /> Register New Asset
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Registered Assets</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalAssets}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600">Assigned / In Use</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{assignedAssets}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-blue-600">Available in Inventory</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{availableAssets}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset tag, name, serial or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-xs bg-white"
        >
          <option value="ALL">All Categories</option>
          <option value="LAPTOP">Laptops</option>
          <option value="DESKTOP">Desktops</option>
          <option value="MONITOR">Monitors</option>
          <option value="SIM_CARD">SIM Cards</option>
          <option value="ID_CARD">ID Cards</option>
          <option value="PHONE">Phones</option>
          <option value="OTHER">Other</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-xs bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="UNDER_MAINTENANCE">Maintenance</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading asset records...</div>
        ) : !assets || assets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No assets match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-3">Asset Tag</th>
                  <th className="p-3">Device / Item</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Serial No</th>
                  <th className="p-3">Assigned To</th>
                  <th className="p-3">Condition</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-bold text-indigo-600">{asset.assetTag}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{asset.name}</div>
                      {asset.brand && (
                        <span className="text-[10px] text-slate-400">
                          {asset.brand} {asset.model}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {asset.category}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {asset.serialNumber || "—"}
                    </td>
                    <td className="p-3">
                      {asset.assignedStaff ? (
                        <div>
                          <span className="font-semibold text-slate-800">
                            {asset.assignedStaff.user.firstName} {asset.assignedStaff.user.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Emp ID: {asset.assignedStaff.employeeId} •{" "}
                            {asset.assignedDate ? formatDate(asset.assignedDate) : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={
                          asset.condition === "NEW" || asset.condition === "GOOD"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                            : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                        }
                      >
                        {asset.condition}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        className={
                          asset.status === "ASSIGNED"
                            ? "bg-indigo-100 text-indigo-800 text-[10px]"
                            : asset.status === "AVAILABLE"
                            ? "bg-emerald-100 text-emerald-800 text-[10px]"
                            : "bg-slate-100 text-slate-700 text-[10px]"
                        }
                      >
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {asset.status === "AVAILABLE" ? (
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setAssignStaffId("");
                            setShowAssignModal(true);
                          }}
                        >
                          <ArrowRightLeft className="w-3 h-3 mr-1" /> Assign
                        </Button>
                      ) : asset.status === "ASSIGNED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[11px] text-amber-700 border-amber-300 hover:bg-amber-50"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setReturnCondition(asset.condition || "GOOD");
                            setShowReturnModal(true);
                          }}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Return
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Register Institutional Asset</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Asset Tag *</label>
                  <input
                    type="text"
                    placeholder="e.g. ASSET-LAP-01"
                    value={assetForm.assetTag}
                    onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })}
                    className="w-full border rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                    className="w-full border rounded-lg p-2 bg-white"
                  >
                    <option value="LAPTOP">Laptop</option>
                    <option value="DESKTOP">Desktop</option>
                    <option value="MONITOR">Monitor</option>
                    <option value="SIM_CARD">SIM Card</option>
                    <option value="ID_CARD">ID Card</option>
                    <option value="PHONE">Phone</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Device Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dell Latitude 5420 / MacBook Pro M2"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="Dell, Apple, Lenovo"
                    value={assetForm.brand}
                    onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Serial Number</label>
                  <input
                    type="text"
                    placeholder="SN-XXXX-XXXX"
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                    className="w-full border rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Condition</label>
                <select
                  value={assetForm.condition}
                  onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value })}
                  className="w-full border rounded-lg p-2 bg-white"
                >
                  <option value="NEW">New</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="DAMAGED">Needs Maintenance</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                disabled={!assetForm.assetTag || !assetForm.name || createAssetMutation.isPending}
                onClick={() => createAssetMutation.mutate(assetForm)}
              >
                {createAssetMutation.isPending ? "Registering..." : "Save Asset"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Assign {selectedAsset.name} ({selectedAsset.assetTag})
            </h3>
            <div className="space-y-3 text-xs">
              <label className="font-semibold text-slate-700 block">Select Employee *</label>
              <select
                value={assignStaffId}
                onChange={(e) => setAssignStaffId(e.target.value)}
                className="w-full border rounded-lg p-2.5 bg-white"
              >
                <option value="">-- Choose Employee --</option>
                {staffList?.items.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.employeeId} - {s.user.firstName} {s.user.lastName} ({s.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                disabled={!assignStaffId || assignAssetMutation.isPending}
                onClick={() =>
                  assignAssetMutation.mutate({
                    assetId: selectedAsset.id,
                    staffId: assignStaffId,
                  })
                }
              >
                {assignAssetMutation.isPending ? "Assigning..." : "Confirm Handover"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Record Asset Return — {selectedAsset.assetTag}
            </h3>
            <p className="text-xs text-slate-500">
              Currently assigned to {selectedAsset.assignedStaff?.user?.firstName}{" "}
              {selectedAsset.assignedStaff?.user?.lastName}. Record returning condition.
            </p>

            <div className="space-y-3 text-xs">
              <label className="font-semibold text-slate-700 block">Inspection Condition *</label>
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
                className="w-full border rounded-lg p-2 bg-white"
              >
                <option value="GOOD">Good / Intact</option>
                <option value="FAIR">Minor Wear & Tear</option>
                <option value="DAMAGED">Damaged / Needs Repair</option>
                <option value="RETIRED">End of Life / Retired</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowReturnModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-amber-600 text-white hover:bg-amber-700 text-xs"
                disabled={returnAssetMutation.isPending}
                onClick={() =>
                  returnAssetMutation.mutate({
                    assetId: selectedAsset.id,
                    condition: returnCondition,
                  })
                }
              >
                {returnAssetMutation.isPending ? "Returning..." : "Confirm Return to Stock"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
