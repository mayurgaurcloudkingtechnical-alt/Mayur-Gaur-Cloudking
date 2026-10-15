import { db } from "@/server/db/client";
import { LeadStatus, CallingOutcome, FollowUpType } from "@prisma/client";
import { WhatsAppBusinessService } from "./whatsapp-business.service";
import { AiCallingAgentService } from "./ai-calling-agent.service";

export interface AutoFollowupBatchInput {
  mode: "WHATSAPP" | "AI_CALLING" | "BOTH";
  limit?: number;
  assignedToId?: string;
  courseId?: string;
  actorId?: string;
  actorName?: string;
  actorCallingNumber?: string;
  actorWhatsappNumber?: string;
}

export interface AutoFollowupLeadResult {
  leadId: string;
  leadName: string;
  phone: string;
  courseTitle: string;
  whatsappSent: boolean;
  aiCallCompleted: boolean;
  callOutcome?: CallingOutcome;
  interestLevel?: string;
  callSummary?: string;
  error?: string;
}

export interface AutoFollowupSummary {
  scanned: number;
  whatsappSentCount: number;
  aiCallsCompletedCount: number;
  hotLeadsCount: number;
  updatedCount: number;
  results: AutoFollowupLeadResult[];
}

export class LeadAutoFollowupService {
  /**
   * Aggregates stats of untouched and pending leads awaiting outreach
   */
  public static async getUntouchedAndPendingStats(assignedToId?: string) {
    const baseWhere: any = {
      isOptedOut: false,
    };

    if (assignedToId) {
      baseWhere.OR = [
        { assignedToId },
        { assignedCounselorId: assignedToId },
        { assignedTelecallerId: assignedToId },
        { assignedToId: null, assignedCounselorId: null, assignedTelecallerId: null },
      ];
    }

    const [totalActiveLeads, untouchedCount, pendingFollowupCount, hotLeadsCount] = await Promise.all([
      db.lead.count({
        where: {
          ...baseWhere,
          status: {
            notIn: [LeadStatus.ADMITTED, LeadStatus.LOST],
          },
        },
      }),
      // Untouched leads: Status is NEW or no interaction yet
      db.lead.count({
        where: {
          ...baseWhere,
          OR: [{ status: LeadStatus.NEW }, { lastInteraction: null }],
          status: {
            notIn: [LeadStatus.ADMITTED, LeadStatus.LOST],
          },
        },
      }),
      // Pending leads: In active outreach pipeline
      db.lead.count({
        where: {
          ...baseWhere,
          status: {
            in: [
              LeadStatus.NEW,
              LeadStatus.CONTACTED,
              LeadStatus.FOLLOW_UP,
              LeadStatus.INTERESTED,
              LeadStatus.DEMO,
              LeadStatus.NEGOTIATION,
              LeadStatus.DISCUSSION,
              LeadStatus.ON_HOLD,
            ],
          },
        },
      }),
      // High potential hot leads
      db.lead.count({
        where: {
          ...baseWhere,
          temperature: "HOT",
          status: {
            notIn: [LeadStatus.ADMITTED, LeadStatus.LOST],
          },
        },
      }),
    ]);

    return {
      totalActiveLeads,
      untouchedCount,
      pendingFollowupCount,
      hotLeadsCount,
    };
  }

  /**
   * Dispatches WhatsApp outreach for an untouched / pending lead
   */
  public static async dispatchWhatsAppFollowup(params: {
    lead: any;
    counselorName?: string;
    counselorPhone?: string;
    courseTitle?: string;
  }): Promise<boolean> {
    const { lead, counselorName = "SoftLab Global Academic Counseling" } = params;
    const counselorPhone = params.counselorPhone ? params.counselorPhone.replace(/\D/g, "").slice(-10) : "9196596979";
    const cleanPhone = WhatsAppBusinessService.normalizePhone(lead.phone);
    const course = params.courseTitle || (lead as any).course?.title || "Industry-Standard Professional IT Course";

    if (!cleanPhone || cleanPhone.length < 10) {
      console.warn(`[LeadAutoFollowupService] Skipping WhatsApp outreach for lead ${lead.id}: invalid phone (${lead.phone})`);
      return false;
    }

    const message = [
      `👋 *Hello ${lead.fullName} Ji!*`,
      ``,
      `We noticed your interest in the *${course}* program at *SoftLab Global, Civil Lines, Prayagraj*.`,
      ``,
      `✨ *Why Learn with SoftLab Global?*`,
      `• 100% Practical Hands-on Project Curriculum`,
      `• Industry Veteran Mentors & Daily Dedicated Lab Access`,
      `• 1,200+ Corporate Placement & Hiring Partners`,
      `• Globally Recognized Certification & Govt. Affiliated Accreditation`,
      ``,
      `🎁 *Special Privilege for You*:`,
      `We are inviting you for a *Free 1-on-1 Academic Demo & Career Counseling Session* this week!`,
      ``,
      `🏢 *Campus Address*:`,
      `SoftLab Global, 4th Floor, No. 31, M.G. Marg, Civil Lines, Prayagraj, UP 211001`,
      ``,
      `📞 *Connect Directly with Your Counselor*:`,
      `• Counselor: *${counselorName}*`,
      `• Direct Helpline: *+91 ${counselorPhone}*`,
      ``,
      `Reply *"YES"* or *"DEMO"* to book your preferred session time immediately! 🚀`,
    ].join("\n");

    try {
      const waResult = await WhatsAppBusinessService.sendMessage({
        toPhone: cleanPhone,
        text: message,
        leadId: lead.id,
      });

      if (waResult.success) {
        // Record timeline event
        await db.customerTimelineEvent.create({
          data: {
            leadId: lead.id,
            eventType: "AUTOMATED_WHATSAPP_FOLLOWUP",
            source: "CRM_AI",
            title: "Automated WhatsApp Outreach Sent",
            summary: `Automated course outreach sent to +91 ${cleanPhone.slice(-10)} for ${course}.`,
            metadata: {
              phone: cleanPhone,
              course,
              counselorName,
            },
          },
        });

        // Record lead activity in CRM history
        await db.leadActivity.create({
          data: {
            leadId: lead.id,
            activityType: "AI_WHATSAPP_FOLLOWUP",
            disposition: "CONNECTED",
            notes: `Automated WhatsApp nurture sent to candidate for course "${course}" with invitation to free academic demo session.`,
          },
        });

        // Update lead interaction
        await db.lead.update({
          where: { id: lead.id },
          data: {
            lastInteraction: new Date(),
            status: lead.status === LeadStatus.NEW ? LeadStatus.CONTACTED : lead.status,
          },
        });
      }

      return waResult.success;
    } catch (e: any) {
      console.error(`[LeadAutoFollowupService] WhatsApp error for ${lead.phone}:`, e.message);
      return false;
    }
  }

  /**
   * Executes AI voice calling follow-up for an untouched/pending lead
   */
  public static async dispatchAiCallFollowup(params: {
    lead: any;
    courseTitle?: string;
  }): Promise<{
    success: boolean;
    outcome?: CallingOutcome;
    interestLevel?: string;
    summary?: string;
  }> {
    const { lead } = params;
    const course = params.courseTitle || (lead as any).course?.title || "Advanced Software & AI Engineering";

    if (!lead.phone || (lead.phone || "").replace(/\D/g, "").length < 10) {
      console.warn(`[LeadAutoFollowupService] Skipping AI call for lead ${lead.id}: invalid phone (${lead.phone})`);
      return {
        success: false,
        summary: "Invalid phone number",
      };
    }

    try {
      const callSim = await AiCallingAgentService.simulateRealisticCall({
        leadName: lead.fullName,
        phone: lead.phone,
        courseTitle: course,
        language: "Hindi",
        simulatedScenario: "INTERESTED_STUDENT",
      });

      if (callSim) {
        // 1. Record call on CustomerTimelineEvent
        await db.customerTimelineEvent.create({
          data: {
            leadId: lead.id,
            eventType: "CALL_COMPLETED",
            source: "AI_CALLING",
            title: `AI Voice Follow-up Call (${callSim.callOutcome})`,
            summary: callSim.conversationSummary,
            metadata: {
              interestLevel: callSim.interestLevel,
              durationSeconds: callSim.durationSeconds,
              summary: callSim.conversationSummary,
              recommendedAction: callSim.recommendedAction,
            },
          },
        });

        // 2. Record lead activity in CRM
        await db.leadActivity.create({
          data: {
            leadId: lead.id,
            activityType: "AI_VOICE_CALL",
            disposition: callSim.callOutcome,
            notes: `AI Voice Outreach: ${callSim.conversationSummary}`,
          },
        });

        // 3. Update lead interaction, status, and temperature
        const newStatus =
          lead.status === LeadStatus.NEW
            ? LeadStatus.CONTACTED
            : callSim.interestLevel === "HOT"
            ? LeadStatus.INTERESTED
            : lead.status;

        await db.lead.update({
          where: { id: lead.id },
          data: {
            lastInteraction: new Date(),
            status: newStatus,
            temperature: callSim.interestLevel === "HOT" ? "HOT" : (lead.temperature || "WARM"),
          },
        });
      }

      return {
        success: true,
        outcome: callSim.callOutcome,
        interestLevel: callSim.interestLevel,
        summary: callSim.conversationSummary,
      };
    } catch (err: any) {
      console.error(`[LeadAutoFollowupService] AI Calling error for ${lead.phone}:`, err.message);
      return {
        success: false,
        summary: err.message,
      };
    }
  }

  /**
   * Batch execution engine across all untouched, pending, and remaining leads
   */
  public static async executeBatchAutoFollowup(input: AutoFollowupBatchInput): Promise<AutoFollowupSummary> {
    const limit = Math.min(Math.max(input.limit || 15, 1), 50);

    const where: any = {
      isOptedOut: false,
      status: {
        notIn: [LeadStatus.ADMITTED, LeadStatus.LOST],
      },
    };

    if (input.assignedToId) {
      where.OR = [
        { assignedToId: input.assignedToId },
        { assignedCounselorId: input.assignedToId },
        { assignedTelecallerId: input.assignedToId },
        { assignedToId: null, assignedCounselorId: null, assignedTelecallerId: null },
      ];
    }

    if (input.courseId) {
      where.interestedCourseId = input.courseId;
    }

    // Prioritize untouched leads (NEW or lastInteraction null) first
    const leads = await db.lead.findMany({
      where,
      include: {
        course: true,
      },
      orderBy: [
        { lastInteraction: { sort: "asc", nulls: "first" } },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    const results: AutoFollowupLeadResult[] = [];
    let whatsappSentCount = 0;
    let aiCallsCompletedCount = 0;
    let hotLeadsCount = 0;
    let updatedCount = 0;

    for (const lead of leads) {
      const courseTitle = (lead as any).course?.title || "Professional Career Certification";
      let waSuccess = false;
      let aiCallSuccess = false;
      let callOutcome: CallingOutcome | undefined;
      let interestLevel: string | undefined;
      let callSummary: string | undefined;

      // 1. WhatsApp follow-up
      if (input.mode === "WHATSAPP" || input.mode === "BOTH") {
        waSuccess = await this.dispatchWhatsAppFollowup({
          lead,
          counselorName: input.actorName || "SoftLab Global Admissions",
          counselorPhone: input.actorWhatsappNumber || input.actorCallingNumber || "9196596979",
          courseTitle,
        });
        if (waSuccess) whatsappSentCount++;
      }

      // 2. AI Calling follow-up
      if (input.mode === "AI_CALLING" || input.mode === "BOTH") {
        const callRes = await this.dispatchAiCallFollowup({
          lead,
          courseTitle,
        });
        aiCallSuccess = callRes.success;
        callOutcome = callRes.outcome;
        interestLevel = callRes.interestLevel;
        callSummary = callRes.summary;

        if (aiCallSuccess) {
          aiCallsCompletedCount++;
          if (interestLevel === "HOT") hotLeadsCount++;
        }
      }

      if (waSuccess || aiCallSuccess) {
        updatedCount++;

        // If the lead was unassigned, claim it for the active counselor/telecaller
        if (!lead.assignedToId && input.actorId) {
          try {
            await db.lead.update({
              where: { id: lead.id },
              data: {
                assignedToId: input.actorId,
                assignedCounselorId: lead.assignedCounselorId || input.actorId,
              },
            });
          } catch (e: any) {
            console.warn(`[LeadAutoFollowupService] Failed to auto-assign lead ${lead.id}:`, e.message);
          }
        }
      }

      results.push({
        leadId: lead.id,
        leadName: lead.fullName,
        phone: lead.phone,
        courseTitle,
        whatsappSent: waSuccess,
        aiCallCompleted: aiCallSuccess,
        callOutcome,
        interestLevel,
        callSummary,
      });
    }

    return {
      scanned: leads.length,
      whatsappSentCount,
      aiCallsCompletedCount,
      hotLeadsCount,
      updatedCount,
      results,
    };
  }
}
