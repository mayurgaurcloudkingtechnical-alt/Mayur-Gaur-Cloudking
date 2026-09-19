"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Clock, PlusCircle, Users, CheckCircle2, XCircle, Calendar, Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function StaffShiftsTab() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);

  const { data: shifts, isLoading, refetch } = api.staffErp.listShifts.useQuery();
  const { data: staffList } = api.staffErp.listStaff.useQuery();

  const createShiftMutation = api.staffErp.createShift.useMutation({
    onSuccess: () => {
      setShowCreateModal(false);
      setShiftForm({
        name: "",
        code: "",
        startTime: "09:00",
        endTime: "18:00",
        breakMinutes: 60,
        weeklyOff: "SUNDAY",
      });
      refetch();
    },
  });

  const assignShiftMutation = api.staffErp.assignStaffShift.useMutation({
    onSuccess: () => {
      setShowAssignModal(false);
      refetch();
    },
  });

  const [shiftForm, setShiftForm] = useState({
    name: "",
    code: "",
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60,
    weeklyOff: "SUNDAY",
  });

  const [assignForm, setAssignForm] = useState({
    staffId: "",
    shiftId: "",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Institutional Shift & Working Hours Management
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Configure work schedules, standard punch hours, break durations, and weekly off policies.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" /> Add New Shift
        </Button>
      </div>

      {/* Shifts Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-500">Loading shift configurations...</div>
      ) : !shifts || shifts.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No Shifts Defined</p>
          <p className="text-xs text-slate-400 mt-1">
            Create standard institutional shifts like General Day Shift, Morning Trainer Shift, etc.
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="outline"
            className="mt-4 text-xs"
          >
            Create First Shift
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 hover:border-indigo-200 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{shift.name}</h4>
                  <Badge variant="outline" className="mt-1 font-mono text-[10px] bg-slate-50">
                    {shift.code}
                  </Badge>
                </div>
                <Badge
                  className={
                    shift.isActive
                      ? "bg-emerald-100 text-emerald-800 text-[10px]"
                      : "bg-slate-100 text-slate-600 text-[10px]"
                  }
                >
                  {shift.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Hours</span>
                  <span className="font-semibold text-slate-800">
                    {shift.startTime} – {shift.endTime}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Break</span>
                  <span className="font-semibold text-slate-800">{shift.breakMinutes} mins</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Weekly Off</span>
                  <span className="font-semibold text-slate-800">{shift.weeklyOff}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Assigned Staff</span>
                  <span className="font-bold text-indigo-700 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {shift._count?.staff ?? 0} members
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    setSelectedShift(shift);
                    setAssignForm({ staffId: "", shiftId: shift.id });
                    setShowAssignModal(true);
                  }}
                >
                  <Users className="w-3.5 h-3.5 mr-1" /> Assign Staff
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Shift Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Define New Shift</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Shift Name *</label>
                <input
                  type="text"
                  placeholder="e.g. General Day Shift"
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Shift Code *</label>
                <input
                  type="text"
                  placeholder="e.g. SHIFT_DAY"
                  value={shiftForm.code}
                  onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value })}
                  className="w-full border rounded-lg p-2 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Time *</label>
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Break Duration (min)</label>
                  <input
                    type="number"
                    value={shiftForm.breakMinutes}
                    onChange={(e) => setShiftForm({ ...shiftForm, breakMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Weekly Off</label>
                  <select
                    value={shiftForm.weeklyOff}
                    onChange={(e) => setShiftForm({ ...shiftForm, weeklyOff: e.target.value })}
                    className="w-full border rounded-lg p-2 text-xs"
                  >
                    <option value="SUNDAY">Sunday</option>
                    <option value="SATURDAY_SUNDAY">Saturday & Sunday</option>
                    <option value="ROTATIONAL">Rotational</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                disabled={!shiftForm.name || !shiftForm.code || createShiftMutation.isPending}
                onClick={() => createShiftMutation.mutate(shiftForm)}
              >
                {createShiftMutation.isPending ? "Creating..." : "Save Shift"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showAssignModal && selectedShift && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Assign Staff to {selectedShift.name}
            </h3>
            <p className="text-xs text-slate-500">
              Select an employee to assign their attendance working schedule to {selectedShift.name} ({selectedShift.startTime} - {selectedShift.endTime}).
            </p>

            <div className="space-y-3 text-xs">
              <label className="font-semibold text-slate-700 block">Select Employee *</label>
              <select
                value={assignForm.staffId}
                onChange={(e) => setAssignForm({ ...assignForm, staffId: e.target.value })}
                className="w-full border rounded-lg p-2.5 text-xs"
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
                disabled={!assignForm.staffId || assignShiftMutation.isPending}
                onClick={() =>
                  assignShiftMutation.mutate({
                    staffId: assignForm.staffId,
                    shiftId: selectedShift.id,
                  })
                }
              >
                {assignShiftMutation.isPending ? "Assigning..." : "Confirm Assignment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
