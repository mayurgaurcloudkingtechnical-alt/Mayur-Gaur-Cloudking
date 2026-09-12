import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { TrainerBatchWorkspaceView } from "@/components/trainer/trainer-batch-workspace-view";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function TrainerBatchDetailPage({ params }: PageProps) {
  const user = await requireRole([
    UserRoleCode.TRAINER,
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <TrainerBatchWorkspaceView batchId={params.id} />
    </DashboardShell>
  );
}
