/**
 * Unified Communication Intelligence Router (Phase 4.2)
 * SLG CALL INTELLIGENCE — Powered by SOFTLAB GLOBAL
 * tRPC endpoints for WhatsApp, SMS, threads, two-way messaging, and templates.
 * Strict boundary: File size <= 350 lines
 */

import { router, protectedProcedure } from "../init";
import { z } from "zod";
import { UserRoleCode } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db/client";
import { CommunicationConfigService } from "@/server/services/communication/communication-config.service";
import { ConversationThreadService } from "@/server/services/communication/conversation-thread.service";
import { MessageEventService } from "@/server/services/communication/message-event.service";
import { TemplateAutomationService } from "@/server/services/communication/template-automation.service";
import { TwoWayMessagingService } from "@/server/services/communication/two-way-messaging.service";
import {
  SlgChannelType,
  SlgThreadStatus,
} from "@/server/services/communication/types";

const supervisoryRoles: UserRoleCode[] = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
];

function assertTenantContext(ctx: { user: any }) {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required." });
  }
  const tenantId = ctx.user.tenantId;
  if (!tenantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access Denied: User is not assigned to an active tenant organization.",
    });
  }
  return {
    tenantId,
    userId: ctx.user.id as string,
    roleCode: ctx.user.roleCode as UserRoleCode,
  };
}

export const slgCommunicationRouter = router({
  /**
   * Get tenant communication configuration (WhatsApp and SMS status)
   */
  getTenantConfig: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = assertTenantContext(ctx);
    const [whatsapp, sms] = await Promise.all([
      CommunicationConfigService.getWhatsAppConfig(tenantId, false),
      CommunicationConfigService.getSmsConfig(tenantId, false),
    ]);

    return {
      whatsappConfig: whatsapp.config,
      smsConfig: sms.config,
    };
  }),

  /**
   * Update official Meta WhatsApp Cloud API credentials (Supervisory only)
   */
  updateWhatsAppConfig: protectedProcedure
    .input(
      z.object({
        phoneNumberId: z.string().min(1),
        wabaId: z.string().min(1),
        displayPhoneNumber: z.string().min(1),
        accessToken: z.string().min(1),
        webhookVerifyToken: z.string().min(1),
        appSecret: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, roleCode } = assertTenantContext(ctx);
      if (!supervisoryRoles.includes(roleCode)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators and directors can configure WhatsApp Business credentials.",
        });
      }
      return await CommunicationConfigService.updateWhatsAppConfig(tenantId, userId, input);
    }),

  /**
   * Update SMS gateway credentials (Supervisory only)
   */
  updateSmsConfig: protectedProcedure
    .input(
      z.object({
        primaryProvider: z.string().min(1),
        backupProvider: z.string().optional(),
        dltEntityId: z.string().optional(),
        defaultSenderId: z.string().min(1),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
        webhookSecret: z.string().min(1),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, roleCode } = assertTenantContext(ctx);
      if (!supervisoryRoles.includes(roleCode)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators and directors can configure SMS Gateway credentials.",
        });
      }
      return await CommunicationConfigService.updateSmsConfig(tenantId, userId, input);
    }),

  /**
   * List conversation threads with filtering and pagination
   */
  listThreads: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(SlgThreadStatus).optional(),
        assignedUserId: z.string().optional(),
        search: z.string().optional(),
        channel: z.nativeEnum(SlgChannelType).optional(),
        unreadOnly: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = assertTenantContext(ctx);
      return await ConversationThreadService.listThreads(tenantId, input);
    }),

  /**
   * Get single conversation thread with history and notes
   */
  getThread: protectedProcedure
    .input(z.object({ threadId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = assertTenantContext(ctx);
      return await ConversationThreadService.getThread(tenantId, input.threadId);
    }),

  /**
   * Assign or reassign thread to an internal employee
   */
  assignThread: protectedProcedure
    .input(
      z.object({
        threadId: z.string().min(1),
        targetUserId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = assertTenantContext(ctx);
      return await ConversationThreadService.assignThread(
        tenantId,
        userId,
        input.threadId,
        input.targetUserId
      );
    }),

  /**
   * Update conversation status
   */
  updateThreadStatus: protectedProcedure
    .input(
      z.object({
        threadId: z.string().min(1),
        status: z.nativeEnum(SlgThreadStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = assertTenantContext(ctx);
      return await ConversationThreadService.updateThreadStatus(
        tenantId,
        input.threadId,
        input.status
      );
    }),

  /**
   * Add internal agent whisper note
   */
  addThreadNote: protectedProcedure
    .input(
      z.object({
        threadId: z.string().min(1),
        noteText: z.string().min(1),
        isPrivate: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = assertTenantContext(ctx);
      return await ConversationThreadService.addThreadNote(
        tenantId,
        userId,
        input.threadId,
        input.noteText,
        input.isPrivate
      );
    }),

  /**
   * List approved WhatsApp templates
   */
  listTemplates: protectedProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = assertTenantContext(ctx);
      return await TemplateAutomationService.listTemplates(tenantId, input?.category);
    }),

  /**
   * Agent reply to customer thread
   */
  replyThread: protectedProcedure
    .input(
      z.object({
        threadId: z.string().min(1),
        messageBody: z.string().optional(),
        templateName: z.string().optional(),
        templateParams: z.record(z.any()).optional(),
        mediaUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = assertTenantContext(ctx);
      const thread = await ConversationThreadService.getThread(tenantId, input.threadId);

      const channel =
        thread.lastChannel === SlgChannelType.SMS ? SlgChannelType.SMS : SlgChannelType.WHATSAPP;

      if (channel === SlgChannelType.WHATSAPP) {
        return await TwoWayMessagingService.dispatchWhatsApp(tenantId, userId, {
          tenantId,
          channel,
          recipientPhone: thread.customerPhone,
          messageBody: input.messageBody,
          templateName: input.templateName,
          templateParams: input.templateParams,
          mediaUrl: input.mediaUrl,
        });
      } else {
        return await TwoWayMessagingService.dispatchSms(tenantId, userId, {
          tenantId,
          channel: SlgChannelType.SMS,
          recipientPhone: thread.customerPhone,
          messageBody: input.messageBody,
        });
      }
    }),

  /**
   * Schedule customer follow-up from conversation
   */
  scheduleFollowUp: protectedProcedure
    .input(
      z.object({
        threadId: z.string().min(1),
        scheduledAt: z.string().datetime(),
        notes: z.string().optional(),
        assignedUserId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = assertTenantContext(ctx);
      const thread = await ConversationThreadService.getThread(tenantId, input.threadId);

      const targetAgentId = input.assignedUserId || thread.assignedUserId || userId;

      // Create In-App Notification for Follow-Up
      const notif = await (db as any).notification.create({
        data: {
          userId: targetAgentId,
          title: "Follow-Up Scheduled",
          message: `Follow-up scheduled with ${thread.customerName || thread.customerPhone} on ${new Date(input.scheduledAt).toLocaleString()}`,
          type: "INFO",
          priority: "HIGH",
          metadata: { threadId: input.threadId, scheduledAt: input.scheduledAt },
        },
      });

      // Add Internal Note to Thread
      await ConversationThreadService.addThreadNote(
        tenantId,
        userId,
        input.threadId,
        `Follow-up scheduled for ${new Date(input.scheduledAt).toLocaleString()}. Note: ${input.notes || "None"}`,
        false
      );

      return { success: true, notificationId: notif.id };
    }),

  /**
   * Check 24-hour customer care service window
   */
  getServiceWindowStatus: protectedProcedure
    .input(z.object({ customerPhone: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = assertTenantContext(ctx);
      return await MessageEventService.get24HourServiceWindow(tenantId, input.customerPhone);
    }),

  /**
   * Direct message dispatch
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        channel: z.nativeEnum(SlgChannelType),
        recipientPhone: z.string().min(1),
        messageBody: z.string().optional(),
        templateName: z.string().optional(),
        templateParams: z.record(z.any()).optional(),
        mediaUrl: z.string().optional(),
        mediaMimeType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = assertTenantContext(ctx);
      if (input.channel === SlgChannelType.WHATSAPP) {
        return await TwoWayMessagingService.dispatchWhatsApp(tenantId, userId, {
          tenantId,
          ...input,
        });
      } else {
        return await TwoWayMessagingService.dispatchSms(tenantId, userId, {
          tenantId,
          ...input,
        });
      }
    }),
});
