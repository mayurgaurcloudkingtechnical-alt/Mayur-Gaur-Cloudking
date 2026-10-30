import { z } from "zod";
import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { UserRoleCode, ContentStatus, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuditService } from "@/server/services/audit.service";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const courseRouter = router({
  /**
   * Dedicated Student Marketplace query:
   * Returns approved, published SoftLab Global courses with curriculum preview,
   * pricing, duration breakdown, and current student enrollment state.
   */
  getMarketplaceCourses: protectedProcedure
    .input(
      z
        .object({
          durationFilter: z.enum(["ALL", "3_MONTHS", "6_MONTHS", "OTHER"]).optional(),
          search: z.string().optional(),
          level: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      // 1. Get current student profile to determine existing enrollments
      const studentProfile = await ctx.db.studentProfile.findUnique({
        where: { userId: ctx.user.id },
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            select: {
              id: true,
              courseId: true,
              status: true,
              enrolledAt: true,
              batch: { select: { id: true, name: true, startDate: true } },
            },
          },
        },
      });

      const enrolledCourseMap = new Map<string, { id: string; batchName?: string; enrolledAt?: Date }>();
      if (studentProfile) {
        for (const enr of studentProfile.enrollments) {
          enrolledCourseMap.set(enr.courseId, {
            id: enr.id,
            batchName: enr.batch?.name,
            enrolledAt: enr.enrolledAt,
          });
        }
      }

      // 2. Build where filter: only PUBLISHED SoftLab Global courses (no draft, no archived, no unauthorized)
      const where: Prisma.CourseWhereInput = {
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
        providerType: "SOFTLAB",
      };

      if (input?.search && input.search.trim()) {
        const q = input.search.trim();
        where.OR = [
          { title: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { courseCode: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
        ];
      }

      if (input?.level && input.level !== "ALL") {
        where.level = { contains: input.level, mode: "insensitive" };
      }

      // Duration filters
      if (input?.durationFilter === "3_MONTHS") {
        // 3-month courses (~12 weeks)
        where.durationWeeks = { gte: 10, lte: 14 };
      } else if (input?.durationFilter === "6_MONTHS") {
        // 6-month courses (~24 weeks)
        where.durationWeeks = { gte: 20, lte: 26 };
      } else if (input?.durationFilter === "OTHER") {
        where.NOT = [
          { durationWeeks: { gte: 10, lte: 14 } },
          { durationWeeks: { gte: 20, lte: 26 } },
        ];
      }

      const courses = await ctx.db.course.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { durationWeeks: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          courseCode: true,
          summary: true,
          description: true,
          thumbnailUrl: true,
          durationWeeks: true,
          baseFee: true,
          discountedFee: true,
          level: true,
          language: true,
          eligibility: true,
          providerType: true,
          providerName: true,
          placementInfo: true,
          mode: true,
          branch: true,
          modules: {
            where: { status: ContentStatus.PUBLISHED, deletedAt: null },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              sortOrder: true,
              _count: {
                select: { lessons: true },
              },
            },
          },
        },
      });

      return courses.map((c) => {
        const enrollmentInfo = enrolledCourseMap.get(c.id);
        const originalFeePaise = c.baseFee;
        const finalPayablePaise = c.discountedFee && c.discountedFee > 0 ? c.discountedFee : originalFeePaise;
        const discountPaise = originalFeePaise > finalPayablePaise ? originalFeePaise - finalPayablePaise : 0;
        const totalLessons = c.modules.reduce((sum, m) => sum + m._count.lessons, 0);

        return {
          ...c,
          originalFeePaise,
          discountPaise,
          finalPayablePaise,
          totalModules: c.modules.length,
          totalLessons,
          isEnrolled: Boolean(enrollmentInfo),
          enrollmentId: enrollmentInfo?.id || null,
          batchName: enrollmentInfo?.batchName || null,
          enrolledAt: enrollmentInfo?.enrolledAt || null,
        };
      });
    }),

  listAllForSelect: protectedProcedure
    .input(
      z
        .object({
          providerType: z.string().optional(),
          programCategory: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.CourseWhereInput = {
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      };

      if (input?.providerType) {
        where.providerType = input.providerType;
      }
      if (input?.programCategory) {
        where.programCategory = input.programCategory;
      }

      return ctx.db.course.findMany({
        where,
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          courseCode: true,
          baseFee: true,
          providerType: true,
          providerName: true,
          programCategory: true,
          durationWeeks: true,
          level: true,
        },
      });
    }),

  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.nativeEnum(ContentStatus).optional(),
        archivedOnly: z.boolean().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, status, archivedOnly, page, pageSize } = input;
      const skip = (page - 1) * pageSize;

      const where: Prisma.CourseWhereInput = {
        deletedAt: archivedOnly ? { not: null } : null,
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
                { summary: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const [total, courses] = await Promise.all([
        ctx.db.course.count({ where }),
        ctx.db.course.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { batches: true },
            },
            trainers: {
              include: {
                trainer: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      ]);

      return {
        courses,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.id },
        include: {
          trainers: {
            include: {
              trainer: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          batches: {
            orderBy: { startDate: "desc" },
            include: {
              trainers: {
                include: {
                  trainer: {
                    include: {
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
              _count: {
                select: { classes: true },
              },
            },
          },
        },
      });

      if (!course || course.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      return course;
    }),

  create: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(
      z.object({
        title: z.string().min(3, "Title must be at least 3 characters"),
        slug: z.string().min(3).optional(),
        summary: z.string().min(10, "Summary must be at least 10 characters"),
        description: z.string().min(20, "Description must be at least 20 characters"),
        durationWeeks: z.number().int().min(1).max(104).default(12),
        baseFee: z.number().int().min(0, "Base fee must be non-negative integer Paise"),
        level: z.string().optional().default("Beginner to Advanced"),
        language: z.string().optional().default("English / Hindi"),
        eligibility: z.string().optional().default("Open to all learners and graduates"),
        status: z.nativeEnum(ContentStatus).optional().default(ContentStatus.DRAFT),
        trainerIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const finalSlug = input.slug?.trim() ? slugify(input.slug) : slugify(input.title);

      const existingCourse = await ctx.db.course.findUnique({
        where: { slug: finalSlug },
      });

      if (existingCourse) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Course with slug '${finalSlug}' already exists. Please choose a different title or slug.`,
        });
      }

      const course = await ctx.db.course.create({
        data: {
          title: input.title.trim(),
          slug: finalSlug,
          summary: input.summary.trim(),
          description: input.description.trim(),
          durationWeeks: input.durationWeeks,
          baseFee: input.baseFee,
          level: input.level,
          language: input.language,
          eligibility: input.eligibility,
          status: input.status,
          ...(input.trainerIds && input.trainerIds.length > 0
            ? {
                trainers: {
                  create: input.trainerIds.map((trainerId) => ({
                    trainerId,
                  })),
                },
              }
            : {}),
        },
        include: {
          trainers: true,
        },
      });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "COURSE_CREATE",
        resourceType: "Course",
        resourceId: course.id,
        newData: {
          title: course.title,
          slug: course.slug,
          baseFee: course.baseFee,
          status: course.status,
        },
      });

      return course;
    }),

  update: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3),
        slug: z.string().min(3),
        summary: z.string().min(10),
        description: z.string().min(20),
        durationWeeks: z.number().int().min(1).max(104),
        baseFee: z.number().int().min(0),
        level: z.string().optional(),
        language: z.string().optional(),
        eligibility: z.string().optional(),
        trainerIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.course.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      const finalSlug = slugify(input.slug);
      if (finalSlug !== existing.slug) {
        const slugCheck = await ctx.db.course.findUnique({
          where: { slug: finalSlug },
        });
        if (slugCheck) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Slug '${finalSlug}' is already in use by another course.`,
          });
        }
      }

      // Update course and sync trainers
      const updated = await ctx.db.$transaction(async (tx) => {
        if (input.trainerIds !== undefined) {
          await tx.courseTrainer.deleteMany({
            where: { courseId: input.id },
          });

          if (input.trainerIds.length > 0) {
            await tx.courseTrainer.createMany({
              data: input.trainerIds.map((trainerId) => ({
                courseId: input.id,
                trainerId,
              })),
            });
          }
        }

        return tx.course.update({
          where: { id: input.id },
          data: {
            title: input.title.trim(),
            slug: finalSlug,
            summary: input.summary.trim(),
            description: input.description.trim(),
            durationWeeks: input.durationWeeks,
            baseFee: input.baseFee,
            level: input.level,
            language: input.language,
            eligibility: input.eligibility,
          },
        });
      }, { maxWait: 15000, timeout: 30000 });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "COURSE_UPDATE",
        resourceType: "Course",
        resourceId: updated.id,
        previousData: {
          title: existing.title,
          baseFee: existing.baseFee,
          status: existing.status,
        },
        newData: {
          title: updated.title,
          baseFee: updated.baseFee,
          status: updated.status,
        },
      });

      return updated;
    }),

  setStatus: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(ContentStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.id },
      });

      if (!course || course.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      const updated = await ctx.db.course.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "COURSE_STATUS_CHANGE",
        resourceType: "Course",
        resourceId: updated.id,
        previousData: { status: course.status },
        newData: { status: updated.status },
      });

      return updated;
    }),

  delete: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.id },
        include: {
          batches: {
            where: {
              status: {
                in: ["UPCOMING", "OPEN_FOR_ENROLLMENT", "ONGOING"],
              },
            },
          },
        },
      });

      if (!course || course.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      if (course.batches.length > 0 && ctx.user.roleCode !== UserRoleCode.SUPER_ADMIN) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete course with active batches (${course.batches.length} active). Only Super Admin can override this.`,
        });
      }

      const deleted = await ctx.db.course.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "COURSE_DELETE",
        resourceType: "Course",
        resourceId: deleted.id,
      });

      return { success: true };
    }),

  restore: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.id },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      const restored = await ctx.db.course.update({
        where: { id: input.id },
        data: { deletedAt: null },
      });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "COURSE_RESTORE",
        resourceType: "Course",
        resourceId: restored.id,
      });

      return restored;
    }),
});
