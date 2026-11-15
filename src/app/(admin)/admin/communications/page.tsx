import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { CommunicationsHub } from "@/components/admin/communications/communications-hub";
import { CommunicationsAnalyticsBar } from "@/components/admin/communications/communications-analytics-bar";

export default async function CommunicationsPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.HR,
    UserRoleCode.COUNSELOR,
    UserRoleCode.TELECALLER,
    UserRoleCode.PLACEMENT_OFFICER,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Enterprise Communications & Notifications"
        description="Monitor automated daily reports, configure Higher Authority routing directories, and inspect dual-channel email and WhatsApp delivery logs."
      />
      <div className="mt-6 space-y-6">
        <CommunicationsAnalyticsBar />
        <CommunicationsHub />
      </div>
    </DashboardShell>
  );
}
