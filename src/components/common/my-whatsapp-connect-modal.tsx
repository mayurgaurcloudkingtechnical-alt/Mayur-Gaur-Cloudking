"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MessageSquare, PhoneCall, RefreshCw, Send, BookOpen, CheckCircle2, X, Radio, Instagram, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MyWhatsAppConnectModalProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
}

export function MyWhatsAppConnectModal({ open, onClose, userName }: MyWhatsAppConnectModalProps) {
  const [waStatus, setWaStatus] = useState<any | null>(null);
  const [feed, setFeed] = useState<any | null>(null);
  const [targetPhone, setTargetPhone] = useState("");
  const [customMsg, setCustomMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"connect" | "status" | "calls" | "social">("connect");
  const [socialReplyText, setSocialReplyText] = useState<Record<string, string>>({});

  const loadAll = useCallback(async () => {
    try {
      const [stRes, fdRes] = await Promise.all([
        fetch("/api/whatsapp/local?scope=mine", { cache: "no-store" }),
        fetch("/api/whatsapp/local?action=feed", { cache: "no-store" }),
      ]);
      if (stRes.ok) setWaStatus(await stRes.json());
      if (fdRes.ok) setFeed(await fdRes.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    loadAll();
    const timer = setInterval(loadAll, 5000);
    return () => clearInterval(timer);
  }, [open, loadAll]);

  if (!open) return null;

  const handleSend = async (action: "send" | "send_catalogue") => {
    if (!targetPhone.trim()) {
      setFeedback("Enter a 10-digit WhatsApp number first.");
      return;
    }
    setSending(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/whatsapp/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "mine",
          action,
          to: targetPhone.trim(),
          text: customMsg.trim() || "Namaste from SoftLab Global! How can we assist you today?",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(
          action === "send_catalogue"
            ? "Official Business Course Catalogue sent on WhatsApp!"
            : "WhatsApp message sent!"
        );
        setCustomMsg("");
        loadAll();
      } else {
        setFeedback(data.error || "Failed to send.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-slate-950 text-white border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">
                My Live WhatsApp, Catalogue & CRM Calling {userName ? `— ${userName}` : ""}
              </h3>
              <p className="text-[11px] text-slate-400">
                Link your own WhatsApp QR, track live delivery/read status, send course catalogue & make live calls.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 text-xs">
          {[
            { id: "connect", label: "My WhatsApp & Catalogue" },
            { id: "status", label: `Live Message Status (${feed?.recentMessages?.length || 0})` },
            { id: "calls", label: `Live Calls In/Out (${feed?.recentCalls?.length || 0})` },
            {
              id: "social",
              label: `Instagram & Meta (${(feed?.socialLeads?.length || 0) + (feed?.socialMessages?.length || 0)})`,
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-2 font-semibold border-b-2 transition ${
                activeTab === t.id
                  ? "border-emerald-400 text-emerald-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === "connect" && (
            <>
              <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Personal Login WhatsApp</span>
                    <Badge
                      className={
                        waStatus?.connected
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }
                    >
                      {waStatus?.connected ? "CONNECTED" : waStatus?.status || "LOADING..."}
                    </Badge>
                  </div>
                  <p className="text-slate-300">
                    {waStatus?.connected
                      ? `Connected as ${waStatus?.user?.name || "Staff"} (${waStatus?.user?.id?.split(":")[0] || "Active"}). Messages you send go directly from your WhatsApp!`
                      : "Scan this QR with your WhatsApp (Linked Devices) to connect your own number. (If unlinked, company SoftLab WhatsApp acts as fallback.)"}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={loadAll}
                      className="h-7 text-xs bg-slate-900 border-slate-700 text-slate-200 gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await fetch("/api/whatsapp/local", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "logout", scope: "mine" }),
                        });
                        setTimeout(loadAll, 1500);
                      }}
                      className="h-7 text-xs bg-slate-900 border-rose-700/60 text-rose-300"
                    >
                      Reset / Re-Link
                    </Button>
                  </div>
                </div>
                {waStatus?.qrDataUrl && !waStatus?.connected && (
                  <div className="bg-white p-2 rounded-xl shrink-0">
                    <img src={waStatus.qrDataUrl} alt="Personal WhatsApp QR" className="w-32 h-32" />
                  </div>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-cyan-400" /> Quick Send WhatsApp / Business Catalogue ({feed?.totalCourses || 84} Courses)
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="10-digit student phone (e.g. 9876543210)"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  {targetPhone.replace(/\D/g, "").length >= 10 && (
                    <div className="flex gap-2">
                      <a
                        href={`/ai-call?phone=${encodeURIComponent(targetPhone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                      >
                        <Radio className="w-3.5 h-3.5" /> AI Call
                      </a>
                      <a
                        href={`tel:+91${targetPhone.replace(/\D/g, "").slice(-10)}`}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> SIM Call
                      </a>
                    </div>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Custom WhatsApp message (or click Send Business Catalogue below)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    disabled={sending}
                    onClick={() => handleSend("send")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Message
                  </Button>
                  <Button
                    size="sm"
                    disabled={sending}
                    onClick={() => handleSend("send_catalogue")}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Send Official Business Catalogue
                  </Button>
                </div>
                {feedback && (
                  <p className="text-emerald-300 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {feedback}
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === "status" && (
            <div className="space-y-2">
              {(feed?.recentMessages || []).map((m: any) => (
                <div key={m.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-200">
                      {m.conversation?.lead?.fullName || m.senderName} ({m.conversation?.lead?.phone || m.conversation?.externalThreadId})
                    </div>
                    <div className="text-slate-400 mt-0.5 line-clamp-2">{m.content}</div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shrink-0 text-[10px]">
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {activeTab === "calls" && (
            <div className="space-y-2">
              {(feed?.recentCalls || []).map((c: any) => (
                <div key={c.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-200">
                      {c.contactName} • <span className="font-mono">{c.contactPhone}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {c.callType} • {c.disposition} • {c.durationSeconds}s
                    </div>
                  </div>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shrink-0 text-[10px]">
                    {c.callStatus}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {activeTab === "social" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-fuchsia-950/60 to-indigo-950/60 border border-fuchsia-700/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-fuchsia-400" />
                    <span className="font-bold text-sm">SoftLab Global Instagram & Meta Page Live</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                    {feed?.metaInfo?.verifyTokenConfigured ? "WEBHOOK ACTIVE" : "READY"}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div>
                    Instagram: <span className="font-semibold text-fuchsia-300">{feed?.metaInfo?.instagramHandle || "@softlabglobal"}</span> • Meta Page ID:{" "}
                    <span className="font-mono text-indigo-300">{feed?.metaInfo?.pageId || "Configured"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 break-all">
                    <Globe className="w-3 h-3 shrink-0" /> Webhook: {feed?.metaInfo?.webhookUrl || "https://www.softlabglobal.com/api/webhooks/meta"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-200">Live Instagram & Meta DMs ({feed?.socialMessages?.length || 0})</div>
                {(feed?.socialMessages || []).length === 0 ? (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                    No Instagram/Meta DMs received yet. Incoming Meta Page Messenger & Instagram DMs/comments appear here automatically in real time for all Counselors to Super Admin.
                  </div>
                ) : (
                  (feed?.socialMessages || []).map((m: any) => {
                    const convId = m.conversation?.id;
                    return (
                      <div key={m.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-slate-200">
                              {m.conversation?.lead?.fullName || m.senderName || "Meta User"}
                            </span>{" "}
                            <Badge className="ml-1 bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 text-[10px]">
                              {m.channel}
                            </Badge>
                            <p className="text-slate-300 mt-1">{m.content}</p>
                          </div>
                          <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] shrink-0">
                            {m.status}
                          </Badge>
                        </div>
                        {convId && m.senderType === "LEAD" && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={socialReplyText[convId] || ""}
                              onChange={(e) => setSocialReplyText((p) => ({ ...p, [convId]: e.target.value }))}
                              placeholder="Write reply to Instagram/Meta..."
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                            <Button
                              size="sm"
                              onClick={async () => {
                                const txt = (socialReplyText[convId] || "").trim();
                                if (!txt) return;
                                await fetch("/api/whatsapp/local", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    action: "send_social_reply",
                                    conversationId: convId,
                                    channel: m.channel,
                                    text: txt,
                                  }),
                                });
                                setSocialReplyText((p) => ({ ...p, [convId]: "" }));
                                loadAll();
                              }}
                              className="h-7 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs"
                            >
                              Reply
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-200">Live Instagram & Facebook Meta Leads ({feed?.socialLeads?.length || 0})</div>
                {(feed?.socialLeads || []).map((lead: any) => (
                  <div key={lead.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-200">
                        {lead.fullName} • <span className="font-mono text-cyan-300">{lead.phone}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {lead.source} • {lead.interestedCourse || lead.campaignName || "General Enquiry"} • {lead.status}
                      </div>
                    </div>
                    {lead.phone && !String(lead.phone).startsWith("META_") && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`/ai-call?phone=${encodeURIComponent(lead.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold"
                        >
                          AI Call
                        </a>
                        <button
                          onClick={() => {
                            setTargetPhone(lead.phone);
                            setActiveTab("connect");
                          }}
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold"
                        >
                          WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
