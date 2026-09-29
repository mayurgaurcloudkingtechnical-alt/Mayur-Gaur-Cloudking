import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { ServiceEnquiriesTable } from "@/components/admin/services/service-enquiries-table";

export const metadata = {
  title: "Service Enquiries — SOFTLAB GLOBAL LMS",
};

export default async function AdminServiceEnquiriesPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.ADMIN,
    UserRoleCode.DIRECTOR,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Corporate Service Enquiries"
        description="Track inbound client quote requests, requirement discussions, counselor assignments, and conversions."
      />
      <ServiceEnquiriesTable userRole={user.roleCode} />
    </DashboardShell>
  );
}
