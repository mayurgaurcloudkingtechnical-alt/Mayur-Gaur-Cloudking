import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/server/db/client";
import { SkillverseService, type SkillverseInvoiceRecord } from "@/server/services/skillverse.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceNumber } = body as { invoiceNumber?: string };

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: "invoiceNumber is required to create a payment order." },
        { status: 400 }
      );
    }

    const key = `SV_INV_${invoiceNumber.trim()}`;
    const row = await db.systemSetting.findUnique({ where: { key } });
    if (!row) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const invoice = row.value as unknown as SkillverseInvoiceRecord;
    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "This invoice is already paid.", invoice },
        { status: 409 }
      );
    }

    const amountPaise = Math.round(invoice.totalPayableInr * 100);
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const isLiveConfigured =
      Boolean(keyId && keySecret) &&
      !keyId.includes("YourRazorpay") &&
      !keySecret.includes("YourRazorpay");

    let orderId = invoice.razorpayOrderId;
    let mode: "RAZORPAY_API" | "SANDBOX_PENDING_CREDENTIALS" = "SANDBOX_PENDING_CREDENTIALS";

    if (isLiveConfigured && !orderId) {
      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const resp = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: invoice.invoiceNumber,
          notes: {
            venture: "SLG_SKILLVERSE",
            studentId: invoice.studentId || "",
            invoiceNumber: invoice.invoiceNumber,
          },
        }),
      });

      if (resp.ok) {
        const orderData = await resp.json();
        orderId = orderData.id;
        mode = "RAZORPAY_API";
      }
    }

    if (!orderId) {
      orderId = `order_sv_sbx_${crypto.randomBytes(6).toString("hex")}`;
    }

    invoice.razorpayOrderId = orderId;
    await db.systemSetting.update({
      where: { key },
      data: { value: invoice as any },
    });

    await SkillverseService.recordAnalyticsEvent({
      eventType: "CHECKOUT_STARTED",
    });

    return NextResponse.json({
      orderId,
      invoiceNumber: invoice.invoiceNumber,
      amountInr: invoice.totalPayableInr,
      amountPaise,
      currency: "INR",
      mode,
      keyId: isLiveConfigured ? keyId : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create Skillverse payment order." },
      { status: 500 }
    );
  }
}
