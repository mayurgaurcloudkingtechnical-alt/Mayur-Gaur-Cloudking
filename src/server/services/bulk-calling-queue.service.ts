import { db } from "@/server/db/client";
import {
  CallingBatchStatus,
  CallingQueueStatus,
  CallingOutcome,
} from "@prisma/client";
import { VoiceProviderFactory } from "./voice-providers/voice-provider.factory";
import { BulkCallingCrmIntegrationService } from "./bulk-calling-crm-integration.service";
import { normalizePhone } from "./crm-lead.service";

export class BulkCallingQueueService {
  // In-memory registry of actively executing batch loops to prevent duplicate execution
  private static activeBatchWorkers = new Set<string>();

  /**
   * Validates if current time is within permitted calling hours
   */
  public static isWithinCallingHours(startTime = "10:00", endTime = "19:00"): boolean {
    const now = new Date();
    // Convert to Indian Standard Time (IST, UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);

    const curHours = istDate.getUTCHours();
    const curMinutes = istDate.getUTCMinutes();
    const curTotalMinutes = curHours * 60 + curMinutes;

    const [startH, startM] = startTime.split(":").map((v) => parseInt(v, 10));
    const [endH, endM] = endTime.split(":").map((v) => parseInt(v, 10));

    const startTotalMinutes = (Number.isFinite(startH) ? startH : 10) * 60 + (Number.isFinite(startM) ? startM : 0);
    const endTotalMinutes = (Number.isFinite(endH) ? endH : 19) * 60 + (Number.isFinite(endM) ? endM : 0);

    return curTotalMinutes >= startTotalMinutes && curTotalMinutes <= endTotalMinutes;
  }

  /**
   * Starts calling a batch
   */
  public static async startBatch(batchId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const batch = await db.bulkCallingBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error(`Batch with ID ${batchId} not found`);
    }

    if (batch.status === CallingBatchStatus.RUNNING) {
      return { success: true, message: "Batch is already running" };
    }

    // Check calling hours
    if (!this.isWithinCallingHours(batch.callingHoursStart, batch.callingHoursEnd)) {
      return {
        success: false,
        message: `Current time is outside permitted calling hours (${batch.callingHoursStart} - ${batch.callingHoursEnd} IST). Batch will resume automatically during the next calling window.`,
      };
    }

    await db.bulkCallingBatch.update({
      where: { id: batchId },
      data: {
        status: CallingBatchStatus.RUNNING,
        startedAt: batch.startedAt || new Date(),
      },
    });

    await db.callingAuditLog.create({
      data: {
        batchId,
        userId,
        action: "BATCH_STARTED",
        details: { message: "AI outbound calling initiated" },
      },
    });

    // Trigger queue processing asynchronously (non-blocking)
    this.triggerQueueWorker(batchId, userId);

    return { success: true, message: "Calling queue started successfully" };
  }

  /**
   * Pauses an active batch
   */
  public static async pauseBatch(batchId: string, userId: string): Promise<{ success: boolean; message: string }> {
    await db.bulkCallingBatch.update({
      where: { id: batchId },
      data: {
        status: CallingBatchStatus.PAUSED,
      },
    });

    this.activeBatchWorkers.delete(batchId);

    await db.callingAuditLog.create({
      data: {
        batchId,
        userId,
        action: "BATCH_PAUSED",
        details: { message: "Calling queue paused by user" },
      },
    });

    return { success: true, message: "Calling queue paused" };
  }

  /**
   * Resumes a paused batch
   */
  public static async resumeBatch(batchId: string, userId: string): Promise<{ success: boolean; message: string }> {
    return this.startBatch(batchId, userId);
  }

  /**
   * Stops and terminates a batch
   */
  public static async stopBatch(batchId: string, userId: string): Promise<{ success: boolean; message: string }> {
    await db.bulkCallingBatch.update({
      where: { id: batchId },
      data: {
        status: CallingBatchStatus.STOPPED,
        completedAt: new Date(),
      },
    });

    this.activeBatchWorkers.delete(batchId);

    await db.callingAuditLog.create({
      data: {
        batchId,
        userId,
        action: "BATCH_STOPPED",
        details: { message: "Calling queue stopped permanently" },
      },
    });

    return { success: true, message: "Calling queue stopped" };
  }

  /**
   * Background Worker Trigger:
   * Runs sequentially item-by-item adhering to concurrency = 1
   */
  private static triggerQueueWorker(batchId: string, userId: string): void {
    if (this.activeBatchWorkers.has(batchId)) {
      return; // Worker already running for this batch
    }

    this.activeBatchWorkers.add(batchId);

    // Run in background without awaiting
    (async () => {
      try {
        await this.runSequentialQueue(batchId, userId);
      } catch (err) {
        console.error(`[AI Calling Queue Error] Batch ${batchId}:`, err);
      } finally {
        this.activeBatchWorkers.delete(batchId);
      }
    })();
  }

  /**
   * Sequential Queue Loop
   */
  private static async runSequentialQueue(batchId: string, userId: string): Promise<void> {
    while (true) {
      // 1. Refresh batch state to check if user paused or stopped it
      const batch = await db.bulkCallingBatch.findUnique({
        where: { id: batchId },
      });

      if (!batch || batch.status !== CallingBatchStatus.RUNNING) {
        break; // Stop loop if status is no longer RUNNING
      }

      // 2. Calling hours check
      if (!this.isWithinCallingHours(batch.callingHoursStart, batch.callingHoursEnd)) {
        await db.bulkCallingBatch.update({
          where: { id: batchId },
          data: { status: CallingBatchStatus.PAUSED },
        });
        await db.callingAuditLog.create({
          data: {
            batchId,
            userId,
            action: "BATCH_PAUSED_OUTSIDE_HOURS",
            details: { message: "Calling queue automatically paused outside permitted calling hours" },
          },
        });
        break;
      }

      // 3. Fetch next queue item:
      // Either QUEUED or RETRYING where nextRetryAt <= now
      const nextItem = await db.callingQueueItem.findFirst({
        where: {
          batchId,
          OR: [
            { status: CallingQueueStatus.QUEUED },
            {
              status: CallingQueueStatus.RETRYING,
              nextRetryAt: { lte: new Date() },
            },
          ],
        },
        orderBy: { queuePosition: "asc" },
      });

      // If no more items in queue, batch is complete!
      if (!nextItem) {
        await db.bulkCallingBatch.update({
          where: { id: batchId },
          data: {
            status: CallingBatchStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        await db.callingAuditLog.create({
          data: {
            batchId,
            userId,
            action: "BATCH_COMPLETED",
            details: { message: "All eligible leads processed in calling queue" },
          },
        });
        break;
      }

      // 4. Execute the call for this item
      await this.processSingleCallItem(nextItem.id, batch, userId);

      // Brief delay between sequential calls to simulate natural gap (1.5 seconds)
      await new Promise((res) => setTimeout(res, 1500));
    }
  }

  /**
   * Processes a single call item
   */
  public static async processSingleCallItem(
    queueItemId: string,
    batch: any,
    userId: string
  ): Promise<void> {
    const item = await db.callingQueueItem.findUnique({
      where: { id: queueItemId },
    });

    if (!item) return;

    // Check compliance (DNC & Consent)
    const cleanPhone = normalizePhone(item.phone);
    const isDnc = await db.doNotCallNumber.findUnique({
      where: { phone: cleanPhone },
    });

    if (isDnc || !item.consentGiven) {
      await db.callingQueueItem.update({
        where: { id: item.id },
        data: {
          status: CallingQueueStatus.DO_NOT_CALL,
          skipReason: isDnc ? "Registered in Do-Not-Call registry" : "Consent declined",
        },
      });
      return;
    }

    // Mark as CALLING
    await db.callingQueueItem.update({
      where: { id: item.id },
      data: {
        status: CallingQueueStatus.CALLING,
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });

    // Obtain provider and initiate call
    const provider = VoiceProviderFactory.getProvider(batch.voiceProvider);
    const response = await provider.makeCall({
      queueItemId: item.id,
      batchId: batch.id,
      leadName: item.name || undefined,
      phone: item.phone,
      courseTitle: item.course || undefined,
      language: batch.language || "Hindi",
      openingScript: batch.openingScript || undefined,
      systemPrompt: batch.systemPrompt || undefined,
    });

    if (response.success && response.result) {
      const res = response.result;

      // Update queue item with call outcome and extracted insights
      await db.callingQueueItem.update({
        where: { id: item.id },
        data: {
          status: CallingQueueStatus.COMPLETED,
          callOutcome: res.callOutcome,
          interestLevel: res.interestLevel,
          education: res.education,
          experience: res.experience,
          careerGoal: res.careerGoal,
          budget: res.budget,
          learningMode: res.learningMode,
          preferredBatch: res.preferredBatch,
          callbackTime: res.callbackTime,
          callbackTimeText: res.callbackTimeText,
          humanHandoffRequired: res.humanHandoffRequired,
          handoffReason: res.handoffReason,
          conversationSummary: res.conversationSummary,
          transcript: res.transcript as any,
          callDurationSeconds: res.durationSeconds,
          providerCallId: response.providerCallId,
        },
      });

      // Synchronize results to LMS CRM (create or update lead, timeline, follow-up)
      try {
        await BulkCallingCrmIntegrationService.syncCallResultToCrm({
          queueItemId: item.id,
          batchId: batch.id,
          result: res,
          performerUserId: userId,
        });
      } catch (crmErr) {
        console.error("[CRM Sync Error]:", crmErr);
      }

      // Update metrics on batch
      const outcome = res.callOutcome;
      await db.bulkCallingBatch.update({
        where: { id: batch.id },
        data: {
          completedCalls: { increment: 1 },
          interestedCount:
            outcome === CallingOutcome.INTERESTED || outcome === CallingOutcome.ADMISSION_INTEREST
              ? { increment: 1 }
              : undefined,
          followUpCount:
            outcome === CallingOutcome.FOLLOW_UP_REQUIRED || outcome === CallingOutcome.CALLBACK_REQUESTED
              ? { increment: 1 }
              : undefined,
          humanHandoffCount: res.humanHandoffRequired ? { increment: 1 } : undefined,
          notInterestedCount: outcome === CallingOutcome.NOT_INTERESTED ? { increment: 1 } : undefined,
          noAnswerCount: outcome === CallingOutcome.NO_ANSWER ? { increment: 1 } : undefined,
          busyCount: outcome === CallingOutcome.BUSY ? { increment: 1 } : undefined,
        },
      });
    } else {
      // Call Failed or Busy -> Check Retry policy
      const attempts = (item.attemptCount || 0) + 1;
      const maxRetries = batch.maxRetries || 3;

      if (attempts < maxRetries) {
        const retryDelayMs = (batch.retryDelayMinutes || 30) * 60 * 1000;
        await db.callingQueueItem.update({
          where: { id: item.id },
          data: {
            status: CallingQueueStatus.RETRYING,
            nextRetryAt: new Date(Date.now() + retryDelayMs),
            skipReason: response.error || "Temporary connection failure, queued for retry",
          },
        });
      } else {
        await db.callingQueueItem.update({
          where: { id: item.id },
          data: {
            status: CallingQueueStatus.FAILED,
            skipReason: response.error || "Exceeded maximum retry attempts",
          },
        });

        await db.bulkCallingBatch.update({
          where: { id: batch.id },
          data: {
            failedCount: { increment: 1 },
          },
        });
      }
    }
  }

  /**
   * Crash Recovery: Safe startup resumption
   */
  public static async recoverFromCrash(): Promise<void> {
    // Reset any items that were stuck in CALLING during an unexpected shutdown
    await db.callingQueueItem.updateMany({
      where: { status: CallingQueueStatus.CALLING },
      data: { status: CallingQueueStatus.QUEUED },
    });
  }
}
