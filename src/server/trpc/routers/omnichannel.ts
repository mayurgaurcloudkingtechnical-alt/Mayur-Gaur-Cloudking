import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { OmnichannelInboxService } from "@/server/services/omnichannel-inbox.service";
import { WhatsAppBusinessService } from "@/server/services/whatsapp-business.service";
import { db } from "@/server/db/client";

export const omnichannelRouter = router({
  /**
   * List unified inbox conversations
   */
  listConversations: protectedProcedure
    .input(
      z.object({
        channel: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        skip: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return OmnichannelInboxService.listConversations(input);
    }),

  /**
   * Get single conversation thread with full message history
   */
  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input }) => {
      const conv = await OmnichannelInboxService.getConversationDetails(input.conversationId);
      if (!conv) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      }
      return conv;
    }),

  /**
   * Send a message from staff in an active conversation
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string().min(1),
        messageType: z.enum(["TEXT", "TEMPLATE", "MEDIA", "BUTTON_REPLY", "TRANSCRIPT", "PAYMENT_LINK"]).default("TEXT"),
        mediaUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conv = await db.omnichannelConversation.findUnique({
        where: { id: input.conversationId },
        include: { lead: true },
      });

      if (!conv) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      }

      // If channel is WhatsApp, dispatch via WhatsApp Cloud API
      if (conv.channel === "WHATSAPP") {
        await WhatsAppBusinessService.sendMessage({
          toPhone: conv.lead.phone,
          text: input.content,
          mediaUrl: input.mediaUrl,
          leadId: conv.leadId,
        });
      }

      return OmnichannelInboxService.addMessage({
        conversationId: input.conversationId,
        senderType: "STAFF",
        senderName: ctx.user.name || "SoftLab Counselor",
        channel: conv.channel as any,
        messageType: input.messageType,
        content: input.content,
        mediaUrl: input.mediaUrl,
      });
    }),

  /**
   * Counselor takes over conversation from AI
   */
  takeoverConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return OmnichannelInboxService.takeoverConversation(input.conversationId, ctx.user.id);
    }),

  /**
   * Mark conversation resolved or return to AI
   */
  resolveConversation: protectedProcedure
    .input(z.object({ conversationId: z.string(), returnToAi: z.boolean().default(true) }))
    .mutation(async ({ input }) => {
      return OmnichannelInboxService.resolveConversation(input.conversationId, input.returnToAi);
    }),

  /**
   * Fetch 360° unified customer timeline for lead
   */
  getCustomerTimeline: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .query(async ({ input }) => {
      return OmnichannelInboxService.getCustomerTimeline(input.leadId);
    }),

  /**
   * Quick action: Send official course brochure to lead via WhatsApp
   */
  sendWhatsAppBrochure: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        courseId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await db.lead.findUnique({
        where: { id: input.leadId },
        include: { course: true },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }

      const courseTitle = lead.course?.title || "Industry Flagship Program";
      const result = await WhatsAppBusinessService.sendCourseBrochure(
        lead.phone,
        lead.fullName,
        courseTitle,
        undefined,
        lead.id
      );

      // Record timeline event
      await OmnichannelInboxService.recordTimelineEvent({
        leadId: lead.id,
        eventType: "WHATSAPP_BROCHURE_SENT",
        source: "COUNSELOR",
        title: "Official Brochure Sent via WhatsApp",
        summary: `Dispatched syllabus brochure for ${courseTitle} to ${lead.phone}`,
        actorId: ctx.user.id,
      });

      return result;
    }),

  /**
   * Quick action: Send Razorpay payment link via WhatsApp
   */
  sendRazorpayLink: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        amountRupees: z.number().min(1),
        paymentUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await db.lead.findUnique({
        where: { id: input.leadId },
        include: { course: true },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }

      const courseTitle = lead.course?.title || "Specialized IT Program";
      const result = await WhatsAppBusinessService.sendPaymentLink(
        lead.phone,
        lead.fullName,
        courseTitle,
        input.amountRupees,
        input.paymentUrl,
        lead.id
      );

      // Record payment link in database
      const amountPaise = input.amountRupees * 100;
      await db.razorpayPaymentLink.create({
        data: {
          leadId: lead.id,
          razorpayLinkId: `plink_${Date.now()}`,
          shortUrl: input.paymentUrl,
          amountPaise,
          currency: "INR",
          description: `Admission fee for ${courseTitle}`,
          status: "CREATED",
        },
      });

      // Update lead payment status
      await db.lead.update({
        where: { id: lead.id },
        data: { paymentStatus: "LINK_SENT" },
      });

      // Record timeline event
      await OmnichannelInboxService.recordTimelineEvent({
        leadId: lead.id,
        eventType: "PAYMENT_LINK_SENT",
        source: "COUNSELOR",
        title: `Payment Link Generated (₹${input.amountRupees.toLocaleString("en-IN")})`,
        summary: `Sent secure fee payment link to ${lead.phone} via WhatsApp.`,
        metadata: {
          amountRupees: input.amountRupees,
          url: input.paymentUrl,
        },
        actorId: ctx.user.id,
      });

      return result;
    }),

  /**
   * List open escalation tasks
   */
  listEscalations: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        severity: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const where: any = {};
      if (input.status && input.status !== "ALL") where.status = input.status;
      if (input.severity && input.severity !== "ALL") where.severity = input.severity;

      return db.escalationTask.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              temperature: true,
              course: { select: { title: true } },
            },
          },
          assignedStaff: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      });
    }),

  /**
   * Resolve an escalation task
   */
  resolveEscalation: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        resolutionNotes: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.escalationTask.update({
        where: { id: input.taskId },
        data: {
          status: "RESOLVED",
          resolutionNotes: input.resolutionNotes,
          resolvedAt: new Date(),
          assignedStaffId: ctx.user.id,
        },
      });
    }),
});
