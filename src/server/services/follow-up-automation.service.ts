import { db } from "@/server/db/client";
import { WhatsAppBusinessService } from "./whatsapp-business.service";
import { OmnichannelInboxService } from "./omnichannel-inbox.service";

export interface SequenceStep {
  stepNumber: number;
  delayMinutes: number;
  channel: "WHATSAPP" | "AI_CALL" | "TASK";
  templateCode: string;
  description: string;
}

export class FollowUpAutomationService {
  /**
   * Enroll a lead into an automated follow-up cadence
   */
  public static async enrollLeadInSequence(leadId: string, sequenceCode = "DEFAULT_ADMISSIONS_DRIP") {
    // 1. Check if lead is opted out or already enrolled
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: { course: true },
    });

    if (!lead || lead.isOptedOut || lead.status === "ADMITTED") {
      return null;
    }

    // 2. Find or create default sequence
    let sequence = await db.automationSequence.findUnique({
      where: { code: sequenceCode },
    });

    if (!sequence) {
      const defaultSteps: SequenceStep[] = [
        {
          stepNumber: 1,
          delayMinutes: 0,
          channel: "WHATSAPP",
          templateCode: "WELCOME_BROCHURE",
          description: "Instant WhatsApp Welcome & Course Syllabus Brochure",
        },
        {
          stepNumber: 2,
          delayMinutes: 1440, // 24 hours
          channel: "AI_CALL",
          templateCode: "VOICE_QUALIFICATION",
          description: "Automated AI Academic Counselor Voice Qualification Call",
        },
        {
          stepNumber: 3,
          delayMinutes: 4320, // 72 hours
          channel: "WHATSAPP",
          templateCode: "FEE_SCHOLARSHIP_OFFER",
          description: "WhatsApp Merit Scholarship & EMI Breakdown",
        },
      ];

      sequence = await db.automationSequence.create({
        data: {
          name: "Standard Admissions Nurture Cadence",
          code: sequenceCode,
          triggerEvent: "NEW_LEAD",
          description: "Automated multi-channel nurture cadence across WhatsApp and AI Calling.",
          steps: defaultSteps as any,
          isActive: true,
        },
      });
    }

    // 3. Create or update AutomationSequenceState
    const state = await db.automationSequenceState.upsert({
      where: {
        id: `${sequence.id}_${leadId}`,
      },
      update: {
        status: "RUNNING",
        currentStep: 0,
        nextRunAt: new Date(),
      },
      create: {
        id: `${sequence.id}_${leadId}`,
        sequenceId: sequence.id,
        leadId,
        currentStep: 0,
        status: "RUNNING",
        nextRunAt: new Date(),
        logs: [],
      },
    });

    // Execute first step immediately if delay is 0
    await this.processNextStep(state.id);

    return state;
  }

  /**
   * Process the next step for an active automation state
   */
  public static async processNextStep(stateId: string) {
    const state = await db.automationSequenceState.findUnique({
      where: { id: stateId },
      include: {
        sequence: true,
        lead: { include: { course: true } },
      },
    });

    if (!state || state.status !== "RUNNING") return;

    const lead = state.lead;
    if (lead.isOptedOut || lead.status === "ADMITTED") {
      await db.automationSequenceState.update({
        where: { id: stateId },
        data: { status: "COMPLETED" },
      });
      return;
    }

    const steps = (state.sequence.steps as unknown as SequenceStep[]) || [];
    const nextStepIndex = state.currentStep;

    if (nextStepIndex >= steps.length) {
      await db.automationSequenceState.update({
        where: { id: stateId },
        data: { status: "COMPLETED" },
      });
      return;
    }

    const currentStepConfig = steps[nextStepIndex];
    let executionResult = "SUCCESS";

    try {
      if (currentStepConfig.channel === "WHATSAPP") {
        await WhatsAppBusinessService.sendCourseBrochure(
          lead.phone,
          lead.fullName,
          lead.course?.title || "Professional Program",
          undefined,
          lead.id
        );
      } else if (currentStepConfig.channel === "AI_CALL") {
        // Enqueue into existing bulk calling queue
        const defaultBatch = await db.bulkCallingBatch.findFirst({
          where: { status: "RUNNING" },
          orderBy: { createdAt: "desc" },
        });

        if (defaultBatch) {
          await db.callingQueueItem.create({
            data: {
              batchId: defaultBatch.id,
              queuePosition: 1,
              name: lead.fullName,
              phone: lead.phone,
              email: lead.email,
              course: lead.course?.title,
              leadId: lead.id,
              isExistingLead: true,
            },
          });
        }
      }

      await OmnichannelInboxService.recordTimelineEvent({
        leadId: lead.id,
        eventType: "AUTOMATION_STEP_EXECUTED",
        source: "AUTOMATION_ENGINE",
        title: `Cadence Step ${currentStepConfig.stepNumber} Executed`,
        summary: currentStepConfig.description,
        metadata: {
          sequenceCode: state.sequence.code,
          stepNumber: currentStepConfig.stepNumber,
          channel: currentStepConfig.channel,
        },
      });
    } catch (err: any) {
      executionResult = `FAILED: ${err.message}`;
    }

    const logs = Array.isArray(state.logs) ? (state.logs as any[]) : [];
    logs.push({
      stepNumber: currentStepConfig.stepNumber,
      executedAt: new Date().toISOString(),
      result: executionResult,
    });

    const nextStep = steps[nextStepIndex + 1];
    const nextRunDate = nextStep
      ? new Date(Date.now() + nextStep.delayMinutes * 60 * 1000)
      : null;

    await db.automationSequenceState.update({
      where: { id: stateId },
      data: {
        currentStep: nextStepIndex + 1,
        status: nextStep ? "RUNNING" : "COMPLETED",
        lastRunAt: new Date(),
        nextRunAt: nextRunDate,
        logs,
      },
    });
  }
}
