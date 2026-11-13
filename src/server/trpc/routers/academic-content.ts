import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { ContentStatus, LessonType } from "@prisma/client";

const bulkRowSchema = z.object({
  courseId: z.string().optional(),
  courseSlug: z.string().optional(),
  moduleId: z.string().optional(),
  moduleTitle: z.string().optional(),
  lessonId: z.string().optional(),
  topicTitle: z.string().min(1),
  lessonType: z.string().optional(),
  durationMin: z.number().int().min(1).max(600).optional(),
  bodyHtml: z.string().optional(),
  bodyText: z.string().optional(),
  videoUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  learningObjectives: z.string().optional(),
  practicalInstructions: z.string().optional(),
  assignmentPrompt: z.string().optional(),
  projectPrompt: z.string().optional(),
  expectedOutput: z.string().optional(),
  requiredTools: z.string().optional(),
});

export const academicContentRouter = router({
  listCourses: adminProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          providerType: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const courses = await ctx.prisma.course.findMany({
        where: {
          deletedAt: null,
          ...(input?.providerType && input.providerType !== "ALL"
            ? { providerType: input.providerType }
            : {}),
          ...(input?.search
            ? {
                OR: [
                  { title: { contains: input.search, mode: "insensitive" } },
                  { slug: { contains: input.search, mode: "insensitive" } },
                  { courseCode: { contains: input.search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          modules: {
            where: { deletedAt: null },
            include: {
              lessons: {
                where: { deletedAt: null },
                include: { contentDetails: true },
              },
            },
          },
          _count: { select: { enrollments: true, exams: true } },
        },
      });

      return courses.map((c) => {
        const totalLessons = c.modules.reduce((acc, m) => acc + m.lessons.length, 0);
        const withTheory = c.modules.reduce(
          (acc, m) =>
            acc +
            m.lessons.filter(
              (l) =>
                Boolean(l.contentDetails?.bodyHtml && l.contentDetails.bodyHtml.length > 20) ||
                Boolean(l.contentDetails?.bodyText && l.contentDetails.bodyText.length > 20)
            ).length,
          0
        );
        const withPractical = c.modules.reduce(
          (acc, m) =>
            acc +
            m.lessons.filter((l) => Boolean(l.contentDetails?.practicalInstructions)).length,
          0
        );
        return {
          id: c.id,
          title: c.title,
          slug: c.slug,
          courseCode: c.courseCode,
          providerType: c.providerType,
          programCategory: c.programCategory,
          status: c.status,
          durationWeeks: c.durationWeeks,
          modulesCount: c.modules.length,
          lessonsCount: totalLessons,
          withTheoryCount: withTheory,
          withPracticalCount: withPractical,
          completionPct: totalLessons > 0 ? Math.round((withTheory / totalLessons) * 100) : 0,
          enrollmentsCount: c._count.enrollments,
          examsCount: c._count.exams,
        };
      });
    }),

  getCourseHierarchy: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.prisma.course.findUnique({
        where: { id: input.courseId },
        include: {
          modules: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: {
                where: { deletedAt: null },
                orderBy: { sortOrder: "asc" },
                include: { contentDetails: true },
              },
            },
          },
        },
      });
      if (!course) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }
      const importJobs = await ctx.prisma.academicBulkImportJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      return { course, importJobs };
    }),

  updateLessonContent: adminProcedure
    .input(
      z.object({
        lessonId: z.string(),
        title: z.string().min(2),
        summary: z.string().optional().nullable(),
        type: z.nativeEnum(LessonType).optional(),
        durationMin: z.number().int().min(1).max(600).optional(),
        status: z.nativeEnum(ContentStatus).optional(),
        videoUrl: z.string().optional().nullable(),
        documentUrl: z.string().optional().nullable(),
        externalUrl: z.string().optional().nullable(),
        bodyHtml: z.string().optional().nullable(),
        bodyText: z.string().optional().nullable(),
        learningObjectives: z.string().optional().nullable(),
        practicalInstructions: z.string().optional().nullable(),
        assignmentPrompt: z.string().optional().nullable(),
        projectPrompt: z.string().optional().nullable(),
        expectedOutput: z.string().optional().nullable(),
        requiredTools: z.string().optional().nullable(),
        assignedTrainerId: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lesson = await ctx.prisma.lesson.findUnique({
        where: { id: input.lessonId },
        include: { module: true, contentDetails: true },
      });
      if (!lesson) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }

      const lastVersion = await ctx.prisma.academicContentVersion.findFirst({
        where: { lessonId: lesson.id },
        orderBy: { versionNumber: "desc" },
      });
      const nextVersion = (lastVersion?.versionNumber ?? 0) + 1;

      await ctx.prisma.$transaction(async (tx) => {
        await tx.academicContentVersion.create({
          data: {
            lessonId: lesson.id,
            courseId: lesson.module.courseId,
            versionNumber: nextVersion,
            title: lesson.title,
            bodyHtml: lesson.contentDetails?.bodyHtml,
            bodyText: lesson.contentDetails?.bodyText,
            learningObjectives: lesson.contentDetails?.learningObjectives,
            practicalInstructions: lesson.contentDetails?.practicalInstructions,
            assignmentPrompt: lesson.contentDetails?.assignmentPrompt,
            projectPrompt: lesson.contentDetails?.projectPrompt,
            expectedOutput: lesson.contentDetails?.expectedOutput,
            requiredTools: lesson.contentDetails?.requiredTools,
            changeSource: "CMS_EDIT",
            changedById: ctx.session.user.id,
          },
        });

        await tx.lesson.update({
          where: { id: lesson.id },
          data: {
            title: input.title,
            summary: input.summary ?? lesson.summary,
            type: input.type ?? lesson.type,
            durationMin: input.durationMin ?? lesson.durationMin,
            status: input.status ?? lesson.status,
          },
        });

        await tx.lessonContent.upsert({
          where: { lessonId: lesson.id },
          create: {
            lessonId: lesson.id,
            videoUrl: input.videoUrl || null,
            documentUrl: input.documentUrl || null,
            externalUrl: input.externalUrl || null,
            bodyHtml: input.bodyHtml || null,
            bodyText: input.bodyText || null,
            learningObjectives: input.learningObjectives || null,
            practicalInstructions: input.practicalInstructions || null,
            assignmentPrompt: input.assignmentPrompt || null,
            projectPrompt: input.projectPrompt || null,
            expectedOutput: input.expectedOutput || null,
            requiredTools: input.requiredTools || null,
            assignedTrainerId: input.assignedTrainerId || null,
          },
          update: {
            videoUrl: input.videoUrl ?? undefined,
            documentUrl: input.documentUrl ?? undefined,
            externalUrl: input.externalUrl ?? undefined,
            bodyHtml: input.bodyHtml ?? undefined,
            bodyText: input.bodyText ?? undefined,
            learningObjectives: input.learningObjectives ?? undefined,
            practicalInstructions: input.practicalInstructions ?? undefined,
            assignmentPrompt: input.assignmentPrompt ?? undefined,
            projectPrompt: input.projectPrompt ?? undefined,
            expectedOutput: input.expectedOutput ?? undefined,
            requiredTools: input.requiredTools ?? undefined,
            assignedTrainerId: input.assignedTrainerId ?? undefined,
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            action: "ACADEMIC_CONTENT_UPDATED",
            entityType: "Lesson",
            entityId: lesson.id,
            newData: { title: input.title, versionSaved: nextVersion },
          },
        });
      });

      return { success: true, versionSaved: nextVersion };
    }),

  getVersionHistory: adminProcedure
    .input(z.object({ lessonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.academicContentVersion.findMany({
        where: { lessonId: input.lessonId },
        orderBy: { versionNumber: "desc" },
        take: 25,
      });
    }),

  rollbackVersion: adminProcedure
    .input(z.object({ versionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const version = await ctx.prisma.academicContentVersion.findUnique({
        where: { id: input.versionId },
      });
      if (!version) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Version snapshot not found" });
      }

      const lastVersion = await ctx.prisma.academicContentVersion.findFirst({
        where: { lessonId: version.lessonId },
        orderBy: { versionNumber: "desc" },
      });

      await ctx.prisma.$transaction(async (tx) => {
        await tx.lesson.update({
          where: { id: version.lessonId },
          data: { title: version.title },
        });
        await tx.lessonContent.upsert({
          where: { lessonId: version.lessonId },
          create: {
            lessonId: version.lessonId,
            bodyHtml: version.bodyHtml,
            bodyText: version.bodyText,
            learningObjectives: version.learningObjectives,
            practicalInstructions: version.practicalInstructions,
            assignmentPrompt: version.assignmentPrompt,
            projectPrompt: version.projectPrompt,
            expectedOutput: version.expectedOutput,
            requiredTools: version.requiredTools,
          },
          update: {
            bodyHtml: version.bodyHtml,
            bodyText: version.bodyText,
            learningObjectives: version.learningObjectives,
            practicalInstructions: version.practicalInstructions,
            assignmentPrompt: version.assignmentPrompt,
            projectPrompt: version.projectPrompt,
            expectedOutput: version.expectedOutput,
            requiredTools: version.requiredTools,
          },
        });
        await tx.academicContentVersion.create({
          data: {
            lessonId: version.lessonId,
            courseId: version.courseId,
            versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
            title: version.title,
            bodyHtml: version.bodyHtml,
            bodyText: version.bodyText,
            learningObjectives: version.learningObjectives,
            practicalInstructions: version.practicalInstructions,
            assignmentPrompt: version.assignmentPrompt,
            projectPrompt: version.projectPrompt,
            expectedOutput: version.expectedOutput,
            requiredTools: version.requiredTools,
            changeSource: "ROLLBACK",
            changedById: ctx.session.user.id,
          },
        });
      });

      return { success: true };
    }),

  previewBulkImport: adminProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        rows: z.array(bulkRowSchema).min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const courses = await ctx.prisma.course.findMany({
        where: { deletedAt: null },
        include: {
          modules: {
            where: { deletedAt: null },
            include: { lessons: { where: { deletedAt: null } } },
          },
        },
      });
      const courseById = new Map(courses.map((c) => [c.id, c]));
      const courseBySlug = new Map(courses.map((c) => [c.slug, c]));

      const diffs: Array<{
        rowIndex: number;
        status: "UPDATE_EXISTING" | "CREATE_TOPIC" | "DUPLICATE_SKIPPED" | "INVALID";
        reason?: string;
        courseId?: string;
        courseTitle?: string;
        moduleId?: string;
        moduleTitle?: string;
        lessonId?: string;
        topicTitle: string;
        payload: z.infer<typeof bulkRowSchema>;
      }> = [];

      const seenKeys = new Set<string>();

      input.rows.forEach((row, idx) => {
        const course =
          (row.courseId ? courseById.get(row.courseId) : undefined) ||
          (row.courseSlug ? courseBySlug.get(row.courseSlug) : undefined);

        if (!course) {
          diffs.push({
            rowIndex: idx + 1,
            status: "INVALID",
            reason: "Course ID or Slug not found",
            topicTitle: row.topicTitle,
            payload: row,
          });
          return;
        }

        const mod =
          (row.moduleId ? course.modules.find((m) => m.id === row.moduleId) : undefined) ||
          (row.moduleTitle
            ? course.modules.find(
                (m) => m.title.toLowerCase() === row.moduleTitle!.trim().toLowerCase()
              )
            : undefined);

        if (!mod) {
          diffs.push({
            rowIndex: idx + 1,
            status: "INVALID",
            reason: "Module ID or Title not found in target course",
            courseId: course.id,
            courseTitle: course.title,
            topicTitle: row.topicTitle,
            payload: row,
          });
          return;
        }

        const dedupeKey = `${course.id}:${mod.id}:${row.topicTitle.trim().toLowerCase()}`;
        if (seenKeys.has(dedupeKey)) {
          diffs.push({
            rowIndex: idx + 1,
            status: "DUPLICATE_SKIPPED",
            reason: "Duplicate topic row inside upload file",
            courseId: course.id,
            courseTitle: course.title,
            moduleId: mod.id,
            moduleTitle: mod.title,
            topicTitle: row.topicTitle,
            payload: row,
          });
          return;
        }
        seenKeys.add(dedupeKey);

        const existingLesson =
          (row.lessonId ? mod.lessons.find((l) => l.id === row.lessonId) : undefined) ||
          mod.lessons.find((l) => l.title.toLowerCase() === row.topicTitle.trim().toLowerCase());

        if (existingLesson) {
          diffs.push({
            rowIndex: idx + 1,
            status: "UPDATE_EXISTING",
            courseId: course.id,
            courseTitle: course.title,
            moduleId: mod.id,
            moduleTitle: mod.title,
            lessonId: existingLesson.id,
            topicTitle: row.topicTitle,
            payload: row,
          });
        } else {
          diffs.push({
            rowIndex: idx + 1,
            status: "CREATE_TOPIC",
            courseId: course.id,
            courseTitle: course.title,
            moduleId: mod.id,
            moduleTitle: mod.title,
            topicTitle: row.topicTitle,
            payload: row,
          });
        }
      });

      const summary = {
        totalRows: diffs.length,
        updates: diffs.filter((d) => d.status === "UPDATE_EXISTING").length,
        creates: diffs.filter((d) => d.status === "CREATE_TOPIC").length,
        duplicates: diffs.filter((d) => d.status === "DUPLICATE_SKIPPED").length,
        invalid: diffs.filter((d) => d.status === "INVALID").length,
      };

      const job = await ctx.prisma.academicBulkImportJob.create({
        data: {
          fileName: input.fileName,
          status: "PREVIEW",
          summaryJson: summary,
          diffJson: diffs as any,
          uploadedById: ctx.session.user.id,
        },
      });

      return { jobId: job.id, summary, diffs };
    }),

  approveBulkImport: adminProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.academicBulkImportJob.findUnique({
        where: { id: input.jobId },
      });
      if (!job || job.status !== "PREVIEW") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Import job not found or already processed",
        });
      }

      const diffs = (job.diffJson as any[]) || [];
      let appliedUpdates = 0;
      let appliedCreates = 0;

      await ctx.prisma.$transaction(async (tx) => {
        for (const item of diffs) {
          if (item.status === "UPDATE_EXISTING" && item.lessonId) {
            const existing = await tx.lesson.findUnique({
              where: { id: item.lessonId },
              include: { contentDetails: true },
            });
            if (!existing) continue;

            const lastV = await tx.academicContentVersion.findFirst({
              where: { lessonId: existing.id },
              orderBy: { versionNumber: "desc" },
            });
            await tx.academicContentVersion.create({
              data: {
                lessonId: existing.id,
                courseId: item.courseId,
                versionNumber: (lastV?.versionNumber ?? 0) + 1,
                title: existing.title,
                bodyHtml: existing.contentDetails?.bodyHtml,
                bodyText: existing.contentDetails?.bodyText,
                learningObjectives: existing.contentDetails?.learningObjectives,
                practicalInstructions: existing.contentDetails?.practicalInstructions,
                assignmentPrompt: existing.contentDetails?.assignmentPrompt,
                projectPrompt: existing.contentDetails?.projectPrompt,
                expectedOutput: existing.contentDetails?.expectedOutput,
                requiredTools: existing.contentDetails?.requiredTools,
                changeSource: "BULK_IMPORT",
                importJobId: job.id,
                changedById: ctx.session.user.id,
              },
            });

            const p = item.payload || {};
            await tx.lessonContent.upsert({
              where: { lessonId: existing.id },
              create: {
                lessonId: existing.id,
                bodyHtml: p.bodyHtml || null,
                bodyText: p.bodyText || null,
                videoUrl: p.videoUrl || null,
                documentUrl: p.documentUrl || null,
                learningObjectives: p.learningObjectives || null,
                practicalInstructions: p.practicalInstructions || null,
                assignmentPrompt: p.assignmentPrompt || null,
                projectPrompt: p.projectPrompt || null,
                expectedOutput: p.expectedOutput || null,
                requiredTools: p.requiredTools || null,
              },
              update: {
                ...(p.bodyHtml ? { bodyHtml: p.bodyHtml } : {}),
                ...(p.bodyText ? { bodyText: p.bodyText } : {}),
                ...(p.videoUrl ? { videoUrl: p.videoUrl } : {}),
                ...(p.documentUrl ? { documentUrl: p.documentUrl } : {}),
                ...(p.learningObjectives ? { learningObjectives: p.learningObjectives } : {}),
                ...(p.practicalInstructions ? { practicalInstructions: p.practicalInstructions } : {}),
                ...(p.assignmentPrompt ? { assignmentPrompt: p.assignmentPrompt } : {}),
                ...(p.projectPrompt ? { projectPrompt: p.projectPrompt } : {}),
                ...(p.expectedOutput ? { expectedOutput: p.expectedOutput } : {}),
                ...(p.requiredTools ? { requiredTools: p.requiredTools } : {}),
              },
            });
            appliedUpdates++;
          } else if (item.status === "CREATE_TOPIC" && item.moduleId) {
            const p = item.payload || {};
            const count = await tx.lesson.count({ where: { moduleId: item.moduleId } });
            const created = await tx.lesson.create({
              data: {
                moduleId: item.moduleId,
                title: item.topicTitle,
                type: (p.lessonType as LessonType) || LessonType.RICH_TEXT,
                durationMin: p.durationMin || 45,
                sortOrder: count,
                status: ContentStatus.PUBLISHED,
              },
            });
            await tx.lessonContent.create({
              data: {
                lessonId: created.id,
                bodyHtml: p.bodyHtml || null,
                bodyText: p.bodyText || null,
                videoUrl: p.videoUrl || null,
                documentUrl: p.documentUrl || null,
                learningObjectives: p.learningObjectives || null,
                practicalInstructions: p.practicalInstructions || null,
                assignmentPrompt: p.assignmentPrompt || null,
                projectPrompt: p.projectPrompt || null,
                expectedOutput: p.expectedOutput || null,
                requiredTools: p.requiredTools || null,
              },
            });
            appliedCreates++;
          }
        }

        await tx.academicBulkImportJob.update({
          where: { id: job.id },
          data: {
            status: "APPROVED",
            approvedById: ctx.session.user.id,
            approvedAt: new Date(),
          },
        });
      });

      return { success: true, appliedUpdates, appliedCreates };
    }),

  rollbackBulkImport: adminProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const snapshots = await ctx.prisma.academicContentVersion.findMany({
        where: { importJobId: input.jobId },
      });
      await ctx.prisma.$transaction(async (tx) => {
        for (const snap of snapshots) {
          await tx.lesson.update({
            where: { id: snap.lessonId },
            data: { title: snap.title },
          });
          await tx.lessonContent.upsert({
            where: { lessonId: snap.lessonId },
            create: {
              lessonId: snap.lessonId,
              bodyHtml: snap.bodyHtml,
              bodyText: snap.bodyText,
              learningObjectives: snap.learningObjectives,
              practicalInstructions: snap.practicalInstructions,
              assignmentPrompt: snap.assignmentPrompt,
              projectPrompt: snap.projectPrompt,
              expectedOutput: snap.expectedOutput,
              requiredTools: snap.requiredTools,
            },
            update: {
              bodyHtml: snap.bodyHtml,
              bodyText: snap.bodyText,
              learningObjectives: snap.learningObjectives,
              practicalInstructions: snap.practicalInstructions,
              assignmentPrompt: snap.assignmentPrompt,
              projectPrompt: snap.projectPrompt,
              expectedOutput: snap.expectedOutput,
              requiredTools: snap.requiredTools,
            },
          });
        }
        await tx.academicBulkImportJob.update({
          where: { id: input.jobId },
          data: { status: "ROLLED_BACK", rolledBackAt: new Date() },
        });
      });

      return { success: true, restoredLessons: snapshots.length };
    }),
});
