import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import ExcelJS from "exceljs";
import { db } from "@/server/db/client";
import { LeadStatus, PaymentTransactionStatus, UserRoleCode } from "@prisma/client";

export const dynamic = "force-dynamic";

const AUTHORITY_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER"];

export async function GET(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));

  if (!token?.sub || !AUTHORITY_ROLES.includes(String(token.roleCode || ""))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "monthly"; // daily | weekly | monthly | custom
  const format = searchParams.get("format") || "json";

  const now = new Date();
  let startDate = new Date();
  if (searchParams.get("startDate")) {
    startDate = new Date(String(searchParams.get("startDate")));
  } else if (period === "daily") {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    startDate.setDate(now.getDate() - 7);
  } else {
    startDate.setDate(now.getDate() - 30);
  }
  const endDate = searchParams.get("endDate") ? new Date(String(searchParams.get("endDate"))) : now;

  const dateFilter = { gte: startDate, lte: endDate };

  const [
    totalUploadedLeads,
    totalApprovedLeads,
    totalDistributedLeads,
    whatsappSent,
    emailSent,
    deliveryFailures,
    followUpsPending,
    admissionsGenerated,
    revenueAgg,
    employees,
    recentDistributions,
  ] = await Promise.all([
    db.lead.count({ where: { createdAt: dateFilter } }),
    db.lead.count({ where: { createdAt: dateFilter, status: { notIn: [LeadStatus.ON_HOLD, LeadStatus.LOST] } } }),
    db.lead.count({
      where: {
        createdAt: dateFilter,
        OR: [{ assignedToId: { not: null } }, { assignedCounselorId: { not: null } }, { assignedTelecallerId: { not: null } }],
      },
    }),
    db.notificationDeliveryLog.count({ where: { createdAt: dateFilter, channel: "WHATSAPP", status: { in: ["SENT", "DELIVERED", "READ"] } } }),
    db.notificationDeliveryLog.count({ where: { createdAt: dateFilter, channel: "EMAIL", status: { in: ["SENT", "DELIVERED", "READ"] } } }),
    db.notificationDeliveryLog.count({ where: { createdAt: dateFilter, status: "FAILED" } }),
    db.lead.count({ where: { nextFollowUp: { lte: endDate }, status: { notIn: [LeadStatus.ADMITTED, LeadStatus.LOST] } } }),
    db.lead.count({ where: { updatedAt: dateFilter, status: LeadStatus.ADMITTED } }),
    db.paymentTransaction.aggregate({ where: { createdAt: dateFilter, status: PaymentTransactionStatus.SUCCESS }, _sum: { amount: true } }),
    db.user.findMany({
      where: { status: "ACTIVE", roleCode: { in: [UserRoleCode.COUNSELOR, UserRoleCode.TELECALLER] } },
      select: { id: true, firstName: true, lastName: true, roleCode: true, email: true },
      orderBy: { firstName: "asc" },
    }),
    db.leadDistributionLog.findMany({
      where: { createdAt: dateFilter },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  const employeeStats = await Promise.all(
    employees.map(async (emp) => {
      const [allocated, pending, callsCompleted, followUps, admitted] = await Promise.all([
        db.lead.count({
          where: {
            createdAt: dateFilter,
            OR: [{ assignedToId: emp.id }, { assignedCounselorId: emp.id }, { assignedTelecallerId: emp.id }],
          },
        }),
        db.lead.count({
          where: {
            OR: [{ assignedToId: emp.id }, { assignedCounselorId: emp.id }, { assignedTelecallerId: emp.id }],
            status: { in: [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.INTERESTED] },
          },
        }),
        db.staffCallLog.count({ where: { userId: emp.id, createdAt: dateFilter } }),
        db.lead.count({
          where: {
            OR: [{ assignedToId: emp.id }, { assignedCounselorId: emp.id }, { assignedTelecallerId: emp.id }],
            nextFollowUp: { lte: endDate },
            status: { notIn: [LeadStatus.ADMITTED, LeadStatus.LOST] },
          },
        }),
        db.lead.count({
          where: {
            updatedAt: dateFilter,
            OR: [{ assignedToId: emp.id }, { assignedCounselorId: emp.id }, { assignedTelecallerId: emp.id }],
            status: LeadStatus.ADMITTED,
          },
        }),
      ]);

      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`.trim(),
        roleCode: emp.roleCode,
        allocated,
        pending,
        callsCompleted,
        followUpsPending: followUps,
        admissionsGenerated: admitted,
      };
    })
  );

  const summary = {
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalUploadedLeads,
    totalApprovedLeads,
    totalDistributedLeads,
    whatsappSent,
    emailSent,
    deliveryFailures,
    followUpsPending,
    admissionsGenerated,
    revenueGenerated: Number(revenueAgg._sum?.amount || 0),
  };

  if (format === "xlsx") {
    const wb = new ExcelJS.Workbook();
    const sumSheet = wb.addWorksheet("Executive Summary");
    sumSheet.addRow(["Metric", "Value"]);
    Object.entries(summary).forEach(([k, v]) => sumSheet.addRow([k, String(v)]));

    const empSheet = wb.addWorksheet("Employee Allocation");
    empSheet.addRow(["Employee", "Role", "Allocated Leads", "Pending Leads", "Calls Completed", "Follow-ups Pending", "Admissions"]);
    employeeStats.forEach((e) =>
      empSheet.addRow([e.name, e.roleCode, e.allocated, e.pending, e.callsCompleted, e.followUpsPending, e.admissionsGenerated])
    );

    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="softlab-distribution-comms-${period}.xlsx"`,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    summary,
    employeeStats,
    recentDistributions,
  });
}
