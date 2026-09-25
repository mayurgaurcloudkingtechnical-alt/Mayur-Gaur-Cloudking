"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RazorpayStandardCheckout } from "@/components/payment/razorpay-standard-checkout";
import { ShieldCheck, CreditCard, Sparkles, Building2, CheckCircle2 } from "lucide-react";

export default function PublicPayPage() {
  const [amountInr, setAmountInr] = useState<number>(1000);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("Tuition / Admission Fee Settlement");

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

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
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              <span>Payment Details</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter payment details to open the Razorpay Standard Checkout modal.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Quick Amount Selectors */}
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1.5 block">
                Select or Enter Amount (₹)
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
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                  ₹
                </span>
                <Input
                  type="number"
                  min={1}
                  value={amountInr || ""}
                  onChange={(e) => setAmountInr(Math.max(1, Number(e.target.value)))}
                  className="pl-7 text-sm font-semibold"
                  placeholder="Enter custom amount"
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-1 block">
                Payment Purpose / Course Title
              </Label>
              <Input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Full Stack Development Admission"
                className="text-xs"
              />
            </div>

            {/* Applicant / Student Info */}
            <div className="space-y-2.5 pt-1">
              <div>
                <Label className="text-xs font-medium text-slate-700 mb-1 block">
                  Payer / Student Full Name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-700 mb-1 block">
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-700 mb-1 block">
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="text-xs"
                />
              </div>
            </div>

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
