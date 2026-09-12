import * as React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/server/db/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Award, ArrowRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Faculty & Instructors — SOFTLAB GLOBAL",
  description:
    "Meet the experienced software engineering instructors and technical educators leading academic programs at SOFTLAB GLOBAL.",
};

export default async function TrainersPage() {
  // Query only real trainer profiles verified in PostgreSQL
  const trainers = await db.trainerProfile.findMany({
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
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

  // Filter only active users
  const activeTrainers = trainers.filter((t) => t.user.status === "ACTIVE");

  return (
    <div className="flex flex-col">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-emerald-50/70 to-white py-14 sm:py-20 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Academic Leadership
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-4">
            Learn from Practitioners, Not Theorists
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
            Our instructional faculty brings hands-on enterprise software experience, deep architectural knowledge, and a commitment to deliberate mentor-led pedagogy.
          </p>
        </div>
      </section>

      {/* Faculty Profiles Grid */}
      <section className="py-16 bg-slate-50/50 min-h-[400px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {activeTrainers.length === 0 ? (
            <Card className="border-slate-200 max-w-md mx-auto">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-3">
                <Users className="h-12 w-12 text-slate-300" />
                <h3 className="text-base font-bold text-slate-800">
                  Faculty Directory Being Updated
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Our academic leadership profiles are undergoing periodic verification. Please reach out to our admissions office for faculty profiles and syllabus inquiries.
                </p>
                <Button asChild size="sm" variant="outline" className="border-slate-300 text-xs">
                  <Link href="/contact">Contact Academic Office</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTrainers.map((trainer) => {
                const initials = `${trainer.user.firstName[0]}${trainer.user.lastName[0]}`;

                return (
                  <Card
                    key={trainer.id}
                    className="flex flex-col justify-between border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-sm"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-sm shrink-0">
                          {initials}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <CardTitle className="text-lg font-bold text-slate-900">
                              {trainer.user.firstName} {trainer.user.lastName}
                            </CardTitle>
                            <span title="Verified Faculty">
                              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-emerald-700">
                            {trainer.experienceYears}+ Years Enterprise Experience
                          </p>
                        </div>
                      </div>

                      {trainer.bio && (
                        <CardDescription className="text-xs text-slate-600 mt-3 leading-relaxed">
                          {trainer.bio}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0 text-xs">
                      {/* Specializations */}
                      {trainer.specializations && trainer.specializations.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                            Technical Domain
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {trainer.specializations.map((spec) => (
                              <Badge
                                key={spec}
                                variant="secondary"
                                className="text-[11px] font-medium bg-slate-100 text-slate-700"
                              >
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assigned Courses */}
                      {trainer.assignedCourses.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                            Active Teaching Tracks
                          </span>
                          <ul className="space-y-1">
                            {trainer.assignedCourses.map(({ course }) => (
                              <li key={course.id}>
                                <Link
                                  href={`/courses/${course.slug}`}
                                  className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                                >
                                  <BookOpen className="h-3 w-3" />
                                  <span className="line-clamp-1">{course.title}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Campus Visit Banner */}
      <section className="py-14 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-2xl space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            Meet Our Faculty in Person
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Prospective students and guardians are welcome to schedule a campus visit at Civil Lines, Prayagraj, to inspect lab facilities and discuss curriculum details directly with instructional staff.
          </p>
          <div className="pt-2">
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
