/**
 * Unified Conversation Thread Service (Phase 4.1)
 * SLG CALL INTELLIGENCE — Powered by SOFTLAB GLOBAL
 * Manages customer conversation threads across WhatsApp, SMS, and Voice.
 * Strict boundary: File size <= 350 lines
 */

import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import {
  SlgChannelType,
  SlgThreadStatus,
  ConversationThreadFilter,
} from "./types";

export class ConversationThreadService {
  /**
   * Normalizes customer phone numbers to clean E.164
   */
  static normalizePhoneNumber(phone: string): string {
    const cleaned = (phone || "").replace(/[^0-9+]/g, "");
    if (!cleaned) return "UNKNOWN";
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith("91")) return `+${cleaned}`;
    return `+${cleaned}`;
  }

  /**
   * Resolves or initializes an active conversation thread for a customer
   */
  static async getOrCreateThread(
    tenantId: string,
    customerPhone: string,
    customerName?: string,
    channel: SlgChannelType = SlgChannelType.WHATSAPP,
    leadId?: string
  ) {
    if (!tenantId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "tenantId is required" });
    }

    const normalizedPhone = this.normalizePhoneNumber(customerPhone);

    // 1. Check existing thread
    let thread = await (db as any).slgConversationThread.findFirst({
      where: {
        tenantId,
        customerPhone: normalizedPhone,
      },
      include: {
        assignedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        lead: { select: { id: true, fullName: true, phone: true } },
      },
    });

    if (thread) {
      if (customerName && !thread.customerName) {
        thread = await (db as any).slgConversationThread.update({
          where: { id: thread.id },
          data: { customerName },
        });
      }
      return thread;
    }

    // 2. Resolve matching lead if leadId wasn't passed
    let resolvedLeadId = leadId;
    let resolvedCustomerName = customerName;

    if (!resolvedLeadId) {
      const plainDigits = normalizedPhone.replace(/^\+/, "");
      const national10 = plainDigits.slice(-10);
      const matchedLead = await (db as any).lead.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            { phone: national10 },
            { phone: `0${national10}` },
          ],
        },
        select: { id: true, fullName: true },
        orderBy: { updatedAt: "desc" },
      });

      if (matchedLead) {
        resolvedLeadId = matchedLead.id;
        resolvedCustomerName = resolvedCustomerName || matchedLead.fullName;
      }
    }

    // 3. Create new conversation thread
    return await (db as any).slgConversationThread.create({
      data: {
        tenantId,
        leadId: resolvedLeadId || null,
        customerPhone: normalizedPhone,
        customerName: resolvedCustomerName || null,
        status: SlgThreadStatus.OPEN,
        lastChannel: channel,
        lastMessageAt: new Date(),
        unreadCount: 0,
      },
      include: {
        assignedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        lead: { select: { id: true, fullName: true, phone: true } },
      },
    });
  }

  /**
   * Assigns thread to an internal employee
   */
  static async assignThread(
    tenantId: string,
    actorUserId: string,
    threadId: string,
    targetUserId: string | null
  ) {
    const thread = await (db as any).slgConversationThread.findFirst({
      where: { id: threadId, tenantId },
    });

    if (!thread) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Conversation thread not found" });
    }

    if (targetUserId) {
      const user = await (db as any).user.findFirst({
        where: { id: targetUserId, tenantId },
      });
      if (!user) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Target employee not found in tenant" });
      }
    }

    const updated = await (db as any).slgConversationThread.update({
      where: { id: threadId },
      data: {
        assignedUserId: targetUserId,
        status: targetUserId ? SlgThreadStatus.ASSIGNED : SlgThreadStatus.OPEN,
      },
      include: {
        assignedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await (db as any).slgAuditLog.create({
      data: {
        tenantId,
        actorUserId,
        action: "THREAD_ASSIGNED",
        entityType: "SlgConversationThread",
        entityId: threadId,
        details: { targetUserId },
      },
    });

    return updated;
  }

  /**
   * Updates conversation thread status
   */
  static async updateThreadStatus(
    tenantId: string,
    threadId: string,
    status: SlgThreadStatus
  ) {
    const thread = await (db as any).slgConversationThread.findFirst({
      where: { id: threadId, tenantId },
    });

    if (!thread) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Conversation thread not found" });
    }

    return await (db as any).slgConversationThread.update({
      where: { id: threadId },
      data: { status },
    });
  }

  /**
   * Adds an internal private whisper note to a thread
   */
  static async addThreadNote(
    tenantId: string,
    actorUserId: string,
    threadId: string,
    noteText: string,
    isPrivate = true
  ) {
    const thread = await (db as any).slgConversationThread.findFirst({
      where: { id: threadId, tenantId },
    });

    if (!thread) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Conversation thread not found" });
    }

    return await (db as any).slgThreadNote.create({
      data: {
        threadId,
        authorUserId: actorUserId,
        noteText: noteText.trim(),
        isPrivate,
      },
      include: {
        authorUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  /**
   * Lists conversation threads with filtering and pagination
   */
  static async listThreads(tenantId: string, filters: ConversationThreadFilter = {}) {
    const where: any = { tenantId };

    if (filters.status) where.status = filters.status;
    if (filters.assignedUserId) where.assignedUserId = filters.assignedUserId;
    if (filters.channel) where.lastChannel = filters.channel;
    if (filters.unreadOnly) where.unreadCount = { gt: 0 };

    if (filters.search) {
      const search = filters.search.trim();
      where.OR = [
        { customerPhone: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { lastMessageSnippet: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      (db as any).slgConversationThread.findMany({
        where,
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: { lastMessageAt: "desc" },
        include: {
          assignedUser: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, fullName: true, phone: true } },
          notes: {
            take: 3,
            orderBy: { createdAt: "desc" },
            include: { authorUser: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      (db as any).slgConversationThread.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Retrieves single thread with full message history and notes
   */
  static async getThread(tenantId: string, threadId: string) {
    const thread = await (db as any).slgConversationThread.findFirst({
      where: { id: threadId, tenantId },
      include: {
        assignedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        lead: { select: { id: true, fullName: true, phone: true, email: true } },
        messages: {
          take: 100,
          orderBy: { sentAt: "asc" },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          include: { authorUser: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!thread) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Conversation thread not found" });
    }

    // Reset unread count on view
    if (thread.unreadCount > 0) {
      await (db as any).slgConversationThread.update({
        where: { id: threadId },
        data: { unreadCount: 0 },
      });
    }

    return thread;
  }
}
