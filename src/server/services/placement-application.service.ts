import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import { JobDriveService } from "./job-drive.service";
import { PlacementApplicationStatus, InterviewRoundType, UserRoleCode } from "@prisma/client";

export interface UpsertPlacementProfileInput {
  studentProfileId: string;
  headline?: string;
  bio?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
}

export interface ApplyJobDriveInput {
  studentProfileId: string;
  jobDriveId: string;
  coverNote?: string;
}

export interface UpdateApplicationStatusInput {
  applicationId: string;
  status: PlacementApplicationStatus;
  offeredPackage?: string;
  rejectionReason?: string;
}

export interface ScheduleInterviewRoundInput {
  applicationId: string;
  roundNumber: number;
  roundType: InterviewRoundType;
  scheduledAt?: Date;
  meetingLink?: string;
  feedback?: string;
  passed?: boolean;
}

export class PlacementApplicationService {
  private static checkCanManage(user: AuthenticatedUser) {
    const isAuthorized =
      user.roleCode === UserRoleCode.SUPER_ADMIN ||
      user.roleCode === UserRoleCode.ADMIN ||
      user.roleCode === UserRoleCode.DIRECTOR ||
      user.roleCode === UserRoleCode.PLACEMENT_OFFICER;

    if (!isAuthorized) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You lack permissions to manage placement applications." });
    }
  }

  static async getStudentPlacementProfile(studentProfileId: string) {
    let profile = await db.studentPlacementProfile.findUnique({
      where: { studentId: studentProfileId },
      include: { student: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } } },
    });

    if (!profile) {
      profile = await db.studentPlacementProfile.create({
        data: { studentId: studentProfileId, skills: [] },
        include: { student: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } } },
      });
    }

    return profile;
  }



  static async upsertPlacementProfile(
    studentUserId: string,
    input: UpsertPlacementProfileInput
  ) {
    const student = await db.studentProfile.findUnique({
      where: { id: input.studentProfileId },
    });

    if (!student || student.userId !== studentUserId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only edit your own placement profile.",
      });
    }

    const updated = await db.studentPlacementProfile.upsert({
      where: { studentId: input.studentProfileId },
      create: {
        studentId: input.studentProfileId,
        headline: input.headline?.trim(),
        bio: input.bio?.trim(),
        resumeUrl: input.resumeUrl?.trim(),
        portfolioUrl: input.portfolioUrl?.trim(),
        githubUrl: input.githubUrl?.trim(),
        linkedinUrl: input.linkedinUrl?.trim(),
        skills: input.skills ?? [],
      },
      update: {
        ...(input.headline !== undefined && { headline: input.headline.trim() }),
        ...(input.bio !== undefined && { bio: input.bio.trim() }),
        ...(input.resumeUrl !== undefined && { resumeUrl: input.resumeUrl.trim() }),
        ...(input.portfolioUrl !== undefined && { portfolioUrl: input.portfolioUrl.trim() }),
        ...(input.githubUrl !== undefined && { githubUrl: input.githubUrl.trim() }),
        ...(input.linkedinUrl !== undefined && { linkedinUrl: input.linkedinUrl.trim() }),
        ...(input.skills !== undefined && { skills: input.skills }),
      },
    });


    await AuditService.log({
      actorId: studentUserId,
      action: "STUDENT_PLACEMENT_PROFILE_UPDATED",
      resourceType: "StudentPlacementProfile",
      resourceId: updated.id,
      newData: { studentId: input.studentProfileId },
    });

    return updated;
  }

  static async applyForJobDrive(
    studentUserId: string,
    input: ApplyJobDriveInput
  ) {
    const student = await db.studentProfile.findUnique({
      where: { id: input.studentProfileId },
    });

    if (!student || student.userId !== studentUserId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot apply on behalf of another student.",
      });
    }

    const existing = await db.placementApplication.findUnique({
      where: {
        jobDriveId_studentId: {
          jobDriveId: input.jobDriveId,
          studentId: input.studentProfileId,
        },
      },
    });

    if (existing) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You have already applied for this job drive.",
      });
    }

    const eligibility = await JobDriveService.evaluateStudentEligibility(
      input.studentProfileId,
      input.jobDriveId
    );

    if (!eligibility.isEligible) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Ineligible to apply: ${eligibility.reasons.join(" | ")}`,
      });
    }

    const application = await db.placementApplication.create({
      data: {
        jobDriveId: input.jobDriveId,
        studentId: input.studentProfileId,
        coverNote: input.coverNote?.trim(),
        status: PlacementApplicationStatus.APPLIED,
      },
      include: {
        jobDrive: { include: { company: true } },
      },
    });

    await AuditService.log({
      actorId: studentUserId,
      action: "PLACEMENT_APPLICATION_SUBMITTED",
      resourceType: "PlacementApplication",
      resourceId: application.id,
      newData: { jobDriveId: input.jobDriveId, studentId: input.studentProfileId },
    });

    return application;
  }

  static async listStudentApplications(studentProfileId: string) {
    return db.placementApplication.findMany({
      where: { studentId: studentProfileId },
      include: {
        jobDrive: { include: { company: true, targetCourse: { select: { id: true, title: true, slug: true } } } },
        rounds: { orderBy: { roundNumber: "asc" } },
      },
      orderBy: { appliedAt: "desc" },
    });
  }

  static async listDriveApplications(
    user: AuthenticatedUser,
    jobDriveId: string,
    status?: PlacementApplicationStatus
  ) {
    this.checkCanManage(user);

    return db.placementApplication.findMany({
      where: { jobDriveId, ...(status ? { status } : {}) },
      include: {
        student: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            placementProfile: true,
          },
        },
        rounds: { orderBy: { roundNumber: "asc" } },
      },
      orderBy: { appliedAt: "desc" },
    });
  }



  static async updateApplicationStatus(
    user: AuthenticatedUser,
    input: UpdateApplicationStatusInput
  ) {
    this.checkCanManage(user);

    const app = await db.placementApplication.findUnique({
      where: { id: input.applicationId },
      include: { jobDrive: { include: { company: true } } },
    });

    if (!app) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
    }

    const updated = await db.placementApplication.update({
      where: { id: input.applicationId },
      data: {
        status: input.status,
        ...(input.offeredPackage !== undefined ? { offeredPackage: input.offeredPackage.trim() } : {}),
        ...(input.rejectionReason !== undefined ? { rejectionReason: input.rejectionReason.trim() } : {}),
      },
    });

    // If status is PLACED, update student's placement profile
    if (input.status === PlacementApplicationStatus.PLACED) {
      await db.studentPlacementProfile.upsert({
        where: { studentId: app.studentId },
        create: {
          studentId: app.studentId,
          isPlaced: true,
          placedCompany: app.jobDrive.company.name,
          placedPackage: input.offeredPackage?.trim() || app.jobDrive.salaryPackage,
        },
        update: {
          isPlaced: true,
          placedCompany: app.jobDrive.company.name,
          placedPackage: input.offeredPackage?.trim() || app.jobDrive.salaryPackage,
        },
      });
    }

    await AuditService.log({
      actorId: user.id,
      action: "PLACEMENT_APPLICATION_STATUS_UPDATED",
      resourceType: "PlacementApplication",
      resourceId: updated.id,
      newData: { status: updated.status, studentId: app.studentId },
    });

    return updated;
  }

  static async scheduleInterviewRound(
    user: AuthenticatedUser,
    input: ScheduleInterviewRoundInput
  ) {
    this.checkCanManage(user);

    const app = await db.placementApplication.findUnique({
      where: { id: input.applicationId },
    });

    if (!app) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
    }

    const round = await db.interviewRound.create({
      data: {
        applicationId: input.applicationId,
        roundNumber: input.roundNumber,
        roundType: input.roundType,
        scheduledAt: input.scheduledAt,
        meetingLink: input.meetingLink?.trim(),
        feedback: input.feedback?.trim(),
        passed: input.passed,
      },
    });

    if (app.status === PlacementApplicationStatus.APPLIED || app.status === PlacementApplicationStatus.SHORTLISTED) {
      await db.placementApplication.update({
        where: { id: input.applicationId },
        data: { status: PlacementApplicationStatus.INTERVIEW_SCHEDULED },
      });
    }

    await AuditService.log({
      actorId: user.id,
      action: "PLACEMENT_INTERVIEW_SCHEDULED",
      resourceType: "InterviewRound",
      resourceId: round.id,
      newData: { applicationId: input.applicationId, roundType: input.roundType },
    });

    return round;
  }

  static async recordInterviewFeedback(
    user: AuthenticatedUser,
    roundId: string,
    feedback: string,
    passed: boolean
  ) {
    this.checkCanManage(user);

    const round = await db.interviewRound.update({
      where: { id: roundId },
      data: { feedback: feedback.trim(), passed },
    });

    await AuditService.log({
      actorId: user.id,
      action: "PLACEMENT_INTERVIEW_FEEDBACK_RECORDED",
      resourceType: "InterviewRound",
      resourceId: round.id,
      newData: { passed },
    });

    return round;
  }
}

