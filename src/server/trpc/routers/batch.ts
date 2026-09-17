import { z } from "zod";
import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { UserRoleCode, BatchStatus, DeliveryMode, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuditService } from "@/server/services/audit.service";

export const batchRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        courseId: z.string().optional(),
        status: z.nativeEnum(BatchStatus).optional(),
        deliveryMode: z.nativeEnum(DeliveryMode).optional(),
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { courseId, status, deliveryMode, search, page, pageSize } = input;
      const skip = (page - 1) * pageSize;

      // Scoping: Trainers only see batches they are assigned to
      let trainerFilter: Prisma.BatchWhereInput = {};
      if (ctx.user.roleCode === UserRoleCode.TRAINER) {
        const profile = await ctx.db.trainerProfile.findUnique({
          where: { userId: ctx.user.id },
        });
        if (!profile) {
          return { batches: [], total: 0, page, pageSize, totalPages: 0 };
        }
        trainerFilter = {
          trainers: {
            some: { trainerId: profile.id },
          },
        };
      }

      const where: Prisma.BatchWhereInput = {
        ...trainerFilter,
        ...(courseId ? { courseId } : {}),
        ...(status ? { status } : {}),
        ...(deliveryMode ? { deliveryMode } : {}),
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
                { course: { title: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      };

      const [total, batches] = await Promise.all([
        ctx.db.batch.count({ where }),
        ctx.db.batch.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { startDate: "desc" },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                durationWeeks: true,
              },
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
            _count: {
              select: { classes: true },
            },
          },
        }),
      ]);

      return {
        batches,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const batch = await ctx.db.batch.findUnique({
        where: { id: input.id },
        include: {
          course: true,
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
          classes: {
            orderBy: { scheduledAt: "asc" },
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
        },
      });

      if (!batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Batch not found",
        });
      }

      // If Trainer, check assignment
      if (ctx.user.roleCode === UserRoleCode.TRAINER) {
        const profile = await ctx.db.trainerProfile.findUnique({
          where: { userId: ctx.user.id },
        });
        const isAssigned = batch.trainers.some((t) => t.trainerId === profile?.id);
        if (!isAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not assigned to this batch.",
          });
        }
      }

      return batch;
    }),

  getAvailableTrainers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.trainerProfile.findMany({
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
      orderBy: { createdAt: "asc" },
    });
  }),

  create: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(
      z.object({
        courseId: z.string(),
        code: z.string().optional(),
        name: z.string().min(3, "Batch name must be at least 3 characters"),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        maxCapacity: z.number().int().min(1).max(500).default(30),
        deliveryMode: z.nativeEnum(DeliveryMode).default(DeliveryMode.OFFLINE),
        location: z.string().optional(),
        status: z.nativeEnum(BatchStatus).optional().default(BatchStatus.DRAFT),
        primaryTrainerId: z.string().optional(),
        secondaryTrainerIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.courseId },
      });

      if (!course || course.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      if (input.endDate && input.endDate <= input.startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Batch end date must be strictly after the start date.",
        });
      }

      // Generate unique batch code if not provided
      let finalCode = input.code?.trim().toUpperCase();
      if (!finalCode) {
        const prefix = course.slug.split("-")[0].toUpperCase();
        const year = new Date(input.startDate).getFullYear();
        const count = await ctx.db.batch.count({ where: { courseId: input.courseId } });
        finalCode = `${prefix}-${year}-B${count + 1}`;
      }

      const existingCode = await ctx.db.batch.findUnique({
        where: { code: finalCode },
      });

      if (existingCode) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Batch code '${finalCode}' already exists. Please choose a distinct batch code.`,
        });
      }

      const batch = await ctx.db.$transaction(async (tx) => {
        const createdBatch = await tx.batch.create({
          data: {
            courseId: input.courseId,
            code: finalCode,
            name: input.name.trim(),
            startDate: input.startDate,
            endDate: input.endDate,
            maxCapacity: input.maxCapacity,
            deliveryMode: input.deliveryMode,
            location: input.location?.trim(),
            status: input.status,
          },
        });

        // Add primary trainer
        if (input.primaryTrainerId) {
          await tx.batchTrainer.create({
            data: {
              batchId: createdBatch.id,
              trainerId: input.primaryTrainerId,
              isPrimary: true,
            },
          });
        }

        // Add secondary trainers
        if (input.secondaryTrainerIds && input.secondaryTrainerIds.length > 0) {
          const validSecondary = input.secondaryTrainerIds.filter(
            (id) => id !== input.primaryTrainerId
          );
          if (validSecondary.length > 0) {
            await tx.batchTrainer.createMany({
              data: validSecondary.map((trainerId) => ({
                batchId: createdBatch.id,
                trainerId,
                isPrimary: false,
              })),
            });
          }
        }

        return createdBatch;
      });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "BATCH_CREATE",
        resourceType: "Batch",
        resourceId: batch.id,
        newData: {
          code: batch.code,
          name: batch.name,
          courseId: batch.courseId,
          status: batch.status,
        },
      });

      return batch;
    }),

  update: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(3),
        code: z.string().min(3),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        maxCapacity: z.number().int().min(1).max(500),
        deliveryMode: z.nativeEnum(DeliveryMode),
        location: z.string().optional(),
        primaryTrainerId: z.string().optional(),
        secondaryTrainerIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.batch.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Batch not found",
        });
      }

      if (input.endDate && input.endDate <= input.startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Batch end date must be strictly after the start date.",
        });
      }

      const finalCode = input.code.trim().toUpperCase();
      if (finalCode !== existing.code) {
        const codeConflict = await ctx.db.batch.findUnique({
          where: { code: finalCode },
        });
        if (codeConflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Batch code '${finalCode}' already in use.`,
          });
        }
      }

      const updated = await ctx.db.$transaction(async (tx) => {
        // Sync trainers
        await tx.batchTrainer.deleteMany({
          where: { batchId: input.id },
        });

        if (input.primaryTrainerId) {
          await tx.batchTrainer.create({
            data: {
              batchId: input.id,
              trainerId: input.primaryTrainerId,
              isPrimary: true,
            },
          });
        }

        if (input.secondaryTrainerIds && input.secondaryTrainerIds.length > 0) {
          const validSecondary = input.secondaryTrainerIds.filter(
            (id) => id !== input.primaryTrainerId
          );
          if (validSecondary.length > 0) {
            await tx.batchTrainer.createMany({
              data: validSecondary.map((trainerId) => ({
                batchId: input.id,
                trainerId,
                isPrimary: false,
              })),
            });
          }
        }

        return tx.batch.update({
          where: { id: input.id },
          data: {
            name: input.name.trim(),
            code: finalCode,
            startDate: input.startDate,
            endDate: input.endDate,
            maxCapacity: input.maxCapacity,
            deliveryMode: input.deliveryMode,
            location: input.location?.trim(),
          },
        });
      });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "BATCH_UPDATE",
        resourceType: "Batch",
        resourceId: updated.id,
        previousData: {
          code: existing.code,
          status: existing.status,
          maxCapacity: existing.maxCapacity,
        },
        newData: {
          code: updated.code,
          status: updated.status,
          maxCapacity: updated.maxCapacity,
        },
      });

      return updated;
    }),

  updateStatus: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(BatchStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const batch = await ctx.db.batch.findUnique({
        where: { id: input.id },
      });

      if (!batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Batch not found",
        });
      }

      const updated = await ctx.db.batch.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "BATCH_STATUS_CHANGE",
        resourceType: "Batch",
        resourceId: updated.id,
        previousData: { status: batch.status },
        newData: { status: updated.status },
      });

      return updated;
    }),

  /**
   * Retrieves student roster enrolled in this batch.
   */
  getBatchStudents: protectedProcedure
    .input(z.object({ batchId: z.string() }))
    .query(async ({ ctx, input }) => {
      const enrollments = await ctx.db.enrollment.findMany({
        where: { batchId: input.batchId },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  status: true,
                },
              },
            },
          },
          feeStructure: {
            select: {
              paymentStatus: true,
              totalCourseFee: true,
              paidAmount: true,
              pendingAmount: true,
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      });

      return enrollments.map((enr) => ({
        enrollmentId: enr.id,
        studentProfileId: enr.student.id,
        studentId: enr.student.studentId,
        name: `${enr.student.user.firstName} ${enr.student.user.lastName}`,
        email: enr.student.user.email,
        phone: enr.student.user.phone,
        status: enr.status,
        enrolledAt: enr.enrolledAt,
        feeStatus: enr.feeStructure?.paymentStatus || "PENDING",
        paidAmount: enr.feeStructure?.paidAmount || 0,
        pendingAmount: enr.feeStructure?.pendingAmount || 0,
      }));
    }),

  /**
   * Assigns a student to a batch.
   */
  addStudentToBatch: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(
      z.object({
        batchId: z.string(),
        studentProfileId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const batch = await ctx.db.batch.findUnique({
        where: { id: input.batchId },
      });

      if (!batch) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Batch not found." });
      }

      // Find or create enrollment for this course
      let enrollment = await ctx.db.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: input.studentProfileId,
            courseId: batch.courseId,
          },
        },
      });

      if (enrollment) {
        enrollment = await ctx.db.enrollment.update({
          where: { id: enrollment.id },
          data: { batchId: batch.id },
        });
      } else {
        enrollment = await ctx.db.enrollment.create({
          data: {
            studentId: input.studentProfileId,
            courseId: batch.courseId,
            batchId: batch.id,
            status: "ACTIVE",
          },
        });
      }

      // Also update fee structure if present
      await ctx.db.feeStructure.updateMany({
        where: { enrollmentId: enrollment.id },
        data: { batchId: batch.id },
      });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "BATCH_STUDENT_ASSIGNED",
        resourceType: "Batch",
        resourceId: batch.id,
        newData: { studentProfileId: input.studentProfileId, enrollmentId: enrollment.id },
      });

      return { success: true, enrollmentId: enrollment.id };
    }),

  /**
   * Removes a student from a batch (unlinks batch, preserves course enrollment).
   */
  removeStudentFromBatch: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(
      z.object({
        batchId: z.string(),
        enrollmentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.enrollment.update({
        where: { id: input.enrollmentId },
        data: { batchId: null },
      });

      await ctx.db.feeStructure.updateMany({
        where: { enrollmentId: input.enrollmentId },
        data: { batchId: null },
      });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "BATCH_STUDENT_REMOVED",
        resourceType: "Batch",
        resourceId: input.batchId,
        newData: { enrollmentId: input.enrollmentId },
      });

      return { success: true };
    }),

  /**
   * Retrieves high-level metrics for batch dashboard.
   */
  getBatchMetrics: protectedProcedure
    .input(z.object({ batchId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [totalStudents, activeStudents, classesCount, completedClasses] =
        await Promise.all([
          ctx.db.enrollment.count({ where: { batchId: input.batchId } }),
          ctx.db.enrollment.count({
            where: { batchId: input.batchId, status: "ACTIVE" },
          }),
          ctx.db.scheduledClass.count({ where: { batchId: input.batchId } }),
          ctx.db.scheduledClass.count({
            where: { batchId: input.batchId, status: "COMPLETED" },
          }),
        ]);

      return {
        totalStudents,
        activeStudents,
        totalClasses: classesCount,
        completedClasses,
        syllabusCompletionRate: classesCount > 0 ? Math.round((completedClasses / classesCount) * 100) : 0,
      };
    }),
});

