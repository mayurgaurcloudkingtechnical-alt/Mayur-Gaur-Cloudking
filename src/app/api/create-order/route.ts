import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, currency = "INR", receipt, notes = {} } = body;

    // Validate amount >= 100 paise (₹1)
    if (typeof amount !== "number" || isNaN(amount) || amount < 100) {
      return NextResponse.json(
        { error: "Invalid amount. Minimum amount is 100 paise (₹1.00)." },
        { status: 400 }
      );
    }

    const keyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      env.RAZORPAY_KEY_ID;
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on server." },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const orderReceipt =
      receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency: currency.toUpperCase(),
        receipt: orderReceipt,
        notes: typeof notes === "object" && notes !== null ? notes : {},
      }),
    });

    if (response.status === 401) {
      return NextResponse.json(
        { error: "Razorpay authentication failed. Invalid API credentials." },
        { status: 401 }
      );
    }

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: { description: "Razorpay order creation failed" } }));
      const description =
        errorData?.error?.description || "Razorpay API returned an error.";
      return NextResponse.json(
        { error: description },
        { status: response.status >= 400 && response.status < 500 ? response.status : 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json(
      {
        order_id: data.id,
        amount: data.amount,
        currency: data.currency,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[CreateOrderAPI] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error while creating order" },
      { status: 500 }
    );
  }
}
