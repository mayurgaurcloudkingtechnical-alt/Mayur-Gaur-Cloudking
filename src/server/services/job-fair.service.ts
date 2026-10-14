import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import { Prisma } from "@prisma/client";
import { InstitutionPartnershipService } from "./institution-partnership.service";

export interface CreateJobFairInput {
  title: string;
  theme?: string;
  description?: string;
  fairType?: "ONLINE" | "OFFLINE" | "HYBRID";
  venue?: string;
  city?: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  maxCapacity?: number;
  bannerUrl?: string;
}

export class JobFairService {
  /**
   * Central Placement Admin creates a new Job Fair.
   */
  public static async createJobFair(user: AuthenticatedUser, input: CreateJobFairInput) {
    InstitutionPartnershipService.checkGlobalAdmin(user);

    if (!input.title.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Job Fair title is required." });
    }

    const count = await db.jobFair.count();
    const fairCode = `FAIR-2026-${String(count + 1).padStart(3, "0")}`;
    const slug = `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${fairCode.toLowerCase()}`;

    const fair = await db.jobFair.create({
      data: {
        fairCode,
        title: input.title.trim(),
        slug,
        theme: input.theme?.trim() || null,
        description: input.description?.trim() || null,
        fairType: input.fairType || "HYBRID",
        venue: input.venue?.trim() || "SoftLab Global Mega Campus, Prayagraj",
        city: input.city?.trim() || "Prayagraj",
        startDate: input.startDate,
        endDate: input.endDate,
        registrationDeadline: input.registrationDeadline || null,
        maxCapacity: input.maxCapacity || null,
        bannerUrl: input.bannerUrl || null,
        status: "PUBLISHED",
        createdById: user.id,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "JOB_FAIR_CREATED",
      resourceType: "JobFair",
      resourceId: fair.id,
      newData: { title: fair.title, fairCode: fair.fairCode },
    });

    return fair;
  }

  /**
   * List Job Fairs with filters and counts.
   */
  public static async listJobFairs(
    user: AuthenticatedUser,
    params?: {
      search?: string;
      status?: string;
      fairType?: string;
      page?: number;
      pageSize?: number;
    }
  ) {
    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.min(50, Math.max(1, params?.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.JobFairWhereInput = {};

    if (params?.status && params.status !== "ALL") {
      where.status = params.status;
    }

    if (params?.fairType && params.fairType !== "ALL") {
      where.fairType = params.fairType;
    }

    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { fairCode: { contains: q, mode: "insensitive" } },
        { venue: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      db.jobFair.count({ where }),
      db.jobFair.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { startDate: "asc" },
        include: {
          _count: {
            select: {
              institutions: true,
              recruiters: true,
              registrations: true,
              drives: true,
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
   * Full details of a Job Fair.
   */
  public static async getJobFairById(user: AuthenticatedUser, jobFairId: string) {
    const fair = await db.jobFair.findUnique({
      where: { id: jobFairId },
      include: {
        institutions: {
          include: {
            institution: { select: { id: true, name: true, code: true, city: true, officialEmail: true } },
          },
        },
        recruiters: {
          include: {
            partner: { select: { id: true, name: true, industry: true, location: true } },
          },
        },
        drives: {
          include: {
            company: { select: { name: true } },
            _count: { select: { applications: true, nominations: true } },
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!fair) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Job Fair not found." });
    }

    return fair;
  }

  /**
   * Invite colleges to a Job Fair.
   */
  public static async inviteInstitutions(
    user: AuthenticatedUser,
    input: { jobFairId: string; institutionIds: string[] }
  ) {
    InstitutionPartnershipService.checkGlobalAdmin(user);

    for (const instId of input.institutionIds) {
      await db.jobFairInstitution.upsert({
        where: {
          jobFairId_institutionId: {
            jobFairId: input.jobFairId,
            institutionId: instId,
          },
        },
        update: { status: "CONFIRMED" },
        create: {
          jobFairId: input.jobFairId,
          institutionId: instId,
          status: "CONFIRMED",
        },
      });
    }

    return { success: true, count: input.institutionIds.length };
  }

  /**
   * Assign Recruiter / Corporate Partner stall in a Job Fair.
   */
  public static async assignRecruiterStall(
    user: AuthenticatedUser,
    input: {
      jobFairId: string;
      partnerId: string;
      stallNumber?: string;
      vacanciesCount?: number;
      notes?: string;
    }
  ) {
    InstitutionPartnershipService.checkGlobalAdmin(user);

    const stall = await db.jobFairRecruiter.upsert({
      where: {
        jobFairId_partnerId: {
          jobFairId: input.jobFairId,
          partnerId: input.partnerId,
        },
      },
      update: {
        stallNumber: input.stallNumber || undefined,
        vacanciesCount: input.vacanciesCount || 1,
        notes: input.notes || undefined,
      },
      create: {
        jobFairId: input.jobFairId,
        partnerId: input.partnerId,
        stallNumber: input.stallNumber || null,
        vacanciesCount: input.vacanciesCount || 1,
        notes: input.notes || null,
      },
    });

    return stall;
  }

  /**
   * Nominate student for a Campus Drive with automatic Eligibility Engine.
   */
  public static async nominateStudentForDrive(
    user: AuthenticatedUser,
    input: {
      jobDriveId: string;
      institutionEnrollmentId: string;
    }
  ) {
    const tenant = await InstitutionPartnershipService.getTenantInstitutionForUser(user);

    const [drive, enrollment] = await Promise.all([
      db.jobDrive.findUnique({
        where: { id: input.jobDriveId },
      }),
      db.studentInstitutionEnrollment.findUnique({
        where: { id: input.institutionEnrollmentId },
        include: {
          student: true,
          institution: true,
        },
      }),
    ]);

    if (!drive) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Job Drive not found." });
    }

    if (!enrollment) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student enrollment record not found." });
    }

    // Tenant Check: An institution can only nominate its own students!
    if (tenant && enrollment.institutionId !== tenant.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access Denied: You cannot nominate students from another institution.",
      });
    }

    // AUTOMATED ELIGIBILITY ENGINE:
    const reasons: string[] = [];
    let isEligible = true;

    // 1. Passing year restriction
    if (drive.eligiblePassingYears && drive.eligiblePassingYears.length > 0) {
      if (!drive.eligiblePassingYears.includes(enrollment.passingYear)) {
        isEligible = false;
        reasons.push(`Passing year ${enrollment.passingYear} is not eligible (Allowed: ${drive.eligiblePassingYears.join(", ")})`);
      }
    }

    // 2. Minimum CGPA or Percentage restriction
    if (drive.minCgpa !== null && drive.minCgpa !== undefined && drive.minCgpa > 0) {
      const studentCgpa = enrollment.cgpa || (enrollment.academicPercentage ? enrollment.academicPercentage / 10 : 0);
      if (studentCgpa < drive.minCgpa) {
        isEligible = false;
        reasons.push(`Minimum CGPA required is ${drive.minCgpa} (Candidate: ${studentCgpa.toFixed(1)})`);
      }
    }

    // 3. Backlog restriction
    if (drive.maxActiveBacklogs !== null && drive.maxActiveBacklogs !== undefined) {
      if (enrollment.activeBacklogs > drive.maxActiveBacklogs) {
        isEligible = false;
        reasons.push(`Maximum active backlogs allowed is ${drive.maxActiveBacklogs} (Candidate has ${enrollment.activeBacklogs})`);
      }
    }

    // 4. Degree type restriction
    if (drive.eligibleDegreeTypes && drive.eligibleDegreeTypes.length > 0 && enrollment.degreeType) {
      if (!drive.eligibleDegreeTypes.includes(enrollment.degreeType)) {
        isEligible = false;
        reasons.push(`Degree type ${enrollment.degreeType} not accepted`);
      }
    }

    // 5. Consent requirement
    if (!enrollment.consentForRecruiters) {
      isEligible = false;
      reasons.push("Candidate has not provided consent for recruiter profile sharing");
    }

    const ineligibilityReason = reasons.length > 0 ? reasons.join("; ") : null;

    const nomination = await db.driveNomination.upsert({
      where: {
        jobDriveId_studentProfileId: {
          jobDriveId: input.jobDriveId,
          studentProfileId: enrollment.studentProfileId,
        },
      },
      update: {
        isEligible,
        ineligibilityReason,
      },
      create: {
        jobDriveId: input.jobDriveId,
        institutionEnrollmentId: enrollment.id,
        studentProfileId: enrollment.studentProfileId,
        isEligible,
        ineligibilityReason,
      },
    });

    // Also auto-create PlacementApplication if eligible
    if (isEligible) {
      await db.placementApplication.upsert({
        where: {
          jobDriveId_studentId: {
            jobDriveId: input.jobDriveId,
            studentId: enrollment.studentProfileId,
          },
        },
        update: {
          status: "APPLIED",
        },
        create: {
          jobDriveId: input.jobDriveId,
          studentId: enrollment.studentProfileId,
          status: "APPLIED",
        },
      });
    }

    return {
      success: true,
      nominationId: nomination.id,
      isEligible,
      ineligibilityReason,
    };
  }

  /**
   * Placement Manager overrides eligibility with explicit reason and audit log.
   */
  public static async overrideEligibility(
    user: AuthenticatedUser,
    input: { nominationId: string; reason: string }
  ) {
    InstitutionPartnershipService.checkGlobalAdmin(user);

    if (!input.reason.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Override reason is mandatory." });
    }

    const nomination = await db.driveNomination.findUnique({
      where: { id: input.nominationId },
    });

    if (!nomination) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Nomination record not found." });
    }

    const updated = await db.driveNomination.update({
      where: { id: input.nominationId },
      data: {
        isEligible: true,
        isOverridden: true,
        overrideReason: input.reason.trim(),
        overriddenById: user.id,
      },
    });

    // Create placement application upon override
    await db.placementApplication.upsert({
      where: {
        jobDriveId_studentId: {
          jobDriveId: nomination.jobDriveId,
          studentId: nomination.studentProfileId,
        },
      },
      update: { status: "APPLIED" },
      create: {
        jobDriveId: nomination.jobDriveId,
        studentId: nomination.studentProfileId,
        status: "APPLIED",
        coverNote: `Eligibility overridden by admin: ${input.reason}`,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "DRIVE_ELIGIBILITY_OVERRIDDEN",
      resourceType: "DriveNomination",
      resourceId: nomination.id,
      newData: { reason: input.reason, originalReason: nomination.ineligibilityReason },
    });

    return updated;
  }
}
