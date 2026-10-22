"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { api as trpc } from "@/lib/trpc/react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Edit3,
  Users,
  MessageSquare,
  Hand,
  PhoneOff,
  CheckCircle2,
  Sparkles,
  Download,
  Share2,
  Youtube,
  Clock,
  Layers,
  Palette,
  Eraser,
  RotateCcw,
  Send,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { SKILLVERSE_YOUTUBE_CHANNEL } from "@/server/services/skillverse.service";

interface LiveClassroomProps {
  sessionCode?: string;
  userRole?: "TEACHER" | "STUDENT";
  userName?: string;
  userEnrollmentCode?: string;
  onLeave?: () => void;
}

export function SkillverseLiveClassroom({
  sessionCode = "SV-LIVE-DEMO",
  userRole = "TEACHER",
  userName = "Faculty Instructor",
  userEnrollmentCode = "SV-STU-DEMO",
  onLeave,
}: LiveClassroomProps) {
  // Media states
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);

  // Active view & tools
  const [activeTab, setActiveTab] = useState<"chat" | "participants" | "notes">("chat");
  const [penColor, setPenColor] = useState("#FFFFFF");
  const [penSize, setPenSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  // Chat messages
  const [chatMessages, setChatMessages] = useState<
    { sender: string; role: string; text: string; time: string }[]
  >([
    {
      sender: "System",
      role: "SYSTEM",
      text: "Welcome to the SLG SKILLVERSE Live Interactive Classroom! Attendance is automatically recorded upon entering.",
      time: "Just now",
    },
  ]);
  const [messageInput, setMessageInput] = useState("");

  // Post-class YouTube publication package
  const [completedPackage, setCompletedPackage] = useState<any | null>(null);
  const [isEndingSession, setIsEndingSession] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // TRPC queries & mutations
  const joinClassMutation = trpc.skillverse.joinLiveClassSession.useMutation();
  const endClassMutation = trpc.skillverse.endLiveClassAndPublishToYouTube.useMutation({
    onSuccess: (res) => {
      setCompletedPackage(res.youtubeMetadata);
      setIsEndingSession(false);
    },
  });

  // Auto-record attendance on mount if student
  useEffect(() => {
    if (userRole === "STUDENT" && userEnrollmentCode) {
      joinClassMutation.mutate({
        sessionCode,
        enrollmentCode: userEnrollmentCode,
        studentName: userName,
      });
    }
  }, [sessionCode, userRole, userEnrollmentCode, userName]);

  // Camera setup
  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (active) {
            streamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          }
        }
      } catch (err) {
        console.warn("Camera/Mic not accessible in this browser session:", err);
      }
    }

    if (isCameraOn) {
      initCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isCameraOn]);

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => (track.enabled = !isMicOn));
    }
    setIsMicOn((v) => !v);
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
          });
          screenStreamRef.current = screenStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          setIsScreenSharing(true);
          screenStream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            if (localVideoRef.current && streamRef.current) {
              localVideoRef.current.srcObject = streamRef.current;
            }
          };
        }
      } catch (err) {
        console.warn("Screen share cancelled:", err);
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localVideoRef.current && streamRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }
      setIsScreenSharing(false);
    }
  };

  // Whiteboard drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set background to chalkboard dark slate
    ctx.fillStyle = "#0B1528";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [isWhiteboardActive]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = penSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isEraser) {
      ctx.strokeStyle = "#0B1528";
      ctx.lineWidth = penSize * 3;
    } else {
      ctx.strokeStyle = penColor;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0B1528";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadWhiteboardNotes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `skillverse-whiteboard-${sessionCode}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: userName,
        role: userRole,
        text: messageInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setMessageInput("");
  };

  const handleEndClass = async () => {
    if (confirm("End this live class session and trigger YouTube upload & playlist generation?")) {
      setIsEndingSession(true);
      endClassMutation.mutate({
        sessionCode,
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-white font-sans overflow-hidden">
      {/* Top Session Broadcast Bar */}
      <div className="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[11px] font-black uppercase tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" /> LIVE CLASSROOM
          </span>
          <div className="hidden sm:block">
            <span className="font-extrabold text-xs text-slate-200">Session: {sessionCode}</span>
            <span className="text-slate-500 text-xs ml-2">• In-Platform Studio (No 3rd Party Software)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {userRole === "TEACHER" && (
            <button
              type="button"
              onClick={handleEndClass}
              disabled={isEndingSession}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>{isEndingSession ? "Processing..." : "End Class & Publish"}</span>
            </button>
          )}

          {userRole === "STUDENT" && (
            <button
              type="button"
              onClick={() => setHasRaisedHand((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                hasRaisedHand
                  ? "bg-amber-500 text-slate-950 font-black animate-bounce"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span>{hasRaisedHand ? "Hand Raised!" : "Raise Hand"}</span>
            </button>
          )}

          {onLeave && (
            <button
              type="button"
              onClick={onLeave}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
            >
              Exit Studio
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Stage Center Area: Video or Interactive Whiteboard */}
        <div className="flex-1 flex flex-col bg-slate-900/50 p-3 sm:p-4 gap-3 relative overflow-hidden">
          {/* Main Stage Screen */}
          <div className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-2xl">
            {isWhiteboardActive ? (
              /* Digital Whiteboard Studio */
              <div className="w-full h-full flex flex-col relative">
                {/* Whiteboard Controls Ribbon */}
                <div className="h-11 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5 text-emerald-400" /> Digital Whiteboard
                    </span>

                    {/* Pen Colors */}
                    <div className="flex items-center gap-1.5 ml-2 border-l border-slate-700 pl-2">
                      {["#FFFFFF", "#FDE047", "#38BDF8", "#4ADE80", "#F43F5E"].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => {
                            setPenColor(col);
                            setIsEraser(false);
                          }}
                          style={{ backgroundColor: col }}
                          className={`w-5 h-5 rounded-full border ${
                            penColor === col && !isEraser
                              ? "border-white ring-2 ring-emerald-400 scale-110"
                              : "border-transparent opacity-80"
                          } cursor-pointer transition-all`}
                          title={`Color ${col}`}
                        />
                      ))}
                    </div>

                    {/* Brush Size */}
                    <div className="flex items-center gap-1 ml-2 border-l border-slate-700 pl-2">
                      {[2, 4, 8].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setPenSize(size)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            penSize === size && !isEraser
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {size === 2 ? "Fine" : size === 4 ? "Med" : "Bold"}
                        </button>
                      ))}
                    </div>

                    {/* Eraser */}
                    <button
                      type="button"
                      onClick={() => setIsEraser((v) => !v)}
                      className={`ml-2 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                        isEraser
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <Eraser className="w-3.5 h-3.5" /> Eraser
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearWhiteboard}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1"
                      title="Clear Board"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Clear
                    </button>
                    <button
                      type="button"
                      onClick={downloadWhiteboardNotes}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                      title="Save notes as image"
                    >
                      <Download className="w-3.5 h-3.5" /> Save Notes (PNG)
                    </button>
                  </div>
                </div>

                {/* Canvas Board */}
                <div className="flex-1 w-full h-full relative cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    width={1280}
                    height={720}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-full block touch-none"
                  />
                </div>
              </div>
            ) : (
              /* Live Camera / Screen Share Video Feed */
              <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted={userRole === "TEACHER"}
                  className="w-full h-full object-contain"
                />

                {!isCameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#16A34A] to-[#0052CC] flex items-center justify-center text-white font-black text-2xl shadow-xl">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-extrabold text-sm text-slate-200">{userName}</span>
                    <span className="text-xs text-slate-500">Camera is paused</span>
                  </div>
                )}

                {/* Floating Educator Watermark */}
                <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold text-white">{userName}</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">
                    ({userRole})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Teacher & Student Broadcast Controls Bar */}
          <div className="h-16 px-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-3 shrink-0 shadow-lg">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                isMicOn
                  ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                  : "bg-red-500/20 text-red-400 border border-red-500/50"
              }`}
              title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setIsCameraOn((v) => !v)}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                isCameraOn
                  ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                  : "bg-red-500/20 text-red-400 border border-red-500/50"
              }`}
              title={isCameraOn ? "Stop Camera" : "Start Camera"}
            >
              {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {userRole === "TEACHER" && (
              <>
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    isScreenSharing
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                  }`}
                  title="Share Screen"
                >
                  {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsWhiteboardActive((v) => !v)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    isWhiteboardActive
                      ? "bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-lg"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isWhiteboardActive ? "Hide Whiteboard" : "Open Digital Whiteboard"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sidebar: Chat, Participant Roster & YouTube Auto-Publish Status */}
        <div className="w-full lg:w-88 xl:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0">
          {/* Tab Selection */}
          <div className="h-12 border-b border-slate-800 grid grid-cols-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "chat"
                  ? "border-emerald-500 text-emerald-400 bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat & Doubts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("participants")}
              className={`flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "participants"
                  ? "border-emerald-500 text-emerald-400 bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Roster
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className={`flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "notes"
                  ? "border-emerald-500 text-emerald-400 bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Youtube className="w-3.5 h-3.5 text-red-400" /> YouTube Sync
            </button>
          </div>

          {/* Tab 1: Live Chat & Doubts */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl text-xs space-y-1 ${
                      msg.role === "SYSTEM"
                        ? "bg-blue-950/60 border border-blue-800/50 text-blue-200"
                        : msg.role === "TEACHER"
                        ? "bg-emerald-950/60 border border-emerald-800/50 text-emerald-100"
                        : "bg-slate-800 border border-slate-700 text-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span className="flex items-center gap-1">
                        {msg.sender}
                        {msg.role === "TEACHER" && (
                          <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] uppercase">
                            Faculty
                          </span>
                        )}
                      </span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question or type a doubt..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Participants Roster & Auto Attendance */}
          {activeTab === "participants" && (
            <div className="flex-1 p-4 space-y-3 overflow-y-auto text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-extrabold text-slate-300">Connected Students</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                  Auto-Attendance Active
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                      {userName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white">{userName} (You)</div>
                      <div className="text-[10px] text-emerald-400 font-mono font-bold uppercase">{userRole}</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      A
                    </div>
                    <div>
                      <div className="font-bold text-white">Aarav Sharma (SV-STU-2026-101)</div>
                      <div className="text-[10px] text-slate-400">Class 10 Foundation • Joined 4:02 PM</div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                    PRESENT
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                      P
                    </div>
                    <div>
                      <div className="font-bold text-white">Priya Patel (SV-STU-2026-102)</div>
                      <div className="text-[10px] text-slate-400">Class 10 Foundation • Joined 4:05 PM</div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                    PRESENT
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: YouTube Auto-Publish & SEO Configuration */}
          {activeTab === "notes" && (
            <div className="flex-1 p-4 space-y-4 overflow-y-auto text-xs">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-950/60 to-slate-900 border border-red-800/40 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-extrabold text-xs uppercase tracking-wider">
                  <Youtube className="w-4 h-4 text-red-500" /> YouTube Channel Automation
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Upon lecture completion, this session is automatically formatted with structured
                  chapter markers, SEO keywords, dynamic high-res SVG thumbnail, and assigned into the
                  corresponding subject playlist on the official channel.
                </p>
                <a
                  href={SKILLVERSE_YOUTUBE_CHANNEL.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 underline"
                >
                  <span>Channel: {SKILLVERSE_YOUTUBE_CHANNEL.customHandle}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {completedPackage ? (
                <div className="p-4 rounded-2xl bg-slate-800 border border-emerald-500/50 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> YouTube Publication Ready!
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Target Playlist
                    </label>
                    <div className="p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-300">
                      {completedPackage.playlistName}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      SEO Video Title
                    </label>
                    <div className="p-2 rounded-lg bg-slate-950 text-xs font-bold text-white">
                      {completedPackage.title}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      High-Ranking Tags ({completedPackage.tags?.length || 0})
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {completedPackage.tags?.map((t: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 text-[10px] text-slate-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Dynamic 1280x720 Thumbnail Preview
                    </label>
                    <div
                      className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950"
                      dangerouslySetInnerHTML={{ __html: completedPackage.thumbnailSvg }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `TITLE:\n${completedPackage.title}\n\nTAGS:\n${completedPackage.tags?.join(", ")}\n\nDESCRIPTION:\n${completedPackage.description}`
                      );
                      alert("Complete YouTube package copied to clipboard!");
                    }}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Copy Complete YouTube Package
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-center space-y-2">
                  <Clock className="w-6 h-6 text-slate-500 mx-auto" />
                  <div className="font-bold text-slate-300 text-xs">Session In Progress</div>
                  <p className="text-[11px] text-slate-500">
                    The YouTube upload package and playlist sorting trigger automatically when you click &quot;End Class &amp; Publish&quot;.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
