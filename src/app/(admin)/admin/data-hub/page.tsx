import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { EnterpriseDataHub } from "@/components/admin/data-hub/enterprise-data-hub";

export default async function EnterpriseDataHubPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Enterprise Data Directory & AI Import Hub"
        description="Centralized Manager & Super Admin governance for Leads, Students, Staff, Vendors, Partners, AI Smart Import, and Approval Distribution."
      />
      <div className="mt-6">
        <EnterpriseDataHub />
      </div>
    </DashboardShell>
  );
}
