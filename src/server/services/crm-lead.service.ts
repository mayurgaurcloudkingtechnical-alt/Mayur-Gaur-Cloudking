import { db } from "@/server/db/client";
import { AuthenticatedUser, hasPermission } from "@/server/auth/rbac";
import { RateLimiter } from "@/server/lib/rate-limiter";
import { AuditService } from "@/server/services/audit.service";
import { TRPCError } from "@trpc/server";
import {
  LeadSource,
  LeadStatus,
  FollowUpType,
  Prisma,
  UserRoleCode,
  NotificationType,
  NotificationPriority,
  FranchiseStatus,
  FranchisePackageType,
  FeePaymentStatus,
  PaymentMethod,
} from "@prisma/client";
import { META_ADS_CONFIG } from "@/server/config/meta-ads.config";

export interface FranchiseEnquiryInput {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  preferredLocation?: string;
  applicantProfile: string;
  investmentCapacity: string;
  existingInstitute?: boolean;
  experience?: string;
  launchTimeline?: string;
  requirements?: string;
  notes?: string;
  campaignName?: string;
  adsetName?: string;
  adCreativeName?: string;
  keywordSearch?: string;
  landingPageUrl?: string;
  honeypot?: string;
}

export interface ListFranchiseLeadsInput {
  status?: LeadStatus;
  state?: string;
  search?: string;
  investmentCapacity?: string;
  page?: number;
  limit?: number;
}

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
  source?: LeadSource | string;
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

export const META_SOURCES: LeadSource[] = [
  LeadSource.META,
  LeadSource.META_ADS_FB,
  LeadSource.META_ADS_IG,
  LeadSource.SOCIAL_MEDIA,
];

export function isMetaLeadSource(source?: LeadSource | string | null): boolean {
  if (!source) return false;
  return META_SOURCES.includes(source as LeadSource);
}

export function canReadAllLeads(user: AuthenticatedUser): boolean {
  return (
    user.roleCode === UserRoleCode.SUPER_ADMIN ||
    user.roleCode === UserRoleCode.DIRECTOR ||
    user.roleCode === UserRoleCode.ADMIN ||
    user.roleCode === UserRoleCode.MANAGER ||
    user.roleCode === UserRoleCode.COUNSELOR ||
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

export function canManageFranchise(user: AuthenticatedUser): boolean {
  return (
    user.roleCode === UserRoleCode.SUPER_ADMIN ||
    user.roleCode === UserRoleCode.DIRECTOR ||
    user.roleCode === UserRoleCode.ADMIN ||
    user.roleCode === UserRoleCode.MANAGER ||
    hasPermission(user.permissions, "franchise:manage")
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

    let matchedCourseId: string | null = null;
    let providerType: string = "SOFTLAB";
    let providerName: string = "SoftLab Global";
    let universityName: string | null = null;
    let universityProgram: string | null = null;

    if (input.interestedCourseId) {
      const cleanSearch = input.interestedCourseId
        .replace(/^Dr\.?\s*Preeti\s*Global\s*University\s*-\s*/i, "")
        .trim();

      const foundCourse = await db.course.findFirst({
        where: {
          OR: [
            { id: input.interestedCourseId },
            { slug: input.interestedCourseId },
            { title: { contains: cleanSearch, mode: "insensitive" } },
          ],
        },
      });

      if (foundCourse) {
        matchedCourseId = foundCourse.id;
        providerType = foundCourse.providerType || "SOFTLAB";
        providerName = foundCourse.providerName || "SoftLab Global";
        universityName = foundCourse.universityName || null;
        universityProgram = foundCourse.providerType === "UNIVERSITY" ? foundCourse.title : null;
      } else if (input.interestedCourseId.toLowerCase().includes("preeti") || input.interestedCourseId.toLowerCase().includes("dpgu")) {
        providerType = "UNIVERSITY";
        providerName = "Dr. Preeti Global University";
        universityName = "Dr. Preeti Global University";
        universityProgram = cleanSearch;
      }
    }

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
        interestedCourseId: matchedCourseId,
        providerType,
        providerName,
        universityName,
        universityProgram,
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

    const andConditions: Prisma.LeadWhereInput[] = [];

    if (user.roleCode === UserRoleCode.TELECALLER) {
      // Telecallers have full visibility over all Meta leads (FB, IG, etc.), plus assigned or unassigned leads
      andConditions.push({
        OR: [
          { source: { in: META_SOURCES } },
          { assignedToId: user.id },
          { assignedCounselorId: user.id },
          { assignedTelecallerId: user.id },
          { assignedToId: null },
        ],
      });
    } else if (!hasReadAll) {
      andConditions.push({
        OR: [
          { assignedToId: user.id },
          { assignedCounselorId: user.id },
          { assignedTelecallerId: user.id },
          { assignedToId: null },
        ],
      });
    } else if (input.assignedToId) {
      andConditions.push({
        OR: [
          { assignedToId: input.assignedToId },
          { assignedCounselorId: input.assignedToId },
          { assignedTelecallerId: input.assignedToId },
        ],
      });
    }

    if (input.status) {
      andConditions.push({ status: input.status });
    }

    if (input.source) {
      if (input.source === "GOOGLE_ALL" || input.source === "GOOGLE_ADS") {
        andConditions.push({
          source: { in: [LeadSource.GOOGLE_ADS, LeadSource.GOOGLE, LeadSource.GOOGLE_SEARCH] },
        });
      } else if (input.source === "META_ALL" || input.source === "META_ADS") {
        andConditions.push({
          source: { in: [LeadSource.META_ADS_FB, LeadSource.META_ADS_IG, LeadSource.META] },
        });
      } else if (input.source in LeadSource) {
        andConditions.push({ source: input.source as LeadSource });
      }
    }

    if (input.courseId) {
      andConditions.push({ interestedCourseId: input.courseId });
    }

    if (input.search && input.search.trim().length > 0) {
      const q = input.search.trim();
      andConditions.push({
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { campaignName: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    if (input.dueToday) {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      andConditions.push({
        nextFollowUp: {
          not: null,
          lte: endOfToday,
        },
      });
    }

    const where: Prisma.LeadWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const page = Math.max(1, input.page || 1);
    const limit = Math.min(50, Math.max(1, input.limit || 20));
    const skip = (page - 1) * limit;

    const orderBy: Prisma.LeadOrderByWithRelationInput[] = input.dueToday
      ? [{ nextFollowUp: "asc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

    const [total, leads] = await Promise.all([
      db.lead.count({ where }),
      db.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
            payments: {
              where: { status: "SUCCESS" },
              select: { id: true, receiptNumber: true, transactionReference: true, amount: true, paidAt: true, paymentMethod: true },
            },
            convertedStudentProfile: {
              select: { id: true, studentId: true },
            },
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
      user.roleCode === UserRoleCode.COUNSELOR ||
      (user.roleCode === UserRoleCode.TELECALLER && isMetaLeadSource(lead.source)) ||
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
      user.roleCode === UserRoleCode.COUNSELOR ||
      (user.roleCode === UserRoleCode.TELECALLER && isMetaLeadSource(lead.source)) ||
      lead.assignedToId === user.id ||
      lead.assignedCounselorId === user.id ||
      lead.assignedTelecallerId === user.id ||
      lead.assignedToId === null;

    if (!canUpdateLead) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only update leads assigned to you or within your authorized channel pool.",
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
      [LeadStatus.DISCUSSION]: [],
      [LeadStatus.LOCATION_EVALUATION]: [],
      [LeadStatus.PROPOSAL_SENT]: [],
      [LeadStatus.APPROVED]: [],
      [LeadStatus.AGREEMENT]: [],
      [LeadStatus.SETUP]: [],
      [LeadStatus.LAUNCHED]: [],
      [LeadStatus.ON_HOLD]: [],
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
      [LeadStatus.DISCUSSION]: pipelineStages[LeadStatus.DISCUSSION].length,
      [LeadStatus.LOCATION_EVALUATION]: pipelineStages[LeadStatus.LOCATION_EVALUATION].length,
      [LeadStatus.PROPOSAL_SENT]: pipelineStages[LeadStatus.PROPOSAL_SENT].length,
      [LeadStatus.APPROVED]: pipelineStages[LeadStatus.APPROVED].length,
      [LeadStatus.AGREEMENT]: pipelineStages[LeadStatus.AGREEMENT].length,
      [LeadStatus.SETUP]: pipelineStages[LeadStatus.SETUP].length,
      [LeadStatus.LAUNCHED]: pipelineStages[LeadStatus.LAUNCHED].length,
      [LeadStatus.ON_HOLD]: pipelineStages[LeadStatus.ON_HOLD].length,
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
      } else if (
        stat.source === LeadSource.GOOGLE_ADS ||
        stat.source === LeadSource.GOOGLE ||
        stat.source === LeadSource.GOOGLE_SEARCH
      ) {
        totalGoogle += count;
        if (isAdmitted) admittedGoogle += count;
      } else if (
        stat.source === LeadSource.META_ADS_FB ||
        stat.source === LeadSource.META
      ) {
        totalMetaFb += count;
        if (isAdmitted) admittedMetaFb += count;
      } else if (stat.source === LeadSource.META_ADS_IG) {
        totalInstagram += count;
        if (isAdmitted) admittedInstagram += count;
      } else if (
        stat.source === LeadSource.WEBSITE ||
        stat.source === LeadSource.WEBSITE_CAREER_POPUP ||
        stat.source === LeadSource.CAREER_POPUP ||
        stat.source === LeadSource.CONTACT_FORM ||
        stat.source === LeadSource.COURSE_PAGE
      ) {
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

  /**
   * Captures public franchise enquiries with honeypot spam protection,
   * rate limiting, phone/email normalization, deduplication, audit logging,
   * and stakeholder notification.
   */
  static async submitFranchiseEnquiry(
    input: FranchiseEnquiryInput,
    ipAddress = "127.0.0.1",
    userAgent = "unknown"
  ) {
    if (input.honeypot && input.honeypot.trim().length > 0) {
      return {
        success: true,
        isNew: false,
        leadId: "spam-filtered",
        referenceNumber: "SLG-FRN-2026-SPAM",
        message: "Your application has been received.",
      };
    }

    const rateKey = `crm:franchise:${ipAddress}`;
    const rateCheck = RateLimiter.check(rateKey, 10, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many franchise enquiry attempts. Please wait a few minutes before submitting again.",
      });
    }

    const cleanPhone = normalizePhone(input.phone);
    const cleanEmail = normalizeEmail(input.email);

    // Deduplication check: check if a lead with this phone or email already exists
    const existingLead = await db.lead.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { email: cleanEmail },
        ],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        notes: true,
        status: true,
        assignedToId: true,
      },
    });

    if (existingLead) {
      const appendNote = `\n[${new Date().toISOString()}] Franchise Opportunity Re-Enquiry:
Profile: ${input.applicantProfile} | Budget: ${input.investmentCapacity} | State: ${input.state} | City: ${input.city} | Timeline: ${input.launchTimeline || "N/A"}
${input.notes ? `User Note: ${input.notes}` : ""}`;

      const updatedLead = await db.lead.update({
        where: { id: existingLead.id },
        data: {
          franchiseState: input.state,
          franchisePreferredLocation: input.preferredLocation?.trim() || input.city.trim(),
          franchiseProfile: input.applicantProfile,
          franchiseInvestmentCapacity: input.investmentCapacity,
          franchiseExistingInstitute: input.existingInstitute ?? false,
          franchiseExperience: input.experience || null,
          franchiseLaunchTimeline: input.launchTimeline || null,
          franchiseRequirements: input.requirements || null,
          notes: existingLead.notes ? `${existingLead.notes}${appendNote}` : appendNote.trim(),
        },
      });

      await db.leadActivity.create({
        data: {
          leadId: existingLead.id,
          activityType: "FRANCHISE_ENQUIRY_RECEIVED",
          disposition: "RE_ENGAGED",
          notes: `Re-engaged franchise application from /franchise. State: ${input.state}, City: ${input.city}, Profile: ${input.applicantProfile}, Investment: ${input.investmentCapacity}.`,
        },
      });

      try {
        const admins = await db.user.findMany({
          where: {
            status: "ACTIVE",
            roleCode: { in: [UserRoleCode.SUPER_ADMIN, UserRoleCode.DIRECTOR, UserRoleCode.ADMIN] },
          },
          select: { id: true },
        });

        if (admins.length > 0) {
          await db.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              title: `🏛️ [Franchise] Application Re-engaged: ${input.fullName}`,
              message: `${input.fullName} (${cleanPhone}) has re-submitted a franchise inquiry for ${input.city}, ${input.state} (Budget: ${input.investmentCapacity}).`,
              type: NotificationType.ADMISSION,
              priority: NotificationPriority.HIGH,
              link: `/admin/franchise`,
            })),
          });
        }
      } catch (err) {
        console.error("Failed to notify admins of franchise re-engagement:", err);
      }

      const refNo = `SLG-FRN-2026-${existingLead.id.slice(-4).toUpperCase()}`;
      return {
        success: true,
        isNew: false,
        leadId: existingLead.id,
        referenceNumber: refNo,
        message: "Thank you for re-connecting! Your franchise application has been refreshed.",
      };
    }

    // Auto-assign to an active Super Admin or Director
    const assignedAdmin = await db.user.findFirst({
      where: {
        status: "ACTIVE",
        roleCode: { in: [UserRoleCode.SUPER_ADMIN, UserRoleCode.DIRECTOR, UserRoleCode.ADMIN] },
      },
      select: { id: true },
      orderBy: { updatedAt: "asc" },
    });

    const newLead = await db.lead.create({
      data: {
        fullName: input.fullName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        city: input.city.trim(),
        source: LeadSource.FRANCHISE_WEBSITE,
        status: LeadStatus.NEW,
        qualityScore: "HOT",
        franchiseState: input.state,
        franchisePreferredLocation: input.preferredLocation?.trim() || input.city.trim(),
        franchiseProfile: input.applicantProfile,
        franchiseInvestmentCapacity: input.investmentCapacity,
        franchiseExistingInstitute: input.existingInstitute ?? false,
        franchiseExperience: input.experience || null,
        franchiseLaunchTimeline: input.launchTimeline || null,
        franchiseRequirements: input.requirements || null,
        notes: `Franchise Opportunity Application.
Profile: ${input.applicantProfile} | Budget: ${input.investmentCapacity} | Timeline: ${input.launchTimeline || "N/A"}
${input.notes ? `Note: ${input.notes}` : ""}`.trim(),
        campaignName: input.campaignName || null,
        adsetName: input.adsetName || null,
        adCreativeName: input.adCreativeName || null,
        keywordSearch: input.keywordSearch || null,
        landingPageUrl: input.landingPageUrl || "/franchise",
        assignedToId: assignedAdmin?.id || null,
      },
    });

    await db.leadActivity.create({
      data: {
        leadId: newLead.id,
        activityType: "FRANCHISE_ENQUIRY_RECEIVED",
        disposition: "NEW_ENQUIRY",
        notes: `New franchise opportunity application from /franchise. Profile: ${input.applicantProfile}, Investment: ${input.investmentCapacity}, Location: ${input.city}, ${input.state}.`,
      },
    });

    await AuditService.log({
      action: "FRANCHISE_ENQUIRY_RECEIVED",
      resourceType: "Lead",
      resourceId: newLead.id,
      newData: {
        fullName: newLead.fullName,
        email: cleanEmail,
        phone: cleanPhone,
        city: newLead.city,
        state: input.state,
        investment: input.investmentCapacity,
      },
      ipAddress,
      userAgent,
    });

    try {
      const admins = await db.user.findMany({
        where: {
          status: "ACTIVE",
          roleCode: { in: [UserRoleCode.SUPER_ADMIN, UserRoleCode.DIRECTOR, UserRoleCode.ADMIN] },
        },
        select: { id: true },
      });

      if (admins.length > 0) {
        await db.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: `🏛️ [Franchise] New Enquiry: ${newLead.fullName}`,
            message: `New Franchise application from ${newLead.fullName} (${cleanPhone}) for ${input.city}, ${input.state} (Budget: ${input.investmentCapacity}).`,
            type: NotificationType.ADMISSION,
            priority: NotificationPriority.URGENT,
            link: `/admin/franchise`,
          })),
        });
      }
    } catch (err) {
      console.error("Failed to notify admins of new franchise lead:", err);
    }

    const refNo = `SLG-FRN-2026-${newLead.id.slice(-4).toUpperCase()}`;
    return {
      success: true,
      isNew: true,
      leadId: newLead.id,
      referenceNumber: refNo,
      message: "Thank you for your interest! Your franchise application has been submitted successfully.",
    };
  }

  /**
   * Lists franchise leads with filtering, pagination, and relation includes.
   */
  static async listFranchiseLeads(user: AuthenticatedUser, input: ListFranchiseLeadsInput) {
    if (!canManageFranchise(user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to view franchise applications.",
      });
    }

    const page = Math.max(1, input.page || 1);
    const limit = Math.min(100, Math.max(1, input.limit || 25));
    const skip = (page - 1) * limit;

    const andConditions: Prisma.LeadWhereInput[] = [
      {
        OR: [
          { source: { in: [LeadSource.FRANCHISE, LeadSource.FRANCHISE_WEBSITE] } },
          { franchiseState: { not: null } },
        ],
      },
    ];

    if (input.status) {
      andConditions.push({ status: input.status });
    }

    if (input.state && input.state !== "ALL") {
      andConditions.push({
        franchiseState: { equals: input.state, mode: "insensitive" },
      });
    }

    if (input.investmentCapacity && input.investmentCapacity !== "ALL") {
      andConditions.push({
        franchiseInvestmentCapacity: { equals: input.investmentCapacity },
      });
    }

    if (input.search && input.search.trim().length > 0) {
      const q = input.search.trim();
      andConditions.push({
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { city: { contains: q, mode: "insensitive" } },
          { franchiseState: { contains: q, mode: "insensitive" } },
          { franchisePreferredLocation: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const where: Prisma.LeadWhereInput = { AND: andConditions };

    const [total, leads] = await Promise.all([
      db.lead.count({ where }),
      db.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
          followUps: {
            orderBy: { createdAt: "desc" },
            take: 3,
            include: {
              performedBy: { select: { firstName: true, lastName: true } },
            },
          },
          activities: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
          _count: {
            select: {
              followUps: true,
              activities: true,
            },
          },
        },
      }),
    ]);

    return {
      leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Pipeline and distribution metrics for franchise applications.
   */
  static async getFranchiseStats(user: AuthenticatedUser) {
    if (!canManageFranchise(user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to view franchise statistics.",
      });
    }

    const franchiseWhere: Prisma.LeadWhereInput = {
      OR: [
        { source: { in: [LeadSource.FRANCHISE, LeadSource.FRANCHISE_WEBSITE] } },
        { franchiseState: { not: null } },
      ],
    };

    const [total, statusGroups, leadsData, recentActivities] = await Promise.all([
      db.lead.count({ where: franchiseWhere }),
      db.lead.groupBy({
        by: ["status"],
        where: franchiseWhere,
        _count: { id: true },
      }),
      db.lead.findMany({
        where: franchiseWhere,
        select: {
          franchiseState: true,
          franchiseProfile: true,
          franchiseInvestmentCapacity: true,
          city: true,
        },
      }),
      db.leadActivity.findMany({
        where: {
          lead: franchiseWhere,
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          lead: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              city: true,
              franchiseState: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              roleCode: true,
            },
          },
        },
      }),
    ]);

    const pipelineCounts: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      DISCUSSION: 0,
      LOCATION_EVALUATION: 0,
      PROPOSAL_SENT: 0,
      APPROVED: 0,
      AGREEMENT: 0,
      SETUP: 0,
      LAUNCHED: 0,
      ON_HOLD: 0,
      LOST: 0,
    };

    for (const group of statusGroups) {
      pipelineCounts[group.status] = (pipelineCounts[group.status] || 0) + group._count.id;
    }

    const stateCounts: Record<string, number> = {};
    const profileCounts: Record<string, number> = {};
    const investmentCounts: Record<string, number> = {};

    for (const lead of leadsData) {
      if (lead.franchiseState) {
        stateCounts[lead.franchiseState] = (stateCounts[lead.franchiseState] || 0) + 1;
      }
      if (lead.franchiseProfile) {
        profileCounts[lead.franchiseProfile] = (profileCounts[lead.franchiseProfile] || 0) + 1;
      }
      if (lead.franchiseInvestmentCapacity) {
        investmentCounts[lead.franchiseInvestmentCapacity] =
          (investmentCounts[lead.franchiseInvestmentCapacity] || 0) + 1;
      }
    }

    return {
      total,
      pipeline: pipelineCounts,
      stateBreakdown: Object.entries(stateCounts)
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count),
      profileBreakdown: Object.entries(profileCounts)
        .map(([profile, count]) => ({ profile, count }))
        .sort((a, b) => b.count - a.count),
      investmentBreakdown: Object.entries(investmentCounts)
        .map(([capacity, count]) => ({ capacity, count }))
        .sort((a, b) => b.count - a.count),
      recentActivities,
    };
  }

  /**
   * Updates pipeline status of a franchise lead.
   */
  static async updateFranchiseLeadStatus(
    user: AuthenticatedUser,
    input: { leadId: string; status: LeadStatus; notes?: string }
  ) {
    if (!canManageFranchise(user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to update franchise status.",
      });
    }

    const existing = await db.lead.findUnique({
      where: { id: input.leadId },
      select: { id: true, status: true, fullName: true, notes: true },
    });

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Franchise lead not found." });
    }

    const updated = await db.lead.update({
      where: { id: input.leadId },
      data: {
        status: input.status,
        notes: input.notes
          ? `${existing.notes || ""}\n[Status updated to ${input.status} by ${user.firstName}]: ${input.notes}`.trim()
          : undefined,
      },
    });

    const userExists = user.id ? await db.user.findUnique({ where: { id: user.id }, select: { id: true } }) : null;
    const actorId = userExists ? user.id : null;

    await db.leadActivity.create({
      data: {
        leadId: input.leadId,
        userId: actorId,
        activityType: "STATUS_CHANGE",
        disposition: input.status,
        notes: `Status changed from ${existing.status} to ${input.status}. ${input.notes || ""}`.trim(),
      },
    });

    await AuditService.log({
      action: "LEAD_STATUS_UPDATE",
      resourceType: "Lead",
      resourceId: input.leadId,
      actorId,
      previousData: { status: existing.status },
      newData: { status: input.status, notes: input.notes },
    });

    return updated;
  }

  /**
   * Logs a follow-up for a franchise lead.
   */
  static async addFranchiseFollowUp(
    user: AuthenticatedUser,
    input: {
      leadId: string;
      type: FollowUpType;
      notes: string;
      nextFollowUpDate?: Date | null;
      newStatus?: LeadStatus;
    }
  ) {
    if (!canManageFranchise(user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to log follow-up.",
      });
    }

    const userExists = user.id ? await db.user.findUnique({ where: { id: user.id }, select: { id: true } }) : null;
    if (!userExists) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User account not found for logging follow-up.",
      });
    }

    const followUp = await db.followUpHistory.create({
      data: {
        leadId: input.leadId,
        performedById: user.id,
        type: input.type,
        notes: input.notes,
        nextFollowUpDate: input.nextFollowUpDate || null,
      },
    });

    const updateData: Prisma.LeadUpdateInput = {
      nextFollowUp: input.nextFollowUpDate || undefined,
    };

    if (input.newStatus) {
      updateData.status = input.newStatus;
    }

    await db.lead.update({
      where: { id: input.leadId },
      data: updateData,
    });

    await db.leadActivity.create({
      data: {
        leadId: input.leadId,
        userId: user.id,
        activityType: "FOLLOW_UP_LOGGED",
        disposition: input.type,
        notes: `Follow-up logged (${input.type}): ${input.notes}`,
      },
    });

    return followUp;
  }

  /**
   * Assigns a franchise lead to a staff member.
   */
  static async assignFranchiseLead(
    user: AuthenticatedUser,
    input: { leadId: string; assignedToId: string | null }
  ) {
    if (!canManageFranchise(user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to assign franchise leads.",
      });
    }

    const userExists = user.id ? await db.user.findUnique({ where: { id: user.id }, select: { id: true } }) : null;
    const actorId = userExists ? user.id : null;

    const updated = await db.lead.update({
      where: { id: input.leadId },
      data: { assignedToId: input.assignedToId },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await db.leadActivity.create({
      data: {
        leadId: input.leadId,
        userId: actorId,
        activityType: "ASSIGNED",
        notes: input.assignedToId
          ? `Franchise lead assigned to ${updated.assignedTo?.firstName || "Staff"}`
          : "Franchise lead unassigned",
      },
    });

    return updated;
  }

  /**
   * Manually creates a new franchise enquiry.
   */
  static async createFranchiseEnquiry(
    user: AuthenticatedUser,
    input: {
      fullName: string;
      email: string;
      phone: string;
      city: string;
      franchiseState: string;
      franchisePreferredLocation?: string;
      franchiseProfile?: string;
      franchiseInvestmentCapacity?: string;
      franchiseExistingInstitute?: boolean;
      franchiseExperience?: string;
      franchiseLaunchTimeline?: string;
      franchiseRequirements?: string;
      requirements?: string;
      notes?: string;
    }
  ) {
    if (!canManageFranchise(user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to create franchise enquiries.",
      });
    }

    const cleanEmail = input.email.trim().toLowerCase();
    const cleanPhone = input.phone.replace(/[^0-9]/g, "").slice(-10);

    const lead = await db.lead.create({
      data: {
        fullName: input.fullName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        city: input.city.trim(),
        franchiseState: input.franchiseState.trim(),
        franchisePreferredLocation: input.franchisePreferredLocation?.trim() || null,
        franchiseProfile: input.franchiseProfile?.trim() || "Entrepreneur",
        franchiseInvestmentCapacity: input.franchiseInvestmentCapacity || "Under ₹10 Lakh",
        franchiseExistingInstitute: !!input.franchiseExistingInstitute,
        franchiseExperience: input.franchiseExperience?.trim() || null,
        franchiseLaunchTimeline: input.franchiseLaunchTimeline || "Within 30 Days",
        franchiseRequirements: (input as any).franchiseRequirements || (input as any).requirements || null,
        source: LeadSource.FRANCHISE,
        status: LeadStatus.NEW,
        qualityScore: "WARM",
        notes: input.notes?.trim() || null,
        createdById: user.id || null,
      },
    });

    await db.leadActivity.create({
      data: {
        leadId: lead.id,
        userId: user.id || null,
        activityType: "ENQUIRY_CREATED",
        notes: `Franchise enquiry manually added by ${user.firstName} ${user.lastName}`,
      },
    });

    await AuditService.log({
      action: "FRANCHISE_ENQUIRY_CREATED",
      resourceType: "Lead",
      resourceId: lead.id,
      actorId: user.id || null,
      newData: { fullName: lead.fullName, phone: lead.phone, state: lead.franchiseState },
    });

    return lead;
  }

  /**
   * Updates an existing franchise enquiry.
   */
  static async updateFranchiseEnquiry(
    user: AuthenticatedUser,
    input: {
      id: string;
      fullName: string;
      email: string;
      phone: string;
      city: string;
      franchiseState: string;
      franchisePreferredLocation?: string;
      franchiseProfile?: string;
      franchiseInvestmentCapacity?: string;
      franchiseExistingInstitute?: boolean;
      franchiseExperience?: string;
      franchiseLaunchTimeline?: string;
      franchiseRequirements?: string;
      requirements?: string;
      notes?: string;
    }
  ) {
    if (!canManageFranchise(user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to update franchise enquiries.",
      });
    }

    const cleanEmail = input.email.trim().toLowerCase();
    const cleanPhone = input.phone.replace(/[^0-9]/g, "").slice(-10);

    const existing = await db.lead.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Franchise enquiry not found." });
    }

    const updated = await db.lead.update({
      where: { id: input.id },
      data: {
        fullName: input.fullName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        city: input.city.trim(),
        franchiseState: input.franchiseState.trim(),
        franchisePreferredLocation: input.franchisePreferredLocation?.trim() || null,
        franchiseProfile: input.franchiseProfile?.trim() || existing.franchiseProfile,
        franchiseInvestmentCapacity: input.franchiseInvestmentCapacity || existing.franchiseInvestmentCapacity,
        franchiseExistingInstitute: input.franchiseExistingInstitute ?? existing.franchiseExistingInstitute,
        franchiseExperience: input.franchiseExperience?.trim() || existing.franchiseExperience,
        franchiseLaunchTimeline: input.franchiseLaunchTimeline || existing.franchiseLaunchTimeline,
        franchiseRequirements: (input as any).franchiseRequirements !== undefined ? (input as any).franchiseRequirements : (input as any).requirements !== undefined ? (input as any).requirements : existing.franchiseRequirements,
        notes: input.notes !== undefined ? input.notes : existing.notes,
      },
    });

    await db.leadActivity.create({
      data: {
        leadId: input.id,
        userId: user.id || null,
        activityType: "ENQUIRY_UPDATED",
        notes: `Franchise enquiry updated by ${user.firstName} ${user.lastName}`,
      },
    });

    return updated;
  }

  /**
   * Deletes a franchise enquiry if not converted.
   */
  static async deleteFranchiseEnquiry(user: AuthenticatedUser, id: string) {
    if (!canManageFranchise(user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to delete franchise enquiries.",
      });
    }

    const existing = await db.lead.findUnique({
      where: { id },
      include: { convertedFranchise: true },
    });

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Franchise enquiry not found." });
    }

    if (existing.convertedFranchise) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete enquiry with an active converted franchise partner. Please manage the partner center instead.",
      });
    }

    await db.lead.delete({ where: { id } });

    await AuditService.log({
      action: "FRANCHISE_ENQUIRY_DELETED",
      resourceType: "Lead",
      resourceId: id,
      actorId: user.id || null,
      previousData: { fullName: existing.fullName, phone: existing.phone },
    });

    return { success: true };
  }

  /**
   * Converts a franchise lead to an official Franchise Partner Center and records a FranchiseSale.
   */
  static async convertFranchiseToSale(
    user: AuthenticatedUser,
    input: {
      leadId: string;
      centerName: string;
      legalName?: string;
      contactPerson: string;
      email: string;
      phone: string;
      alternatePhone?: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      packageType?: FranchisePackageType;
      packageName: string;
      totalAmountPaise: number;
      discountAmountPaise?: number;
      paidAmountPaise: number;
      paymentMethod: PaymentMethod;
      referenceNumber?: string;
      agreementDate?: Date;
      validUntil?: Date;
      notes?: string;
    }
  ) {
    if (!canManageFranchise(user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to convert franchise sales.",
      });
    }

    const lead = await db.lead.findUnique({
      where: { id: input.leadId },
      include: { convertedFranchise: true },
    });

    if (!lead) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Franchise lead not found." });
    }

    if (lead.convertedFranchise) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `This enquiry has already been converted to center: ${lead.convertedFranchise.centerName} (${lead.convertedFranchise.code}).`,
      });
    }

    const totalPaise = Math.max(0, input.totalAmountPaise);
    const discountPaise = Math.max(0, input.discountAmountPaise || 0);
    const netPaise = Math.max(0, totalPaise - discountPaise);
    const paidPaise = Math.min(netPaise, Math.max(0, input.paidAmountPaise));
    const pendingPaise = netPaise - paidPaise;
    const paymentStatus: FeePaymentStatus =
      pendingPaise === 0
        ? FeePaymentStatus.PAID
        : paidPaise > 0
        ? FeePaymentStatus.PARTIAL
        : FeePaymentStatus.PENDING;

    // Generate center code: SLG-FRN-XXXX
    const centerCount = await db.franchise.count();
    const centerCode = `SLG-FRN-${(centerCount + 1).toString().padStart(4, "0")}`;

    // Generate invoice number: SLG-INV-FRN-YYYY-XXXX
    const year = new Date().getFullYear();
    const saleCount = await db.franchiseSale.count();
    const invoiceNo = `SLG-INV-FRN-${year}-${(saleCount + 1).toString().padStart(4, "0")}`;

    return await db.$transaction(async (tx) => {
      const franchise = await tx.franchise.create({
        data: {
          code: centerCode,
          centerName: input.centerName.trim(),
          legalName: input.legalName?.trim() || null,
          contactPerson: input.contactPerson.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone.trim(),
          alternatePhone: input.alternatePhone?.trim() || null,
          address: input.address.trim(),
          city: input.city.trim(),
          state: input.state.trim(),
          pincode: input.pincode.trim(),
          status: FranchiseStatus.ACTIVE,
          packageType: input.packageType || FranchisePackageType.STANDARD_ATC,
          leadId: lead.id,
          agreementDate: input.agreementDate ? new Date(input.agreementDate) : new Date(),
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          territoryNotes: input.notes?.trim() || null,
          totalRevenue: paidPaise,
          createdById: user.id || null,
        },
      });

      const sale = await tx.franchiseSale.create({
        data: {
          saleInvoiceNo: invoiceNo,
          franchiseId: franchise.id,
          packageName: input.packageName.trim(),
          totalAmount: totalPaise,
          discountAmount: discountPaise,
          netAmount: netPaise,
          paidAmount: paidPaise,
          pendingAmount: pendingPaise,
          paymentStatus,
          paymentMethod: input.paymentMethod,
          referenceNumber: input.referenceNumber?.trim() || null,
          agreementDate: input.agreementDate ? new Date(input.agreementDate) : new Date(),
          notes: input.notes?.trim() || null,
          convertedById: user.id || null,
        },
      });

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: LeadStatus.AGREEMENT,
          notes: `${lead.notes || ""}\n[Converted to Franchise Center ${franchise.centerName} (${franchise.code}) by ${user.firstName}]: Invoice ${invoiceNo}`.trim(),
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          userId: user.id || null,
          activityType: "CONVERTED_TO_FRANCHISE",
          notes: `Converted to active Franchise Partner: ${franchise.centerName} (${franchise.code}). Sale Invoice: ${invoiceNo}, Paid: ₹${(paidPaise / 100).toLocaleString("en-IN")}`,
        },
      });

      await AuditService.log({
        action: "FRANCHISE_CONVERTED",
        resourceType: "Franchise",
        resourceId: franchise.id,
        actorId: user.id || null,
        newData: {
          code: franchise.code,
          centerName: franchise.centerName,
          invoiceNo,
          paidPaise,
          pendingPaise,
        },
      });

      return { franchise, sale };
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * Lists all converted Franchise Centers / Partners.
   */
  static async listFranchisePartners(
    user: AuthenticatedUser,
    input: {
      search?: string;
      status?: FranchiseStatus;
      page?: number;
      limit?: number;
    }
  ) {
    if (!canManageFranchise(user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to view franchise centers.",
      });
    }

    const page = Math.max(1, input.page || 1);
    const limit = Math.min(100, Math.max(1, input.limit || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.FranchiseWhereInput = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.search?.trim()
        ? {
            OR: [
              { centerName: { contains: input.search.trim(), mode: "insensitive" } },
              { code: { contains: input.search.trim(), mode: "insensitive" } },
              { contactPerson: { contains: input.search.trim(), mode: "insensitive" } },
              { email: { contains: input.search.trim(), mode: "insensitive" } },
              { phone: { contains: input.search.trim() } },
              { city: { contains: input.search.trim(), mode: "insensitive" } },
              { state: { contains: input.search.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, partners] = await Promise.all([
      db.franchise.count({ where }),
      db.franchise.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          sales: { orderBy: { createdAt: "desc" } },
          lead: { select: { id: true, fullName: true, phone: true } },
        },
      }),
    ]);

    return {
      partners,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lists all franchise sales transactions / invoices.
   */
  static async listFranchiseSales(
    user: AuthenticatedUser,
    input: {
      search?: string;
      paymentStatus?: FeePaymentStatus;
      page?: number;
      limit?: number;
    }
  ) {
    if (!canManageFranchise(user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to view franchise sales.",
      });
    }

    const page = Math.max(1, input.page || 1);
    const limit = Math.min(100, Math.max(1, input.limit || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.FranchiseSaleWhereInput = {
      ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
      ...(input.search?.trim()
        ? {
            OR: [
              { saleInvoiceNo: { contains: input.search.trim(), mode: "insensitive" } },
              { packageName: { contains: input.search.trim(), mode: "insensitive" } },
              { franchise: { centerName: { contains: input.search.trim(), mode: "insensitive" } } },
              { franchise: { code: { contains: input.search.trim(), mode: "insensitive" } } },
              { referenceNumber: { contains: input.search.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, sales] = await Promise.all([
      db.franchiseSale.count({ where }),
      db.franchiseSale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          franchise: true,
          convertedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    return {
      sales,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns aggregated franchise financial overview.
   */
  static async getFranchiseSalesOverview(user: AuthenticatedUser) {
    if (!canManageFranchise(user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to view franchise financial overview.",
      });
    }

    const [totalCenters, activeCenters, salesAgg] = await Promise.all([
      db.franchise.count(),
      db.franchise.count({ where: { status: FranchiseStatus.ACTIVE } }),
      db.franchiseSale.aggregate({
        _count: { id: true },
        _sum: {
          totalAmount: true,
          discountAmount: true,
          netAmount: true,
          paidAmount: true,
          pendingAmount: true,
        },
      }),
    ]);

    return {
      totalCenters,
      activeCenters,
      totalSalesCount: salesAgg._count.id || 0,
      totalGrossPaise: salesAgg._sum.totalAmount || 0,
      totalDiscountPaise: salesAgg._sum.discountAmount || 0,
      totalNetPaise: salesAgg._sum.netAmount || 0,
      totalCollectedPaise: salesAgg._sum.paidAmount || 0,
      totalPendingPaise: salesAgg._sum.pendingAmount || 0,
    };
  }

  /**
   * Updates an existing franchise sale record (amounts, payment status, payment mode, reference, notes).
   */
  static async updateFranchiseSale(
    user: AuthenticatedUser,
    input: {
      saleId: string;
      packageName?: string;
      totalAmount?: number;
      discountAmount?: number;
      paidAmount?: number;
      pendingAmount?: number;
      paymentStatus?: FeePaymentStatus;
      paymentMethod?: PaymentMethod;
      referenceNumber?: string;
      notes?: string;
    }
  ) {
    if (!canManageFranchise(user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to update franchise sales.",
      });
    }

    const sale = await db.franchiseSale.findUnique({
      where: { id: input.saleId },
      include: { franchise: true },
    });

    if (!sale) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Franchise sale invoice not found.",
      });
    }

    const totalAmount = input.totalAmount !== undefined ? input.totalAmount : sale.totalAmount;
    const discountAmount = input.discountAmount !== undefined ? input.discountAmount : sale.discountAmount;
    const netAmount = Math.max(0, totalAmount - discountAmount);
    const paidAmount = input.paidAmount !== undefined ? input.paidAmount : sale.paidAmount;
    const pendingAmount = input.pendingAmount !== undefined ? input.pendingAmount : Math.max(0, netAmount - paidAmount);

    let paymentStatus = input.paymentStatus || sale.paymentStatus;
    if (input.paidAmount !== undefined && !input.paymentStatus) {
      if (paidAmount >= netAmount && netAmount > 0) {
        paymentStatus = FeePaymentStatus.PAID;
      } else if (paidAmount > 0) {
        paymentStatus = FeePaymentStatus.PARTIAL;
      } else {
        paymentStatus = FeePaymentStatus.PENDING;
      }
    }

    return await db.$transaction(async (tx) => {
      const updatedSale = await tx.franchiseSale.update({
        where: { id: input.saleId },
        data: {
          packageName: input.packageName ?? sale.packageName,
          totalAmount,
          discountAmount,
          netAmount,
          paidAmount,
          pendingAmount,
          paymentStatus,
          paymentMethod: input.paymentMethod ?? sale.paymentMethod,
          referenceNumber: input.referenceNumber !== undefined ? input.referenceNumber : sale.referenceNumber,
          notes: input.notes !== undefined ? input.notes : sale.notes,
        },
        include: {
          franchise: { select: { id: true, code: true, centerName: true } },
        },
      });

      // Recalculate franchise total revenue
      const totalRev = await tx.franchiseSale.aggregate({
        where: { franchiseId: sale.franchiseId },
        _sum: { paidAmount: true },
      });
      await tx.franchise.update({
        where: { id: sale.franchiseId },
        data: { totalRevenue: totalRev._sum.paidAmount || 0 },
      });

      await AuditService.log({
        actorId: user.id,
        action: "FRANCHISE_SALE_UPDATED",
        resourceType: "FranchiseSale",
        resourceId: sale.id,
        newData: {
          totalAmount,
          paidAmount,
          pendingAmount,
          paymentStatus,
        },
      });

      return updatedSale;
    }, { maxWait: 15000, timeout: 30000 });
  }
}

