import { db } from "@/server/db/client";
import { LeadSource, LeadStatus, UserRoleCode, NotificationType, NotificationPriority } from "@prisma/client";
import { normalizePhone, normalizeEmail } from "./crm-lead.service";

export interface IngestLeadPayload {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  qualification?: string;
  source: LeadSource;
  interestedCourseId?: string;
  interestedCourseName?: string;
  notes?: string;
  campaignName?: string;
  adsetName?: string;
  adCreativeName?: string;
  keywordSearch?: string;
  landingPageUrl?: string;
  rawPayload?: any;
}

export class CrmIngestionService {
  /**
   * Intelligently routes and ingests incoming leads from all channels:
   * Justdial, Meta Ads, Google Ads, WhatsApp, Website, and Webhooks.
   */
  static async ingestLead(payload: IngestLeadPayload) {
    const cleanPhone = normalizePhone(payload.phone);
    const cleanEmail = payload.email && payload.email.trim().length > 0
      ? normalizeEmail(payload.email)
      : `${cleanPhone}@lead.softlabglobal.com`;

    const fullName = payload.fullName?.trim() || "Prospect Inquiry";
    const city = payload.city?.trim() || null;
    const qualification = payload.qualification?.trim() || null;

    // Course matching by ID or title if provided
    let matchedCourseId = payload.interestedCourseId || null;
    if (!matchedCourseId && payload.interestedCourseName) {
      const course = await db.course.findFirst({
        where: {
          OR: [
            { title: { contains: payload.interestedCourseName, mode: "insensitive" } },
            { slug: { contains: payload.interestedCourseName.toLowerCase().replace(/\s+/g, "-") } },
          ],
        },
        select: { id: true },
      });
      if (course) matchedCourseId = course.id;
    }

    // Auto-assignment: Find active Telecallers and Counselors
    const [telecallers, counselors] = await Promise.all([
      db.user.findMany({
        where: { roleCode: UserRoleCode.TELECALLER, status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { updatedAt: "asc" },
      }),
      db.user.findMany({
        where: { roleCode: UserRoleCode.COUNSELOR, status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { updatedAt: "asc" },
      }),
    ]);

    let assignedTelecallerId: string | null = null;
    let assignedCounselorId: string | null = null;
    let primaryAssignedId: string | null = null;

    const telecallerSources: LeadSource[] = [
      LeadSource.META,
      LeadSource.META_ADS_FB,
      LeadSource.META_ADS_IG,
      LeadSource.GOOGLE,
      LeadSource.GOOGLE_ADS,
      LeadSource.JUSTDIAL,
      LeadSource.WHATSAPP,
    ];
    const isTelecallerPrioritySource = telecallerSources.includes(payload.source);

    if (isTelecallerPrioritySource && telecallers.length > 0) {
      // Pick next available telecaller round-robin
      const selected = telecallers[Math.floor(Math.random() * telecallers.length)];
      assignedTelecallerId = selected.id;
      primaryAssignedId = selected.id;
    }

    if (counselors.length > 0) {
      const selected = counselors[Math.floor(Math.random() * counselors.length)];
      assignedCounselorId = selected.id;
      if (!primaryAssignedId) {
        primaryAssignedId = selected.id;
      }
    }

    // Fallback if no telecaller/counselor exists
    if (!primaryAssignedId) {
      const admin = await db.user.findFirst({
        where: { roleCode: UserRoleCode.SUPER_ADMIN, status: "ACTIVE" },
        select: { id: true },
      });
      if (admin) primaryAssignedId = admin.id;
    }

    // Deduplication check: does a lead with this phone or email already exist?
    const existingLead = await db.lead.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (existingLead) {
      // Update existing lead notes and record activity
      const updatedNotes = payload.notes
        ? `${existingLead.notes || ""}\n[${new Date().toISOString()} via ${payload.source}]: ${payload.notes}`.trim()
        : existingLead.notes;

      const updated = await db.lead.update({
        where: { id: existingLead.id },
        data: {
          notes: updatedNotes,
          interestedCourseId: matchedCourseId || existingLead.interestedCourseId,
          campaignName: payload.campaignName || existingLead.campaignName,
          adsetName: payload.adsetName || existingLead.adsetName,
          adCreativeName: payload.adCreativeName || existingLead.adCreativeName,
          city: city || existingLead.city,
        },
      });

      await db.leadActivity.create({
        data: {
          leadId: existingLead.id,
          activityType: "WEBHOOK_INGESTED",
          disposition: "RE_ENGAGED",
          notes: `Re-engaged via ${payload.source}. Campaign: ${payload.campaignName || "Direct"}. Notes: ${payload.notes || "None"}`,
        },
      });

      // Notify the assignee
      const notifyUserId = existingLead.assignedToId || primaryAssignedId;
      if (notifyUserId) {
        await db.notification.create({
          data: {
            userId: notifyUserId,
            title: `Existing Lead Re-engaged via ${payload.source}`,
            message: `${fullName} (${cleanPhone}) sent a new inquiry from ${payload.source}.`,
            type: NotificationType.ADMISSION,
            priority: NotificationPriority.HIGH,
            link: `/counselor/leads/${existingLead.id}`,
          },
        });
      }

      return {
        isNew: false,
        leadId: existingLead.id,
        lead: updated,
        assignedToId: notifyUserId,
      };
    }

    // Create brand new Lead
    const newLead = await db.lead.create({
      data: {
        fullName,
        email: cleanEmail,
        phone: cleanPhone,
        city,
        qualification,
        source: payload.source,
        status: LeadStatus.NEW,
        qualityScore: "WARM",
        interestedCourseId: matchedCourseId,
        notes: payload.notes || `Ingested via ${payload.source}`,
        campaignName: payload.campaignName || null,
        adsetName: payload.adsetName || null,
        adCreativeName: payload.adCreativeName || null,
        keywordSearch: payload.keywordSearch || null,
        landingPageUrl: payload.landingPageUrl || null,
        assignedToId: primaryAssignedId,
        assignedCounselorId,
        assignedTelecallerId,
      },
    });

    // Log Activity
    await db.leadActivity.create({
      data: {
        leadId: newLead.id,
        activityType: "WEBHOOK_INGESTED",
        disposition: "NEW_LEAD",
        notes: `New lead captured from ${payload.source}. Campaign: ${payload.campaignName || "Direct"}. Auto-assigned to staff.`,
      },
    });

    // Send in-app notification to the assigned staff member
    if (primaryAssignedId) {
      await db.notification.create({
        data: {
          userId: primaryAssignedId,
          title: `New ${payload.source} Lead: ${fullName}`,
          message: `Phone: ${cleanPhone} | Course: ${payload.interestedCourseName || "General"}. Immediate follow-up required.`,
          type: NotificationType.ADMISSION,
          priority: NotificationPriority.URGENT,
          link: `/counselor/leads/${newLead.id}`,
        },
      });
    }

    return {
      isNew: true,
      leadId: newLead.id,
      lead: newLead,
      assignedToId: primaryAssignedId,
    };
  }
}
