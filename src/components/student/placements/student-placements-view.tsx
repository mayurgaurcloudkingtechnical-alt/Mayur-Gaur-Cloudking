"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { StudentProfileEditor } from "./student-profile-editor";

export function StudentPlacementsView() {
  const [activeTab, setActiveTab] = useState<"drives" | "applications" | "profile">("drives");
  const [applyingDriveId, setApplyingDriveId] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState("");

  const { data: eligibleDrives, refetch: refetchDrives } = api.placement.listEligibleDrives.useQuery();
  const { data: myApplications, refetch: refetchApplications } = api.placement.getMyApplications.useQuery();
  const { data: profile, refetch: refetchProfile } = api.placement.getMyPlacementProfile.useQuery();


  const applyMutation = api.placement.applyForDrive.useMutation({
    onSuccess: () => {
      setApplyingDriveId(null);
      setCoverNote("");
      refetchDrives();
      refetchApplications();
    },
  });

  const handleApply = async () => {
    if (!applyingDriveId) return;
    try {
      await applyMutation.mutateAsync({
        jobDriveId: applyingDriveId,
        coverNote: coverNote.trim() || undefined,
      });
    } catch (err: any) {
      alert(err.message || "Failed to submit application");
    }
  };


  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Career & Placement Opportunities</h1>
        <p className="text-sm text-slate-600">
          Discover vetted recruitment drives, track your interview pipeline, and maintain your placement resume.
        </p>
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
          Explore Drives ({eligibleDrives?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`pb-3 ${
            activeTab === "applications"
              ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          My Applications ({myApplications?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 ${
            activeTab === "profile"
              ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Career Profile {profile?.isPlaced && "🏆 Placed"}
        </button>
      </div>


      {/* Tab: Drives */}
      {activeTab === "drives" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eligibleDrives && eligibleDrives.length > 0 ? (
            eligibleDrives.map((drive) => {
              const { eligibility, hasApplied, myApplication } = drive;
              return (
                <div
                  key={drive.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{drive.title}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {drive.company.name} • {drive.location || "Remote"}
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700">
                        {drive.salaryPackage || "Package Undisclosed"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3">{drive.description}</p>

                    {/* Eligibility breakdown */}
                    <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        {eligibility.isEligible ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Eligible to Apply
                          </span>
                        ) : (
                          <span className="text-amber-700 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> Eligibility Requirements Pending
                          </span>
                        )}
                      </div>
                      {!eligibility.isEligible && (
                        <ul className="list-disc pl-4 text-slate-600 space-y-0.5 pt-1">
                          {eligibility.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      {drive.deadline
                        ? `Deadline: ${new Date(drive.deadline).toLocaleDateString()}`
                        : "Ongoing drive"}
                    </div>
                    {hasApplied ? (
                      <span className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                        Applied ({myApplication?.status})
                      </span>
                    ) : (
                      <button
                        disabled={!eligibility.isEligible || applyMutation.isPending}
                        onClick={() => setApplyingDriveId(drive.id)}
                        className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
                          eligibility.isEligible
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 py-12 text-center text-slate-400 text-sm">
              No active job drives currently matching your courses.
            </div>
          )}
        </div>
      )}

      {/* Tab: My Applications */}
      {activeTab === "applications" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Company & Role</th>
                <th className="px-5 py-3.5">Applied Date</th>
                <th className="px-5 py-3.5">Current Status</th>
                <th className="px-5 py-3.5">Interview Rounds</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {myApplications && myApplications.length > 0 ? (
                myApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{app.jobDrive.title}</div>
                      <div className="text-xs text-slate-500">{app.jobDrive.company.name}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          app.status === "PLACED"
                            ? "bg-emerald-100 text-emerald-800"
                            : app.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {app.rounds.length > 0 ? (
                        <div className="space-y-1">
                          {app.rounds.map((r) => (
                            <div key={r.id} className="text-xs">
                              Round {r.roundNumber}: <span className="font-semibold">{r.roundType}</span>
                              {r.meetingLink && (
                                <a
                                  href={r.meetingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 ml-1 hover:underline"
                                >
                                  (Link)
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">Under initial screening</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                    You have not submitted any placement applications yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Career Profile */}
      {activeTab === "profile" && (
        <StudentProfileEditor profile={profile} onProfileUpdated={refetchProfile} />
      )}

      {/* Apply Modal */}
      {applyingDriveId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-900 text-lg">Submit Application</h3>
            <p className="text-xs text-slate-600">
              Add an optional brief cover note for the hiring team and corporate recruiter.
            </p>
            <textarea
              rows={4}
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              placeholder="Why are you a good fit for this role?"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setApplyingDriveId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applyMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

