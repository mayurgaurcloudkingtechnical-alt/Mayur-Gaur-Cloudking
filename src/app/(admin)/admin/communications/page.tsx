import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { CommunicationsHub } from "@/components/admin/communications/communications-hub";

export default async function CommunicationsPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.HR,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Enterprise Communications & Notifications"
        description="Monitor automated daily reports, configure Higher Authority routing directories, and inspect dual-channel email and WhatsApp delivery logs."
      />
      <div className="mt-6">
        <CommunicationsHub />
      </div>
    </DashboardShell>
  );
}
