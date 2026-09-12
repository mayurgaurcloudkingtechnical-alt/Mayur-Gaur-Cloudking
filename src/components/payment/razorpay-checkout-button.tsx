"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";

interface RazorpayCheckoutButtonProps {
  applicationId: string;
  courseTitle: string;
  amountPaise: number;
  className?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RazorpayCheckoutButton({
  applicationId,
  courseTitle,
  amountPaise,
  className,
}: RazorpayCheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createOrderMutation = api.payment.createAdmissionOrder.useMutation();
  const verifyPaymentMutation = api.payment.verifyPayment.useMutation();

  const handlePayment = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Load Razorpay SDK
      const scriptLoaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!scriptLoaded) {
        setErrorMsg("Failed to load payment gateway. Please check your internet connection.");
        setLoading(false);
        return;
      }

      // 2. Request authoritative server order
      const orderData = await createOrderMutation.mutateAsync({ applicationId });

      // 3. Configure Razorpay modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SOFTLAB GLOBAL",
        description: `Admission Fee: ${orderData.courseTitle}`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.applicantName,
          email: orderData.applicantEmail,
          contact: orderData.applicantPhone,
        },
        theme: {
          color: "#0f172a",
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResult = await verifyPaymentMutation.mutateAsync({
              gatewayOrderId: response.razorpay_order_id,
              gatewayPaymentId: response.razorpay_payment_id,
              gatewaySignature: response.razorpay_signature,
            });

            router.push(
              `/payment/success?orderId=${encodeURIComponent(
                response.razorpay_order_id
              )}&receipt=${encodeURIComponent(verifyResult.receiptNumber || "")}`
            );
          } catch (err: any) {
            console.error("Payment verification failure:", err);
            router.push(
              `/payment/failed?orderId=${encodeURIComponent(
                response.razorpay_order_id
              )}&reason=${encodeURIComponent("verification_failed")}`
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setLoading(false);
        const reason = response.error?.description || "payment_declined";
        router.push(
          `/payment/failed?orderId=${encodeURIComponent(orderData.orderId)}&reason=${encodeURIComponent(
            reason
          )}`
        );
      });

      rzp.open();
    } catch (error: any) {
      console.error("Order initiation error:", error);
      setErrorMsg(error.message || "Could not initiate payment order.");
      setLoading(false);
    }
  };

  const formattedAmount = (amountPaise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-1">
      <Button
        onClick={handlePayment}
        disabled={loading}
        className={`relative inline-flex items-center justify-center gap-2 font-medium shadow-sm transition-all ${className || ""}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing Gateway...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            <span>Pay Online ({formattedAmount})</span>
            <ShieldCheck className="h-4 w-4 opacity-70" />
          </>
        )}
      </Button>
      {errorMsg && <p className="text-[11px] text-red-600 font-medium">{errorMsg}</p>}
    </div>
  );
}
