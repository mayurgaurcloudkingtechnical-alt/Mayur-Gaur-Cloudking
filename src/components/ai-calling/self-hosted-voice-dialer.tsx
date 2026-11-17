"use client";

import React, { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2, Sparkles, Send, Smartphone } from "lucide-react";

interface Turn {
  role: "SIA" | "STUDENT";
  text: string;
}

export interface SelfHostedVoiceDialerProps {
  leadId?: string;
  callLogId?: string;
  studentName?: string;
  phone?: string;
  courseTitle?: string;
}

export function SelfHostedVoiceDialer({
  leadId = "",
  callLogId: initialCallLogId = "",
  studentName = "Student",
  phone = "",
  courseTitle = "Full Stack, AI & Cloud Programs",
}: SelfHostedVoiceDialerProps) {
  const [status, setStatus] = useState<"IDLE" | "CONNECTING" | "LISTENING" | "THINKING" | "SPEAKING" | "ENDED">("IDLE");
  const [callLogId, setCallLogId] = useState(initialCallLogId);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [textInput, setTextInput] = useState("");
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [language, setLanguage] = useState<"hi-IN" | "en-IN">("hi-IN");

  const recognitionRef = useRef<any>(null);
  const turnsRef = useRef<Turn[]>([]);
  const callLogIdRef = useRef<string>(initialCallLogId);
  const statusRef = useRef(status);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => {
    callLogIdRef.current = callLogId;
  }, [callLogId]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (status === "IDLE" || status === "ENDED") return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const speakText = (text: string, onDone?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onDone?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language;
    utter.rate = 1.0;
    utter.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.toLowerCase().includes("hi-in")) ||
      voices.find((v) => v.lang.toLowerCase().includes("en-in")) ||
      voices[0];
    if (preferred) utter.voice = preferred;
    setStatus("SPEAKING");
    utter.onend = () => onDone?.();
    utter.onerror = () => onDone?.();
    window.speechSynthesis.speak(utter);
  };

  const startListening = () => {
    if (muted || statusRef.current === "ENDED") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setStatus("LISTENING");
      return;
    }
    try {
      recognitionRef.current?.stop();
    } catch {}
    const rec = new SpeechRec();
    rec.lang = language;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setStatus("LISTENING");
    rec.onresult = async (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        await sendStudentSpeech(transcript);
      } else if (statusRef.current !== "ENDED") {
        startListening();
      }
    };
    rec.onerror = () => {
      if (statusRef.current === "LISTENING") {
        setTimeout(() => {
          if (statusRef.current === "LISTENING" && !muted) startListening();
        }, 600);
      }
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {}
  };

  const sendStudentSpeech = async (speech: string) => {
    if (!speech.trim()) return;
    try {
      recognitionRef.current?.stop();
    } catch {}
    const updated = [...turnsRef.current, { role: "STUDENT" as const, text: speech }];
    setTurns(updated);
    setStatus("THINKING");

    const res = await fetch("/api/ai-calling/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "turn",
        callLogId: callLogIdRef.current,
        leadId,
        studentName,
        phone,
        courseTitle,
        language: language === "hi-IN" ? "Hinglish" : "English",
        speechText: speech,
        history: updated,
      }),
    }).then((r) => r.json());

    const reply = res?.reply || "Dhanyavaad ji, hamare counselor aapko jald call karenge.";
    const withReply = [...updated, { role: "SIA" as const, text: reply }];
    setTurns(withReply);

    speakText(reply, () => {
      if (res?.shouldEnd) {
        endCall(withReply);
      } else {
        startListening();
      }
    });
  };

  const startCall = async () => {
    setStatus("CONNECTING");
    setSeconds(0);
    setTurns([]);
    const res = await fetch("/api/ai-calling/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        callLogId,
        leadId,
        studentName,
        phone,
        courseTitle,
      }),
    }).then((r) => r.json());

    if (res?.callLogId) setCallLogId(res.callLogId);
    const greeting = res?.reply || "Namaste! SoftLab Global mein aapka swagat hai.";
    setTurns([{ role: "SIA", text: greeting }]);
    speakText(greeting, () => startListening());
  };

  const endCall = async (finalTurns?: Turn[]) => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setStatus("ENDED");
    await fetch("/api/ai-calling/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "end",
        callLogId: callLogIdRef.current,
        leadId,
        history: finalTurns || turnsRef.current,
        durationSeconds: seconds,
      }),
    }).catch(() => {});
  };

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600/20 via-cyan-600/20 to-indigo-600/20 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Self-Hosted AI Voice Call (₹0 Cost)
          </div>
          <h2 className="text-lg font-bold mt-0.5">SIA — SoftLab Global AI Counselor</h2>
          <p className="text-xs text-slate-400">
            {studentName} {phone ? `• ${phone}` : ""} • {courseTitle}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-emerald-400">{formatDuration(seconds)}</div>
          <div className="text-[11px] text-slate-400">{status}</div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage("hi-IN")}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                language === "hi-IN"
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              Hindi / Hinglish
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en-IN")}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                language === "en-IN"
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              English (IN)
            </button>
          </div>
          {phone && (
            <a
              href={`tel:${phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "").slice(-10)}`}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 border border-slate-700"
            >
              <Smartphone className="w-3.5 h-3.5" /> Dial via Device SIM
            </a>
          )}
        </div>

        <div className="h-64 overflow-y-auto rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
          {turns.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-sm">
              <Volume2 className="w-8 h-8 text-emerald-400 mb-2" />
              Click <strong>Start AI Voice Call</strong> to begin a live 2-way voice conversation.
            </div>
          ) : (
            turns.map((t, i) => (
              <div
                key={i}
                className={`flex ${t.role === "STUDENT" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2 text-sm ${
                    t.role === "STUDENT"
                      ? "bg-cyan-600/30 border border-cyan-500/40 text-cyan-50"
                      : "bg-slate-800 border border-slate-700 text-slate-100"
                  }`}
                >
                  <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-0.5">
                    {t.role === "SIA" ? "SIA AI Counselor" : studentName}
                  </span>
                  {t.text}
                </div>
              </div>
            ))
          )}
        </div>

        {status !== "IDLE" && status !== "ENDED" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!textInput.trim()) return;
              const msg = textInput.trim();
              setTextInput("");
              sendStudentSpeech(msg);
            }}
            className="flex gap-2"
          >
            <input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type your reply here..."
              className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium inline-flex items-center gap-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="flex items-center justify-center gap-4 pt-2">
          {status === "IDLE" || status === "ENDED" ? (
            <button
              type="button"
              onClick={startCall}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/30 transition"
            >
              <Phone className="w-5 h-5" />
              {status === "ENDED" ? "Call Again" : "Start AI Voice Call"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setMuted((m) => !m);
                  if (!muted) {
                    try {
                      recognitionRef.current?.stop();
                    } catch {}
                  } else {
                    startListening();
                  }
                }}
                className="p-3.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white"
                title={muted ? "Unmute Mic" : "Mute Mic"}
              >
                {muted ? <MicOff className="w-5 h-5 text-amber-400" /> : <Mic className="w-5 h-5 text-emerald-400" />}
              </button>
              <button
                type="button"
                onClick={() => endCall()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-600/30 transition"
              >
                <PhoneOff className="w-5 h-5" /> End Call
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
