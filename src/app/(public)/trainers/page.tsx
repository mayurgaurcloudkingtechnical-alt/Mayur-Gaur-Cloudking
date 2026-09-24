import * as React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { ContentStatus, UserStatus, UserRoleCode } from "@prisma/client";
import { PublicTrainersView, FacultyMember } from "@/components/public/public-trainers-view";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, GraduationCap, Users, ShieldCheck, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Faculty, Mentors & Academic Staff — SOFTLAB GLOBAL",
  description:
    "Meet our distinguished instructors Mr. Mayur Gaur and Mr. Nihal Singh leading all 21 IT engineering and infrastructure courses at SOFTLAB GLOBAL.",
};

export default async function TrainersPage() {
  // 1. Fetch published courses dynamically from DB
  const dbCourses = await db.course.findMany({
    where: {
      deletedAt: null,
      status: { in: [ContentStatus.PUBLISHED, ContentStatus.DRAFT] },
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });

  // Authoritative 21 SOFTLAB GLOBAL Courses list
  const all21OfficialCourses = [
    { title: "Technical Support Engineer", slug: "technical-support-engineer" },
    { title: "C++ Programming Complete Course (Basic To Advanced)", slug: "cpp-programming-complete-course" },
    { title: "MySQL Advanced Course (Beginner To Expert)", slug: "mysql-advanced-course" },
    { title: "Digital Marketing Master Class", slug: "digital-marketing-master-class" },
    { title: "Java Full Stack Developer", slug: "java-full-stack-developer" },
    { title: "Python Full Stack Developer", slug: "python-full-stack-developer" },
    { title: "Full Web Development", slug: "full-web-development" },
    { title: "Graphics Designing Master Level", slug: "graphics-designing-master-level" },
    { title: "Cyber Security Complete Course", slug: "cyber-security-complete-course" },
    { title: "Oracle Database Administration (DBA) with Oracle Cloud Integration", slug: "oracle-database-administration-dba" },
    { title: "Data Science Master Level", slug: "data-science-master-level" },
    { title: "MERN Full Stack Developer", slug: "mern-full-stack-developer" },
    { title: "Master in Artificial Intelligence and Machine Learning", slug: "master-in-artificial-intelligence-and-machine-learning" },
    { title: "Certificate in Cloud Computing and Cyber Security With AI", slug: "certificate-in-cloud-computing-and-cyber-security-with-ai" },
    { title: "Certificate in Cloud Computing With DevOps", slug: "certificate-in-cloud-computing-with-devops" },
    { title: "Certificate in Advance Networking", slug: "certificate-in-advance-networking" },
    { title: "Master in Cloud Administration", slug: "master-in-cloud-administration" },
    { title: "Master in Linux Administration", slug: "master-in-linux-administration" },
    { title: "Master in Server Administration", slug: "master-in-server-administration" },
    { title: "Certificate in Office 365 Admin", slug: "certificate-in-office-365-admin" },
    { title: "Certificate in C Language", slug: "certificate-in-c-language" },
  ];

  // Resolve 21 courses with live DB records
  const resolved21Courses = all21OfficialCourses.map((c) => {
    const match = dbCourses.find(
      (dbC) => dbC.slug === c.slug || dbC.title.toLowerCase() === c.title.toLowerCase()
    );
    return {
      id: match?.id || c.slug,
      title: match?.title || c.title,
      slug: match?.slug || c.slug,
    };
  });

  // 7 Courses for Mr. Nihal Singh
  const nihalCoursesSpec = [
    { title: "Linux Administration", slug: "master-in-linux-administration" },
    { title: "Networking", slug: "certificate-in-advance-networking" },
    { title: "Microsoft 365 Administration", slug: "certificate-in-office-365-admin" },
    { title: "Server Administration", slug: "master-in-server-administration" },
    { title: "Cloud Administration", slug: "master-in-cloud-administration" },
    { title: "Certificate in Cloud Computing", slug: "certificate-in-cloud-computing-with-devops" },
    { title: "Cyber Security", slug: "cyber-security-complete-course" },
  ];

  const resolvedNihalCourses = nihalCoursesSpec.map((item) => {
    const match = dbCourses.find(
      (dbC) => dbC.slug === item.slug || dbC.title.toLowerCase().includes(item.title.toLowerCase())
    );
    return {
      id: match?.id || item.slug,
      title: item.title,
      slug: match?.slug || item.slug,
    };
  });

  // Primary Faculty presentation
  const mayurGaurMember: FacultyMember = {
    id: "faculty-mayur-gaur",
    name: "Mr. Mayur Gaur",
    designation: "Faculty / Trainer",
    category: "faculty",
    categoryLabel: "Faculty / Trainer",
    courseCoverageLabel: "All 21 SOFTLAB GLOBAL Courses",
    experienceYears: 11,
    experienceBadgeLabel: "11+ Years Experience • Leadership & Entrepreneur",
    bio: "Distinguished Technology Leader & Entrepreneur with 11+ years of experience spearheading enterprise software development, technology leadership, and IT education. Leads all 21 SOFTLAB GLOBAL courses, mentoring students and future engineers across full stack software engineering, cloud & DevOps architectures, distributed systems, and AI technologies.",
    specializations: [
      "All 21 SOFTLAB GLOBAL Courses",
      "11+ Years Technology Leadership & Strategy",
      "Entrepreneurship & Startup Engineering",
      "Full Stack Software Architecture",
      "Cloud, DevOps & Distributed Systems",
      "AI & Machine Learning Systems",
    ],
    assignedCourses: resolved21Courses,
    avatarUrl: null,
    email: "mayur.gaur@softlabglobal.com",
  };

  const nihalSinghMember: FacultyMember = {
    id: "faculty-nihal-singh",
    name: "Mr. Nihal Singh",
    designation: "Faculty / Trainer",
    category: "faculty",
    categoryLabel: "Faculty / Trainer",
    courseCoverageLabel: "7 Core Infrastructure & Cloud Programs",
    experienceYears: 8,
    bio: "Senior Infrastructure & Cyber Defense Faculty delivering enterprise-level practical education in Linux Administration, Enterprise Networking, Microsoft 365 Administration, Server Administration, Multi-Cloud Infrastructure, and Cybersecurity.",
    specializations: [
      "Linux Administration",
      "Networking",
      "Microsoft 365 Administration",
      "Server Administration",
      "Cloud Administration",
      "Certificate in Cloud Computing",
      "Cyber Security",
    ],
    assignedCourses: resolvedNihalCourses,
    avatarUrl: null,
    email: "nihal.singh@softlabglobal.com",
  };

  // Fetch counselors and active staff from DB for support tabs
  const staff = await db.staffProfile.findMany({
    where: {
      isActive: true,
      user: {
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          roleCode: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const staffMembers: FacultyMember[] = staff
    .filter((s) => !s.user.firstName.toLowerCase().includes("mayur") && !s.user.firstName.toLowerCase().includes("nihal"))
    .map((s) => {
      const isCounseling =
        s.department === "COUNSELING" ||
        s.department === "OPERATIONS" ||
        s.designation.toLowerCase().includes("counselor") ||
        s.user.roleCode === UserRoleCode.COUNSELOR;

      const isLeadership =
        s.department === "MANAGEMENT" ||
        s.user.roleCode === UserRoleCode.DIRECTOR ||
        s.user.roleCode === UserRoleCode.SUPER_ADMIN ||
        s.user.roleCode === UserRoleCode.ADMIN;

      return {
        id: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        designation: s.designation || "Academic Operations & Counseling",
        category: isLeadership ? "leadership" : isCounseling ? "counselor" : "faculty",
        categoryLabel: isLeadership ? "Leadership" : isCounseling ? "Career Counselor" : "Academic Staff",
        experienceYears: 3,
        bio: `Dedicated academic team member ensuring student success and rigorous learning support at SoftLab Global (${s.department}).`,
        specializations: s.skills.length > 0 ? s.skills : ["Student Mentorship", "Career Counseling", "Academic Guidance"],
        assignedCourses: [],
        avatarUrl: s.user.avatarUrl || s.profilePhoto,
        email: s.user.email,
      };
    });

  // Unified list: Mr. Mayur Gaur and Mr. Nihal Singh first, followed by institutional support staff
  const members: FacultyMember[] = [mayurGaurMember, nihalSinghMember, ...staffMembers];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* 1. Header Banner */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#030914] via-[#071626] to-[#040914] py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[650px] h-[350px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-10 w-[500px] h-[500px] bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-3xl z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Academic Leadership & Mentors</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Learn from Practitioners,{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Not Theorists
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Our instructional faculty brings hands-on enterprise software experience, deep architectural knowledge, and a commitment to deliberate mentor-led pedagogy across all 21 technology tracks.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">100% Industry Practitioners</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">1-on-1 Dedicated Mentorship</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">Civil Lines Campus, Prayagraj</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Dynamic Faculty & Staff Grid */}
      <section className="py-16 sm:py-20 bg-slate-950 border-b border-slate-800/80 min-h-[450px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PublicTrainersView initialMembers={members} />
        </div>
      </section>

      {/* 3. Campus Visit Banner */}
      <section className="py-16 bg-[#040813] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-2xl space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Meet Our Faculty in Person
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Prospective students and guardians are welcome to schedule a campus visit at Civil Lines, Prayagraj, to inspect lab facilities and discuss curriculum details directly with instructional staff.
          </p>
          <div className="pt-3">
            <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20">
              <Link href="/contact" className="flex items-center gap-2">
                <span>Contact Admissions Desk</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
