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
  decisionReason?: string;
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
  discountType?: "PERCENTAGE" | "FIXED";
  discountValue?: number;
  discountAmount?: number;
  finalFee?: number;
  paidAmount?: number;
  remarks?: string;
}

export interface UpdateApplicationInput {
  applicationId: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  courseId?: string;
  batchId?: string | null;
  counselorId?: string | null;
  stage?: ApplicationStage;
  city?: string;
  state?: string;
  pincode?: string;
  highestQualification?: string;
  address?: string;
  decisionReason?: string;
  discountType?: "PERCENTAGE" | "FIXED";
  discountValue?: number;
  discountAmount?: number;
  finalFee?: number;
  paidAmount?: number;
  remarks?: string;
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
        decisionReason: input.decisionReason?.trim() || null,
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

    let decisionReason: string | undefined = undefined;
    if (input.discountAmount || input.discountType || input.remarks || input.finalFee) {
      decisionReason = JSON.stringify({
        discountType: input.discountType || "FIXED",
        discountValue: input.discountValue || 0,
        discountAmount: input.discountAmount || 0,
        finalFee: input.finalFee,
        paidAmount: input.paidAmount || 0,
        remarks: input.remarks || "",
      });
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
      decisionReason,
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

  /**
   * Updates application details including applicant contact, target course, cohort, and discount terms.
   */
  static async updateApplication(user: AuthenticatedUser, input: UpdateApplicationInput) {
    const canManage =
      hasPermission(user.permissions, "admissions:create") ||
      hasPermission(user.permissions, "admissions:approve_discount") ||
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "DIRECTOR" ||
      user.roleCode === "ADMIN";

    if (!canManage) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack authority to edit admission applications.",
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

    let decisionReason = input.decisionReason;
    if (input.discountAmount !== undefined || input.discountType !== undefined || input.remarks !== undefined || input.finalFee !== undefined) {
      let existingMetadata: any = {};
      if (app.decisionReason) {
        try {
          existingMetadata = JSON.parse(app.decisionReason);
        } catch (e) {
          existingMetadata = { notes: app.decisionReason };
        }
      }
      decisionReason = JSON.stringify({
        ...existingMetadata,
        ...(input.discountType ? { discountType: input.discountType } : {}),
        ...(input.discountValue !== undefined ? { discountValue: input.discountValue } : {}),
        ...(input.discountAmount !== undefined ? { discountAmount: input.discountAmount } : {}),
        ...(input.finalFee !== undefined ? { finalFee: input.finalFee } : {}),
        ...(input.paidAmount !== undefined ? { paidAmount: input.paidAmount } : {}),
        ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      });
    }

    const updated = await db.admissionApplication.update({
      where: { id: input.applicationId },
      data: {
        ...(input.applicantName ? { applicantName: input.applicantName.trim() } : {}),
        ...(input.applicantEmail ? { applicantEmail: normalizeEmail(input.applicantEmail) } : {}),
        ...(input.applicantPhone ? { applicantPhone: normalizePhone(input.applicantPhone) } : {}),
        ...(input.courseId ? { courseId: input.courseId } : {}),
        ...(input.batchId !== undefined ? { batchId: input.batchId } : {}),
        ...(input.counselorId !== undefined ? { counselorId: input.counselorId } : {}),
        ...(input.stage ? { stage: input.stage } : {}),
        ...(input.city !== undefined ? { city: input.city?.trim() || null } : {}),
        ...(input.state !== undefined ? { state: input.state?.trim() || null } : {}),
        ...(input.pincode !== undefined ? { pincode: input.pincode?.trim() || null } : {}),
        ...(input.highestQualification !== undefined ? { highestQualification: input.highestQualification?.trim() || null } : {}),
        ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
        ...(decisionReason !== undefined ? { decisionReason } : {}),
      },
      include: {
        course: { select: { id: true, title: true } },
        batch: { select: { id: true, name: true, code: true } },
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "ADMISSION_APPLICATION_UPDATED",
      resourceType: "AdmissionApplication",
      resourceId: app.id,
      newData: {
        applicantName: updated.applicantName,
        courseId: updated.courseId,
        stage: updated.stage,
      },
    });

    return updated;
  }

  /**
   * Safely archives an admission application without deleting historical CRM links.
   */
  static async archiveApplication(user: AuthenticatedUser, applicationId: string, reason?: string) {
    const canArchive =
      hasPermission(user.permissions, "admissions:create") ||
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "DIRECTOR" ||
      user.roleCode === "ADMIN";

    if (!canArchive) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You lack permission to archive applications." });
    }

    const app = await db.admissionApplication.findUnique({ where: { id: applicationId } });
    if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });

    const updated = await db.admissionApplication.update({
      where: { id: applicationId },
      data: {
        stage: ApplicationStage.REJECTED,
        decisionReason: reason || "Archived by institutional administration.",
        reviewerId: user.id,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "ADMISSION_APPLICATION_ARCHIVED",
      resourceType: "AdmissionApplication",
      resourceId: app.id,
      newData: { stage: ApplicationStage.REJECTED, reason },
    });

    return updated;
  }

  /**
   * Restores an archived admission application back to Under Review.
   */
  static async restoreApplication(user: AuthenticatedUser, applicationId: string) {
    const canRestore =
      hasPermission(user.permissions, "admissions:create") ||
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "DIRECTOR" ||
      user.roleCode === "ADMIN";

    if (!canRestore) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You lack permission to restore applications." });
    }

    const app = await db.admissionApplication.findUnique({ where: { id: applicationId } });
    if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });

    const updated = await db.admissionApplication.update({
      where: { id: applicationId },
      data: {
        stage: ApplicationStage.UNDER_REVIEW,
        decisionReason: "Restored from archive to Under Review.",
        reviewerId: user.id,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "ADMISSION_APPLICATION_RESTORED",
      resourceType: "AdmissionApplication",
      resourceId: app.id,
      newData: { stage: ApplicationStage.UNDER_REVIEW },
    });

    return updated;
  }

  /**
   * Permanently deletes an unconverted, unbilled application with safety checks.
   */
  static async deleteApplication(user: AuthenticatedUser, applicationId: string) {
    const isRootAdmin =
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "DIRECTOR" ||
      user.roleCode === "ADMIN";

    if (!isRootAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can delete applications." });
    }

    const app = await db.admissionApplication.findUnique({
      where: { id: applicationId },
      include: { payments: true },
    });

    if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });

    if (app.convertedStudentProfileId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete an application that has already been converted to an enrolled student. Archive it instead.",
      });
    }

    if (app.payments && app.payments.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete an application with recorded payment transactions. Archive it instead to maintain financial audit trails.",
      });
    }

    await db.admissionApplication.delete({ where: { id: applicationId } });

    await AuditService.log({
      actorId: user.id,
      action: "ADMISSION_APPLICATION_DELETED",
      resourceType: "AdmissionApplication",
      resourceId: app.id,
      previousData: { applicationNumber: app.applicationNumber, applicantName: app.applicantName },
    });

    return { success: true };
  }

  /**
   * Exports admission applications to CSV format.
   */
  static async exportApplications(user: AuthenticatedUser, input?: { stage?: ApplicationStage; courseId?: string }) {
    const canExport =
      hasPermission(user.permissions, "admissions:read") ||
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "DIRECTOR" ||
      user.roleCode === "ADMIN" ||
      user.roleCode === "COUNSELOR";

    if (!canExport) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You lack permission to export admission records." });
    }

    const where: Prisma.AdmissionApplicationWhereInput = {};
    if (input?.stage) where.stage = input.stage;
    if (input?.courseId) where.courseId = input.courseId;

    const items = await db.admissionApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { title: true, baseFee: true } },
        batch: { select: { name: true, code: true } },
        counselor: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const headers = [
      "Application Number",
      "Applicant Name",
      "Applicant Email",
      "Applicant Phone",
      "City",
      "Course",
      "Cohort",
      "Stage",
      "Counselor",
      "Base Fee (INR)",
      "Applied Date",
    ];

    const rows = items.map((app) => [
      app.applicationNumber,
      `"${app.applicantName.replace(/"/g, '""')}"`,
      app.applicantEmail,
      app.applicantPhone,
      app.city || "N/A",
      `"${app.course.title.replace(/"/g, '""')}"`,
      app.batch ? app.batch.code : "Unassigned",
      app.stage,
      app.counselor ? `${app.counselor.firstName} ${app.counselor.lastName}` : "Direct",
      (app.course.baseFee / 100).toString(),
      new Date(app.createdAt).toISOString().split("T")[0],
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return {
      fileName: `SoftLab-Admissions-Export-${new Date().toISOString().split("T")[0]}.csv`,
      csvContent,
      count: items.length,
    };
  }
}
