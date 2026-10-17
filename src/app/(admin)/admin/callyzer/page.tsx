import React from "react";
import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { CallyzerTeamMonitoringView } from "@/components/callyzer/callyzer-team-monitoring-view";

export default async function AdminCallyzerPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.HR,
    UserRoleCode.COUNSELOR,
    UserRoleCode.TELECALLER,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Callyzer Live Staff Monitoring & Calling CRM"
        description="Real-time calling presence, live duration timers, and Post-Wise performance tracking (Counselor, Telecaller, Marketing)."
        action={
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 text-white font-mono text-xs flex items-center gap-1 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              LIVE TELEPHONY ACTIVE
            </Badge>
          </div>
        }
      />

      <CallyzerTeamMonitoringView />
    </DashboardShell>
  );
}
