import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import ExcelJS from "exceljs";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";

const FINANCE_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER", "ACCOUNTANT"];

export async function GET(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));

  if (!token?.sub || !FINANCE_ROLES.includes(String(token.roleCode || ""))) {
    return NextResponse.json({ error: "Unauthorized Finance Export" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "gstr1";
  const year = Number(searchParams.get("year") || new Date().getFullYear());
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const wb = new ExcelJS.Workbook();
  let fileName = `softlab-finance-${type}-${year}.xlsx`;

  if (type === "gstr1") {
    const sheet = wb.addWorksheet("GSTR-1 Sales Register");
    sheet.addRow(["Invoice No", "Date", "Customer", "GSTIN", "Place of Supply", "Taxable (INR)", "CGST (INR)", "SGST (INR)", "IGST (INR)", "Total (INR)", "Status"]);
    const invoices = await db.gstInvoice.findMany({
      where: { invoiceDate: { gte: startDate, lte: endDate } },
      orderBy: { invoiceDate: "desc" },
    });
    for (const inv of invoices) {
      sheet.addRow([
        inv.invoiceNumber,
        inv.invoiceDate.toISOString().slice(0, 10),
        inv.customerName,
        inv.customerGstin || "URP",
        inv.placeOfSupply,
        Math.round(inv.taxableAmountPaise / 100),
        Math.round(inv.cgstAmountPaise / 100),
        Math.round(inv.sgstAmountPaise / 100),
        Math.round(inv.igstAmountPaise / 100),
        Math.round(inv.grandTotalPaise / 100),
        inv.status,
      ]);
    }
  } else if (type === "gstr2b") {
    const sheet = wb.addWorksheet("GSTR-2B ITC Register");
    sheet.addRow(["Bill No", "Vendor", "Invoice Date", "Taxable (INR)", "Total Tax (INR)", "Total (INR)", "ITC Eligible", "Status"]);
    const bills = await db.vendorBill.findMany({
      where: { invoiceDate: { gte: startDate, lte: endDate } },
      include: { vendor: { select: { name: true } } },
      orderBy: { invoiceDate: "desc" },
    });
    for (const b of bills) {
      sheet.addRow([
        b.billNumber,
        b.vendor?.name || "Vendor",
        b.invoiceDate.toISOString().slice(0, 10),
        Math.round(b.taxableAmountPaise / 100),
        Math.round(b.totalTaxPaise / 100),
        Math.round(b.totalAmountPaise / 100),
        b.isItcEligible ? "YES" : "NO",
        b.status,
      ]);
    }
  } else {
    const sheet = wb.addWorksheet("Payment Transactions");
    sheet.addRow(["Receipt No", "Reference", "Date", "Method", "Amount (INR)", "Status"]);
    const payments = await db.paymentTransaction.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });
    for (const p of payments) {
      sheet.addRow([
        p.receiptNumber || "-",
        p.transactionReference || p.gatewayPaymentId || p.id,
        (p.paidAt || p.createdAt).toISOString().slice(0, 10),
        p.paymentMethod,
        Math.round(p.amount / 100),
        p.status,
      ]);
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
