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
  Building2,
  Award,
  ChevronRight
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
      {/* 1. Official Portals Quick Access Banner */}
      <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-r from-slate-900/90 via-sky-950/60 to-slate-900/90 p-5 sm:p-7 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <Badge variant="outline" className="text-[11px] font-bold text-sky-300 bg-sky-950/80 border-sky-400/40">
              {DPGU_CONFIG.integrationLabel}
            </Badge>
            <span className="text-xs text-slate-400 font-medium">Session {DPGU_CONFIG.sessionFull}</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            Official Dr. Preeti Global University Portal Logins
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Authorized consultants, admissions counselors, and registered university students can launch their respective official portals below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto z-10">
          <a
            href={DPGU_CONFIG.portals.consultantPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white shadow-lg hover:bg-sky-500 transition-all"
          >
            <Building2 className="h-4 w-4 text-sky-200" />
            <span>Partner / Consultant Portal</span>
            <ExternalLink className="h-3.5 w-3.5 text-sky-200 ml-0.5" />
          </a>

          <a
            href={DPGU_CONFIG.portals.studentPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-100 border border-slate-700 shadow-md hover:bg-slate-700 transition-all"
          >
            <GraduationCap className="h-4 w-4 text-emerald-400" />
            <span>University Student Portal</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
          </a>
        </div>
      </div>

      {/* 2. Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                      : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search branch, program, degree..."
              className="pl-10 text-xs h-10 bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-500 rounded-xl focus:border-sky-500"
            />
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
          <span>
            Showing <strong className="text-sky-400">{filteredPrograms.length}</strong> Dr. Preeti Global University Programs
          </span>
          <span className="text-[11px] text-slate-400">
            Admissions Active for Session {DPGU_CONFIG.admissionSession}
          </span>
        </div>
      </div>

      {/* 3. Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-8">
          <BookOpen className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-200">No matching university programs found</h4>
          <p className="text-xs text-slate-400 mt-1">Try clearing your search query or selecting a different category.</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
            }}
            className="mt-4 text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
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
                className="bg-slate-900/80 rounded-3xl border border-slate-800/90 shadow-xl hover:shadow-2xl hover:border-sky-500/60 transition-all duration-300 flex flex-col justify-between overflow-hidden group backdrop-blur-md"
              >
                <div>
                  {/* Card Header & Badges */}
                  <div className="p-6 border-b border-slate-800/80 bg-gradient-to-b from-slate-850 to-slate-900/90">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold uppercase tracking-wider bg-sky-950/80 text-sky-300 border-sky-400/30"
                      >
                        {prog.programCategory || "UNIVERSITY"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30"
                      >
                        Session {prog.admissionSession || "2026"}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-extrabold text-white group-hover:text-sky-300 transition-colors tracking-tight">
                      {prog.title}
                    </h3>
                    
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {prog.summary}
                    </p>

                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5 text-sky-300">
                        <Clock className="h-3.5 w-3.5 text-sky-400" />
                        <span>{prog.durationYears || "Standard Duration"}</span>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Dr. Preeti Global University
                      </span>
                    </div>
                  </div>

                  {/* Specializations / Branches */}
                  <div className="p-6 space-y-4">
                    {prog.specialization && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Branches / Specializations:
                        </span>
                        <p className="text-xs text-slate-200 font-medium leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          {prog.specialization}
                        </p>
                      </div>
                    )}

                    {/* Official Fee Matrix */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Annual Tuition Fee:</span>
                        <span className="font-extrabold text-emerald-400 font-mono text-base">
                          {formatPaise(prog.universityFeeYear)}
                          <span className="text-[10px] text-slate-400 font-normal"> / yr</span>
                        </span>
                      </div>

                      {hasLateral && (
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                          <span className="text-slate-400 font-medium">Lateral Entry Fee:</span>
                          <span className="font-bold text-amber-300 font-mono">
                            {formatPaise(prog.lateralEntryFee)}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Registration:</span>
                          <span className="font-semibold text-slate-300">
                            {prog.registrationFee && prog.registrationFee > 0 ? formatPaise(prog.registrationFee) : "Included"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 text-[10px] block">Examination:</span>
                          <span className="font-semibold text-slate-300">
                            {prog.examinationFee && prog.examinationFee > 0 ? `${formatPaise(prog.examinationFee)}/sem` : "Included"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 pt-0 grid grid-cols-2 gap-2.5">
                  <Button
                    onClick={() => openCareerCounselingModal(`Dr. Preeti Global University - ${prog.title}`)}
                    className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs h-10 rounded-xl shadow-lg shadow-sky-500/20"
                  >
                    <span>Apply Online</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => openCareerCounselingModal(`Dr. Preeti Global University - ${prog.title}`)}
                    className="w-full border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white font-semibold text-xs h-10 rounded-xl gap-1.5"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Counseling</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Institutional Advisory Disclaimer Note */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-xs text-slate-400 leading-relaxed backdrop-blur-sm">
        <h4 className="font-bold text-slate-200 mb-1.5 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-sky-400" />
          <span>SoftLab Global — University Programs Facilitation Notice</span>
        </h4>
        <p>{DPGU_CONFIG.disclaimer}</p>
      </div>
    </div>
  );
}
