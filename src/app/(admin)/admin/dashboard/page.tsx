import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Users, Shield, BookOpen, Activity, Calendar } from "lucide-react";
import { db } from "@/server/db/client";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.HR,
    UserRoleCode.ACCOUNTANT,
    UserRoleCode.PLACEMENT_OFFICER,
  ]);

  const [userCount, roleCount, courseCount, batchCount, auditCount, recentLogs] = await Promise.all([
    db.user.count(),
    db.role.count(),
    db.course.count(),
    db.batch.count(),
    db.auditLog.count(),
    db.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            email: true,
            roleCode: true,
          },
        },
      },
    }),
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Operations & Administration ERP"
        description="Global institutional management, user directories, catalog, and security governance."
        action={
          <Badge variant="default" className="text-xs uppercase">
            {user.roleCode.replace(/_/g, " ")} • System Authority
          </Badge>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Registered Users</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{userCount}</div>
            <p className="text-xs text-slate-500 mt-1">Across all 11 system roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Documented Roles</CardTitle>
            <Shield className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{roleCount}</div>
            <p className="text-xs text-slate-500 mt-1">Enforced with server RBAC</p>
          </CardContent>
        </Card>

        <Link href="/admin/courses" className="block transition-transform hover:scale-[1.02]">
          <Card className="h-full border-emerald-100 hover:border-emerald-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Academic Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{courseCount}</div>
              <p className="text-xs text-slate-500 mt-1">Manage catalog →</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/batches" className="block transition-transform hover:scale-[1.02]">
          <Card className="h-full border-emerald-100 hover:border-emerald-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Batches & Cohorts</CardTitle>
              <Calendar className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{batchCount}</div>
              <p className="text-xs text-slate-500 mt-1">Manage cohorts →</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Audit Logs</CardTitle>
            <Activity className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{auditCount}</div>
            <p className="text-xs text-slate-500 mt-1">Immutable security logs</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health & Architecture Status</CardTitle>
            <CardDescription>Verified Day 1 Foundation components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Framework & Runtime</p>
                <p className="mt-1 font-semibold text-slate-900">Next.js 14 App Router</p>
                <p className="text-xs text-slate-500 mt-0.5">TypeScript strict mode • React 18</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Database & ORM</p>
                <p className="mt-1 font-semibold text-slate-900">PostgreSQL 16 + Prisma 5</p>
                <p className="text-xs text-slate-500 mt-0.5">Integer Paise currency • CUID2 PKs</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Authentication & RBAC</p>
                <p className="mt-1 font-semibold text-slate-900">NextAuth v5 + tRPC v11</p>
                <p className="text-xs text-slate-500 mt-0.5">bcryptjs cost 12 • HttpOnly session</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Security & Audit Trail</CardTitle>
            <CardDescription>Append-only audit records from PostgreSQL</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No audit records logged yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Actor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {log.resourceType} ({log.resourceId.slice(0, 12)}...)
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {log.actor?.email || "System"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
