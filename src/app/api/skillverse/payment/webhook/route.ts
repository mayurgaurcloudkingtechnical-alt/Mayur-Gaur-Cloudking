import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/server/db/client";
import {
  SkillverseService,
  type SkillverseInvoiceRecord,
} from "@/server/services/skillverse.service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || "";

    const isSecretConfigured =
      Boolean(webhookSecret) && !webhookSecret.includes("YourRazorpay");

    if (isSecretConfigured) {
      if (!signature) {
        return NextResponse.json(
          { error: "Missing x-razorpay-signature header." },
          { status: 400 }
        );
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        await SkillverseService.logAudit({
          action: "WEBHOOK_SIGNATURE_MISMATCH",
          actor: "RAZORPAY_WEBHOOK",
          target: "SKILLVERSE_WEBHOOK",
          details: "Rejected webhook with invalid HMAC-SHA256 signature.",
        });
        return NextResponse.json(
          { error: "Invalid webhook signature." },
          { status: 400 }
        );
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType: string = payload?.event || "";
    const paymentEntity = payload?.payload?.payment?.entity || {};
    const orderEntity = payload?.payload?.order?.entity || {};

    const invoiceNumber: string | undefined =
      paymentEntity?.notes?.invoiceNumber ||
      orderEntity?.notes?.invoiceNumber ||
      orderEntity?.receipt ||
      payload?.invoiceNumber;

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: "No Skillverse invoiceNumber found in webhook payload." },
        { status: 400 }
      );
    }

    const key = `SV_INV_${invoiceNumber.trim()}`;
    const row = await db.systemSetting.findUnique({ where: { key } });
    if (!row) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const invoice = row.value as unknown as SkillverseInvoiceRecord;

    // Duplicate webhook idempotency check
    if (
      invoice.status === "PAID" &&
      (eventType === "payment.captured" || eventType === "order.paid")
    ) {
      return NextResponse.json({
        received: true,
        idempotent: true,
        invoiceNumber: invoice.invoiceNumber,
        receiptNumber: invoice.receiptNumber,
      });
    }

    if (eventType === "payment.failed") {
      if (invoice.status !== "PAID") {
        invoice.status = "FAILED";
        await db.systemSetting.update({
          where: { key },
          data: { value: invoice as any },
        });
        await SkillverseService.logAudit({
          action: "PAYMENT_WEBHOOK_FAILED",
          actor: "RAZORPAY_WEBHOOK",
          target: invoice.invoiceNumber,
          details: `Payment failed for order ${paymentEntity?.order_id || invoice.razorpayOrderId || "unknown"}`,
        });
      }
      return NextResponse.json({
        received: true,
        status: invoice.status,
        invoiceNumber: invoice.invoiceNumber,
      });
    }

    if (eventType === "payment.captured" || eventType === "order.paid") {
      invoice.status = "PAID";
      invoice.paidAt = new Date().toISOString();
      invoice.razorpayPaymentId =
        paymentEntity?.id || invoice.razorpayPaymentId || `pay_wh_${Date.now()}`;
      invoice.receiptNumber =
        invoice.receiptNumber || invoice.invoiceNumber.replace("SV-INV-", "SV-RCPT-");

      await db.systemSetting.update({
        where: { key },
        data: { value: invoice as any },
      });

      await SkillverseService.logAudit({
        action: "PAYMENT_WEBHOOK_CAPTURED",
        actor: "RAZORPAY_WEBHOOK",
        target: invoice.invoiceNumber,
        details: `Webhook confirmed payment (${invoice.receiptNumber})`,
      });

      return NextResponse.json({
        received: true,
        idempotent: false,
        status: "PAID",
        invoiceNumber: invoice.invoiceNumber,
        receiptNumber: invoice.receiptNumber,
      });
    }

    return NextResponse.json({
      received: true,
      ignoredEvent: eventType,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Webhook processing failed." },
      { status: 500 }
    );
  }
}
