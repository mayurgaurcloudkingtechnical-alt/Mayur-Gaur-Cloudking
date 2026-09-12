import { db } from "@/server/db/client";
import { AuthenticatedUser, hasPermission } from "@/server/auth/rbac";
import { AuditService } from "@/server/services/audit.service";
import { TRPCError } from "@trpc/server";
import { ApplicationStage, LeadStatus, UserRoleCode, EnrollmentStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export class CrmConversionService {
  /**
   * Explicitly converts an APPROVED application into an active student record.
   * Generates StudentProfile, links enrollment, updates lead status to ADMITTED,
   * and prevents premature student access.
   */
  static async convertApplicationToStudent(user: AuthenticatedUser, applicationId: string) {
    const canConvert =
      hasPermission(user.permissions, "admissions:create") ||
      hasPermission(user.permissions, "admissions:approve_discount");

    if (!canConvert) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to convert applications to students.",
      });
    }

    const app = await db.admissionApplication.findUnique({
      where: { id: applicationId },
      include: { lead: true },
    });

    if (!app) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Application with ID '${applicationId}' not found.`,
      });
    }

    if (app.stage !== ApplicationStage.APPROVED) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot convert application with stage '${app.stage}'. Only APPROVED applications can be converted.`,
      });
    }

    if (app.convertedStudentProfileId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This application has already been converted to a student profile.",
      });
    }

    // Process conversion in an atomic database transaction
    return await db.$transaction(async (tx) => {
      let targetUser = await tx.user.findUnique({
        where: { email: app.applicantEmail },
      });

      if (!targetUser) {
        const tempPassword = randomBytes(16).toString("hex");
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const nameParts = app.applicantName.trim().split(" ");
        const firstName = nameParts[0] || "Student";
        const lastName = nameParts.slice(1).join(" ") || "Learner";

        targetUser = await tx.user.create({
          data: {
            email: app.applicantEmail,
            phone: app.applicantPhone,
            passwordHash,
            firstName,
            lastName,
            roleCode: UserRoleCode.STUDENT,
          },
        });
      }

      let studentProfile = await tx.studentProfile.findUnique({
        where: { userId: targetUser.id },
      });

      if (!studentProfile) {
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        const studentCode = `SLG-${year}-${rand}`;

        studentProfile = await tx.studentProfile.create({
          data: {
            userId: targetUser.id,
            studentId: studentCode,
            dateOfBirth: app.dateOfBirth,
            gender: app.gender,
            address: app.address,
            city: app.city,
            state: app.state,
            pincode: app.pincode,
            highestDegree: app.highestQualification,
          },
        });
      }

      let enrollment = await tx.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: studentProfile.id,
            courseId: app.courseId,
          },
        },
      });

      if (!enrollment) {
        enrollment = await tx.enrollment.create({
          data: {
            studentId: studentProfile.id,
            courseId: app.courseId,
            batchId: app.batchId || null,
            status: EnrollmentStatus.ACTIVE,
          },
        });
      }

      const updatedApp = await tx.admissionApplication.update({
        where: { id: app.id },
        data: {
          stage: ApplicationStage.CONVERTED,
          convertedStudentProfileId: studentProfile.id,
        },
      });

      await tx.lead.update({
        where: { id: app.leadId },
        data: { status: LeadStatus.ADMITTED },
      });

      await AuditService.log({
        actorId: user.id,
        action: "ADMISSION_CONVERTED_TO_STUDENT",
        resourceType: "AdmissionApplication",
        resourceId: app.id,
        newData: {
          studentProfileId: studentProfile.id,
          studentCode: studentProfile.studentId,
          enrollmentId: enrollment.id,
        },
      });

      return {
        application: updatedApp,
        studentProfile,
        enrollment,
      };
    });
  }
}
