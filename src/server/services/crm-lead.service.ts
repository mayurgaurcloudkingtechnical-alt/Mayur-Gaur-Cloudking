import { db } from "@/server/db/client";
import { AuthenticatedUser, hasPermission } from "@/server/auth/rbac";
import { RateLimiter } from "@/server/lib/rate-limiter";
import { AuditService } from "@/server/services/audit.service";
import { TRPCError } from "@trpc/server";
import { LeadSource, LeadStatus, FollowUpType, Prisma } from "@prisma/client";

export interface PublicEnquiryInput {
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  interestedCourseId?: string;
  notes?: string;
  honeypot?: string;
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
    const rateCheck = RateLimiter.check(rateKey, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many enquiry attempts. Please wait 15 minutes before submitting again.",
      });
    }

    const cleanPhone = normalizePhone(input.phone);
    const cleanEmail = normalizeEmail(input.email);

    const lead = await db.lead.create({
      data: {
        fullName: input.fullName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        city: input.city?.trim() || null,
        source: LeadSource.WEBSITE,
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
        source: LeadSource.WEBSITE,
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
    const hasReadAll = hasPermission(user.permissions, "leads:read_all");
    const hasReadOwn = hasPermission(user.permissions, "leads:read_own");

    if (!hasReadAll && !hasReadOwn) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to view leads.",
      });
    }

    const where: Prisma.LeadWhereInput = {};

    if (!hasReadAll) {
      where.assignedToId = user.id;
    } else if (input.assignedToId) {
      where.assignedToId = input.assignedToId;
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
    const hasReadAll = hasPermission(user.permissions, "leads:read_all");
    const hasReadOwn = hasPermission(user.permissions, "leads:read_own");

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

    if (!hasReadAll && lead.assignedToId !== user.id) {
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

    const hasReadAll = hasPermission(user.permissions, "leads:read_all");
    if (!hasReadAll && lead.assignedToId !== user.id) {
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
}
