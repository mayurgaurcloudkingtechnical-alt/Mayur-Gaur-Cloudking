import { Metadata } from "next";
import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { StudentVirtualLabsView } from "@/components/student/virtual-labs-view";

export const metadata: Metadata = {
  title: "Virtual Practical Labs | SoftLab Global LMS",
  description: "Browser-based isolated coding, SQL database, Linux, networking & Office practical labs with performance tracking.",
};

export default async function StudentVirtualLabsPage() {
  const user = await requireRole([UserRoleCode.STUDENT]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="SoftLab Global Virtual Practical Labs"
        description="Execute code, SQL queries, networking subnet labs, and Office practicals safely inside your browser."
      />
      <StudentVirtualLabsView />
    </DashboardShell>
  );
}
