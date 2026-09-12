import { router, protectedProcedure } from "../init";

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
});
