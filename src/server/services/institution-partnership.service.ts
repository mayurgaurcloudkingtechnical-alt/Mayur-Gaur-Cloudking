import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import {
  UserRoleCode,
  InstitutionType,
  InstitutionStatus,
  InstitutionRole,
  Prisma,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

export interface RegisterInstitutionInput {
  name: string;
  type?: InstitutionType;
  affiliation?: string;
  recognition?: string;
  registrationNumber?: string;
  address?: string;
  district?: string;
  city?: string;
  state?: string;
  pincode?: string;
  website?: string;
  officialEmail: string;
  officialPhone?: string;
  authorizedPersonName: string;
  authorizedPersonDesignation: string;
  authorizedPersonEmail: string;
  authorizedPersonPhone: string;
  placementOfficerName?: string;
  placementOfficerEmail?: string;
  placementOfficerPhone?: string;
  departmentsOffered?: string[];
  estimatedStudentCount?: number;
  agreementDocumentUrl?: string;
}

export interface ReviewApprovalInput {
  institutionId: string;
  decision: "APPROVED" | "REJECTED" | "CORRECTION_REQUESTED";
  remarks?: string;
  provisionalAdminPassword?: string;
}

export class InstitutionPartnershipService {
  /**
   * Helper to verify if user has global administrative placement permissions.
   */
  public static checkGlobalAdmin(user: AuthenticatedUser) {
    const isAuthorized =
      user.roleCode === UserRoleCode.SUPER_ADMIN ||
      user.roleCode === UserRoleCode.ADMIN ||
      user.roleCode === UserRoleCode.DIRECTOR ||
      user.roleCode === UserRoleCode.PLACEMENT_OFFICER;

    if (!isAuthorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permissions to manage institutional partnerships.",
      });
    }
  }

  /**
   * Helper to retrieve and verify tenant institution context for an institutional user.
   */
  public static async getTenantInstitutionForUser(user: AuthenticatedUser) {
    if (
      user.roleCode === UserRoleCode.SUPER_ADMIN ||
      user.roleCode === UserRoleCode.ADMIN ||
      user.roleCode === UserRoleCode.DIRECTOR ||
      user.roleCode === UserRoleCode.PLACEMENT_OFFICER
    ) {
      return null; // Global admins have unrestricted cross-tenant oversight
    }

    const membership = await db.institutionUserMembership.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      include: {
        institution: true,
      },
    });

    if (!membership || !membership.institution) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have active institutional access.",
      });
    }

    return membership.institution;
  }

  /**
   * Public onboarding registration workflow.
   */
  public static async registerPublicInstitution(input: RegisterInstitutionInput) {
    const email = input.officialEmail.trim().toLowerCase();
    if (!email || !input.name.trim()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Institution legal name and official email address are required.",
      });
    }

    // Check duplicate email
    const existing = await db.institution.findUnique({
      where: { officialEmail: email },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "An institutional application with this official email address already exists.",
      });
    }

    // Generate unique sequential code e.g. "INST-2026-0042"
    const count = await db.institution.count();
    const code = `INST-2026-${String(count + 1).padStart(4, "0")}`;

    const institution = await db.institution.create({
      data: {
        code,
        name: input.name.trim(),
        type: input.type || InstitutionType.COLLEGE,
        affiliation: input.affiliation?.trim() || null,
        recognition: input.recognition?.trim() || null,
        registrationNumber: input.registrationNumber?.trim() || null,
        address: input.address?.trim() || null,
        district: input.district?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        pincode: input.pincode?.trim() || null,
        website: input.website?.trim() || null,
        officialEmail: email,
        officialPhone: input.officialPhone?.trim() || null,
        authorizedPersonName: input.authorizedPersonName.trim(),
        authorizedPersonDesignation: input.authorizedPersonDesignation.trim(),
        authorizedPersonEmail: input.authorizedPersonEmail.trim().toLowerCase(),
        authorizedPersonPhone: input.authorizedPersonPhone.trim(),
        placementOfficerName: input.placementOfficerName?.trim() || null,
        placementOfficerEmail: input.placementOfficerEmail?.trim().toLowerCase() || null,
        placementOfficerPhone: input.placementOfficerPhone?.trim() || null,
        departmentsOffered: input.departmentsOffered || [],
        estimatedStudentCount: input.estimatedStudentCount || null,
        agreementDocumentUrl: input.agreementDocumentUrl?.trim() || null,
        status: InstitutionStatus.PENDING_APPROVAL,
      },
    });

    await AuditService.log({
      action: "INSTITUTION_REGISTERED",
      resourceType: "Institution",
      resourceId: institution.id,
      newData: {
        code: institution.code,
        name: institution.name,
        officialEmail: institution.officialEmail,
      },
    });

    return {
      success: true,
      code: institution.code,
      message: "Application submitted successfully. SoftLab Global placement cell will review your details.",
    };
  }

  /**
   * Admin lists all onboarded institutions with KPI statistics.
   */
  public static async listInstitutions(
    user: AuthenticatedUser,
    params?: {
      search?: string;
      status?: InstitutionStatus | "ALL";
      city?: string;
      page?: number;
      pageSize?: number;
    }
  ) {
    this.checkGlobalAdmin(user);

    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.min(100, Math.max(1, params?.pageSize || 25));
    const skip = (page - 1) * pageSize;

    const where: Prisma.InstitutionWhereInput = {};

    if (params?.status && params.status !== "ALL") {
      where.status = params.status;
    }

    if (params?.city) {
      where.city = { equals: params.city, mode: "insensitive" };
    }

    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { officialEmail: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { authorizedPersonName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      db.institution.count({ where }),
      db.institution.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              students: true,
              driveParticipations: true,
              jobFairParticipations: true,
              members: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Fetch full details of an institution.
   */
  public static async getInstitutionById(user: AuthenticatedUser, institutionId: string) {
    const tenant = await this.getTenantInstitutionForUser(user);
    if (tenant && tenant.id !== institutionId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access Denied: You cannot inspect another institution's profile.",
      });
    }

    const institution = await db.institution.findUnique({
      where: { id: institutionId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                roleCode: true,
                phone: true,
              },
            },
          },
        },
        courseMappings: true,
        approvals: {
          orderBy: { createdAt: "desc" },
          include: {
            actionBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            driveParticipations: true,
            jobFairParticipations: true,
            importJobs: true,
            payments: true,
          },
        },
      },
    });

    if (!institution) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found." });
    }

    return institution;
  }

  /**
   * SoftLab Placement Manager / Super Admin Review Workflow.
   * Approves, requests corrections, or rejects an application.
   * If approved, provisions an institutional administrator account.
   */
  public static async reviewApproval(user: AuthenticatedUser, input: ReviewApprovalInput) {
    this.checkGlobalAdmin(user);

    const institution = await db.institution.findUnique({
      where: { id: input.institutionId },
    });

    if (!institution) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found." });
    }

    let newStatus: InstitutionStatus = InstitutionStatus.PENDING_APPROVAL;
    if (input.decision === "APPROVED") {
      newStatus = InstitutionStatus.APPROVED;
    } else if (input.decision === "REJECTED") {
      newStatus = InstitutionStatus.REJECTED;
    } else if (input.decision === "CORRECTION_REQUESTED") {
      newStatus = InstitutionStatus.CORRECTION_REQUESTED;
    }

    const rawPassword = input.provisionalAdminPassword || "CampusPartner@2026";
    const passwordHash = await bcrypt.hash(rawPassword, 8);

    await db.$transaction(
      async (tx) => {
        // 1. Update institution record
        await tx.institution.update({
          where: { id: input.institutionId },
          data: {
            status: newStatus,
            rejectionReason: input.decision === "REJECTED" ? input.remarks : null,
            correctionNotes: input.decision === "CORRECTION_REQUESTED" ? input.remarks : null,
            approvedAt: input.decision === "APPROVED" ? new Date() : null,
            approvedById: input.decision === "APPROVED" ? user.id : null,
          },
        });

        // 2. Insert approval audit record
        await tx.institutionApproval.create({
          data: {
            institutionId: input.institutionId,
            decision: input.decision,
            remarks: input.remarks || null,
            actionById: user.id,
          },
        });

        // 3. If APPROVED, provision administrator account if not already created
        if (input.decision === "APPROVED") {
          const adminEmail = (institution.authorizedPersonEmail || institution.officialEmail).toLowerCase();
          let existingUser = await tx.user.findUnique({
            where: { email: adminEmail },
          });

          if (!existingUser) {
            const nameParts = institution.authorizedPersonName.split(" ");
            const firstName = nameParts[0] || "Campus";
            const lastName = nameParts.slice(1).join(" ") || "Admin";

            const candidatePhone = institution.authorizedPersonPhone || institution.officialPhone;
            let phoneToUse: string | null = null;
            if (candidatePhone) {
              const existingWithPhone = await tx.user.findFirst({ where: { phone: candidatePhone } });
              if (!existingWithPhone) {
                phoneToUse = candidatePhone;
              }
            }

            existingUser = await tx.user.create({
              data: {
                email: adminEmail,
                passwordHash,
                firstName,
                lastName,
                roleCode: UserRoleCode.INSTITUTION_ADMIN,
                phone: phoneToUse,
              },
            });
          }

        // Link user to institution
        await tx.institutionUserMembership.upsert({
          where: {
            institutionId_userId: {
              institutionId: input.institutionId,
              userId: existingUser.id,
            },
          },
          update: {
            role: InstitutionRole.INSTITUTION_ADMIN,
            isPrimary: true,
            status: "ACTIVE",
          },
          create: {
            institutionId: input.institutionId,
            userId: existingUser.id,
            role: InstitutionRole.INSTITUTION_ADMIN,
            isPrimary: true,
            status: "ACTIVE",
          },
        });
      }
    },
    { timeout: 30000, maxWait: 15000 }
  );

    await AuditService.log({
      actorId: user.id,
      action: `INSTITUTION_${input.decision}`,
      resourceType: "Institution",
      resourceId: input.institutionId,
      newData: {
        decision: input.decision,
        remarks: input.remarks,
      },
    });

    return {
      success: true,
      status: newStatus,
      message: `Institution successfully marked as ${newStatus}.`,
    };
  }

  /**
   * Institution Administrator Dashboard View (Tenant Scoped).
   */
  public static async getInstitutionDashboard(user: AuthenticatedUser) {
    const institution = await this.getTenantInstitutionForUser(user);
    if (!institution) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No institution context found for this account.",
      });
    }

    const [
      totalStudents,
      eligibleStudents,
      incompleteProfiles,
      studentsPlaced,
      upcomingDrives,
      upcomingJobFairs,
      courseDistribution,
      recentNominations,
    ] = await Promise.all([
      db.studentInstitutionEnrollment.count({
        where: { institutionId: institution.id },
      }),
      db.studentInstitutionEnrollment.count({
        where: { institutionId: institution.id, placementEligibility: true },
      }),
      db.studentInstitutionEnrollment.count({
        where: { institutionId: institution.id, isProfileComplete: false },
      }),
      db.studentInstitutionEnrollment.count({
        where: {
          institutionId: institution.id,
          student: { placementProfile: { isPlaced: true } },
        },
      }),
      db.jobDrive.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { participatingColleges: { some: { institutionId: institution.id } } },
            { participatingColleges: { none: {} } }, // Open to all college partners
          ],
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          company: { select: { name: true, location: true } },
        },
      }),
      db.jobFair.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { institutions: { some: { institutionId: institution.id } } },
            { institutions: { none: {} } },
          ],
        },
        take: 3,
        orderBy: { startDate: "asc" },
      }),
      db.studentInstitutionEnrollment.groupBy({
        by: ["courseName"],
        where: { institutionId: institution.id },
        _count: { id: true },
      }),
      db.driveNomination.findMany({
        where: { institutionEnrollment: { institutionId: institution.id } },
        take: 8,
        orderBy: { nominatedAt: "desc" },
        include: {
          jobDrive: { select: { title: true, company: { select: { name: true } } } },
          student: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
    ]);

    return {
      institution,
      metrics: {
        totalStudents,
        eligibleStudents,
        incompleteProfiles,
        studentsPlaced,
        placementRate: totalStudents > 0 ? Math.round((studentsPlaced / totalStudents) * 100) : 0,
      },
      upcomingDrives,
      upcomingJobFairs,
      courseDistribution: courseDistribution.map((c) => ({
        courseName: c.courseName,
        count: c._count.id,
      })),
      recentNominations,
    };
  }
}
