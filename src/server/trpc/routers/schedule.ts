import { z } from "zod";
import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { UserRoleCode, DeliveryMode, ClassSessionStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuditService } from "@/server/services/audit.service";

export const scheduleRouter = router({
  listByBatch: protectedProcedure
    .input(z.object({ batchId: z.string() }))
    .query(async ({ ctx, input }) => {
      const batch = await ctx.db.batch.findUnique({
        where: { id: input.batchId },
        include: {
          trainers: true,
        },
      });

      if (!batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Batch not found",
        });
      }

      // Check trainer scoping
      if (ctx.user.roleCode === UserRoleCode.TRAINER) {
        const profile = await ctx.db.trainerProfile.findUnique({
          where: { userId: ctx.user.id },
        });
        const isAssigned = batch.trainers.some((t) => t.trainerId === profile?.id);
        if (!isAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to view the schedule for this batch.",
          });
        }
      }

      return ctx.db.scheduledClass.findMany({
        where: { batchId: input.batchId },
        orderBy: { scheduledAt: "asc" },
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
      });
    }),

  listTrainerSchedule: protectedProcedure.query(async ({ ctx }) => {
    // Determine target trainer profile
    let trainerProfileId: string | undefined;

    if (ctx.user.roleCode === UserRoleCode.TRAINER) {
      const profile = await ctx.db.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!profile) return [];
      trainerProfileId = profile.id;
    }

    return ctx.db.scheduledClass.findMany({
      where: trainerProfileId
        ? {
            OR: [
              { trainerId: trainerProfileId },
              {
                batch: {
                  trainers: {
                    some: { trainerId: trainerProfileId },
                  },
                },
              },
            ],
          }
        : {},
      orderBy: { scheduledAt: "asc" },
      include: {
        batch: {
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
    });
  }),

  createClass: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.TRAINER,
  ])
    .input(
      z.object({
        batchId: z.string(),
        title: z.string().min(3, "Title must be at least 3 characters"),
        scheduledAt: z.coerce.date(),
        durationMin: z.number().int().min(15).max(480).default(60),
        trainerId: z.string().optional(),
        mode: z.nativeEnum(DeliveryMode).default(DeliveryMode.OFFLINE),
        location: z.string().optional(),
        agendaNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const batch = await ctx.db.batch.findUnique({
        where: { id: input.batchId },
        include: { trainers: true },
      });

      if (!batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Batch not found",
        });
      }

      // If Trainer role, check if assigned
      if (ctx.user.roleCode === UserRoleCode.TRAINER) {
        const profile = await ctx.db.trainerProfile.findUnique({
          where: { userId: ctx.user.id },
        });
        const isAssigned = batch.trainers.some((t) => t.trainerId === profile?.id);
        if (!isAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only schedule classes for batches assigned to you.",
          });
        }
      }

      // Validate date boundaries
      if (input.scheduledAt < batch.startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Class date cannot be earlier than batch start date (${batch.startDate.toLocaleDateString()}).`,
        });
      }

      if (batch.endDate && input.scheduledAt > batch.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Class date cannot be later than batch end date (${batch.endDate.toLocaleDateString()}).`,
        });
      }

      const scheduledClass = await ctx.db.scheduledClass.create({
        data: {
          batchId: input.batchId,
          title: input.title.trim(),
          scheduledAt: input.scheduledAt,
          durationMin: input.durationMin,
          trainerId: input.trainerId,
          mode: input.mode,
          location: input.location?.trim(),
          agendaNotes: input.agendaNotes?.trim(),
        },
      });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "CLASS_SCHEDULE_CREATE",
        resourceType: "ScheduledClass",
        resourceId: scheduledClass.id,
        newData: {
          batchId: scheduledClass.batchId,
          title: scheduledClass.title,
          scheduledAt: scheduledClass.scheduledAt,
          durationMin: scheduledClass.durationMin,
        },
      });

      return scheduledClass;
    }),

  updateClass: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.TRAINER,
  ])
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3),
        scheduledAt: z.coerce.date(),
        durationMin: z.number().int().min(15).max(480),
        trainerId: z.string().optional(),
        mode: z.nativeEnum(DeliveryMode),
        location: z.string().optional(),
        agendaNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.scheduledClass.findUnique({
        where: { id: input.id },
        include: { batch: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class session not found",
        });
      }

      // Validate date boundaries with parent batch
      if (input.scheduledAt < existing.batch.startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Class date cannot be earlier than batch start date (${existing.batch.startDate.toLocaleDateString()}).`,
        });
      }

      if (existing.batch.endDate && input.scheduledAt > existing.batch.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Class date cannot be later than batch end date (${existing.batch.endDate.toLocaleDateString()}).`,
        });
      }

      const updated = await ctx.db.scheduledClass.update({
        where: { id: input.id },
        data: {
          title: input.title.trim(),
          scheduledAt: input.scheduledAt,
          durationMin: input.durationMin,
          trainerId: input.trainerId,
          mode: input.mode,
          location: input.location?.trim(),
          agendaNotes: input.agendaNotes?.trim(),
        },
      });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "CLASS_SCHEDULE_UPDATE",
        resourceType: "ScheduledClass",
        resourceId: updated.id,
        previousData: {
          title: existing.title,
          scheduledAt: existing.scheduledAt,
        },
        newData: {
          title: updated.title,
          scheduledAt: updated.scheduledAt,
        },
      });

      return updated;
    }),

  updateSessionDelivery: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.TRAINER,
  ])
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(ClassSessionStatus),
        statusReason: z.string().optional(),
        topicCovered: z.string().optional(),
        agendaNotes: z.string().optional(),
        rescheduledAt: z.coerce.date().optional(),
        coveredLessonId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.scheduledClass.findUnique({
        where: { id: input.id },
        include: { batch: { include: { trainers: true } } },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found." });

      if (ctx.user.roleCode === UserRoleCode.TRAINER) {
        const prof = await ctx.db.trainerProfile.findUnique({ where: { userId: ctx.user.id } });
        if (!session.batch.trainers.some((t: any) => t.trainerId === prof?.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not assigned to this batch session." });
        }
      }

      if (input.rescheduledAt) {
        if (input.rescheduledAt < session.batch.startDate || (session.batch.endDate && input.rescheduledAt > session.batch.endDate)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Rescheduled date must fall within the batch period." });
        }
      }

      const updated = await ctx.db.scheduledClass.update({
        where: { id: input.id },
        data: {
          status: input.status,
          statusReason: input.statusReason?.trim() || null,
          topicCovered: input.topicCovered?.trim() || session.topicCovered,
          agendaNotes: input.agendaNotes?.trim() || session.agendaNotes,
          scheduledAt: input.rescheduledAt ?? session.scheduledAt,
          coveredLessonId: input.coveredLessonId ?? session.coveredLessonId,
        },
      });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "CLASS_SESSION_STATUS_CHANGED",
        resourceType: "ScheduledClass",
        resourceId: updated.id,
        newData: { status: updated.status, statusReason: updated.statusReason, scheduledAt: updated.scheduledAt },
      });

      return updated;
    }),

  deleteClass: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.scheduledClass.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class session not found",
        });
      }

      await ctx.db.scheduledClass.delete({
        where: { id: input.id },
      });

      await AuditService.log({
        actorId: ctx.user.id,
        action: "CLASS_SCHEDULE_DELETE",
        resourceType: "ScheduledClass",
        resourceId: input.id,
      });

      return { success: true };
    }),
});
