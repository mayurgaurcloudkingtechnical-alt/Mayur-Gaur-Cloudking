import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";

export const ALLOWED_DISPOSITIONS = [
  "INTERESTED",
  "NOT_INTERESTED",
  "CALLBACK_REQUIRED",
  "NO_ANSWER",
  "BUSY",
  "WRONG_NUMBER",
  "FOLLOWUP_SCHEDULED",
  "CONVERTED",
] as const;

export type CallDisposition = (typeof ALLOWED_DISPOSITIONS)[number];

export interface SubmitDispositionInput {
  tenantId: string;
  actorUserId: string;
  callLogId: string;
  disposition: string;
  notes?: string;
  followUpNotes?: string;
  nextFollowUpAt?: Date;
  followUpAssignedToId?: string;
}

export class CallDispositionService {
  /**
   * Submits call disposition outcome and schedules optional CRM follow-up
   */
  static async submitDisposition(input: SubmitDispositionInput) {
    const callLog = await db.slgCallLog.findUnique({
      where: { id: input.callLogId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, reportingManagerId: true } },
      },
    });

    if (!callLog || callLog.tenantId !== input.tenantId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Call log not found in current tenant." });
    }

    const assignedAgentId = input.followUpAssignedToId || input.actorUserId;

    // Update Call Log with disposition and follow-up
    const updated = await db.slgCallLog.update({
      where: { id: input.callLogId },
      data: {
        disposition: input.disposition.toUpperCase(),
        notes: input.notes
          ? `${callLog.notes || ""}\n[${new Date().toLocaleTimeString()}]: ${input.notes}`.trim()
          : callLog.notes,
        nextFollowUpAt: input.nextFollowUpAt,
        followUpAssignedToId: assignedAgentId,
      },
    });

    // If Call is linked to a CRM Lead, record FollowUpHistory and LeadActivity
    if (callLog.leadId) {
      await db.leadActivity.create({
        data: {
          leadId: callLog.leadId,
          userId: input.actorUserId,
          activityType: "DISPOSITION_SUBMITTED",
          disposition: input.disposition.toUpperCase(),
          notes: input.notes || `Disposition updated to ${input.disposition}`,
        },
      });

      if (input.nextFollowUpAt) {
        await db.followUpHistory.create({
          data: {
            leadId: callLog.leadId,
            type: "CALL",
            notes: input.notes || `Follow-up scheduled from call disposition (${input.disposition})`,
            nextFollowUpDate: input.nextFollowUpAt,
            performedById: assignedAgentId,
          },
        });
      }
    }

    // Dispatch in-app notification if follow-up scheduled
    if (input.nextFollowUpAt) {
      const followUpDateStr = new Date(input.nextFollowUpAt).toLocaleString();
      const notificationTitle = `Follow-Up Scheduled: ${callLog.contactName}`;
      const notificationMessage = `Follow-up scheduled for ${followUpDateStr} with outcome: ${input.disposition}.`;

      // 1. Notify assigned agent
      await db.notification.create({
        data: {
          userId: assignedAgentId,
          title: notificationTitle,
          message: notificationMessage,
          type: "SYSTEM",
          priority: "NORMAL",
          link: `/admin/slg-call-intelligence?callId=${callLog.id}`,
        },
      });

      // 2. Notify manager if different
      if (callLog.user.reportingManagerId && callLog.user.reportingManagerId !== assignedAgentId) {
        await db.notification.create({
          data: {
            userId: callLog.user.reportingManagerId,
            title: `[Team Alert] ${notificationTitle}`,
            message: `Agent ${callLog.user.firstName} scheduled follow-up for ${followUpDateStr}.`,
            type: "SYSTEM",
            priority: "NORMAL",
          },
        });
      }
    }

    // Audit trail
    await db.slgAuditLog.create({
      data: {
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        action: "CALL_DISPOSITION_SUBMITTED",
        entityType: "SlgCallLog",
        entityId: callLog.id,
        details: {
          disposition: input.disposition,
          nextFollowUpAt: input.nextFollowUpAt,
          assignedTo: assignedAgentId,
        },
      },
    });

    return updated;
  }
}
