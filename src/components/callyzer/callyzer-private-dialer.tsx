"use client";

import React, { useState, useEffect } from "react";
import { api as trpc } from "@/lib/trpc/react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneForwarded,
  Pause,
  Play,
  UserCheck,
  ShieldAlert,
  Clock,
  Radio,
} from "lucide-react";

interface DialerProps {
  initialDestination?: string;
  leadId?: string;
  onCallEnded?: (callData: { callId: string; destination: string; durationSeconds: number }) => void;
}

export function CallyzerPrivateDialer({ initialDestination = "", leadId, onCallEnded }: DialerProps) {
  const [destination, setDestination] = useState(initialDestination);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string>("IDLE");
  const [isHeld, setIsHeld] = useState(false);
  const [timer, setTimer] = useState(0);
  const [transferTarget, setTransferTarget] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [blockerMessage, setBlockerMessage] = useState<string | null>(null);

  const { data: extData, refetch: refetchExt } = trpc.callyzer.getMyExtension.useQuery();
  const myExtension = extData?.extension?.extensionNumber || "101";

  const initiateCallMut = trpc.callyzer.initiateCall.useMutation();
  const toggleHoldMut = trpc.callyzer.toggleHold.useMutation();
  const transferMut = trpc.callyzer.transferCall.useMutation();
  const terminateMut = trpc.callyzer.terminateCall.useMutation();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === "CONNECTED" && !isHeld) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus, isHeld]);

  const handleStartCall = async (targetOverride?: string) => {
    const target = targetOverride || destination;
    if (!target.trim()) return;

    setBlockerMessage(null);
    setCallStatus("CONNECTING");

    try {
      const res = await initiateCallMut.mutateAsync({
        callerExtension: myExtension,
        destination: target.trim(),
        leadId,
      });

      if (!res.success) {
        setCallStatus("IDLE");
        setBlockerMessage(res.message || "Call could not be initiated.");
        return;
      }

      setActiveCallId(res.callId);
      setCallStatus(res.status);
      setTimer(0);
    } catch (err: any) {
      setCallStatus("IDLE");
      setBlockerMessage(err.message || "Telephony engine error.");
    }
  };

  const handleToggleHold = async () => {
    if (!activeCallId) return;
    const nextHold = !isHeld;
    await toggleHoldMut.mutateAsync({ callId: activeCallId, hold: nextHold });
    setIsHeld(nextHold);
    setCallStatus(nextHold ? "HOLD" : "CONNECTED");
  };

  const handleTransfer = async () => {
    if (!activeCallId || !transferTarget.trim()) return;
    const res = await transferMut.mutateAsync({
      callId: activeCallId,
      targetExtension: transferTarget.trim(),
    });
    if (res.success) {
      setShowTransfer(false);
      handleHangup("TRANSFERRED");
    } else {
      alert(res.message);
    }
  };

  const handleHangup = async (disposition = "NORMAL_CLEARING") => {
    if (!activeCallId) {
      setCallStatus("IDLE");
      return;
    }

    const currentCallId = activeCallId;
    const duration = timer;

    try {
      await terminateMut.mutateAsync({
        callId: currentCallId,
        reason: "USER_HANGUP",
        disposition,
      });
    } catch (_) {}

    setActiveCallId(null);
    setCallStatus("IDLE");
    setIsHeld(false);
    setTimer(0);
    refetchExt();

    if (onCallEnded) {
      onCallEnded({
        callId: currentCallId,
        destination,
        durationSeconds: duration,
      });
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const dialPadDigits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-xl max-w-sm w-full">
      {/* PBX Presence Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
            SLG Private PBX
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ext {myExtension}</span>
        </div>
      </div>

      {/* Call Status & Timer Screen */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3.5 mb-4 text-center">
        <div className="text-xs font-medium tracking-wide uppercase text-slate-400 mb-1">
          {callStatus === "IDLE" ? "Ready to Call" : `Call State: ${callStatus}`}
        </div>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter Ext or Phone..."
          disabled={callStatus !== "IDLE"}
          className="w-full bg-transparent text-center font-mono text-xl text-emerald-300 font-bold tracking-wider outline-none placeholder:text-slate-600"
        />
        {callStatus !== "IDLE" && (
          <div className="flex items-center justify-center gap-1.5 mt-2 text-emerald-400 font-mono text-sm">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>{formatTimer(timer)}</span>
          </div>
        )}
      </div>

      {/* Blocker Notice (e.g. Telecom Carrier Required) */}
      {blockerMessage && (
        <div className="mb-4 p-3 bg-amber-950/50 border border-amber-800/60 rounded-lg text-amber-200 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>{blockerMessage}</div>
        </div>
      )}

      {/* Dialpad Matrix */}
      {callStatus === "IDLE" && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {dialPadDigits.map((digit) => (
            <button
              key={digit}
              onClick={() => setDestination((prev) => prev + digit)}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg font-mono font-semibold text-lg text-slate-200 transition"
            >
              {digit}
            </button>
          ))}
        </div>
      )}

      {/* Call Control Action Bar */}
      <div className="space-y-2">
        {callStatus === "IDLE" ? (
          <button
            onClick={() => handleStartCall()}
            disabled={!destination.trim() || initiateCallMut.isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Dial Call</span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleToggleHold}
              className={`py-2.5 rounded-lg flex flex-col items-center justify-center gap-1 text-xs font-medium transition ${
                isHeld ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {isHeld ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isHeld ? "Resume" : "Hold"}</span>
            </button>

            <button
              onClick={() => setShowTransfer(!showTransfer)}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 text-xs font-medium transition"
            >
              <PhoneForwarded className="w-4 h-4 text-sky-400" />
              <span>Transfer</span>
            </button>

            <button
              onClick={() => handleHangup()}
              className="py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg flex flex-col items-center justify-center gap-1 text-xs font-medium transition shadow-lg shadow-red-900/40"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Hangup</span>
            </button>
          </div>
        )}

        {/* Transfer Input Drawer */}
        {showTransfer && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2 mt-2">
            <input
              type="text"
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              placeholder="Target Extension (e.g. 102)"
              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-xs text-white outline-none"
            />
            <button
              onClick={handleTransfer}
              className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded text-xs transition"
            >
              Confirm Transfer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
