import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { BatchDetailView } from "@/components/admin/batches/batch-detail-view";

interface BatchDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdminBatchDetailPage({ params }: BatchDetailPageProps) {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ]);

  return (
    <DashboardShell user={user}>
      <BatchDetailView batchId={params.id} />
    </DashboardShell>
  );
}
