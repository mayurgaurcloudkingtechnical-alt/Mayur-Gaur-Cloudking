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
});

