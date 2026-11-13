import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Check, RotateCcw } from "lucide-react";

interface PortalReportsTabProps {
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  isExporting: boolean;
  onExport: () => void;
  reports: any[];
  onReviewAction: (reportId: string, decision: "APPROVED" | "REVISION_REQUESTED" | "REJECTED") => void;
}

export const PortalReportsTab: React.FC<PortalReportsTabProps> = ({
  selectedDate,
  setSelectedDate,
  isExporting,
  onExport,
  reports,
  onReviewAction,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5"
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={isExporting}
          onClick={onExport}
          className="text-xs gap-1 border-slate-300 text-slate-700"
        >
          <Download className={`w-3.5 h-3.5 ${isExporting ? "animate-spin" : ""}`} />
          {isExporting ? "Exporting CSV..." : "Download Excel / CSV"}
        </Button>
      </div>

      <div className="space-y-3">
        {reports.length === 0 ? (
          <Card className="p-8 text-center text-slate-400 border-slate-200">
            No daily reports submitted for {selectedDate}.
          </Card>
        ) : (
          reports.map((report: any) => (
            <Card key={report.id} className="border-slate-200 shadow-sm p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {report.user.firstName} {report.user.lastName}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {report.user.roleCode}
                    </Badge>
                    <Badge
                      className={`text-xs ${
                        report.status === "APPROVED"
                          ? "bg-emerald-500 text-white"
                          : report.status === "REVISION_REQUESTED"
                          ? "bg-amber-500 text-white"
                          : report.status === "REJECTED"
                          ? "bg-red-500 text-white"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {report.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{report.user.email}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  {report.status !== "APPROVED" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onReviewAction(report.id, "APPROVED")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReviewAction(report.id, "REVISION_REQUESTED")}
                        className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs h-7 gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Revision
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Tamper-Proof Verified Stats Ribbon */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-lg my-3 text-xs border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Verified Calls</span>
                  <div className="font-bold text-slate-800">
                    {report.systemCallsTotal} total ({report.systemCallsConnected} connected)
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Verified Talk-Time</span>
                  <div className="font-bold text-blue-700">{Math.floor(report.systemTalkTimeSeconds / 60)} mins</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Attendance Punch</span>
                  <div className="font-bold text-emerald-700">
                    {Math.floor(report.systemAttendanceMinutes / 60)}h {report.systemAttendanceMinutes % 60}m
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">CRM Follow-Ups</span>
                  <div className="font-bold text-slate-800">{report.systemFollowUpsCompleted} completed</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">WhatsApp Messages</span>
                  <div className="font-bold text-slate-800">{report.systemMessagesSent} sent</div>
                </div>
              </div>

              <div className="text-xs space-y-1.5">
                <div>
                  <span className="font-semibold text-slate-700">Work Summary: </span>
                  <span className="text-slate-600">{report.workSummary}</span>
                </div>
                {report.tomorrowActionPlan && (
                  <div>
                    <span className="font-semibold text-slate-700">Tomorrow's Plan: </span>
                    <span className="text-slate-600">{report.tomorrowActionPlan}</span>
                  </div>
                )}
                {report.reviewerFeedback && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 mt-2">
                    <span className="font-semibold">Manager Feedback: </span>
                    {report.reviewerFeedback}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
