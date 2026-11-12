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

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
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
  extraVerificationData?: Record<string, any>;
  onBeforeCheckout?: () => boolean;
  onSuccess?: (data: {
    orderId: string;
    paymentId: string;
    signature: string;
    receiptNumber?: string | null;
    transactionReference?: string | null;
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
  extraVerificationData,
  onBeforeCheckout,
  onSuccess,
  onError,
}: RazorpayStandardCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    orderId: string;
    paymentId: string;
    receiptNumber?: string | null;
  } | null>(null);

  const keyId =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_TtiVjZsYU4u6yI";

  const handleCheckout = async () => {
    try {
      setErrorMsg(null);
      setSuccessInfo(null);

      // STEP 0: Validate Personal & Contact Details
      if (onBeforeCheckout && !onBeforeCheckout()) {
        setErrorMsg("Please complete all required fields (Name, Email, 10-digit Phone) before proceeding.");
        return;
      }

      if (!customerName || customerName.trim().length < 2) {
        setErrorMsg("Payer / Student Full Name is required (minimum 2 letters).");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!customerEmail || !emailRegex.test(customerEmail.trim())) {
        setErrorMsg("A valid Email Address is required for payment confirmation.");
        return;
      }

      const phoneClean = (customerPhone || "").replace(/\D/g, "");
      if (!phoneClean || phoneClean.length !== 10) {
        setErrorMsg("A valid 10-digit Indian Mobile Number is required.");
        return;
      }

      if (!amountPaise || amountPaise < 100) {
        setErrorMsg("Payable amount must be at least ₹1.00.");
        return;
      }

      setLoading(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay checkout script. Please check your internet connection.");
      }

      // STEP 1: Call Backend to Create Genuine Razorpay Order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
          notes: {
            item: itemName,
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim(),
            customerPhone: customerPhone.trim(),
          },
        }),
      });

      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || !orderData.order_id) {
        throw new Error(
          orderData.error || `Payment gateway rejected order creation (${orderRes.status}).`
        );
      }

      const { order_id, amount, currency } = orderData;
      const activeKey = orderData.key_id || keyId;

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK is not available in browser. Please disable ad-blockers and try again.");
      }

      // STEP 2: Configure & Open Real Razorpay Modal
      const options = {
        key: activeKey,
        amount: amount,
        currency: currency,
        name: "SOFTLAB GLOBAL",
        description: `${itemName} - ${description}`,
        order_id: order_id,
        prefill: {
          name: customerName.trim(),
          email: customerEmail.trim(),
          contact: customerPhone.trim(),
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setErrorMsg("Payment modal closed by user. No transaction was completed.");
            onError?.("Payment cancelled by user.");
          },
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            setLoading(true);
            setErrorMsg(null);
            // STEP 3: Call Backend to Verify Payment Signature
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                amount: amountPaise,
                itemName,
                customerName: customerName.trim(),
                customerEmail: customerEmail.trim(),
                customerPhone: customerPhone.trim(),
                ...(extraVerificationData || {}),
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(
                verifyData.error || "Cryptographic payment verification failed on server."
              );
            }

            setSuccessInfo({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              receiptNumber: verifyData.receiptNumber || null,
            });

            onSuccess?.({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              receiptNumber: verifyData.receiptNumber || null,
              transactionReference: verifyData.transactionReference || null,
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

      // Handle payment failure event from Razorpay
      rzpInstance.on("payment.failed", function (failResponse: any) {
        setLoading(false);
        const failReason =
          failResponse.error?.description ||
          failResponse.error?.reason ||
          "Payment attempt failed.";
        setErrorMsg(`Payment Failed: ${failReason}`);
        onError?.(failReason);
      });

      // Launch official Razorpay Checkout Gateway Window
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
