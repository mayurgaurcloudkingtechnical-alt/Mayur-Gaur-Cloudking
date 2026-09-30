import * as React from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Building2,
  BookOpen,
  Globe2,
  ExternalLink,
  ChevronRight,
  BadgeCheck,
  GraduationCap,
  Cpu,
  Layers,
  FileCheck2,
  Compass,
  ArrowRight,
  PhoneCall,
  MapPin,
  Check,
} from "lucide-react";
import { DDU_CONFIG } from "@/config/university.config";

export const metadata: Metadata = {
  title: "Delaware Digital University (USA) — Global Certification | SoftLab Global",
  description:
    "SoftLab Global in partnership with Delaware Digital University (DDU, USA) provides globally accredited, verifiable skill certifications registered with the Delaware Department of State (Reg #7349298).",
};

export default function DelawareDigitalUniversityPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* 1. Hero Section - Deep Cyber Sapphire & Emerald */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#020b18] via-[#06152b] to-[#030a17] py-14 sm:py-20">
        {/* Glow Grids */}
        <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[450px] h-[350px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left 7 Columns: Authority & Value Proposition */}
            <div className="lg:col-span-7 space-y-5">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 via-sky-500/20 to-emerald-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span>USA Global Academic & Skill Partner • Reg #7349298</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Global Certification from{" "}
                <span className="bg-gradient-to-r from-sky-400 via-blue-300 to-emerald-400 bg-clip-text text-transparent">
                  Delaware Digital University
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl text-slate-300 font-extrabold mt-2">
                  State of Delaware, United States of America
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
                Empowering SoftLab Global graduates with internationally accredited skill certifications. Every qualifying technical cohort awards a cryptographically verifiable global credential registered under the Delaware Department of State.
              </p>

              {/* Authority Value Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sky-400 shadow-sm backdrop-blur-md">
                  <ShieldCheck className="h-4 w-4 text-sky-400" />
                  Delaware Dept. of State Reg: 7349298
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-400 shadow-sm backdrop-blur-md">
                  <Globe2 className="h-4 w-4 text-emerald-400" />
                  Global MNC Credential Recognition
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-amber-300 shadow-sm backdrop-blur-md">
                  <Award className="h-4 w-4 text-amber-400" />
                  Dual Diploma: SoftLab + DDU USA
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <a
                  href={DDU_CONFIG.portals.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-950/60 transition-all hover:scale-[1.02]"
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>Verify Credential (DDU)</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>

                <a
                  href={DDU_CONFIG.portals.adminDashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider shadow-md transition-all"
                >
                  <Building2 className="h-4 w-4 text-sky-400" />
                  <span>SoftLab Administration Portal</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>

                <a
                  href={DDU_CONFIG.portals.mainWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-all"
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  <span>Official DDU Website</span>
                </a>
              </div>
            </div>

            {/* Right 5 Columns: Official Credential Card */}
            <div className="lg:col-span-5 relative w-full">
              <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-blue-950/80 border-2 border-blue-500/40 shadow-2xl backdrop-blur-xl space-y-6">
                {/* Top Seal */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <GraduationCap className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono uppercase font-bold text-sky-400 tracking-wider block">
                        Official Academic Seal
                      </span>
                      <h3 className="text-base font-black text-white">
                        Delaware Digital University
                      </h3>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono">
                    USA
                  </span>
                </div>

                {/* Key Facts */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 font-medium">State Registration:</span>
                    <span className="font-mono font-bold text-sky-300">#7349298 (Delaware, USA)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 font-medium">Headquarters:</span>
                    <span className="font-semibold text-slate-200">The Green, Dover, DE 19901</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 font-medium">Certification Type:</span>
                    <span className="font-bold text-emerald-400">Global Technical Skill Credential</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 font-medium">Online Verification:</span>
                    <span className="font-bold text-amber-300">Official DDU QR & Verification Engine</span>
                  </div>
                </div>

                {/* Verification Quick Link */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-emerald-950/40 border border-blue-500/30 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-sky-300 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Direct SoftLab Administration Active</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Student batches and global certification records are directly administered via the dedicated SoftLab partner dashboard.
                  </p>
                  <a
                    href={DDU_CONFIG.portals.adminDashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 hover:underline pt-1"
                  >
                    <span>Open SoftLab Administration Desk</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Global Dual Certification Advantage */}
      <section className="py-16 sm:py-20 bg-slate-950 relative border-b border-slate-800/80">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-800/60 px-3.5 py-1.5 rounded-full inline-block">
              Dual Credential Advantage
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              One Rigorous Engineering Cohort.{" "}
              <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                Two High-Impact Credentials.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              When you enroll in any flagship technical program at SoftLab Global, your practical assessments and projects fulfill the curriculum standards of Delaware Digital University (USA).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Credential 1: SoftLab Global */}
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-8 space-y-5 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block font-mono">
                  Credential #1 • Industry Hands-On
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  SoftLab Global Engineering Diploma
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Demonstrates rigorous hands-on laboratory mastery, live project architecture, code reviews, and placement drive eligibility across 1,200+ partner tech companies.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>100% Practical Project Portfolio Verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>ISO 9001:2015 Certified Technical Delivery</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Direct Campus Placement & Hiring Partner Drives</span>
                </li>
              </ul>
            </div>

            {/* Credential 2: Delaware Digital University (USA) */}
            <div className="bg-slate-900/80 rounded-3xl border-2 border-blue-500/40 p-8 space-y-5 hover:border-blue-400 transition-colors relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-blue-950/40">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-sky-400">
                <Globe2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block font-mono">
                  Credential #2 • International Recognition
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Delaware Digital University (USA) Global Credential
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Registered under the Delaware Department of State (Reg #7349298). Gives your resume international credibility for remote global contracts, overseas hiring, and higher studies.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-sky-400 shrink-0" />
                  <span>Official Online Credential Verification at delawaredigitaluniversity.us</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-sky-400 shrink-0" />
                  <span>TVET (Skill Development) Aligned Curricular Standards</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-sky-400 shrink-0" />
                  <span>Direct SoftLab Administration Desk (skill.delawaredigitaluniversity.us)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DDU Academic Departments Matrix */}
      <section className="py-16 sm:py-20 bg-slate-950 relative border-b border-slate-800/80">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Departmental Coverage
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1">
                Delaware Digital University Academic Wings
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Programs aligned with Delaware Digital University's specialized academic departments:
              </p>
            </div>
            <a
              href={DDU_CONFIG.portals.tvetSkillUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300"
            >
              <span>Explore TVET (Skill) Division</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Future Technology",
                color: "border-sky-500/40 text-sky-400 bg-sky-950/20",
                topics: "AI & Machine Learning, Generative AI, Cloud Computing, Cyber Security, Blockchain Architecture",
                icon: Cpu,
              },
              {
                title: "Science & Engineering",
                color: "border-emerald-500/40 text-emerald-400 bg-emerald-950/20",
                topics: "Full Stack Software Engineering, Python, Modern C++, Enterprise Java, DevOps & SRE",
                icon: Layers,
              },
              {
                title: "Business & Management",
                color: "border-amber-500/40 text-amber-300 bg-amber-950/20",
                topics: "IT Project Management, Digital Marketing, Data Analytics, Strategic Corporate IT Consulting",
                icon: Building2,
              },
              {
                title: "TVET (Skill Development)",
                color: "border-purple-500/40 text-purple-400 bg-purple-950/20",
                topics: "Hands-on Technical Vocation, Production Code Testing, Server Administration, Advanced Networking",
                icon: GraduationCap,
              },
              {
                title: "Education & Research",
                color: "border-blue-500/40 text-blue-400 bg-blue-950/20",
                topics: "Applied Computing Research, Pedagogy in Digital Learning, Corporate Skill Frameworks",
                icon: BookOpen,
              },
              {
                title: "Health Sciences & Analytics",
                color: "border-teal-500/40 text-teal-300 bg-teal-950/20",
                topics: "Bioinformatics Analytics, Health Informatics, Digital Health Record Governance",
                icon: Award,
              },
            ].map((dept) => {
              const Icon = dept.icon;
              return (
                <div
                  key={dept.title}
                  className={`rounded-2xl border p-6 space-y-3 transition-all hover:scale-[1.02] ${dept.color}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <h3 className="font-bold text-base text-white">{dept.title}</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {dept.topics}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Verification Workflow Step-by-Step */}
      <section className="py-16 sm:py-20 bg-slate-950 relative border-b border-slate-800/80">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
              Verifiable Trust
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              How Employers Verify Your Global Credential
            </h2>
            <p className="text-sm text-slate-400">
              Zero ambiguity. Instant global authentication in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-white text-base">Course Completion & Evaluation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Complete your SoftLab technical curriculum, submit the enterprise capstone project, and achieve passing criteria in module evaluations.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
              <span className="w-8 h-8 rounded-full bg-sky-600 text-white font-black text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-white text-base">SoftLab Administration Registry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Academic records are submitted through the SoftLab Administration desk (skill.delawaredigitaluniversity.us) for official Delaware issuance.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-white text-base">Global Public Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Employers worldwide can enter your certificate ID directly at delawaredigitaluniversity.us/verify to view tamper-proof authenticity.
              </p>
            </div>
          </div>

          {/* Direct CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/60 transition-all hover:scale-105"
            >
              <span>Explore Programs with DDU USA Certification</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Institutional Disclaimer & Statutory Footnote */}
      <section className="py-10 bg-slate-950 border-t border-slate-900 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3">
          <p className="leading-relaxed">
            <strong className="text-slate-300">Statutory & Academic Disclaimer:</strong> Delaware Digital University is registered with the Delaware Department of State with registration number 7349298 as a non-profit educational institution in the State of Delaware, United States of America. SoftLab Global delivers technical and vocational engineering education aligned with DDU skill standards. Global credentials and skill certificates are conferred through official institutional processes.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2 text-[11px] text-slate-500 font-medium">
            <span>Delaware Reg #: <strong>7349298</strong></span>
            <span>Location: <strong>The Green, City of Dover, Delaware 19901, USA</strong></span>
            <span>Phone: <strong>+1 302 2138121</strong></span>
            <span>Verification: <strong>delawaredigitaluniversity.us/verify/</strong></span>
          </div>
        </div>
      </section>
    </div>
  );
}
