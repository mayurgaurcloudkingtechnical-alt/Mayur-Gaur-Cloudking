import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { ServicePackagesView } from "@/components/admin/services/service-packages-view";

export const metadata = {
  title: "Service Packages & Pricing — SOFTLAB GLOBAL LMS",
};

export default async function AdminServicePackagesPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.ADMIN,
    UserRoleCode.DIRECTOR,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Corporate Service Packages & Pricing"
        description="Review standard commercial packages, deliverables, delivery periods, and support SLAs across service categories."
      />
      <ServicePackagesView basePath="/admin/services" />
    </DashboardShell>
  );
}
