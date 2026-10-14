"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/trpc/react";
import {
  PhoneCall,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  Coffee,
  UserCheck,
  Send,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  ListTodo,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CallyzerWorkstationWidgetProps {
  initialContactName?: string;
  initialContactPhone?: string;
  leadId?: string;
  onCallLogged?: () => void;
}

export function CallyzerWorkstationWidget({
  initialContactName,
  initialContactPhone,
  leadId,
  onCallLogged,
}: CallyzerWorkstationWidgetProps) {
  const utils = api.useUtils();

  // Fetch current user workstation state
  const { data: workstation, refetch } = api.callyzer.getMyWorkstationState.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const session = workstation?.session;
  const metrics = workstation?.todayMetrics;
  const pendingTasks = workstation?.pendingTasks || [];

  // Active call state
  const [isOnCall, setIsOnCall] = useState(false);
  const [callContactName, setCallContactName] = useState(initialContactName || "");
  const [callContactPhone, setCallContactPhone] = useState(initialContactPhone || "");
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  // Disposition dialog state
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [selectedDisposition, setSelectedDisposition] = useState("INTERESTED");
  const [callNotes, setCallNotes] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");

  // Break state
  const [breakReason, setBreakReason] = useState("Lunch");

  // Live timer ticker
  useEffect(() => {
    let interval: any;
    if (isOnCall) {
      interval = setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOnCall]);

  // Sync state with backend session on load
  useEffect(() => {
    if (session?.status === "ON_CALL") {
      setIsOnCall(true);
      if (session.currentCallContact) setCallContactName(session.currentCallContact);
      if (session.currentCallPhone) setCallContactPhone(session.currentCallPhone);
      if (session.currentCallDurationSeconds) setCallDurationSeconds(session.currentCallDurationSeconds);
    } else {
      setIsOnCall(false);
    }
  }, [session?.status]);

  // Mutations
  const updateStatusMutation = api.callyzer.updateLiveStatus.useMutation({
    onSuccess: () => {
      utils.callyzer.getMyWorkstationState.invalidate();
      utils.callyzer.getLiveTeamMonitoring.invalidate();
    },
  });

  const logCallMutation = api.callyzer.logCallActivity.useMutation({
    onSuccess: () => {
      setShowDispositionModal(false);
      setIsOnCall(false);
      setCallDurationSeconds(0);
      setCallContactName("");
      setCallContactPhone("");
      setCallNotes("");
      setNextFollowUpDate("");
      utils.callyzer.getMyWorkstationState.invalidate();
      utils.callyzer.getLiveTeamMonitoring.invalidate();
      utils.crm.listLeads.invalidate();
      if (onCallLogged) onCallLogged();
    },
  });

  // Start call handler
  const handleStartCall = () => {
    if (!callContactPhone.trim()) return;
    setIsOnCall(true);
    setCallDurationSeconds(0);
    updateStatusMutation.mutate({
      status: "ON_CALL",
      currentCallContact: callContactName.trim() || "Active Lead",
      currentCallPhone: callContactPhone.trim(),
    });
  };

  // End call & trigger disposition
  const handleEndCall = () => {
    setShowDispositionModal(true);
  };

  // Submit disposition
  const handleSubmitDisposition = (e: React.FormEvent) => {
    e.preventDefault();
    logCallMutation.mutate({
      contactName: callContactName.trim() || "Client",
      contactPhone: callContactPhone.trim(),
      callType: "OUTGOING",
      callStatus: callDurationSeconds > 0 ? "CONNECTED" : "NO_ANSWER",
      disposition: selectedDisposition,
      durationSeconds: callDurationSeconds,
      notes: callNotes.trim() || undefined,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
      leadId,
    });
  };

  // Format mm:ss
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <Card className="border-indigo-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Top Control Bar: Status Switcher & Today's Target Meter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">Callyzer Live Desk</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isOnCall
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : session?.status === "ON_BREAK"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnCall ? "bg-emerald-400 animate-ping" : "bg-sky-400"}`} />
                  {isOnCall ? "ON CALL (LIVE)" : session?.status || "AVAILABLE"}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Calls: <strong className="text-white font-mono">{metrics?.totalCallsToday ?? 0} / {session?.dailyTargetCalls ?? 50}</strong> • Talk-time: <strong className="text-white font-mono">{metrics?.totalTalkTimeFormatted || "0s"}</strong> • Conversions: <strong className="text-emerald-400">{metrics?.conversions ?? 0}</strong>
              </p>
            </div>
          </div>

          {/* Presence Status Quick Switcher Buttons */}
          <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => updateStatusMutation.mutate({ status: "AVAILABLE" })}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                session?.status === "AVAILABLE" && !isOnCall
                  ? "bg-sky-500 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Available
            </button>

            <button
              onClick={() => updateStatusMutation.mutate({ status: "ON_BREAK", breakReason })}
              className={`px-2.5 py-1 rounded font-semibold transition flex items-center gap-1 ${
                session?.status === "ON_BREAK"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Coffee className="w-3 h-3" />
              <span>Break</span>
            </button>

            <button
              onClick={() => updateStatusMutation.mutate({ status: "OFFLINE" })}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                session?.status === "OFFLINE"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Offline
            </button>
          </div>
        </div>

        {/* Live Call Station Strip */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
          {isOnCall ? (
            /* ACTIVE IN-CALL STATE */
            <div className="flex flex-wrap items-center justify-between w-full gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-mono text-xs font-black shadow-inner">
                  {formatTimer(callDurationSeconds)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{callContactName || "Active Lead"}</p>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                      In-Progress
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-300">{callContactPhone || "Dialing..."}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleEndCall}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>End Call & Log Outcome ({formatTimer(callDurationSeconds)})</span>
                </Button>
              </div>
            </div>
          ) : (
            /* READY TO CALL STATE */
            <div className="flex flex-wrap items-center justify-between w-full gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                <Input
                  placeholder="Contact Name..."
                  value={callContactName}
                  onChange={(e) => setCallContactName(e.target.value)}
                  className="h-8 text-xs bg-white/10 border-white/20 text-white placeholder:text-slate-400 max-w-[160px]"
                />
                <Input
                  placeholder="Phone Number (e.g. 9876543210)..."
                  value={callContactPhone}
                  onChange={(e) => setCallContactPhone(e.target.value)}
                  className="h-8 text-xs bg-white/10 border-white/20 text-white placeholder:text-slate-400 max-w-[180px] font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleStartCall}
                  disabled={!callContactPhone.trim()}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Call Timer</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pending To-Do Mini Drawer */}
        {pendingTasks.length > 0 && (
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1 font-medium">
              <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pending Operational Tasks ({pendingTasks.length}):</span>
            </span>
            <div className="flex items-center gap-2 overflow-x-auto max-w-md">
              {pendingTasks.slice(0, 3).map((t: any) => (
                <span
                  key={t.id}
                  className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-white truncate max-w-[140px]"
                  title={t.title}
                >
                  {t.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* CALL DISPOSITION & NOTES MODAL */}
      {showDispositionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white text-slate-900 border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Log Call Outcome & Next Steps
                </span>
                <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                  Duration: {formatTimer(callDurationSeconds)}
                </span>
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmitDisposition}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Contact</p>
                  <p className="text-xs font-bold text-slate-900">
                    {callContactName || "Client"} ({callContactPhone})
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Call Disposition</label>
                  <select
                    value={selectedDisposition}
                    onChange={(e) => setSelectedDisposition(e.target.value)}
                    className="w-full h-8 text-xs mt-1 rounded-md border border-slate-300 px-2 bg-white"
                  >
                    <option value="INTERESTED">🌟 INTERESTED (Warm Lead)</option>
                    <option value="ADMISSION_CONFIRMED">🎓 ADMISSION CONFIRMED</option>
                    <option value="CALLBACK">📞 CALLBACK REQUESTED</option>
                    <option value="FOLLOW_UP">📅 FOLLOW-UP SCHEDULED</option>
                    <option value="NOT_INTERESTED">❌ NOT INTERESTED</option>
                    <option value="BUSY_NO_ANSWER">📵 BUSY / NO ANSWER</option>
                    <option value="WRONG_NUMBER">⚠️ WRONG NUMBER</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Next Follow-Up Date (Optional)</label>
                  <Input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Call Discussion & Student Objections</label>
                  <textarea
                    rows={3}
                    placeholder="E.g. Student inquired about MERN Stack course fees and installment options..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    className="w-full text-xs mt-1 rounded-md border border-slate-300 p-2"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="submit"
                    disabled={logCallMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold w-full"
                  >
                    {logCallMutation.isPending ? "Syncing to CRM..." : "Save Call & Sync Live to CRM"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </Card>
  );
}
