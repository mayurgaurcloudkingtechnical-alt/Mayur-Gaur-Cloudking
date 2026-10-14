"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import {
  Building2,
  GraduationCap,
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
  Award,
  Sparkles,
  FileText,
  ChevronDown,
  Globe,
  Layers,
} from "lucide-react";
import { InstitutionType } from "@prisma/client";

export default function CampusPartnershipsPublicPage() {
  const [formData, setFormData] = useState({
    name: "",
    type: InstitutionType.COLLEGE,
    affiliation: "",
    recognition: "AICTE / UGC / State Govt.",
    city: "",
    state: "Uttar Pradesh",
    pincode: "",
    website: "",
    officialEmail: "",
    officialPhone: "",
    authorizedPersonName: "",
    authorizedPersonDesignation: "Director / Principal / Head of T&P",
    authorizedPersonEmail: "",
    authorizedPersonPhone: "",
    placementOfficerName: "",
    placementOfficerEmail: "",
    placementOfficerPhone: "",
    estimatedStudentCount: 500,
  });

  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const registerMutation = api.institution.registerPublicInstitution.useMutation({
    onSuccess: (res) => {
      setSubmittedCode(res.code);
    },
    onError: (err) => {
      alert(`Registration could not be completed: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      name: formData.name,
      type: formData.type,
      affiliation: formData.affiliation,
      recognition: formData.recognition,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      website: formData.website,
      officialEmail: formData.officialEmail,
      officialPhone: formData.officialPhone,
      authorizedPersonName: formData.authorizedPersonName,
      authorizedPersonDesignation: formData.authorizedPersonDesignation,
      authorizedPersonEmail: formData.authorizedPersonEmail,
      authorizedPersonPhone: formData.authorizedPersonPhone,
      placementOfficerName: formData.placementOfficerName,
      placementOfficerEmail: formData.placementOfficerEmail,
      placementOfficerPhone: formData.placementOfficerPhone,
      estimatedStudentCount: Number(formData.estimatedStudentCount) || 500,
    });
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
              <Building2 className="h-3.5 w-3.5" />
              <span>Institutional Onboarding & Placement Alliance</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Empowering Institutions. Connecting Talent.{" "}
              <span className="text-emerald-400">Building Careers.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Partner with SoftLab Global to connect your students with recruiters, campus placement drives, job fairs, and career opportunities through one integrated placement platform.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href="#register"
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-2"
              >
                <span>Register Your Institution</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <Link
                href="/login"
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all flex items-center gap-2"
              >
                <span>Institutional Partner Login</span>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PILLARS & STATS */}
      <section className="py-12 border-b border-slate-800/80 bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-3xl font-extrabold text-emerald-400">1,200+</div>
              <div className="text-xs text-slate-400 font-semibold mt-1">Corporate Hiring Partners</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-3xl font-extrabold text-sky-400">50+</div>
              <div className="text-xs text-slate-400 font-semibold mt-1">Colleges & Universities</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-3xl font-extrabold text-indigo-400">25,000+</div>
              <div className="text-xs text-slate-400 font-semibold mt-1">Students Connected</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-3xl font-extrabold text-amber-400">Mega Fairs</div>
              <div className="text-xs text-slate-400 font-semibold mt-1">Hybrid & On-Campus Events</div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="py-16 sm:py-20 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              A Comprehensive Placement Ecosystem
            </h2>
            <p className="text-sm text-slate-400">
              Tailored benefits engineered for institutions, academic leadership, aspiring students, and hiring employers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For Colleges */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">For Colleges & Universities</h3>
              <ul className="text-xs text-slate-400 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Dedicated institutional workspace with role-based staff access.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Bulk student ingestion via standardized CSV & Excel templates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Access to national recruiters without massive overhead or travel costs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Real-time tracking of applications, interview calls, and offers.</span>
                </li>
              </ul>
            </div>

            {/* For Students */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">For Engineering & College Students</h3>
              <ul className="text-xs text-slate-400 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>Access to verified corporate job drives matching their CGPA and skills.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>Direct entry into regional and virtual Mega Job Fairs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>Automated eligibility feedback with transparent round updates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>Free professional resume standardization and career profile.</span>
                </li>
              </ul>
            </div>

            {/* For Recruiters */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">For Recruiters & Corporate Employers</h3>
              <ul className="text-xs text-slate-400 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Pre-screened, verified candidate talent pools across 50+ institutions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Customizable drive eligibility: CGPA, passing year, and backlog filters.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Dedicated corporate stalls in hybrid and regional hiring fairs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Zero recruiter platform charges for campus hiring partnerships.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 sm:py-20 border-b border-slate-800 bg-slate-900/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Partnership Onboarding Process
            </h2>
            <p className="text-sm text-slate-400">
              Four straightforward steps to connect your campus with top-tier technology recruiters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 relative">
              <span className="text-3xl font-black text-slate-700">01</span>
              <h4 className="text-sm font-bold text-white">Institutional Registration</h4>
              <p className="text-xs text-slate-400">
                Submit official college information, university affiliation, and authorized placement officer contact.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 relative">
              <span className="text-3xl font-black text-slate-700">02</span>
              <h4 className="text-sm font-bold text-white">Central Verification</h4>
              <p className="text-xs text-slate-400">
                SoftLab Global reviews recognition details and provisions a dedicated tenant workspace.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 relative">
              <span className="text-3xl font-black text-slate-700">03</span>
              <h4 className="text-sm font-bold text-white">Batch & Student Import</h4>
              <p className="text-xs text-slate-400">
                Download standardised CSV template, import student records, and assign academic cohorts.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 relative">
              <span className="text-3xl font-black text-slate-700">04</span>
              <h4 className="text-sm font-bold text-white">Drives & Job Fairs</h4>
              <p className="text-xs text-slate-400">
                Nominate eligible students for campus placement drives and participate in regional Mega Job Fairs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* REGISTRATION FORM SECTION */}
      <section id="register" className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Institutional Application</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Register Your College or University
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Complete the application form below. Our placement operations cell will verify the details and activate your institutional account.
              </p>
            </div>

            {submittedCode ? (
              <div className="p-8 text-center bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Application Received!</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Your institutional registration has been submitted under tracking code:
                </p>
                <div className="text-lg font-mono font-black text-emerald-400 bg-slate-900 px-4 py-2 rounded-lg inline-block border border-slate-700">
                  {submittedCode}
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Our central placement team will review your application and send administrative login credentials to your authorized email address.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* College Information */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>1. Institution Information</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">
                        Institution Legal Name*
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Government Engineering College, Prayagraj"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Institution Type*</label>
                      <select
                        value={formData.type}
                        onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="COLLEGE">General College</option>
                        <option value="ENGINEERING_COLLEGE">Engineering & Technology College</option>
                        <option value="UNIVERSITY">University</option>
                        <option value="MANAGEMENT_INSTITUTE">Management Institute (MBA/BBA)</option>
                        <option value="POLYTECHNIC">Polytechnic / Diploma Institute</option>
                        <option value="ITI">Industrial Training Institute (ITI)</option>
                        <option value="OTHER">Other Professional Institute</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Affiliating University (if applicable)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. AKTU / University of Allahabad"
                        value={formData.affiliation}
                        onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">City / District*</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Prayagraj"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">State*</label>
                      <input
                        required
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Official Institutional Email*
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="principal@college.edu.in or info@college.edu.in"
                        value={formData.officialEmail}
                        onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Official Website</label>
                      <input
                        type="url"
                        placeholder="https://www.college.edu.in"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Authorized Contact */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>2. Authorized Representative & Placement Officer</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Authorized Person Name*
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Dr. / Prof. / Mr."
                        value={formData.authorizedPersonName}
                        onChange={(e) => setFormData({ ...formData, authorizedPersonName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Designation*</label>
                      <input
                        required
                        type="text"
                        value={formData.authorizedPersonDesignation}
                        onChange={(e) =>
                          setFormData({ ...formData, authorizedPersonDesignation: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Representative Email Address*
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="rep@college.edu.in"
                        value={formData.authorizedPersonEmail}
                        onChange={(e) => setFormData({ ...formData, authorizedPersonEmail: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Representative Mobile Number*
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="10-digit mobile"
                        value={formData.authorizedPersonPhone}
                        onChange={(e) => setFormData({ ...formData, authorizedPersonPhone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Training & Placement Officer (TPO) Name
                      </label>
                      <input
                        type="text"
                        placeholder="TPO Full Name"
                        value={formData.placementOfficerName}
                        onChange={(e) => setFormData({ ...formData, placementOfficerName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Estimated Final-Year Students Count
                      </label>
                      <input
                        type="number"
                        value={formData.estimatedStudentCount}
                        onChange={(e) =>
                          setFormData({ ...formData, estimatedStudentCount: parseInt(e.target.value) || 500 })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[11px] text-slate-400">
                    By submitting, you agree to SoftLab Global's institutional collaboration terms and lawful candidate data handling policies.
                  </p>

                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
                  >
                    <span>{registerMutation.isPending ? "Submitting..." : "Submit Application"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* RECRUITER COLLABORATION CTA */}
      <section className="py-12 bg-slate-900 border-t border-slate-800 text-center">
        <div className="mx-auto max-w-4xl px-4 space-y-3">
          <h3 className="text-xl font-bold text-white">Are You a Corporate Recruiter or Employer?</h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            SoftLab Global invites tech enterprises, IT startups, and corporations to hire across our 50+ institutional partners with zero recruiter platform charges.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <span>Connect with Corporate Placement Desk</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
