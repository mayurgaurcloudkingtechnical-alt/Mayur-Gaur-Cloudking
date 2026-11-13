import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneCall, Send, X, Volume2 } from "lucide-react";

interface PortalModalsProps {
  isLogCallModalOpen: boolean;
  setIsLogCallModalOpen: (open: boolean) => void;
  callForm: any;
  setCallForm: (form: any) => void;
  onLogCallSubmit: () => void;
  isLogCallPending: boolean;

  isSubmitReportModalOpen: boolean;
  setIsSubmitReportModalOpen: (open: boolean) => void;
  reportForm: any;
  setReportForm: (form: any) => void;
  prefilled: any;
  onSubmitReport: () => void;
  isSubmitReportPending: boolean;

  playingAudioUrl: string | null;
  setPlayingAudioUrl: (url: string | null) => void;
}

export const PortalModals: React.FC<PortalModalsProps> = ({
  isLogCallModalOpen,
  setIsLogCallModalOpen,
  callForm,
  setCallForm,
  onLogCallSubmit,
  isLogCallPending,

  isSubmitReportModalOpen,
  setIsSubmitReportModalOpen,
  reportForm,
  setReportForm,
  prefilled,
  onSubmitReport,
  isSubmitReportPending,

  playingAudioUrl,
  setPlayingAudioUrl,
}) => {
  return (
    <>
      {/* MODAL: LOG MANUAL CALL */}
      {isLogCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                Log Business Call Event
              </h3>
              <button onClick={() => setIsLogCallModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Contact / Lead Name</label>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  value={callForm.contactName}
                  onChange={(e) => setCallForm({ ...callForm, contactName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Phone Number (with Country Code)</label>
                <Input
                  placeholder="+91 9876543210"
                  value={callForm.customerPhone}
                  onChange={(e) => setCallForm({ ...callForm, customerPhone: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Direction</label>
                  <select
                    value={callForm.callType}
                    onChange={(e) => setCallForm({ ...callForm, callType: e.target.value as any })}
                    className="w-full mt-1 h-8 text-xs border border-slate-300 rounded px-2 bg-white"
                  >
                    <option value="OUTGOING">Outgoing</option>
                    <option value="INCOMING">Incoming</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Status</label>
                  <select
                    value={callForm.callStatus}
                    onChange={(e) => setCallForm({ ...callForm, callStatus: e.target.value as any })}
                    className="w-full mt-1 h-8 text-xs border border-slate-300 rounded px-2 bg-white"
                  >
                    <option value="CONNECTED">Connected</option>
                    <option value="MISSED">Missed</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="UNANSWERED">Unanswered</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Talk Time (Seconds)</label>
                  <Input
                    type="number"
                    value={callForm.talkTimeSeconds}
                    onChange={(e) => setCallForm({ ...callForm, talkTimeSeconds: Number(e.target.value) })}
                    className="mt-1 h-8 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Disposition</label>
                  <select
                    value={callForm.disposition}
                    onChange={(e) => setCallForm({ ...callForm, disposition: e.target.value })}
                    className="w-full mt-1 h-8 text-xs border border-slate-300 rounded px-2 bg-white"
                  >
                    <option value="INTERESTED">Interested</option>
                    <option value="ADMISSION_CONFIRMED">Admission Confirmed</option>
                    <option value="FOLLOW_UP">Follow-up Required</option>
                    <option value="NOT_INTERESTED">Not Interested</option>
                    <option value="CALLBACK">Callback Requested</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Call Summary & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key discussion points..."
                  value={callForm.notes}
                  onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                  className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsLogCallModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={onLogCallSubmit}
                  disabled={!callForm.contactName || !callForm.customerPhone || isLogCallPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLogCallPending ? "Logging..." : "Save Call Record"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT DAILY WORK REPORT */}
      {isSubmitReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                Submit Verified Daily Work Report
              </h3>
              <button onClick={() => setIsSubmitReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pre-filled verified stats notice */}
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
              <div className="font-bold">System Verified Data (Auto-Bundled):</div>
              <div className="grid grid-cols-3 gap-2 mt-1.5 font-mono">
                <div>Calls: {prefilled?.systemCallsTotal ?? 0} ({prefilled?.systemCallsConnected ?? 0} conn)</div>
                <div>Talk Time: {prefilled?.systemTalkTimeFormatted || "0s"}</div>
                <div>Punch: {prefilled?.systemAttendanceFormatted || "0h 0m"}</div>
              </div>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Detailed Summary of Work Completed *</label>
                <textarea
                  rows={3}
                  placeholder="Outline key customer engagements, admissions, or administrative items..."
                  value={reportForm.workSummary}
                  onChange={(e) => setReportForm({ ...reportForm, workSummary: e.target.value })}
                  className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Key Achievements / Conversions</label>
                <Input
                  placeholder="e.g. Closed 2 Full-Stack Web Dev admissions"
                  value={reportForm.achievements}
                  onChange={(e) => setReportForm({ ...reportForm, achievements: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Impediments / Blockers (if any)</label>
                <Input
                  placeholder="e.g. High lead drop-off on fee structure"
                  value={reportForm.impediments}
                  onChange={(e) => setReportForm({ ...reportForm, impediments: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Tomorrow's Action Plan</label>
                <Input
                  placeholder="e.g. Target 45 outreach calls for Cyber Security batch"
                  value={reportForm.tomorrowActionPlan}
                  onChange={(e) => setReportForm({ ...reportForm, tomorrowActionPlan: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsSubmitReportModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={onSubmitReport}
                  disabled={reportForm.workSummary.length < 10 || isSubmitReportPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitReportPending ? "Submitting..." : "Submit to Manager"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIO RECORDING PLAYBACK BANNER */}
      {playingAudioUrl && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-md w-full">
          <Volume2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-semibold truncate">Call Recording Stream</div>
            <audio src={playingAudioUrl} controls autoPlay className="w-full h-8 mt-1" />
          </div>
          <button
            onClick={() => setPlayingAudioUrl(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};
