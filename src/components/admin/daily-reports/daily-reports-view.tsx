"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  PhoneCall,
  Users,
  GraduationCap,
  Send,
  MessageSquare,
  CheckSquare,
  ChevronRight,
  Filter,
  Eye,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DailyReportsView({ user }: { user: any }) {
  const isManagerOrAdmin = [
    "SUPER_ADMIN",
    "DIRECTOR",
    "ADMIN",
    "HR",
    "MANAGER",
  ].includes(user.roleCode);

  const [activeTab, setActiveTab] = useState<"my-report" | "team-reports">(
    isManagerOrAdmin ? "team-reports" : "my-report"
  );

  const [reportDate, setReportDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [actualWorkSummary, setActualWorkSummary] = useState("");
  const [resultsSummary, setResultsSummary] = useState("");
  const [nextDayPriorities, setNextDayPriorities] = useState("");
  const [remarks, setRemarks] = useState("");
  const [taskItemStates, setTaskItemStates] = useState<
    Record<string, { status: "COMPLETED" | "IN_PROGRESS" | "BLOCKED"; blockedReason?: string; notes?: string }>
  >({});

  // Review modal state
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reviewerComments, setReviewerComments] = useState("");

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const utils = api.useUtils();

  // Find staff profile for the logged-in user
  const { data: staffList } = api.staffErp.listStaff.useQuery();
  const currentStaff = staffList?.items?.find((s) => s.userId === user.id);

  // Prefilled report data
  const { data: prefillData, isLoading: prefillLoading } =
    api.workPlanner.getPrefilledReportData.useQuery(
      {
        staffId: currentStaff?.id || "",
        date: new Date(reportDate),
      },
      { enabled: Boolean(currentStaff?.id) }
    );

  // Team reports list
  const { data: teamReports, isLoading: reportsLoading } =
    api.workPlanner.listDailyReports.useQuery({
      date: new Date(reportDate),
    });

  // Submit report mutation
  const submitMutation = api.workPlanner.submitDailyReport.useMutation({
    onSuccess: () => {
      setNotification({
        type: "success",
        message: "Your daily work report has been submitted to your reporting manager!",
      });
      utils.workPlanner.getPrefilledReportData.invalidate();
      utils.workPlanner.listDailyReports.invalidate();
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to submit report." });
    },
  });

  // Review report mutation
  const reviewMutation = api.workPlanner.reviewDailyReport.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Report review updated successfully!" });
      setSelectedReport(null);
      setReviewerComments("");
      utils.workPlanner.listDailyReports.invalidate();
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to review report." });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff) {
      setNotification({ type: "error", message: "Staff profile required to submit report." });
      return;
    }

    const items = (prefillData?.assignedTasks || []).map((t) => {
      const state = taskItemStates[t.id] || { status: "COMPLETED" };
      return {
        taskId: t.id,
        taskTitle: t.title,
        status: state.status,
        blockedReason: state.blockedReason,
        notes: state.notes,
      };
    });

    submitMutation.mutate({
      staffId: currentStaff.id,
      reportDate: new Date(reportDate),
      actualWorkSummary: actualWorkSummary || "Daily tasks executed as per operational schedule.",
      resultsSummary,
      nextDayPriorities,
      remarks,
      items,
    });
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* View Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("my-report")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "my-report"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Submit My Daily Report
          </button>
          {isManagerOrAdmin && (
            <button
              onClick={() => setActiveTab("team-reports")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "team-reports"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Team Submissions & Review
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs text-slate-500 font-semibold">Reporting Date:</Label>
          <Input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="text-xs h-8 w-36 font-mono"
          />
        </div>
      </div>

      {/* TAB 1: Submit My Daily Report */}
      {activeTab === "my-report" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Verified CRM Activity Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-950 rounded-xl p-5 text-white shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold">Verified Real CRM Activity Recorded Today</h3>
              <Badge className="bg-emerald-600 text-white font-mono text-[10px]">Auto-Prefilled</Badge>
            </div>
            <p className="text-xs text-emerald-200 mt-1">
              These counts are automatically synchronized from your authorized CRM activity today.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-emerald-800/60 p-3 rounded-lg border border-emerald-700/50 flex items-center gap-3">
                <PhoneCall className="w-5 h-5 text-emerald-300" />
                <div>
                  <span className="text-[10px] text-emerald-300 uppercase block font-semibold">Follow-ups Logged</span>
                  <span className="text-xl font-bold font-mono">{prefillData?.crmMetrics.followUpsDone ?? 0}</span>
                </div>
              </div>

              <div className="bg-emerald-800/60 p-3 rounded-lg border border-emerald-700/50 flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-300" />
                <div>
                  <span className="text-[10px] text-emerald-300 uppercase block font-semibold">Leads Contacted</span>
                  <span className="text-xl font-bold font-mono">{prefillData?.crmMetrics.leadsContacted ?? 0}</span>
                </div>
              </div>

              <div className="bg-emerald-800/60 p-3 rounded-lg border border-emerald-700/50 flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-emerald-300" />
                <div>
                  <span className="text-[10px] text-emerald-300 uppercase block font-semibold">Admissions Converted</span>
                  <span className="text-xl font-bold font-mono">{prefillData?.crmMetrics.admissionsDone ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Daily Tasks Section */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                Assigned Operational Tasks Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {(!prefillData?.assignedTasks || prefillData.assignedTasks.length === 0) ? (
                <p className="text-xs text-slate-500 py-2 text-center">
                  No automated tasks assigned for today. You may still log your general work summary below.
                </p>
              ) : (
                prefillData.assignedTasks.map((task) => {
                  const state = taskItemStates[task.id] || { status: "COMPLETED" };
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-[10px] text-slate-400 font-bold">{task.taskCode}</span>
                          <h4 className="font-bold text-slate-900">{task.title}</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {(["COMPLETED", "IN_PROGRESS", "BLOCKED"] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() =>
                                setTaskItemStates((prev) => ({
                                  ...prev,
                                  [task.id]: { ...(prev[task.id] || {}), status: st },
                                }))
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                state.status === st
                                  ? st === "COMPLETED"
                                    ? "bg-emerald-600 text-white"
                                    : st === "IN_PROGRESS"
                                    ? "bg-sky-600 text-white"
                                    : "bg-red-600 text-white"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      {state.status === "BLOCKED" && (
                        <div>
                          <Label className="text-[10px] font-semibold text-red-700">Blocker Reason *</Label>
                          <Input
                            placeholder="Explain why this task was blocked..."
                            value={state.blockedReason || ""}
                            onChange={(e) =>
                              setTaskItemStates((prev) => ({
                                ...prev,
                                [task.id]: { ...(prev[task.id] || { status: "BLOCKED" }), blockedReason: e.target.value },
                              }))
                            }
                            className="text-xs h-7 mt-0.5 border-red-300 bg-white"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Form Fields: Work Performed & Next Priorities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200 bg-white shadow-xs">
              <CardContent className="p-4 space-y-2">
                <Label className="text-xs font-bold text-slate-800">Actual Work Summary *</Label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed breakdown of activities, calls, meetings, or sessions completed today..."
                  value={actualWorkSummary}
                  onChange={(e) => setActualWorkSummary(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500"
                />
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-xs">
              <CardContent className="p-4 space-y-2">
                <Label className="text-xs font-bold text-slate-800">Priorities for Next Working Day</Label>
                <textarea
                  rows={4}
                  placeholder="Top objectives scheduled for tomorrow..."
                  value={nextDayPriorities}
                  onChange={(e) => setNextDayPriorities(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500"
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-end">
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm px-6 h-9"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitMutation.isPending ? "Submitting..." : "Submit Daily Report"}</span>
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: Team Submissions & Review */}
      {activeTab === "team-reports" && isManagerOrAdmin && (
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">CRM Verified Metrics</th>
                  <th className="p-3">Work Summary</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportsLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Loading departmental submissions...
                    </td>
                  </tr>
                ) : !teamReports || teamReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No reports submitted yet for {reportDate}.
                    </td>
                  </tr>
                ) : (
                  teamReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">
                          {rep.staff?.user?.firstName} {rep.staff?.user?.lastName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{rep.staff?.user?.email}</p>
                      </td>

                      <td className="p-3">
                        <Badge variant="outline" className="font-semibold text-[10px]">
                          {rep.department}
                        </Badge>
                      </td>

                      <td className="p-3">
                        <p className="text-emerald-700 font-bold font-mono text-[11px]">
                          {rep.crmFollowUpsDone} calls • {rep.crmLeadsContacted} leads • {rep.crmAdmissionsDone} admits
                        </p>
                      </td>

                      <td className="p-3 max-w-xs">
                        <p className="line-clamp-2 text-slate-600">{rep.actualWorkSummary}</p>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rep.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : rep.status === "SUBMITTED"
                              ? "bg-amber-100 text-amber-800"
                              : rep.status === "RETURNED_FOR_CORRECTION"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {rep.status}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReport(rep)}
                          className="h-7 text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Review Team Report */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daily Work Report Review — {selectedReport.staff?.user?.firstName}{" "}
                  {selectedReport.staff?.user?.lastName}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedReport.department} • {new Date(selectedReport.reportDate).toLocaleDateString()}
                </p>
              </div>
              <Badge>{selectedReport.status}</Badge>
            </div>

            <div className="space-y-3 text-xs max-h-[50vh] overflow-y-auto">
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-emerald-900">
                <span className="font-bold block text-[10px] uppercase">Verified CRM Tallies</span>
                <p className="font-mono mt-0.5">
                  Calls Done: <b>{selectedReport.crmFollowUpsDone}</b> | Leads Processed:{" "}
                  <b>{selectedReport.crmLeadsContacted}</b> | Admissions: <b>{selectedReport.crmAdmissionsDone}</b>
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block">Actual Work Performed:</span>
                <p className="text-slate-600 mt-1 whitespace-pre-wrap">{selectedReport.actualWorkSummary}</p>
              </div>

              {selectedReport.nextDayPriorities && (
                <div>
                  <span className="font-bold text-slate-700 block">Next Day Priorities:</span>
                  <p className="text-slate-600 mt-1 whitespace-pre-wrap">{selectedReport.nextDayPriorities}</p>
                </div>
              )}

              {selectedReport.items && selectedReport.items.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block">Itemized Tasks:</span>
                  <div className="space-y-1.5 mt-1">
                    {selectedReport.items.map((item: any) => (
                      <div key={item.id} className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                        <span>{item.taskTitle}</span>
                        <Badge variant="outline">{item.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Label className="text-xs font-bold text-slate-800">Manager Review Comments</Label>
                <textarea
                  rows={2}
                  placeholder="Feedback or return reasons..."
                  value={reviewerComments}
                  onChange={(e) => setReviewerComments(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-slate-300 mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReport(null)}
                className="text-xs"
              >
                Close
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={reviewMutation.isPending}
                onClick={() =>
                  reviewMutation.mutate({
                    reportId: selectedReport.id,
                    status: "RETURNED_FOR_CORRECTION",
                    reviewerComments: reviewerComments.trim() || "Please revise and resubmit with additional details.",
                  })
                }
                className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Return for Correction
              </Button>

              <Button
                size="sm"
                disabled={reviewMutation.isPending}
                onClick={() =>
                  reviewMutation.mutate({
                    reportId: selectedReport.id,
                    status: "APPROVED",
                    reviewerComments: reviewerComments.trim() || undefined,
                  })
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Approve Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
