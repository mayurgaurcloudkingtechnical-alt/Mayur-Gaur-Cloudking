import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { Navbar } from "@/components/common/navbar";
import { CoursePlayerView } from "@/components/student/course-player-view";

interface CoursePlayerPageProps {
  params: {
    enrollmentId: string;
  };
}

export default async function StudentCoursePlayerPage({ params }: CoursePlayerPageProps) {
  const user = await requireRole([UserRoleCode.STUDENT, UserRoleCode.SUPER_ADMIN]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar user={user} />
      <CoursePlayerView enrollmentId={params.enrollmentId} />
    </div>
  );
}
