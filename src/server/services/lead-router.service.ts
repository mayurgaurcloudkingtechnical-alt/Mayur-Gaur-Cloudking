import { db } from "@/server/db/client";
import { LeadSource, LeadStatus, UserRoleCode } from "@prisma/client";
import { normalizePhone, normalizeEmail } from "@/server/services/crm-lead.service";

export interface IngestLeadPayload {
  fullName: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  qualification?: string | null;
  courseId?: string | null;
  source: LeadSource;
  campaignName?: string | null;
  adsetName?: string | null;
  adCreativeName?: string | null;
  keywordSearch?: string | null;
  landingPageUrl?: string | null;
  notes?: string | null;
  qualityScore?: "HOT" | "WARM" | "COLD" | "INVALID";
}

export class LeadRouterService {
  /**
   * Ingests a new lead from any source (JustDial, Google Ads, Meta Ads, Website, Chatbot),
   * applies phone de-duplication, executes round-robin assignment based on platform rules,
   * logs activities, and triggers the AI auto-responder.
   */
  static async ingestLead(payload: IngestLeadPayload) {
    const cleanPhone = normalizePhone(payload.phone);
    const cleanEmail = payload.email ? normalizeEmail(payload.email) : null;

    // 1. De-duplication Check: If lead exists with same phone, append timeline activity
    const existingLead = await db.lead.findFirst({
      where: { phone: cleanPhone },
      include: {
        assignedCounselor: true,
        assignedTelecaller: true,
        assignedTo: true,
      },
    });

    if (existingLead) {
      await db.leadActivity.create({
        data: {
          leadId: existingLead.id,
          activityType: "DUPLICATE_INQUIRY_RECEIVED",
          disposition: "RE_ENGAGED",
          notes: `New inquiry from ${payload.source}${payload.campaignName ? ` (Campaign: ${payload.campaignName})` : ""}. Notes: ${payload.notes || "None"}`,
        },
      });

      // If existing lead was marked lost or inactive, move back to follow up
      if (existingLead.status === LeadStatus.LOST) {
        await db.lead.update({
          where: { id: existingLead.id },
          data: { status: LeadStatus.FOLLOW_UP },
        });
      }

      const assignedRole =
        existingLead.assignedCounselor
          ? UserRoleCode.COUNSELOR
          : existingLead.assignedTelecaller
          ? UserRoleCode.TELECALLER
          : existingLead.assignedTo?.roleCode ||
            (payload.source === LeadSource.JUSTDIAL || payload.source === LeadSource.GOOGLE_ADS
              ? UserRoleCode.COUNSELOR
              : UserRoleCode.TELECALLER);

      return {
        isDuplicate: true,
        leadId: existingLead.id,
        assignedRole,
        assignedCounselor: existingLead.assignedCounselor,
        assignedTelecaller: existingLead.assignedTelecaller,
        message: "Existing lead re-engaged and timeline updated.",
      };
    }

    // 2. Determine target role based on source
    // JustDial & Google Ads -> COUNSELOR (High search purchase intent)
    // Meta Ads (FB/IG) & Website/Chatbot -> TELECALLER (Social / Inbound discovery)
    const isCounselorLead =
      payload.source === LeadSource.JUSTDIAL ||
      payload.source === LeadSource.GOOGLE_ADS;

    const targetRoleCode: UserRoleCode = isCounselorLead
      ? UserRoleCode.COUNSELOR
      : UserRoleCode.TELECALLER;

    // 3. Fair Round-Robin Assignment:
    // Select active staff who accept leads and have not exceeded their daily quota,
    // ordered by least active leads and oldest updated timestamp.
    const assignedStaff = await db.user.findFirst({
      where: {
        roleCode: targetRoleCode,
        status: "ACTIVE",
        isLeadAccepting: true,
        deletedAt: null,
      },
      orderBy: [
        { activeLeadsCount: "asc" },
        { updatedAt: "asc" },
      ],
    });

    // 4. Create new lead in atomic transaction
    const newLead = await db.$transaction(async (tx) => {
      const created = await tx.lead.create({
        data: {
          fullName: payload.fullName.trim(),
          phone: cleanPhone,
          email: cleanEmail || `${cleanPhone}@lead.softlabglobal.com`,
          city: payload.city?.trim() || null,
          qualification: payload.qualification?.trim() || null,
          source: payload.source,
          status: LeadStatus.NEW,
          qualityScore: payload.qualityScore || "WARM",
          interestedCourseId: payload.courseId || null,
          campaignName: payload.campaignName || null,
          adsetName: payload.adsetName || null,
          adCreativeName: payload.adCreativeName || null,
          keywordSearch: payload.keywordSearch || null,
          landingPageUrl: payload.landingPageUrl || null,
          notes: payload.notes?.trim() || null,
          assignedToId: assignedStaff?.id || null,
          assignedCounselorId: isCounselorLead ? assignedStaff?.id || null : null,
          assignedTelecallerId: !isCounselorLead ? assignedStaff?.id || null : null,
        },
      });

      // Update staff active count
      if (assignedStaff) {
        await tx.user.update({
          where: { id: assignedStaff.id },
          data: {
            activeLeadsCount: { increment: 1 },
          },
        });
      }

      // Log initial ingestion activity
      await tx.leadActivity.create({
        data: {
          leadId: created.id,
          userId: assignedStaff?.id || null,
          activityType: "WEBHOOK_INGESTED",
          disposition: "NEW_LEAD",
          notes: `Lead received via ${payload.source} and auto-routed to ${
            assignedStaff ? `${assignedStaff.firstName} ${assignedStaff.lastName} (${targetRoleCode})` : "Unassigned Pool"
          }.`,
        },
      });

      return created;
    }, {
      timeout: 60000,
      maxWait: 20000,
    });

    return {
      isDuplicate: false,
      leadId: newLead.id,
      assignedStaffId: assignedStaff?.id || null,
      assignedRole: targetRoleCode,
      message: `Lead successfully created and routed to ${targetRoleCode}.`,
    };
  }

  /**
   * Reassigns lead or escalates from Telecaller to Counselor after discovery/demo booking.
   */
  static async escalateLeadToCounselor(leadId: string, counselorId: string, notes?: string, performedById?: string) {
    const updated = await db.lead.update({
      where: { id: leadId },
      data: {
        assignedCounselorId: counselorId,
        assignedToId: counselorId,
        status: LeadStatus.INTERESTED,
        qualityScore: "HOT",
      },
      include: {
        assignedCounselor: true,
      },
    });

    await db.leadActivity.create({
      data: {
        leadId,
        userId: performedById || counselorId,
        activityType: "LEAD_ESCALATED_TO_COUNSELOR",
        disposition: "DEMO_QUALIFIED",
        notes: notes || `Lead escalated to Counselor ${updated.assignedCounselor?.firstName || ""} for demo and admission closing.`,
      },
    });

    return updated;
  }
}
