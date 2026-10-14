"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  PlusCircle,
  Users,
  Briefcase,
  PhoneCall,
  GraduationCap,
  Filter,
  CheckSquare,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function IntelligentPlannerView() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [showCustomTaskModal, setShowCustomTaskModal] = useState(false);

  // Custom task form state
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customDept, setCustomDept] = useState("COUNSELING");
  const [customStaffId, setCustomStaffId] = useState("");
  const [customPriority, setCustomPriority] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [customQuantity, setCustomQuantity] = useState("10");

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const utils = api.useUtils();

  // Queries
  const { data: staffList } = api.staffErp.listStaff.useQuery();
  const { data: tasks, isLoading: tasksLoading } = api.workPlanner.listTasks.useQuery({
    date: new Date(selectedDate),
    department: selectedDept === "ALL" ? undefined : selectedDept,
  });

  const { data: companySummary } = api.workPlanner.getCompanyWideSummary.useQuery({
    date: new Date(selectedDate),
  });

  // Mutations
  const generateMutation = api.workPlanner.generateDailyPlan.useMutation({
    onSuccess: (data) => {
      setNotification({
        type: "success",
        message: data.message || "Daily plan generated from live CRM reports!",
      });
      utils.workPlanner.listTasks.invalidate();
      utils.workPlanner.getCompanyWideSummary.invalidate();
      setTimeout(() => setNotification(null), 5000);
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to generate plan." });
    },
  });

  const approveMutation = api.workPlanner.approveAndDistributePlan.useMutation({
    onSuccess: () => {
      setNotification({
        type: "success",
        message: "Plan approved by Director! Tasks assigned and notifications dispatched to staff.",
      });
      utils.workPlanner.listTasks.invalidate();
      utils.workPlanner.getCompanyWideSummary.invalidate();
      setTimeout(() => setNotification(null), 5000);
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Approval failed." });
    },
  });

  const createCustomTaskMutation = api.workPlanner.createCustomTask.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Custom directive created and assigned." });
      setShowCustomTaskModal(false);
      setCustomTitle("");
      setCustomDesc("");
      utils.workPlanner.listTasks.invalidate();
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to create task." });
    },
  });

  const updateStatusMutation = api.workPlanner.updateTaskStatus.useMutation({
    onSuccess: () => {
      utils.workPlanner.listTasks.invalidate();
      utils.workPlanner.getCompanyWideSummary.invalidate();
    },
  });

  const currentRunId = tasks?.[0]?.generationRunId;
  const isDraftRun = tasks?.some((t) => t.status === "DIRECTOR_REVIEW");

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
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
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner & Generation Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold">Executive Daily Work Planning Engine</h2>
            <Badge className="bg-indigo-600 text-white font-mono text-[10px]">
              AI CRM Analyzer
            </Badge>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Synthesizes pending CRM lead pipelines, overdue counselor follow-ups, and recruiter vacancies into
            prioritized, measurable tasks for organizational execution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-white outline-hidden cursor-pointer"
            />
          </div>

          <Button
            size="sm"
            disabled={generateMutation.isPending}
            onClick={() =>
              generateMutation.mutate({
                runDate: new Date(selectedDate),
                forceRegenerate: true,
              })
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>{generateMutation.isPending ? "Analyzing..." : "Analyze & Propose Plan"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCustomTaskModal(true)}
            variant="outline"
            className="border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Custom Directive</span>
          </Button>
        </div>
      </div>

      {/* Live Data Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Today's Total Tasks</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                {companySummary?.tasksOverview.totalTasks ?? tasks?.length ?? 0}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {companySummary?.tasksOverview.completed ?? 0} completed •{" "}
                {companySummary?.tasksOverview.inProgress ?? 0} in progress
              </p>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <CheckSquare className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">CRM Follow-ups Logged</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-0.5">
                {companySummary?.verifiedCrmActivity.followUpsDone ?? 0}
              </h3>
              <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Verified CRM calls</p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <PhoneCall className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Staff Attendance</p>
              <h3 className="text-2xl font-black text-sky-700 mt-0.5">
                {companySummary?.staffOverview.present ?? 0} / {companySummary?.staffOverview.totalStaff ?? 0}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {companySummary?.staffOverview.late ?? 0} late arrivals
              </p>
            </div>
            <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Daily Reports</p>
              <h3 className="text-2xl font-black text-amber-700 mt-0.5">
                {companySummary?.reportsOverview.totalReportsSubmitted ?? 0}
              </h3>
              <p className="text-[10px] text-amber-600 mt-1 font-semibold">
                {companySummary?.reportsOverview.approved ?? 0} approved by managers
              </p>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Director Review & Approval Bar (If draft tasks are waiting) */}
      {isDraftRun && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Action Required: Director Approval for Daily Operational Plan
              </h4>
              <p className="text-[11px] text-amber-700">
                The AI engine has proposed prioritized tasks for today. Review the list below and click approve to publish assignments to counselors, telecallers, and placement officers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Optional Director instructions / review notes..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="text-xs h-8 w-64 bg-white"
            />
            <Button
              size="sm"
              disabled={approveMutation.isPending || !currentRunId}
              onClick={() => {
                if (currentRunId) {
                  approveMutation.mutate({
                    runId: currentRunId,
                    reviewNotes,
                  });
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{approveMutation.isPending ? "Approving..." : "Approve & Distribute Plan"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Department Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {["ALL", "COUNSELING", "TELECALLING", "ADMISSIONS", "PLACEMENT", "OPERATIONS"].map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedDept === dept
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Tasks Table / Card List */}
      <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3">Task Details</th>
                <th className="p-3">Assigned Staff</th>
                <th className="p-3">Department</th>
                <th className="p-3">Target / Measurable</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasksLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading today's operational plan...
                  </td>
                </tr>
              ) : !tasks || tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No tasks generated yet for this date. Click "Analyze & Propose Plan" above to create tasks from CRM reports.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{task.taskCode}</span>
                        {task.status === "DIRECTOR_REVIEW" && (
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                            Draft
                          </Badge>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 mt-0.5">{task.title}</p>
                      <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">{task.description}</p>
                    </td>

                    <td className="p-3">
                      <p className="font-semibold text-slate-900">
                        {task.assignedStaff?.user?.firstName} {task.assignedStaff?.user?.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{task.assignedStaff?.user?.email}</p>
                    </td>

                    <td className="p-3">
                      <Badge variant="outline" className="font-semibold text-[10px]">
                        {task.department}
                      </Badge>
                    </td>

                    <td className="p-3">
                      {task.targetQuantity ? (
                        <p className="font-mono font-bold text-indigo-700">
                          {task.completedQuantity || 0} / {task.targetQuantity}
                        </p>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      <p className="text-[10px] text-slate-400">Due: {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          task.priority === "CRITICAL"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          task.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : task.status === "IN_PROGRESS"
                            ? "bg-sky-100 text-sky-800"
                            : task.status === "BLOCKED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      {task.status !== "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              taskId: task.id,
                              status: "COMPLETED",
                              notes: "Marked completed by management",
                            })
                          }
                          className="text-xs text-emerald-700 hover:bg-emerald-50 h-7 px-2 font-semibold"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Add Custom Directive */}
      {showCustomTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              Add Director Directive / Operational Task
            </h3>

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold">Directive Title *</Label>
                <Input
                  placeholder="e.g. Call back 15 high-intent MBA enquiries"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Detailed Instructions *</Label>
                <textarea
                  rows={3}
                  placeholder="Specific requirements, expected script, and outcome..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Department</Label>
                  <select
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2"
                  >
                    {["COUNSELING", "TELECALLING", "ADMISSIONS", "PLACEMENT", "HR", "OPERATIONS"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Priority</Label>
                  <select
                    value={customPriority}
                    onChange={(e) => setCustomPriority(e.target.value as any)}
                    className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2"
                  >
                    {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Assign to Staff *</Label>
                  <select
                    value={customStaffId}
                    onChange={(e) => setCustomStaffId(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2 font-semibold"
                  >
                    <option value="">Select Staff Member...</option>
                    {staffList?.items?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.user?.firstName} {s.user?.lastName} ({s.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Target Quantity</Label>
                  <Input
                    type="number"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(e.target.value)}
                    className="text-xs h-8 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomTaskModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={createCustomTaskMutation.isPending || !customTitle.trim() || !customStaffId}
                onClick={() =>
                  createCustomTaskMutation.mutate({
                    title: customTitle.trim(),
                    description: customDesc.trim(),
                    department: customDept,
                    assignedStaffId: customStaffId,
                    priority: customPriority,
                    dueDate: new Date(new Date().setHours(18, 0, 0, 0)),
                    targetQuantity: Number(customQuantity) || undefined,
                  })
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                {createCustomTaskMutation.isPending ? "Assigning..." : "Assign Directive"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
