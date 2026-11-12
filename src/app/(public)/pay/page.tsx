"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RazorpayStandardCheckout } from "@/components/payment/razorpay-standard-checkout";
import { ShieldCheck, CreditCard, Building2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { formatPaiseToRupees } from "@/lib/utils";

function PublicPayContent() {
  const searchParams = useSearchParams();
  const invoiceParam = searchParams.get("invoice") || searchParams.get("inv") || "";
  const amountParam = searchParams.get("amount") || "";
  const purposeParam = searchParams.get("purpose") || searchParams.get("item") || "";

  const [amountInr, setAmountInr] = useState<number>(() => {
    const parsed = Number(amountParam);
    return !isNaN(parsed) && parsed > 0 ? parsed : 1000;
  });
  const [name, setName] = useState(searchParams.get("name") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [purpose, setPurpose] = useState(
    purposeParam || (invoiceParam ? `Settlement for Invoice ${invoiceParam}` : "Tuition / Admission Fee Settlement")
  );
  const [linkedInvoice, setLinkedInvoice] = useState<string>(invoiceParam);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    amount?: string;
    purpose?: string;
  }>({});

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  useEffect(() => {
    if (invoiceParam) {
      setLinkedInvoice(invoiceParam);
      setPurpose(`Settlement for Tax Invoice ${invoiceParam}`);
    }
  }, [invoiceParam]);

  const validatePaymentForm = (): boolean => {
    const errors: {
      name?: string;
      email?: string;
      phone?: string;
      amount?: string;
      purpose?: string;
    } = {};

    if (!name || name.trim().length < 2) {
      errors.name = "Payer / Student Full Name is required (minimum 2 letters).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) {
      errors.email = "Email address is required for receipt dispatch.";
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address (e.g. name@example.com).";
    }

    const phoneClean = (phone || "").replace(/\D/g, "");
    if (!phoneClean) {
      errors.phone = "Phone number is required for transaction confirmation.";
    } else if (phoneClean.length !== 10) {
      errors.phone = "Please enter a valid 10-digit Indian mobile number.";
    }

    if (!amountInr || amountInr < 1) {
      errors.amount = "Payable amount must be at least ₹1.00.";
    }

    if (!purpose || !purpose.trim()) {
      errors.purpose = "Payment purpose or course title is required.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>Official Razorpay Payment Gateway</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Online Fee Settlement
          </h1>
          <p className="text-xs text-slate-500">
            SOFTLAB GLOBAL Institutional Payment Desk
          </p>
        </div>

        <Card className="border border-slate-200/80 shadow-xl bg-white rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-600" />
                <span>Payment Details</span>
              </CardTitle>
              {linkedInvoice && (
                <Badge className="bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{linkedInvoice}</span>
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-slate-500">
              {linkedInvoice
                ? `Paying against verified institutional invoice ${linkedInvoice}. Official GST receipt will be issued automatically.`
                : "Enter payment details to open the Razorpay Standard Checkout modal."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Quick Amount Selectors (only if not a locked invoice) */}
            {!linkedInvoice && (
              <div>
                <Label className="text-xs font-medium text-slate-700 mb-1.5 block">
                  Select Quick Amount (₹)
                </Label>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmountInr(q)}
                      className={`py-1 text-xs font-semibold rounded-md border transition-all ${
                        amountInr === q
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      ₹{q.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Amount */}
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">
                {linkedInvoice ? "Invoice Payable Amount (₹)" : "Payable Amount (₹)"} <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                  ₹
                </span>
                <Input
                  type="number"
                  min={1}
                  value={amountInr || ""}
                  onChange={(e) => {
                    setAmountInr(Math.max(1, Number(e.target.value)));
                    if (validationErrors.amount) setValidationErrors((prev) => ({ ...prev, amount: "" }));
                  }}
                  className={`pl-7 text-sm font-semibold ${validationErrors.amount ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                  placeholder="Enter custom amount"
                />
              </div>
              {validationErrors.amount && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {validationErrors.amount}
                </p>
              )}
            </div>

            {/* Purpose */}
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">
                Payment Purpose / Course Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={purpose}
                onChange={(e) => {
                  setPurpose(e.target.value);
                  if (validationErrors.purpose) setValidationErrors((prev) => ({ ...prev, purpose: "" }));
                }}
                placeholder="e.g. Full Stack Development Admission"
                className={`text-xs ${validationErrors.purpose ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
              />
              {validationErrors.purpose && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {validationErrors.purpose}
                </p>
              )}
            </div>

            {/* Applicant / Student Info */}
            <div className="space-y-2.5 pt-1">
              <div>
                <Label className="text-xs font-medium text-slate-700 mb-1 block">
                  Payer / Student Full Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (validationErrors.name) setValidationErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="e.g. Rahul Sharma"
                  className={`text-xs ${validationErrors.name ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                />
                {validationErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-700 mb-1 block">
                  Email Address <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="name@example.com"
                  className={`text-xs ${validationErrors.email ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                />
                {validationErrors.email && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-700 mb-1 block">
                  Phone Number <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    setPhone(cleaned);
                    if (validationErrors.phone) setValidationErrors((prev) => ({ ...prev, phone: "" }));
                  }}
                  placeholder="9876543210"
                  className={`text-xs ${validationErrors.phone ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                />
                {validationErrors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {validationErrors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Validation Notice if any errors present */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Missing Personal Details</span>
                  <span>Please fill in your Full Name, Email Address, and 10-digit Phone Number before proceeding to payment.</span>
                </div>
              </div>
            )}

            {/* Checkout Component */}
            <div className="pt-2">
              <RazorpayStandardCheckout
                amountPaise={Math.max(100, Math.round((amountInr || 1) * 100))}
                itemName={purpose || "Educational Fee"}
                description={`SOFTLAB Global Payment - ₹${amountInr}`}
                customerName={name}
                customerEmail={email}
                customerPhone={phone}
                buttonText={`Pay ₹${(amountInr || 0).toLocaleString("en-IN")} via Razorpay`}
                onBeforeCheckout={validatePaymentForm}
                extraVerificationData={{
                  invoiceNumber: linkedInvoice || undefined,
                }}
              />
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3 text-slate-400" />
                SOFTLAB GLOBAL
              </span>
              <span>100% Encrypted & Authenticated</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PublicPayPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-xs text-slate-400">Loading payment desk...</div>}>
      <PublicPayContent />
    </Suspense>
  );
}
