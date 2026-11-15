import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import ExcelJS from "exceljs";
import { CentralNotificationEngine } from "@/server/services/central-notification-engine.service";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "ADMIN",
  "MANAGER",
  "HR",
  "COUNSELOR",
  "TELECALLER",
  "PLACEMENT_OFFICER",
];

async function getAuth(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));
  if (!token?.sub || !ALLOWED_ROLES.includes(String(token.roleCode || ""))) return null;
  return token;
}

function escapeCsv(val: any): string {
  const str = String(val ?? "").replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const format = (sp.get("format") || "csv").toLowerCase();
  const logs = await CentralNotificationEngine.listDeliveryLogs({
    page: 1,
    limit: 200,
    channel: sp.get("channel") || undefined,
    status: sp.get("status") || undefined,
    eventType: sp.get("eventType") || undefined,
    department: sp.get("department") || undefined,
    dateFrom: sp.get("dateFrom") || undefined,
    dateTo: sp.get("dateTo") || undefined,
    search: sp.get("search") || undefined,
  });

  if (format === "xlsx" || format === "excel") {
    const wb = new ExcelJS.Workbook();
    wb.creator = "SoftLab Global Communication Engine";
    const ws = wb.addWorksheet("Delivery Analytics");

    ws.columns = [
      { header: "Recipient Name", key: "recipientName", width: 24 },
      { header: "Role / Dept", key: "recipientRole", width: 18 },
      { header: "Channel", key: "channel", width: 16 },
      { header: "Address / Phone", key: "recipientAddress", width: 28 },
      { header: "Event Type", key: "eventType", width: 24 },
      { header: "Subject / Summary", key: "subject", width: 42 },
      { header: "Status", key: "status", width: 14 },
      { header: "Retries", key: "retryCount", width: 10 },
      { header: "Sent At", key: "sentAt", width: 22 },
      { header: "Delivered At", key: "deliveredAt", width: 22 },
      { header: "Error", key: "errorMessage", width: 32 },
    ];

    ws.getRow(1).font = { bold: true };
    for (const item of logs.items) {
      ws.addRow({
        recipientName: item.recipientName,
        recipientRole: item.recipientRole || "-",
        channel: item.channel,
        recipientAddress: item.recipientAddress,
        eventType: item.eventType,
        subject: item.subject || item.contentSummary || "-",
        status: item.status,
        retryCount: item.retryCount,
        sentAt: item.sentAt ? new Date(item.sentAt).toISOString() : "-",
        deliveredAt: item.deliveredAt ? new Date(item.deliveredAt).toISOString() : "-",
        errorMessage: item.errorMessage || "-",
      });
    }

    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(Buffer.from(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="softlab-delivery-analytics-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  }

  const headers = [
    "Recipient Name",
    "Role / Dept",
    "Channel",
    "Address / Phone",
    "Event Type",
    "Subject / Summary",
    "Status",
    "Retries",
    "Sent At",
    "Delivered At",
    "Error",
  ];
  const rows = logs.items.map((item) =>
    [
      escapeCsv(item.recipientName),
      escapeCsv(item.recipientRole || "-"),
      escapeCsv(item.channel),
      escapeCsv(item.recipientAddress),
      escapeCsv(item.eventType),
      escapeCsv(item.subject || item.contentSummary || "-"),
      escapeCsv(item.status),
      escapeCsv(item.retryCount),
      escapeCsv(item.sentAt ? new Date(item.sentAt).toISOString() : "-"),
      escapeCsv(item.deliveredAt ? new Date(item.deliveredAt).toISOString() : "-"),
      escapeCsv(item.errorMessage || "-"),
    ].join(",")
  );

  const csv = [headers.map(escapeCsv).join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="softlab-delivery-analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
