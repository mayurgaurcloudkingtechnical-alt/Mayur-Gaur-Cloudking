import { z } from "zod";
import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { UserRoleCode } from "@prisma/client";
import { LiveTrackingService } from "@/server/services/live-tracking.service";

const executiveRoles = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
  UserRoleCode.HR,
  UserRoleCode.ACCOUNTANT,
  UserRoleCode.PLACEMENT_OFFICER,
];

export const dashboardRouter = router({
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const userRole = ctx.user.roleCode;

    // Fetch minimal safe catalog count or info
    const sampleCourses = await ctx.db.course.findMany({
      where: { status: "PUBLISHED" },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        durationWeeks: true,
        baseFee: true,
      },
    });

    return {
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
        firstName: ctx.user.firstName,
        lastName: ctx.user.lastName,
        roleCode: userRole,
      },
      availableCourses: sampleCourses,
      portalName:
        userRole === "STUDENT"
          ? "Student Learning Portal"
          : userRole === "TRAINER"
          ? "Faculty & Trainer Portal"
          : userRole === "COUNSELOR" || userRole === "TELECALLER"
          ? "Counselor CRM & Admissions Portal"
          : "Operations & Administration ERP",
    };
  }),

  /**
   * Real-time Multi-Platform Telemetry & Live Tracking stream
   */
  getLiveTrackingData: requireRoleProcedure(executiveRoles).query(async () => {
    const [platforms, liveEvents] = await Promise.all([
      LiveTrackingService.getPlatformHealthMatrix(),
      LiveTrackingService.getLiveEventFeed(30),
    ]);

    return {
      platforms,
      liveEvents,
      refreshedAt: new Date().toISOString(),
    };
  }),

  /**
   * One-click simulation of external platform webhooks & ingestions
   */
  simulateEvent: requireRoleProcedure(executiveRoles)
    .input(
      z.object({
        platform: z.enum(["meta", "google", "justdial", "whatsapp", "razorpay"]),
      })
    )
    .mutation(async ({ input }) => {
      return LiveTrackingService.simulatePlatformEvent(input.platform);
    }),

  /**
   * Core Performance Metrics matching 1.pdf p.13-16 and Trainer Dashboard.pdf
   */
  getCorePerformanceMetrics: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Compute past 6 months dynamically: e.g. [Apr, May, Jun, Jul, Aug, Sep]
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const past6Months: { name: string; year: number; month: number; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      past6Months.push({
        name: monthNames[d.getMonth()],
        year: d.getFullYear(),
        month: d.getMonth(),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      });
    }

    const [
      activeBatches,
      batchesThisMonth,
      totalStudents,
      studentsThisMonth,
      courses,
      totalLeads,
      newLeadsThisMonth,
      enquiries,
      enrolments,
      placedCount,
      dropouts,
      delayedBatchesCount,
      paymentsSuccess,
      allBatches,
      allEnrollments,
      allPlacements,
    ] = await Promise.all([
      ctx.db.batch.count({ where: { status: { in: ["ONGOING", "OPEN_FOR_ENROLLMENT"] } } }),
      ctx.db.batch.count({ where: { createdAt: { gte: startOfMonth } } }),
      ctx.db.studentProfile.count(),
      ctx.db.studentProfile.count({ where: { createdAt: { gte: startOfMonth } } }),
      ctx.db.course.findMany({ select: { durationWeeks: true } }),
      ctx.db.lead.count(),
      ctx.db.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
      ctx.db.lead.count({ where: { source: "WEBSITE" } }),
      ctx.db.enrollment.count(),
      ctx.db.placementApplication.count({ where: { status: "PLACED" } }),
      ctx.db.enrollment.count({ where: { status: "CANCELLED" } }),
      ctx.db.batch.count({ where: { endDate: { lt: now }, status: "ONGOING" } }),
      ctx.db.paymentTransaction.findMany({
        where: { status: "SUCCESS" },
        select: { amount: true, paymentDate: true },
      }),
      ctx.db.batch.findMany({
        select: { status: true },
      }),
      ctx.db.enrollment.findMany({
        select: { enrolledAt: true },
      }),
      ctx.db.placementApplication.findMany({
        where: { status: "PLACED" },
        select: { updatedAt: true },
      }),
    ]);

    const placementRate = totalStudents > 0 ? ((placedCount / totalStudents) * 100).toFixed(1) : "0.0";
    const enrolmentConversion = totalLeads > 0 ? ((enrolments / totalLeads) * 100).toFixed(1) : "0.0";
    const enquiryToLeadConv = enquiries > 0 ? ((totalLeads / enquiries) * 100).toFixed(1) : "0.0";

    // Batch status breakdown
    const runningBatches = allBatches.filter((b) => b.status === "ONGOING").length;
    const completedBatches = allBatches.filter((b) => b.status === "COMPLETED").length;
    const delayedBatches = delayedBatchesCount;
    const scheduledBatches = allBatches.filter((b) => b.status === "UPCOMING" || b.status === "DRAFT").length;

    // Course categories breakdown based on actual courses catalog
    const moduleCourses = courses.filter((c) => c.durationWeeks <= 8).length;
    const certificateCourses = courses.filter((c) => c.durationWeeks > 8 && c.durationWeeks <= 16).length;
    const careerPrograms = courses.filter((c) => c.durationWeeks > 16).length;

    // Dynamic 6-month trends
    const enrollmentTrend = past6Months.map((m) => {
      const count = allEnrollments.filter((e) => {
        return e.enrolledAt >= m.start && e.enrolledAt <= m.end;
      }).length;
      const placed = allPlacements.filter((p) => p.updatedAt >= m.start && p.updatedAt <= m.end).length;
      return {
        month: m.name,
        newEnrollments: count,
        placements: placed,
      };
    });

    const revenueCollection = past6Months.map((m) => {
      const monthPayments = paymentsSuccess.filter((p) => {
        return p.paymentDate >= m.start && p.paymentDate <= m.end;
      });
      const totalPaise = monthPayments.reduce((acc, curr) => acc + curr.amount, 0);
      // In Lakhs: 1 Lakh = 100,000 INR = 10,000,000 Paise
      const lakhs = totalPaise > 0 ? Math.round((totalPaise / 10000000) * 100) / 100 : 0;
      return {
        month: m.name,
        lakhs,
      };
    });

    return {
      kpi: {
        activeBatches,
        batchesThisMonth,
        totalStudents,
        studentsThisMonth,
        moduleCourses,
        careerPrograms,
        certificateCourses,
        totalLeads,
        newLeadsThisMonth,
        enquiries,
        enrolments,
        placedCount,
        placementRate,
        dropouts,
        delayedBatches,
      },
      charts: {
        funnel: {
          leads: totalLeads,
          enquiries,
          enrolments,
          placed: placedCount,
        },
        courseDistribution: {
          moduleCourses,
          certificateCourses,
          careerPrograms,
        },
        enrollmentTrend,
        revenueCollection,
        batchDistribution: {
          running: runningBatches,
          completed: completedBatches,
          delayed: delayedBatches,
          scheduled: scheduledBatches,
        },
      },
      targets: [
        { label: "ENROLMENT CONVERSION", current: `${enrolmentConversion}%`, target: "85%", percentage: Math.min(100, parseFloat(enrolmentConversion)) },
        { label: "PLACEMENT SUCCESS RATE", current: `${placementRate}%`, target: "80%", percentage: Math.min(100, parseFloat(placementRate)) },
        { label: "STUDENT RETENTION", current: "100%", target: "95%", percentage: 100 },
        { label: "ENQUIRY TO LEAD CONV.", current: `${enquiryToLeadConv}%`, target: "80%", percentage: Math.min(100, parseFloat(enquiryToLeadConv)) },
        { label: "DELAYED BATCH COMPLETION", current: `${delayedBatches === 0 ? "100% On-time | 0% Delayed" : `${delayedBatches} Delayed`}`, target: "0% Delayed", percentage: delayedBatches === 0 ? 100 : 50 },
        { label: "COURSE COMPLETION RATE", current: "0%", target: "90%", percentage: 0 },
      ],
    };
  }),
});

