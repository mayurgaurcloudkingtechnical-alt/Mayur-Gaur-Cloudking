import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone } from "lucide-react";

interface PortalPresenceTabProps {
  fleet: any[];
}

export const PortalPresenceTab: React.FC<PortalPresenceTabProps> = ({ fleet }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {fleet.map((agent: any) => (
        <Card key={agent.userId} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{agent.name}</h4>
                  <p className="text-xs text-slate-500">{agent.roleCode}</p>
                </div>
              </div>

              <Badge
                className={`text-xs ${
                  agent.status === "ON_CALL"
                    ? "bg-red-500 text-white animate-pulse"
                    : agent.status === "AVAILABLE"
                    ? "bg-emerald-500 text-white"
                    : agent.status === "ON_BREAK"
                    ? "bg-amber-500 text-white"
                    : "bg-slate-300 text-slate-700"
                }`}
              >
                {agent.status}
              </Badge>
            </div>

            {agent.status === "ON_CALL" && agent.currentCallContact && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs">
                <div className="font-semibold text-red-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-red-600 animate-spin" />
                  Active Call: {agent.currentCallContact}
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 text-center text-xs">
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Today's Calls</div>
                <div className="font-bold text-slate-800 mt-0.5">{agent.todayMetrics?.callsCount ?? 0}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Connected</div>
                <div className="font-bold text-emerald-600 mt-0.5">{agent.todayMetrics?.connectedCount ?? 0}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Talk Time</div>
                <div className="font-bold text-blue-600 mt-0.5">{agent.todayMetrics?.talkTimeFormatted || "0s"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
