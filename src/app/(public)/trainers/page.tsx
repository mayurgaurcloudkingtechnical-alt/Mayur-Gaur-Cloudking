import * as React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { UserStatus, UserRoleCode } from "@prisma/client";
import { PublicTrainersView, FacultyMember } from "@/components/public/public-trainers-view";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, GraduationCap, Users, ShieldCheck, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Faculty, Mentors & Academic Staff — SOFTLAB GLOBAL",
  description:
    "Meet the experienced software engineering instructors, industry mentors, and academic counseling team at SOFTLAB GLOBAL.",
};

export default async function TrainersPage() {
  // 1. Fetch active trainers with their assigned courses
  const trainers = await db.trainerProfile.findMany({
    where: {
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
      assignedCourses: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: {
      experienceYears: "desc",
    },
  });

  // 2. Fetch active staff profiles (counselors, heads, coordinators)
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

  // 3. Find any additional active users with roles TRAINER, COUNSELOR, DIRECTOR, ADMIN
  // who might not have had an explicit profile record generated yet
  const userIdsWithProfile = new Set([
    ...trainers.map((t) => t.userId),
    ...staff.map((s) => s.userId),
  ]);

  const additionalUsers = await db.user.findMany({
    where: {
      id: { notIn: Array.from(userIdsWithProfile) },
      status: UserStatus.ACTIVE,
      deletedAt: null,
      roleCode: {
        in: [
          UserRoleCode.TRAINER,
          UserRoleCode.COUNSELOR,
          UserRoleCode.DIRECTOR,
          UserRoleCode.ADMIN,
        ],
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatarUrl: true,
      roleCode: true,
      status: true,
    },
  });

  // Aggregate into unified FacultyMember list
  const members: FacultyMember[] = [];

  // Add trainers
  for (const t of trainers) {
    members.push({
      id: t.id,
      name: `${t.user.firstName} ${t.user.lastName}`,
      designation: "Technical Faculty & Mentor",
      category: "faculty",
      categoryLabel: "Engineering Faculty",
      experienceYears: t.experienceYears || 2,
      bio:
        t.bio ||
        "Senior software engineering mentor leading hands-on production code labs and system design tracks at SoftLab Global.",
      specializations: t.specializations.length > 0
        ? t.specializations
        : ["Full Stack Development", "Modern Software Engineering", "Cloud Systems"],
      assignedCourses: t.assignedCourses.map((ac) => ({
        id: ac.course.id,
        title: ac.course.title,
        slug: ac.course.slug,
      })),
      avatarUrl: t.user.avatarUrl,
      email: t.user.email,
    });
  }

  // Add staff
  for (const s of staff) {
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

    members.push({
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
    });
  }

  // Add remaining users
  for (const u of additionalUsers) {
    const isTrainer = u.roleCode === UserRoleCode.TRAINER;
    const isCounselor = u.roleCode === UserRoleCode.COUNSELOR;
    const isLeadership =
      u.roleCode === UserRoleCode.DIRECTOR ||
      u.roleCode === UserRoleCode.SUPER_ADMIN ||
      u.roleCode === UserRoleCode.ADMIN;

    members.push({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      designation: isTrainer
        ? "Technical Faculty"
        : isCounselor
        ? "Senior Career Counselor"
        : "Academic Director",
      category: isTrainer ? "faculty" : isCounselor ? "counselor" : "leadership",
      categoryLabel: isTrainer
        ? "Engineering Faculty"
        : isCounselor
        ? "Admissions Counselor"
        : "Leadership",
      experienceYears: isTrainer ? 2 : 4,
      bio: isTrainer
        ? "Hands-on software practitioner teaching practical engineering skills and modern technology frameworks."
        : isCounselor
        ? "Advising prospective students on curriculum selection, career pathways, and industry placement standards."
        : "Guiding institutional excellence, curriculum innovation, and academic standards.",
      specializations: isTrainer
        ? ["Software Engineering", "Full Stack", "System Design"]
        : isCounselor
        ? ["Career Advisory", "Admissions", "Skill Roadmaps"]
        : ["Academic Strategy", "Industry Partnerships"],
      assignedCourses: [],
      avatarUrl: u.avatarUrl,
      email: u.email,
    });
  }

  return (
    <div className="flex flex-col">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-emerald-50/70 via-slate-50/30 to-white py-14 sm:py-20 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3.5 py-1 rounded-full border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Leadership & Mentors</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-4">
            Learn from Practitioners, Not Theorists
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
            Our instructional faculty and career counselors bring hands-on enterprise software experience, deep architectural knowledge, and a commitment to deliberate mentor-led pedagogy.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Industry Practitioners</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>1-on-1 Dedicated Mentorship</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Civil Lines Campus, Prayagraj</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Faculty & Staff Grid */}
      <section className="py-14 sm:py-16 bg-slate-50/60 min-h-[450px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PublicTrainersView initialMembers={members} />
        </div>
      </section>

      {/* Campus Visit Banner */}
      <section className="py-14 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-2xl space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Meet Our Faculty in Person
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Prospective students and guardians are welcome to schedule a campus visit at Civil Lines, Prayagraj, to inspect lab facilities and discuss curriculum details directly with instructional staff.
          </p>
          <div className="pt-2">
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-6 rounded-xl shadow-md">
              <Link href="/contact" className="flex items-center gap-1.5">
                <span>Contact Admissions Desk</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
