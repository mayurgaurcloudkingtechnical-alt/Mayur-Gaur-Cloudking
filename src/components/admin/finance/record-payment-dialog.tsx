"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { PaymentMethod } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPaiseToRupees } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Banknote,
  CreditCard,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Zap,
} from "lucide-react";

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

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeStructureId: string;
  studentName: string;
  pendingAmountPaise: number;
  installments?: Array<{ id: string; installmentNumber: number; amount: number; paidAmount: number }>;
  onSuccess: () => void;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  feeStructureId,
  studentName,
  pendingAmountPaise,
  installments = [],
  onSuccess,
}: RecordPaymentDialogProps) {
  // Tabs: "OFFLINE" (Cash / Campus Counter / Cheque / Bank Transfer) or "ONLINE_RAZORPAY" (UPI, Card, NetBanking, EMI)
  const [channel, setChannel] = useState<"OFFLINE" | "ONLINE_RAZORPAY">("OFFLINE");

  const [rupees, setRupees] = useState<string>("");
  const [offlineMethod, setOfflineMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [installmentId, setInstallmentId] = useState<string>("");
  const [providerRef, setProviderRef] = useState<string>("");
  const [collectorName, setCollectorName] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingOnline, setIsProcessingOnline] = useState(false);
  const [onlineSuccessInfo, setOnlineSuccessInfo] = useState<{
    receiptNumber?: string | null;
    paymentId: string;
  } | null>(null);

  const unpaidInstallments = installments.filter((i) => i.paidAmount < i.amount);

  const recordOfflineMutation = api.finance.recordOfflinePayment.useMutation({
    onSuccess: () => {
      resetFields();
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });

  const createOrderMutation = api.payment.createFeePaymentOrder.useMutation();
  const verifyPaymentMutation = api.payment.verifyFeePayment.useMutation();

  const resetFields = () => {
    setRupees("");
    setProviderRef("");
    setCollectorName("");
    setRemarks("");
    setErrorMessage(null);
    setOnlineSuccessInfo(null);
    setIsProcessingOnline(false);
  };

  const handleOfflineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const enteredRupees = parseFloat(rupees);
    if (isNaN(enteredRupees) || enteredRupees <= 0) {
      setErrorMessage("Please enter a valid payment amount greater than zero.");
      return;
    }

    const amountPaise = Math.round(enteredRupees * 100);
    if (amountPaise > pendingAmountPaise) {
      setErrorMessage(`Amount exceeds outstanding balance of ${formatPaiseToRupees(pendingAmountPaise)}.`);
      return;
    }

    if ((offlineMethod === PaymentMethod.CHEQUE || offlineMethod === PaymentMethod.BANK_TRANSFER) && !providerRef.trim()) {
      setErrorMessage("Cheque Number or Bank UTR/Transaction Reference is required for offline bank verification.");
      return;
    }

    const fullRemarks = [
      collectorName.trim() ? `Collected by: ${collectorName.trim()}` : "",
      remarks.trim(),
    ]
      .filter(Boolean)
      .join(" | ");

    recordOfflineMutation.mutate({
      feeStructureId,
      installmentId: installmentId ? installmentId : undefined,
      amount: amountPaise,
      paymentMethod: offlineMethod,
      providerReference: providerRef.trim() || undefined,
      remarks: fullRemarks || undefined,
    });
  };

  const handleOnlineRazorpaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const enteredRupees = parseFloat(rupees);
    if (isNaN(enteredRupees) || enteredRupees <= 0) {
      setErrorMessage("Please enter a valid payment amount greater than zero.");
      return;
    }

    const amountPaise = Math.round(enteredRupees * 100);
    if (amountPaise > pendingAmountPaise) {
      setErrorMessage(`Amount exceeds outstanding balance of ${formatPaiseToRupees(pendingAmountPaise)}.`);
      return;
    }

    try {
      setIsProcessingOnline(true);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay SDK. Please check your internet connection.");
      }

      const order = await createOrderMutation.mutateAsync({
        feeStructureId,
        installmentId: installmentId || undefined,
        amountPaise,
        provider: "RAZORPAY",
      });

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "SoftLab Global",
        description: `Fee Collection: ${studentName}`,
        order_id: order.orderId,
        image: "https://lms.softlabglobal.com/images/softlab-id-logo-transparent.png",
        theme: {
          color: "#059669",
        },
        handler: async (resp: any) => {
          try {
            setIsProcessingOnline(true);
            const verifyRes = await verifyPaymentMutation.mutateAsync({
              gatewayOrderId: resp.razorpay_order_id,
              gatewayPaymentId: resp.razorpay_payment_id,
              gatewaySignature: resp.razorpay_signature,
            });

            setOnlineSuccessInfo({
              receiptNumber: verifyRes.receiptNumber,
              paymentId: resp.razorpay_payment_id,
            });
            onSuccess();
          } catch (verErr: any) {
            setErrorMessage(verErr.message || "Payment verification failed.");
          } finally {
            setIsProcessingOnline(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingOnline(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (failRes: any) => {
        setIsProcessingOnline(false);
        setErrorMessage(failRes.error?.description || "Payment was rejected or cancelled.");
      });

      rzp.open();
    } catch (err: any) {
      setIsProcessingOnline(false);
      setErrorMessage(err.message || "Failed to initiate online Razorpay transaction.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-xs">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Unified Payment Collection</span>
            <Badge variant="outline" className="text-[11px] font-mono font-medium">
              {studentName}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Process campus cash collection or launch real-time Razorpay checkout for UPI, card, or net banking.
          </DialogDescription>
        </DialogHeader>

        {/* Channel Selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setChannel("OFFLINE");
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-semibold text-xs transition-all ${
              channel === "OFFLINE"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Banknote className="h-4 w-4" />
            Offline Campus / Cash
          </button>
          <button
            type="button"
            onClick={() => {
              setChannel("ONLINE_RAZORPAY");
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-semibold text-xs transition-all ${
              channel === "ONLINE_RAZORPAY"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="h-4 w-4 text-emerald-600" />
            Razorpay Online (UPI/Card)
          </button>
        </div>

        {/* Balance Overview */}
        <div className="rounded-md bg-emerald-50/70 p-2.5 border border-emerald-100 flex justify-between items-center">
          <span className="text-slate-600 font-medium">Outstanding Balance:</span>
          <span className="font-bold text-emerald-800 text-sm">{formatPaiseToRupees(pendingAmountPaise)}</span>
        </div>

        {errorMessage && (
          <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 flex items-start gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {onlineSuccessInfo ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-emerald-900 text-sm">Payment Verified Successfully</h4>
            <p className="text-slate-600 text-[11px]">
              Razorpay Payment ID: <span className="font-mono font-semibold">{onlineSuccessInfo.paymentId}</span>
            </p>
            {onlineSuccessInfo.receiptNumber && (
              <p className="text-slate-600 text-[11px]">
                Receipt Number: <span className="font-mono font-semibold text-emerald-700">{onlineSuccessInfo.receiptNumber}</span>
              </p>
            )}
            <Button
              size="sm"
              className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white w-full text-xs"
              onClick={() => {
                resetFields();
                onOpenChange(false);
              }}
            >
              Done & Close
            </Button>
          </div>
        ) : channel === "OFFLINE" ? (
          /* OFFLINE COLLECTION FORM */
          <form onSubmit={handleOfflineSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Payment Amount (₹ INR) *</label>
              <Input
                type="number"
                step="1"
                min="1"
                max={Math.floor(pendingAmountPaise / 100)}
                placeholder="e.g. 10000"
                value={rupees}
                onChange={(e) => setRupees(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Offline Mode *</label>
                <select
                  value={offlineMethod}
                  onChange={(e) => setOfflineMethod(e.target.value as PaymentMethod)}
                  className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                >
                  <option value={PaymentMethod.CASH}>Cash (In-person Campus)</option>
                  <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value={PaymentMethod.CHEQUE}>Cheque / Demand Draft</option>
                  <option value={PaymentMethod.OTHER}>Other Offline Campus Mode</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Allocate Installment</label>
                <select
                  value={installmentId}
                  onChange={(e) => setInstallmentId(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                >
                  <option value="">Auto (Chronological)</option>
                  {unpaidInstallments.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      #{inst.installmentNumber} (Due: {formatPaiseToRupees(inst.amount - inst.paidAmount)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {offlineMethod === PaymentMethod.CASH ? "Cash Receipt Reference (Optional)" : "UTR / Cheque Ref *"}
              </label>
              <Input
                placeholder={
                  offlineMethod === PaymentMethod.CASH
                    ? "e.g. Counter Cash Voucher #042"
                    : "e.g. Bank UTR / Cheque Number"
                }
                value={providerRef}
                onChange={(e) => setProviderRef(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Collector Name / Counter</label>
                <Input
                  placeholder="e.g. Accounts Desk (Prayagraj)"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Notes / Remarks</label>
                <Input
                  placeholder="e.g. Balance installment"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={recordOfflineMutation.isPending}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={recordOfflineMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8"
              >
                {recordOfflineMutation.isPending ? "Recording Cash..." : "Record Offline Payment"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* ONLINE RAZORPAY FORM */
          <form onSubmit={handleOnlineRazorpaySubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Amount to Pay via Razorpay (₹ INR) *</label>
              <Input
                type="number"
                step="1"
                min="1"
                max={Math.floor(pendingAmountPaise / 100)}
                placeholder="e.g. 10000"
                value={rupees}
                onChange={(e) => setRupees(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Installment to Settle</label>
              <select
                value={installmentId}
                onChange={(e) => setInstallmentId(e.target.value)}
                className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
              >
                <option value="">Auto (Chronological Installment Settlement)</option>
                {unpaidInstallments.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    Installment #{inst.installmentNumber} (Due: {formatPaiseToRupees(inst.amount - inst.paidAmount)})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Authoritative Razorpay Gateway</span>
              </div>
              <p>
                Clicking the button below will initiate the official Razorpay checkout modal with UPI, NetBanking, Debit/Credit Card, and pre-approved merchant EMI options.
              </p>
              <p className="text-emerald-700 font-medium">
                Single-pass GST and ledger reconciliation will be performed automatically upon signature verification.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isProcessingOnline}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isProcessingOnline || !rupees || parseFloat(rupees) <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 gap-1"
              >
                {isProcessingOnline ? (
                  <>
                    <LoadingSpinner className="h-3.5 w-3.5" />
                    Opening Razorpay...
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    Launch Razorpay Checkout
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
