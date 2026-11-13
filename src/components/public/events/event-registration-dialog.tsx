"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/trpc/react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  IndianRupee,
  ShieldCheck,
  Award,
  Sparkles,
  MapPin,
  Check,
  Copy,
} from "lucide-react";
import { RazorpayStandardCheckout } from "@/components/payment/razorpay-standard-checkout";

interface EventRegistrationDialogProps {
  event: {
    id: string;
    title: string;
    slug: string;
    programType: string;
    fee: number; // in Paise
    originalFee?: number | null;
    duration: string;
    mode: string;
    venue: string;
    startDate?: Date | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventRegistrationDialog({
  event,
  open,
  onOpenChange,
}: EventRegistrationDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [qualification, setQualification] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    registrationNumber: string;
    paymentReference?: string;
    amount: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const registerMutation = api.events.registerForEvent.useMutation();
  const verifyMutation = api.events.verifyPayment.useMutation();

  if (!event) return null;

  const feeInr = Math.round(event.fee / 100);
  const originalFeeInr = event.originalFee ? Math.round(event.originalFee / 100) : null;
  const savings = originalFeeInr ? originalFeeInr - feeInr : 0;

  const handleFreeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await registerMutation.mutateAsync({
        eventId: event.id,
        fullName,
        email,
        phone,
        city,
        qualification,
        notes,
      });

      setSuccessData({
        registrationNumber: res.registrationNumber,
        amount: 0,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to complete registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Register
      const regRes = await registerMutation.mutateAsync({
        eventId: event.id,
        fullName,
        email,
        phone,
        city,
        qualification,
        notes,
      });

      // 2. Verify payment
      const verifyRes = await verifyMutation.mutateAsync({
        registrationId: regRes.registrationId,
        razorpayOrderId: paymentData.orderId,
        razorpayPaymentId: paymentData.paymentId,
        razorpaySignature: paymentData.signature,
      });

      setSuccessData({
        registrationNumber: verifyRes.registrationNumber,
        paymentReference: verifyRes.paymentReference,
        amount: verifyRes.amount,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || "Payment verification failed. Please contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRegNumber = () => {
    if (successData?.registrationNumber) {
      navigator.clipboard.writeText(successData.registrationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5">
              {event.programType.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="text-slate-400 border-slate-700 text-xs">
              {event.mode} Mode
            </Badge>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {event.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            Complete the official registration form to secure your verified seat.
          </DialogDescription>
        </DialogHeader>

        {/* Success confirmation */}
        {successData ? (
          <div className="py-6 space-y-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-950/40 animate-in zoom-in-75">
              <CheckCircle2 className="h-9 w-9 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-white">Registration Confirmed!</h3>
              <p className="text-sm text-slate-400">
                Welcome aboard! Your seat for <span className="text-emerald-400 font-semibold">{event.title}</span> has been confirmed.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-medium text-slate-400 tracking-wider">
                  Registration Number
                </span>
                <button
                  type="button"
                  onClick={copyRegNumber}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="text-lg font-mono font-bold text-emerald-400 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between">
                <span>{successData.registrationNumber}</span>
              </div>

              {successData.paymentReference && (
                <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span>Razorpay Reference:</span>
                  <span className="font-mono text-slate-300">{successData.paymentReference}</span>
                </div>
              )}
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Amount Paid:</span>
                <span className="font-semibold text-emerald-400">
                  {feeInr > 0 ? `₹${feeInr.toLocaleString("en-IN")}` : "Free"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 text-xs text-emerald-300/90 text-left space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-300">
                <Award className="h-4 w-4" />
                <span>Next Steps & Credentials</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                A confirmation has been sent to <strong className="text-white">{email}</strong>. Our academic team will invite you to the private learning cohort, LMS orientation, and lab environment before the start date.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11"
            >
              Done & Return to Events
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Pricing Summary Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Program Fee
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-emerald-400">
                    {feeInr > 0 ? `₹${feeInr.toLocaleString("en-IN")}` : "Free Entry"}
                  </span>
                  {originalFeeInr && originalFeeInr > feeInr && (
                    <span className="text-sm line-through text-slate-500">
                      ₹{originalFeeInr.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
              {savings > 0 && (
                <div className="text-right">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                    Save ₹{savings.toLocaleString("en-IN")}
                  </Badge>
                  <div className="text-[11px] text-slate-400 mt-1">Duration: {event.duration}</div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3.5 text-xs text-red-200 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Registration Input Form */}
            <form onSubmit={handleFreeRegistration} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name" className="text-xs text-slate-300 font-medium">
                    Full Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="reg-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Mayur Gaur"
                    className="h-9 bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-phone" className="text-xs text-slate-300 font-medium">
                    WhatsApp / Phone Number <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    required
                    maxLength={15}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="h-9 bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-xs text-slate-300 font-medium">
                    Email Address <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-9 bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-city" className="text-xs text-slate-300 font-medium">
                    City / Location
                  </Label>
                  <Input
                    id="reg-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Prayagraj / Varanasi"
                    className="h-9 bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-qual" className="text-xs text-slate-300 font-medium">
                  Highest Qualification / Current Degree
                </Label>
                <Input
                  id="reg-qual"
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. B.Tech CS 3rd Year / BCA Graduate"
                  className="h-9 bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-notes" className="text-xs text-slate-300 font-medium">
                  Questions or Special Requests (Optional)
                </Label>
                <Input
                  id="reg-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific domain focus (e.g. AI, Cyber Security, Full Stack)"
                  className="h-9 bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Verified SoftLab Global Certificate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>100% Practical Hands-on</span>
                </div>
              </div>

              {/* Checkout / Submit Action */}
              <div className="pt-2">
                {feeInr > 0 ? (
                  <RazorpayStandardCheckout
                    amountPaise={event.fee}
                    itemName={`Registration: ${event.title}`}
                    description={`SoftLab Global ${event.programType} Registration`}
                    customerName={fullName}
                    customerEmail={email}
                    customerPhone={phone}
                    buttonText={`Pay ₹${feeInr.toLocaleString("en-IN")} via Razorpay & Confirm Seat`}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 text-sm shadow-lg shadow-emerald-950/60"
                    onBeforeCheckout={() => {
                      if (!fullName || !email || !phone) {
                        setErrorMessage("Please complete all required fields (Name, Phone, Email) first.");
                        return false;
                      }
                      setErrorMessage(null);
                      return true;
                    }}
                    onSuccess={(data) => {
                      handlePaymentSuccess({
                        orderId: data.orderId,
                        paymentId: data.paymentId,
                        signature: data.signature,
                      });
                    }}
                    onError={(err) => setErrorMessage(err)}
                  />
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>Confirming Seat...</span>
                      </>
                    ) : (
                      "Confirm Free Registration"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}