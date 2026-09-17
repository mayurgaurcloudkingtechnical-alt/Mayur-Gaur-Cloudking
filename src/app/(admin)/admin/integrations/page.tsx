import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { IntegrationsHubView } from "@/components/admin/integrations/integrations-hub-view";

export default async function AdminIntegrationsPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Integrations & Webhook Hub"
        description="Connect and monitor payment processors, marketing lead webhooks, messaging gateways, and database infrastructure."
      />
      <div className="mt-6">
        <IntegrationsHubView />
      </div>
    </DashboardShell>
  );
}
