"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  Building2,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

interface ServiceEnquiryFormProps {
  initialServiceCategory?: string;
  initialPackage?: string;
}

const SERVICE_OPTIONS = [
  { code: "WEB_DEV", label: "Website Development" },
  { code: "SOFTWARE_DEV", label: "Software Development" },
  { code: "APP_DEV", label: "Application Development" },
  { code: "DIGITAL_MARKETING", label: "Digital Marketing" },
  { code: "GRAPHICS_DESIGN", label: "Graphics & Creative Design" },
  { code: "CORPORATE_COMBO", label: "Corporate Combo / Growth Retainer" },
  { code: "AMC_SUPPORT", label: "AMC, Cloud & Infrastructure Support" },
  { code: "OTHER", label: "Other / Custom Technology Solution" },
];

export function ServiceEnquiryForm({
  initialServiceCategory,
  initialPackage,
}: ServiceEnquiryFormProps) {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [serviceCategory, setServiceCategory] = useState(
    initialServiceCategory || "WEB_DEV"
  );
  const [packageName, setPackageName] = useState(initialPackage || "");
  const [requirement, setRequirement] = useState("");
  const [preferredContact, setPreferredContact] = useState<
    "PHONE" | "WHATSAPP" | "EMAIL"
  >("PHONE");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEnquiryNumber, setSubmittedEnquiryNumber] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  React.useEffect(() => {
    const handlePrefill = (e: CustomEvent<{ categoryCode?: string; packageName?: string }>) => {
      if (e.detail?.categoryCode) {
        setServiceCategory(e.detail.categoryCode);
      }
      if (e.detail?.packageName) {
        setPackageName(e.detail.packageName);
      }
    };
    window.addEventListener("prefill-service-enquiry" as any, handlePrefill as any);
    return () => {
      window.removeEventListener("prefill-service-enquiry" as any, handlePrefill as any);
    };
  }, []);

  const submitMutation = api.services.submitPublicEnquiry.useMutation({
    onSuccess: (data) => {
      setIsSuccess(true);
      setSubmittedEnquiryNumber(data.enquiryNumber);
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err.message || "Failed to submit enquiry. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }

    submitMutation.mutate({
      fullName,
      companyName: companyName.trim() || undefined,
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim() || undefined,
      serviceCategoryCode: serviceCategory,
      packageName: packageName.trim() || undefined,
      requirement: requirement.trim() || undefined,
      preferredContact,
      message: message.trim() || undefined,
    });
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSubmittedEnquiryNumber(null);
    setFullName("");
    setCompanyName("");
    setPhone("");
    setEmail("");
    setCity("");
    setRequirement("");
    setMessage("");
    setPackageName("");
  };

  return (
    <div id="service-enquiry-section" className="w-full">
      <div className="relative rounded-3xl border border-slate-800 bg-slate-900/95 p-6 sm:p-10 shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Glow Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {isSuccess ? (
          <div className="relative z-10 text-center py-10 space-y-5 animate-in fade-in zoom-in-95 duration-500">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                Enquiry Ref: {submittedEnquiryNumber}
              </span>
              <h3 className="text-2xl font-black text-white">
                Service Request Received!
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Thank you for reaching out to SoftLab Global Corporate Services. Our technical consulting squad will review your requirements and reach out via{" "}
                <span className="text-emerald-300 font-semibold">{preferredContact}</span> within 2 to 4 business hours.
              </p>
            </div>
            <div className="pt-2">
              <Button
                type="button"
                onClick={handleReset}
                variant="outline"
                className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white"
              >
                Submit Another Requirement
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative z-10 space-y-6">
            <div className="space-y-2 border-b border-slate-800/80 pb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enterprise Consulting • Fixed & Retainer Quotes</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Request a Service / Get a Custom Quote
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
                Tell us about your digital, software, or technology goals. Our senior software architects and digital strategists will prepare a custom proposal and scope breakdown.
              </p>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <span>Full Name</span>
                    <span className="text-emerald-400">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-slate-950/80 border-slate-700/80 text-slate-100 placeholder:text-slate-500 text-xs h-10 rounded-xl focus-visible:ring-emerald-500"
                  />
                </div>

                {/* Company / Organization */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <span>Company / Organization</span>
                    <span className="text-slate-500 text-[10px]">(Optional)</span>
                  </label>
                  <Input
                    placeholder="e.g. Apex Innovations Pvt. Ltd."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-slate-950/80 border-slate-700/80 text-slate-100 placeholder:text-slate-500 text-xs h-10 rounded-xl focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <span>Mobile Number</span>
                    <span className="text-emerald-400">*</span>
                  </label>
                  <Input
                    required
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-slate-950/80 border-slate-700/80 text-slate-100 placeholder:text-slate-500 text-xs h-10 rounded-xl focus-visible:ring-emerald-500"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <span>Email Address</span>
                    <span className="text-emerald-400">*</span>
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="e.g. rahul@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-950/80 border-slate-700/80 text-slate-100 placeholder:text-slate-500 text-xs h-10 rounded-xl focus-visible:ring-emerald-500"
                  />
                </div>

                {/* City / State */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    <span>City / Location</span>
                  </label>
                  <Input
                    placeholder="e.g. Prayagraj / Noida"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-slate-950/80 border-slate-700/80 text-slate-100 placeholder:text-slate-500 text-xs h-10 rounded-xl focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Service */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <span>Select Service Domain</span>
                    <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full h-10 rounded-xl bg-slate-950/80 border border-slate-700/80 px-3 text-xs text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    {SERVICE_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code} className="bg-slate-900 text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Package / Interested Tier */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <span>Interested Package / Scope</span>
                    <span className="text-slate-500 text-[10px]">(Optional)</span>
                  </label>
                  <Input
                    placeholder="e.g. E-Commerce Website, Corporate Starter, or Custom"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="bg-slate-950/80 border-slate-700/80 text-slate-100 placeholder:text-slate-500 text-xs h-10 rounded-xl focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Requirement / Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  <span>Describe Your Requirement & Timeline</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Share a brief summary of what you are looking to build or achieve (e.g. features needed, target launch date, existing website link)..."
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                  className="w-full p-3 bg-slate-950/80 border border-slate-700/80 text-slate-100 placeholder:text-slate-500 text-xs rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Preferred Contact Mode */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400">
                    Preferred Contact:
                  </span>
                  <div className="flex items-center gap-2">
                    {(["PHONE", "WHATSAPP", "EMAIL"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPreferredContact(mode)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          preferredContact === mode
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-xs"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {mode === "PHONE" && "Phone Call"}
                        {mode === "WHATSAPP" && "WhatsApp"}
                        {mode === "EMAIL" && "Email"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit CTA */}
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 shrink-0"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Get Free Proposal & Quote</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>NDA & Privacy Assured • Direct discussion with Senior Technical Leadership</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
