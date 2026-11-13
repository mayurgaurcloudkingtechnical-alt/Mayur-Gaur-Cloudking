import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { VirtualLabSandboxService, SupportedLabLanguage } from "@/server/services/virtual-lab-sandbox.service";

export const virtualLabsRouter = router({
  getInfrastructureStatus: protectedProcedure.query(async () => {
    const collabora = await VirtualLabSandboxService.checkCollaboraStatus();
    return {
      collabora,
      codeSandbox: "DOCKER_ISOLATED_CONTAINER",
      databaseSandbox: "ISOLATED_SQLITE_SANDBOX",
      networkingSimulator: "BROWSER_SUBNET_VLAN_SIMULATOR",
    };
  }),

  listLabs: protectedProcedure
    .input(
      z
        .object({
          courseId: z.string().optional(),
          labType: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const labs = await ctx.prisma.practicalLab.findMany({
        where: {
          ...(input?.courseId ? { courseId: input.courseId } : {}),
          ...(input?.labType && input.labType !== "ALL" ? { labType: input.labType } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { submissions: true } },
        },
      });

      const courseIds = Array.from(new Set(labs.map((l) => l.courseId)));
      const courses = await ctx.prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, title: true, slug: true },
      });
      const courseMap = new Map(courses.map((c) => [c.id, c]));

      return labs.map((l) => ({
        ...l,
        courseTitle: courseMap.get(l.courseId)?.title || "General Course",
      }));
    }),

  createLab: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        moduleId: z.string().optional().nullable(),
        lessonId: z.string().optional().nullable(),
        title: z.string().min(3),
        labType: z.string().default("PROGRAMMING"),
        language: z.string().default("python"),
        instructions: z.string().min(5),
        starterCode: z.string().optional().nullable(),
        expectedOutput: z.string().optional().nullable(),
        testCasesJson: z
          .array(z.object({ name: z.string(), expectedOutput: z.string() }))
          .optional()
          .nullable(),
        maxMarks: z.number().int().min(1).max(1000).default(100),
        deadline: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session.user.role;
      if (!["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER", "TRAINER"].includes(role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Admin or Trainer can create labs." });
      }

      const slug = `${input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;

      const lab = await ctx.prisma.practicalLab.create({
        data: {
          courseId: input.courseId,
          moduleId: input.moduleId || null,
          lessonId: input.lessonId || null,
          title: input.title,
          slug,
          labType: input.labType,
          language: input.language,
          instructions: input.instructions,
          starterCode: input.starterCode || null,
          expectedOutput: input.expectedOutput || null,
          testCasesJson: input.testCasesJson ? (input.testCasesJson as any) : undefined,
          maxMarks: input.maxMarks,
          deadline: input.deadline ? new Date(input.deadline) : null,
          assignedById: ctx.session.user.id,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          actorId: ctx.session.user.id,
          action: "PRACTICAL_LAB_CREATED",
          entityType: "PracticalLab",
          entityId: lab.id,
          newData: { title: lab.title, labType: lab.labType, language: lab.language },
        },
      });

      return lab;
    }),

  executeCode: protectedProcedure
    .input(
      z.object({
        labId: z.string().optional(),
        labType: z.string().default("PROGRAMMING"),
        language: z.string(),
        code: z.string().max(100_000),
        stdin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const student = await ctx.prisma.studentProfile.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });

      let testCases: Array<{ name: string; expectedOutput: string }> | undefined;
      if (input.labId) {
        const lab = await ctx.prisma.practicalLab.findUnique({ where: { id: input.labId } });
        if (lab?.testCasesJson && Array.isArray(lab.testCasesJson)) {
          testCases = lab.testCasesJson as any;
        }
      }

      return VirtualLabSandboxService.executeCode({
        userId: ctx.session.user.id,
        studentId: student?.id,
        labId: input.labId,
        labType: input.labType,
        language: input.language as SupportedLabLanguage,
        code: input.code,
        stdin: input.stdin,
        testCases,
      });
    }),

  submitLab: protectedProcedure
    .input(
      z.object({
        labId: z.string(),
        submittedCode: z.string().optional().nullable(),
        submittedFileUrl: z.string().optional().nullable(),
        durationSeconds: z.number().int().min(0).default(60),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const student = await ctx.prisma.studentProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!student) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Student profile required to submit labs." });
      }

      const lab = await ctx.prisma.practicalLab.findUnique({ where: { id: input.labId } });
      if (!lab) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Practical lab not found" });
      }

      const prevCount = await ctx.prisma.practicalSubmission.count({
        where: { labId: lab.id, studentId: student.id },
      });

      const testCases = Array.isArray(lab.testCasesJson)
        ? (lab.testCasesJson as Array<{ name: string; expectedOutput: string }>)
        : [];

      let execResultText = "Submitted for trainer evaluation.";
      let passedCount = 0;
      let testResults: any[] = [];
      let autoStatus = "SUBMITTED";
      let autoScore: number | null = null;

      if (input.submittedCode && ["python", "javascript", "typescript", "c", "cpp", "java", "php", "bash", "sql"].includes(lab.language)) {
        const res = await VirtualLabSandboxService.executeCode({
          userId: ctx.session.user.id,
          studentId: student.id,
          labId: lab.id,
          labType: lab.labType,
          language: lab.language as SupportedLabLanguage,
          code: input.submittedCode,
          testCases,
        });
        execResultText = [res.stdout, res.stderr].filter(Boolean).join("\n").slice(0, 4000);
        if (res.testResults && res.testResults.length > 0) {
          testResults = res.testResults;
          passedCount = res.testResults.filter((t) => t.passed).length;
          autoScore = Math.round((passedCount / res.testResults.length) * lab.maxMarks);
          autoStatus = passedCount === res.testResults.length ? "PASSED" : "SUBMITTED";
        }
      }

      const submission = await ctx.prisma.practicalSubmission.create({
        data: {
          labId: lab.id,
          studentId: student.id,
          courseId: lab.courseId,
          moduleId: lab.moduleId,
          lessonId: lab.lessonId,
          labType: lab.labType,
          attemptNumber: prevCount + 1,
          submittedAt: new Date(),
          durationSeconds: input.durationSeconds,
          submittedCode: input.submittedCode || null,
          submittedFileUrl: input.submittedFileUrl || null,
          executionResult: execResultText,
          testCaseResultJson: testResults.length > 0 ? testResults : undefined,
          passedTestCases: passedCount,
          totalTestCases: testCases.length,
          score: autoScore,
          maxScore: lab.maxMarks,
          status: autoStatus,
        },
      });

      return submission;
    }),

  getStudentPerformance: protectedProcedure.query(async ({ ctx }) => {
    const student = await ctx.prisma.studentProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { course: { select: { id: true, title: true } } },
        },
      },
    });
    if (!student) {
      return {
        assignedCount: 0,
        completedCount: 0,
        pendingCount: 0,
        resubmitCount: 0,
        completionPct: 0,
        submissions: [],
        assignedLabs: [],
      };
    }

    const enrolledCourseIds = student.enrollments.map((e) => e.courseId);
    const assignedLabs = await ctx.prisma.practicalLab.findMany({
      where: { courseId: { in: enrolledCourseIds }, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
    });

    const submissions = await ctx.prisma.practicalSubmission.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      include: { lab: { select: { title: true, labType: true, language: true } } },
    });

    const completedLabIds = new Set(
      submissions.filter((s) => s.status === "PASSED" || s.status === "APPROVED").map((s) => s.labId)
    );
    const resubmitCount = submissions.filter((s) => s.status === "RESUBMIT_REQUESTED").length;
    const assignedCount = assignedLabs.length;
    const completedCount = completedLabIds.size;
    const pendingCount = Math.max(0, assignedCount - completedCount);
    const completionPct = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

    return {
      assignedCount,
      completedCount,
      pendingCount,
      resubmitCount,
      completionPct,
      submissions,
      assignedLabs,
    };
  }),

  listSubmissionsForReview: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const role = ctx.session.user.role;
      if (!["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER", "TRAINER"].includes(role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const subs = await ctx.prisma.practicalSubmission.findMany({
        where: input?.status && input.status !== "ALL" ? { status: input.status } : {},
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { lab: { select: { title: true, labType: true, language: true, maxMarks: true } } },
      });

      const studentIds = Array.from(new Set(subs.map((s) => s.studentId)));
      const students = await ctx.prisma.studentProfile.findMany({
        where: { id: { in: studentIds } },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      const stMap = new Map(
        students.map((s) => [
          s.id,
          `${s.studentId} — ${s.user.firstName} ${s.user.lastName ?? ""}`.trim(),
        ])
      );

      return subs.map((s) => ({
        ...s,
        studentLabel: stMap.get(s.studentId) || s.studentId,
      }));
    }),

  reviewSubmission: protectedProcedure
    .input(
      z.object({
        submissionId: z.string(),
        score: z.number().int().min(0).max(1000),
        trainerFeedback: z.string().min(1),
        status: z.enum(["APPROVED", "RESUBMIT_REQUESTED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session.user.role;
      if (!["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER", "TRAINER"].includes(role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const updated = await ctx.prisma.practicalSubmission.update({
        where: { id: input.submissionId },
        data: {
          score: input.score,
          trainerFeedback: input.trainerFeedback,
          status: input.status,
          reviewedById: ctx.session.user.id,
          reviewedAt: new Date(),
        },
      });
      return updated;
    }),

  getAdminLabAnalytics: adminProcedure.query(async ({ ctx }) => {
    const [totalLabs, totalSubmissions, pendingReviews, approvedCount, totalExecutions] =
      await Promise.all([
        ctx.prisma.practicalLab.count(),
        ctx.prisma.practicalSubmission.count(),
        ctx.prisma.practicalSubmission.count({ where: { status: "SUBMITTED" } }),
        ctx.prisma.practicalSubmission.count({ where: { status: { in: ["APPROVED", "PASSED"] } } }),
        ctx.prisma.labExecutionLog.count(),
      ]);

    const recentExecutions = await ctx.prisma.labExecutionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return {
      totalLabs,
      totalSubmissions,
      pendingReviews,
      approvedCount,
      totalExecutions,
      recentExecutions,
    };
  }),
});
