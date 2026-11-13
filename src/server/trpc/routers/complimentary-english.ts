import { router, publicProcedure, requireRoleProcedure } from "../init";
import { UserRoleCode } from "@prisma/client";

const adminProcedure = requireRoleProcedure([
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
]);
import {
  ComplimentaryEnglishService,
  ENGLISH_COURSE_SLUG,
  PROPOSED_ENGLISH_FEE_PAISE,
} from "@/server/services/complimentary-english.service";

export const complimentaryEnglishRouter = router({
  getSummary: publicProcedure.query(async ({ ctx }) => {
    const course = await ctx.db.course.findUnique({
      where: { slug: ENGLISH_COURSE_SLUG },
      include: {
        modules: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: {
              where: { deletedAt: null },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        batches: {
          include: {
            classes: {
              orderBy: { scheduledAt: "asc" },
              take: 4,
            },
          },
        },
      },
    });
    return {
      course,
      proposedFeeINR: (course?.baseFee ?? PROPOSED_ENGLISH_FEE_PAISE) / 100,
    };
  }),

  auditEligibility: adminProcedure.query(async () => {
    return ComplimentaryEnglishService.auditEligibility();
  }),

  runMigration: adminProcedure.mutation(async ({ ctx }) => {
    return ComplimentaryEnglishService.migrateExistingEligibleStudents(ctx.user.id);
  }),

  getAnalytics: adminProcedure.query(async ({ ctx }) => {
    const { course, weeklyBatch } = await ComplimentaryEnglishService.ensureFlagshipCourse();
    const [paidCount, complimentaryCount, waiversAgg, upcomingClasses] = await Promise.all([
      ctx.db.enrollment.count({
        where: { courseId: course.id, enrollmentType: "PAID" },
      }),
      ctx.db.enrollment.count({
        where: { courseId: course.id, enrollmentType: "COMPLIMENTARY" },
      }),
      ctx.db.feeStructure.aggregate({
        where: { courseId: course.id, isComplimentary: true },
        _sum: { nonCashWaiverAmount: true },
      }),
      ctx.db.scheduledClass.findMany({
        where: { batchId: weeklyBatch.id },
        orderBy: { scheduledAt: "asc" },
        take: 8,
      }),
    ]);

    return {
      courseId: course.id,
      courseTitle: course.title,
      proposedFeeINR: course.baseFee / 100,
      paidEnrollments: paidCount,
      complimentaryEnrollments: complimentaryCount,
      totalNonCashWaiversINR: (waiversAgg._sum.nonCashWaiverAmount ?? 0) / 100,
      weeklyBatchCode: weeklyBatch.code,
      upcomingClasses,
    };
  }),
});
