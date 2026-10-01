import { db } from "@/server/db/client";

export interface RecordTimelineEventParams {
  leadId: string;
  eventType: string; // e.g. "WEB_ENQUIRY", "WHATSAPP_INBOUND", "WHATSAPP_OUTBOUND", "AI_VOICE_CALL", "COUNSELOR_NOTE", "PAYMENT_LINK_SENT", "PAYMENT_RECEIVED", "ADMISSION_CONFIRMED", "LMS_ENROLLED", "ESCALATION"
  source: string; // e.g. "WEBSITE", "WHATSAPP", "AI_CALLING", "RAZORPAY", "LMS", "COUNSELOR"
  title: string;
  summary?: string;
  metadata?: any;
  actorId?: string;
}

export interface AddMessageParams {
  conversationId: string;
  senderType: "LEAD" | "AI_AGENT" | "STAFF" | "SYSTEM";
  senderName?: string;
  channel: "WHATSAPP" | "WEB_CHAT" | "VOICE_CALL";
  messageType?: "TEXT" | "TEMPLATE" | "MEDIA" | "BUTTON_REPLY" | "TRANSCRIPT" | "PAYMENT_LINK";
  content: string;
  mediaUrl?: string;
  externalMsgId?: string;
  rawPayload?: any;
  metadata?: any;
}

export class OmnichannelInboxService {
  /**
   * Record a 360° unified chronological timeline event on the central Lead
   */
  public static async recordTimelineEvent(params: RecordTimelineEventParams) {
    const event = await db.customerTimelineEvent.create({
      data: {
        leadId: params.leadId,
        eventType: params.eventType,
        source: params.source,
        title: params.title,
        summary: params.summary,
        metadata: params.metadata || {},
        actorId: params.actorId,
      },
    });

    // Also update lead's lastInteraction
    await db.lead.update({
      where: { id: params.leadId },
      data: { lastInteraction: new Date() },
    });

    return event;
  }

  /**
   * Get or create a unified omnichannel conversation thread for a lead
   */
  public static async getOrCreateConversation(
    leadId: string,
    channel: "WHATSAPP" | "WEB_CHAT" | "VOICE_CALL",
    externalThreadId?: string
  ) {
    let conversation = await db.omnichannelConversation.findFirst({
      where: {
        leadId,
        channel,
      },
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            status: true,
            temperature: true,
            leadScore: true,
            course: { select: { title: true } },
          },
        },
      },
    });

    if (!conversation) {
      conversation = await db.omnichannelConversation.create({
        data: {
          leadId,
          channel,
          externalThreadId: externalThreadId || undefined,
          status: "AI_HANDLING",
          unreadCount: 0,
        },
        include: {
          lead: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              status: true,
              temperature: true,
              leadScore: true,
              course: { select: { title: true } },
            },
          },
        },
      });
    }

    return conversation;
  }

  /**
   * Append a message to an active conversation and update timeline
   */
  public static async addMessage(params: AddMessageParams) {
    const msg = await db.omnichannelMessage.create({
      data: {
        conversationId: params.conversationId,
        senderType: params.senderType,
        senderName: params.senderName,
        channel: params.channel,
        messageType: params.messageType || "TEXT",
        content: params.content,
        mediaUrl: params.mediaUrl,
        externalMsgId: params.externalMsgId,
        rawPayload: params.rawPayload,
        metadata: params.metadata || {},
      },
    });

    const isFromLead = params.senderType === "LEAD";

    // Update conversation metadata
    const conversation = await db.omnichannelConversation.update({
      where: { id: params.conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadCount: isFromLead ? { increment: 1 } : undefined,
      },
      include: { lead: true },
    });

    // Mirror to CustomerTimelineEvent
    await this.recordTimelineEvent({
      leadId: conversation.leadId,
      eventType: isFromLead ? `${params.channel}_INBOUND` : `${params.channel}_OUTBOUND`,
      source: params.channel,
      title: isFromLead ? `Inbound Message (${params.channel})` : `Outbound Message (${params.channel})`,
      summary: params.content.length > 200 ? `${params.content.slice(0, 200)}...` : params.content,
      metadata: {
        messageId: msg.id,
        senderType: params.senderType,
        channel: params.channel,
      },
    });

    return msg;
  }

  /**
   * Human counselor takes over from AI
   */
  public static async takeoverConversation(conversationId: string, staffId: string) {
    const updated = await db.omnichannelConversation.update({
      where: { id: conversationId },
      data: {
        status: "NEEDS_HUMAN",
        assignedStaffId: staffId,
        unreadCount: 0,
      },
      include: { lead: true },
    });

    await this.recordTimelineEvent({
      leadId: updated.leadId,
      eventType: "COUNSELOR_TAKEOVER",
      source: "COUNSELOR",
      title: "Human Counselor Takeover",
      summary: `Counselor took over the omnichannel conversation from the AI assistant.`,
      actorId: staffId,
    });

    return updated;
  }

  /**
   * Mark conversation as resolved / returned to AI
   */
  public static async resolveConversation(conversationId: string, returnToAi = true) {
    const updated = await db.omnichannelConversation.update({
      where: { id: conversationId },
      data: {
        status: returnToAi ? "AI_HANDLING" : "CLOSED",
        unreadCount: 0,
      },
      include: { lead: true },
    });

    return updated;
  }

  /**
   * List unified inbox conversations with filters
   */
  public static async listConversations(params?: {
    channel?: string;
    status?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }) {
    const where: any = {};
    if (params?.channel && params.channel !== "ALL") {
      where.channel = params.channel;
    }
    if (params?.status && params.status !== "ALL") {
      where.status = params.status;
    }
    if (params?.search) {
      where.lead = {
        OR: [
          { fullName: { contains: params.search, mode: "insensitive" } },
          { phone: { contains: params.search } },
          { email: { contains: params.search, mode: "insensitive" } },
        ],
      };
    }

    const conversations = await db.omnichannelConversation.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            status: true,
            temperature: true,
            leadScore: true,
            paymentStatus: true,
            lmsStatus: true,
            course: { select: { title: true } },
          },
        },
        assignedStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            roleCode: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: params?.limit || 50,
      skip: params?.skip || 0,
    });

    return conversations;
  }

  /**
   * Fetch conversation with its full message history
   */
  public static async getConversationDetails(conversationId: string) {
    return db.omnichannelConversation.findUnique({
      where: { id: conversationId },
      include: {
        lead: {
          include: {
            course: true,
            batch: true,
            assignedCounselor: { select: { id: true, firstName: true, lastName: true, email: true } },
            applications: {
              include: {
                payments: true,
                convertedStudentProfile: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  /**
   * Fetch complete 360° chronological customer timeline for a lead
   */
  public static async getCustomerTimeline(leadId: string) {
    return db.customerTimelineEvent.findMany({
      where: { leadId },
      include: {
        actor: {
          select: { id: true, firstName: true, lastName: true, roleCode: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
