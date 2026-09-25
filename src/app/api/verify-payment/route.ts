import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Normalize incoming parameters (supporting standard checkout names & razorpay_ prefixes)
    const orderId = body.order_id || body.razorpay_order_id;
    const paymentId = body.payment_id || body.razorpay_payment_id;
    const signature = body.signature || body.razorpay_signature;

    // Missing fields check
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required payment verification fields (order_id, payment_id, signature).",
        },
        { status: 400 }
      );
    }

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay secret key not configured on server.",
        },
        { status: 500 }
      );
    }

    // Cryptographic HMAC-SHA256 signature generation: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const payload = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature, "utf-8");
    const genBuffer = Buffer.from(generatedSignature, "utf-8");

    const isMatch =
      sigBuffer.length === genBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, genBuffer);

    if (!isMatch) {
      console.warn("[VerifyPaymentAPI] Signature mismatch for order:", orderId);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment signature. Payment verification failed.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully.",
        order_id: orderId,
        payment_id: paymentId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[VerifyPaymentAPI] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error during payment verification",
      },
      { status: 500 }
    );
  }
}
