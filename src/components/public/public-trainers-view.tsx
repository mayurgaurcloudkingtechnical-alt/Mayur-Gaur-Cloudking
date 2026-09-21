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
} from "lucide-react";

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  category: "faculty" | "counselor" | "leadership";
  categoryLabel: string;
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
  const [activeTab, setActiveTab] = React.useState<"ALL" | "faculty" | "counselor" | "leadership">("ALL");
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
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Team ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("faculty")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "faculty"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            Faculty & Instructors ({stats.trainers})
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
              No Staff Members Matching Query
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No faculty or staff matched your current filter criteria. Clear your search or contact our academic desk for custom assistance.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab("ALL");
                setSearchQuery("");
              }}
              className="text-xs"
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const initials = member.name
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
                className="flex flex-col justify-between border-slate-200 bg-white hover:border-emerald-400 hover:shadow-lg transition-all rounded-2xl overflow-hidden group"
              >
                <div>
                  <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {member.avatarUrl ? (
                        <div className="relative h-14 w-14 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-slate-200">
                          <Image
                            src={member.avatarUrl}
                            alt={member.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white font-extrabold text-base shadow-sm shrink-0 ${
                            isFaculty
                              ? "bg-gradient-to-br from-emerald-600 to-teal-700"
                              : isCounselor
                              ? "bg-gradient-to-br from-teal-600 to-cyan-700"
                              : "bg-gradient-to-br from-slate-800 to-slate-950"
                          }`}
                        >
                          {initials || "SL"}
                        </div>
                      )}

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <CardTitle className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            {member.name}
                          </CardTitle>
                          <span title="Verified Institutional Staff">
                            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {member.designation}
                        </p>

                        <div className="flex items-center gap-2 pt-0.5">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] uppercase font-bold py-0.5 px-2 ${
                              isFaculty
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : isCounselor
                                ? "bg-teal-50 text-teal-800 border-teal-200"
                                : "bg-slate-100 text-slate-800 border-slate-200"
                            }`}
                          >
                            {member.categoryLabel}
                          </Badge>

                          {typeof member.experienceYears === "number" && member.experienceYears > 0 && (
                            <span className="text-[11px] font-medium text-emerald-700">
                              {member.experienceYears}+ Yrs Exp
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {member.bio && (
                      <CardDescription className="text-xs text-slate-600 mt-4 leading-relaxed line-clamp-3">
                        {member.bio}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="p-6 pt-0 space-y-4 text-xs">
                    {/* Specializations / Skills */}
                    {member.specializations.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">
                          Key Expertise & Stack
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {member.specializations.map((spec) => (
                            <Badge
                              key={spec}
                              variant="secondary"
                              className="text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200/80"
                            >
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assigned Courses */}
                    {member.assignedCourses.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">
                          Active Training Tracks
                        </span>
                        <ul className="space-y-1.5">
                          {member.assignedCourses.map((c) => (
                            <li key={c.id}>
                              <Link
                                href={`/courses/${c.slug}`}
                                className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1.5 font-semibold transition-colors"
                              >
                                <BookOpen className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                <span className="line-clamp-1">{c.title}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Civil Lines Campus
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => openCareerCounselingModal(member.assignedCourses[0]?.title)}
                    className="text-xs text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold h-8 px-2.5 gap-1"
                  >
                    <span>Connect</span>
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
