"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  GraduationCap,
  Award,
  Users,
  Code,
  Laptop,
  Terminal,
  Globe,
  Share2,
  HelpCircle,
  PhoneCall,
  Check,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { EventRegistrationDialog } from "./event-registration-dialog";
import { EventEnquiryDialog } from "./event-enquiry-dialog";

interface EventItem {
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
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  startTime?: string | null;
  endTime?: string | null;
  venue: string;
  mode: string;
  seatCapacity: number;
  registeredCount: number;
  eligibility?: string | null;
  learningOutcomes?: string[];
  benefits?: string[];
  syllabus?: any;
  status: string;
  year: number;
  month: number;
  isFeatured: boolean;
}

interface EventsHubViewProps {
  initialEvents: EventItem[];
  archiveYears: number[];
}

const PROGRAM_FILTERS = [
  { id: "ALL", label: "All Programs" },
  { id: "SHORT_TERM_COURSE", label: "Short-Term Courses" },
  { id: "WORKSHOP", label: "Workshops" },
  { id: "WINTER_INTERNSHIP", label: "Winter Internship" },
  { id: "SUMMER_INTERNSHIP", label: "Summer Internship" },
];

const SHORT_TERM_TRACKS = [
  { name: "Python Programming", category: "Programming", icon: Code, desc: "OOP, Automation, Scripting & Libraries" },
  { name: "Java Programming", category: "Programming", icon: Terminal, desc: "Core Java, Collections & Multi-threading" },
  { name: "MERN Stack Development", category: "Programming", icon: Laptop, desc: "MongoDB, Express, React, Node.js" },
  { name: "Python Full Stack", category: "Programming", icon: Code, desc: "Django/FastAPI + Modern Web Frontend" },
  { name: "Java Full Stack", category: "Programming", icon: Terminal, desc: "Spring Boot + Microservices + React" },
  { name: "Website Designing", category: "Vocational", icon: Globe, desc: "HTML5, CSS3, Tailwind, UI/UX Essentials" },
  { name: "Graphic Designing", category: "Vocational", icon: Sparkles, desc: "Photoshop, Illustrator, Brand Kits & Canva" },
  { name: "Digital Marketing", category: "Vocational", icon: Globe, desc: "SEO, Meta Ads, Google Ads & Content Strategy" },
  { name: "Microsoft 365 Admin", category: "Vocational", icon: Laptop, desc: "Exchange, Teams, Entra ID & SharePoint" },
  { name: "Google Workspace Admin", category: "Vocational", icon: Globe, desc: "Domain Config, Workspace Security & Audit" },
  { name: "Networking & CCNA", category: "Advanced IT", icon: Terminal, desc: "Routing, Switching, IP Subnetting & Labs" },
  { name: "Cloud & DevOps", category: "Advanced IT", icon: Laptop, desc: "AWS, Docker, CI/CD, Linux Server Admin" },
  { name: "Cyber Security", category: "Advanced IT", icon: ShieldCheck, desc: "Ethical Hacking, OWASP & Threat Analysis" },
  { name: "AI & Machine Learning", category: "Advanced IT", icon: Sparkles, desc: "Neural Networks, LLMs, NLP & Automation" },
  { name: "Data Science", category: "Advanced IT", icon: Code, desc: "Pandas, NumPy, EDA & Business Analytics" },
];

const FAQS = [
  {
    q: "Who is eligible to participate in SoftLab Global short-term courses and internships?",
    a: "Our programs are open to 10th/12th students, BCA, MCA, B.Tech, B.Sc (IT/CS), diploma holders, fresh graduates, and working professionals seeking career pivots or verifiable hands-on industry skills."
  },
  {
    q: "Are the internship certificates recognized for college university credit?",
    a: "Yes! Every SoftLab Global internship and course completion certificate carries an institutional registration code, cryptographic verification token, and QR code that can be verified online at https://softlabglobal.com/verify."
  },
  {
    q: "Can I attend these programs online if I live outside Prayagraj?",
    a: "Absolutely. All programs support Hybrid delivery. You can attend in-person at our Prayagraj campus or join interactive live online classes with full lab sandbox access."
  },
  {
    q: "How does the registration and payment work?",
    a: "You can register directly online through our secure Razorpay gateway using UPI, Cards, Net Banking, or visit our Admissions Desk at Civil Lines, Prayagraj."
  },
  {
    q: "What is the policy for the AI & Cyber Security Workshop?",
    a: "The workshop is currently configured with draft/preview syllabus (₹799 fee). Full date confirmation and bookings will open upon final institutional administrative scheduling."
  }
];

export function EventsHubView({ initialEvents, archiveYears }: EventsHubViewProps) {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<number | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");

  // Dialog States
  const [selectedEventForReg, setSelectedEventForReg] = useState<EventItem | null>(null);
  const [regDialogOpen, setRegDialogOpen] = useState<boolean>(false);
  const [selectedEventForEnq, setSelectedEventForEnq] = useState<EventItem | null>(null);
  const [enqDialogOpen, setEnqDialogOpen] = useState<boolean>(false);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return initialEvents.filter((evt) => {
      // Program type filter
      if (selectedType !== "ALL" && evt.programType !== selectedType) {
        return false;
      }
      // Year filter
      if (selectedYear !== "ALL" && evt.year !== selectedYear) {
        return false;
      }
      // Status filter
      if (statusFilter === "UPCOMING" && evt.status === "COMPLETED") {
        return false;
      }
      if (statusFilter === "PAST" && evt.status !== "COMPLETED") {
        return false;
      }
      // Search query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(query);
        const matchCategory = evt.category.toLowerCase().includes(query);
        const matchSummary = evt.summary.toLowerCase().includes(query);
        if (!matchTitle && !matchCategory && !matchSummary) {
          return false;
        }
      }
      return true;
    });
  }, [initialEvents, selectedType, selectedYear, searchQuery, statusFilter]);

  // Featured Event
  const featuredEvent = useMemo(() => {
    return initialEvents.find((e) => e.isFeatured) || initialEvents[0] || null;
  }, [initialEvents]);

  const handleOpenRegistration = (evt: EventItem) => {
    setSelectedEventForReg(evt);
    setRegDialogOpen(true);
  };

  const handleOpenEnquiry = (evt: EventItem) => {
    setSelectedEventForEnq(evt);
    setEnqDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* ==================================================================== */}
      {/* 1. HERO BANNER & FEATURED PROGRAM SHOWCASE                           */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-semibold text-emerald-400 shadow-inner">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              <span>Official Institutional Events & Programs Hub</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Empower Your Tech Career With{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Practical Learning
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Explore hands-on Short-Term Skill Courses, immersive AI & Cyber Security Workshops, and verified Winter/Summer Internships at SoftLab Global.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => {
                  const el = document.getElementById("events-catalog");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 px-6 shadow-xl shadow-emerald-950/70"
              >
                <span>Browse All Programs</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  if (featuredEvent) handleOpenEnquiry(featuredEvent);
                }}
                className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 h-11 px-5"
              >
                <PhoneCall className="h-4 w-4 mr-2 text-emerald-400" />
                <span>Request Free Academic Counseling</span>
              </Button>
            </div>
          </div>

          {/* Featured Highlight Card */}
          {featuredEvent && (
            <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden relative group">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-emerald-500 text-slate-950 font-bold px-3 py-1 text-xs">
                      FEATURED PROGRAM
                    </Badge>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-xs">
                      {featuredEvent.programType.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline" className="text-cyan-400 border-cyan-500/40 text-xs">
                      {featuredEvent.mode}
                    </Badge>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                    {featuredEvent.title}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {featuredEvent.summary}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        Fee
                      </div>
                      <div className="text-lg font-black text-emerald-400 mt-0.5">
                        ₹{(featuredEvent.fee / 100).toLocaleString("en-IN")}
                      </div>
                      {featuredEvent.originalFee && (
                        <div className="text-[11px] text-slate-500 line-through">
                          ₹{(featuredEvent.originalFee / 100).toLocaleString("en-IN")}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        Duration
                      </div>
                      <div className="text-sm font-bold text-slate-200 mt-1">
                        {featuredEvent.duration}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 col-span-2 sm:col-span-1">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        Certification
                      </div>
                      <div className="text-sm font-bold text-slate-200 mt-1 flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>QR-Verifiable</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3">
                    <Button
                      asChild
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 px-5 shadow-lg shadow-emerald-950/60"
                    >
                      <Link href={`/events/${featuredEvent.slug}`}>
                        <span>View Syllabus & Details</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>

                    <Button
                      onClick={() => handleOpenRegistration(featuredEvent)}
                      variant="outline"
                      className="border-emerald-500/50 hover:bg-emerald-950/50 text-emerald-300 font-bold h-11 px-5"
                    >
                      <span>Enroll / Quick Book</span>
                    </Button>
                  </div>
                </div>

                <div className="lg:col-span-5 relative">
                  <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group-hover:border-emerald-500/40 transition-all">
                    <Image
                      src={featuredEvent.bannerUrl || "/images/events/short-term-courses-banner.jpg"}
                      alt={featuredEvent.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. PROGRAM CATEGORY SELECTORS & SEARCH FILTERS                       */}
      {/* ==================================================================== */}
      <section id="events-catalog" className="py-12 border-b border-slate-800/80 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Explore Programs & Events
              </h2>
              <p className="text-sm text-slate-400">
                Filter by program format, year archive, or search by technical keyword.
              </p>
            </div>

            {/* Quick Status Toggle */}
            <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/80 p-1">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "ALL"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All Events
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("UPCOMING")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "UPCOMING"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Upcoming & Open
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PAST")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "PAST"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Completed Archive
              </button>
            </div>
          </div>

          {/* Filter Bar Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search */}
            <div className="sm:col-span-6 lg:col-span-5 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by course name, topic, or technology..."
                className="pl-10 h-10 bg-slate-900/90 border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 rounded-xl"
              />
            </div>

            {/* Program Type Tabs */}
            <div className="sm:col-span-6 lg:col-span-5 overflow-x-auto flex items-center gap-1.5 py-1">
              {PROGRAM_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedType(f.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedType === f.id
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                      : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Year Archive Filter */}
            <div className="sm:col-span-12 lg:col-span-2 flex items-center justify-end">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
                className="w-full h-10 bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 rounded-xl focus:border-emerald-500 focus:outline-none"
              >
                <option value="ALL">All Years</option>
                {archiveYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* 3. EVENT CARDS GRID                                                  */}
          {/* ==================================================================== */}
          {filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center space-y-3">
              <HelpCircle className="h-10 w-10 text-slate-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Programs Matched Your Filters</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try clearing your search query or switching to All Programs to view upcoming and archived sessions.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedType("ALL");
                  setSelectedYear("ALL");
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="border-slate-700 text-slate-300 hover:text-white"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((evt) => {
                const feeInr = Math.round(evt.fee / 100);
                const originalFeeInr = evt.originalFee ? Math.round(evt.originalFee / 100) : null;
                const percentBooked = Math.min(100, Math.round((evt.registeredCount / evt.seatCapacity) * 100));

                return (
                  <div
                    key={evt.id}
                    className="flex flex-col rounded-2xl border border-slate-800/90 bg-slate-900/70 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/20 transition-all overflow-hidden group"
                  >
                    {/* Event Banner / Poster */}
                    <Link href={`/events/${evt.slug}`} className="relative aspect-[16/9] w-full overflow-hidden block bg-slate-950">
                      <Image
                        src={evt.posterUrl || evt.bannerUrl || "/images/events/short-term-courses-banner.jpg"}
                        alt={evt.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <Badge className="bg-slate-950/80 text-emerald-400 border border-emerald-500/40 backdrop-blur text-[11px] font-semibold">
                          {evt.programType.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="absolute top-3 right-3">
                        <Badge
                          className={`text-[11px] font-bold ${
                            evt.status === "REGISTRATION_OPEN"
                              ? "bg-emerald-500 text-slate-950"
                              : evt.status === "COMPLETED"
                              ? "bg-slate-700 text-slate-200"
                              : "bg-amber-500 text-slate-950"
                          }`}
                        >
                          {evt.status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-slate-300">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{evt.duration}</span>
                        </div>
                        <div className="flex items-center gap-1 font-medium text-cyan-300">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{evt.mode}</span>
                        </div>
                      </div>
                    </Link>

                    {/* Card Body */}
                    <div className="flex flex-col flex-1 p-5 space-y-3.5">
                      <div className="space-y-1">
                        <div className="text-[11px] uppercase tracking-wider text-emerald-400/90 font-bold">
                          {evt.category}
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                          <Link href={`/events/${evt.slug}`}>{evt.title}</Link>
                        </h3>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {evt.summary}
                      </p>

                      {/* Seat counter bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Seats Booked</span>
                          <span className="font-semibold text-slate-300">
                            {evt.registeredCount} / {evt.seatCapacity} seats
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${percentBooked}%` }}
                          />
                        </div>
                      </div>

                      {/* Pricing and Action */}
                      <div className="pt-3 mt-auto border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-slate-400">
                            Program Fee
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-emerald-400">
                              {feeInr > 0 ? `₹${feeInr.toLocaleString("en-IN")}` : "Free"}
                            </span>
                            {originalFeeInr && originalFeeInr > feeInr && (
                              <span className="text-xs line-through text-slate-500">
                                ₹{originalFeeInr.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="text-xs text-slate-300 hover:text-white h-9 px-3"
                          >
                            <Link href={`/events/${evt.slug}`}>Details</Link>
                          </Button>

                          {evt.status === "REGISTRATION_OPEN" ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenRegistration(evt)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-3 shadow-md shadow-emerald-950/60"
                            >
                              Enroll Now
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleOpenEnquiry(evt)}
                              variant="outline"
                              className="border-slate-700 text-slate-300 hover:text-white text-xs h-9 px-3"
                            >
                              Enquire
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. SHOWCASE: SHORT-TERM COURSES (14 CATEGORIES)                      */}
      {/* ==================================================================== */}
      <section className="py-16 border-b border-slate-800/80 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              Fast-Track Career Acceleration
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Short-Term Skill Development & Vocational Courses
            </h2>
            <p className="text-sm text-slate-300">
              Complete industry-ready skill tracks in just 30–45 Days for ₹4,999 with 100% lab access and verified certification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SHORT_TERM_TRACKS.map((t, idx) => {
              const IconComp = t.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 hover:border-emerald-500/50 transition-all flex items-start gap-3.5"
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{t.name}</h4>
                      <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700 py-0 px-1.5">
                        {t.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 px-8 shadow-lg shadow-emerald-950/60"
            >
              <Link href="/events/short-term-skill-development-courses">
                <span>View Complete Short-Term Courses Syllabus & Schedule</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. SHOWCASE: AI & CYBER SECURITY WORKSHOP (DRAFT / PREVIEW)          */}
      {/* ==================================================================== */}
      <section className="py-16 border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 relative aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <Image
                src="/images/events/ai-cyber-security-workshop-poster.jpg"
                alt="AI & Cyber Security Workshop"
                fill
                className="object-cover"
              />
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-semibold">
                  Preview / Institutional Notice
                </Badge>
                <Badge variant="outline" className="text-slate-400 border-slate-700 text-xs">
                  One-Day Intensive Workshop
                </Badge>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                One-Day AI & Cyber Security Workshop
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Explore the frontiers of Artificial Intelligence and Modern Cyber Defense. Featuring live threat exploitation demos, AI workflow automation, ethical hacking sandboxes, and career guidance.
              </p>

              <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-xs text-amber-200/90 space-y-1">
                <div className="font-semibold text-amber-300">Institutional Scheduling Notice:</div>
                <p>
                  The workshop fee is configured at <strong>₹799</strong>. Per institutional administrative governance, the exact session date and public registration will unlock upon final Admin authorization. You can register your early interest below to reserve priority waitlist access.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Introduction to Neural AI & Prompting</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Live Threat Vectors & Defense Labs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Hands-on Practical Attack Simulations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Official Workshop Participation Certificate</span>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  onClick={() => {
                    const ws = initialEvents.find((e) => e.programType === "WORKSHOP");
                    if (ws) handleOpenEnquiry(ws);
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold h-11 px-6 shadow-lg shadow-amber-950/60"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span>Join Early Waitlist / Enquire Now</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. SHOWCASE: TECHNICAL INTERNSHIPS (WINTER & SUMMER)                 */}
      {/* ==================================================================== */}
      <section className="py-16 border-b border-slate-800/80 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
              Academic & Professional Training
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Winter & Summer Internship Programs
            </h2>
            <p className="text-sm text-slate-300">
              Work on live production codebases, deploy cloud apps, and receive verifiable university internship credits with official LORs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Winter Internship Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-800">
                  <Image
                    src="/images/events/winter-internship-banner.jpg"
                    alt="Winter Internship"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-cyan-500 text-slate-950 font-bold">1 Month Duration</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-emerald-500 text-slate-950 font-bold">₹999 Only</Badge>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white">Winter Internship Program 2026</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Bridge the gap between college coursework and enterprise software engineering. Work on full-stack web and cloud systems with daily standups and code reviews.
                </p>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Hands-on Technical Training on Real Industry Code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Internship Completion Certificate with QR Code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Letter of Recommendation (LOR) for Top Performers</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  asChild
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-11"
                >
                  <Link href="/events/winter-internship-program-2026">View Program Details</Link>
                </Button>
                <Button
                  onClick={() => {
                    const wi = initialEvents.find((e) => e.programType === "WINTER_INTERNSHIP");
                    if (wi) handleOpenRegistration(wi);
                  }}
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-300 font-bold h-11 px-5"
                >
                  Book Seat (₹999)
                </Button>
              </div>
            </div>

            {/* Summer Internship Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-800">
                  <Image
                    src="/images/events/summer-internship-banner.jpg"
                    alt="Summer Internship"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-amber-500 text-slate-950 font-bold">2 Months Intensive</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-emerald-500 text-slate-950 font-bold">₹2,499</Badge>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white">Summer Internship Program 2027</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Make your summer break count! Full lifecycle software engineering immersion covering architecture, CI/CD, microservices, and client capstones.
                </p>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>End-to-End Enterprise Software Capstone Deployment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Official 2-Month Verified Certificate for Academic Credits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Direct Referral to 1,200+ Corporate Hiring Partners</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  asChild
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11"
                >
                  <Link href="/events/summer-internship-program">View Program Details</Link>
                </Button>
                <Button
                  onClick={() => {
                    const si = initialEvents.find((e) => e.programType === "SUMMER_INTERNSHIP");
                    if (si) handleOpenRegistration(si);
                  }}
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-300 font-bold h-11 px-5"
                >
                  Book Seat (₹2,499)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. VERIFIED CERTIFICATES & QR CODE HIGHLIGHTS                        */}
      {/* ==================================================================== */}
      <section className="py-16 border-b border-slate-800/80 bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                Tamper-Proof Verification
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Authentic, Globally Verifiable Certificates
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Every certificate issued for our short-term skill courses, workshops, and technical internships is cryptographically signed and verifiable 24/7 on our public verification portal. Employers, universities, and visa authorities can instantly validate student credentials.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-emerald-400" />
                    <span>Unique Certificate Number</span>
                  </div>
                  <p className="text-slate-400">e.g. SLG-CERT-2026-XXXXX assigned to every graduate.</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-cyan-400" />
                    <span>Instant QR Verification</span>
                  </div>
                  <p className="text-slate-400">Scan via any smartphone camera for real-time validation.</p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  asChild
                  variant="outline"
                  className="border-slate-700 bg-slate-900 text-slate-200 hover:text-white"
                >
                  <Link href="/verify" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2 text-emerald-400" />
                    <span>Open Public Certificate Verification Engine</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="text-xs font-bold text-slate-300">Sample Credential Preview</div>
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">STATUS: VALID</Badge>
              </div>

              <div className="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-950/10 p-5 text-center space-y-2">
                <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                  SoftLab Global Academic Directorate
                </div>
                <div className="text-lg font-bold text-white">Certificate of Completion</div>
                <p className="text-xs text-slate-300">
                  Awarded for successfully completing the <strong>Short-Term Vocational Track</strong> with distinction.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-mono text-emerald-400">
                  <span>ID: SLG-CERT-2026-08421</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. FREQUENTLY ASKED QUESTIONS (FAQ) ACCORDION                        */}
      {/* ==================================================================== */}
      <section className="py-16 border-b border-slate-800/80 bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <Badge className="bg-slate-800 text-slate-300 text-xs">Got Questions?</Badge>
            <h2 className="text-3xl font-black text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-400">Everything you need to know about our events, courses, and admissions.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all [&_summary::-webkit-details-marker]:hidden"
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
      </section>

      {/* ==================================================================== */}
      {/* 9. BOTTOM REGISTRATION & COUNSELING CTA BANNER                       */}
      {/* ==================================================================== */}
      <section className="py-16 bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Accelerate Your Technical Journey?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Speak directly with our academic mentors, discuss syllabus tracks, or visit our state-of-the-art campus in Civil Lines, Prayagraj.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              size="lg"
              onClick={() => {
                const el = document.getElementById("events-catalog");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-8 shadow-xl shadow-emerald-950/70"
            >
              <span>Explore All Programs</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 h-12 px-6"
            >
              <Link href="/contact">
                <MapPin className="h-4 w-4 mr-2 text-emerald-400" />
                <span>Visit Prayagraj Campus</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Reusable Registration Dialog */}
      <EventRegistrationDialog
        event={selectedEventForReg}
        open={regDialogOpen}
        onOpenChange={setRegDialogOpen}
      />

      {/* Reusable Enquiry Dialog */}
      <EventEnquiryDialog
        event={selectedEventForEnq}
        open={enqDialogOpen}
        onOpenChange={setEnqDialogOpen}
      />
    </div>
  );
}
