import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "ACCOUNTANT"];

async function getAuth(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));
  if (!token?.sub || !ALLOWED_ROLES.includes(String(token.roleCode || ""))) return null;
  return token;
}

export async function GET(req: NextRequest) {
  const token = await getAuth(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [allSuccess, fees, gstInvoices, recentAdjustments] = await Promise.all([
    db.paymentTransaction.findMany({
      where: { status: "SUCCESS" },
      select: {
        id: true,
        amount: true,
        feeStructureId: true,
        studentId: true,
        admissionId: true,
        paymentMethod: true,
        receiptNumber: true,
        paidAt: true,
      },
      orderBy: { paidAt: "desc" },
    }),
    db.feeStructure.findMany({
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        course: { select: { title: true } },
        payments: {
          where: { status: "SUCCESS" },
          select: { id: true, amount: true, paymentMethod: true, receiptNumber: true, paidAt: true },
        },
      },
    }),
    db.gstInvoice.aggregate({
      _sum: { taxableAmountPaise: true, cgstAmountPaise: true, sgstAmountPaise: true, igstAmountPaise: true, grandTotalPaise: true, paidAmountPaise: true },
      _count: true,
    }),
    db.auditLog.findMany({
      where: { action: "FINANCE_RECONCILIATION_APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  const totalSuccessPaise = allSuccess.reduce((s, p) => s + p.amount, 0);
  const orphanPayments = allSuccess.filter((p) => !p.feeStructureId);
  const orphanPaymentsPaise = orphanPayments.reduce((s, p) => s + p.amount, 0);
  const feePaidSumPaise = fees.reduce((s, f) => s + f.paidAmount, 0);
  const feeLinkedTxSumPaise = fees.reduce((s, f) => s + f.payments.reduce((a, b) => a + b.amount, 0), 0);

  const discrepancies = fees
    .filter((f) => f.paidAmount !== f.payments.reduce((s, x) => s + x.amount, 0))
    .map((f) => {
      const txSum = f.payments.reduce((s, x) => s + x.amount, 0);
      return {
        feeStructureId: f.id,
        studentId: f.student?.studentId || f.studentId,
        studentName: f.student?.user ? `${f.student.user.firstName} ${f.student.user.lastName}`.trim() : "Student",
        courseTitle: f.course?.title || "Program",
        netPayablePaise: f.netPayableAmount,
        feePaidAmountPaise: f.paidAmount,
        verifiedPaymentsSumPaise: txSum,
        variancePaise: f.paidAmount - txSum,
        linkedTransactions: f.payments,
      };
    });

  return NextResponse.json({
    ok: true,
    equation: {
      feeStructuresPaidSumPaise: feePaidSumPaise,
      feeStructuresLinkedTxSumPaise: feeLinkedTxSumPaise,
      unlinkedFeeVariancePaise: feePaidSumPaise - feeLinkedTxSumPaise,
      standaloneOrphanPaymentsPaise: orphanPaymentsPaise,
      totalSuccessPaymentsPaise: totalSuccessPaise,
      netAggregateDifferencePaise: feePaidSumPaise - totalSuccessPaise,
      gstInvoicesGrandTotalPaise: gstInvoices._sum.grandTotalPaise || 0,
      gstInvoicesCount: gstInvoices._count,
    },
    discrepancies,
    orphanPayments,
    recentAdjustments,
  });
}

export async function POST(req: NextRequest) {
  const token = await getAuth(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const feeStructureId = String(body.feeStructureId || "");
  const reason = String(body.reason || "").trim();
  const evidenceUrl = body.evidenceUrl ? String(body.evidenceUrl) : null;
  const approvedAdjustmentPaise = Number(body.approvedAdjustmentPaise || 0);

  if (!feeStructureId || !reason) {
    return NextResponse.json({ error: "feeStructureId and adjustment reason are required" }, { status: 400 });
  }

  const fee = await db.feeStructure.findUnique({ where: { id: feeStructureId } });
  if (!fee) return NextResponse.json({ error: "FeeStructure not found" }, { status: 404 });

  const before = { paidAmount: fee.paidAmount, pendingAmount: fee.pendingAmount, paymentStatus: fee.paymentStatus };
  const newPaid = Math.max(0, fee.paidAmount + approvedAdjustmentPaise);
  const newPending = Math.max(0, fee.netPayableAmount - newPaid);

  const updated = await db.feeStructure.update({
    where: { id: feeStructureId },
    data: {
      paidAmount: newPaid,
      pendingAmount: newPending,
      paymentStatus: newPending === 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING",
    },
  });

  await db.auditLog.create({
    data: {
      actorId: String(token.sub),
      action: "FINANCE_RECONCILIATION_APPROVED",
      resourceType: "FeeStructure",
      resourceId: feeStructureId,
      newData: {
        before,
        paidAmount: updated.paidAmount,
        pendingAmount: updated.pendingAmount,
        approvedAdjustmentPaise,
        reason,
        evidenceUrl,
        approvedAt: new Date().toISOString(),
      },
    },
  });

  return NextResponse.json({ ok: true, feeStructure: updated });
}
