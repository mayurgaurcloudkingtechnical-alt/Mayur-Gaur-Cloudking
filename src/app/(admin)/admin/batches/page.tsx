import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { BatchesView } from "@/components/admin/batches/batches-view";

interface AdminBatchesPageProps {
  searchParams: {
    courseId?: string;
  };
}

export default async function AdminBatchesPage({ searchParams }: AdminBatchesPageProps) {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ]);

  return (
    <DashboardShell user={user}>
      <BatchesView initialCourseId={searchParams.courseId} />
    </DashboardShell>
  );
}
