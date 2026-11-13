"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Users,
  Share2,
  PhoneCall,
  Check,
  ChevronDown,
  Layers,
  ArrowLeft,
  Copy,
  BookOpen,
} from "lucide-react";
import { EventRegistrationDialog } from "./event-registration-dialog";
import { EventEnquiryDialog } from "./event-enquiry-dialog";

interface EventDetailProps {
  event: {
    id: string;
    title: string;
    slug: string;
    programType: string;
    category: string;
    summary: string;
    description: string;
    bannerUrl?: string | null;
    posterUrl?: string | null;
    galleryUrls?: string[];
    fee: number;
    originalFee?: number | null;
    duration: string;
    startDate?: string | null;
    endDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    registrationStartDate?: string | null;
    registrationEndDate?: string | null;
    venue: string;
    mode: string;
    seatCapacity: number;
    registeredCount: number;
    eligibility?: string | null;
    learningOutcomes?: string[];
    syllabus?: any;
    benefits?: string[];
    trainerName?: string | null;
    trainerBio?: string | null;
    trainerImage?: string | null;
    certificateTitle?: string | null;
    certificateType?: string | null;
    faqs?: any;
    status: string;
    year: number;
    month: number;
  };
}

export function EventDetailView({ event }: EventDetailProps) {
  const [regDialogOpen, setRegDialogOpen] = useState(false);
  const [enqDialogOpen, setEnqDialogOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const feeInr = Math.round(event.fee / 100);
  const originalFeeInr = event.originalFee ? Math.round(event.originalFee / 100) : null;
  const savings = originalFeeInr ? originalFeeInr - feeInr : 0;
  const remainingSeats = Math.max(0, event.seatCapacity - event.registeredCount);
  const percentBooked = Math.min(100, Math.round((event.registeredCount / event.seatCapacity) * 100));

  const handleShare = (platform: "whatsapp" | "linkedin" | "twitter" | "copy") => {
    const currentUrl = typeof window !== "undefined" ? window.location.href : `https://softlabglobal.com/events/${event.slug}`;
    const shareText = `Check out ${event.title} at SoftLab Global! Fee: ₹${feeInr.toLocaleString("en-IN")}. Verified Certificate & Hands-on Projects:`;

    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`, "_blank");
    } else if (platform === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`, "_blank");
    } else {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Breadcrumb Nav */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs">
          <Link
            href="/events"
            className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Programs</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Share:</span>
            <button
              onClick={() => handleShare("whatsapp")}
              className="text-slate-400 hover:text-emerald-400"
              title="Share on WhatsApp"
            >
              WhatsApp
            </button>
            <span className="text-slate-600">â€¢</span>
            <button
              onClick={() => handleShare("copy")}
              className="text-slate-400 hover:text-emerald-400 font-semibold"
            >
              {copiedLink ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content & Sticky Booking Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Details (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Header info */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500 text-slate-950 font-bold px-3 py-0.5 text-xs">
                  {event.programType.replace(/_/g, " ")}
                </Badge>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-xs">
                  {event.category}
                </Badge>
                <Badge variant="outline" className="text-cyan-400 border-cyan-500/40 text-xs">
                  {event.mode} Mode
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {event.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                {event.summary}
              </p>
            </div>

            {/* Main Poster / Banner */}
            <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
              <Image
                src={event.bannerUrl || event.posterUrl || "/images/events/short-term-courses-banner.jpg"}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Duration</div>
                <div className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{event.duration}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Mode</div>
                <div className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>{event.mode}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Remaining Seats</div>
                <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>{remainingSeats} Left</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Credential</div>
                <div className="text-base font-bold text-slate-200 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>QR Verifiable</span>
                </div>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-400" />
                <span>Program Overview & Practical Methodology</span>
              </h2>
              <div className="text-sm sm:text-base text-slate-300 leading-relaxed space-y-4">
                <p>{event.description}</p>
                <p className="text-xs text-slate-400">
                  Venue: <strong className="text-slate-200">{event.venue}</strong>. Classes and labs are fully equipped with dedicated workstations, high-speed fiber backbone, and live code repositories.
                </p>
              </div>
            </div>

            {/* Learning Outcomes */}
            {event.learningOutcomes && event.learningOutcomes.length > 0 && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Key Learning Outcomes</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {event.learningOutcomes.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Syllabus Breakdown */}
            {event.syllabus && Array.isArray(event.syllabus) && event.syllabus.length > 0 && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-400" />
                  <span>Curriculum & Technical Tracks</span>
                </h2>
                <div className="space-y-4">
                  {event.syllabus.map((trackItem: any, idx: number) => (
                    <div key={idx} className="rounded-2xl border border-slate-800/90 bg-slate-950/80 p-5 space-y-3">
                      <div className="text-sm font-bold text-emerald-300 flex items-center justify-between">
                        <span>{trackItem.track}</span>
                        <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                          Module {idx + 1}
                        </Badge>
                      </div>
                      {Array.isArray(trackItem.topics) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                          {trackItem.topics.map((top: string, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span>{top}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits & Certificate */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-400" />
                <span>Certification & Career Support</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {event.certificateTitle || "Official Program Certificate"}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Issued by SoftLab Global Academic Directorate upon verified assessment completion. Valid for college credits and corporate job applications.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Placement & Resume Review
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Personalized resume optimization, GitHub project showcasing, and direct interview referrals to 1,200+ SoftLab corporate hiring partners.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQs Accordion */}
            {event.faqs && Array.isArray(event.faqs) && event.faqs.length > 0 && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Program Questions & Answers</h2>
                <div className="space-y-3">
                  {event.faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="group rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition-all [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-white group-hover:text-emerald-300">
                        <span>{faq.q}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 group-open:rotate-180 transition-transform" />
                      </summary>
                      <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                        {faq.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Booking Card (4 cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur p-6 sm:p-7 shadow-2xl space-y-6">
              {/* Fee block */}
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Approved Program Fee
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                    {feeInr > 0 ? `₹${feeInr.toLocaleString("en-IN")}` : "Free"}
                  </span>
                  {originalFeeInr && originalFeeInr > feeInr && (
                    <span className="text-base line-through text-slate-500 font-semibold">
                      ₹{originalFeeInr.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                {savings > 0 && (
                  <div className="pt-1">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                      Flat Savings: ₹{savings.toLocaleString("en-IN")}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Progress bar of seats */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Enrolled Seats</span>
                  <span className="font-semibold text-slate-200">
                    {event.registeredCount} / {event.seatCapacity}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${percentBooked}%` }}
                  />
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  {remainingSeats > 0 ? `Only ${remainingSeats} seats remaining in this cohort` : "Cohort Full"}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {event.status === "REGISTRATION_OPEN" ? (
                  <Button
                    onClick={() => setRegDialogOpen(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm shadow-xl shadow-emerald-950/70"
                  >
                    <span>Instant Enroll via Razorpay</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : event.status === "DRAFT" ? (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-200 text-center">
                    Session schedule undergoing final administrative confirmation.
                  </div>
                ) : (
                  <Button
                    disabled
                    className="w-full bg-slate-800 text-slate-400 font-bold h-12 text-sm"
                  >
                    Registration Closed
                  </Button>
                )}

                <Button
                  onClick={() => setEnqDialogOpen(true)}
                  variant="outline"
                  className="w-full border-slate-700 bg-slate-950/70 hover:bg-slate-800 text-slate-200 font-bold h-11 text-xs"
                >
                  <PhoneCall className="h-3.5 w-3.5 mr-2 text-emerald-400" />
                  <span>Talk to Academic Counselor</span>
                </Button>
              </div>

              {/* Trust assurances */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Secure 256-bit Encrypted Razorpay Checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Official QR-Verifiable SoftLab Credential</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Civil Lines, Prayagraj / Online Live</span>
                </div>
              </div>
            </div>

            {/* Helpline card */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 text-xs text-slate-400 text-center space-y-1">
              <div>Need direct assistance?</div>
              <div className="font-bold text-white text-sm">
                Call / WhatsApp: <a href="tel:+919196596975" className="text-emerald-400 hover:underline">+91 9196596975</a>
              </div>
              <div>Mon – Sat, 9:00 AM – 7:00 PM IST</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <EventRegistrationDialog
        event={event as any}
        open={regDialogOpen}
        onOpenChange={setRegDialogOpen}
      />

      <EventEnquiryDialog
        event={event as any}
        open={enqDialogOpen}
        onOpenChange={setEnqDialogOpen}
      />
    </div>
  );
}
