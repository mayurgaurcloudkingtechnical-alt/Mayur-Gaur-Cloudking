import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/server/db/client";
import { SkillverseService, type SkillverseInvoiceRecord } from "@/server/services/skillverse.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      invoiceNumber,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      sandboxTestToken,
    } = body as {
      invoiceNumber?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      sandboxTestToken?: string;
    };

    if (!invoiceNumber) {
      return NextResponse.json({ error: "invoiceNumber is required." }, { status: 400 });
    }

    const key = `SV_INV_${invoiceNumber.trim()}`;
    const row = await db.systemSetting.findUnique({ where: { key } });
    if (!row) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const invoice = row.value as unknown as SkillverseInvoiceRecord;

    // Idempotency check
    if (invoice.status === "PAID") {
      return NextResponse.json({
        verified: true,
        idempotent: true,
        invoice,
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const isLiveConfigured = Boolean(secret) && !secret.includes("YourRazorpay");
    const isSandboxOrder = Boolean(invoice.razorpayOrderId?.startsWith("order_sv_sbx_"));

    if (isLiveConfigured && (!isSandboxOrder || razorpay_signature)) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json(
          { error: "Missing Razorpay payment signature parameters." },
          { status: 400 }
        );
      }

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        await SkillverseService.logAudit({
          action: "PAYMENT_SIGNATURE_MISMATCH",
          actor: "RAZORPAY_VERIFY",
          target: invoice.invoiceNumber,
          details: `Invalid HMAC signature for order ${razorpay_order_id}`,
        });
        return NextResponse.json(
          { error: "Cryptographic payment signature verification failed." },
          { status: 400 }
        );
      }
      invoice.razorpayPaymentId = razorpay_payment_id;
    } else {
      // Sandbox verification requires matching orderId + explicit sandboxTestToken
      if (!sandboxTestToken || sandboxTestToken !== `SBX_VERIFY_${invoice.razorpayOrderId}`) {
        return NextResponse.json(
          {
            error:
              "Production Razorpay credentials are pending configuration, and no valid sandbox verification token was provided.",
          },
          { status: 400 }
        );
      }
      invoice.razorpayPaymentId = `pay_sv_sbx_${Date.now().toString().slice(-6)}`;
    }

    invoice.status = "PAID";
    invoice.paidAt = new Date().toISOString();
    invoice.receiptNumber = invoice.invoiceNumber.replace("SV-INV-", "SV-RCPT-");

    await db.systemSetting.update({
      where: { key },
      data: { value: invoice as any },
    });

    await SkillverseService.recordAnalyticsEvent({
      eventType: "PAYMENT_CONFIRMED",
    });

    await SkillverseService.logAudit({
      action: "INVOICE_PAID_VERIFIED",
      actor: isLiveConfigured ? "RAZORPAY_HMAC" : "SANDBOX_VERIFIER",
      target: invoice.invoiceNumber,
      details: `Receipt ${invoice.receiptNumber} generated for ₹${invoice.totalPayableInr}`,
    });

    return NextResponse.json({
      verified: true,
      invoice,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Payment verification failed." },
      { status: 500 }
    );
  }
}
