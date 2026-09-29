import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { ServiceEnquiriesTable } from "@/components/admin/services/service-enquiries-table";

export const metadata = {
  title: "Assigned Service Enquiries — Counselor Desk",
};

export default async function CounselorServicesPage() {
  const user = await requireRole([
    UserRoleCode.COUNSELOR,
    UserRoleCode.ADMIN,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="My Assigned Service Enquiries"
        description="Follow up with corporate clients, document project requirements, schedule consultation calls, and update progress."
      />
      <ServiceEnquiriesTable userRole={user.roleCode} counselorOnly={user.roleCode === UserRoleCode.COUNSELOR} />
    </DashboardShell>
  );
}
