"use client";

import React, { useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayStandardCheckoutProps {
  amountPaise: number;
  itemName?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  buttonText?: string;
  className?: string;
  onSuccess?: (data: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) => void;
  onError?: (error: string) => void;
}

export function RazorpayStandardCheckout({
  amountPaise,
  itemName = "Course Fee / Educational Services",
  description = "Online Tuition Settlement",
  customerName,
  customerEmail,
  customerPhone,
  buttonText,
  className,
  onSuccess,
  onError,
}: RazorpayStandardCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    orderId: string;
    paymentId: string;
  } | null>(null);

  const keyId =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TgDdjsEItAotKI";

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessInfo(null);

      if (typeof window === "undefined" || !window.Razorpay) {
        throw new Error(
          "Razorpay Checkout SDK is still loading. Please check your network and try again."
        );
      }

      // STEP 1: Call Backend to Create Order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
          notes: {
            item: itemName,
            customerEmail: customerEmail || "",
          },
        }),
      });

      if (!orderRes.ok) {
        const errJson = await orderRes.json().catch(() => ({}));
        throw new Error(
          errJson.error || `Failed to create payment order (${orderRes.status})`
        );
      }

      const orderData = await orderRes.json();
      const { order_id, amount, currency } = orderData;

      // STEP 2: Configure & Open Razorpay Modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "SOFTLAB GLOBAL",
        description: `${itemName} - ${description}`,
        order_id: order_id,
        prefill: {
          name: customerName || "",
          email: customerEmail || "",
          contact: customerPhone || "",
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setErrorMsg("Payment modal closed by user.");
            onError?.("Payment cancelled by user.");
          },
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // STEP 3: Call Backend to Verify Payment Signature
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(
                verifyData.error || "Cryptographic payment verification failed."
              );
            }

            setSuccessInfo({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
            });

            onSuccess?.({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
          } catch (verErr: any) {
            console.error("[RazorpayCheckout] Verification Error:", verErr);
            setErrorMsg(
              verErr.message || "Payment verification failed on server."
            );
            onError?.(verErr.message || "Payment verification failed.");
          } finally {
            setLoading(false);
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);

      // Handle payment failure event
      rzpInstance.on("payment.failed", function (failResponse: any) {
        setLoading(false);
        const failReason =
          failResponse.error?.description ||
          failResponse.error?.reason ||
          "Payment attempt failed.";
        setErrorMsg(`Payment Failed: ${failReason}`);
        onError?.(failReason);
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error("[RazorpayCheckout] Error:", err);
      setErrorMsg(err.message || "Failed to start payment.");
      setLoading(false);
      onError?.(err.message || "Failed to start payment.");
    }
  };

  const formattedAmount = (amountPaise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="w-full space-y-3">
      {/* Ensure checkout.js script is loaded */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <Button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full relative inline-flex items-center justify-center gap-2 font-semibold shadow-md transition-all ${
          className || "bg-indigo-600 hover:bg-indigo-700 text-white"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting to Razorpay...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>{buttonText || `Pay ${formattedAmount} via Razorpay`}</span>
          </>
        )}
      </Button>

      {/* Error state */}
      {errorMsg && (
        <div className="flex items-start gap-2 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success state */}
      {successInfo && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <div>
            <p className="font-bold">Payment Verified Successfully!</p>
            <p className="text-[11px] font-mono text-emerald-700">
              Payment ID: {successInfo.paymentId}
            </p>
            <p className="text-[11px] font-mono text-emerald-700">
              Order ID: {successInfo.orderId}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
