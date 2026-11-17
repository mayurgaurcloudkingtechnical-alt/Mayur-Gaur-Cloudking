"use client";

import React, { useEffect, useState } from "react";
import { PhoneCall, Smartphone, CheckCircle2, MessageSquare, Radio } from "lucide-react";

export default function PhoneBridgePage() {
  const [staffId, setStaffId] = useState("");
  const [paired, setPaired] = useState(false);
  const [lastCmd, setLastCmd] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const sid = sp.get("staffId") || "";
    setStaffId(sid);
  }, []);

  useEffect(() => {
    if (!staffId) return;
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/phone-bridge?staffId=${encodeURIComponent(staffId)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setPaired(Boolean(data.paired));
        if (data.command) {
          const cmd = data.command;
          setLastCmd(cmd);
          setHistory((prev) => [cmd, ...prev.slice(0, 14)]);
          await fetch("/api/phone-bridge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ staffId, commandId: cmd.id }),
          }).catch(() => {});

          if (cmd.mode === "WHATSAPP_CALL") {
            const digits = String(cmd.to || "").replace(/\D/g, "").slice(-10);
            window.location.href = `https://wa.me/91${digits}`;
          } else {
            window.location.href = `tel:${cmd.to}`;
          }
        }
      } catch {}
    };

    poll();
    const timer = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [staffId]);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-5 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-bold">SoftLab Phone Link (Inbuilt SIM Bridge)</h1>
            <p className="text-xs text-slate-400">
              Keep this page open on your mobile phone. Any SIM Call / WhatsApp Call clicked on your PC CRM will dial here automatically.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Radio className={`w-4 h-4 ${paired ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
            <span>{paired ? "Phone Paired & Ready for Instant SIM Dial" : "Connecting to CRM..."}</span>
          </div>
          <CheckCircle2 className={`w-4 h-4 ${paired ? "text-emerald-400" : "text-slate-600"}`} />
        </div>

        {lastCmd && (
          <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-700/50 space-y-2">
            <div className="text-xs font-bold text-indigo-300">Latest Dial Command</div>
            <div className="text-sm font-semibold">{lastCmd.contactName || "Lead"} • {lastCmd.to}</div>
            <div className="flex gap-2 pt-1">
              <a
                href={`tel:${lastCmd.to}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Dial SIM Now
              </a>
              <a
                href={`https://wa.me/91${String(lastCmd.to || "").replace(/\D/g, "").slice(-10)}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-cyan-600 text-white text-xs font-bold"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Open WhatsApp
              </a>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-400">Recent Dial Queue</div>
            {history.map((h) => (
              <div key={h.id} className="text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span>{h.contactName} ({h.to})</span>
                <span className="text-emerald-400 font-mono text-[10px]">{h.mode}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
