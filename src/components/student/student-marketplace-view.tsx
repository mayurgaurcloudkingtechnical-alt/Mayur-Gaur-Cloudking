"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  FileText,
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

type DurationFilter = "ALL" | "3_MONTHS" | "6_MONTHS" | "OTHER";

export function StudentMarketplaceView() {
  const router = useRouter();
  const utils = api.useUtils();

  const [durationFilter, setDurationFilter] = React.useState<DurationFilter>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [levelFilter, setLevelFilter] = React.useState("ALL");

  // Selected course for checkout dialog
  const [selectedCourse, setSelectedCourse] = React.useState<any | null>(null);
  const [learningMode, setLearningMode] = React.useState<"HYBRID" | "ONLINE" | "CLASSROOM">("HYBRID");
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);

  // Success dialog state
  const [purchaseSuccess, setPurchaseSuccess] = React.useState<{
    courseTitle: string;
    enrollmentId: string;
    receiptNumber?: string | null;
    invoiceNumber?: string | null;
  } | null>(null);

  const { data: courses, isLoading, error } = api.course.getMarketplaceCourses.useQuery({
    durationFilter,
    search: searchQuery,
    level: levelFilter,
  });

  const createOrderMutation = api.payment.createMarketplaceOrder.useMutation();
  const verifyPurchaseMutation = api.payment.verifyMarketplacePurchase.useMutation();

  const handleOpenCheckout = (course: any) => {
    setSelectedCourse(course);
    setPaymentError(null);
  };

  const handleStartRazorpayCheckout = async () => {
    if (!selectedCourse) return;

    try {
      setIsProcessingPayment(true);
      setPaymentError(null);

      // 1. Ensure Razorpay script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay payment gateway. Please check your internet connection and try again.");
      }

      // 2. Create authoritative order on server
      const order = await createOrderMutation.mutateAsync({
        courseId: selectedCourse.id,
        learningMode,
        paymentPlan: "FULL",
      });

      // 3. Launch Razorpay modal
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "SoftLab Global",
        description: `Admission: ${selectedCourse.title}`,
        order_id: order.orderId,
        image: "https://lms.softlabglobal.com/images/softlab-id-logo-transparent.png",
        theme: {
          color: "#059669",
        },
        handler: async (response: any) => {
          try {
            setIsProcessingPayment(true);
            const verification = await verifyPurchaseMutation.mutateAsync({
              gatewayOrderId: response.razorpay_order_id,
              gatewayPaymentId: response.razorpay_payment_id,
              gatewaySignature: response.razorpay_signature,
              courseId: selectedCourse.id,
              learningMode,
            });

            // Refresh marketplace and enrolled queries
            await utils.course.getMarketplaceCourses.invalidate();
            await utils.learning.getEnrolledCourses.invalidate();

            // Open success modal
            setSelectedCourse(null);
            setPurchaseSuccess({
              courseTitle: selectedCourse.title,
              enrollmentId: verification.enrollmentId,
              receiptNumber: verification.receiptNumber,
              invoiceNumber: verification.invoiceNumber,
            });
          } catch (verErr: any) {
            setPaymentError(verErr.message || "Payment verification failed. Please contact admissions support.");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", (failedRes: any) => {
        setIsProcessingPayment(false);
        setPaymentError(
          failedRes.error?.description || "Payment was rejected or cancelled. Please try again or use another payment method."
        );
      });

      razorpayInstance.open();
    } catch (err: any) {
      setIsProcessingPayment(false);
      setPaymentError(err.message || "Failed to initiate payment. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
            <Sparkles className="h-3.5 w-3.5" />
            Direct Admission & Course Marketplace
          </div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Upgrade Your Skills with Industry-Recognized Programs
          </h2>
          <p className="text-sm text-slate-300 md:text-base leading-relaxed">
            Browse published 3-month fast-track bootcamps, 6-month comprehensive master programs, and advanced technical diplomas. Secure direct admission with transparent single-pass pricing and instant LMS access.
          </p>
        </div>
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Duration Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={durationFilter === "ALL" ? "default" : "outline"}
            className={durationFilter === "ALL" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
            onClick={() => setDurationFilter("ALL")}
          >
            All Courses
          </Button>
          <Button
            size="sm"
            variant={durationFilter === "3_MONTHS" ? "default" : "outline"}
            className={durationFilter === "3_MONTHS" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
            onClick={() => setDurationFilter("3_MONTHS")}
          >
            3 Months (12 Weeks)
          </Button>
          <Button
            size="sm"
            variant={durationFilter === "6_MONTHS" ? "default" : "outline"}
            className={durationFilter === "6_MONTHS" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
            onClick={() => setDurationFilter("6_MONTHS")}
          >
            6 Months (24 Weeks)
          </Button>
          <Button
            size="sm"
            variant={durationFilter === "OTHER" ? "default" : "outline"}
            className={durationFilter === "OTHER" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
            onClick={() => setDurationFilter("OTHER")}
          >
            Specializations
          </Button>
        </div>

        {/* Search & Level Filters */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search course title or code..."
              className="pl-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="flex h-9 w-36 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex h-72 items-center justify-center">
          <LoadingSpinner className="h-8 w-8 text-emerald-600" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200">
          Failed to load marketplace courses: {error.message}
        </div>
      ) : !courses || courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No Published Courses Found"
          description="There are currently no published courses matching your selected duration or filter criteria. Check back soon or switch filters."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setDurationFilter("ALL");
                setSearchQuery("");
                setLevelFilter("ALL");
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: any) => {
            const durationInMonths = Math.round(course.durationWeeks / 4.33);
            const durationBadgeText =
              course.durationWeeks >= 10 && course.durationWeeks <= 14
                ? "3 Months (Fast-Track)"
                : course.durationWeeks >= 20 && course.durationWeeks <= 26
                ? "6 Months (Master Program)"
                : `${course.durationWeeks} Weeks (${durationInMonths} Mo)`;

            const originalFeeRupees = course.originalFeePaise / 100;
            const finalFeeRupees = course.finalPayablePaise / 100;
            const discountRupees = course.discountPaise / 100;

            return (
              <Card
                key={course.id}
                className="group flex flex-col justify-between overflow-hidden border-slate-200 bg-white transition-all hover:border-emerald-300 hover:shadow-lg"
              >
                <div>
                  {/* Thumbnail / Header */}
                  <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center">
                    {course.thumbnailUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <GraduationCap className="h-12 w-12 text-emerald-400/80 mb-2" />
                        <span className="text-xs font-semibold tracking-wider uppercase text-emerald-300">
                          {course.courseCode || "SOFTLAB"}
                        </span>
                      </div>
                    )}

                    {/* Duration Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-slate-900/90 text-white backdrop-blur-md border border-white/20 text-xs font-medium">
                        <Clock className="h-3 w-3 mr-1 text-emerald-400" />
                        {durationBadgeText}
                      </Badge>
                    </div>

                    {/* Level / Mode Badge */}
                    <div className="absolute top-3 right-3 flex gap-1">
                      {course.level && (
                        <Badge variant="secondary" className="bg-white/90 text-slate-800 text-[10px] font-semibold">
                          {course.level}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                        {course.courseCode}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                        {course.totalModules} Modules • {course.totalLessons} Lessons
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {course.summary || course.description || "Comprehensive hands-on training with industry curriculum and project assignments."}
                    </p>
                  </CardHeader>

                  <CardContent className="px-5 py-2 space-y-3">
                    {/* Eligibility / Pre-req */}
                    {course.eligibility && (
                      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">
                          <strong className="text-slate-700">Eligibility:</strong> {course.eligibility}
                        </span>
                      </div>
                    )}

                    {/* Syllabus Quick Peek */}
                    {course.modules && course.modules.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Curriculum Highlights
                        </span>
                        <div className="space-y-1">
                          {course.modules.slice(0, 2).map((mod: any, idx: number) => (
                            <div key={mod.id} className="flex items-center gap-1.5 text-xs text-slate-700">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">
                                Mod {idx + 1}: {mod.title}
                              </span>
                            </div>
                          ))}
                          {course.modules.length > 2 && (
                            <span className="text-[11px] text-emerald-700 font-medium pl-5 block">
                              +{course.modules.length - 2} more learning modules
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Footer with Pricing & Action */}
                <CardFooter className="p-5 pt-3 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                  <div className="flex items-end justify-between w-full">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Payable Tuition</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-slate-900">
                          ₹{finalFeeRupees.toLocaleString("en-IN")}
                        </span>
                        {discountRupees > 0 && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{originalFeeRupees.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="h-3 w-3" />
                        Single-pass 18% GST Included
                      </span>
                    </div>

                    {discountRupees > 0 && (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 text-xs">
                        Save ₹{discountRupees.toLocaleString("en-IN")}
                      </Badge>
                    )}
                  </div>

                  {course.isEnrolled ? (
                    <div className="w-full flex items-center gap-2">
                      <div className="flex-1 text-center py-2 px-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                        Enrolled • {course.batchName || "Awaiting Batch"}
                      </div>
                      <Link href={`/student/learning/${course.enrollmentId}`}>
                        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1">
                          Classroom <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleOpenCheckout(course)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold gap-1.5"
                    >
                      <Zap className="h-4 w-4" />
                      Buy Now & Enroll
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={Boolean(selectedCourse)} onOpenChange={(open) => !open && !isProcessingPayment && setSelectedCourse(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Direct Course Admission & Checkout
            </DialogTitle>
            <DialogDescription>
              Confirm your enrollment preferences and complete payment via Razorpay.
            </DialogDescription>
          </DialogHeader>

          {selectedCourse && (
            <div className="space-y-4 py-2">
              {/* Course Brief */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded">
                      {selectedCourse.courseCode}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {selectedCourse.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Duration: {selectedCourse.durationWeeks} Weeks • {selectedCourse.totalModules} Modules
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Preferred Learning Delivery</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLearningMode("HYBRID")}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                      learningMode === "HYBRID"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Hybrid
                  </button>
                  <button
                    type="button"
                    onClick={() => setLearningMode("ONLINE")}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                      learningMode === "ONLINE"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    100% Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setLearningMode("CLASSROOM")}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                      learningMode === "CLASSROOM"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Campus Classroom
                  </button>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Course Base Tuition</span>
                  <span>₹{(selectedCourse.originalFeePaise / 100).toLocaleString("en-IN")}</span>
                </div>
                {selectedCourse.discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Marketplace Scholarship Discount</span>
                    <span>-₹{(selectedCourse.discountPaise / 100).toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-100">
                  <span>Single-Pass GST (18% Inbuilt CGST 9% + SGST 9%)</span>
                  <span className="font-mono text-emerald-600 font-semibold">Included</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Payable Today</span>
                  <span className="text-base text-emerald-700">
                    ₹{(selectedCourse.finalPayablePaise / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {paymentError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Security Note */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>256-bit encrypted Razorpay transaction. Official tax invoice and fee receipt generated instantly upon verification.</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSelectedCourse(null)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartRazorpayCheckout}
              disabled={isProcessingPayment}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
            >
              {isProcessingPayment ? (
                <>
                  <LoadingSpinner className="h-4 w-4" />
                  Processing Checkout...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Pay with Razorpay (₹{((selectedCourse?.finalPayablePaise || 0) / 100).toLocaleString("en-IN")})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={Boolean(purchaseSuccess)} onOpenChange={() => setPurchaseSuccess(null)}>
        <DialogContent className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Admission & Payment Successful!
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600">
            Congratulations! You are officially enrolled in{" "}
            <strong className="text-slate-900">{purchaseSuccess?.courseTitle}</strong>.
          </DialogDescription>

          <div className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Enrollment ID:</span>
              <span className="font-mono font-bold text-slate-900">{purchaseSuccess?.enrollmentId}</span>
            </div>
            {purchaseSuccess?.receiptNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">Official Receipt:</span>
                <span className="font-mono font-semibold text-emerald-700">{purchaseSuccess.receiptNumber}</span>
              </div>
            )}
            {purchaseSuccess?.invoiceNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">GST Tax Invoice:</span>
                <span className="font-mono font-semibold text-indigo-700">{purchaseSuccess.invoiceNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Access Status:</span>
              <span className="font-semibold text-emerald-700">Immediate LMS Classroom Access</span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full text-xs"
              onClick={() => {
                setPurchaseSuccess(null);
                router.push("/student/fees");
              }}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              View Fee Receipt
            </Button>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              onClick={() => {
                const enrId = purchaseSuccess?.enrollmentId;
                setPurchaseSuccess(null);
                if (enrId) {
                  router.push(`/student/learning/${enrId}`);
                } else {
                  router.push("/student/courses");
                }
              }}
            >
              Go to Classroom
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
