"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api as trpc } from "@/lib/trpc/react";
import {
  INITIAL_ACADEMIC_PACKAGES,
  INITIAL_COMPETITIVE_ADDONS,
  INITIAL_SKILLVERSE_COURSES,
  INITIAL_SKILLVERSE_FEE_RULES,
} from "@/lib/constants/skillverse-data";
import { Calculator, CheckCircle2, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";

export default function SkillversePackagesAndFeesPage() {
  const { data } = trpc.skillverse.getPublicCatalog.useQuery();
  const packages = data?.packages || INITIAL_ACADEMIC_PACKAGES;
  const addons = data?.addons || INITIAL_COMPETITIVE_ADDONS;
  const courses = (data?.courses || INITIAL_SKILLVERSE_COURSES).filter(
    (c) => c.pricingType === "STANDALONE"
  );
  const feeRules = data?.feeRules || INITIAL_SKILLVERSE_FEE_RULES;

  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[0]?.id || "");
  const [selectedAddonId, setSelectedAddonId] = useState<string>("");
  const [selectedStandaloneSlug, setSelectedStandaloneSlug] = useState<string>("");

  const pkg = packages.find((p) => p.id === selectedPkgId);
  const addon = addons.find((a) => a.id === selectedAddonId);
  const standalone = courses.find((c) => c.slug === selectedStandaloneSlug);

  const pkgMonthly = pkg ? pkg.monthlyPriceInr : 0;
  const addonMonthly = addon ? addon.monthlyAddonPriceInr : 0;
  const standalonePrice = standalone ? standalone.priceInr : 0;
  const oneTimeFees =
    feeRules.admissionAndRegistrationFeeInr + feeRules.studentIdAndLearningKitFeeInr;
  const totalPayableBeforeCheckout = pkgMonthly + addonMonthly + standalonePrice + oneTimeFees;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#071630] via-[#0B2247] to-[#15803D] rounded-3xl p-8 sm:p-10 text-white space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-lime-300">
          100% Fee Transparency • No Silent Bundling
        </span>
        <h1 className="text-3xl sm:text-4xl font-black">
          Packages, Competitive Add-Ons & Standalone Course Fees
        </h1>
        <p className="text-sm text-slate-200 max-w-3xl">
          Every monthly academic package, optional competitive-exam add-on, standalone skill course,
          and one-time admission/kit fee is disclosed clearly before checkout.
        </p>
      </div>

      {/* 1. MONTHLY ACADEMIC PACKAGES (PACKAGES 1 TO 5) */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            1. Monthly Academic Packages (Classes 8–10 & Classes 11–12)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Select a monthly package for your grade. 12-month undiscounted totals are shown for
            complete transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                    {p.eligibleGrades}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">{p.code}</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">{p.name}</h3>
                <div className="pt-1">
                  <span className="text-3xl font-black text-blue-700">
                    ₹{p.monthlyPriceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold"> / month</span>
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">
                    12-Month Undiscounted Total: ₹
                    {p.twelveMonthUndiscountedTotalInr.toLocaleString("en-IN")}
                  </div>
                </div>
                <p className="text-xs text-slate-600">{p.summary}</p>
                <ul className="space-y-1.5 pt-2 text-xs text-slate-700">
                  {p.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPkgId(p.id)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedPkgId === p.id
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-900 hover:bg-blue-700 text-white"
                  }`}
                >
                  {selectedPkgId === p.id
                    ? "Selected in Fee Calculator Below"
                    : "Select in Fee Calculator"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. COMPETITIVE-EXAM ADD-ONS */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            2. Optional Competitive-Exam Add-Ons (Never Silently Combined)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Add-ons are optional and billed transparently alongside your chosen academic package.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {addons.map((a) => (
            <div
              key={a.id}
              className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase">
                  {a.eligibleGrades}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{a.name}</h3>
                <p className="text-xs text-slate-600 mt-1.5">{a.description}</p>
                {a.complianceNote && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                    {a.complianceNote}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-lg font-black text-emerald-700">
                    +₹{a.monthlyAddonPriceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-500">/month additional</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedAddonId((prev) => (prev === a.id ? "" : a.id))
                  }
                  className="text-xs font-bold text-blue-700 hover:underline"
                >
                  {selectedAddonId === a.id ? "Remove Add-On" : "+ Add to Estimate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. STANDALONE COURSES */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            3. Standalone Technology, AI, Coding & Communication Courses
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Short-term skill courses (1 to 3 months) available independently or alongside school
            studies.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-900 text-white text-xs uppercase">
                <th className="py-3.5 px-4 font-bold">Course Title</th>
                <th className="py-3.5 px-4 font-bold">Eligible Classes</th>
                <th className="py-3.5 px-4 font-bold">Duration</th>
                <th className="py-3.5 px-4 font-bold text-right">Course Fee</th>
                <th className="py-3.5 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{c.title}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {c.eligibleGrades.join(", ")}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-blue-700">
                    {c.durationLabel}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                    ₹{c.priceInr.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/skillverse/${c.slug}`}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Syllabus →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. INITIAL FEE RULES & COMPLETE PAYABLE SUMMARY BEFORE CHECKOUT */}
      <section className="bg-[#071630] text-white rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-lime-400">
              Initial Fee Rules & Pre-Checkout Disclosure
            </span>
            <h2 className="text-2xl font-extrabold">
              Complete Payable Amount Summary Before Enrollment
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                • <strong>Admission and Registration Fee:</strong> ₹
                {feeRules.admissionAndRegistrationFeeInr} one-time
              </li>
              <li>
                • <strong>Student ID and Learning Kit:</strong> ₹
                {feeRules.studentIdAndLearningKitFeeInr} one-time
              </li>
              <li>
                • <strong>Initial Academic Assessment:</strong> Free (₹0)
              </li>
              <li>
                • <strong>Demo Class:</strong> Free (₹0)
              </li>
            </ul>
            <p className="text-xs text-slate-400 leading-relaxed">
              {feeRules.additionalMaterialsDisclosure}
            </p>
          </div>

          <div className="lg:col-span-6 bg-white text-slate-900 rounded-2xl p-6 space-y-3 text-xs sm:text-sm">
            <h3 className="font-black text-base text-slate-900 border-b border-slate-200 pb-2">
              Selected Payable Breakdown
            </h3>
            <div className="flex justify-between">
              <span className="text-slate-600">
                Academic Package ({pkg?.name || "None"}):
              </span>
              <span className="font-mono font-bold">₹{pkgMonthly.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">
                Competitive Add-On ({addon?.name || "None selected"}):
              </span>
              <span className="font-mono font-bold">₹{addonMonthly.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Admission & Registration (One-Time):</span>
              <span className="font-mono font-bold">
                ₹{feeRules.admissionAndRegistrationFeeInr.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Student ID & Learning Kit (One-Time):</span>
              <span className="font-mono font-bold">
                ₹{feeRules.studentIdAndLearningKitFeeInr.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-black text-blue-700">
              <span>Total Payable at Enrollment:</span>
              <span className="font-mono">
                ₹{totalPayableBeforeCheckout.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="pt-3 flex flex-wrap gap-3">
              <Link
                href="/skillverse/admissions"
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-center text-xs"
              >
                Proceed to Admission Application →
              </Link>
              <Link
                href="/skillverse/free-demo-class"
                className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-center text-xs"
              >
                Book Free Demo First
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
