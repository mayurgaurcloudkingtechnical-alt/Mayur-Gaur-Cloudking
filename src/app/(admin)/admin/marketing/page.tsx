import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { MarketingAnalyticsView } from "@/components/admin/marketing-analytics-view";

export default async function AdminMarketingPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Official Instagram & AI Digital Marketing Command Center"
        description="Live cross-platform analytics for Instagram (@softlabglobal9), Facebook Boost (#1324192984113691), Google Ads, JustDial, and Website."
        action={
          <Badge variant="default" className="text-xs bg-slate-900">
            {user.roleCode} • Executive Control
          </Badge>
        }
      />

      <MarketingAnalyticsView />
    </DashboardShell>
  );
}
