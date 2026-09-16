import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { TelecallerWorkstationView } from "@/components/telecaller/telecaller-workstation-view";

export default async function TelecallerDashboardPage() {
  const user = await requireRole([
    UserRoleCode.TELECALLER,
    UserRoleCode.COUNSELOR,
    UserRoleCode.MANAGER,
    UserRoleCode.ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title={`Telecalling Station: ${user.firstName} ${user.lastName}`}
        description="Meta Ads, Social Inquiries & Inbound Lead Qualification Desk."
        action={
          <Badge variant="default" className="text-xs bg-purple-700">
            {user.roleCode} • Active Outreach
          </Badge>
        }
      />

      <TelecallerWorkstationView user={user} />
    </DashboardShell>
  );
}
