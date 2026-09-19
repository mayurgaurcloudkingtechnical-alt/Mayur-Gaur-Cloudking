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
   * Google Ads, Meta Ads, Justdial, WhatsApp, Website, and Webhooks.
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

      // Broadcast real-time alerts to Counselor, Director, Admin, and Super Admin
      await this.broadcastLeadNotification({
        leadId: existingLead.id,
        fullName,
        phone: cleanPhone,
        courseName: payload.interestedCourseName,
        city,
        source: payload.source,
        isNew: false,
        assignedUserId: existingLead.assignedToId || primaryAssignedId,
      });

      return {
        isNew: false,
        leadId: existingLead.id,
        lead: updated,
        assignedToId: existingLead.assignedToId || primaryAssignedId,
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

    // Broadcast real-time alerts to Counselor, Director, Admin, and Super Admin
    await this.broadcastLeadNotification({
      leadId: newLead.id,
      fullName,
      phone: cleanPhone,
      courseName: payload.interestedCourseName,
      city,
      source: payload.source,
      isNew: true,
      assignedUserId: primaryAssignedId,
    });

    return {
      isNew: true,
      leadId: newLead.id,
      lead: newLead,
      assignedToId: primaryAssignedId,
    };
  }

  /**
   * Broadcasts lead alerts to Counselor, Director, Admin, and Super Admin
   * guaranteeing that no lead is overlooked.
   */
  private static async broadcastLeadNotification(params: {
    leadId: string;
    fullName: string;
    phone: string;
    courseName?: string;
    city?: string | null;
    source: LeadSource;
    isNew: boolean;
    assignedUserId?: string | null;
  }) {
    try {
      // Find all active users with roles: SUPER_ADMIN, DIRECTOR, ADMIN, COUNSELOR
      const activeStakeholders = await db.user.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            {
              roleCode: {
                in: [
                  UserRoleCode.SUPER_ADMIN,
                  UserRoleCode.DIRECTOR,
                  UserRoleCode.ADMIN,
                  UserRoleCode.COUNSELOR,
                ],
              },
            },
            ...(params.assignedUserId ? [{ id: params.assignedUserId }] : []),
          ],
        },
        select: { id: true, roleCode: true },
      });

      if (!activeStakeholders.length) return;

      let sourceLabel = params.source.replace(/_/g, " ");
      if (params.source === LeadSource.GOOGLE_ADS) {
        sourceLabel = "Google Ads";
      } else if (params.source === LeadSource.META_ADS_FB) {
        sourceLabel = "Meta Facebook Ads";
      } else if (params.source === LeadSource.META_ADS_IG) {
        sourceLabel = "Instagram Ads";
      } else if (params.source === LeadSource.META) {
        sourceLabel = "Meta Lead Ads";
      }

      const title = params.isNew
        ? `🔥 [${sourceLabel}] New Lead: ${params.fullName}`
        : `🔄 [${sourceLabel}] Lead Re-Engaged: ${params.fullName}`;

      const courseText = params.courseName ? ` | Course: ${params.courseName}` : "";
      const cityText = params.city ? ` | City: ${params.city}` : "";
      const message = `${params.fullName} (${params.phone})${courseText}${cityText}. Immediate follow-up required!`;

      // Deduplicate recipient IDs
      const uniqueUserMap = new Map<string, UserRoleCode>();
      for (const u of activeStakeholders) {
        uniqueUserMap.set(u.id, u.roleCode);
      }

      const notifications = Array.from(uniqueUserMap.entries()).map(([userId, roleCode]) => {
        const isStaff =
          roleCode === UserRoleCode.COUNSELOR || roleCode === UserRoleCode.TELECALLER;
        return {
          userId,
          title,
          message,
          type: NotificationType.ADMISSION,
          priority: params.isNew ? NotificationPriority.URGENT : NotificationPriority.HIGH,
          link: isStaff ? `/counselor/leads/${params.leadId}` : `/admin/leads`,
        };
      });

      await db.notification.createMany({
        data: notifications,
      });
    } catch (err) {
      console.error("[CrmIngestionService] Failed to broadcast lead notifications:", err);
    }
  }
}
