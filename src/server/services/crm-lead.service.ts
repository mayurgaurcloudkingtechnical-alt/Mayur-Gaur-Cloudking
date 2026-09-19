import { db } from "@/server/db/client";
import { AuthenticatedUser, hasPermission } from "@/server/auth/rbac";
import { RateLimiter } from "@/server/lib/rate-limiter";
import { AuditService } from "@/server/services/audit.service";
import { TRPCError } from "@trpc/server";
import { LeadSource, LeadStatus, FollowUpType, Prisma, UserRoleCode } from "@prisma/client";
import { META_ADS_CONFIG } from "@/server/config/meta-ads.config";

export interface PublicEnquiryInput {
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  qualification?: string;
  interestedCourseId?: string;
  source?: LeadSource;
  campaignName?: string;
  notes?: string;
  honeypot?: string;
}

export interface CreateLeadManualInput {
  fullName: string;
  email?: string;
  phone: string;
  city?: string;
  qualification?: string;
  source?: LeadSource;
  qualityScore?: string;
  interestedCourseId?: string;
  notes?: string;
  assignedToId?: string;
  assignedCounselorId?: string;
  assignedTelecallerId?: string;
  nextFollowUp?: Date | null;
}

export interface ListLeadsInput {
  status?: LeadStatus;
  search?: string;
  courseId?: string;
  assignedToId?: string;
  dueToday?: boolean;
  page?: number;
  limit?: number;
}

export interface LogFollowUpInput {
  leadId: string;
  type: FollowUpType;
  notes: string;
  newStatus?: LeadStatus;
  nextFollowUpDate?: Date | null;
}

export interface AssignLeadInput {
  leadId: string;
  assignedToId: string | null;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function canReadAllLeads(user: AuthenticatedUser): boolean {
  return (
    user.roleCode === UserRoleCode.SUPER_ADMIN ||
    user.roleCode === UserRoleCode.DIRECTOR ||
    user.roleCode === UserRoleCode.ADMIN ||
    user.roleCode === UserRoleCode.MANAGER ||
    hasPermission(user.permissions, "leads:read_all")
  );
}

export function canReadOwnLeads(user: AuthenticatedUser): boolean {
  return (
    canReadAllLeads(user) ||
    user.roleCode === UserRoleCode.COUNSELOR ||
    user.roleCode === UserRoleCode.TELECALLER ||
    hasPermission(user.permissions, "leads:read_own")
  );
}

export class CrmLeadService {
  /**
   * Captures public website enquiries with rate limiting, honeypot spam protection,
   * phone/email normalization, and audit logging.
   */
  static async submitPublicEnquiry(
    input: PublicEnquiryInput,
    ipAddress = "127.0.0.1",
    userAgent = "unknown"
  ) {
    if (input.honeypot && input.honeypot.trim().length > 0) {
      return { success: true, leadId: "spam-filtered" };
    }

    const rateKey = `crm:enquiry:${ipAddress}`;
    const rateCheck = RateLimiter.check(rateKey, 15, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many enquiry attempts. Please wait a few minutes before submitting again.",
      });
    }

    const cleanPhone = normalizePhone(input.phone);
    const cleanEmail = normalizeEmail(input.email);
    const leadSource = input.source || LeadSource.WEBSITE;

    const lead = await db.lead.create({
      data: {
        fullName: input.fullName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        city: input.city?.trim() || null,
        qualification: input.qualification?.trim() || null,
        source: leadSource,
        campaignName: input.campaignName?.trim() || null,
        status: LeadStatus.NEW,
        interestedCourseId: input.interestedCourseId || null,
        notes: input.notes?.trim() || null,
      },
    });

    await AuditService.log({
      action: "LEAD_ENQUIRY_RECEIVED",
      resourceType: "Lead",
      resourceId: lead.id,
      newData: {
        email: cleanEmail,
        courseId: input.interestedCourseId,
        source: leadSource,
      },
      ipAddress,
      userAgent,
    });

    return { success: true, leadId: lead.id };
  }

  /**
   * Lists leads scoped by user role.
   * Counselors and Telecallers only see leads assigned to them.
   * Admins and Managers can see all leads and filter by counselor.
   */
  static async listLeads(user: AuthenticatedUser, input: ListLeadsInput) {
    const hasReadAll = canReadAllLeads(user);
    const hasReadOwn = canReadOwnLeads(user);

    if (!hasReadAll && !hasReadOwn) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to view leads.",
      });
    }

    const where: Prisma.LeadWhereInput = {};

    if (!hasReadAll) {
      where.OR = [
        { assignedToId: user.id },
        { assignedCounselorId: user.id },
        { assignedTelecallerId: user.id },
        { assignedToId: null },
      ];
    } else if (input.assignedToId) {
      where.OR = [
        { assignedToId: input.assignedToId },
        { assignedCounselorId: input.assignedToId },
        { assignedTelecallerId: input.assignedToId },
      ];
    }

    if (input.status) {
      where.status = input.status;
    }

    if (input.courseId) {
      where.interestedCourseId = input.courseId;
    }

    if (input.search && input.search.trim().length > 0) {
      const q = input.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }

    if (input.dueToday) {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      where.nextFollowUp = {
        not: null,
        lte: endOfToday,
      };
    }

    const page = Math.max(1, input.page || 1);
    const limit = Math.min(50, Math.max(1, input.limit || 20));
    const skip = (page - 1) * limit;

    const [total, leads] = await Promise.all([
      db.lead.count({ where }),
      db.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ nextFollowUp: "asc" }, { createdAt: "desc" }],
        include: {
          course: { select: { id: true, title: true, slug: true } },
          batch: { select: { id: true, name: true, code: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { followUps: true, applications: true } },
        },
      }),
    ]);

    return {
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single lead details, verifying assignment or broad permission.
   * Checks for potential duplicates sharing normalized phone or email.
   */
  static async getLeadDetails(user: AuthenticatedUser, leadId: string) {
    const hasReadAll = canReadAllLeads(user);
    const hasReadOwn = canReadOwnLeads(user);

    if (!hasReadAll && !hasReadOwn) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to view leads.",
      });
    }

    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        course: true,
        batch: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        followUps: {
          orderBy: { createdAt: "desc" },
          include: {
            performedBy: { select: { id: true, firstName: true, lastName: true, roleCode: true } },
          },
        },
        applications: {
          orderBy: { createdAt: "desc" },
          include: {
            course: { select: { id: true, title: true } },
            batch: { select: { id: true, name: true, code: true } },
            counselor: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!lead) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Lead with ID '${leadId}' was not found.`,
      });
    }

    const canAccessLead =
      hasReadAll ||
      lead.assignedToId === user.id ||
      lead.assignedCounselorId === user.id ||
      lead.assignedTelecallerId === user.id ||
      lead.assignedToId === null;

    if (!canAccessLead) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not assigned to this lead.",
      });
    }

    const potentialDuplicates = await db.lead.findMany({
      where: {
        id: { not: lead.id },
        OR: [{ phone: lead.phone }, { email: lead.email }],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        source: true,
        createdAt: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return {
      lead,
      potentialDuplicates,
    };
  }

  /**
   * Logs a follow-up interaction, updates lead status & next follow-up schedule.
   */
  static async logFollowUp(user: AuthenticatedUser, input: LogFollowUpInput) {
    const hasUpdate = hasPermission(user.permissions, "leads:update");
    if (!hasUpdate) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to update leads.",
      });
    }

    const lead = await db.lead.findUnique({
      where: { id: input.leadId },
    });

    if (!lead) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Lead with ID '${input.leadId}' not found.`,
      });
    }

    const hasReadAll = canReadAllLeads(user);
    const canUpdateLead =
      hasReadAll ||
      lead.assignedToId === user.id ||
      lead.assignedCounselorId === user.id ||
      lead.assignedTelecallerId === user.id ||
      lead.assignedToId === null;

    if (!canUpdateLead) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only update leads assigned to you.",
      });
    }

    const followUp = await db.followUpHistory.create({
      data: {
        leadId: input.leadId,
        type: input.type,
        notes: input.notes.trim(),
        nextFollowUpDate: input.nextFollowUpDate ?? null,
        performedById: user.id,
      },
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const updatedLead = await db.lead.update({
      where: { id: input.leadId },
      data: {
        status: input.newStatus || lead.status,
        nextFollowUp: input.nextFollowUpDate !== undefined ? input.nextFollowUpDate : lead.nextFollowUp,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "LEAD_FOLLOW_UP_LOGGED",
      resourceType: "Lead",
      resourceId: lead.id,
      previousData: { status: lead.status, nextFollowUp: lead.nextFollowUp },
      newData: {
        status: updatedLead.status,
        nextFollowUp: updatedLead.nextFollowUp,
        followUpType: input.type,
      },
    });

    return { followUp, lead: updatedLead };
  }

  /**
   * Reassigns a lead to another counselor or unassigns.
   * Requires 'leads:assign' permission.
   */
  static async assignLead(user: AuthenticatedUser, input: AssignLeadInput) {
    const canAssign = hasPermission(user.permissions, "leads:assign");
    if (!canAssign) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to assign leads.",
      });
    }

    const lead = await db.lead.findUnique({
      where: { id: input.leadId },
    });

    if (!lead) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Lead with ID '${input.leadId}' not found.`,
      });
    }

    const updatedLead = await db.lead.update({
      where: { id: input.leadId },
      data: {
        assignedToId: input.assignedToId,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "LEAD_ASSIGNED",
      resourceType: "Lead",
      resourceId: lead.id,
      previousData: { assignedToId: lead.assignedToId },
      newData: { assignedToId: input.assignedToId },
    });

    return updatedLead;
  }

  /**
   * Manually creates a lead by Counselor, Telecaller, or Administrator.
   */
  static async createLead(user: AuthenticatedUser, input: CreateLeadManualInput) {
    const canCreate = hasPermission(user.permissions, "leads:create");
    if (!canCreate) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to create leads.",
      });
    }

    const cleanPhone = normalizePhone(input.phone);
    const cleanEmail = input.email && input.email.trim().length > 0
      ? normalizeEmail(input.email)
      : `${cleanPhone}@lead.softlabglobal.com`;

    // Check duplicate
    const existing = await db.lead.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
    });

    if (existing) {
      const updatedNotes = input.notes
        ? `${existing.notes || ""}\n[Manual Re-inquiry by ${user.firstName} ${user.lastName} on ${new Date().toISOString()}]: ${input.notes}`.trim()
        : existing.notes;

      const updated = await db.lead.update({
        where: { id: existing.id },
        data: {
          notes: updatedNotes,
          interestedCourseId: input.interestedCourseId || existing.interestedCourseId,
          city: input.city || existing.city,
          qualification: input.qualification || existing.qualification,
          nextFollowUp: input.nextFollowUp || existing.nextFollowUp,
        },
        include: {
          course: { select: { id: true, title: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await db.leadActivity.create({
        data: {
          leadId: existing.id,
          userId: user.id,
          activityType: "NOTE_ADDED",
          disposition: "DUPLICATE_UPDATED",
          notes: `Updated lead via manual entry by ${user.firstName} ${user.lastName}.`,
        },
      });

      return { lead: updated, isNew: false };
    }

    const assignedToId = input.assignedToId || user.id;
    const assignedCounselorId = input.assignedCounselorId || (user.roleCode === "COUNSELOR" ? user.id : null);
    const assignedTelecallerId = input.assignedTelecallerId || (user.roleCode === "TELECALLER" ? user.id : null);

    const lead = await db.lead.create({
      data: {
        fullName: input.fullName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        city: input.city?.trim() || null,
        qualification: input.qualification?.trim() || null,
        source: input.source || LeadSource.WALK_IN,
        status: LeadStatus.NEW,
        qualityScore: input.qualityScore || "WARM",
        interestedCourseId: input.interestedCourseId || null,
        notes: input.notes?.trim() || null,
        assignedToId,
        assignedCounselorId,
        assignedTelecallerId,
        nextFollowUp: input.nextFollowUp || null,
        createdById: user.id,
      },
      include: {
        course: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await db.leadActivity.create({
      data: {
        leadId: lead.id,
        userId: user.id,
        activityType: "MANUAL_CREATED",
        disposition: "NEW_MANUAL_LEAD",
        notes: `Lead manually entered by ${user.firstName} ${user.lastName} (${user.roleCode}). Source: ${lead.source}.`,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "LEAD_MANUALLY_CREATED",
      resourceType: "Lead",
      resourceId: lead.id,
      newData: { email: cleanEmail, phone: cleanPhone, source: lead.source },
    });

    return { lead, isNew: true };
  }

  /**
   * Retrieves pipeline Kanban view of leads grouped by stage.
   */
  static async getPipelineOverview(user: AuthenticatedUser, courseId?: string) {
    const hasReadAll = canReadAllLeads(user);
    const hasReadOwn = canReadOwnLeads(user);

    if (!hasReadAll && !hasReadOwn) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to view leads pipeline.",
      });
    }

    const where: Prisma.LeadWhereInput = {};
    if (!hasReadAll) {
      where.OR = [
        { assignedToId: user.id },
        { assignedCounselorId: user.id },
        { assignedTelecallerId: user.id },
        { assignedToId: null },
      ];
    }

    if (courseId) {
      where.interestedCourseId = courseId;
    }

    const leads = await db.lead.findMany({
      where,
      orderBy: [{ nextFollowUp: "asc" }, { createdAt: "desc" }],
      include: {
        course: { select: { id: true, title: true, baseFee: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { followUps: true, applications: true } },
      },
    });

    const pipelineStages: Record<LeadStatus, typeof leads> = {
      [LeadStatus.NEW]: [],
      [LeadStatus.CONTACTED]: [],
      [LeadStatus.FOLLOW_UP]: [],
      [LeadStatus.INTERESTED]: [],
      [LeadStatus.DEMO]: [],
      [LeadStatus.NEGOTIATION]: [],
      [LeadStatus.ADMITTED]: [],
      [LeadStatus.LOST]: [],
    };

    for (const lead of leads) {
      if (pipelineStages[lead.status]) {
        pipelineStages[lead.status].push(lead);
      } else {
        pipelineStages[LeadStatus.NEW].push(lead);
      }
    }

    const counts: Record<LeadStatus, number> = {
      [LeadStatus.NEW]: pipelineStages[LeadStatus.NEW].length,
      [LeadStatus.CONTACTED]: pipelineStages[LeadStatus.CONTACTED].length,
      [LeadStatus.FOLLOW_UP]: pipelineStages[LeadStatus.FOLLOW_UP].length,
      [LeadStatus.INTERESTED]: pipelineStages[LeadStatus.INTERESTED].length,
      [LeadStatus.DEMO]: pipelineStages[LeadStatus.DEMO].length,
      [LeadStatus.NEGOTIATION]: pipelineStages[LeadStatus.NEGOTIATION].length,
      [LeadStatus.ADMITTED]: pipelineStages[LeadStatus.ADMITTED].length,
      [LeadStatus.LOST]: pipelineStages[LeadStatus.LOST].length,
    };

    return {
      total: leads.length,
      stages: pipelineStages,
      counts,
    };
  }

  /**
   * One-click stage progression for Kanban cards.
   */
  static async updateLeadStage(user: AuthenticatedUser, leadId: string, newStatus: LeadStatus) {
    const hasUpdate = hasPermission(user.permissions, "leads:update");
    if (!hasUpdate) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to update leads.",
      });
    }

    const lead = await db.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Lead with ID '${leadId}' not found.`,
      });
    }

    const updated = await db.lead.update({
      where: { id: leadId },
      data: { status: newStatus },
      include: {
        course: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await db.leadActivity.create({
      data: {
        leadId,
        userId: user.id,
        activityType: "STATUS_CHANGE",
        disposition: newStatus,
        notes: `Stage changed from ${lead.status} to ${newStatus} by ${user.firstName} ${user.lastName}.`,
      },
    });

    await db.followUpHistory.create({
      data: {
        leadId,
        type: FollowUpType.STATUS_CHANGE,
        notes: `Pipeline stage updated to ${newStatus}`,
        performedById: user.id,
      },
    });

    return updated;
  }

  /**
   * Logs a rapid calling disposition (CONNECTED, CALLBACK, BUSY, INTERESTED, NOT_INTERESTED).
   * Creates a LeadActivity record and optionally updates status / follow-up date.
   */
  static async logDisposition(
    user: AuthenticatedUser,
    input: {
      leadId: string;
      disposition: string;
      notes?: string;
      newStatus?: LeadStatus;
      nextFollowUpDate?: Date | null;
    }
  ) {
    const lead = await db.lead.findUnique({
      where: { id: input.leadId },
    });

    if (!lead) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Lead with ID '${input.leadId}' not found.`,
      });
    }

    const activity = await db.leadActivity.create({
      data: {
        leadId: input.leadId,
        userId: user.id,
        activityType: "CALL_DISPOSITION",
        disposition: input.disposition,
        notes: input.notes || `Disposition logged: ${input.disposition}`,
      },
    });

    if (input.newStatus || input.nextFollowUpDate !== undefined) {
      await db.lead.update({
        where: { id: input.leadId },
        data: {
          ...(input.newStatus ? { status: input.newStatus } : {}),
          ...(input.nextFollowUpDate !== undefined ? { nextFollowUp: input.nextFollowUpDate } : {}),
        },
      });
    }

    return activity;
  }

  /**
   * Retrieves high-level digital marketing attribution & conversion analytics.
   */
  static async getMarketingAnalytics() {
    const [groupedStats, recentActivities, boostTotal, boostAdmitted] = await Promise.all([
      db.lead.groupBy({
        by: ["source", "status"],
        _count: { id: true },
      }),
      db.leadActivity.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          lead: { select: { id: true, fullName: true, phone: true, source: true } },
          user: { select: { id: true, firstName: true, lastName: true, roleCode: true } },
        },
      }),
      db.lead.count({
        where: {
          OR: [
            { adCreativeName: { contains: META_ADS_CONFIG.ACTIVE_BOOST.boostId } },
            { campaignName: { contains: META_ADS_CONFIG.ACTIVE_BOOST.boostId } },
            { notes: { contains: META_ADS_CONFIG.ACTIVE_BOOST.boostId } },
          ],
        },
      }),
      db.lead.count({
        where: {
          status: LeadStatus.ADMITTED,
          OR: [
            { adCreativeName: { contains: META_ADS_CONFIG.ACTIVE_BOOST.boostId } },
            { campaignName: { contains: META_ADS_CONFIG.ACTIVE_BOOST.boostId } },
            { notes: { contains: META_ADS_CONFIG.ACTIVE_BOOST.boostId } },
          ],
        },
      }),
    ]);

    let totalJustDial = 0;
    let admittedJustDial = 0;
    let totalGoogle = 0;
    let admittedGoogle = 0;
    let totalMetaFb = 0;
    let admittedMetaFb = 0;
    let totalInstagram = 0;
    let admittedInstagram = 0;
    let totalWebsite = 0;
    let admittedWebsite = 0;

    for (const stat of groupedStats) {
      const count = stat._count.id;
      const isAdmitted = stat.status === LeadStatus.ADMITTED;

      if (stat.source === LeadSource.JUSTDIAL) {
        totalJustDial += count;
        if (isAdmitted) admittedJustDial += count;
      } else if (stat.source === LeadSource.GOOGLE_ADS) {
        totalGoogle += count;
        if (isAdmitted) admittedGoogle += count;
      } else if (stat.source === LeadSource.META_ADS_FB) {
        totalMetaFb += count;
        if (isAdmitted) admittedMetaFb += count;
      } else if (stat.source === LeadSource.META_ADS_IG) {
        totalInstagram += count;
        if (isAdmitted) admittedInstagram += count;
      } else if (stat.source === LeadSource.WEBSITE) {
        totalWebsite += count;
        if (isAdmitted) admittedWebsite += count;
      }
    }

    const totalMetaCombined = totalMetaFb + totalInstagram;
    const admittedMetaCombined = admittedMetaFb + admittedInstagram;

    return {
      platforms: {
        justdial: { total: totalJustDial, admitted: admittedJustDial, conversionRate: totalJustDial > 0 ? ((admittedJustDial / totalJustDial) * 100).toFixed(1) : "0.0" },
        googleAds: { total: totalGoogle, admitted: admittedGoogle, conversionRate: totalGoogle > 0 ? ((admittedGoogle / totalGoogle) * 100).toFixed(1) : "0.0" },
        metaAds: { total: totalMetaCombined, admitted: admittedMetaCombined, conversionRate: totalMetaCombined > 0 ? ((admittedMetaCombined / totalMetaCombined) * 100).toFixed(1) : "0.0" },
        facebookAds: { total: totalMetaFb, admitted: admittedMetaFb, conversionRate: totalMetaFb > 0 ? ((admittedMetaFb / totalMetaFb) * 100).toFixed(1) : "0.0" },
        instagram: { total: totalInstagram, admitted: admittedInstagram, conversionRate: totalInstagram > 0 ? ((admittedInstagram / totalInstagram) * 100).toFixed(1) : "0.0" },
        website: { total: totalWebsite, admitted: admittedWebsite, conversionRate: totalWebsite > 0 ? ((admittedWebsite / totalWebsite) * 100).toFixed(1) : "0.0" },
      },
      activeBoostCampaign: {
        ...META_ADS_CONFIG.ACTIVE_BOOST,
        totalLeads: boostTotal,
        admittedLeads: boostAdmitted,
        conversionRate: boostTotal > 0 ? ((boostAdmitted / boostTotal) * 100).toFixed(1) : "0.0",
      },
      recentActivities,
    };
  }
}
