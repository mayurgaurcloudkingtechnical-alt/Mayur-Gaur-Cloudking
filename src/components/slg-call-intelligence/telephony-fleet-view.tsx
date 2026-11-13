"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Radio,
  Server,
  Activity,
  PhoneForwarded,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Phone,
  FileText,
  Send,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TelephonyFleetView() {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [disposition, setDisposition] = useState("INTERESTED");
  const [dispositionNotes, setDispositionNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const healthQuery = api.slgCallIntelligence.getProviderFleetHealth.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const analyticsQuery = api.slgCallIntelligence.getCallAnalytics.useQuery({
    startDate: new Date(Date.now() - 7 * 86400000),
  });

  const submitDispositionMutation = api.slgCallIntelligence.submitCallDisposition.useMutation({
    onSuccess: () => {
      setSelectedCallId(null);
      setDispositionNotes("");
      setFollowUpDate("");
      setIsSubmitting(false);
      analyticsQuery.refetch();
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  const handleDispositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCallId) return;
    setIsSubmitting(true);
    await submitDispositionMutation.mutateAsync({
      callLogId: selectedCallId,
      disposition,
      notes: dispositionNotes,
      followUpAt: followUpDate ? new Date(followUpDate) : undefined,
    });
  };

  const providers = healthQuery.data || [];
  const logs: any[] = (analyticsQuery.data as any)?.recentCalls || (analyticsQuery.data as any)?.logs || [];
  const unmatchedCalls = logs.filter((l: any) => !l.isEmployeeMatched || !l.isCustomerMatched);

  return (
    <div className="space-y-6">
      {/* Telephony Adapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((p) => (
          <Card key={p.provider} className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  {p.provider}
                </CardTitle>
                <Badge
                  className={
                    p.status === "ONLINE"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : p.status === "DEGRADED"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }
                >
                  {p.status}
                </Badge>
              </div>
              <CardDescription className="text-xs">{p.details || p.provider}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Verification Mode:</span>
                <span className="font-mono text-slate-800">{p.authType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Webhook Ingestion:</span>
                <span className="font-semibold text-emerald-700">Enabled (E.164)</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Last Polled:</span>
                <span className="text-slate-500">{p.lastVerifiedAt ? new Date(p.lastVerifiedAt).toLocaleTimeString() : "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Unmatched / Exception Calls Queue */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Telephony Call Stream & Disposition Management
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Review live inbound/outbound calls, update customer disposition, and schedule follow-ups
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              healthQuery.refetch();
              analyticsQuery.refetch();
            }}
            className="text-xs gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Started</th>
                  <th className="py-2.5 px-3">Provider / Source</th>
                  <th className="py-2.5 px-3">Caller</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Disposition</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.slice(0, 15).map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 text-slate-500 font-mono">
                      {new Date(log.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">
                        {log.provider || log.source}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      <div>{log.contactName || "Unknown"}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.customerPhone}</div>
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      <div>{log.user ? `${log.user.firstName} ${log.user.lastName}` : "Tenant Pool"}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.agentPhone || "PBX Line"}</div>
                    </td>
                    <td className="py-2 px-3">
                      <Badge
                        className={
                          log.callStatus === "CONNECTED"
                            ? "bg-emerald-100 text-emerald-800 text-[10px]"
                            : log.callStatus === "MISSED"
                            ? "bg-red-100 text-red-800 text-[10px]"
                            : "bg-slate-100 text-slate-700 text-[10px]"
                        }
                      >
                        {log.callStatus}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">
                      {Math.floor(log.durationSeconds / 60)}m {log.durationSeconds % 60}s
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-medium text-slate-700">{log.disposition || "PENDING"}</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                        onClick={() => setSelectedCallId(log.id)}
                      >
                        Update
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Call Disposition Modal Dialog */}
      {selectedCallId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Submit Call Disposition</h3>
              <button
                onClick={() => setSelectedCallId(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleDispositionSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Call Outcome / Disposition</label>
                <select
                  value={disposition}
                  onChange={(e) => setDisposition(e.target.value)}
                  className="w-full text-xs border rounded-lg p-2 bg-white text-slate-800"
                >
                  <option value="INTERESTED">Interested (Follow-Up Scheduled)</option>
                  <option value="DEMO_BOOKED">Demo Booked</option>
                  <option value="QUOTATION_SENT">Quotation Sent</option>
                  <option value="CALLBACK_REQUESTED">Callback Requested</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                  <option value="WRONG_NUMBER">Wrong Number</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Follow-Up Date & Time</label>
                <Input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Call Notes / Summary</label>
                <textarea
                  value={dispositionNotes}
                  onChange={(e) => setDispositionNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs border rounded-lg p-2 text-slate-800"
                  placeholder="Summarize conversation and next agreed action..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCallId(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? "Saving..." : "Save Disposition"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
