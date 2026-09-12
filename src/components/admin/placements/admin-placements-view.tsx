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
} from "lucide-react";
import { JobDriveStatus } from "@prisma/client";

export function AdminPlacementsView() {
  const [activeTab, setActiveTab] = useState<"drives" | "partners" | "applications">("drives");
  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: drives, refetch: refetchDrives } = api.placement.listAdminDrives.useQuery();
  const { data: partners } = api.placement.listPartners.useQuery();
  const { data: driveApplications, refetch: refetchApplications } = api.placement.listDriveApplications.useQuery(
    { jobDriveId: selectedDriveId || "" },
    { enabled: !!selectedDriveId }
  );

  const updateAppStatus = api.placement.updateApplicationStatus.useMutation({
    onSuccess: () => refetchApplications(),
  });

  const totalDrives = drives?.length || 0;
  const activeDrives = drives?.filter((d) => d.status === JobDriveStatus.ACTIVE).length || 0;
  const totalPartners = partners?.length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Placement & Corporate Relations</h1>
          <p className="text-sm text-slate-600">
            Manage hiring partners, active job drives, and candidate application pipelines.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Corporate Partners</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalPartners}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Job Drives</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeDrives}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Drives</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{totalDrives}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("drives")}
          className={`pb-3 ${
            activeTab === "drives"
              ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Job Drives ({totalDrives})
        </button>
        <button
          onClick={() => setActiveTab("partners")}
          className={`pb-3 ${
            activeTab === "partners"
              ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Corporate Partners ({totalPartners})
        </button>
        {selectedDriveId && (
          <button
            onClick={() => setActiveTab("applications")}
            className={`pb-3 ${
              activeTab === "applications"
                ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Candidate Pipeline
          </button>
        )}
      </div>

      {/* Tab: Drives */}
      {activeTab === "drives" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Drive Title</th>
                <th className="px-5 py-3.5">Company</th>
                <th className="px-5 py-3.5">Type & Package</th>
                <th className="px-5 py-3.5">Target Course</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Applicants</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {drives && drives.length > 0 ? (
                drives.map((drive) => (
                  <tr key={drive.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{drive.title}</div>
                      <div className="text-xs text-slate-500">{drive.location || "Remote/Unspecified"}</div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700">{drive.company.name}</td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      <div>{drive.jobType}</div>
                      <div className="text-emerald-600 font-semibold">{drive.salaryPackage || "Undisclosed"}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {drive.targetCourse?.title || "All Courses"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          drive.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : drive.status === "CLOSED"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {drive.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-800">
                      {drive._count.applications}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedDriveId(drive.id);
                          setActiveTab("applications");
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Pipeline
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No job drives recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Partners */}
      {activeTab === "partners" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Company</th>
                <th className="px-5 py-3.5">Industry & Location</th>
                <th className="px-5 py-3.5">Contact Person</th>
                <th className="px-5 py-3.5">Active Drives</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {partners && partners.length > 0 ? (
                partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {partner.name}
                      {partner.website && (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-blue-500 font-normal hover:underline"
                        >
                          {partner.website}
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      <div>{partner.industry || "General"}</div>
                      <div className="text-slate-400">{partner.location || "Global"}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      <div>{partner.contactPerson || "N/A"}</div>
                      <div className="text-slate-400">{partner.contactEmail}</div>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-800">
                      {partner._count?.jobDrives || 0}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          partner.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {partner.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No corporate partners registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Candidate Pipeline */}
      {activeTab === "applications" && selectedDriveId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              Applicants for Drive ({driveApplications?.length || 0})
            </h2>
            <button
              onClick={() => setActiveTab("drives")}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Back to Drives
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Headline & Skills</th>
                  <th className="px-5 py-3.5">Applied Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Advance Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {driveApplications && driveApplications.length > 0 ? (
                  driveApplications.map((app) => {
                    const studentName = `${app.student?.user?.firstName} ${app.student?.user?.lastName}`.trim();
                    return (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{studentName}</div>
                          <div className="text-xs text-slate-500">{app.student?.user?.email}</div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">
                          <div className="font-medium text-slate-800">
                            {app.student?.placementProfile?.headline || "Student Candidate"}
                          </div>
                          <div className="text-slate-400">
                            {app.student?.placementProfile?.skills?.join(", ") || "No skills listed"}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {app.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <select
                            value={app.status}
                            onChange={(e) =>
                              updateAppStatus.mutate({
                                applicationId: app.id,
                                status: e.target.value as any,
                              })
                            }
                            className="text-xs bg-white border border-slate-300 rounded px-2 py-1 font-medium text-slate-700"
                          >
                            <option value="APPLIED">APPLIED</option>
                            <option value="SHORTLISTED">SHORTLISTED</option>
                            <option value="INTERVIEW_SCHEDULED">INTERVIEW_SCHEDULED</option>
                            <option value="OFFERED">OFFERED</option>
                            <option value="PLACED">PLACED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      No applications submitted for this drive yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
