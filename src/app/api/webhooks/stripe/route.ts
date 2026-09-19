import { NextRequest, NextResponse } from "next/server";
import { OnlinePaymentService } from "@/server/services/online-payment.service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const result = await OnlinePaymentService.processStripeWebhookEvent(rawBody, signature);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const message = error?.message || "Stripe webhook processing error";
    const status = error?.code === "BAD_REQUEST" ? 400 : 500;
    console.error("[StripeWebhook] Error:", message);
    return NextResponse.json({ error: message }, { status });
  }
}
