import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { CurriculumCmsView } from "@/components/admin/curriculum/curriculum-cms-view";

interface TrainerCurriculumPageProps {
  params: {
    id: string;
  };
}

export default async function TrainerCurriculumPage({ params }: TrainerCurriculumPageProps) {
  const user = await requireRole([
    UserRoleCode.TRAINER,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <CurriculumCmsView courseId={params.id} baseBackHref="/trainer/dashboard" />
    </DashboardShell>
  );
}
