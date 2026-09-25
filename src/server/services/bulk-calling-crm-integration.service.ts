import { db } from "@/server/db/client";
import {
  LeadStatus,
  LeadSource,
  FollowUpType,
  NotificationType,
  NotificationPriority,
  CallingOutcome,
} from "@prisma/client";
import { ExtractedCallResult } from "./ai-calling-agent.service";
import { normalizePhone } from "./crm-lead.service";

export interface SyncCallResultInput {
  queueItemId: string;
  batchId: string;
  result: ExtractedCallResult;
  performerUserId: string;
}

export class BulkCallingCrmIntegrationService {
  /**
   * Synchronizes AI call results into LMS CRM:
   * - Prevents duplicate leads (updates existing lead if phone matches)
   * - Creates new lead if meaningful inquiry and no prior lead exists
   * - Appends timeline activity to lead
   * - Schedules follow-up tasks
   * - Dispatches human handoff alerts
   */
  public static async syncCallResultToCrm(input: SyncCallResultInput): Promise<{ leadId?: string; isExisting: boolean }> {
    const queueItem = await db.callingQueueItem.findUnique({
      where: { id: input.queueItemId },
      include: {
        batch: true,
      },
    });

    if (!queueItem) {
      throw new Error(`Queue item ${input.queueItemId} not found for CRM sync`);
    }

    const cleanPhone = normalizePhone(queueItem.phone);
    const result = input.result;

    // 1. Search for an existing lead by primary matching (phone)
    const existingLead = await db.lead.findFirst({
      where: {
        phone: cleanPhone,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        status: true,
        notes: true,
      },
    });

    let leadId: string | undefined;
    let isExisting = false;

    if (existingLead) {
      // =======================================================================
      // CASE A: EXISTING LEAD MATCHED -> UPDATE TIMELINE & PREVENT DUPLICATE
      // =======================================================================
      leadId = existingLead.id;
      isExisting = true;

      // Determine updated status
      let updatedStatus = existingLead.status;
      if (result.callOutcome === CallingOutcome.INTERESTED || result.callOutcome === CallingOutcome.ADMISSION_INTEREST) {
        updatedStatus = LeadStatus.INTERESTED;
      } else if (result.callOutcome === CallingOutcome.FOLLOW_UP_REQUIRED || result.callOutcome === CallingOutcome.CALLBACK_REQUESTED) {
        updatedStatus = LeadStatus.FOLLOW_UP;
      } else if (result.callOutcome === CallingOutcome.NOT_INTERESTED) {
        updatedStatus = LeadStatus.LOST;
      }

      // Update existing lead record
      await db.lead.update({
        where: { id: existingLead.id },
        data: {
          status: updatedStatus,
          qualityScore: result.interestLevel,
          notes: `${existingLead.notes ? existingLead.notes + "\n\n" : ""}[AI Call - ${new Date().toLocaleDateString("en-IN")}]: ${result.conversationSummary}`,
          nextFollowUp: result.callbackTime || undefined,
        },
      });

      // Append LeadActivity timeline
      await db.leadActivity.create({
        data: {
          leadId: existingLead.id,
          userId: input.performerUserId,
          activityType: "AI_CALL_COMPLETED",
          disposition: result.callOutcome,
          notes: `SoftLab Global AI Call (${result.durationSeconds}s) - Outcome: ${result.callOutcome} (${result.interestLevel}). Summary: ${result.conversationSummary} | Next: ${result.recommendedAction}`,
        },
      });
    } else {
      // =======================================================================
      // CASE B: NEW LEAD -> CREATE CRM LEAD IF INQUIRY IS MEANINGFUL
      // =======================================================================
      const shouldCreateLead =
        result.callOutcome !== CallingOutcome.NOT_INTERESTED &&
        result.callOutcome !== CallingOutcome.INVALID_NUMBER &&
        result.callOutcome !== CallingOutcome.WRONG_NUMBER;

      if (shouldCreateLead) {
        // Resolve course ID if possible
        let matchedCourseId: string | null = null;
        if (queueItem.course) {
          const course = await db.course.findFirst({
            where: {
              OR: [
                { id: queueItem.course },
                { title: { contains: queueItem.course, mode: "insensitive" } },
              ],
            },
            select: { id: true },
          });
          matchedCourseId = course?.id || null;
        }

        const newStatus =
          result.callOutcome === CallingOutcome.INTERESTED || result.callOutcome === CallingOutcome.ADMISSION_INTEREST
            ? LeadStatus.INTERESTED
            : LeadStatus.NEW;

        const newLead = await db.lead.create({
          data: {
            fullName: (queueItem.name || "Prospective Learner").trim(),
            email: queueItem.email || `${cleanPhone}@lead.softlabglobal.com`,
            phone: cleanPhone,
            city: queueItem.city || null,
            qualification: result.education || null,
            source: LeadSource.AI_CALLING,
            campaignName: queueItem.campaign || queueItem.batch.batchName,
            status: newStatus,
            qualityScore: result.interestLevel,
            interestedCourseId: matchedCourseId,
            notes: `Generated via Bulk AI Calling Batch: "${queueItem.batch.batchName}".\nSummary: ${result.conversationSummary}\nAction: ${result.recommendedAction}`,
            nextFollowUp: result.callbackTime || null,
            assignedTelecallerId: queueItem.batch.assignedToId || queueItem.batch.uploadedById,
            createdById: input.performerUserId,
          },
        });

        leadId = newLead.id;
        isExisting = false;

        // Create initial timeline activity
        await db.leadActivity.create({
          data: {
            leadId: newLead.id,
            userId: input.performerUserId,
            activityType: "AI_CALL_INGESTED",
            disposition: result.callOutcome,
            notes: `AI Outbound Call Connected (${result.durationSeconds}s). Outcome: ${result.callOutcome}. ${result.conversationSummary}`,
          },
        });
      }
    }

    // Link queue item to the resolved or created lead
    if (leadId) {
      await db.callingQueueItem.update({
        where: { id: input.queueItemId },
        data: {
          leadId,
          isExistingLead: isExisting,
        },
      });

      // 3. Create Follow-Up Task if callback was requested
      if (result.callbackTime || result.callOutcome === CallingOutcome.FOLLOW_UP_REQUIRED) {
        await db.followUpHistory.create({
          data: {
            leadId,
            type: FollowUpType.CALL,
            notes: `AI Scheduled Follow-up: ${result.callbackTimeText || "Callback requested"}. Reason: ${result.conversationSummary}`,
            nextFollowUpDate: result.callbackTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
            performedById: input.performerUserId,
          },
        });
      }

      // 4. Create Human Handoff Notification if requested
      if (result.humanHandoffRequired) {
        const targetUserId = queueItem.batch.assignedToId || queueItem.batch.uploadedById;
        await db.notification.create({
          data: {
            userId: targetUserId,
            type: NotificationType.SYSTEM,
            priority: NotificationPriority.HIGH,
            title: `🚨 Human Handoff Required: ${queueItem.name || cleanPhone}`,
            message: `Lead requested human assistance. Reason: ${result.handoffReason || "Counselor callback required"}. AI Summary: ${result.conversationSummary}`,
            link: `/counselor/leads/${leadId}`,
          },
        });
      }
    }

    return { leadId, isExisting };
  }
}
