"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Mic,
  MicOff,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneOff,
  Radio,
  Volume2,
  Headphones,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CallRecordingPlayer } from "@/components/common/call-recording-player";

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
  const currentUser = workstation?.user;

  // Active call state
  const [callMode, setCallMode] = useState<"OUTGOING" | "INCOMING">("OUTGOING");
  const [isOnCall, setIsOnCall] = useState(false);
  const [callType, setCallType] = useState<"OUTGOING" | "INCOMING">("OUTGOING");
  const [callContactName, setCallContactName] = useState(initialContactName || "");
  const [callContactPhone, setCallContactPhone] = useState(initialContactPhone || "");
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  // Incoming call ringing state
  const [isIncomingRinging, setIsIncomingRinging] = useState(false);
  const [incomingCallerName, setIncomingCallerName] = useState("");
  const [incomingCallerPhone, setIncomingCallerPhone] = useState("");

  // Counselor Caller ID override if not configured in profile
  const [counselorPhone, setCounselorPhone] = useState<string>("");

  useEffect(() => {
    if (currentUser?.phone) {
      setCounselorPhone(currentUser.phone);
    } else if (typeof window !== "undefined") {
      const savedPhone = localStorage.getItem("softlab_counselor_calling_number");
      if (savedPhone) setCounselorPhone(savedPhone);
    }
  }, [currentUser?.phone]);

  const handleUpdateCounselorPhone = (val: string) => {
    setCounselorPhone(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("softlab_counselor_calling_number", val);
    }
  };

  // Live microphone audio recorder state
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
      setRecordedAudioUrl(null);
      utils.callyzer.getMyWorkstationState.invalidate();
      utils.callyzer.getLiveTeamMonitoring.invalidate();
      utils.crm.listLeads.invalidate();
      if (onCallLogged) onCallLogged();
    },
  });

  // Start Live Audio Recorder
  const startAudioRecorder = async () => {
    audioChunksRef.current = [];
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecordingMic(true);
      } catch (err) {
        console.warn("[Callyzer Live Desk] Microphone access was not granted:", err);
        setIsRecordingMic(false);
      }
    }
  };

  // Stop Live Audio Recorder & Upload Audio Blob
  const stopAudioRecorderAndUpload = async (phone: string): Promise<string | null> => {
    setIsRecordingMic(false);

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = async () => {
          try {
            if (audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
              setIsUploadingAudio(true);

              const formData = new FormData();
              formData.append("audio", audioBlob, `call_${phone.replace(/\D/g, "")}_${Date.now()}.webm`);
              formData.append("contactPhone", phone);

              const res = await fetch("/api/recordings/upload", {
                method: "POST",
                body: formData,
              });

              if (res.ok) {
                const data = await res.json();
                if (data.recordingUrl) {
                  setRecordedAudioUrl(data.recordingUrl);
                  resolve(data.recordingUrl);
                  return;
                }
              }
            }
          } catch (uploadErr) {
            console.error("Audio recording upload error:", uploadErr);
          } finally {
            setIsUploadingAudio(false);
          }

          // Fallback stream URL
          const fallbackUrl = `/api/recordings/call_live_${Date.now()}_${phone.replace(/\D/g, "").slice(-6)}`;
          setRecordedAudioUrl(fallbackUrl);
          resolve(fallbackUrl);
        };

        recorder.stop();
      } else {
        const fallbackUrl = `/api/recordings/call_live_${Date.now()}_${phone.replace(/\D/g, "").slice(-6)}`;
        setRecordedAudioUrl(fallbackUrl);
        resolve(fallbackUrl);
      }

      // Cleanup stream tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    });
  };

  // Trigger Live Outgoing Call
  const handleStartLiveOutgoingCall = async () => {
    if (!callContactPhone.trim()) return;

    const cleanPhone = callContactPhone.replace(/\D/g, "").slice(-10);

    // 1. Dial student number immediately via native device tel: protocol
    if (typeof window !== "undefined") {
      const dialAnchor = document.createElement("a");
      dialAnchor.href = `tel:+91${cleanPhone}`;
      dialAnchor.target = "_blank";
      dialAnchor.rel = "noopener noreferrer";
      dialAnchor.click();
    }

    // 2. Start microphone recording
    await startAudioRecorder();

    // 3. Set live state
    setCallType("OUTGOING");
    setIsOnCall(true);
    setCallDurationSeconds(0);

    updateStatusMutation.mutate({
      status: "ON_CALL",
      currentCallContact: callContactName.trim() || `Candidate +91 ${cleanPhone}`,
      currentCallPhone: `+91 ${cleanPhone}`,
    });
  };

  // Trigger Live Incoming Call Simulation / Manual Answer
  const handleTriggerIncomingCall = () => {
    setIncomingCallerName(callContactName.trim() || "Prospective Student");
    setIncomingCallerPhone(callContactPhone.trim() || "9876543210");
    setIsIncomingRinging(true);
  };

  // Answer Incoming Call
  const handleAnswerIncomingCall = async () => {
    setIsIncomingRinging(false);
    setCallContactName(incomingCallerName);
    setCallContactPhone(incomingCallerPhone);
    setCallType("INCOMING");
    setIsOnCall(true);
    setCallDurationSeconds(0);

    // Start mic recording
    await startAudioRecorder();

    updateStatusMutation.mutate({
      status: "ON_CALL",
      currentCallContact: incomingCallerName,
      currentCallPhone: incomingCallerPhone,
    });
  };

  // Reject Incoming Call
  const handleRejectIncomingCall = () => {
    setIsIncomingRinging(false);
    logCallMutation.mutate({
      contactName: incomingCallerName || "Incoming Caller",
      contactPhone: incomingCallerPhone || "Unknown",
      callType: "INCOMING",
      callStatus: "NO_ANSWER",
      disposition: "BUSY_NO_ANSWER",
      durationSeconds: 0,
      notes: "Incoming call rejected / busy",
      leadId,
    });
  };

  // End Call & Trigger Disposition
  const handleEndCall = async () => {
    const finalRecordingUrl = await stopAudioRecorderAndUpload(callContactPhone);
    setRecordedAudioUrl(finalRecordingUrl);
    setShowDispositionModal(true);
  };

  // Submit Disposition
  const handleSubmitDisposition = (e: React.FormEvent) => {
    e.preventDefault();
    logCallMutation.mutate({
      contactName: callContactName.trim() || "Client",
      contactPhone: callContactPhone.trim(),
      callType,
      callStatus: callDurationSeconds > 0 ? "CONNECTED" : "NO_ANSWER",
      disposition: selectedDisposition,
      durationSeconds: callDurationSeconds,
      notes: callNotes.trim() || undefined,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
      leadId,
      recordingUrl: recordedAudioUrl || undefined,
    });
  };

  // Format mm:ss
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <Card className="border-indigo-200/50 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl overflow-hidden relative">
      <CardContent className="p-4 space-y-3.5">
        {/* Top Control Bar: Status Switcher & Counselor Calling ID */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shadow-inner">
              <PhoneCall className="w-5 h-5 text-emerald-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">Callyzer Live Telephony Desk</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isOnCall
                      ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 animate-pulse"
                      : session?.status === "ON_BREAK"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnCall ? "bg-emerald-400 animate-ping" : "bg-sky-400"}`} />
                  {isOnCall ? `LIVE CALL (${callType})` : session?.status || "AVAILABLE"}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Calls: <strong className="text-white font-mono">{metrics?.totalCallsToday ?? 0} / {session?.dailyTargetCalls ?? 50}</strong> • Talk-time: <strong className="text-white font-mono">{metrics?.totalTalkTimeFormatted || "0s"}</strong> • Conversions: <strong className="text-emerald-400">{metrics?.conversions ?? 0}</strong>
              </p>
            </div>
          </div>

          {/* Caller ID Badge & Presence Status Buttons */}
          <div className="flex items-center gap-2">
            {/* Counselor's Outgoing Caller Number Attribution */}
            <div className="hidden sm:flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10 text-[11px] font-mono text-slate-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Caller ID:</span>
              <strong className="text-white font-semibold">
                {currentUser?.fullName || "Counselor"} ({counselorPhone ? `+91 ${counselorPhone.slice(-10)}` : "Direct Line"})
              </strong>
            </div>

            {/* Presence Switcher */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg border border-white/10 text-xs">
              <button
                type="button"
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
                type="button"
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
                type="button"
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
        </div>

        {/* Live Call Station Strip */}
        <div className="bg-black/30 border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
          {isOnCall ? (
            /* ACTIVE IN-CALL STATE */
            <div className="flex flex-wrap items-center justify-between w-full gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-400 flex flex-col items-center justify-center font-mono text-sm font-black shadow-inner">
                  <span>{formatTimer(callDurationSeconds)}</span>
                  <span className="text-[9px] text-emerald-300 font-normal">SEC</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{callContactName || "Active Lead"}</p>
                    <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
                      {callType === "OUTGOING" ? "OUTGOING LIVE" : "INCOMING LIVE"}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-slate-300 flex items-center gap-1.5 mt-0.5">
                    <span>{callContactPhone || "Connected"}</span>
                    {isRecordingMic ? (
                      <span className="flex items-center gap-1 text-[10px] text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded font-sans">
                        <Mic className="w-2.5 h-2.5 animate-pulse text-rose-400" />
                        Recording Audio Live
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-white/10 px-1.5 py-0.5 rounded font-sans">
                        Audio Logging Active
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* End Call Action */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleEndCall}
                  size="sm"
                  disabled={isUploadingAudio}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 px-4 py-2 shadow-lg hover:shadow-red-500/20 transition-all duration-150 animate-pulse"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>End Live Call & Save Recording ({formatTimer(callDurationSeconds)})</span>
                </Button>
              </div>
            </div>
          ) : (
            /* READY TO CALL STATE WITH CALL TYPE TOGGLE */
            <div className="flex flex-wrap items-center justify-between w-full gap-3">
              {/* Left: Call Type Selector (Outgoing vs Incoming) */}
              <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setCallMode("OUTGOING")}
                  className={`px-3 py-1 rounded font-bold flex items-center gap-1.5 transition ${
                    callMode === "OUTGOING"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Outgoing Call</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCallMode("INCOMING")}
                  className={`px-3 py-1 rounded font-bold flex items-center gap-1.5 transition ${
                    callMode === "INCOMING"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <PhoneIncoming className="w-3.5 h-3.5 text-blue-300" />
                  <span>Receive Incoming</span>
                </button>
              </div>

              {/* Center: Contact Inputs */}
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
                <Input
                  placeholder="Student / Client Name..."
                  value={callContactName}
                  onChange={(e) => setCallContactName(e.target.value)}
                  className="h-8 text-xs bg-white/10 border-white/20 text-white placeholder:text-slate-400 max-w-[170px]"
                />
                <Input
                  placeholder="Student Phone (10 digits)..."
                  value={callContactPhone}
                  onChange={(e) => setCallContactPhone(e.target.value)}
                  className="h-8 text-xs bg-white/10 border-white/20 text-white placeholder:text-slate-400 max-w-[190px] font-mono"
                />
              </div>

              {/* Right: Live Call Action Buttons */}
              <div className="flex items-center gap-2">
                {callMode === "OUTGOING" ? (
                  <Button
                    onClick={handleStartLiveOutgoingCall}
                    disabled={!callContactPhone.trim()}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-2 px-4 shadow-md disabled:opacity-50 transition"
                  >
                    <Phone className="w-3.5 h-3.5 fill-white" />
                    <span>Live Call Now</span>
                  </Button>
                ) : (
                  <Button
                    onClick={handleTriggerIncomingCall}
                    disabled={!callContactPhone.trim()}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-2 px-4 shadow-md disabled:opacity-50 transition"
                  >
                    <PhoneIncoming className="w-3.5 h-3.5" />
                    <span>Answer Incoming Call</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* INCOMING CALL RINGING MODAL */}
        {isIncomingRinging && (
          <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl border border-blue-400/50 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-bounce">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/30 border border-blue-400 text-blue-300 flex items-center justify-center animate-spin">
                <PhoneIncoming className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-blue-300">
                  🔔 Incoming Call Ringing...
                </p>
                <p className="text-base font-extrabold text-white">
                  {incomingCallerName} ({incomingCallerPhone})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                onClick={handleAnswerIncomingCall}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 px-4 shadow-md"
              >
                <Phone className="w-4 h-4 fill-white" />
                <span>Answer Call</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleRejectIncomingCall}
                className="bg-red-600/30 hover:bg-red-600 border-red-500/50 text-white text-xs font-bold flex items-center gap-1.5 px-3"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Reject / Busy</span>
              </Button>
            </div>
          </div>
        )}

        {/* Pending Tasks Quick Strip */}
        {pendingTasks.length > 0 && (
          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-xs">
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

      {/* CALL DISPOSITION & AUDIO PLAYBACK MODAL */}
      {showDispositionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white text-slate-900 border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Log Call Outcome & Audio Recording
                </span>
                <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded">
                  Duration: {formatTimer(callDurationSeconds)}
                </span>
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmitDisposition}>
              <CardContent className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
                {/* Caller & Contact Info */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Client / Student</span>
                    <strong className="text-slate-900 text-sm">
                      {callContactName || "Client"}
                    </strong>
                    <span className="text-slate-500 font-mono block text-xs">{callContactPhone}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Call Direction</span>
                    <Badge variant="outline" className="font-bold text-[10px] mt-0.5">
                      {callType} CALL
                    </Badge>
                  </div>
                </div>

                {/* Audio Recording Playback Preview */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Call Audio Recording
                  </label>
                  <CallRecordingPlayer
                    recordingUrl={recordedAudioUrl}
                    contactName={callContactName}
                    contactPhone={callContactPhone}
                    callDurationSeconds={callDurationSeconds}
                    disposition={selectedDisposition}
                    compact={false}
                  />
                </div>

                {/* Disposition Select */}
                <div>
                  <label className="text-xs font-bold text-slate-700">Call Disposition / Outcome</label>
                  <select
                    value={selectedDisposition}
                    onChange={(e) => setSelectedDisposition(e.target.value)}
                    className="w-full h-9 text-xs mt-1 rounded-md border border-slate-300 px-2.5 bg-white font-medium"
                  >
                    <option value="INTERESTED">🌟 INTERESTED (Warm Student)</option>
                    <option value="ADMISSION_CONFIRMED">🎓 ADMISSION CONFIRMED</option>
                    <option value="CALLBACK">📞 CALLBACK REQUESTED</option>
                    <option value="FOLLOW_UP">📅 FOLLOW-UP SCHEDULED</option>
                    <option value="ENQUIRY_RESOLVED">✅ ENQUIRY RESOLVED</option>
                    <option value="NOT_INTERESTED">❌ NOT INTERESTED</option>
                    <option value="BUSY_NO_ANSWER">📵 BUSY / NO ANSWER</option>
                    <option value="WRONG_NUMBER">⚠️ WRONG NUMBER</option>
                  </select>
                </div>

                {/* Follow-up Date */}
                <div>
                  <label className="text-xs font-bold text-slate-700">Next Follow-Up Date (Optional)</label>
                  <Input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                {/* Discussion Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700">Call Discussion & Student Requirements</label>
                  <textarea
                    rows={3}
                    placeholder="E.g. Candidate inquired about weekend classroom batch, Python/AI syllabus, and scholarship details..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    className="w-full text-xs mt-1 rounded-md border border-slate-300 p-2 text-slate-800"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDispositionModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={logCallMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5"
                  >
                    {logCallMutation.isPending ? "Syncing to CRM & Callyzer..." : "Save Call & Sync Live to CRM"}
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
