import { db } from "@/server/db/client";
import {
  FollowUpType,
  LeadStatus,
  SlgCallSource,
  SlgCallStatus,
  SlgCallType,
  UserRoleCode,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { resolveCanonicalDisposition } from "@/config/dispositions.config";
import { SlgMultiTenantService } from "./slg-multi-tenant.service";
import { AuditService } from "./audit.service";

export interface RecordInteractionInput {
  leadId?: string;
  contactName?: string;
  contactPhone?: string;
  interactionType?: FollowUpType;
  disposition: string;
  newStatus?: LeadStatus;
  notes: string;
  nextFollowUpDate?: Date | null;
  durationSeconds?: number;
  callDirection?: "OUTGOING" | "INCOMING";
  callStatus?: "CONNECTED" | "NO_ANSWER" | "BUSY" | "FAILED";
  provider?: string;
  providerCallId?: string | null;
  recordingUrl?: string | null;
  source?: string;
}

const AUTHORIZED_SALES_ROLES: string[] = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
  UserRoleCode.HR,
  UserRoleCode.COUNSELOR,
  UserRoleCode.TELECALLER,
  UserRoleCode.MARKETING,
  UserRoleCode.PLACEMENT_OFFICER,
];

export class DispositionEngineService {
  /**
   * Canonical, transaction-safe disposition and interaction engine.
   * Synchronizes:
   * 1. Lead status, temperature, and nextFollowUp
   * 2. FollowUpHistory (Counselling & Outreach History + Follow-up Workspace)
   * 3. LeadActivity (CRM Lead Interaction History + Manager Feed)
   * 4. CustomerTimelineEvent (360° Omnichannel Customer Timeline)
   * 5. StaffCallLog + SlgCallLog + StaffLiveSession (when interaction is a call)
   * 6. Immutable AuditLog
   */
  static async recordInteraction(user: AuthenticatedUser, input: RecordInteractionInput) {
    if (!AUTHORIZED_SALES_ROLES.includes(user.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to record CRM interactions or dispositions.",
      });
    }

    const interactionType = input.interactionType || FollowUpType.CALL;
    const canonical = resolveCanonicalDisposition(input.disposition);
    const rawNotes = (input.notes || "").trim();
    const cleanNotes = rawNotes || `${canonical.label} (${canonical.code})`;

    // 1. Resolve Lead by leadId or contactPhone
    let lead = input.leadId
      ? await db.lead.findUnique({ where: { id: input.leadId } })
      : null;

    if (!lead && input.contactPhone) {
      const cleanPhone = input.contactPhone.replace(/\D/g, "").slice(-10);
      if (cleanPhone.length === 10) {
        lead = await db.lead.findFirst({
          where: { phone: { contains: cleanPhone } },
          orderBy: { createdAt: "desc" },
        });
      }
    }

    if (input.leadId && !lead) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Lead with ID '${input.leadId}' not found.`,
      });
    }

    // 2. Duplicate-submit idempotency check (5-second window)
    if (lead) {
      const fiveSecsAgo = new Date(Date.now() - 5000);
      const recentDuplicate = await db.followUpHistory.findFirst({
        where: {
          leadId: lead.id,
          performedById: user.id,
          type: interactionType,
          createdAt: { gte: fiveSecsAgo },
        },
        include: {
          performedBy: { select: { id: true, firstName: true, lastName: true, roleCode: true } },
        },
      });

      if (recentDuplicate && recentDuplicate.notes.includes(cleanNotes)) {
        return {
          followUp: recentDuplicate,
          lead,
          disposition: canonical.code,
          deduplicated: true,
        };
      }
    }

    // 3. Determine effective LeadStatus and Follow-Up Schedule
    const effectiveStatus: LeadStatus =
      input.newStatus || canonical.mappedLeadStatus || (lead ? lead.status : LeadStatus.CONTACTED);

    let effectiveNextFollowUp: Date | null = null;
    if (input.nextFollowUpDate) {
      effectiveNextFollowUp = new Date(input.nextFollowUpDate);
    } else if (input.nextFollowUpDate === null || !canonical.requiresFollowUp) {
      effectiveNextFollowUp = null;
    } else if (lead?.nextFollowUp) {
      effectiveNextFollowUp = lead.nextFollowUp;
    }

    const isCall = interactionType === FollowUpType.CALL;
    const isCarrierVerified = Boolean(input.providerCallId && !input.providerCallId.startsWith("manual_"));
    const effectiveDuration = Math.max(0, Number(input.durationSeconds || 0));
    const effectiveCallStatus = input.callStatus || canonical.defaultCallStatus;
    const sourceTag = input.source || "CRM_DISPOSITION_ENGINE";

    const formattedFollowUpNotes = rawNotes.startsWith(`[${canonical.code}]`)
      ? rawNotes
      : `[${canonical.code}] ${cleanNotes}`;

    // 4. Synchronize Lead, FollowUpHistory, LeadActivity, CustomerTimelineEvent
    let followUpRecord: any = null;
    let activityRecord: any = null;
    let timelineRecord: any = null;
    let updatedLead = lead;

    if (lead) {
      const assignedToId = lead.assignedToId || user.id;
      const assignedCounselorId =
        lead.assignedCounselorId || (user.roleCode === UserRoleCode.COUNSELOR ? user.id : null);
      const assignedTelecallerId =
        lead.assignedTelecallerId || (user.roleCode === UserRoleCode.TELECALLER ? user.id : null);

      updatedLead = await db.lead.update({
        where: { id: lead.id },
        data: {
          status: effectiveStatus,
          temperature: canonical.temperature,
          nextFollowUp: effectiveNextFollowUp,
          lastInteraction: new Date(),
          lastHandledById: user.id,
          assignedToId,
          assignedCounselorId,
          assignedTelecallerId,
          ...(isCall ? { callCount: { increment: 1 } } : {}),
        },
      });

      followUpRecord = await db.followUpHistory.create({
        data: {
          leadId: lead.id,
          type: interactionType,
          notes: formattedFollowUpNotes,
          nextFollowUpDate: effectiveNextFollowUp,
          performedById: user.id,
        },
        include: {
          performedBy: { select: { id: true, firstName: true, lastName: true, roleCode: true } },
        },
      });

      const activityType =
        interactionType === FollowUpType.CALL
          ? effectiveCallStatus === "CONNECTED"
            ? "CALL_CONNECTED"
            : "CALL_ATTEMPT"
          : interactionType === FollowUpType.MESSAGE
          ? "WHATSAPP_INTERACTION"
          : interactionType === FollowUpType.COUNSELLING_SESSION
          ? "COUNSELLING_SESSION"
          : interactionType === FollowUpType.STATUS_CHANGE
          ? "STATUS_CHANGE"
          : "NOTE_ADDED";

      activityRecord = await db.leadActivity.create({
        data: {
          leadId: lead.id,
          userId: user.id,
          activityType,
          disposition: canonical.code,
          notes: isCall && !isCarrierVerified
            ? `[MANUAL_LOG | ${canonical.code}] ${cleanNotes}`
            : `[${canonical.code}] ${cleanNotes}`,
        },
      });

      const typeLabelMap: Record<FollowUpType, string> = {
        [FollowUpType.CALL]: isCarrierVerified ? "Verified Carrier Call" : "Phone Call (Manual Log)",
        [FollowUpType.MESSAGE]: "WhatsApp / Message Exchange",
        [FollowUpType.COUNSELLING_SESSION]: "Academic Counselling Session",
        [FollowUpType.NOTE]: "CRM Internal Note",
        [FollowUpType.STATUS_CHANGE]: "Pipeline Status Update",
      };

      timelineRecord = await db.customerTimelineEvent.create({
        data: {
          leadId: lead.id,
          actorId: user.id,
          eventType:
            interactionType === FollowUpType.CALL
              ? "VOICE_CALL_DISPOSITION"
              : interactionType === FollowUpType.MESSAGE
              ? "WHATSAPP_DISPOSITION"
              : interactionType === FollowUpType.COUNSELLING_SESSION
              ? "COUNSELLING_DISPOSITION"
              : "CRM_INTERACTION_LOGGED",
          source: sourceTag,
          title: `${typeLabelMap[interactionType]} — ${canonical.label}`,
          summary: `${formattedFollowUpNotes}${
            effectiveNextFollowUp
              ? ` • Next Follow-Up: ${effectiveNextFollowUp.toLocaleDateString("en-IN")}`
              : ""
          }`,
          metadata: {
            disposition: canonical.code,
            dispositionLabel: canonical.label,
            interactionType,
            leadStatus: effectiveStatus,
            nextFollowUpDate: effectiveNextFollowUp ? effectiveNextFollowUp.toISOString() : null,
            durationSeconds: effectiveDuration,
            isCarrierVerified,
            providerCallId: input.providerCallId || null,
            followUpId: followUpRecord.id,
            activityId: activityRecord.id,
          },
        },
      });
    }

    // 5. If Call Interaction, synchronize StaffCallLog, SlgCallLog, and StaffLiveSession
    let staffCallLog: any = null;
    let slgCallLog: any = null;

    if (isCall) {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        include: { staffProfile: true },
      });

      const contactName = input.contactName || lead?.fullName || "Prospective Student";
      const contactPhone = input.contactPhone || lead?.phone || "0000000000";
      const cleanPhoneDigits = contactPhone.replace(/\D/g, "").slice(-10);
      const normalizedE164 = cleanPhoneDigits.length === 10 ? `91${cleanPhoneDigits}` : contactPhone;

      const noteWithSourceTag = isCarrierVerified
        ? `[CARRIER_VERIFIED | SID: ${input.providerCallId}] ${cleanNotes}`
        : `[MANUAL_LOG] ${cleanNotes}`;

      staffCallLog = await db.staffCallLog.create({
        data: {
          userId: user.id,
          staffProfileId: dbUser?.staffProfile?.id || null,
          leadId: lead?.id || null,
          contactName,
          contactPhone: cleanPhoneDigits || contactPhone,
          callType: input.callDirection || "OUTGOING",
          callStatus: effectiveCallStatus,
          disposition: canonical.code,
          durationSeconds: effectiveDuration,
          notes: noteWithSourceTag,
          nextFollowUpDate: effectiveNextFollowUp,
          roleCode: user.roleCode,
          recordingUrl: input.recordingUrl || null,
          startedAt: new Date(Date.now() - effectiveDuration * 1000),
          endedAt: new Date(),
        },
      });

      try {
        const tenantId = await SlgMultiTenantService.resolveValidTenantId(dbUser?.tenantId);
        let slgStatus: SlgCallStatus = SlgCallStatus.CONNECTED;
        if (effectiveCallStatus === "BUSY") slgStatus = SlgCallStatus.BUSY;
        else if (effectiveCallStatus === "NO_ANSWER") slgStatus = SlgCallStatus.UNANSWERED;
        else if (effectiveCallStatus === "FAILED") slgStatus = SlgCallStatus.FAILED;

        slgCallLog = await db.slgCallLog.create({
          data: {
            tenantId,
            userId: user.id,
            leadId: lead?.id || null,
            source: isCarrierVerified ? SlgCallSource.CLOUD_PBX : SlgCallSource.MANUAL,
            provider: input.provider || (isCarrierVerified ? "TWILIO" : "SELF_HOSTED"),
            providerId: input.providerCallId || null,
            callType: input.callDirection === "INCOMING" ? SlgCallType.INCOMING : SlgCallType.OUTGOING,
            callStatus: slgStatus,
            contactName,
            customerPhone: normalizedE164,
            agentPhone: dbUser?.callingNumber || dbUser?.phone || "DESKTOP",
            startedAt: new Date(Date.now() - effectiveDuration * 1000),
            endedAt: new Date(),
            durationSeconds: effectiveDuration,
            talkTimeSeconds: effectiveDuration,
            disposition: canonical.code,
            notes: noteWithSourceTag,
            nextFollowUpAt: effectiveNextFollowUp,
            isEmployeeMatched: true,
            isCustomerMatched: Boolean(lead?.id),
          },
        });
      } catch (slgErr) {
        console.warn("[DispositionEngineService] SlgCallLog sync warning:", slgErr);
      }

      const isConnected = effectiveCallStatus === "CONNECTED";
      const isConversion = ["ADMITTED", "INTERESTED", "HIGHLY_INTERESTED", "PAYMENT_COMPLETED"].includes(
        canonical.code
      );

      await db.staffLiveSession.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          staffProfileId: dbUser?.staffProfile?.id || null,
          roleCode: user.roleCode,
          department: dbUser?.staffProfile?.department || null,
          status: "AVAILABLE",
          dailyTargetCalls: 50,
          todayCallsCount: 1,
          todayTalkTimeSeconds: effectiveDuration,
          todayConnectedCount: isConnected ? 1 : 0,
          todayConversionsCount: isConversion ? 1 : 0,
          lastActiveAt: new Date(),
        },
        update: {
          todayCallsCount: { increment: 1 },
          todayTalkTimeSeconds: { increment: effectiveDuration },
          todayConnectedCount: { increment: isConnected ? 1 : 0 },
          todayConversionsCount: { increment: isConversion ? 1 : 0 },
          status: "AVAILABLE",
          currentCallContact: null,
          currentCallPhone: null,
          currentCallStartedAt: null,
          lastActiveAt: new Date(),
        },
      });
    }

    await AuditService.log({
      actorId: user.id,
      action: "CRM_DISPOSITION_SYNCHRONIZED",
      resourceType: "Lead",
      resourceId: lead?.id || staffCallLog?.id || "manual-call",
      previousData: lead ? { status: lead.status, nextFollowUp: lead.nextFollowUp } : undefined,
      newData: {
        disposition: canonical.code,
        interactionType,
        newStatus: effectiveStatus,
        nextFollowUp: effectiveNextFollowUp,
        source: sourceTag,
        isCarrierVerified,
      },
    });

    return {
      followUp: followUpRecord,
      activity: activityRecord,
      timelineEvent: timelineRecord,
      staffCallLog,
      slgCallLog,
      lead: updatedLead,
      disposition: canonical.code,
      dispositionLabel: canonical.label,
      deduplicated: false,
    };
  }
}
