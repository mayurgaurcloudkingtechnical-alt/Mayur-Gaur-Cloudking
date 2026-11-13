/**
 * Unified Message Event Ingestion & Dispatch Service (Phase 4.1)
 * SLG CALL INTELLIGENCE — Powered by SOFTLAB GLOBAL
 * Handles message idempotency, 24h care window calculation, and omnichannel delivery receipts.
 * Strict boundary: File size <= 350 lines
 */

import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import {
  NormalizedMessageEvent,
  SendMessageInput,
  SendMessageResult,
  ServiceWindowStatus,
  SlgChannelType,
  SlgMessageDirection,
  SlgMessageStatus,
} from "./types";
import { ConversationThreadService } from "./conversation-thread.service";
import { CommunicationConfigService } from "./communication-config.service";
import { CommunicationProviderRegistry } from "./provider-registry";

export class MessageEventService {
  /**
   * Calculates Meta 24-hour customer service care window
   */
  static async get24HourServiceWindow(
    tenantId: string,
    customerPhone: string
  ): Promise<ServiceWindowStatus> {
    const normalizedPhone = ConversationThreadService.normalizePhoneNumber(customerPhone);

    const latestInbound = await (db as any).slgMessageEvent.findFirst({
      where: {
        tenantId,
        channel: SlgChannelType.WHATSAPP,
        direction: SlgMessageDirection.INBOUND,
        senderPhone: normalizedPhone,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestInbound) {
      return {
        isWindowOpen: false,
        windowExpiresAt: null,
        remainingMinutes: 0,
        canSendFreeForm: false,
      };
    }

    const windowDurationMs = 24 * 60 * 60 * 1000;
    const expiresAt = new Date(latestInbound.createdAt.getTime() + windowDurationMs);
    const now = new Date();
    const remainingMs = expiresAt.getTime() - now.getTime();

    if (remainingMs <= 0) {
      return {
        isWindowOpen: false,
        windowExpiresAt: expiresAt,
        remainingMinutes: 0,
        canSendFreeForm: false,
      };
    }

    return {
      isWindowOpen: true,
      windowExpiresAt: expiresAt,
      remainingMinutes: Math.floor(remainingMs / (60 * 1000)),
      canSendFreeForm: true,
    };
  }

  /**
   * Ingests normalized message event with strict idempotency and thread reconciliation
   */
  static async ingestMessageEvent(
    tenantId: string,
    event: NormalizedMessageEvent
  ) {
    if (!tenantId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "tenantId is required" });
    }

    // 1. Idempotency Check by externalMessageId
    if (event.externalMessageId) {
      const existing = await (db as any).slgMessageEvent.findFirst({
        where: {
          tenantId,
          externalMessageId: event.externalMessageId,
        },
      });

      if (existing) {
        // Status update / Delivery receipt reconciliation
        if (event.status && event.status !== existing.status) {
          return await (db as any).slgMessageEvent.update({
            where: { id: existing.id },
            data: {
              status: event.status,
              deliveredAt: event.deliveredAt || (event.status === SlgMessageStatus.DELIVERED ? new Date() : existing.deliveredAt),
              readAt: event.readAt || (event.status === SlgMessageStatus.READ ? new Date() : existing.readAt),
              errorCode: event.errorCode || existing.errorCode,
              errorMessage: event.errorMessage || existing.errorMessage,
            },
          });
        }
        return existing;
      }
    }

    // 2. Resolve target thread
    const customerPhone =
      event.direction === SlgMessageDirection.INBOUND
        ? event.senderPhone
        : event.recipientPhone;

    let threadId = event.threadId;
    if (!threadId) {
      const thread = await ConversationThreadService.getOrCreateThread(
        tenantId,
        customerPhone,
        undefined,
        event.channel
      );
      threadId = thread.id;
    }

    // 3. Create message event
    const createdEvent = await (db as any).slgMessageEvent.create({
      data: {
        threadId,
        tenantId,
        channel: event.channel,
        direction: event.direction,
        status: event.status,
        senderPhone: event.senderPhone,
        recipientPhone: event.recipientPhone,
        messageBody: event.messageBody,
        templateName: event.templateName || null,
        templateParams: event.templateParams || null,
        externalMessageId: event.externalMessageId || null,
        mediaUrl: event.mediaUrl || null,
        mediaMimeType: event.mediaMimeType || null,
        mediaSizeBytes: event.mediaSizeBytes || null,
        errorCode: event.errorCode || null,
        errorMessage: event.errorMessage || null,
        sentAt: event.sentAt || new Date(),
        deliveredAt: event.deliveredAt || null,
        readAt: event.readAt || null,
        rawMetadata: event.rawMetadata || null,
      },
    });

    // 4. Update parent thread metadata
    const snippet = (event.messageBody || "[Media]").slice(0, 480);
    const isIncoming = event.direction === SlgMessageDirection.INBOUND;

    await (db as any).slgConversationThread.update({
      where: { id: threadId },
      data: {
        lastChannel: event.channel,
        lastMessageAt: createdEvent.sentAt,
        lastMessageSnippet: snippet,
        unreadCount: isIncoming ? { increment: 1 } : undefined,
      },
    });

    return createdEvent;
  }

  /**
   * Dispatches outbound message via official provider and records event
   */
  static async sendMessage(
    tenantId: string,
    actorUserId: string,
    input: SendMessageInput
  ): Promise<SendMessageResult> {
    if (!tenantId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "tenantId is required" });
    }

    const normalizedRecipient = ConversationThreadService.normalizePhoneNumber(input.recipientPhone);

    // Enforce 24-Hour Customer Care Window for WhatsApp Free-Form Messages
    if (input.channel === SlgChannelType.WHATSAPP && !input.templateName) {
      const windowStatus = await this.get24HourServiceWindow(tenantId, normalizedRecipient);
      if (!windowStatus.isWindowOpen) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Outside 24-hour customer care service window. An approved WhatsApp business template is required to initiate contact.",
        });
      }
    }

    let dispatchResult: SendMessageResult;

    if (input.channel === SlgChannelType.WHATSAPP) {
      const { config, decryptedToken } = await CommunicationConfigService.getWhatsAppConfig(tenantId, true);
      if (!config || !decryptedToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "WhatsApp Business credentials not configured for tenant.",
        });
      }

      const provider = CommunicationProviderRegistry.getWhatsAppProvider();
      dispatchResult = await provider.sendMessage(config, decryptedToken, input);
    } else if (input.channel === SlgChannelType.SMS) {
      const { config, decryptedApiKey } = await CommunicationConfigService.getSmsConfig(tenantId, true);
      if (!config) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "SMS Gateway not configured for tenant.",
        });
      }

      const provider = CommunicationProviderRegistry.getSmsProvider(config.primaryProvider);
      dispatchResult = await provider.sendSms(config, decryptedApiKey || null, input);
    } else {
      throw new TRPCError({ code: "BAD_REQUEST", message: `Unsupported channel: ${input.channel}` });
    }

    if (dispatchResult.success) {
      await this.ingestMessageEvent(tenantId, {
        externalMessageId: dispatchResult.externalMessageId,
        channel: input.channel,
        direction: SlgMessageDirection.OUTBOUND,
        status: dispatchResult.status,
        senderPhone: "BUSINESS",
        recipientPhone: normalizedRecipient,
        messageBody: input.messageBody || (input.templateName ? `[Template: ${input.templateName}]` : ""),
        templateName: input.templateName,
        templateParams: input.templateParams,
        mediaUrl: input.mediaUrl,
        mediaMimeType: input.mediaMimeType,
      });

      await (db as any).slgAuditLog.create({
        data: {
          tenantId,
          actorUserId,
          action: "MESSAGE_SENT",
          entityType: "SlgMessageEvent",
          entityId: dispatchResult.externalMessageId || "UNKNOWN",
          details: { channel: input.channel, recipient: normalizedRecipient },
        },
      });
    }

    return dispatchResult;
  }
}
