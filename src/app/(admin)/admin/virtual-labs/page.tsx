import { Metadata } from "next";
import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { AdminVirtualLabsView } from "@/components/admin/virtual-labs-admin-view";

export const metadata: Metadata = {
  title: "Virtual Practical Labs Management | SoftLab Global",
  description: "Create, assign, monitor, and evaluate browser-based coding, SQL, Linux, networking, and Office practical labs.",
};

export default async function AdminVirtualLabsPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.TRAINER,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Virtual Practical Labs & Evaluation"
        description="Assign course-linked practical labs, monitor sandbox executions, and evaluate student submissions."
      />
      <AdminVirtualLabsView />
    </DashboardShell>
  );
}
