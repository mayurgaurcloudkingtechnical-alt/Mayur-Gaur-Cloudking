import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { StudentMarketplaceView } from "@/components/student/student-marketplace-view";

export const metadata = {
  title: "Course Marketplace & Direct Admission | SoftLab Global",
  description:
    "Explore 3-month and 6-month industry certification programs, fast-track your tech career, and enroll directly with instant LMS access.",
};

export default async function StudentMarketplacePage() {
  const user = await requireRole([UserRoleCode.STUDENT, UserRoleCode.SUPER_ADMIN]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Student Marketplace"
        description="Select from verified 3-month bootcamps, 6-month professional master programs, and advanced diplomas. Instant Razorpay checkout and automated classroom activation."
      />
      <div className="mt-6">
        <StudentMarketplaceView />
      </div>
    </DashboardShell>
  );
}
