import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { CourseDetailView } from "@/components/admin/courses/course-detail-view";

interface CourseDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdminCourseDetailPage({ params }: CourseDetailPageProps) {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ]);

  return (
    <DashboardShell user={user}>
      <CourseDetailView courseId={params.id} />
    </DashboardShell>
  );
}
