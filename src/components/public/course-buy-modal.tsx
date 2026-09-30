"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RazorpayStandardCheckout } from "@/components/payment/razorpay-standard-checkout";
import { DualFeeReceipt, DualReceiptData } from "@/components/common/dual-fee-receipt";
import { formatPaiseToRupees } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/constants/site";
import {
  ShieldCheck,
  CreditCard,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  Building2,
  Phone,
  Printer,
  ChevronRight,
  GraduationCap,
  X,
} from "lucide-react";

export interface CourseBuyTarget {
  id?: string;
  title: string;
  slug: string;
  baseFee: number; // in Paise
  durationWeeks?: number;
  level?: string | null;
}

export function CourseBuyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [course, setCourse] = useState<CourseBuyTarget | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [learningMode, setLearningMode] = useState<"OFFLINE" | "ONLINE">("OFFLINE");
  const [paymentPlan, setPaymentPlan] = useState<"FULL" | "TOKEN">("FULL");

  // Success state
  const [successResult, setSuccessResult] = useState<{
    orderId: string;
    paymentId: string;
    receiptNumber?: string | null;
    transactionReference?: string | null;
    amountPaidPaise: number;
  } | null>(null);

  // Fee receipt preview modal state
  const [viewingReceipt, setViewingReceipt] = useState<DualReceiptData | null>(null);

  // Listen for global custom event
  useEffect(() => {
    const handleOpen = (e: CustomEvent<{ course: CourseBuyTarget }>) => {
      if (e.detail?.course) {
        setCourse(e.detail.course);
        setSuccessResult(null);
        setViewingReceipt(null);
        setIsOpen(true);
      }
    };

    window.addEventListener("open-course-buy-modal" as any, handleOpen);
    return () => {
      window.removeEventListener("open-course-buy-modal" as any, handleOpen);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setSuccessResult(null);
    setViewingReceipt(null);
  };

  if (!course) return null;

  // Pricing calculations
  // baseFee is stored in Paise (e.g. 2500000 = ₹25,000)
  const originalFeePaise = course.baseFee && course.baseFee > 0 ? course.baseFee : 2500000;
  // 20% direct website discount on full upfront payment
  const fullDiscountPaise = Math.round(originalFeePaise * 0.2);
  const fullPayablePaise = originalFeePaise - fullDiscountPaise;

  // Token seat reservation amount: ₹5,000 (500000 paise)
  const tokenAmountPaise = Math.min(500000, fullPayablePaise);

  const activeAmountPaise = paymentPlan === "FULL" ? fullPayablePaise : tokenAmountPaise;

  const isFormValid =
    name.trim().length >= 2 &&
    email.trim().includes("@") &&
    phone.trim().replace(/\D/g, "").length >= 10;

  const handleOpenOfficialReceipt = () => {
    if (!successResult) return;
    setViewingReceipt({
      receiptNumber: successResult.receiptNumber || `SLG-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
      receiptDate: new Date(),
      studentName: name.trim() || "Online Enrolled Learner",
      studentId: "SG-ONLINE",
      courseTitle: course.title,
      totalFee: originalFeePaise,
      discountAmount: paymentPlan === "FULL" ? fullDiscountPaise : 0,
      netPayable: originalFeePaise - (paymentPlan === "FULL" ? fullDiscountPaise : 0),
      amountPaid: successResult.amountPaidPaise,
      pendingAmount: Math.max(
        0,
        (originalFeePaise - (paymentPlan === "FULL" ? fullDiscountPaise : 0)) - successResult.amountPaidPaise
      ),
      paymentMode: "RAZORPAY",
      transactionReference: successResult.transactionReference || successResult.paymentId,
      particulars: `Direct Website Admission (${learningMode})`,
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-emerald-500/40 text-slate-100 p-0 shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="relative p-6 pb-5 border-b border-slate-800 bg-gradient-to-br from-emerald-950/80 via-slate-950 to-slate-950">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-600/60 text-emerald-300 text-[11px] font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Instant Enrollment • Razorpay Gateway</span>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-mono border-emerald-500/50 text-emerald-400">
                100% Encrypted
              </Badge>
            </div>

            <DialogTitle className="text-xl sm:text-2xl font-black text-white leading-tight">
              {course.title}
            </DialogTitle>

            <DialogDescription className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              {course.durationWeeks && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{course.durationWeeks} Weeks Program</span>
                </span>
              )}
              {course.level && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{course.level} Level</span>
                </span>
              )}
              <span className="text-emerald-400 font-semibold">
                Civil Lines Campus, Prayagraj & Online
              </span>
            </DialogDescription>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            {successResult ? (
              /* Success View */
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-900/50 border-2 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-950/50">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Enrollment Confirmed!</h3>
                  <p className="text-xs text-emerald-300 font-medium">
                    Payment of {formatPaiseToRupees(successResult.amountPaidPaise)} successfully received via Razorpay.
                  </p>
                </div>

                <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 text-left text-xs space-y-2 font-mono">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Receipt Number:</span>
                    <span className="font-bold text-emerald-400">{successResult.receiptNumber || "Generated"}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Payment ID:</span>
                    <span className="text-slate-200">{successResult.paymentId}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Order ID:</span>
                    <span className="text-slate-200">{successResult.orderId}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Course:</span>
                    <span className="text-slate-200 truncate max-w-[200px]">{course.title}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Learner Name:</span>
                    <span className="text-slate-200">{name}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-left text-xs text-slate-300 space-y-1 leading-relaxed">
                  <p className="font-bold text-emerald-300">Next Steps & Onboarding:</p>
                  <p>
                    Our Senior Academic Counselor will reach out to you on <strong>{phone}</strong> within 2 hours to confirm your preferred batch timings, lab access, and send your LMS credentials.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    onClick={handleOpenOfficialReceipt}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 gap-1.5 shadow-md shadow-emerald-950/50"
                  >
                    <Printer className="h-4 w-4" />
                    <span>View & Print Official Fee Receipt</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-10"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              /* Checkout Form */
              <div className="space-y-4">
                {/* 1. Payment Plan Selection */}
                <div>
                  <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                    Step 1: Choose Payment Option
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Full Upfront Payment (20% Off) */}
                    <button
                      type="button"
                      onClick={() => setPaymentPlan("FULL")}
                      className={`p-3.5 rounded-xl border text-left transition-all relative ${
                        paymentPlan === "FULL"
                          ? "bg-emerald-950/70 border-emerald-500 shadow-md shadow-emerald-950/60 ring-1 ring-emerald-500"
                          : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">Full Program Fee</span>
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-700/60">
                          Save 20% Direct
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-emerald-400">
                          {formatPaiseToRupees(fullPayablePaise)}
                        </span>
                        <span className="text-xs text-slate-500 line-through">
                          {formatPaiseToRupees(originalFeePaise)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        One-time settlement with immediate full course access and certification guarantee.
                      </p>
                    </button>

                    {/* Token Seat Reservation */}
                    <button
                      type="button"
                      onClick={() => setPaymentPlan("TOKEN")}
                      className={`p-3.5 rounded-xl border text-left transition-all relative ${
                        paymentPlan === "TOKEN"
                          ? "bg-emerald-950/70 border-emerald-500 shadow-md shadow-emerald-950/60 ring-1 ring-emerald-500"
                          : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">Seat Booking Token</span>
                        <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          Flexible EMI
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-emerald-400">
                          {formatPaiseToRupees(tokenAmountPaise)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Lock your seat in the upcoming batch. Balance payable in easy interest-free monthly EMIs.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. Learner Details */}
                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Step 2: Learner Details
                  </Label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Full Name *</label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 text-xs h-9 focus-visible:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">WhatsApp / Phone *</label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 text-xs h-9 focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Email Address *</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 text-xs h-9 focus-visible:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Training Mode *</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLearningMode("OFFLINE")}
                          className={`py-1.5 px-2 rounded-md text-[11px] font-semibold border transition-all ${
                            learningMode === "OFFLINE"
                              ? "bg-emerald-600 text-white border-emerald-500"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                          }`}
                        >
                          Civil Lines Campus
                        </button>
                        <button
                          type="button"
                          onClick={() => setLearningMode("ONLINE")}
                          className={`py-1.5 px-2 rounded-md text-[11px] font-semibold border transition-all ${
                            learningMode === "ONLINE"
                              ? "bg-emerald-600 text-white border-emerald-500"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                          }`}
                        >
                          Live Interactive
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Fee Summary & Razorpay Standard Checkout */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Payable Amount:</span>
                    <span className="text-lg font-black text-emerald-400">
                      {formatPaiseToRupees(activeAmountPaise)}
                    </span>
                  </div>

                  {!isFormValid ? (
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                      <p className="text-xs text-amber-400 font-medium">
                        Please fill in your Name, Email, and 10-digit Phone number above to proceed with payment.
                      </p>
                    </div>
                  ) : (
                    <RazorpayStandardCheckout
                      amountPaise={activeAmountPaise}
                      itemName={course.title}
                      description={`Admission (${learningMode}): ${course.title}`}
                      customerName={name.trim()}
                      customerEmail={email.trim()}
                      customerPhone={phone.trim()}
                      buttonText={`Pay ${formatPaiseToRupees(activeAmountPaise)} via Razorpay`}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 text-sm shadow-lg shadow-emerald-950/60"
                      extraVerificationData={{
                        courseId: course.id,
                        courseTitle: course.title,
                        slug: course.slug,
                        learningMode,
                        paymentPlan,
                      }}
                      onSuccess={(res) => {
                        setSuccessResult({
                          orderId: res.orderId,
                          paymentId: res.paymentId,
                          receiptNumber: res.receiptNumber,
                          transactionReference: res.transactionReference,
                          amountPaidPaise: activeAmountPaise,
                        });
                      }}
                    />
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>SOFTLAB GLOBAL Institutional Desk</span>
                    </span>
                    <span>Direct GST Invoice Included</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Official Receipt Viewer Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center overflow-y-auto print:bg-white print:p-0 print:m-0 print:overflow-visible">
          <DualFeeReceipt
            data={viewingReceipt}
            onClose={() => setViewingReceipt(null)}
          />
        </div>
      )}
    </>
  );
}

// Global helper to open course checkout from any card or button
export function openCourseBuyModal(course: CourseBuyTarget) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("open-course-buy-modal", { detail: { course } })
    );
  }
}
