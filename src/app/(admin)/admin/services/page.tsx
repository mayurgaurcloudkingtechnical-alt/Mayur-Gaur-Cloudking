import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { ServicesDashboardView } from "@/components/admin/services/services-dashboard-view";

export const metadata = {
  title: "Corporate Services Dashboard — SOFTLAB GLOBAL LMS",
};

export default async function AdminServicesDashboardPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.ADMIN,
    UserRoleCode.DIRECTOR,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Corporate IT & Services Management"
        description="Oversee inbound client enquiries, commercial service offerings, and project delivery pipelines."
      />
      <ServicesDashboardView basePath="/admin/services" />
    </DashboardShell>
  );
}
