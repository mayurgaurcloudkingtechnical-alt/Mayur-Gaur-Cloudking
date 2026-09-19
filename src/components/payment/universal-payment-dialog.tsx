"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPaiseToRupees } from "@/lib/utils";
import { CreditCard, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

interface UniversalPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeStructureId: string;
  installmentId?: string;
  installmentNumber?: number;
  courseTitle: string;
  amountPaise: number;
  onSuccess: () => void;
}

export function UniversalPaymentDialog({
  open,
  onOpenChange,
  feeStructureId,
  installmentId,
  installmentNumber,
  courseTitle,
  amountPaise,
  onSuccess,
}: UniversalPaymentDialogProps) {
  const [selectedProvider, setSelectedProvider] = useState<"STRIPE" | "RAZORPAY">("STRIPE");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const gatewayStatus = api.payment.getGatewayStatus.useQuery(undefined, {
    enabled: open,
  });

  const createOrderMutation = api.payment.createFeePaymentOrder.useMutation();
  const verifyFeePaymentMutation = api.payment.verifyFeePayment.useMutation();

  // Reset state on open
  React.useEffect(() => {
    if (open) {
      setPaymentSuccess(false);
      setReceiptNumber(null);
      setErrorMessage(null);
      setIsProcessing(false);
      if (gatewayStatus.data?.activeProvider === "RAZORPAY") {
        setSelectedProvider("RAZORPAY");
      } else {
        setSelectedProvider("STRIPE");
      }
    }
  }, [open, gatewayStatus.data]);

  const handlePay = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      // 1. Create order on authoritative server
      const order = await createOrderMutation.mutateAsync({
        feeStructureId,
        installmentId,
        amountPaise,
        provider: selectedProvider,
      });

      // 2. Handle Stripe checkout redirection or simulated checkout
      if (order.provider === "STRIPE") {
        if (order.checkoutUrl && order.checkoutUrl.startsWith("http")) {
          window.location.href = order.checkoutUrl;
          return;
        }

        // Test/simulated payment completion
        const verifyRes = await verifyFeePaymentMutation.mutateAsync({
          gatewayOrderId: order.orderId,
          gatewayPaymentId: `pay_sim_${Date.now()}`,
          gatewaySignature: `sig_test_${order.orderId}`,
        });

        setReceiptNumber(verifyRes.receiptNumber);
        setPaymentSuccess(true);
        onSuccess();
      } else {
        // Razorpay checkout
        if (typeof window !== "undefined" && (window as any).Razorpay) {
          const rzp = new (window as any).Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: "SOFTLAB GLOBAL",
            description: order.description,
            order_id: order.orderId,
            handler: async (resp: any) => {
              try {
                const verifyRes = await verifyFeePaymentMutation.mutateAsync({
                  gatewayOrderId: resp.razorpay_order_id,
                  gatewayPaymentId: resp.razorpay_payment_id,
                  gatewaySignature: resp.razorpay_signature,
                });
                setReceiptNumber(verifyRes.receiptNumber);
                setPaymentSuccess(true);
                onSuccess();
              } catch (err: any) {
                setErrorMessage(err.message || "Payment verification failed.");
              }
            },
          });
          rzp.open();
        } else {
          // Simulation fallback for Razorpay
          const verifyRes = await verifyFeePaymentMutation.mutateAsync({
            gatewayOrderId: order.orderId,
            gatewayPaymentId: `pay_sim_${Date.now()}`,
            gatewaySignature: `sig_test_${order.orderId}`,
          });

          setReceiptNumber(verifyRes.receiptNumber);
          setPaymentSuccess(true);
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      setErrorMessage(err.message || "Failed to initiate online payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            {paymentSuccess ? "Payment Successful" : "Online Fee Payment"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {paymentSuccess
              ? "Your payment has been cryptographically verified and recorded in the institutional ledger."
              : `Secure tuition fee settlement for ${courseTitle}.`}
          </DialogDescription>
        </DialogHeader>

        {paymentSuccess ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">
                Settled: {formatPaiseToRupees(amountPaise)}
              </p>
              {receiptNumber && (
                <p className="text-xs font-mono text-slate-600">
                  Receipt No: <strong>{receiptNumber}</strong>
                </p>
              )}
              {installmentNumber && (
                <p className="text-xs text-emerald-700">
                  Installment #{installmentNumber} is now marked as settled.
                </p>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              A verifiable PDF receipt has been generated and added to your fee ledger.
            </p>
            <Button
              className="w-full bg-slate-900 text-white hover:bg-slate-800 text-xs"
              onClick={() => onOpenChange(false)}
            >
              Close & View Updated Ledger
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Amount Summary Card */}
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">
                  {installmentNumber
                    ? `Installment #${installmentNumber}`
                    : "Outstanding Tuition Balance"}
                </span>
                <span className="text-base font-bold text-slate-900">
                  {formatPaiseToRupees(amountPaise)}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>256-Bit SSL Encrypted Enterprise Checkout</span>
              </div>
            </div>

            {/* Gateway Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProvider("STRIPE")}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                    selectedProvider === "STRIPE"
                      ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900">Credit / Debit Card</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Powered by Stripe</span>
                  {gatewayStatus.data?.stripe.configured && (
                    <Badge className="mt-1 bg-emerald-100 text-emerald-800 text-[9px] px-1 py-0">
                      Live
                    </Badge>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider("RAZORPAY")}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                    selectedProvider === "RAZORPAY"
                      ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900">UPI / NetBanking</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Powered by Razorpay</span>
                  {gatewayStatus.data?.razorpay.configured && (
                    <Badge className="mt-1 bg-emerald-100 text-emerald-800 text-[9px] px-1 py-0">
                      Live
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                className="text-xs"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs flex items-center gap-1.5"
                onClick={handlePay}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Connecting Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Pay {formatPaiseToRupees(amountPaise)}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
