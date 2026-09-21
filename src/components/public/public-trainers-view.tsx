"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openCareerCounselingModal } from "@/components/public/career-counseling-modal";
import {
  Users,
  BookOpen,
  Award,
  ArrowRight,
  ShieldCheck,
  Search,
  GraduationCap,
  Sparkles,
  PhoneCall,
  Calendar,
  Briefcase,
  Layers,
  CheckCircle2,
} from "lucide-react";

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  category: "faculty" | "counselor" | "leadership";
  categoryLabel: string;
  courseCoverageLabel?: string;
  experienceYears?: number | null;
  bio?: string | null;
  specializations: string[];
  assignedCourses: { id: string; title: string; slug: string }[];
  avatarUrl?: string | null;
  email?: string | null;
}

interface PublicTrainersViewProps {
  initialMembers: FacultyMember[];
}

export function PublicTrainersView({ initialMembers }: PublicTrainersViewProps) {
  const [activeTab, setActiveTab] = React.useState<"ALL" | "faculty" | "counselor" | "leadership">("faculty");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredMembers = React.useMemo(() => {
    return initialMembers.filter((member) => {
      // Category filter
      if (activeTab !== "ALL" && member.category !== activeTab) {
        return false;
      }

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesName = member.name.toLowerCase().includes(q);
        const matchesDesignation = member.designation.toLowerCase().includes(q);
        const matchesBio = member.bio?.toLowerCase().includes(q) || false;
        const matchesSkills = member.specializations.some((s) => s.toLowerCase().includes(q));
        const matchesCourses = member.assignedCourses.some((c) => c.title.toLowerCase().includes(q));

        if (!matchesName && !matchesDesignation && !matchesBio && !matchesSkills && !matchesCourses) {
          return false;
        }
      }

      return true;
    });
  }, [initialMembers, activeTab, searchQuery]);

  const stats = React.useMemo(() => {
    const totalTrainers = initialMembers.filter((m) => m.category === "faculty").length;
    const totalCounselors = initialMembers.filter((m) => m.category === "counselor").length;
    const totalLeadership = initialMembers.filter((m) => m.category === "leadership").length;

    return {
      total: initialMembers.length,
      trainers: totalTrainers,
      counselors: totalCounselors,
      leadership: totalLeadership,
    };
  }, [initialMembers]);

  return (
    <div className="flex flex-col space-y-10">
      {/* Category Pills & Real-time Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("faculty")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "faculty"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/20"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Faculty & Trainers ({stats.trainers})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Academic Team ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("counselor")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "counselor"
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-teal-50 text-teal-800 hover:bg-teal-100"
            }`}
          >
            Admissions & Counselors ({stats.counselors})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("leadership")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "leadership"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-blue-50 text-blue-800 hover:bg-blue-100"
            }`}
          >
            Leadership ({stats.leadership})
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search faculty or tech stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9 bg-slate-50 border-slate-200 rounded-xl focus:bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid of Faculty & Staff Cards */}
      {filteredMembers.length === 0 ? (
        <Card className="border-slate-200 max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-3">
            <Users className="h-12 w-12 text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">
              No Faculty Members Matching Query
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No faculty or staff matched your current filter criteria. Clear your search or contact our academic desk for custom assistance.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab("faculty");
                setSearchQuery("");
              }}
              className="text-xs"
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredMembers.map((member) => {
            const initials = member.name
              .replace(/^(Mr\.|Ms\.|Dr\.|Prof\.)\s+/i, "")
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            const isFaculty = member.category === "faculty";
            const isCounselor = member.category === "counselor";

            return (
              <Card
                key={member.id}
                className="flex flex-col justify-between border-slate-200 bg-white hover:border-emerald-400 hover:shadow-xl transition-all rounded-2xl overflow-hidden group border-2"
              >
                <div>
                  <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                  <CardHeader className="p-6 sm:p-7 pb-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {member.avatarUrl ? (
                        <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-emerald-500">
                          <Image
                            src={member.avatarUrl}
                            alt={member.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`flex h-16 w-16 items-center justify-center rounded-2xl text-white font-extrabold text-lg shadow-md shrink-0 ${
                            isFaculty
                              ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800"
                              : isCounselor
                              ? "bg-gradient-to-br from-teal-600 to-cyan-700"
                              : "bg-gradient-to-br from-slate-800 to-slate-950"
                          }`}
                        >
                          {initials || "SL"}
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {member.name}
                          </CardTitle>
                          <span title="Verified Institutional Faculty">
                            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                          </span>
                        </div>

                        {/* Title: Faculty / Trainer */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-0.5 shadow-sm"
                          >
                            {member.designation}
                          </Badge>

                          {typeof member.experienceYears === "number" && member.experienceYears > 0 && (
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                              {member.experienceYears}+ Years Experience
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Course Coverage Highlight Banner */}
                    {member.courseCoverageLabel && (
                      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                          <div className="text-xs">
                            <span className="text-slate-600 font-medium">Course coverage: </span>
                            <strong className="text-emerald-900 font-extrabold text-sm">
                              {member.courseCoverageLabel}
                            </strong>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-white text-emerald-800 font-bold border-emerald-300 text-[11px] shrink-0">
                          {member.assignedCourses.length} Programs
                        </Badge>
                      </div>
                    )}

                    {member.bio && (
                      <CardDescription className="text-xs text-slate-600 mt-4 leading-relaxed line-clamp-3">
                        {member.bio}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="p-6 sm:p-7 pt-0 space-y-5 text-xs">
                    {/* Specializations / Skills */}
                    {member.specializations.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">
                          Key Technical Competencies
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {member.specializations.map((spec) => (
                            <Badge
                              key={spec}
                              variant="secondary"
                              className="text-[11px] font-medium bg-slate-100/80 text-slate-800 border border-slate-200"
                            >
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assigned Courses List */}
                    {member.assignedCourses.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            {member.name.includes("Mayur")
                              ? "All 21 SOFTLAB GLOBAL Courses"
                              : "Courses (7 Core Programs)"}
                          </span>
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            {member.assignedCourses.length} Courses
                          </span>
                        </div>

                        {/* Interactive Course Box */}
                        <div className="max-h-56 overflow-y-auto pr-1.5 space-y-1.5 rounded-xl border border-slate-200/70 p-2 bg-slate-50/50">
                          {member.assignedCourses.map((c, idx) => (
                            <Link
                              key={`${c.slug}-${idx}`}
                              href={`/courses/${c.slug}`}
                              className="group/course flex items-center justify-between p-2 rounded-lg bg-white hover:bg-emerald-50 border border-slate-100 hover:border-emerald-300 transition-all text-xs shadow-2xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="h-5 w-5 rounded-md bg-emerald-100/70 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <BookOpen className="h-3.5 w-3.5 shrink-0 text-emerald-600 group-hover/course:scale-110 transition-transform" />
                                <span className="font-semibold text-slate-800 group-hover/course:text-emerald-800 truncate">
                                  {c.title}
                                </span>
                              </div>
                              <ArrowRight className="h-3 w-3 text-slate-400 group-hover/course:text-emerald-700 shrink-0 ml-2 group-hover/course:translate-x-0.5 transition-transform" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Footer Action */}
                <div className="p-4 sm:px-7 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Civil Lines Campus • Prayagraj</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openCareerCounselingModal(member.assignedCourses[0]?.title)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-4 rounded-lg shadow-sm gap-1.5"
                  >
                    <span>Book 1-on-1 Counseling</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
