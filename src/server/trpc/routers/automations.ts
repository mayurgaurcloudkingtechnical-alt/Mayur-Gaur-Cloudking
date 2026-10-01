import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db/client";
import { FollowUpAutomationService } from "@/server/services/follow-up-automation.service";

export const automationsRouter = router({
  /**
   * List all configured automation sequences
   */
  listSequences: protectedProcedure.query(async () => {
    return db.automationSequence.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { leadStates: true } },
      },
    });
  }),

  /**
   * Create or update automation sequence
   */
  upsertSequence: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        code: z.string().min(1),
        triggerEvent: z.string().min(1),
        description: z.string().optional(),
        steps: z.any(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (id) {
        return db.automationSequence.update({
          where: { id },
          data: {
            name: input.name,
            code: input.code,
            triggerEvent: input.triggerEvent,
            description: input.description,
            steps: input.steps,
            isActive: input.isActive,
          },
        });
      }
      return db.automationSequence.create({
        data: {
          name: input.name,
          code: input.code,
          triggerEvent: input.triggerEvent,
          description: input.description,
          steps: input.steps,
          isActive: input.isActive,
          createdById: ctx.user.id,
        },
      });
    }),

  /**
   * List active automation states for leads
   */
  listLeadStates: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const where: any = {};
      if (input.status && input.status !== "ALL") {
        where.status = input.status;
      }
      return db.automationSequenceState.findMany({
        where,
        include: {
          sequence: true,
          lead: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              status: true,
              temperature: true,
              course: { select: { title: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: input.limit,
      });
    }),

  /**
   * Manually trigger/enroll lead in a sequence
   */
  triggerForLead: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        sequenceCode: z.string().default("DEFAULT_ADMISSIONS_DRIP"),
      })
    )
    .mutation(async ({ input }) => {
      return FollowUpAutomationService.enrollLeadInSequence(input.leadId, input.sequenceCode);
    }),

  /**
   * Pause cadence for a lead
   */
  pauseForLead: protectedProcedure
    .input(z.object({ stateId: z.string() }))
    .mutation(async ({ input }) => {
      return db.automationSequenceState.update({
        where: { id: input.stateId },
        data: { status: "PAUSED" },
      });
    }),

  /**
   * Resume cadence for a lead
   */
  resumeForLead: protectedProcedure
    .input(z.object({ stateId: z.string() }))
    .mutation(async ({ input }) => {
      const updated = await db.automationSequenceState.update({
        where: { id: input.stateId },
        data: { status: "RUNNING" },
      });
      await FollowUpAutomationService.processNextStep(input.stateId);
      return updated;
    }),
});
