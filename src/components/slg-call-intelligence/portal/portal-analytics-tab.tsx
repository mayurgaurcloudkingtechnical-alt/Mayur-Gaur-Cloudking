import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  PhoneIncoming,
  PhoneOutgoing,
  Play,
} from "lucide-react";

interface PortalAnalyticsTabProps {
  search: string;
  setSearch: (s: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (d: string) => void;
  tenant: any;
  logs: any[];
  onPlayRecording: (recordingId: string) => void;
}

export const PortalAnalyticsTab: React.FC<PortalAnalyticsTabProps> = ({
  search,
  setSearch,
  selectedDepartment,
  setSelectedDepartment,
  tenant,
  logs,
  onPlayRecording,
}) => {
  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search phone number or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="h-9 text-xs border border-slate-300 rounded-md px-3 bg-white text-slate-700"
          >
            <option value="ALL">All Departments</option>
            {tenant?.departments?.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Call Logs Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Contact & Phone</th>
                <th className="py-3 px-4">Direction / Type</th>
                <th className="py-3 px-4">Status & Disposition</th>
                <th className="py-3 px-4">Talk Time</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No call activity records found matching filters.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.contactName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{log.customerPhone}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-medium">
                        {log.callType === "INCOMING" ? (
                          <PhoneIncoming className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        {log.callType}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.callStatus === "CONNECTED"
                              ? "bg-emerald-500"
                              : log.callStatus === "MISSED"
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="font-medium text-slate-900">{log.callStatus}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{log.disposition}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {log.formattedTalkTime || `${log.talkTimeSeconds || 0}s`}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : "Direct Line"}
                      </div>
                      <div className="text-[11px] text-slate-500">{log.user?.roleCode}</div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {log.source}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(log.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {log.isRecorded && log.recording ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPlayRecording(log.recording.id)}
                          className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1"
                        >
                          <Play className="w-3 h-3 fill-emerald-600" />
                          Listen
                        </Button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No Audio</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
