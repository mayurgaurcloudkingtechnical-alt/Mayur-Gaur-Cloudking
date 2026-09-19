import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { UserRoleCode, ContentStatus, LessonType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuditService } from "@/server/services/audit.service";

async function verifyCourseAccess(ctx: any, courseId: string, isDeleteAction = false) {
  const role = ctx.session.user.roleCode as UserRoleCode;
  const adminRoles: UserRoleCode[] = [UserRoleCode.SUPER_ADMIN, UserRoleCode.DIRECTOR, UserRoleCode.ADMIN];

  if (adminRoles.includes(role)) {
    return true;
  }

  if (role === UserRoleCode.TRAINER) {
    if (isDeleteAction) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Faculty instructors are not permitted to delete modules or courses.",
      });
    }

    const trainerProfile = await ctx.db.trainerProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!trainerProfile) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Trainer profile not found." });
    }

    const assignment = await ctx.db.courseTrainer.findUnique({
      where: {
        courseId_trainerId: {
          courseId,
          trainerId: trainerProfile.id,
        },
      },
    });

    if (!assignment) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not an assigned instructor for this course curriculum.",
      });
    }

    return true;
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You do not have permission to author course curriculum.",
  });
}

export const curriculumRouter = router({
  getCourseCurriculum: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyCourseAccess(ctx, input.courseId);

      const course = await ctx.db.course.findUnique({
        where: { id: input.courseId, deletedAt: null },
        select: { id: true, title: true, slug: true, status: true },
      });

      if (!course) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found." });
      }

      const modules = await ctx.db.module.findMany({
        where: { courseId: input.courseId, deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            include: { contentDetails: true },
          },
        },
      });

      let totalLessons = 0;
      let publishedLessons = 0;
      let draftLessons = 0;
      let totalDurationMin = 0;

      modules.forEach((mod) => {
        mod.lessons.forEach((les) => {
          totalLessons++;
          totalDurationMin += les.durationMin;
          if (les.status === ContentStatus.PUBLISHED) publishedLessons++;
          if (les.status === ContentStatus.DRAFT) draftLessons++;
        });
      });

      return {
        course,
        modules,
        metrics: {
          totalModules: modules.length,
          totalLessons,
          publishedLessons,
          draftLessons,
          totalDurationMin,
        },
      };
    }),

  createModule: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        title: z.string().min(2, "Module title is required").max(120),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyCourseAccess(ctx, input.courseId);

      const maxSort = await ctx.db.module.findFirst({
        where: { courseId: input.courseId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      const sortOrder = (maxSort?.sortOrder ?? -1) + 1;

      const newModule = await ctx.db.module.create({
        data: {
          courseId: input.courseId,
          title: input.title,
          description: input.description,
          sortOrder,
          status: ContentStatus.DRAFT,
        },
      });

      await AuditService.log({
        actorId: ctx.session.user.id,
        action: "CURRICULUM_MODULE_CREATE",
        resourceType: "Module",
        resourceId: newModule.id,
        newData: { title: newModule.title, courseId: input.courseId },
      });

      return newModule;
    }),

  updateModule: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(2).max(120).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.module.findUnique({
        where: { id: input.id },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Module not found." });

      await verifyCourseAccess(ctx, existing.courseId);

      const updated = await ctx.db.module.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        },
      });

      await AuditService.log({
        actorId: ctx.session.user.id,
        action: "CURRICULUM_MODULE_UPDATE",
        resourceType: "Module",
        resourceId: updated.id,
        previousData: { title: existing.title },
        newData: { title: updated.title },
      });

      return updated;
    }),

  setModuleStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(ContentStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.module.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Module not found." });

      await verifyCourseAccess(ctx, existing.courseId);

      const updated = await ctx.db.module.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      await AuditService.log({
        actorId: ctx.session.user.id,
        action: "CURRICULUM_MODULE_STATUS",
        resourceType: "Module",
        resourceId: updated.id,
        newData: { status: input.status },
      });

      return updated;
    }),

  reorderModules: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        moduleIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyCourseAccess(ctx, input.courseId);

      await ctx.db.$transaction(
        input.moduleIds.map((id, index) =>
          ctx.db.module.update({
            where: { id },
            data: { sortOrder: index },
          })
        )
      );

      await AuditService.log({
        actorId: ctx.session.user.id,
        action: "CURRICULUM_MODULE_REORDER",
        resourceType: "Course",
        resourceId: input.courseId,
        newData: { sequence: input.moduleIds },
      });

      return { success: true };
    }),

  deleteModule: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.module.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Module not found." });

      await verifyCourseAccess(ctx, existing.courseId, true);

      const archived = await ctx.db.module.update({
        where: { id: input.id },
        data: { status: ContentStatus.ARCHIVED, deletedAt: new Date() },
      });

      await AuditService.log({
        actorId: ctx.session.user.id,
        action: "CURRICULUM_MODULE_ARCHIVE",
        resourceType: "Module",
        resourceId: archived.id,
      });

      return { success: true };
    }),

  createLesson: protectedProcedure
    .input(
      z.object({
        moduleId: z.string(),
        title: z.string().min(2, "Lesson title is required").max(120),
        summary: z.string().optional(),
        type: z.nativeEnum(LessonType).default(LessonType.RICH_TEXT),
        durationMin: z.number().int().min(1).default(30),
        isFreePreview: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const parentModule = await ctx.db.module.findUnique({ where: { id: input.moduleId } });
      if (!parentModule) throw new TRPCError({ code: "NOT_FOUND", message: "Module not found." });

      await verifyCourseAccess(ctx, parentModule.courseId);

      const maxSort = await ctx.db.lesson.findFirst({
        where: { moduleId: input.moduleId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      const sortOrder = (maxSort?.sortOrder ?? -1) + 1;

      const newLesson = await ctx.db.lesson.create({
        data: {
          moduleId: input.moduleId,
          title: input.title,
          summary: input.summary,
          type: input.type,
          durationMin: input.durationMin,
          isFreePreview: input.isFreePreview,
          sortOrder,
          status: ContentStatus.DRAFT,
          contentDetails: {
            create: {},
          },
        },
        include: { contentDetails: true },
      });

      await AuditService.log({
        actorId: ctx.session.user.id,
        action: "CURRICULUM_LESSON_CREATE",
        resourceType: "Lesson",
        resourceId: newLesson.id,
        newData: { title: newLesson.title, moduleId: input.moduleId, type: input.type },
      });

      return newLesson;
    }),

  updateLesson: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(2).max(120).optional(),
        summary: z.string().optional(),
        type: z.nativeEnum(LessonType).optional(),
        durationMin: z.number().int().min(1).optional(),
        isFreePreview: z.boolean().optional(),
        content: z
          .object({
            videoProvider: z.string().optional(),
            bunnyVideoId: z.string().optional(),
            videoUrl: z.string().optional(),
            fileName: z.string().optional(),
            documentUrl: z.string().optional(),
            bodyHtml: z.string().optional(),
            bodyText: z.string().optional(),
            externalUrl: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.lesson.findUnique({
        where: { id: input.id },
        include: { module: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found." });

      await verifyCourseAccess(ctx, existing.module.courseId);

      const updated = await ctx.db.$transaction(async (tx) => {
        const lesson = await tx.lesson.update({
          where: { id: input.id },
          data: {
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.summary !== undefined ? { summary: input.summary } : {}),
            ...(input.type !== undefined ? { type: input.type } : {}),
            ...(input.durationMin !== undefined ? { durationMin: input.durationMin } : {}),
            ...(input.isFreePreview !== undefined ? { isFreePreview: input.isFreePreview } : {}),
          },
        });

        if (input.content) {
          await tx.lessonContent.upsert({
            where: { lessonId: input.id },
            create: {
              lessonId: input.id,
              ...input.content,
            },
            update: {
              ...input.content,
            },
          });
        }

        return lesson;
      });

      await AuditService.log({
        actorId: ctx.session.user.id,
        action: "CURRICULUM_LESSON_UPDATE",
        resourceType: "Lesson",
        resourceId: updated.id,
        newData: { title: updated.title },
      });

      return updated;
    }),

  setLessonStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(ContentStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.lesson.findUnique({
        where: { id: input.id },
        include: { module: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found." });

      await verifyCourseAccess(ctx, existing.module.courseId);

      const updated = await ctx.db.lesson.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      await AuditService.log({
        actorId: ctx.session.user.id,
        action: "CURRICULUM_LESSON_STATUS",
        resourceType: "Lesson",
        resourceId: updated.id,
        newData: { status: input.status },
      });

      return updated;
    }),

  reorderLessons: protectedProcedure
    .input(
      z.object({
        moduleId: z.string(),
        lessonIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const parentModule = await ctx.db.module.findUnique({ where: { id: input.moduleId } });
      if (!parentModule) throw new TRPCError({ code: "NOT_FOUND", message: "Module not found." });

      await verifyCourseAccess(ctx, parentModule.courseId);

      await ctx.db.$transaction(
        input.lessonIds.map((id, index) =>
          ctx.db.lesson.update({
            where: { id },
            data: { sortOrder: index },
          })
        )
      );

      await AuditService.log({
        actorId: ctx.session.user.id,
        action: "CURRICULUM_LESSON_REORDER",
        resourceType: "Module",
        resourceId: input.moduleId,
        newData: { sequence: input.lessonIds },
      });

      return { success: true };
    }),

  deleteLesson: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.lesson.findUnique({
        where: { id: input.id },
        include: { module: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found." });

      await verifyCourseAccess(ctx, existing.module.courseId);

      const archived = await ctx.db.lesson.update({
        where: { id: input.id },
        data: { status: ContentStatus.ARCHIVED, deletedAt: new Date() },
      });

      await AuditService.log({
        actorId: ctx.session.user.id,
        action: "CURRICULUM_LESSON_ARCHIVE",
        resourceType: "Lesson",
        resourceId: archived.id,
      });

      return { success: true };
    }),

  restoreModule: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.module.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Module not found." });

      await verifyCourseAccess(ctx, existing.courseId);

      const restored = await ctx.db.module.update({
        where: { id: input.id },
        data: { status: ContentStatus.DRAFT, deletedAt: null },
      });

      await AuditService.log({
        actorId: ctx.session.user.id,
        action: "CURRICULUM_MODULE_RESTORE",
        resourceType: "Module",
        resourceId: restored.id,
      });

      return { success: true };
    }),

  restoreLesson: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.lesson.findUnique({
        where: { id: input.id },
        include: { module: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found." });

      await verifyCourseAccess(ctx, existing.module.courseId);

      const restored = await ctx.db.lesson.update({
        where: { id: input.id },
        data: { status: ContentStatus.DRAFT, deletedAt: null },
      });

      await AuditService.log({
        actorId: ctx.session.user.id,
        action: "CURRICULUM_LESSON_RESTORE",
        resourceType: "Lesson",
        resourceId: restored.id,
      });

      return { success: true };
    }),
});
