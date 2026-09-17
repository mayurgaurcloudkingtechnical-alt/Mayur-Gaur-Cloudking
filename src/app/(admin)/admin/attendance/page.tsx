import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { AttendanceOverviewView } from "@/components/admin/attendance/attendance-overview-view";

export default async function AdminAttendancePage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Attendance & Compliance Oversight"
        description="Monitor cohort session logs, student presence ratios, and instructor compliance across academic schedules."
      />
      <div className="mt-6">
        <AttendanceOverviewView />
      </div>
    </DashboardShell>
  );
}
