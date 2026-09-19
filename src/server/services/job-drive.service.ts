import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import { JobDriveStatus, JobType, UserRoleCode } from "@prisma/client";

export interface CreateJobDriveInput {
  companyId: string;
  recruiterId?: string;
  title: string;
  slug?: string;
  department?: string;
  jobType?: JobType;
  workMode?: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  eligibleBatchId?: string;
  eligibilityCriteria?: string;
  minPassingPercentage?: number;
  minAttendancePercentage?: number;
  requireCertification?: boolean;
  targetCourseId?: string;
  salaryPackage?: string;
  minSalary?: number;
  maxSalary?: number;
  salaryType?: string;
  location?: string;
  experience?: string;
  qualification?: string;
  skills?: string[];
  openingsCount?: number;
  deadline?: Date;
  driveDate?: Date;
  interviewDate?: Date;
  joiningDate?: Date;
  venue?: string;
  meetingLink?: string;
  driveType?: string;
  status?: JobDriveStatus;
}

export interface UpdateJobDriveInput extends Partial<CreateJobDriveInput> {
  id: string;
}

export interface StudentEligibilityResult {
  isEligible: boolean;
  reasons: string[];
  courseEnrolled: boolean;
  assessmentPassed: boolean;
  attendanceQualified: boolean;
  bestScorePercentage: number | null;
  attendancePercentage: number | null;
  certificateVerified: boolean;
}

export class JobDriveService {
  private static checkCanManage(user: AuthenticatedUser) {
    const isAuthorized =
      user.roleCode === UserRoleCode.SUPER_ADMIN ||
      user.roleCode === UserRoleCode.ADMIN ||
      user.roleCode === UserRoleCode.DIRECTOR ||
      user.roleCode === UserRoleCode.PLACEMENT_OFFICER;

    if (!isAuthorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permissions to manage job drives.",
      });
    }
  }

  private static generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    return `${base}-${Date.now().toString().slice(-6)}`;
  }

  static async createJobDrive(user: AuthenticatedUser, input: CreateJobDriveInput) {
    this.checkCanManage(user);

    if (!input.title.trim() || !input.companyId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Title and Company ID are required." });
    }

    const company = await db.corporatePartner.findUnique({ where: { id: input.companyId } });
    if (!company) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Corporate partner not found." });
    }

    if (input.targetCourseId) {
      const course = await db.course.findUnique({ where: { id: input.targetCourseId } });
      if (!course) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Target course not found." });
      }
    }

    const slug = input.slug?.trim() || this.generateSlug(input.title);

    const drive = await db.jobDrive.create({
      data: {
        companyId: input.companyId,
        recruiterId: input.recruiterId,
        title: input.title.trim(),
        slug,
        department: input.department?.trim(),
        jobType: input.jobType || JobType.FULL_TIME,
        workMode: input.workMode?.trim() || "On-site",
        description: input.description,
        responsibilities: input.responsibilities?.trim(),
        requirements: input.requirements?.trim(),
        benefits: input.benefits?.trim(),
        eligibleBatchId: input.eligibleBatchId,
        eligibilityCriteria: input.eligibilityCriteria?.trim(),
        minPassingPercentage: input.minPassingPercentage,
        minAttendancePercentage: input.minAttendancePercentage,
        requireCertification: input.requireCertification ?? false,
        targetCourseId: input.targetCourseId,
        salaryPackage: input.salaryPackage?.trim(),
        minSalary: input.minSalary,
        maxSalary: input.maxSalary,
        salaryType: input.salaryType?.trim() || "LPA",
        location: input.location?.trim(),
        experienceRequired: input.experience?.trim(),
        qualification: input.qualification?.trim(),
        requiredSkills: input.skills ?? [],
        openingsCount: input.openingsCount ?? 1,
        deadline: input.deadline,
        driveDate: input.driveDate,
        interviewDate: input.interviewDate,
        joiningDate: input.joiningDate,
        venue: input.venue?.trim(),
        meetingLink: input.meetingLink?.trim(),
        driveType: input.driveType || "ON_CAMPUS",
        status: input.status || JobDriveStatus.DRAFT,
        createdById: user.id,
      },
      include: {
        company: true,
        recruiter: true,
        targetCourse: true,
        eligibleBatch: true,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "JOB_DRIVE_CREATED",
      resourceType: "JobDrive",
      resourceId: drive.id,
      newData: { title: drive.title, company: company.name },
    });

    return drive;
  }

  static async updateJobDrive(user: AuthenticatedUser, input: UpdateJobDriveInput) {
    this.checkCanManage(user);

    const existing = await db.jobDrive.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Job drive not found." });
    }

    const updated = await db.jobDrive.update({
      where: { id: input.id },
      data: {
        ...(input.companyId !== undefined ? { companyId: input.companyId } : {}),
        ...(input.recruiterId !== undefined ? { recruiterId: input.recruiterId } : {}),
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.department !== undefined ? { department: input.department?.trim() } : {}),
        ...(input.jobType !== undefined ? { jobType: input.jobType } : {}),
        ...(input.workMode !== undefined ? { workMode: input.workMode?.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.responsibilities !== undefined ? { responsibilities: input.responsibilities?.trim() } : {}),
        ...(input.requirements !== undefined ? { requirements: input.requirements?.trim() } : {}),
        ...(input.benefits !== undefined ? { benefits: input.benefits?.trim() } : {}),
        ...(input.eligibleBatchId !== undefined ? { eligibleBatchId: input.eligibleBatchId } : {}),
        ...(input.eligibilityCriteria !== undefined ? { eligibilityCriteria: input.eligibilityCriteria?.trim() } : {}),
        ...(input.minPassingPercentage !== undefined ? { minPassingPercentage: input.minPassingPercentage } : {}),
        ...(input.minAttendancePercentage !== undefined ? { minAttendancePercentage: input.minAttendancePercentage } : {}),
        ...(input.requireCertification !== undefined ? { requireCertification: input.requireCertification } : {}),
        ...(input.targetCourseId !== undefined ? { targetCourseId: input.targetCourseId } : {}),
        ...(input.salaryPackage !== undefined ? { salaryPackage: input.salaryPackage?.trim() } : {}),
        ...(input.minSalary !== undefined ? { minSalary: input.minSalary } : {}),
        ...(input.maxSalary !== undefined ? { maxSalary: input.maxSalary } : {}),
        ...(input.salaryType !== undefined ? { salaryType: input.salaryType?.trim() } : {}),
        ...(input.location !== undefined ? { location: input.location?.trim() } : {}),
        ...(input.experience !== undefined ? { experienceRequired: input.experience?.trim() } : {}),
        ...(input.qualification !== undefined ? { qualification: input.qualification?.trim() } : {}),
        ...(input.skills !== undefined ? { requiredSkills: input.skills } : {}),
        ...(input.openingsCount !== undefined ? { openingsCount: input.openingsCount } : {}),
        ...(input.deadline !== undefined ? { deadline: input.deadline } : {}),
        ...(input.driveDate !== undefined ? { driveDate: input.driveDate } : {}),
        ...(input.interviewDate !== undefined ? { interviewDate: input.interviewDate } : {}),
        ...(input.joiningDate !== undefined ? { joiningDate: input.joiningDate } : {}),
        ...(input.venue !== undefined ? { venue: input.venue?.trim() } : {}),
        ...(input.meetingLink !== undefined ? { meetingLink: input.meetingLink?.trim() } : {}),
        ...(input.driveType !== undefined ? { driveType: input.driveType } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: {
        company: true,
        recruiter: true,
        targetCourse: true,
        eligibleBatch: true,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "JOB_DRIVE_UPDATED",
      resourceType: "JobDrive",
      resourceId: input.id,
      newData: { title: updated.title, status: updated.status },
    });

    return updated;
  }

  static async listAdminDrives(status?: JobDriveStatus) {
    return db.jobDrive.findMany({
      where: status ? { status } : undefined,
      include: {
        company: true,
        targetCourse: { select: { id: true, title: true, slug: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }


  static async getDriveById(id: string) {
    const drive = await db.jobDrive.findUnique({
      where: { id },
      include: {
        company: true,
        targetCourse: true,
        _count: { select: { applications: true } },
      },
    });

    if (!drive) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Job drive not found." });
    }

    return drive;
  }

  static async evaluateStudentEligibility(
    studentProfileId: string,
    jobDriveId: string
  ): Promise<StudentEligibilityResult> {
    const drive = await db.jobDrive.findUnique({
      where: { id: jobDriveId },
      include: { targetCourse: true },
    });

    if (!drive) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Job drive not found." });
    }

    const reasons: string[] = [];
    let courseEnrolled = true;
    let assessmentPassed = true;
    let certificateVerified = true;
    let bestScorePercentage: number | null = null;

    if (drive.targetCourseId) {
      const activeEnrollment = await db.enrollment.findFirst({
        where: {
          studentId: studentProfileId,
          courseId: drive.targetCourseId,
          status: { in: ["ACTIVE", "COMPLETED"] },
        },
      });

      if (!activeEnrollment) {
        courseEnrolled = false;
        reasons.push(`Must be enrolled in target course: ${drive.targetCourse?.title || "Required Course"}`);
      }
    }

    if (drive.minPassingPercentage && drive.minPassingPercentage > 0) {
      const bestAttempt = await db.examAttempt.findFirst({
        where: {
          studentId: studentProfileId,
          ...(drive.targetCourseId ? { exam: { courseId: drive.targetCourseId } } : {}),
          status: "SUBMITTED",
        },
        orderBy: { percentage: "desc" },
      });

      bestScorePercentage = bestAttempt?.percentage ?? null;

      if (!bestAttempt || bestAttempt.percentage < drive.minPassingPercentage) {
        assessmentPassed = false;
        reasons.push(
          `Minimum score of ${drive.minPassingPercentage}% required. Your highest score: ${
            bestScorePercentage !== null ? `${bestScorePercentage}%` : "No attempts"
          }`
        );
      }
    }

    if (drive.requireCertification) {
      const validCert = await db.certificate.findFirst({
        where: {
          studentId: studentProfileId,
          ...(drive.targetCourseId ? { courseId: drive.targetCourseId } : {}),
          status: "VALID",
        },
      });

      if (!validCert) {
        certificateVerified = false;
        reasons.push("A valid course completion certificate is required.");
      }
    }

    if (drive.eligibleBatchId) {
      const enrolledInBatch = await db.enrollment.findFirst({
        where: {
          studentId: studentProfileId,
          batchId: drive.eligibleBatchId,
        },
      });
      if (!enrolledInBatch) {
        reasons.push("This opening is restricted to a specific batch.");
      }
    }

    let attendanceQualified = true;
    let attendancePercentage: number | null = null;

    if (drive.minAttendancePercentage && drive.minAttendancePercentage > 0) {
      const attendanceEntries = await db.attendanceEntry.findMany({
        where: { studentId: studentProfileId },
        select: { status: true },
      });

      if (attendanceEntries.length > 0) {
        const presentCount = attendanceEntries.filter((a) => a.status === "PRESENT").length;
        attendancePercentage = Number(((presentCount / attendanceEntries.length) * 100).toFixed(1));

        if (attendancePercentage < drive.minAttendancePercentage) {
          attendanceQualified = false;
          reasons.push(
            `Minimum attendance of ${drive.minAttendancePercentage}% required. Your current attendance is ${attendancePercentage}%.`
          );
        }
      }
    }

    const isEligible =
      courseEnrolled && assessmentPassed && certificateVerified && attendanceQualified && reasons.length === 0;

    return {
      isEligible,
      reasons,
      courseEnrolled,
      assessmentPassed,
      attendanceQualified,
      bestScorePercentage,
      attendancePercentage,
      certificateVerified,
    };
  }

  static async listEligibleDrivesForStudent(studentProfileId: string) {
    const activeDrives = await db.jobDrive.findMany({
      where: {
        status: JobDriveStatus.ACTIVE,
        OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
      },
      include: {
        company: true,
        targetCourse: { select: { id: true, title: true, slug: true } },
        applications: {
          where: { studentId: studentProfileId },
          select: { id: true, status: true, appliedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const evaluated = await Promise.all(
      activeDrives.map(async (drive) => {
        const eligibility = await this.evaluateStudentEligibility(studentProfileId, drive.id);
        const myApplication = drive.applications?.[0] || null;

        return {
          ...drive,
          eligibility,
          hasApplied: !!myApplication,
          myApplication,
        };
      })
    );

    return evaluated;
  }
}

