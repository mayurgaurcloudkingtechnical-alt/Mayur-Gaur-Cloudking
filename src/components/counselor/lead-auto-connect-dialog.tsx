"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  PhoneCall,
  MessageSquare,
  Bot,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Flame,
  Clock,
  Sparkles,
} from "lucide-react";
import { CallRecordingPlayer } from "@/components/common/call-recording-player";

interface LeadAutoConnectDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function LeadAutoConnectDialog({ open, onClose, onComplete }: LeadAutoConnectDialogProps) {
  const [mode, setMode] = useState<"BOTH" | "WHATSAPP" | "AI_CALLING">("BOTH");
  const [batchLimit, setBatchLimit] = useState<number>(20);
  const [results, setResults] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } =
    api.crm.getUntouchedPendingStats.useQuery(undefined, {
      enabled: open,
    });

  const autoFollowupMutation = api.crm.triggerLeadAutoFollowup.useMutation({
    onSuccess: (res) => {
      setResults(res);
      setErrorMessage(null);
      refetchStats();
      utils.crm.listLeads.invalidate();
      if (onComplete) onComplete();
    },
    onError: (err) => {
      setErrorMessage(err.message || "Failed to execute auto follow-up on leads.");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30 text-indigo-300">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>AI Auto-Connect & Follow-up Engine</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded font-mono">
                  LIVE AUTOMATION
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Automatically follow up untouched, pending & remaining leads via WhatsApp & AI Calling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" /> Untouched Leads
              </span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {isStatsLoading ? "..." : stats?.untouchedCount ?? 0}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-amber-500" /> Pending Follow-ups
              </span>
              <p className="text-2xl font-extrabold text-amber-700 mt-1">
                {isStatsLoading ? "..." : stats?.pendingFollowupCount ?? 0}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-rose-500" /> Hot Leads
              </span>
              <p className="text-2xl font-extrabold text-rose-600 mt-1">
                {isStatsLoading ? "..." : stats?.hotLeadsCount ?? 0}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-red-900">Follow-up Execution Notice</p>
                <p className="mt-0.5 text-red-700">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {!results ? (
            <div className="space-y-4">
              {/* Mode Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Select Auto Outreach Mode:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMode("BOTH")}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                      mode === "BOTH"
                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-600/20"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      <span>Dual Connect</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      WhatsApp nurture + AI Voice Calling simultaneously.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("WHATSAPP")}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                      mode === "WHATSAPP"
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-600/20"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1 text-emerald-700">
                      <MessageSquare className="h-4 w-4" />
                      <span>WhatsApp Nurture</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Automated personalized course pitch & demo class invite.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("AI_CALLING")}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                      mode === "AI_CALLING"
                        ? "border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-600/20"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1 text-blue-700">
                      <PhoneCall className="h-4 w-4" />
                      <span>AI Voice Calling</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      AI phone agent conducts intake, scores interest & saves transcript.
                    </span>
                  </button>
                </div>
              </div>

              {/* Batch Limit Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Batch Batch Processing Size:
                </label>
                <div className="flex items-center gap-2">
                  {[10, 20, 30, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBatchLimit(num)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                        batchLimit === num
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {num} Leads
                    </button>
                  ))}
                  <span className="text-[11px] text-slate-400 ml-2">
                    Prioritizes newest untouched leads first.
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={autoFollowupMutation.isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    autoFollowupMutation.mutate({
                      mode,
                      limit: batchLimit,
                    });
                  }}
                  disabled={autoFollowupMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-2 px-5 shadow-sm"
                >
                  {autoFollowupMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Executing Automation Engine...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Start Auto-Connect ({batchLimit} Leads)</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Results View */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Batch Follow-up Execution Complete!</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div>
                    <span className="text-slate-500 block">Scanned</span>
                    <strong className="text-slate-800 text-base">{results.scanned}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">WhatsApp Sent</span>
                    <strong className="text-emerald-700 text-base">{results.whatsappSentCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Calls Dispatched</span>
                    <strong className="text-blue-700 text-base">{results.aiCallsCompletedCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hot Leads Identified</span>
                    <strong className="text-rose-600 text-base">{results.hotLeadsCount}</strong>
                  </div>
                </div>
              </div>

              {/* Roster of reached leads */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-700">
                  Processed Lead Touchpoints
                </div>
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto text-xs">
                  {results.results?.map((r: any) => (
                    <div key={r.leadId} className="p-2.5 flex items-center justify-between hover:bg-slate-50/50">
                      <div>
                        <span className="font-semibold text-slate-900">{r.leadName}</span>
                        <span className="text-slate-400 text-[11px] block">{r.courseTitle} • {r.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {r.whatsappSent && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            WhatsApp Sent
                          </Badge>
                        )}
                        {r.aiCallCompleted && (
                          <>
                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                              AI Call: {r.callOutcome || "COMPLETED"}
                            </Badge>
                            <CallRecordingPlayer
                              recordingUrl={r.recordingUrl}
                              transcript={r.transcript}
                              contactName={r.leadName}
                              contactPhone={r.phone}
                              disposition={r.callOutcome}
                              compact={true}
                            />
                          </>
                        )}
                        {r.interestLevel === "HOT" && (
                          <Badge className="text-[10px] bg-rose-500 text-white font-bold">
                            HOT
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setResults(null)}
                  className="text-xs"
                >
                  Run Another Batch
                </Button>
                <Button
                  size="sm"
                  onClick={onClose}
                  className="bg-slate-900 text-white text-xs font-bold"
                >
                  Close & Refresh CRM
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
