"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  FileText,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Headphones,
  RotateCcw,
  FastForward,
} from "lucide-react";

export interface ConversationTurn {
  role: "agent" | "lead" | "assistant" | "user" | string;
  text: string;
  timestamp?: string;
}

export interface CallRecordingPlayerProps {
  recordingUrl?: string | null;
  transcript?: ConversationTurn[] | string | any;
  contactName?: string;
  contactPhone?: string;
  callDurationSeconds?: number;
  disposition?: string;
  compact?: boolean;
}

export function CallRecordingPlayer({
  recordingUrl,
  transcript,
  contactName,
  contactPhone,
  callDurationSeconds,
  disposition,
  compact = false,
}: CallRecordingPlayerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSpeakingDialogue, setIsSpeakingDialogue] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(callDurationSeconds || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);
  const [copied, setCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Parse turns safely
  const turns: ConversationTurn[] = React.useMemo(() => {
    if (!transcript) return [];
    if (Array.isArray(transcript)) return transcript;
    if (typeof transcript === "string") {
      try {
        const parsed = JSON.parse(transcript);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [{ role: "agent", text: transcript }];
      }
    }
    return [];
  }, [transcript]);

  // Audio stream URL fallback
  const audioSrc = React.useMemo(() => {
    if (recordingUrl) {
      if (recordingUrl.startsWith("http") || recordingUrl.startsWith("/api/")) {
        return recordingUrl;
      }
      return `/api/recordings/${encodeURIComponent(recordingUrl.replace(/^\/+/, ""))}`;
    }
    // Generate fallback recording route if phone/id present
    const seed = contactPhone || contactName || "session";
    return `/api/recordings/call_track_${seed.replace(/\D/g, "").slice(-8) || "stream"}`;
  }, [recordingUrl, contactPhone, contactName]);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // Play / Pause standard audio track
  const togglePlayAudio = () => {
    if (isSpeakingDialogue) {
      stopDialogueSpeech();
    }

    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch((e) => console.warn("Audio playback error:", e));
    }
  };

  // Audio scrubber seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  // Dialogue Speech Synthesis
  const stopDialogueSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingDialogue(false);
    setActiveTurnIndex(null);
  };

  const playDialogueSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported on this browser.");
      return;
    }

    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }

    if (isSpeakingDialogue) {
      stopDialogueSpeech();
      return;
    }

    if (turns.length === 0) return;

    window.speechSynthesis.cancel();
    setIsSpeakingDialogue(true);

    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find((v) => v.lang.includes("hi") || v.lang.includes("IN"));
    const englishVoice = voices.find((v) => v.lang.includes("en-IN") || v.lang.includes("en"));

    let currentTurn = 0;

    const speakNextTurn = () => {
      if (currentTurn >= turns.length) {
        setIsSpeakingDialogue(false);
        setActiveTurnIndex(null);
        return;
      }

      setActiveTurnIndex(currentTurn);
      const turn = turns[currentTurn];
      const isAgent = turn.role === "agent" || turn.role === "assistant";

      const utterance = new SpeechSynthesisUtterance(turn.text);
      if (isAgent) {
        utterance.voice = hindiVoice || englishVoice || null;
        utterance.pitch = 1.05;
        utterance.rate = 1.0;
      } else {
        utterance.voice = englishVoice || hindiVoice || null;
        utterance.pitch = 0.95;
        utterance.rate = 1.02;
      }

      utterance.onend = () => {
        currentTurn++;
        // Small pause between conversation turns
        setTimeout(() => {
          speakNextTurn();
        }, 400);
      };

      utterance.onerror = () => {
        setIsSpeakingDialogue(false);
        setActiveTurnIndex(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextTurn();
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopyTranscript = () => {
    const textToCopy = turns
      .map(
        (t) =>
          `[${t.timestamp || ""}] ${t.role === "agent" ? "SoftLab AI Counselor" : "Student"}: ${t.text}`
      )
      .join("\n\n");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compact Trigger for Table rows
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="h-7 px-2 text-xs bg-indigo-50/70 hover:bg-indigo-100/70 border-indigo-200 text-indigo-700 font-medium gap-1.5"
          title="Play Call Recording & Transcript"
        >
          <Headphones className="w-3.5 h-3.5 text-indigo-600" />
          <span>Listen ({formatSeconds(callDurationSeconds || 60)})</span>
        </Button>

        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <span>Call Recording & Audio Playback</span>
                      {disposition && (
                        <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-300 border-indigo-400/30">
                          {disposition}
                        </Badge>
                      )}
                    </h4>
                    <p className="text-xs text-slate-300">
                      {contactName || "Contact"} {contactPhone ? `• ${contactPhone}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    stopDialogueSpeech();
                    if (audioRef.current) audioRef.current.pause();
                    setIsOpen(false);
                  }}
                  className="text-slate-400 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body: Embedded Player */}
              <div className="p-4 overflow-y-auto space-y-4">
                <CallRecordingPlayer
                  recordingUrl={recordingUrl}
                  transcript={transcript}
                  contactName={contactName}
                  contactPhone={contactPhone}
                  callDurationSeconds={callDurationSeconds}
                  disposition={disposition}
                  compact={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full Expanded Player View
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlayingAudio(false);
          setCurrentTime(0);
        }}
      />

      {/* Audio Player Controller Bar */}
      <div className="bg-slate-900 rounded-xl p-4 text-white space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition shadow-sm"
              title={isPlayingAudio ? "Pause Audio" : "Play Recording"}
            >
              {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Telephonic Audio Recording</span>
                {isPlayingAudio && (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1.5 h-3 bg-emerald-400 animate-pulse rounded-full" />
                    <span className="w-1.5 h-4 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                    <span className="w-1.5 h-2 bg-emerald-400 animate-pulse delay-150 rounded-full" />
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {formatSeconds(currentTime)} / {formatSeconds(duration || callDurationSeconds || 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {turns.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={playDialogueSpeech}
                variant="outline"
                className={`h-8 px-2.5 text-xs font-semibold border transition gap-1.5 ${
                  isSpeakingDialogue
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
                    : "bg-indigo-500/20 border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/30"
                }`}
                title="Play conversation turn-by-turn with speech synthesis"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isSpeakingDialogue ? "Stop AI Dialogue" : "Voice Dialogue (AI)"}</span>
              </Button>
            )}

            <button
              type="button"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <a
              href={audioSrc}
              download={`call_recording_${contactPhone || "audio"}.wav`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
              title="Download Recording (.wav)"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Progress Scrubber */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || callDurationSeconds || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      {/* Transcript Header & Content */}
      {turns.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className="font-bold text-slate-800 flex items-center gap-1.5 hover:text-indigo-600 transition"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Call Dialogue Transcript ({turns.length} turns)</span>
              <span className="text-[10px] text-slate-400">({showTranscript ? "Hide" : "Show"})</span>
            </button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopyTranscript}
              className="h-6 px-2 text-[11px] text-slate-600 gap-1 border-slate-200"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>

          {showTranscript && (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-xs">
              {turns.map((turn, idx) => {
                const isAgent = turn.role === "agent" || turn.role === "assistant";
                const isCurrentTurn = activeTurnIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl transition duration-150 border ${
                      isCurrentTurn
                        ? "ring-2 ring-indigo-500 bg-indigo-50/70 border-indigo-300"
                        : isAgent
                        ? "bg-slate-50 border-slate-200"
                        : "bg-indigo-50/40 border-indigo-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        {isAgent ? (
                          <>
                            <div className="p-1 rounded bg-indigo-600 text-white">
                              <Bot className="w-3 h-3" />
                            </div>
                            <span className="text-indigo-950">SoftLab Global Counselor AI</span>
                          </>
                        ) : (
                          <>
                            <div className="p-1 rounded bg-slate-700 text-white">
                              <User className="w-3 h-3" />
                            </div>
                            <span className="text-slate-900">{contactName || "Student / Candidate"}</span>
                          </>
                        )}
                      </div>
                      {turn.timestamp && (
                        <span className="text-[10px] text-slate-400 font-mono">{turn.timestamp}</span>
                      )}
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[12px] pl-6">{turn.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
