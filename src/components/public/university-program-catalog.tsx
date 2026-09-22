"use client";

import React, { useState, useMemo } from "react";
import { 
  GraduationCap, 
  Search, 
  Clock, 
  BookOpen, 
  IndianRupee, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight, 
  PhoneCall, 
  Sparkles,
  Filter,
  Layers,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { openCareerCounselingModal } from "@/components/public/career-counseling-modal";
import { DPGU_CONFIG } from "@/config/university.config";

export interface UniversityProgramItem {
  id: string;
  title: string;
  slug: string;
  durationYears: string | null;
  durationWeeks: number;
  programCategory: string | null;
  specialization: string | null;
  specializations: string[];
  registrationFee: number | null; // in Paise
  examinationFee: number | null;  // in Paise
  universityFeeYear: number | null; // in Paise
  lateralEntryFee: number | null; // in Paise
  isLateralEligible: boolean;
  admissionSession: string | null;
  summary: string;
  description: string;
}

interface UniversityProgramCatalogProps {
  programs: UniversityProgramItem[];
}

const CATEGORIES = [
  { key: "ALL", label: "All Programs" },
  { key: "UNDERGRADUATE", label: "Undergraduate (UG)" },
  { key: "POSTGRADUATE", label: "Postgraduate (PG)" },
  { key: "DIPLOMA", label: "Diploma & Polytechnic" },
  { key: "PROFESSIONAL", label: "Professional Degrees" },
  { key: "LAW", label: "Law (LL.B / LL.M)" },
  { key: "RESEARCH", label: "Doctoral (Ph.D)" },
];

export function UniversityProgramCatalog({ programs }: UniversityProgramCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProgramForModal, setSelectedProgramForModal] = useState<UniversityProgramItem | null>(null);

  const formatPaise = (paise?: number | null) => {
    if (!paise || paise === 0) return "Included in Fee";
    return (paise / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        p.programCategory?.toUpperCase() === selectedCategory.toUpperCase();

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        (p.specialization && p.specialization.toLowerCase().includes(query)) ||
        p.specializations.some((s) => s.toLowerCase().includes(query)) ||
        (p.summary && p.summary.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [programs, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Official Portals Quick Access Banner */}
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50/80 via-blue-50/50 to-indigo-50/70 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Badge variant="outline" className="text-[11px] font-bold text-sky-800 bg-white/80 border-sky-200">
              {DPGU_CONFIG.integrationLabel}
            </Badge>
            <span className="text-xs text-slate-500 font-medium">Session {DPGU_CONFIG.sessionFull}</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Official Dr. Preeti Global University Portal Links
          </h3>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Authorized consultants, admissions staff, and registered university students can launch the official portals below without separate lookups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <a
            href={DPGU_CONFIG.portals.consultantPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-xs hover:bg-slate-800 transition"
          >
            <Building2 className="h-3.5 w-3.5 text-sky-400" />
            <span>Partner / Consultant Login</span>
            <ExternalLink className="h-3 w-3 text-slate-400 ml-0.5" />
          </a>

          <a
            href={DPGU_CONFIG.portals.studentPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-300 shadow-xs hover:bg-slate-50 transition"
          >
            <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
            <span>University Student Login</span>
            <ExternalLink className="h-3 w-3 text-slate-400 ml-0.5" />
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-2 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search branch, program, degree..."
              className="pl-8 text-xs h-9 bg-white border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>
            Showing <strong className="text-slate-900">{filteredPrograms.length}</strong> Dr. Preeti Global University Programs
          </span>
          <span className="text-[11px] text-slate-400">
            Admissions Open for Session {DPGU_CONFIG.admissionSession}
          </span>
        </div>
      </div>

      {/* Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No matching university programs found</h4>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search query or selecting a different category.</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
            }}
            className="mt-4 text-xs"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((prog) => {
            const hasLateral = prog.isLateralEligible && prog.lateralEntryFee && prog.lateralEntryFee > 0;
            return (
              <div
                key={prog.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-sky-300"
              >
                <div>
                  {/* Card Header & Badges */}
                  <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border-sky-200"
                      >
                        {prog.programCategory || "UNIVERSITY"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        Session {prog.admissionSession || "2026"}
                      </Badge>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-sky-700 transition tracking-tight">
                      {prog.title}
                    </h3>
                    
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {prog.summary}
                    </p>

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1 text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-sky-600" />
                        <span>{prog.durationYears || "Standard Duration"}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Dr. Preeti Global University
                      </span>
                    </div>
                  </div>

                  {/* Specializations / Branches */}
                  <div className="p-5 space-y-3">
                    {prog.specialization && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Branches / Specializations:
                        </span>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {prog.specialization}
                        </p>
                      </div>
                    )}

                    {/* Official Fee Matrix */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">University Fee:</span>
                        <span className="font-extrabold text-slate-900 font-mono text-sm text-emerald-700">
                          {formatPaise(prog.universityFeeYear)}
                          <span className="text-[10px] text-slate-400 font-normal"> / year</span>
                        </span>
                      </div>

                      {hasLateral && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500 font-medium">Lateral Entry Fee:</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {formatPaise(prog.lateralEntryFee)}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Registration:</span>
                          <span className="font-semibold text-slate-800">
                            {prog.registrationFee && prog.registrationFee > 0 ? formatPaise(prog.registrationFee) : "Included"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block">Examination:</span>
                          <span className="font-semibold text-slate-800">
                            {prog.examinationFee && prog.examinationFee > 0 ? `${formatPaise(prog.examinationFee)}/sem` : "Included"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => openCareerCounselingModal(`Dr. Preeti Global University - ${prog.title}`)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 rounded-xl shadow-xs"
                  >
                    <span>Apply Now</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => openCareerCounselingModal(`Dr. Preeti Global University - ${prog.title}`)}
                    className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold text-xs h-9 rounded-xl gap-1"
                  >
                    <PhoneCall className="h-3 w-3 text-emerald-600" />
                    <span>Counseling</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Institutional Advisory Disclaimer Note */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-600 leading-relaxed">
        <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-sky-700" />
          <span>SoftLab Global — University Programs Facilitation Notice</span>
        </h4>
        <p>{DPGU_CONFIG.disclaimer}</p>
      </div>
    </div>
  );
}
