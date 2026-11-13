import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  PhoneCall,
  CheckCircle2,
  Clock,
  TrendingUp,
  PhoneMissed,
  FileSpreadsheet,
} from "lucide-react";

interface PortalKpiRibbonProps {
  summary: any;
  reportsCount: number;
}

export const PortalKpiRibbon: React.FC<PortalKpiRibbonProps> = ({ summary, reportsCount }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Calls</span>
            <PhoneCall className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary?.totalCalls ?? 0}</div>
          <div className="text-xs text-slate-500 mt-0.5">All monitored lines</div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Connected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{summary?.connectedCalls ?? 0}</div>
          <div className="text-xs text-emerald-700 font-medium mt-0.5">
            {summary?.connectionRatePercent ?? summary?.connectedRatioPercent ?? 0}% connection rate
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Talk Time</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{summary?.formattedTotalTalkTime || summary?.totalTalkTimeFormatted || "0s"}</div>
          <div className="text-xs text-slate-500 mt-0.5">Connected duration</div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Handle Time</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary?.formattedAverageCallDuration || summary?.averageHandlingTimeFormatted || "0s"}</div>
          <div className="text-xs text-slate-500 mt-0.5">AHT per connected call</div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missed / Unanswered</span>
            <PhoneMissed className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {(summary?.missedCalls ?? 0) + (summary?.unansweredCalls ?? 0)}
          </div>
          <div className="text-xs text-amber-700 mt-0.5">Awaiting callback</div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Daily Reports</span>
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{reportsCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Submitted today</div>
        </CardContent>
      </Card>
    </div>
  );
};
