import { NextRequest, NextResponse } from "next/server";
import { OnlinePaymentService } from "@/server/services/online-payment.service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    const result = await OnlinePaymentService.processWebhookEvent(rawBody, signature);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const message = error?.message || "Webhook processing error";
    const status = error?.code === "BAD_REQUEST" ? 400 : 500;
    console.error("[RazorpayWebhook] Error:", message);
    return NextResponse.json({ error: message }, { status });
  }
}
