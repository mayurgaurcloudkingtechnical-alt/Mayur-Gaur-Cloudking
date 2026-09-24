"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Building2,
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Sparkles,
  Briefcase,
  Layers,
  Calendar,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants/site";

const INDIAN_STATES = [
  "Uttar Pradesh",
  "Madhya Pradesh",
  "Bihar",
  "Delhi NCR",
  "Rajasthan",
  "Maharashtra",
  "Haryana",
  "Uttarakhand",
  "Punjab",
  "West Bengal",
  "Gujarat",
  "Jharkhand",
  "Chhattisgarh",
  "Karnataka",
  "Telangana",
  "Tamil Nadu",
  "Odisha",
  "Assam",
  "Other State / UT",
];

const APPLICANT_PROFILES = [
  "Entrepreneur / Business Owner",
  "Existing Computer / Coaching Institute Owner",
  "Software Engineer / IT Professional",
  "Corporate Trainer / Academician",
  "Investor / Commercial Property Owner",
  "Other Professional",
];

const INVESTMENT_TIERS = [
  "Under ₹10 Lakh (Approved Standard Model)",
  "₹10 Lakh - ₹15 Lakh (Expanded Lab)",
  "₹15 Lakh - ₹25 Lakh (Multi-Classroom Center)",
  "Above ₹25 Lakh (Regional Hub)",
];

const TIMELINES = [
  "Immediate (Within 30 Days)",
  "1 - 3 Months",
  "3 - 6 Months",
  "Exploring Strategic Expansion",
];

interface FranchiseEnquiryFormProps {
  className?: string;
  defaultCity?: string;
  defaultState?: string;
}

export function FranchiseEnquiryForm({
  className = "",
  defaultCity = "",
  defaultState = "Uttar Pradesh",
}: FranchiseEnquiryFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [state, setState] = useState(defaultState);
  const [preferredLocation, setPreferredLocation] = useState("");
  const [applicantProfile, setApplicantProfile] = useState(APPLICANT_PROFILES[0]);
  const [investmentCapacity, setInvestmentCapacity] = useState(INVESTMENT_TIERS[0]);
  const [existingInstitute, setExistingInstitute] = useState(false);
  const [experience, setExperience] = useState("");
  const [launchTimeline, setLaunchTimeline] = useState(TIMELINES[0]);
  const [requirements, setRequirements] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [honeypot, setHoneypot] = useState("");

  const [campaignName, setCampaignName] = useState("");
  const [adsetName, setAdsetName] = useState("");
  const [adCreativeName, setAdCreativeName] = useState("");
  const [keywordSearch, setKeywordSearch] = useState("");
  const [landingPageUrl, setLandingPageUrl] = useState("/franchise");

  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Capture UTM parameters and landing context
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get("utm_source") || "";
      const utmCampaign = params.get("utm_campaign") || "";
      const utmAdset = params.get("utm_adset") || params.get("adset_name") || "";
      const utmCreative = params.get("utm_content") || params.get("creative") || "";
      const utmTerm = params.get("utm_term") || "";

      if (utmCampaign) setCampaignName(utmCampaign);
      if (utmAdset) setAdsetName(utmAdset);
      if (utmCreative) setAdCreativeName(utmCreative);
      if (utmTerm) setKeywordSearch(utmTerm);

      setLandingPageUrl(window.location.pathname + window.location.search);
    }
  }, []);

  const submitMutation = api.crm.submitFranchiseEnquiry.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setReferenceNumber(data.referenceNumber || `SLG-FRN-2026-${data.leadId.slice(-4).toUpperCase()}`);
      setErrorMessage(null);
    },
    onError: (err) => {
      setErrorMessage(
        err.message || "Failed to submit franchise application. Please verify your details or call our office."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Please provide a valid 10-digit mobile number.");
      return;
    }
    if (!city.trim()) {
      setErrorMessage("Please enter your target city.");
      return;
    }
    if (!state.trim()) {
      setErrorMessage("Please select your target state.");
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage("Please confirm your consent to receive the franchise prospectus.");
      return;
    }

    submitMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: cleanPhone,
      city: city.trim(),
      state: state.trim(),
      preferredLocation: preferredLocation.trim() || undefined,
      applicantProfile,
      investmentCapacity,
      existingInstitute,
      experience: experience.trim() || undefined,
      launchTimeline,
      requirements: requirements.trim() || undefined,
      notes: `Target: ${city.trim()}, ${state.trim()} | Profile: ${applicantProfile} | Budget: ${investmentCapacity} | Timeline: ${launchTimeline}${
        experience.trim() ? ` | Experience: ${experience.trim()}` : ""
      }`,
      campaignName: campaignName || undefined,
      adsetName: adsetName || undefined,
      adCreativeName: adCreativeName || undefined,
      keywordSearch: keywordSearch || undefined,
      landingPageUrl,
      honeypot: honeypot || undefined,
    });
  };

  const handleReset = () => {
    setSubmitted(false);
    setReferenceNumber("");
    setFullName("");
    setEmail("");
    setPhone("");
    setCity("");
    setPreferredLocation("");
    setExperience("");
    setRequirements("");
    setHoneypot("");
    setErrorMessage(null);
  };

  if (submitted) {
    return (
      <Card className={`border border-emerald-500/40 bg-slate-900/95 text-slate-100 shadow-2xl overflow-hidden backdrop-blur ${className}`}>
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 px-6 py-6 text-white text-center border-b border-emerald-800/40">
          <div className="mx-auto w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 backdrop-blur rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">Franchise Application Registered</h3>
          <p className="text-xs text-emerald-200 mt-1 max-w-md mx-auto">
            Your franchise enquiry has been securely transmitted to the SOFTLAB GLOBAL Corporate Expansion Desk.
          </p>
        </div>

        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-5 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Official Reference Number
            </span>
            <div className="mt-1 font-mono text-2xl md:text-3xl font-extrabold text-emerald-300 tracking-wider">
              {referenceNumber || "SLG-FRN-2026-CONFIRMED"}
            </div>
            <p className="text-xs text-emerald-400/80 mt-2">
              Please quote this reference number during any correspondence with our operations team.
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Next Step:</strong> Our Director of Institutional Partnerships will review your preferred city (
                <strong className="text-white">{city || "Your City"}</strong>) and schedule an introductory feasibility conference.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Confidentiality Assured:</strong> Your contact details and market assessment data remain strictly
                confidential under SOFTLAB GLOBAL corporate governance.
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <a
              href={`https://wa.me/919196596975?text=${encodeURIComponent(
                `Hello SOFTLAB GLOBAL Team, I have submitted a Franchise Application for ${city}, ${state}. My Reference No is: ${referenceNumber}. Please share the franchise prospectus.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-950/50 transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Connect on WhatsApp</span>
            </a>
            <a
              href={`tel:${SITE_CONFIG.contact.phoneTel}`}
              className="flex-1 inline-flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold py-3 px-4 rounded-xl transition-all"
            >
              <PhoneCall className="h-4 w-4 text-emerald-400" />
              <span>Direct Hotline: {SITE_CONFIG.contact.phone}</span>
            </a>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-emerald-400 underline font-medium"
            >
              Submit another franchise inquiry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border border-slate-800 bg-slate-900/95 shadow-2xl overflow-hidden rounded-2xl backdrop-blur ${className}`}>
      <CardHeader className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-7 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Franchise Opportunity Portal
            </span>
            <CardTitle className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Request Franchise Information
            </CardTitle>
          </div>
        </div>
        <CardDescription className="text-xs sm:text-sm text-slate-300 mt-2">
          Position your city as an enterprise technology hub. Submit the application below to receive our confidential
          franchise prospectus and financial model.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/40 p-4 flex items-start gap-3 text-red-200 text-xs animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Honeypot anti-spam */}
          <div style={{ display: "none" }} aria-hidden="true">
            <label htmlFor="franchise_hp">Leave this field blank</label>
            <input
              id="franchise_hp"
              type="text"
              name="honeypot"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Section 1: Personal / Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Applicant Information</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fr_fullName" className="text-xs font-semibold text-slate-200">
                  Full Name <span className="text-emerald-400">*</span>
                </Label>
                <Input
                  id="fr_fullName"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fr_phone" className="text-xs font-semibold text-slate-200">
                  Mobile / WhatsApp Number <span className="text-emerald-400">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">+91</span>
                  <Input
                    id="fr_phone"
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 text-xs pl-12 bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                    maxLength={15}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="fr_email" className="text-xs font-semibold text-slate-200">
                  Official Email Address <span className="text-emerald-400">*</span>
                </Label>
                <Input
                  id="fr_email"
                  type="email"
                  placeholder="rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Target Territory */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Target Location & Market</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fr_city" className="text-xs font-semibold text-slate-200">
                  Target City <span className="text-emerald-400">*</span>
                </Label>
                <Input
                  id="fr_city"
                  placeholder="e.g. Varanasi, Lucknow, Patna"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-10 text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fr_state" className="text-xs font-semibold text-slate-200">
                  State / UT <span className="text-emerald-400">*</span>
                </Label>
                <select
                  id="fr_state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  required
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st} className="bg-slate-900 text-white">
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="fr_preferredLocation" className="text-xs font-semibold text-slate-200">
                  Preferred Locality / Commercial Area (Optional)
                </Label>
                <Input
                  id="fr_preferredLocation"
                  placeholder="e.g. Near University Road / Commercial Hub"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  className="h-10 text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Professional Profile & Investment Capacity */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Profile & Investment Scope</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fr_profile" className="text-xs font-semibold text-slate-200">
                  Current Profile <span className="text-emerald-400">*</span>
                </Label>
                <select
                  id="fr_profile"
                  value={applicantProfile}
                  onChange={(e) => setApplicantProfile(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  {APPLICANT_PROFILES.map((prof) => (
                    <option key={prof} value={prof} className="bg-slate-900 text-white">
                      {prof}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fr_investment" className="text-xs font-semibold text-slate-200">
                  Investment Capacity <span className="text-emerald-400">*</span>
                </Label>
                <select
                  id="fr_investment"
                  value={investmentCapacity}
                  onChange={(e) => setInvestmentCapacity(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-emerald-400 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  {INVESTMENT_TIERS.map((tier) => (
                    <option key={tier} value={tier} className="bg-slate-900 text-white">
                      {tier}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fr_timeline" className="text-xs font-semibold text-slate-200">
                  Planned Launch Timeline
                </Label>
                <select
                  id="fr_timeline"
                  value={launchTimeline}
                  onChange={(e) => setLaunchTimeline(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  {TIMELINES.map((tl) => (
                    <option key={tl} value={tl} className="bg-slate-900 text-white">
                      {tl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-800 bg-slate-950/60 cursor-pointer hover:bg-slate-800/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={existingInstitute}
                    onChange={(e) => setExistingInstitute(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-300">
                    I currently operate an existing education or coaching institute
                  </span>
                </label>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="fr_experience" className="text-xs font-semibold text-slate-200">
                  Relevant Experience / Background Summary (Optional)
                </Label>
                <Input
                  id="fr_experience"
                  placeholder="e.g. 8 years in IT sales, operating 1000 sq ft education premises"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="h-10 text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="fr_requirements" className="text-xs font-semibold text-slate-200">
                  Specific Questions or Territorial Queries (Optional)
                </Label>
                <textarea
                  id="fr_requirements"
                  rows={2}
                  placeholder="Share any questions regarding curriculum delivery, trainer enablement, or territory exclusivity..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-white ring-offset-background placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 mt-0.5"
                required
              />
              <span className="text-[11px] text-slate-300 leading-normal">
                I agree to receive the SOFTLAB GLOBAL Franchise Business Model, informational deck, and consent to be
                contacted via phone, email, and WhatsApp for expansion discussions.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-950/50 transition-all rounded-xl flex items-center justify-center gap-2"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting Franchise Application...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Franchise Enquiry (Under ₹10 Lakh Model)</span>
              </>
            )}
          </Button>

          <p className="text-center text-[11px] text-slate-500">
            🔒 Strictly confidential. Verified enquiry routed directly to SOFTLAB GLOBAL Corporate Expansion Office.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
