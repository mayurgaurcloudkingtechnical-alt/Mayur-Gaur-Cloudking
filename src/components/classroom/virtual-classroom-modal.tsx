"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  MessageSquare,
  Users,
  Hand,
  PhoneOff,
  Radio,
  Sparkles,
  ShieldCheck,
  Send,
  AlertCircle,
  Clock,
  Settings,
  Volume2,
} from "lucide-react";

interface VirtualClassroomModalProps {
  classId: string;
  onClose: () => void;
  isHost?: boolean;
}

export function VirtualClassroomModal({ classId, onClose, isHost = false }: VirtualClassroomModalProps) {
  const [tokenData, setTokenData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio / Video / Screen Share states
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "participants" | "chat">("video");

  // Chat states
  const [chatMessages, setChatMessages] = useState<
    { sender: string; text: string; time: string; isHost?: boolean }[]
  >([]);
  const [chatInput, setChatInput] = useState("");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const requestTokenMutation = api.classroom.requestJoinToken.useMutation({
    onSuccess: (data) => {
      setTokenData(data);
      setErrorMsg(null);
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to obtain classroom authorization token.");
    },
  });

  const heartbeatMutation = api.classroom.sendHeartbeat.useMutation();
  const sessionEventMutation = api.classroom.logSessionEvent.useMutation();
  const startSessionMutation = api.classroom.startClassSession.useMutation();
  const endSessionMutation = api.classroom.endClassSession.useMutation();

  // 1. Initial Access Authorization Request
  useEffect(() => {
    requestTokenMutation.mutate({ classId });
  }, [classId]);

  // 2. Initialize Media Devices (Camera & Microphone) upon successful token acquisition
  useEffect(() => {
    if (!tokenData) return;

    let isCancelled = false;

    async function initMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          if (!isCancelled) {
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          }
        }
      } catch (err: any) {
        console.warn("[WebRTC Media] Local camera/mic permission not granted:", err.message);
      }
    }

    initMedia();

    // Log join event
    sessionEventMutation.mutate({ classId, eventType: "JOINED" });

    // 3. Heartbeat Loop every 30 seconds for duration & attendance tracking
    const heartbeatTimer = setInterval(() => {
      heartbeatMutation.mutate({ classId, deltaSeconds: 30 });
    }, 30000);

    return () => {
      isCancelled = true;
      clearInterval(heartbeatTimer);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      sessionEventMutation.mutate({ classId, eventType: "LEFT" });
    };
  }, [tokenData, classId]);

  // Toggle Microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
      sessionEventMutation.mutate({
        classId,
        eventType: "MIC_TOGGLED",
        metadata: { enabled: !micEnabled },
      });
    }
  };

  // Toggle Camera
  const toggleCam = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !camEnabled;
      });
      setCamEnabled(!camEnabled);
      sessionEventMutation.mutate({
        classId,
        eventType: "CAM_TOGGLED",
        metadata: { enabled: !camEnabled },
      });
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.warn("Screen share cancelled:", err);
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      setIsScreenSharing(false);
    }
  };

  // Toggle Hand Raise
  const toggleHandRaise = () => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    sessionEventMutation.mutate({
      classId,
      eventType: "HAND_RAISED",
      metadata: { raised: nextState },
    });
  };

  // Send In-Class Chat Message
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      sender: tokenData?.payload?.userName || "Me",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      isHost: tokenData?.payload?.isHost,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");

    sessionEventMutation.mutate({
      classId,
      eventType: "CHAT_SENT",
      metadata: { message: newMsg.text },
    });
  };

  // Host Ends Class
  const handleEndClass = async () => {
    if (confirm("Are you sure you want to end this live class for all participants? Student attendance and recordings will be finalized automatically.")) {
      await endSessionMutation.mutateAsync({ classId });
      onClose();
    }
  };

  if (errorMsg) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 text-white text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">Classroom Access Blocked</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{errorMsg}</p>
          <Button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
        <div className="text-center space-y-3 text-white">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wide">Authorizing Live Classroom Access...</p>
          <p className="text-xs text-slate-400">Verifying batch allocation, enrollment status, and session token</p>
        </div>
      </div>
    );
  }

  const { classDetails, payload } = tokenData;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Navigation & Status Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Radio className="w-4 h-4 animate-pulse text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white line-clamp-1">{classDetails.title}</h2>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] uppercase font-mono">
                {classDetails.batchCode}
              </Badge>
              {classDetails.isRecordingEnabled && (
                <span className="flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  REC
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {classDetails.courseTitle} • Faculty: {classDetails.trainerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {payload.isHost && (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
              Faculty Host
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveTab(activeTab === "participants" ? "video" : "participants")}
            className={`h-8 text-xs gap-1.5 border-slate-700 ${activeTab === "participants" ? "bg-slate-800 text-white" : "bg-slate-900 text-slate-300"}`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Roster</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveTab(activeTab === "chat" ? "video" : "chat")}
            className={`h-8 text-xs gap-1.5 border-slate-700 ${activeTab === "chat" ? "bg-slate-800 text-white" : "bg-slate-900 text-slate-300"}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chat</span>
            {chatMessages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-[10px]">
                {chatMessages.length}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            onClick={payload.isHost ? handleEndClass : onClose}
            className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5 font-bold shadow-sm"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>{payload.isHost ? "End Class" : "Leave"}</span>
          </Button>
        </div>
      </div>

      {/* Main Classroom Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Video Stage */}
        <div className="flex-1 bg-black p-4 flex flex-col justify-center items-center relative overflow-hidden">
          {isScreenSharing ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <video
                ref={screenShareVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain rounded-lg"
              />
              <div className="absolute top-6 left-6 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                <ScreenShare className="w-4 h-4 text-emerald-400" />
                <span>Screen Presentation Active</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl h-full max-h-[70vh]">
              {/* Speaker / Trainer Stage */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between relative shadow-xl">
                <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{classDetails.trainerName} (Faculty Lead)</span>
                </div>
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900">
                  <div className="text-center space-y-2">
                    <div className="w-20 h-20 rounded-full bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 font-bold text-2xl flex items-center justify-center mx-auto">
                      {classDetails.trainerName.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-xs font-semibold text-slate-300">{classDetails.trainerName}</p>
                    <p className="text-[10px] text-slate-500">Live Stage Audio/Video Active</p>
                  </div>
                </div>
              </div>

              {/* My Stage (Camera Stream) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between relative shadow-xl">
                <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${camEnabled ? "bg-emerald-400" : "bg-rose-400"}`} />
                  <span>{payload.userName} (You)</span>
                </div>
                {camEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-950">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 font-bold text-xl flex items-center justify-center mx-auto">
                        {payload.userName.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="text-xs text-slate-400">Camera Off</p>
                    </div>
                  </div>
                )}
                {handRaised && (
                  <div className="absolute bottom-3 right-3 bg-amber-500 text-slate-950 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 animate-bounce">
                    <Hand className="w-3.5 h-3.5" />
                    <span>Hand Raised</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Drawer (Participants or Chat) */}
        {activeTab !== "video" && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-xs text-white uppercase tracking-wider">
                {activeTab === "participants" ? "Class Roster" : "Class Discussion"}
              </span>
              <button
                onClick={() => setActiveTab("video")}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {activeTab === "participants" ? (
              <div className="flex-1 p-3 space-y-2 overflow-y-auto text-xs">
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">{classDetails.trainerName}</span>
                    <span className="text-[10px] text-amber-400">Faculty Instructor</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">Host</Badge>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">{payload.userName} (You)</span>
                    <span className="text-[10px] text-slate-400">Batch {classDetails.batchCode}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {micEnabled ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-rose-400" />}
                    {camEnabled ? <Video className="w-3 h-3 text-emerald-400" /> : <VideoOff className="w-3 h-3 text-rose-400" />}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 p-3 space-y-3 overflow-y-auto text-xs">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-slate-500 text-[11px] pt-8">
                      No messages yet. Send a question or note to the class.
                    </p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className={msg.isHost ? "font-bold text-amber-400" : "font-semibold text-slate-300"}>
                            {msg.sender}
                          </span>
                          <span>{msg.time}</span>
                        </div>
                        <p className="bg-slate-800/80 rounded-lg p-2 text-slate-200 text-xs break-words">
                          {msg.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={sendChatMessage} className="p-2.5 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type message to class..."
                    className="flex-1 bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                  <Button type="submit" size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white px-3">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-3 flex items-center justify-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={toggleMic}
          className={`h-10 px-4 rounded-xl border text-xs font-semibold gap-2 ${micEnabled ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-white" : "bg-rose-500/20 border-rose-500/40 text-rose-300"}`}
        >
          {micEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-rose-400" />}
          <span>{micEnabled ? "Mute" : "Unmute"}</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={toggleCam}
          className={`h-10 px-4 rounded-xl border text-xs font-semibold gap-2 ${camEnabled ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-white" : "bg-rose-500/20 border-rose-500/40 text-rose-300"}`}
        >
          {camEnabled ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4 text-rose-400" />}
          <span>{camEnabled ? "Stop Video" : "Start Video"}</span>
        </Button>

        {payload.canShareScreen && (
          <Button
            size="sm"
            variant="outline"
            onClick={toggleScreenShare}
            className={`h-10 px-4 rounded-xl border text-xs font-semibold gap-2 ${isScreenSharing ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"}`}
          >
            <ScreenShare className="w-4 h-4" />
            <span>{isScreenSharing ? "Stop Sharing" : "Share Screen"}</span>
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={toggleHandRaise}
          className={`h-10 px-4 rounded-xl border text-xs font-semibold gap-2 ${handRaised ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"}`}
        >
          <Hand className="w-4 h-4" />
          <span>{handRaised ? "Lower Hand" : "Raise Hand"}</span>
        </Button>
      </div>
    </div>
  );
}
