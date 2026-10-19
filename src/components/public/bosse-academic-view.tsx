"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Award,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  BookOpen,
  PhoneCall,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Calendar,
  Layers,
  HelpCircle,
  Clock,
  ArrowRight,
  Check,
  Send,
  MessageSquare,
  AlertCircle,
  Building2,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/react";
import { SITE_CONFIG } from "@/lib/constants/site";
import { trackLeadSubmission, trackWhatsAppClick } from "@/lib/analytics";

interface BosseAcademicViewProps {
  courses?: any[];
}

export function BosseAcademicView({ courses = [] }: BosseAcademicViewProps) {
  const [selectedStream, setSelectedStream] = useState<"10th" | "12th-science" | "12th-commerce" | "12th-arts">("10th");

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Prayagraj");
  const [targetStream, setTargetStream] = useState("Class 10th (Secondary)");
  const [previousBoard, setPreviousBoard] = useState("CBSE / UP Board / NIOS / Other");
  const [tocRequired, setTocRequired] = useState("NO");
  const [notes, setNotes] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submitEnquiry = api.crm.submitEnquiry.useMutation({
    onSuccess: (data) => {
      setFormSubmitted(true);
      setFormError(null);
      trackLeadSubmission({
        source: "WEBSITE_BOSSE_PAGE",
        courseOrInterest: `BOSSE ${targetStream}`,
        leadId: (data as any)?.id,
      });
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to submit enquiry. Please call helpline directly.");
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || phone.replace(/\D/g, "").length < 10) {
      setFormError("Please enter your full name and valid 10-digit mobile number.");
      return;
    }

    const matchedCourse = courses.find((c) => {
      if (targetStream.includes("10th")) return c.slug.includes("10th");
      if (targetStream.includes("Science")) return c.slug.includes("science");
      if (targetStream.includes("Commerce")) return c.slug.includes("commerce");
      return c.slug.includes("arts");
    });

    submitEnquiry.mutate({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || `bosse.inquiry.${Date.now()}@softlabglobal.com`,
      city: city.trim(),
      interestedCourseId: matchedCourse?.id,
      notes: `[BOSSE Open Board Enquiry] Stream: ${targetStream} | Prev Board: ${previousBoard} | Transfer of Credit (TOC): ${tocRequired} | Comments: ${notes}`,
    });
  };

  const streamsData = {
    "10th": {
      title: "Class 10th Secondary School Examination",
      badge: "High School Equivalent",
      feeDisplay: "₹36,500",
      feeNumber: 36500,
      slug: "bosse-secondary-10th",
      description:
        "Equivalent to Class 10th from CBSE, ICSE, and UP Board. Recognized under Act No. 14 of 2020 by Govt. of Sikkim, COBSE & AIU. Ideal for fresh learners, working professionals, school dropouts, and failed candidates looking for 1-year completion.",
      eligibility: "Minimum 14 years of age with age proof (Aadhaar / Birth Certificate) and self-declaration.",
      subjects: [
        { code: "201", name: "Hindi", type: "Language (Theory + Internal)" },
        { code: "202", name: "English", type: "Language (Theory + Internal)" },
        { code: "211", name: "Mathematics", type: "Core (Theory + Internal)" },
        { code: "212", name: "Science and Technology", type: "Core (Theory + Practical)" },
        { code: "213", name: "Social Science", type: "Core (Theory + Internal)" },
        { code: "214", name: "Economics", type: "Elective (Theory + Internal)" },
        { code: "215", name: "Business Studies", type: "Elective (Theory + Internal)" },
        { code: "216", name: "Home Science", type: "Elective (Theory + Practical)" },
        { code: "229", name: "Data Entry Operations", type: "Vocational (Theory + Practical)" },
      ],
      careerProspects:
        "Direct admission into Class 11th / 12th in any board, 3-Year Polytechnic Engineering Diplomas, ITI Trades, Indian Army / Navy / Airforce recruitment, and Govt. Group C/D posts.",
    },
    "12th-science": {
      title: "Class 12th Senior Secondary — Science Stream",
      badge: "PCM / PCB / PCMB",
      feeDisplay: "₹39,500",
      feeNumber: 39500,
      slug: "bosse-senior-secondary-12th-science",
      description:
        "Complete 12th Science program with full Physics, Chemistry, Biology, and Computer Science laboratory practicals included with zero extra fees. Fully eligible for competitive entrance exams including NEET, JEE Mains, B.Tech, MBBS, B.Pharma, and Defence.",
      eligibility: "Passed Class 10th (Secondary) examination from any recognized National or State Board.",
      subjects: [
        { code: "312", name: "Physics", type: "Theory + Lab Practical" },
        { code: "313", name: "Chemistry", type: "Theory + Lab Practical" },
        { code: "314", name: "Biology", type: "Theory + Lab Practical" },
        { code: "311", name: "Mathematics", type: "Core Theory" },
        { code: "330", name: "Computer Science", type: "Theory + Lab Practical" },
        { code: "302", name: "English", type: "Language Core" },
      ],
      careerProspects:
        "Eligible for NEET (Medical), JEE (Engineering), CUET (Central Universities), B.Pharma (PCI Approved), Indian Air Force, NDA, and Technical Careers.",
    },
    "12th-commerce": {
      title: "Class 12th Senior Secondary — Commerce Stream",
      badge: "Commerce & Finance",
      feeDisplay: "₹37,500",
      feeNumber: 37500,
      slug: "bosse-senior-secondary-12th-commerce",
      description:
        "High-demand Commerce stream covering Financial Accounting, Business Studies, Economics, and Commercial Computing. Includes all project evaluations and internal practicals with zero hidden charges.",
      eligibility: "Passed Class 10th (Secondary) examination from any recognized National or State Board.",
      subjects: [
        { code: "320", name: "Accountancy", type: "Core Theory + Project" },
        { code: "319", name: "Business Studies", type: "Core Theory + Internal" },
        { code: "318", name: "Economics", type: "Core Theory + Internal" },
        { code: "311", name: "Mathematics", type: "Core / Optional" },
        { code: "302", name: "English", type: "Language Core" },
        { code: "336", name: "Data Entry Operations", type: "Vocational Practical" },
      ],
      careerProspects:
        "Direct eligibility for B.Com, BBA, CA Foundation (ICAI), CS Executive Entrance, CMA, Banking Examinations, IPMAT, and Corporate Accounting.",
    },
    "12th-arts": {
      title: "Class 12th Senior Secondary — Arts & Humanities",
      badge: "Humanities & Social Sciences",
      feeDisplay: "₹36,500",
      feeNumber: 36500,
      slug: "bosse-senior-secondary-12th-arts",
      description:
        "Flexible, high-scoring humanities program designed for students preparing for Civil Services, State PCS, Law entrance (CLAT/AILET), Defence, and Bachelor of Arts (BA) university degrees.",
      eligibility: "Passed Class 10th (Secondary) examination from any recognized National or State Board.",
      subjects: [
        { code: "315", name: "History", type: "Core Theory" },
        { code: "317", name: "Political Science", type: "Core Theory" },
        { code: "316", name: "Geography", type: "Theory + Map Practical" },
        { code: "331", name: "Sociology", type: "Core Theory" },
        { code: "318", name: "Economics", type: "Core Theory" },
        { code: "301", name: "Hindi", type: "Language Core" },
        { code: "302", name: "English", type: "Language Core" },
      ],
      careerProspects:
        "Ideal launchpad for BA, B.A. LL.B (5-Year Law), UPSC Civil Services foundation, SSC CGL/CHSL, State Police, Teaching (TET), and Administrative Careers.",
    },
  };

  const activeData = streamsData[selectedStream];

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* ==================================================================== */}
      {/* 1. HERO STATS & OFFICIAL RECOGNITIONS BAR                            */}
      {/* ==================================================================== */}
      <section className="relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Award className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Statutory Act</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">Act 14 / 2020</p>
            <p className="text-[11px] text-slate-400 mt-1">Govt. of Sikkim Assembly</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-sky-400 mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">National Member</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">COBSE Listed</p>
            <p className="text-[11px] text-slate-400 mt-1">Council of School Boards</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <FileCheck2 className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Equivalence</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">AIU Recognized</p>
            <p className="text-[11px] text-slate-400 mt-1">CBSE & ICSE Equivalent</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Sparkles className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Flexibility</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">TOC Available</p>
            <p className="text-[11px] text-slate-400 mt-1">Transfer Up to 4 Subjects</p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. INTERACTIVE STREAM SELECTOR & ALL-INCLUSIVE PACKAGE CARDS        */}
      {/* ==================================================================== */}
      <section id="programs" className="scroll-mt-24 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs uppercase font-bold tracking-wider">
            Transparent Pricing • Session 2026-27
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Select Your Academic Stream
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            All packages include registration, per-subject examination fees, practical lab assessments, transfer of credit, migration certificates, and local student counseling at Civil Lines, Prayagraj.
          </p>
        </div>

        {/* Stream Pills */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => setSelectedStream("10th")}
            className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              selectedStream === "10th"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Class 10th (₹36,500)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStream("12th-science")}
            className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              selectedStream === "12th-science"
                ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-950/60 ring-2 ring-sky-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>12th Science (₹39,500)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStream("12th-commerce")}
            className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              selectedStream === "12th-commerce"
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-950/60 ring-2 ring-amber-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>12th Commerce (₹37,500)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStream("12th-arts")}
            className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              selectedStream === "12th-arts"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-950/60 ring-2 ring-purple-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>12th Arts (₹36,500)</span>
          </button>
        </div>

        {/* Selected Stream Deep Dive Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Details & Subjects */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-2.5 py-1 font-semibold">
                  {activeData.badge}
                </Badge>
                <span className="text-xs text-slate-400">Session 2026-27 Admissions Open</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">{activeData.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">{activeData.description}</p>
              </div>

              {/* Eligibility Bar */}
              <div className="p-3.5 bg-slate-800/70 border border-slate-700/60 rounded-xl text-xs flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Eligibility:</strong> {activeData.eligibility}
                </span>
              </div>

              {/* Subject Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-sky-400" />
                  <span>Curriculum & Subject Combination</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeData.subjects.map((sub) => (
                    <div
                      key={sub.code}
                      className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-200">
                        {sub.name} <span className="text-slate-500 font-mono">({sub.code})</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{sub.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Career Horizons */}
              <div className="p-3.5 bg-indigo-950/30 border border-indigo-900/40 rounded-xl text-xs space-y-1">
                <span className="font-bold text-indigo-300 uppercase tracking-wide block text-[11px]">
                  Career Pathways & Future Eligibility:
                </span>
                <p className="text-slate-300 leading-relaxed">{activeData.careerProspects}</p>
              </div>
            </div>

            {/* Right 5 Columns: All-Inclusive Fee Box */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative">
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  All-Inclusive Fee
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Package</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {activeData.feeDisplay}
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">/- Complete</span>
                </div>
                <p className="text-xs text-slate-400">Zero extra charges • Zero hidden costs</p>
              </div>

              {/* Inclusions Checklist */}
              <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Official Board Registration & Enrollment</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>5 Main Subjects Board Examination Fee</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Practical Lab & Internal Assessments Included</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Transfer of Credit (TOC) Evaluation Included</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Official TC & Migration Certificate Included</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Hologram Marksheet Verification Included</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Complete Printed/Digital Self-Study Material</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>SoftLab Prayagraj Campus Counselor Mentorship</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2.5">
                <a href="#inquiry-form" className="block w-full">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 shadow-md">
                    Apply for {activeData.title}
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </a>

                <Button
                  variant="outline"
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Hello SoftLab Global! 👋 I am interested in BOSSE Board Admission for ${activeData.title} (Fee: ${activeData.feeDisplay}). Please provide registration details and subject options.`
                    );
                    window.open(`https://wa.me/919196596975?text=${text}`, "_blank");
                  }}
                  className="w-full border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                  <span>WhatsApp Admission Helpline</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. TRANSPARENT ALL-STREAM FEE COMPARISON MATRIX                      */}
      {/* ==================================================================== */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h3 className="text-xl sm:text-3xl font-black text-white">Full Fee Distribution & Comparison</h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Compare all streams side-by-side with 100% upfront fee transparency.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
            <thead className="bg-slate-950/80 text-slate-200 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-4 font-bold">Program / Stream</th>
                <th className="py-4 px-3 font-bold">Total All-Inclusive Fee</th>
                <th className="py-4 px-3 font-bold">Registration & Exam</th>
                <th className="py-4 px-3 font-bold">Practicals / Lab</th>
                <th className="py-4 px-3 font-bold">TOC & Migration</th>
                <th className="py-4 px-4 font-bold text-right">Enrollment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              <tr className="hover:bg-slate-800/40 transition">
                <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Class 10th (Secondary)
                </td>
                <td className="py-4 px-3 font-mono font-bold text-emerald-400 text-sm">₹36,500</td>
                <td className="py-4 px-3 text-slate-400">Included (₹0)</td>
                <td className="py-4 px-3 text-slate-400">Included (₹0)</td>
                <td className="py-4 px-3 text-slate-400">Included (₹0)</td>
                <td className="py-4 px-4 text-right">
                  <button
                    onClick={() => {
                      setSelectedStream("10th");
                      setTargetStream("Class 10th (Secondary)");
                      document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-[11px] font-bold text-emerald-400 hover:underline"
                  >
                    Select 10th ➔
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition">
                <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Class 12th Science Stream
                </td>
                <td className="py-4 px-3 font-mono font-bold text-sky-400 text-sm">₹39,500</td>
                <td className="py-4 px-3 text-slate-400">Included (₹0)</td>
                <td className="py-4 px-3 text-slate-400">Physics/Chem/Bio Lab (₹0)</td>
                <td className="py-4 px-3 text-slate-400">Included (₹0)</td>
                <td className="py-4 px-4 text-right">
                  <button
                    onClick={() => {
                      setSelectedStream("12th-science");
                      setTargetStream("Class 12th (Science)");
                      document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-[11px] font-bold text-sky-400 hover:underline"
                  >
                    Select Science ➔
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition">
                <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Class 12th Commerce Stream
                </td>
                <td className="py-4 px-3 font-mono font-bold text-amber-400 text-sm">₹37,500</td>
                <td className="py-4 px-3 text-slate-400">Included (₹0)</td>
                <td className="py-4 px-3 text-slate-400">Projects & Data Entry (₹0)</td>
                <td className="py-4 px-3 text-slate-400">Included (₹0)</td>
                <td className="py-4 px-4 text-right">
                  <button
                    onClick={() => {
                      setSelectedStream("12th-commerce");
                      setTargetStream("Class 12th (Commerce)");
                      document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-[11px] font-bold text-amber-400 hover:underline"
                  >
                    Select Commerce ➔
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition">
                <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Class 12th Arts & Humanities
                </td>
                <td className="py-4 px-3 font-mono font-bold text-purple-400 text-sm">₹36,500</td>
                <td className="py-4 px-3 text-slate-400">Included (₹0)</td>
                <td className="py-4 px-3 text-slate-400">Geography/Practicals (₹0)</td>
                <td className="py-4 px-3 text-slate-400">Included (₹0)</td>
                <td className="py-4 px-4 text-right">
                  <button
                    onClick={() => {
                      setSelectedStream("12th-arts");
                      setTargetStream("Class 12th (Arts)");
                      document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-[11px] font-bold text-purple-400 hover:underline"
                  >
                    Select Arts ➔
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. TRANSFER OF CREDIT (TOC) & ON-DEMAND EXAM FEATURE                 */}
      {/* ==================================================================== */}
      <section className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-900/40 rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Failed in CBSE / UP Board / NIOS? Save Your Year!</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Transfer of Credit (TOC) Scheme
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              If you could not pass your Class 10th or 12th examination from CBSE, ICSE, UP Board, NIOS, or any other recognized state board, you don&apos;t have to repeat the whole year!
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Transfer up to 4 Subjects:</strong> Your passed marks will be transferred directly to BOSSE board.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Appear only in Remaining Subjects:</strong> Sit only for the 1 or 2 subjects you need to clear.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Complete Pass Certificate Issued:</strong> Receive official Secondary or Senior Secondary Marksheet and Migration Certificate with 100% validity.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
            <h4 className="font-bold text-white text-sm">Eligible Boards for Credit Transfer:</h4>
            <div className="flex flex-wrap gap-2">
              {[
                "CBSE",
                "UP Board (Madhyamik Shiksha Parishad)",
                "NIOS",
                "ICSE / ISC",
                "Bihar Board (BSEB)",
                "MP Board",
                "Rajasthan Board (RBSE)",
                "Maharashtra State Board",
                "All COBSE Member Boards",
              ].map((b) => (
                <span
                  key={b}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-semibold"
                >
                  {b}
                </span>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-800 text-slate-400 leading-relaxed text-[11px]">
              Bring your original failed/pass marksheet to our Civil Lines Prayagraj office or send via WhatsApp for immediate credit transfer verification.
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. INQUIRY & ADMISSION APPLICATION FORM (ROUTES TO CRM)              */}
      {/* ==================================================================== */}
      <section id="inquiry-form" className="scroll-mt-24">
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs uppercase font-bold tracking-wider">
              Direct Board Application
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              BOSSE 10th & 12th Admission Desk
            </h3>
            <p className="text-xs text-slate-400">
              Submit your inquiry below. Our dedicated Education Counseling Team will contact you within 2 hours with syllabus and fee confirmation.
            </p>
          </div>

          {formSubmitted ? (
            <div className="p-6 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Inquiry Received Successfully!</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Thank you, <strong>{fullName}</strong>. Your enquiry for <strong>{targetStream}</strong> has been logged in our admissions queue.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Hello SoftLab Admissions Desk! 👋 I just submitted my BOSSE inquiry on website for ${targetStream}. Please guide me on next steps.`
                    );
                    window.open(`https://wa.me/919196596975?text=${text}`, "_blank");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Connect with Counselor on WhatsApp Now</span>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Candidate Full Name *</Label>
                <Input
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">10-Digit Mobile / WhatsApp *</Label>
                  <Input
                    required
                    type="tel"
                    placeholder="e.g. 9196596975"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white text-xs h-10 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">City / District *</Label>
                  <Input
                    required
                    placeholder="e.g. Prayagraj / Varanasi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white text-xs h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">Target Program & Stream *</Label>
                  <select
                    value={targetStream}
                    onChange={(e) => setTargetStream(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                  >
                    <option value="Class 10th (Secondary)">Class 10th Secondary (₹36,500)</option>
                    <option value="Class 12th (Science)">Class 12th Science Stream (₹39,500)</option>
                    <option value="Class 12th (Commerce)">Class 12th Commerce Stream (₹37,500)</option>
                    <option value="Class 12th (Arts)">Class 12th Arts / Humanities (₹36,500)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">Transfer of Credit (TOC) Needed?</Label>
                  <select
                    value={tocRequired}
                    onChange={(e) => setTocRequired(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                  >
                    <option value="NO">No (Fresh Admission)</option>
                    <option value="YES">Yes (Transfer marks from failed board)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Previous School Board (If Any)</Label>
                <Input
                  placeholder="e.g. UP Board, CBSE, NIOS, ICSE, or None"
                  value={previousBoard}
                  onChange={(e) => setPreviousBoard(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Any Questions or Preferred Subjects?</Label>
                <Input
                  placeholder="e.g. Want PCB for NEET preparation, or urgent admission inquiry..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs h-10"
                />
              </div>

              <Button
                type="submit"
                disabled={submitEnquiry.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 shadow-md gap-2"
              >
                <Send className="h-4 w-4" />
                <span>{submitEnquiry.isPending ? "Submitting Inquiry..." : "Submit Admission Inquiry"}</span>
              </Button>

              <p className="text-[11px] text-slate-500 text-center">
                Official Campus: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj - 211011. Helpline: +91 9196596975
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. FREQUENTLY ASKED QUESTIONS ACCORDION                              */}
      {/* ==================================================================== */}
      <section className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <h3 className="text-xl sm:text-3xl font-black text-white">Frequently Asked Questions</h3>
          <p className="text-xs text-slate-400">Everything you need to know about BOSSE Board Open Schooling.</p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Is BOSSE Board valid for NEET, JEE, and Central University Admissions?",
              a: "Yes. BOSSE is established by the Sikkim Legislative Assembly under Act No. 14 of 2020 and is a full member of COBSE (Council of Boards of School Education in India) and recognized by AIU (Association of Indian Universities). Its Class 10th and 12th certificates are equivalent to CBSE and ICSE and accepted for NEET, JEE, NDA, CUET, and university degree admissions across India.",
            },
            {
              q: "Are practicals, TC, migration, and registration included in the ₹36,500 / ₹39,500 fee?",
              a: "Yes, 100%. SoftLab Global guarantees complete transparency: the fee covers board registration, 5 subjects examination fee, practical lab exams (Physics, Chemistry, Biology, Computer Science), Transfer of Credit (TOC), Transfer Certificate (TC), Migration Certificate, and verified marksheets. There are zero extra per-subject or hidden charges.",
            },
            {
              q: "How does the Transfer of Credit (TOC) work for failed students?",
              a: "If you have appeared for Class 10th or 12th from CBSE, UP Board, NIOS, or another recognized board and passed in some subjects but failed overall, you can transfer up to 4 passed subjects directly into BOSSE. You only need to appear and pass the remaining 1 or 2 subjects to obtain a complete pass marksheet in the same session.",
            },
            {
              q: "Is BOSSE marksheet accepted for Govt. Jobs and Indian Passport?",
              a: "Yes. BOSSE certificates are accepted for all government employment (State and Central), Defence (Army, Navy, Air Force), Police, Railway, and for Passport verification under the Ministry of External Affairs guidelines.",
            },
            {
              q: "When are the examinations conducted?",
              a: "BOSSE conducts public examinations twice every year (April-May block and October-November block). In addition, On-Demand Examinations (ODE) are available for students seeking quick completion.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2 text-xs"
            >
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{item.q}</span>
              </h4>
              <p className="text-slate-300 leading-relaxed pl-6">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
