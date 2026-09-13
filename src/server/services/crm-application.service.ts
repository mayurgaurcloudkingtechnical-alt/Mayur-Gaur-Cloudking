import { db } from "@/server/db/client";
import { AuthenticatedUser, hasPermission } from "@/server/auth/rbac";
import { AuditService } from "@/server/services/audit.service";
import { TRPCError } from "@trpc/server";
import { ApplicationStage, LeadStatus, LeadSource, Prisma } from "@prisma/client";
import { CrmConversionService } from "./crm-conversion.service";
import { normalizeEmail, normalizePhone } from "./crm-lead.service";

export interface CreateApplicationInput {
  leadId: string;
  courseId: string;
  batchId?: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  highestQualification?: string;
}

export interface CreateDirectAdmissionInput {
  courseId: string;
  batchId?: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  highestQualification?: string;
  leadId?: string;
  source?: LeadSource;
}

export interface UpdateStageInput {
  applicationId: string;
  stage: ApplicationStage;
  decisionReason?: string;
}

export interface ListApplicationsInput {
  stage?: ApplicationStage;
  courseId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class CrmApplicationService {
  /**
   * Generates a unique human-readable application number: APP-YYYY-XXXX.
   */
  private static async generateAppNumber(): Promise<string> {
    const year = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      const code = `APP-${year}-${rand}`;
      const existing = await db.admissionApplication.findUnique({
        where: { applicationNumber: code },
      });
      if (!existing) return code;
    }
    return `APP-${year}-${Date.now().toString().slice(-4)}`;
  }

  /**
   * Creates an admission application for an interested lead.
   * Requires 'admissions:create' permission.
   */
  static async createApplication(user: AuthenticatedUser, input: CreateApplicationInput) {
    const canCreate = hasPermission(user.permissions, "admissions:create");
    if (!canCreate) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to create admission applications.",
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
    const isAssigned =
      lead.assignedToId === user.id ||
      lead.assignedCounselorId === user.id ||
      !lead.assignedToId;

    if (!hasReadAll && !isAssigned) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only create applications for leads assigned to you.",
      });
    }

    if (!lead.assignedToId) {
      await db.lead.update({
        where: { id: lead.id },
        data: { assignedToId: user.id, assignedCounselorId: user.id },
      });
    }

    const course = await db.course.findUnique({
      where: { id: input.courseId },
    });

    if (!course) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Course with ID '${input.courseId}' not found.`,
      });
    }

    const applicationNumber = await this.generateAppNumber();
    const cleanEmail = normalizeEmail(input.applicantEmail);
    const cleanPhone = normalizePhone(input.applicantPhone);

    const application = await db.admissionApplication.create({
      data: {
        applicationNumber,
        leadId: input.leadId,
        courseId: input.courseId,
        batchId: input.batchId || null,
        counselorId: user.id,
        stage: ApplicationStage.SUBMITTED,
        applicantName: input.applicantName.trim(),
        applicantEmail: cleanEmail,
        applicantPhone: cleanPhone,
        dateOfBirth: input.dateOfBirth ?? null,
        gender: input.gender?.trim() || null,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        pincode: input.pincode?.trim() || null,
        highestQualification: input.highestQualification?.trim() || null,
      },
      include: {
        course: { select: { id: true, title: true } },
        batch: { select: { id: true, name: true, code: true } },
      },
    });

    if (lead.status === LeadStatus.NEW || lead.status === LeadStatus.CONTACTED) {
      await db.lead.update({
        where: { id: lead.id },
        data: { status: LeadStatus.INTERESTED },
      });
    }

    await AuditService.log({
      actorId: user.id,
      action: "ADMISSION_APPLICATION_CREATED",
      resourceType: "AdmissionApplication",
      resourceId: application.id,
      newData: {
        applicationNumber: application.applicationNumber,
        leadId: input.leadId,
        courseId: input.courseId,
      },
    });

    return application;
  }

  /**
   * Directly creates an admission application, auto-linking or creating a lead if not provided.
   */
  static async createDirectAdmission(user: AuthenticatedUser, input: CreateDirectAdmissionInput) {
    const canCreate = hasPermission(user.permissions, "admissions:create");
    if (!canCreate) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to create admission applications.",
      });
    }

    let leadId = input.leadId;
    const cleanPhone = normalizePhone(input.applicantPhone);
    const cleanEmail = normalizeEmail(input.applicantEmail);

    if (!leadId) {
      // Find or create lead
      let lead = await db.lead.findFirst({
        where: {
          OR: [{ phone: cleanPhone }, { email: cleanEmail }],
        },
      });

      if (!lead) {
        lead = await db.lead.create({
          data: {
            fullName: input.applicantName.trim(),
            email: cleanEmail,
            phone: cleanPhone,
            city: input.city?.trim() || null,
            qualification: input.highestQualification?.trim() || null,
            source: input.source || LeadSource.WALK_IN,
            status: LeadStatus.INTERESTED,
            qualityScore: "HOT",
            interestedCourseId: input.courseId,
            notes: "Direct admission application initiated from Admissions Desk.",
            assignedToId: user.id,
            assignedCounselorId: user.id,
            createdById: user.id,
          },
        });
      }
      leadId = lead.id;
    }

    return this.createApplication(user, {
      leadId,
      courseId: input.courseId,
      batchId: input.batchId,
      applicantName: input.applicantName,
      applicantEmail: cleanEmail,
      applicantPhone: cleanPhone,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      highestQualification: input.highestQualification,
    });
  }

  /**
   * Lists admission applications with role-based scoping.
   */
  static async listApplications(user: AuthenticatedUser, input: ListApplicationsInput) {
    const hasReadAll = hasPermission(user.permissions, "admissions:read") &&
      hasPermission(user.permissions, "leads:read_all");

    const where: Prisma.AdmissionApplicationWhereInput = {};

    if (!hasReadAll) {
      where.OR = [
        { counselorId: user.id },
        { lead: { assignedToId: user.id } },
      ];
    }

    if (input.stage) {
      where.stage = input.stage;
    }

    if (input.courseId) {
      where.courseId = input.courseId;
    }

    if (input.search && input.search.trim().length > 0) {
      const q = input.search.trim();
      where.AND = [
        {
          OR: [
            { applicationNumber: { contains: q, mode: "insensitive" } },
            { applicantName: { contains: q, mode: "insensitive" } },
            { applicantEmail: { contains: q, mode: "insensitive" } },
            { applicantPhone: { contains: q } },
          ],
        },
      ];
    }

    const page = Math.max(1, input.page || 1);
    const limit = Math.min(50, Math.max(1, input.limit || 20));
    const skip = (page - 1) * limit;

    const [total, applications] = await Promise.all([
      db.admissionApplication.count({ where }),
      db.admissionApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { id: true, title: true } },
          batch: { select: { id: true, name: true, code: true } },
          counselor: { select: { id: true, firstName: true, lastName: true } },
          reviewer: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves full application details by ID.
   */
  static async getApplicationDetails(user: AuthenticatedUser, applicationId: string) {
    const application = await db.admissionApplication.findUnique({
      where: { id: applicationId },
      include: {
        lead: {
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        course: true,
        batch: true,
        counselor: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
        convertedStudentProfile: {
          select: {
            id: true,
            studentId: true,
            userId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!application) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Application with ID '${applicationId}' not found.`,
      });
    }

    const hasReadAll = hasPermission(user.permissions, "leads:read_all");
    if (!hasReadAll && application.counselorId !== user.id && application.lead.assignedToId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to view this application.",
      });
    }

    return application;
  }

  /**
   * Updates application stage (Review, Approve, Reject, Return).
   * Rejection or Return requires an explicit decisionReason.
   */
  static async updateApplicationStage(user: AuthenticatedUser, input: UpdateStageInput) {
    const canManage = hasPermission(user.permissions, "admissions:create") ||
      hasPermission(user.permissions, "admissions:approve_discount");

    if (!canManage) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to update application stages.",
      });
    }

    const app = await db.admissionApplication.findUnique({
      where: { id: input.applicationId },
    });

    if (!app) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Application with ID '${input.applicationId}' not found.`,
      });
    }

    if (
      (input.stage === ApplicationStage.REJECTED || input.stage === ApplicationStage.RETURNED_FOR_INFORMATION) &&
      (!input.decisionReason || input.decisionReason.trim().length < 5)
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A clear decision reason (minimum 5 characters) is required when rejecting or returning an application.",
      });
    }

    const updated = await db.admissionApplication.update({
      where: { id: input.applicationId },
      data: {
        stage: input.stage,
        decisionReason: input.decisionReason?.trim() || app.decisionReason,
        reviewerId: user.id,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "ADMISSION_APPLICATION_STAGE_UPDATED",
      resourceType: "AdmissionApplication",
      resourceId: app.id,
      previousData: { stage: app.stage },
      newData: { stage: input.stage, reason: input.decisionReason },
    });

    return updated;
  }

  /**
   * Explicitly converts an APPROVED application into an active student record.
   * Generates StudentProfile, links enrollment, updates lead status to ADMITTED,
   * and prevents premature student access.
   */
  static async convertApplicationToStudent(user: AuthenticatedUser, applicationId: string) {
    return CrmConversionService.convertApplicationToStudent(user, applicationId);
  }
}
