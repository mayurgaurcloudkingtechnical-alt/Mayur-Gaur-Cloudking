import React from "react";
import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { SlgCallIntelligenceHub } from "@/components/slg-call-intelligence/slg-call-intelligence-hub";

export default async function SlgCallIntelligencePage() {
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
        title="SLG CALL INTELLIGENCE"
        description="Unified AI Call Analytics, Employee Productivity, Live Workstation Tracking & Daily Reporting."
        action={
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 text-white font-mono text-xs flex items-center gap-1.5 shadow-sm py-1 px-2.5">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              SLG ENGINE ACTIVE
            </Badge>
          </div>
        }
      />

      <SlgCallIntelligenceHub />
    </DashboardShell>
  );
}
