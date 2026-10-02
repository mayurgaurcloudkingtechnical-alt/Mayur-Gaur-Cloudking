import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { OmnichannelInboxService } from "@/server/services/omnichannel-inbox.service";
import { WhatsAppBusinessService } from "@/server/services/whatsapp-business.service";
import { AiCallingAgentService } from "@/server/services/ai-calling-agent.service";
import { WhatsAppCatalogueSyncService } from "@/server/services/whatsapp-catalogue-sync.service";
import { WhatsAppBusinessConfigService } from "@/server/services/whatsapp-business-config.service";
import { AiCounselorService } from "@/server/services/ai-counselor.service";
import { CrmIngestionService } from "@/server/services/crm-ingestion.service";
import { db } from "@/server/db/client";

export const omnichannelRouter = router({
  /**
   * Get detailed WhatsApp Business connection details for wizard
   */
  getWhatsAppConnectionDetails: protectedProcedure.query(async () => {
    const config = await WhatsAppBusinessConfigService.getConfig();
    const status = await WhatsAppBusinessService.getWhatsAppConnectionStatus();
    const catalogStatus = await WhatsAppCatalogueSyncService.getCatalogueStatus();

    return {
      status: status.status,
      phoneNumberStatus: status.phoneNumberStatus,
      displayPhoneNumber: status.displayPhoneNumber,
      phoneNumberId: status.phoneNumberId,
      wabaStatus: status.wabaStatus,
      wabaId: status.wabaId,
      businessId: config.businessId,
      appId: config.appId,
      webhookStatus: status.webhookStatus,
      webhookUrl: status.webhookUrl,
      verifyToken: config.verifyToken,
      catalogStatus: catalogStatus.status,
      catalogCoursesCount: catalogStatus.totalCourses,
      syncedCoursesCount: catalogStatus.syncedCourses,
      aiCounselorStatus: "ACTIVE",
      aiCallingStatus: "ACTIVE",
      lastInboundMessageAt: status.lastInboundMessageAt,
      lastOutboundMessageAt: status.lastOutboundMessageAt,
      lastCatalogSyncAt: status.lastCatalogSyncAt,
      lastVerifiedAt: status.lastVerifiedAt,
      lastError: status.lastError,
      diagnostics: status.diagnostics,
      onboardingMethod: config.onboardingMethod,
    };
  }),

  /**
   * Save or update WhatsApp Business credentials from wizard
   */
  saveWhatsAppCredentials: protectedProcedure
    .input(
      z.object({
        phoneNumberId: z.string().optional(),
        wabaId: z.string().optional(),
        accessToken: z.string().optional(),
        catalogId: z.string().optional(),
        displayPhoneNumber: z.string().optional(),
        businessId: z.string().optional(),
        appId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const saved = await WhatsAppBusinessConfigService.saveConfig(input, ctx.user.id);
      return { success: true, saved };
    }),

  /**
   * Verify live Meta connection for WhatsApp Business
   */
  verifyWhatsAppConnection: protectedProcedure.mutation(async () => {
    return WhatsAppBusinessConfigService.verifyMetaConnection();
  }),

  /**
   * Trigger an end-to-end test inbound message to verify complete pipeline
   */
  triggerTestInboundMessage: protectedProcedure
    .input(
      z.object({
        fromPhone: z.string().default("919876543210"),
        senderName: z.string().default("Real Meta Onboarding Test"),
        messageText: z.string().default("Hello, what are the fees for Cyber Security course?"),
      })
    )
    .mutation(async ({ input }) => {
      const normalizedPhone = WhatsAppBusinessService.normalizePhone(input.fromPhone);

      // Ingest or retrieve lead
      const { lead, isNew } = await CrmIngestionService.ingestLead({
        fullName: input.senderName,
        phone: normalizedPhone,
        source: "WHATSAPP" as any,
        notes: "Real Inbound WhatsApp Test from Super Admin Wizard",
      });

      // Conversation
      const conversation = await OmnichannelInboxService.getOrCreateConversation(
        lead.id,
        "WHATSAPP"
      );

      // Save inbound message
      await OmnichannelInboxService.addMessage({
        conversationId: conversation.id,
        senderType: "LEAD",
        senderName: input.senderName,
        channel: "WHATSAPP",
        messageType: "TEXT",
        content: input.messageText,
      });

      // Run AI Counselor
      const aiResponse = await AiCounselorService.counsel({
        leadId: lead.id,
        leadName: input.senderName,
        leadPhone: normalizedPhone,
        userMessage: input.messageText,
        channel: "WHATSAPP",
      });

      // Save AI reply
      await OmnichannelInboxService.addMessage({
        conversationId: conversation.id,
        senderType: "AI_AGENT",
        senderName: "SoftLab AI Counselor",
        channel: "WHATSAPP",
        messageType: "TEXT",
        content: aiResponse.replyText,
      });

      // Update lead
      await db.lead.update({
        where: { id: lead.id },
        data: {
          botQualified: true,
          botSummary: `Intent: ${aiResponse.intent} | Temp: ${aiResponse.temperature}`,
          temperature: aiResponse.temperature,
          leadScore: aiResponse.leadScore,
          lastInteraction: new Date(),
        },
      });

      return {
        success: true,
        leadId: lead.id,
        leadName: lead.fullName,
        isNewLead: isNew,
        conversationId: conversation.id,
        detectedLanguage: aiResponse.detectedLanguage,
        identifiedCourse: aiResponse.matchedCourse?.courseName || null,
        leadScore: aiResponse.leadScore,
        temperature: aiResponse.temperature,
        aiReply: aiResponse.replyText,
      };
    }),
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

  /**
   * Trigger an instant AI voice call to a lead with previous WhatsApp context loaded
   */
  triggerAiCall: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        preferredLanguage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return AiCallingAgentService.triggerDirectLeadCall({
        leadId: input.leadId,
        performerUserId: ctx.user.id,
        preferredLanguage: input.preferredLanguage,
      });
    }),

  /**
   * Super Admin: Synchronize LMS Course Master with Meta WhatsApp Business Catalogue
   */
  syncCatalog: protectedProcedure.mutation(async () => {
    return WhatsAppCatalogueSyncService.syncAllCourses();
  }),

  /**
   * Get current catalogue synchronization status
   */
  getCatalogSyncStatus: protectedProcedure.query(async () => {
    return WhatsAppCatalogueSyncService.getCatalogueStatus();
  }),

  /**
   * Get complete omnichannel and external integrations health check
   */
  getIntegrationsHealth: protectedProcedure.query(async () => {
    return WhatsAppBusinessService.getSystemIntegrationsHealth();
  }),
});
