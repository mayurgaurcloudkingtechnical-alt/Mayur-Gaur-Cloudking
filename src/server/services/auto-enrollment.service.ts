import { Prisma, UserRoleCode, EnrollmentStatus, FeePaymentStatus, InstallmentStatus, ApplicationStage, LeadStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export interface ProvisionResult {
  studentProfileId: string;
  enrollmentId: string;
  feeStructureId: string;
}

export class AutoEnrollmentService {
  /**
   * Automatically provisions user account, student profile, active enrollment,
   * fee structure, and updates admission application in an existing transaction.
   */
  static async provisionFromAdmission(
    tx: Prisma.TransactionClient,
    app: {
      id: string;
      leadId: string;
      courseId: string;
      batchId: string | null;
      applicantName: string;
      applicantEmail: string;
      applicantPhone: string;
      dateOfBirth: Date | null;
      gender: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      pincode: string | null;
      highestQualification: string | null;
      course: { id: string; title: string; baseFee: number };
    },
    paidAmount: number,
    now: Date = new Date()
  ): Promise<ProvisionResult> {
    // 1. User account
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

    // 2. Student profile
    let studentProfile = await tx.studentProfile.findUnique({
      where: { userId: targetUser.id },
    });

    if (!studentProfile) {
      const year = now.getFullYear();
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

    // 3. Active Enrollment
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
    } else if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      enrollment = await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { status: EnrollmentStatus.ACTIVE },
      });
    }

    // 4. FeeStructure & Installment
    let feeStructure = await tx.feeStructure.findUnique({
      where: { enrollmentId: enrollment.id },
    });

    if (!feeStructure) {
      feeStructure = await tx.feeStructure.create({
        data: {
          studentId: studentProfile.id,
          enrollmentId: enrollment.id,
          courseId: app.courseId,
          batchId: app.batchId || null,
          totalCourseFee: app.course.baseFee,
          netPayableAmount: paidAmount,
          paidAmount: paidAmount,
          pendingAmount: 0,
          paymentStatus: FeePaymentStatus.PAID,
          remarks: "Online admission full payment",
        },
      });

      await tx.feeInstallment.create({
        data: {
          feeStructureId: feeStructure.id,
          installmentNumber: 1,
          amount: paidAmount,
          paidAmount: paidAmount,
          dueDate: now,
          status: InstallmentStatus.PAID,
          paidAt: now,
          notes: "Full payment via Razorpay",
        },
      });
    }

    // 5. Update Admission & Lead
    await tx.admissionApplication.update({
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

    return {
      studentProfileId: studentProfile.id,
      enrollmentId: enrollment.id,
      feeStructureId: feeStructure.id,
    };
  }
}
